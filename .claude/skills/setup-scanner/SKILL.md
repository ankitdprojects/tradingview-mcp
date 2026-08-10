---
name: setup-scanner
description: Scan a watchlist or the MCX board for symbols where the rules.md setup is currently ARMED or TRIGGERED, ranked by trade quality. Use when the user asks what to trade now, which symbols have a setup, what is armed, what is hot, or asks to scan or screen for opportunities.
---

# Setup Scanner

## Overview

Reads the `Screener` state across many symbols and reports which
have a live setup. Replaces flipping symbols by hand.

## Requirements

- TradingView with CDP, logged in
- `Screener` on the chart
- Apply the stale-data guard from `india-sector-rotation/SKILL.md` — this skill
  switches symbols repeatedly and is therefore highly exposed to it

## Method

1. Read `.claude/rules.md` for the **active mode**, its universe, timeframe and
   preset. Capture the user's current symbol/timeframe to restore afterwards.

2. Set the timeframe for that mode. Confirm the console preset matches the
   mode's setup — if the table's EMA labels disagree with rules.md, stop and
   say so rather than scanning with the wrong parameters.

3. For each symbol: `chart_set_symbol`, then `data_get_pine_tables` with
   `study_filter: "Screener"`.
   - **Commodities:** reset the lot size for each symbol before reading the
     sizing rows (see `india-commodity`). Otherwise every risk figure is wrong.
   - Verify the data actually changed between symbols. Identical OHLC across
     two symbols means the switch failed.

4. Restore the original symbol and timeframe.

## Ranking

Rank only symbols showing `TRIGGER` or `ARMED`. Within those, order by quality:

| Factor | Good | Poor |
|---|---|---|
| State | TRIGGER | ARMED (not yet a trade) |
| ADX | ≥ 25 trend | < 25 chop |
| Relative volume | ≥ 1.0x | < 0.3x — book too thin |
| **Turnover** | **≥ ₹5 crore** | **< ₹5 crore — cannot fill cleanly** |
| Stop distance | 1-2 ATR | < 1 ATR (noise) or > 3 ATR (too wide) |
| Risk fit | ≤ per-trade limit | 1 lot exceeds the limit |
| Room to target | 2R clear of the next S/R | firing straight into S/R |
| P/E | context only — see below | — |

### Reading the three the user asked for

**Setup state** — the only field that decides whether there is a trade at all.
TRIGGER is actionable; ARMED is not.

**Turnover (₹ crore), not share count.** The console reports
`volume x price` as turnover plus its 20-bar average. Share count alone is
misleading: 10,000 shares of a ₹100 stock is ₹10 lakh, of a ₹3,000 stock is
₹3 crore. Turnover is what determines whether a position can be entered and
exited without moving the price. Report current AND average — a stock at 3x
its usual turnover is behaving differently today.

**P/E is context, never a filter.** State it, do not rank on it. Reasons:
- It is a **valuation** measure on a fundamental timescale. It says nothing
  about whether a 30m pullback will work, and it is meaningless over a 1-3 day
  hold.
- It reads `n/a` for futures, commodities and indices — correct, not a fault.
- It is `n/a` for loss-making companies (negative EPS), which is not the same
  as "cheap".
- A low P/E is often low for a reason.

If the user wants it as a filter, say plainly that it belongs to a different
style of trading (value investing over months to years) than the setup being
scanned, then apply it if they still want it.

## Output

```
# Setup Scan — <mode> · <timeframe> · <date>
Scanned: __ symbols   Armed: __   Triggered: __

| Symbol | State | ADX | RelVol | Turnover Cr | P/E | Stop | Risk | Size |

Triggered now:  <symbol — entry, stop, target, risk>
Armed, waiting: <symbol — what still has to happen>
Rejected:       <symbol — the specific reason>
Unavailable:    <symbols that failed to load>
```

For each triggered symbol give entry, stop, 2R target and rupee risk, so it can
be acted on without a second lookup.

## Rules for you

- **Report ARMED and TRIGGER as different things.** Armed is not a trade. Never
  present an armed setup as actionable.
- **Rank, do not recommend.** Present quality factors and let the user choose.
  Do not say "buy this".
- **Reject loudly.** If relative volume is below ~0.3x or ADX below 25, say the
  setup fails on that factor and why it matters — thin books slip, chop kills
  continuation trades.
- **An empty scan is a valid result.** If nothing is armed, say so. Do not
  loosen criteria to produce a list.
- **Never silently drop a symbol.** Anything that failed to load goes in the
  Unavailable row — a missing symbol looks identical to "no setup" otherwise.
- **Check the daily loss limit and trade count first.** If `journal/trades.csv`
  shows the limit already hit today, say so up front — the scan is moot.
- Describes current conditions, not predictions. Not financial advice.
