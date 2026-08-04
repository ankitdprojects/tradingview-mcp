---
name: india-commodity
description: MCX and NSE commodity trading on TradingView — correct symbol syntax, contract months, expiry, lot sizes, session hours, and lot-based risk. Use when the user asks about MCX, commodities, crude oil, gold, silver, natural gas, copper, zinc, or aluminium, or when a commodity symbol fails to load or a commodity position needs sizing.
---

# India Commodity (MCX)

## Overview

The `india-*` equity skills do not cover MCX. Commodities differ in symbol
syntax, session hours, contract lifecycle, cost structure, and sizing. Every
item below was verified against live TradingView on 2026-08-03/04.

## ⚠️ Symbol syntax — the trap that wastes the most time

**Bare root symbols do not resolve.** `MCX:CRUDEOIL` and `MCX:CRUDEOILM` both
return *"This symbol doesn't exist"* on the chart, even though `symbol_search`
finds them — search hits a REST API, the chart uses a different feed.

Two working forms:

| Form | Example | Use for |
|---|---|---|
| Continuous | `MCX:CRUDEOILM1!` | charting, indicators, backtesting |
| Dated | `MCX:CRUDEOILMQ2026` | **placing orders**, paper trading |

`1!` is **synthetic and continuous** (`typespecs: ["continuous","synthetic"]`).
It splices successive front months into unbroken history. You cannot order it,
and Paper Trading will refuse it.

### Month codes

`MCX:<ROOT><MONTH><YEAR>` — F Jan, G Feb, H Mar, J Apr, K May, M Jun,
N Jul, **Q Aug**, U Sep, V Oct, X Nov, Z Dec.

Verified: `MCX:GOLDPETALQ2026` = "Gold Petal Futures (Aug 2026)",
`MCX:CRUDEOILMQ2026` = "Crude Oil Mini Futures (Aug 2026)".

To find the active month: compare volume across `Q`/`U` — the front month
carries far more. Observed 2026-08-03: Aug 4,471 vs Sep 366.

## ⚠️ Lot size does not follow the symbol

The indicator's lot size is a manual input. **It stays at the previous value
when you switch symbols**, silently scaling every risk figure. This produced a
10x error in live use.

Always reset it. Verify the current size in the Groww order window — exchanges
revise them.

| Contract | Symbol root | Lot | ₹1 move | Fits ₹1L at 1% risk? |
|---|---|---|---|---|
| Crude Oil | `CRUDEOIL` | 100 bbl | ₹100 | ✗ |
| **Crude Oil Mini** | `CRUDEOILM` | 10 bbl | ₹10 | ✓ |
| Natural Gas | `NATURALGAS` | 1250 mmBtu | ₹1,250 | ✗ |
| Natural Gas Mini | `NATURALGASMINI` | 250 mmBtu | ₹250 | ⚠ tight |
| Gold | `GOLD` | 1 kg | ₹100 | ✗ |
| Gold Mini | `GOLDM` | 100 g | ₹10 | ✗ (daily ATR ≈ ₹28k) |
| **Gold Petal** | `GOLDPETAL` | 1 g | ₹1 | ✓ |
| Silver | `SILVER` | 30 kg | ₹30 | ✗ |
| **Silver Micro** | `SILVERMIC` | 1 kg | ₹1 | ⚠ 1 lot ≈ ₹1,900 |
| Copper | `COPPER` | 2500 kg | ₹2,500 | ✗ |

Gold is quoted **per 10 grams**, so a 1 kg lot is 100 units of quote → ₹100 per
₹1 move, not ₹1,000. Silver is quoted per kg.

## Session

MCX runs **09:00 to 23:30 IST** (23:55 during US DST) — far longer than NSE
equity. Two consequences:

- Liquidity collapses late. Observed relative volume of 0.05x-0.11x after
  ~20:00 IST. Thin books mean slippage that can exceed the intended risk.
- Overnight gap risk is real: crude gapped 324 points (₹3,240/lot) between
  sessions. Intraday-only avoids it entirely.

## Costs — INCOMPLETE

`india-position-sizer/references/india_costs.md` has **no commodity rates**.
Commodities pay **CTT**, not STT, and have no DP charge. Until filled, say
explicitly that commodity cost estimates are missing rather than reusing
equity numbers.

## Expiry

MCX contracts expire **well before** the month they are named for — often
around the 19th-20th of the *preceding* month. Near expiry, liquidity migrates
to the next month and spreads widen.

Before any commodity entry: confirm the expiry date in Groww, and check that
the contract you are charting is the one still carrying volume. The forward
curve is not flat — Sep crude traded 180 points below Aug — so rolling shifts
all your levels.

## What does NOT apply to commodities

- `india-sector-rotation` and `india-market-breadth` are **NSE equity only**.
  There is no sector RS filter for commodities; drop that context condition.
- The `min position ₹20,000` rule exists for the equity DP charge. It does not
  apply to MCX.
- MCX **options are not available in TradingView** — no chart, so the console
  cannot run on them.

## Rules for you

- Chart on `1!`, order on the dated contract. Say which is which.
- Reset lot size on every symbol change, and state the value used.
- Check relative volume before recommending anything. Below ~0.3x, say the
  book is too thin regardless of how good the setup looks.
- Flag commodity cost estimates as incomplete until `india_costs.md` is filled.
