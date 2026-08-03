# Indian Trading Costs — user-maintained reference

> ⚠️ **VERIFY BEFORE RELYING ON THESE.** STT and stamp duty are set by the
> Finance Act and revised in the Union Budget; exchange transaction charges and
> lot sizes are revised by NSE/BSE and SEBI. The values below are typical
> published rates and are **not** guaranteed current.
>
> Authoritative sources:
> - Zerodha brokerage calculator — https://zerodha.com/brokerage-calculator
> - NSE circulars — https://www.nseindia.com/resources/exchange-communication-circulars
> - Your own contract notes (the only source that reflects what you actually paid)
>
> **Update this file from your own contract notes.** Reconciling against a real
> contract note is the fastest way to make these numbers trustworthy.

## Charge structure by segment

| Charge | Equity delivery | Equity intraday | Futures | Options |
|---|---|---|---|---|
| STT | both sides | sell side | sell side | sell side (on premium) |
| Brokerage | broker-specific | broker-specific | broker-specific | broker-specific |
| Exchange txn charge | on turnover | on turnover | on turnover | on premium turnover |
| Stamp duty | buy side | buy side | buy side | buy side |
| SEBI charges | on turnover | on turnover | on turnover | on turnover |
| GST | 18% on (brokerage + txn + SEBI) | same | same | same |

The **which-side** column matters more than the exact rate for most decisions —
it is why intraday and options breakevens are asymmetric between entry and exit.

## Rates — FILL IN FROM YOUR OWN CONTRACT NOTES

Leave a line as `TODO` rather than guessing. A `TODO` produces an honest
"cost estimate incomplete" warning; a guessed number produces a confident
wrong answer.

```yaml
broker: TODO                      # e.g. Zerodha, Upstox, Angel

brokerage:
  equity_delivery: TODO           # e.g. 0 or flat ₹20/order
  equity_intraday: TODO           # e.g. 0.03% or ₹20/order, whichever lower
  futures:         TODO
  options:         TODO           # usually flat per order

stt:
  equity_delivery: TODO           # both sides
  equity_intraday: TODO           # sell side
  futures:         TODO           # sell side
  options:         TODO           # sell side, on premium

exchange_txn:
  equity: TODO
  futures: TODO
  options: TODO                   # on premium turnover

stamp_duty:
  equity_delivery: TODO           # buy side
  equity_intraday: TODO
  futures: TODO
  options: TODO

sebi_charges: TODO                # per crore of turnover
gst: 0.18                         # 18% on brokerage + txn + SEBI
```

## Lot sizes — FILL IN AND KEEP CURRENT

Index lot sizes are revised periodically; stock F&O lot sizes are revised on
review cycles. **Always confirm with the user before sizing an F&O trade.**

```yaml
lot_sizes:
  NIFTY:      TODO
  BANKNIFTY:  TODO
  FINNIFTY:   TODO
  MIDCPNIFTY: TODO
  SENSEX:     TODO
  # stock F&O — add the ones you actually trade
```

## Notes on segment quirks

- **Options premium turnover**: STT and exchange charges on options are computed
  on *premium* turnover, not notional. A common error is applying them to
  notional, which overstates costs by orders of magnitude.
- **Physical settlement**: stock F&O positions held to expiry settle physically
  and attract delivery-equivalent charges. Flag this if the user is holding a
  stock F&O position near expiry.
- **Expiry-day options**: costs are small in absolute rupees but very large
  relative to a cheap premium. The "costs as % of risk" check matters most here.
