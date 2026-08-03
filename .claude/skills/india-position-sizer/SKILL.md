---
name: india-position-sizer
description: Position sizing for Indian equities and F&O — cash, futures, and index options on NSE/BSE. Handles lot-size rounding, rupee risk per trade, and the full Indian cost stack (STT, brokerage, exchange charges, stamp duty, GST). Use when the user asks how many shares or lots to buy, risk per trade, what a trade will cost after charges, or breakeven after costs on an NSE/BSE trade.
---

# India Position Sizer

## Overview

Calculates position size for Indian markets. Differs from US-oriented sizers in
three ways that materially change the answer:

1. **F&O trades in lots, not shares.** Size rounds to whole lots, so the risk
   per trade is quantised — you often cannot hit a target risk exactly.
2. **The cost stack is heavier and asymmetric.** STT on equity delivery applies
   on both sides; on intraday and options it applies on the sell side only.
   This changes breakeven meaningfully on short holds.
3. **Options are sized by premium risk, not underlying distance**, unless the
   user is explicitly stopping out on the underlying's price.

## When to Use

- "How many shares of RELIANCE should I buy?"
- "How many lots of NIFTY can I take with ₹X risk?"
- "What's my breakeven after charges?"
- "Is this trade worth it after costs?"

## Required Inputs

Ask for anything missing — do not assume:

- **Capital** and **risk per trade** (% or absolute ₹). If `.claude/rules.md`
  defines a max risk per trade, use that and say so.
- **Instrument and segment**: cash delivery, cash intraday, futures, or options
- **Entry** and **stop** price
- For F&O: **lot size** (see `references/india_costs.md` — always confirm the
  current lot size with the user, these are revised by the exchange)

## Method

### Cash (delivery or intraday)

```
risk_per_share = entry - stop
shares         = floor(rupee_risk / risk_per_share)
position_value = shares * entry
```

Then apply the cost model and report breakeven.

### Futures

```
risk_per_lot = (entry - stop) * lot_size
lots         = floor(rupee_risk / risk_per_lot)
```

If `lots` rounds to 0, say so plainly: the stop is too wide for the risk budget
at this lot size. Give the rupee risk of 1 lot so the user can decide whether to
widen the budget or skip the trade. Do not silently suggest a tighter stop.

### Options

Default to **premium risk**: the risk is what is paid, unless a stop is defined.

```
risk_per_lot = premium_paid * lot_size          (if no stop)
risk_per_lot = (entry_prem - stop_prem) * lot_size   (if stop on premium)
lots         = floor(rupee_risk / risk_per_lot)
```

If the user gives a stop on the *underlying* rather than the premium, state that
converting it to a premium stop requires the option's delta, and ask for delta or
an approximate premium at that underlying level. Do not guess the conversion.

## Cost Model

Read `references/india_costs.md`. Apply the rates for the correct segment and
report:

- Total charges (itemised: STT, brokerage, exchange txn, stamp duty, SEBI, GST)
- **Breakeven move** — the price move needed just to cover costs
- Costs as a % of the rupee risk. Flag it if costs exceed ~10% of risk; that is
  a signal the trade is too small or the stop too tight to be worth taking.

## Output Format

```
Instrument:      <symbol>  (<segment>)
Entry / Stop:    ₹___ / ₹___     (risk ₹___ per share|lot)
Size:            ___ shares | ___ lots (lot size ___)
Position value:  ₹___
Risk:            ₹___  (___% of capital)   [target was ₹___]
Charges:         ₹___  (breakeven ₹___, a ___% move)
Costs / risk:    ___%

<any warning: lots rounded to 0, risk overshoot from lot quantisation,
 costs disproportionate to risk, or a rules.md limit breached>
```

## Rules

- Round **down** to whole lots or shares, never up.
- Lot quantisation means realised risk rarely equals target risk. Always report
  both, and flag when the rounded position overshoots the target risk budget.
- Cross-check against `.claude/rules.md` — max risk per trade, daily loss limit,
  and max trades per day. Say explicitly if the trade breaches one.
- The rates in `references/india_costs.md` are user-maintained and go stale when
  the exchange or the Finance Act revises them. Treat the output as an estimate
  and say so.
- This is a calculation, not a recommendation to trade.
