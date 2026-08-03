---
description: Pre-session brief — scan the watchlist, read levels and indicators, produce a bias table graded against my rules
---

Produce my pre-session brief.

## Steps

1. Read `.claude/rules.md`. If it still contains `TODO` placeholders in the
   Instruments or Setups sections, stop and tell me which ones — the brief is
   not meaningful without them.

2. Verify the connection with `tv_health_check`. If it fails, run `tv_launch`,
   wait, and check again. If it still fails, stop and report the error.

3. For **each symbol** in the watchlist from `rules.md` (if `$ARGUMENTS` names
   symbols, use those instead):
   - `chart_set_symbol`, then `chart_set_timeframe` to the primary timeframe
   - `quote_get` — current price
   - `data_get_ohlcv` with `summary: true`, `count: 50` — price action summary
   - `data_get_study_values` — all visible indicator readings
   - For each custom Pine indicator named in rules.md: `data_get_pine_lines`
     and `data_get_pine_labels` with `study_filter` set to that name
   - `data_get_pine_tables` with `study_filter` only if rules.md mentions a
     stats/analytics table

4. Then switch to each context timeframe once per symbol and re-read
   `data_get_study_values` for higher-timeframe context.

## Output — use this exact format every day

Consistency matters more than detail here. I compare these day over day, so do
not reformat, reorder, or add sections.

```
# Pre-Market Brief — <date>

## Bias Table
| Symbol | Price | HTF bias | Key level above | Key level below | Setup armed? |
|--------|-------|----------|-----------------|-----------------|--------------|

## Levels That Matter
<per symbol: the 2-4 levels closest to price, with their source indicator>

## Setups Armed Today
<for each setup in rules.md that has its context condition currently met:
 name it, state the trigger price, state the invalidation price.
 If no setup's context is met, say "None armed" — do not manufacture one.>

## No-Trade Flags
<any no-trade condition from rules.md that is currently active>

## What Would Change My Mind
<one line per symbol>
```

## Rules for you

- Grade everything against `.claude/rules.md`. Do not offer generic technical
  analysis or setups that are not in that file.
- If no setup qualifies, say so plainly. A blank day is a valid output.
- State levels as numbers, not adjectives.
- Do not predict direction. Describe conditions and what they would trigger.
- This is analysis, not financial advice, and not a trade instruction.
