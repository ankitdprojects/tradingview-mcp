---
name: india-market-breadth
description: Assess Indian market health from index participation, market-cap tiers, and India VIX using the tradingview MCP. Produces a 0-100 breadth score with the components shown. No API key needed. Use when the user asks about Indian market breadth, whether the rally is broad-based, NIFTY market health, risk-on or risk-off, or India VIX levels.
---

# India Market Breadth

## Overview

Scores the health of the Indian market 0-100, reading live data through the
tradingview MCP.

**Read this limitation first.** True advance-decline breadth — the count of
advancing vs declining stocks — is *not* available through the tradingview MCP.
The US `market-breadth-analyzer` skill gets it from public CSVs that have no
Indian equivalent here. This skill therefore uses a **participation proxy**:
whether market-cap tiers and sectors confirm the headline index.

That proxy is weaker than a true A/D line. It catches the common case — a NIFTY
rally carried by a handful of heavyweights while midcaps and smallcaps lag — but
it will not detect narrow leadership *within* a tier. State this limitation in
the output every time. Do not present the score as a true breadth reading.

## Requirements

- TradingView Desktop running with CDP (`tv_health_check`, else `tv_launch`).
- Symbol list in `../india-sector-rotation/references/nse_sector_indices.md`.

## Method

Capture the user's current symbol/timeframe with `chart_get_state` first, and
restore it at the end.

For each index below, `chart_set_symbol` then `data_get_ohlcv`
(`summary: true, count: 60`, daily).

### Components (100 points total)

| # | Component | Points | Measures |
|---|---|---|---|
| 1 | Tier participation | 30 | Midcap + Smallcap returns vs NIFTY over 20d |
| 2 | Sector participation | 25 | % of sector indices with positive 20d RS |
| 3 | Index trend | 20 | NIFTY vs its own 20d and 60d trend |
| 4 | Volatility regime | 15 | India VIX level and 20d direction |
| 5 | Leadership quality | 10 | Are leading sectors cyclical or defensive? |

Component 5 is interpretive: leadership from Auto/Metal/Realty/Bank is risk-on;
from FMCG/Pharma/Healthcare it is defensive. Defensive leadership in a rising
market is a caution flag, not a bullish one.

## Output Format

```
# India Market Breadth — <date>
Score: __/100   (<healthy 70+ | mixed 40-69 | weak <40>)

| Component | Score | Reading |
|-----------|-------|---------|
| Tier participation  | __/30 | midcap __% vs nifty __% (20d) |
| Sector participation| __/25 | __ of __ sectors positive RS |
| Index trend         | __/20 | |
| Volatility regime   | __/15 | India VIX __ , __ over 20d |
| Leadership quality  | __/10 | __-led |

Divergences: <e.g. NIFTY at highs while smallcaps negative 20d — narrow rally>

Limitation: participation proxy, not a true advance-decline line.
Unavailable symbols: <list, or "none">
```

## Rules

- Always print the per-component breakdown. A bare composite score hides which
  component moved it and is not auditable.
- **Divergences matter more than the score.** NIFTY making highs while midcaps
  and smallcaps lag is the single most useful output here — lead with it when
  present.
- India VIX is inverted: low VIX = calmer regime = more points. But very low VIX
  is complacency, not safety. Do not award full points at extreme lows; note it.
- If more than 3 symbols fail to resolve, the score is unreliable. Say so and
  report components rather than a composite.
- Restore the user's chart when done.
- This measures current conditions. It is not a forecast or a trade signal.
