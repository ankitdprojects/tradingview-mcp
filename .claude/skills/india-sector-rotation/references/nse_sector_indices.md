# NSE Sector & Broad Market Indices — TradingView symbols

> ⚠️ **Verify these on first run with `symbol_search`.** TradingView's exact
> ticker strings for NSE indices differ depending on your data subscription and
> have changed over time. Correct any that fail and save the fix back here, so
> later runs skip the verification step.

## Benchmark

| Index | Candidate symbol | Verified? |
|---|---|---|
| NIFTY 50 | `NSE:NIFTY` | ☐ |

## Sector indices

| Sector | Candidate symbol | Verified? |
|---|---|---|
| Bank | `NSE:BANKNIFTY` | ☐ |
| IT | `NSE:CNXIT` | ☐ |
| Auto | `NSE:CNXAUTO` | ☐ |
| Pharma | `NSE:CNXPHARMA` | ☐ |
| FMCG | `NSE:CNXFMCG` | ☐ |
| Metal | `NSE:CNXMETAL` | ☐ |
| Realty | `NSE:CNXREALTY` | ☐ |
| Energy | `NSE:CNXENERGY` | ☐ |
| Financial Services | `NSE:CNXFINANCE` | ☐ |
| Media | `NSE:CNXMEDIA` | ☐ |
| PSU Bank | `NSE:NIFTYPSUBANK` | ☐ |
| Private Bank | `NSE:NIFTYPVTBANK` | ☐ |
| Consumer Durables | `NSE:NIFTYCONSUMERDURABLES` | ☐ |
| Oil & Gas | `NSE:NIFTYOILANDGAS` | ☐ |
| Healthcare | `NSE:NIFTYHEALTHCARE` | ☐ |

## Broad market (for breadth context)

| Index | Candidate symbol | Verified? |
|---|---|---|
| NIFTY Next 50 | `NSE:CNXNIFTYJUNIOR` | ☐ |
| NIFTY Midcap 100 | `NSE:CNXMIDCAP` | ☐ |
| NIFTY Smallcap 100 | `NSE:CNXSMALLCAP` | ☐ |
| NIFTY 500 | `NSE:CNX500` | ☐ |
| India VIX | `NSE:INDIAVIX` | ☐ |

## How to verify

For each symbol, run `symbol_search` with the index name (e.g. "Nifty IT") and
compare against the candidate above. Then tick the box and correct the string if
it differs. If a symbol is unavailable on your subscription, mark it
`UNAVAILABLE` — the skills will skip it and report it as missing rather than
silently omitting it.
