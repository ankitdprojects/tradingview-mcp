# NSE Sector & Broad Market Indices — TradingView symbols

> ✅ **All symbols below were verified via `symbol_search` on 2026-08-03**
> against this machine's TradingView Desktop 3.3.0 data subscription.
> No verification step is needed on normal runs.
>
> Re-verify only if a symbol starts returning no data — TradingView ticker
> strings have changed historically, and availability varies by subscription.

## Benchmark

| Index | Symbol |
|---|---|
| NIFTY 50 | `NSE:NIFTY` |

## Sector indices

| Sector | Symbol | Type |
|---|---|---|
| Bank | `NSE:BANKNIFTY` | cyclical |
| Private Bank | `NSE:NIFTYPVTBANK` | cyclical |
| PSU Bank | `NSE:CNXPSUBANK` | cyclical |
| Financial Services | `NSE:CNXFINANCE` | cyclical |
| IT | `NSE:CNXIT` | cyclical |
| Auto | `NSE:CNXAUTO` | cyclical |
| Metal | `NSE:CNXMETAL` | cyclical |
| Realty | `NSE:CNXREALTY` | cyclical |
| Energy | `NSE:CNXENERGY` | cyclical |
| Oil & Gas | `NSE:NIFTY_OIL_AND_GAS` | cyclical |
| Media | `NSE:CNXMEDIA` | cyclical |
| Consumer Durables | `NSE:NIFTY_CONSR_DURBL` | cyclical |
| Pharma | `NSE:CNXPHARMA` | defensive |
| Healthcare | `NSE:NIFTY_HEALTHCARE` | defensive |
| FMCG | `NSE:CNXFMCG` | defensive |

The `Type` column feeds the leadership-quality component of
`india-market-breadth`. Defensive leadership in a rising market is a caution
flag, not a bullish one.

## Broad market (breadth context)

| Index | Symbol |
|---|---|
| NIFTY Next 50 | `NSE:NIFTYJR` |
| NIFTY Midcap 100 | `NSE:CNXMIDCAP` |
| NIFTY Midcap 150 | `NSE:NIFTYMIDCAP150` |
| NIFTY Smallcap 100 | `NSE:CNXSMALLCAP` |
| NIFTY Smallcap 250 | `NSE:NIFTYSMLCAP250` |
| NIFTY MidSmallcap 400 | `NSE:NIFTYMIDSML400` |
| NIFTY 500 | `NSE:CNX500` |
| India VIX | `NSE:INDIAVIX` |

## Naming warning

NSE ticker strings on TradingView are **inconsistent** — three different
conventions coexist:

- `CNX` prefix — `CNXIT`, `CNXAUTO`, `CNXPSUBANK`, `CNXMIDCAP`
- `NIFTY` prefix, no separator — `NIFTYPVTBANK`, `NIFTYJR`
- `NIFTY_` prefix with underscores — `NIFTY_OIL_AND_GAS`, `NIFTY_CONSR_DURBL`

There is no rule that predicts which a given index uses. Do not guess a symbol
that is not in this file — search for it, then add it here.

## Also available (not used by these skills)

`NSE:NIFTYMIDCAP50`, `NSE:NIFTY_MID_SELECT`, `NSE:NIFTYMIDLIQ15`,
`NSE:NIFTY500_HEALTH`, `NSE:NIFTY_EV`, `NSE:NIFTYM150MOMNTM50`,
`NSE:NIFTY_M150_QLTY50`, `BSE:CD`, `BSE:BSEPBI`, `BSE:BSEMSP`
