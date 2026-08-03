---
name: india-sector-rotation
description: Rank NSE sector indices by relative strength against NIFTY 50 to find which sectors are leading or lagging. Reads live data through the tradingview MCP — no API key or paid data needed. Use when the user asks which sectors are strong, where the money is rotating, sector leadership, relative strength on NSE, or which sector to focus on today.
---

# India Sector Rotation

## Overview

Ranks NSE sector indices by relative strength versus NIFTY 50, using the
tradingview MCP to read live data. This replaces the US-equities sector tooling
(which depends on FMP/FINVIZ subscriptions) with a path that needs no API key —
it reads the same chart you already have open.

## Requirements

- TradingView Desktop running with CDP. Check with `tv_health_check`; if it
  fails, run `tv_launch` and retry. If it still fails, stop and report — this
  skill has no offline fallback.
- **Logged in to TradingView.** A free account is enough; no paid plan needed.

## ⚠️ Stale-data guard — do this before trusting any reading

If the user is logged out, a signup modal blocks the chart and symbol switches
**fail silently**. Observed on 2026-08-03: `chart_set_symbol` returned
`success: true`, `chart_get_state` reported the *requested* symbol, and
`quote_get` returned the **previous symbol's prices labelled as the new one**.
Nothing in any tool result said the switch had failed.

A sector table built on this is confidently wrong. Guard every switch:

1. `chart_set_symbol` returns `chart_ready: false` → wait and re-read. Never
   read data on the same turn as a switch that reported `chart_ready: false`.
2. After switching, confirm the data actually changed: if two different symbols
   return **identical** OHLCV (same open/high/low/close/volume), the switch did
   not happen. Byte-identical summaries across symbols is the signature.
3. Sanity-check magnitude. NIFTY trades in the tens of thousands, BANKNIFTY
   higher, India VIX typically 10-30. A sector index returning a 3-digit price
   is a stale read, not a real quote.
4. If a switch fails, take a `capture_screenshot` and look. A blocking modal or
   a "Join for free" prompt means the user is logged out — stop and tell them.
   Do not work around it and do not report partial results as if complete.

**If in doubt, stop and say the data is unverified.** Reporting a stale number
as live is worse than reporting nothing.

## Method

1. Read `references/nse_sector_indices.md` for the symbol list.

2. Symbols in that file are already verified — use them directly. Only fall back
   to `symbol_search` if one returns no data, and save any correction back to
   the reference file.

3. Establish the benchmark. `chart_set_symbol` to `NSE:NIFTY`, then
   `data_get_ohlcv` with `summary: true, count: 60`.

4. For each sector index: `chart_set_symbol`, then `data_get_ohlcv` with
   `summary: true, count: 60`. Use the daily timeframe unless the user asks
   otherwise.

5. Compute returns over 5, 20, and 60 bars for each sector **and** for NIFTY.
   Relative strength = sector return − NIFTY return, per window.

6. Restore the user's original symbol and timeframe when finished. Capture them
   with `chart_get_state` *before* step 3 so you can put the chart back.

## Output Format

```
# NSE Sector Rotation — <date>, <timeframe>
Benchmark NIFTY 50:  5d ___%   20d ___%   60d ___%

| Sector | 5d RS | 20d RS | 60d RS | Trend |
|--------|-------|--------|--------|-------|
sorted by 20d RS, strongest first

Leading:   <sectors positive on both 5d and 20d RS>
Lagging:   <sectors negative on both>
Rotating in:  <negative 60d RS but positive 5d RS — early turn>
Rotating out: <positive 60d RS but negative 5d RS — losing leadership>
```

`Trend` is one of: `improving` (5d RS > 20d RS), `deteriorating` (5d RS < 20d RS),
`stable`.

## Rules

- Report relative strength as numbers. Never describe a sector as "strong"
  without the figure that supports it.
- A sector rising while NIFTY rises more is **underperforming** — say so, even
  though its absolute return is positive. This is the whole point of RS and the
  easiest thing to get backwards.
- "Rotating in" on 5d alone is a weak signal on its own. Label it as early and
  unconfirmed rather than actionable.
- If a symbol fails to resolve or returns no data, list it as unavailable. Do
  not silently drop it — a missing sector distorts the ranking.
- Restore the chart to where the user left it.
- This describes what has already happened. It does not predict continuation.
