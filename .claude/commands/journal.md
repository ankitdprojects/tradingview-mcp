---
description: Log a trade to journal/trades.csv — reads the live chart to fill in what it can
---

Log a trade. What I told you: `$ARGUMENTS`

## Steps

1. Read `.claude/rules.md` so you know my setup names and risk limits.

2. Read `journal/trades.csv` (create it with the header row below if missing).

3. Fill in what you can from the live chart rather than asking me:
   - `chart_get_state` — symbol and timeframe
   - `quote_get` — current price
   - `data_get_study_values` — indicator readings at the time of the trade

4. Ask me **only** for what you genuinely cannot determine: entry, exit, stop,
   size, and my emotional state at entry. Ask for all of them in one message,
   not one at a time.

5. Append one row. Never rewrite or reorder existing rows.

## CSV schema

```
date,time,mode,symbol,timeframe,setup,planned_entry,actual_entry,stop,target,exit,size,pnl,r_multiple,costs,rule_followed,emotion,notes
```

Field notes:
- `mode` — `INTRADAY` / `SWING` / `POSITIONAL`. Infer it from the chart
  timeframe and the stated hold, and confirm with me if ambiguous. **This
  field is what keeps the three systems separable in `/review` — never guess
  it silently.**
- `setup` — must be a setup name from `rules.md` **for that mode**, or the
  literal `IMPULSE`. Do not invent a setup name to make it look planned.
  A SWING setup logged under INTRADAY is a rule breach, not a naming detail.
- `costs` — estimated round-trip charges from `india_costs.md`. SWING and
  POSITIONAL are delivery (~₹126 on ₹25,000); INTRADAY is far cheaper
  (~₹55) since STT is sell-side only and there is no DP charge.
- `rule_followed` — `yes` / `no` / `partial`
- `emotion` — one word: calm, fomo, revenge, bored, anxious, confident
- `r_multiple` — (exit − actual_entry) / (actual_entry − stop), signed for
  direction. This is **gross**; `/review` nets out `costs` separately.

## After logging

1. Confirm the row you wrote, in full.
2. Check the trade against `rules.md` risk limits and no-trade conditions.
   If it violated one, say which — directly, without softening it. That is the
   entire point of the journal.
3. Report today's running count against my max-trades-per-day and daily loss limit.
