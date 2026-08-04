---
name: replay-backtest
description: Validate a trading setup against historical bars using TradingView Bar Replay, logging every trigger to the journal so /review can judge it. Use when the user asks to backtest, validate, or test a setup, wants to know if a strategy works before risking money, or asks how a PROVISIONAL setup in rules.md has actually performed.
---

# Replay Backtest

## Why this exists

Setups in `.claude/rules.md` are marked **PROVISIONAL** until 15 logged trades
prove otherwise. Waiting for live trades takes weeks — at 2 entries/day on a
filtered universe, 15 trades is 4-6 weeks away. Bar Replay collapses that to an
evening, using real historical bars rather than a simulated price model.

The output is rows in `journal/trades.csv` tagged `BACKTEST`, so `/review` reads
them with the same arithmetic it applies to live trades.

## Requirements

- TradingView Desktop with CDP (`tv_health_check`, else `tv_launch`)
- **Logged in.** Apply the stale-data guard from `india-sector-rotation/SKILL.md`
- `Swing Pullback Console` on the chart, preset matching the mode being tested

## Method

1. Read `.claude/rules.md`. Confirm with the user **which mode and setup** is
   being tested, and the exact preset (EMA lengths, swing-low lookback). Record
   these — a backtest of unstated parameters is worthless.

2. Set the symbol and timeframe for that mode.

3. `replay_start` with a date far enough back to yield ~20-30 triggers. Rule of
   thumb: 3 months of daily bars, or 2-3 weeks of 15m bars.

4. Step forward with `replay_step`. After each step, read the console via
   `data_get_pine_tables` with `study_filter: "Swing Pullback"`.

5. **On each `TRIGGER`**, record: date, direction, entry (the close), stop
   (`Stop / risk-lot`), risk per unit, and the 2R target. Then keep stepping
   until one of these resolves it:
   - price hits the stop → `-1R`
   - price hits the 2R target → `+2R`
   - the mode's time stop elapses → mark the actual R at exit

6. Append every resolved trade to `journal/trades.csv` with `mode` set to the
   tested mode and `setup` set to the rules.md name. Set `rule_followed = yes`
   (a backtest follows rules by construction) and `emotion = backtest`.

7. `replay_stop` when done.

## Output

```
# Backtest — <setup> · <mode> · <symbol> <timeframe>
Period: <start> to <end>   Bars stepped: __   Triggers: __

Long:  __ trades, __% win, avg __R
Short: __ trades, __% win, avg __R
Total: __ trades, __% win, avg __R, total __R

Breakeven win rate for this mode (from rules.md): __%
Verdict: clears / does not clear breakeven

Exits by reason:  target __ | stop __ | time stop __
```

Then state plainly whether the setup cleared its own breakeven, and by how much.

## Rules for you

- **Backtest exactly what rules.md says.** Do not improve the setup mid-run,
  skip a trigger that looks bad, or adjust the stop. The point is to measure
  the rule as written.
- **Log losers.** A backtest that only records winners is worse than none.
- **Report gross AND net.** Subtract the mode's round-trip cost per trade
  (`india_costs.md`). A setup that clears breakeven gross but not net is a
  losing setup.
- **State the sample size next to every percentage.** "60% win rate" from
  5 trades is noise. Below 20 triggers, say the result is indicative only.
- **Flag the time-stop count.** If most trades exit on the time stop rather
  than target or stop, the holding period is wrong, not the entry.
- **Never extrapolate to future returns.** Report what the rule did on this
  data, over this period, and stop there. Past results do not carry forward,
  and regime changes break setups that backtested well.

## Known limitations — state these in the output

- **Fills are assumed at the bar close.** Real entries slip, especially on the
  thin volume common outside peak session hours.
- **Gaps are not modelled kindly.** If price gaps through the stop, the loss is
  larger than 1R. Record the actual gap-adjusted R, not −1R.
- **Bar Replay hides intrabar sequence.** If a bar's range covers both the stop
  and the target, you cannot tell which came first. Count these as losses —
  the conservative assumption — and report how many there were.
- **Pivot S/R lags by `pvtLen` bars** and is drawn retroactively. Do not treat
  historical S/R placement as information that was available at the time.
