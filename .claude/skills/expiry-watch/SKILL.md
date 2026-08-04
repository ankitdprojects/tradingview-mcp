---
name: expiry-watch
description: Check contract expiry, rollover timing, and results-date risk before entering or while holding a position. Use when the user asks about expiry, rollover, which contract month to trade, whether a contract is about to expire, or before any F&O or commodity entry.
---

# Expiry Watch

## Why this exists

`.claude/rules.md` blocks new entries on a stock's results date and on index
expiry day — because a gap ignores your stop. Nothing currently checks those
dates automatically. This skill does.

## When to run

- Before any F&O or commodity entry
- Before holding an equity position through a results date
- When a contract's volume looks unusually thin (often means it is expiring)

## Checks

### 1. Contract month is still the active one

For MCX and F&O, compare volume across adjacent months (see `india-commodity`
for the month-code syntax):

```
MCX:CRUDEOILMQ2026   (Aug)  volume 4,471   ← active
MCX:CRUDEOILMU2026   (Sep)  volume   366
```

If the month being traded is no longer carrying most of the volume, say so —
liquidity has moved and spreads will be wider than the chart suggests.

### 2. Days to expiry

MCX contracts expire **well before** their named month — often the 19th-20th of
the *preceding* month. Do not infer the date from the contract name; confirm it
in the Groww order window or an exchange circular.

| Days to expiry | Guidance |
|---|---|
| > 10 | fine |
| 5-10 | plan the roll; avoid new multi-day holds |
| < 5 | **no new positions** — spreads widen, liquidity drains |
| < 2 | exit or roll now |

### 3. Physical settlement

Stock F&O held to expiry **settles physically** in India — you take or give
delivery, with delivery-equivalent charges and full contract value required.
Flag this loudly for any stock F&O position near expiry. Index F&O and MCX
mini/micro contracts are cash-settled and unaffected.

### 4. Results date (cash equity)

`rules.md` blocks entries on or immediately before a stock's results date. The
reason is arithmetic, not caution: with a stop at ₹480 and entry at ₹500, a gap
open at ₹455 is **−2.25R**, not −1R. The stop cannot protect through a gap.

There is no results-calendar feed in this MCP. Ask the user to confirm the date
from Groww or the exchange site, and say plainly that it was not verified
automatically.

### 5. The forward curve is not flat

Adjacent months trade at different prices — Sep crude was 180 points below Aug.
When you roll, **your support, resistance and stop levels do not transfer**.
Re-derive them on the new contract.

## Output

```
# Expiry Check — <symbol>
Contract:        <dated symbol> (<month year>)
Active month:    yes / NO — volume has moved to <symbol>
Days to expiry:  __   → <guidance>
Settlement:      cash / PHYSICAL
Next month:      <symbol> at <price> (<+/-> vs current)
Results date:    <date, or "not verified — confirm in Groww">

Verdict: safe to enter / roll first / do not enter
```

## Rules for you

- **Never guess an expiry date.** State it as unverified and ask, rather than
  producing a confident wrong date. A wrong expiry is worse than no answer.
- Give the verdict as one line, first — the detail is supporting evidence.
- If the user is already holding and expiry is close, lead with that.
- Physical settlement on stock F&O is the highest-consequence item here. Never
  soften it.
