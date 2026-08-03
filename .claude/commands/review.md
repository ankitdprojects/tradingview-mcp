---
description: Analyse the trade journal for patterns — win rate by setup, by time of day, planned vs impulse
---

Review my trading journal. Period: `$ARGUMENTS` (default: last 30 days)

## Steps

1. Read `.claude/rules.md` and `journal/trades.csv`.
2. If there are fewer than 10 trades in the period, say so and note that the
   numbers are not yet meaningful — then report them anyway, clearly labelled
   as a small sample.
3. Compute the breakdowns below. Do the arithmetic on the actual rows; do not
   estimate. If a field is blank in the CSV, exclude that row from that
   particular breakdown and say how many you excluded.

## Output

```
# Journal Review — <period>  (<n> trades)

## Headline
Win rate: __%   Avg R: __   Total R: __   Largest loss: __R

## By Mode
| Mode | Trades | Win % | Avg R gross | Avg R NET | Total R net |
INTRADAY / SWING / POSITIONAL as separate rows. Never pool them — they are
three different systems with different costs and different breakeven rates.
Net R = gross R − (costs / risk_per_trade). Report both columns.

Breakeven win rate at a 2R target, from rules.md:
  INTRADAY ~35%   SWING ~37.7%   POSITIONAL ~37.7%
State for each mode whether its win rate clears its own breakeven.

## By Setup
| Setup | Mode | Trades | Win % | Avg R | Total R |
Include IMPULSE as its own row, split by mode.

## By Time of Day
| Hour bucket | Trades | Win % | Avg R |

## Planned vs Impulse
Named setups: __% win, __ avg R  (n=__)
IMPULSE:      __% win, __ avg R  (n=__)

## Rule Compliance
rule_followed = yes: __% win, __ avg R
rule_followed = no:  __% win, __ avg R
Most-broken rule: ____

## By Emotion
| Emotion | Trades | Win % | Avg R |

## What The Data Says
Three findings, each stated as a number, not an impression.

## Proposed Rule Changes
At most two. Each must cite the specific number that justifies it.
If the data does not support a change, say so and propose none.
```

## Rules for you

- Report what the numbers say, including when they contradict what I believe
  about my own trading. That is the value of this command.
- Do not soften a bad statistic or pad it with encouragement.
- Distinguish a real pattern from a small sample. Say which you are looking at.
- Do not propose rule changes based on fewer than 10 trades in that bucket.
- Past results here describe my behaviour, not future performance.
