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

## Method

1. Read `references/nse_sector_indices.md` for the symbol list.

2. **First run only**: confirm each symbol resolves, using `symbol_search`.
   TradingView's exact ticker strings for NSE indices vary by data subscription.
   Record any corrections back into the reference file so later runs skip this.

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
