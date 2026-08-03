# Indian Trading Costs — user-maintained reference

> ⚠️ **VERIFY BEFORE RELYING ON THESE.** STT and stamp duty are set by the
> Finance Act and revised in the Union Budget; exchange transaction charges and
> lot sizes are revised by NSE/BSE and SEBI. The values below are typical
> published rates and are **not** guaranteed current.
>
> Authoritative sources:
>
> - Zerodha brokerage calculator — https://zerodha.com/brokerage-calculator
> - NSE circulars — https://www.nseindia.com/resources/exchange-communication-circulars
> - Your own contract notes (the only source that reflects what you actually paid)
>
> **Update this file from your own contract notes.** Reconciling against a real
> contract note is the fastest way to make these numbers trustworthy.

## Charge structure by segment

| Charge              | Equity delivery                 | Equity intraday | Futures         | Options                |
| ------------------- | ------------------------------- | --------------- | --------------- | ---------------------- |
| STT                 | both sides (0.1%)               | sell side       | sell side       | sell side (on premium) |
| DP charges          | sell side, flat ₹               | —               | —               | —                      |
| Brokerage           | broker-specific                 | broker-specific | broker-specific | broker-specific        |
| Exchange txn charge | on turnover                     | on turnover     | on turnover     | on premium turnover    |
| Stamp duty          | buy side                        | buy side        | buy side        | buy side               |
| SEBI charges        | on turnover                     | on turnover     | on turnover     | on turnover            |
| GST                 | 18% on (brokerage + txn + SEBI) | same            | same            | same                   |

The **which-side** column matters more than the exact rate for most decisions —
it is why intraday and options breakevens are asymmetric between entry and exit.

## Rates — FILL IN FROM YOUR OWN CONTRACT NOTES

Leave a line as `TODO` rather than guessing. A `TODO` produces an honest
"cost estimate incomplete" warning; a guessed number produces a confident
wrong answer.

```yaml
broker: Groww
# Verified 2026-08-03 against https://groww.in/pricing/stocks
# Statutory rates (STT, stamp duty, SEBI) cross-checked against
# https://zerodha.com/charges/ — these are set by law, not by the broker,
# so they are identical across brokers. Brokerage and DP are Groww-specific.

brokerage:
  # ₹20 or 0.1% per executed order, whichever is LOWER, minimum ₹5.
  # Not a flat ₹20 — on orders below ₹20,000 the 0.1% leg is cheaper.
  equity_delivery: min(20, 0.1%) # floor ₹5
  equity_intraday: min(20, 0.1%) # floor ₹5
  futures: min(20, 0.1%) # floor ₹5
  options: min(20, 0.1%) # floor ₹5

stt:
  equity_delivery: 0.1% # BOTH sides
  equity_intraday: 0.025% # sell side
  futures: 0.05% # sell side
  options: 0.15% # sell side, on premium

exchange_txn:
  equity_nse: 0.00297% # both sides
  equity_bse: 0.00375% # both sides
  futures: 0.00173% # NSE standard
  options: 0.03503% # NSE standard, on premium turnover

ipft:
  equity_nse: 0.0001% # both sides — NSE investor protection fund

stamp_duty: # buy side only, statutory
  equity_delivery: 0.015% # ₹1500/crore
  equity_intraday: 0.003% # ₹300/crore
  futures: 0.002% # ₹200/crore
  options: 0.003% # ₹300/crore

sebi_charges: 0.0001% # ₹10/crore, both sides, + 18% GST

dp_charges: # equity DELIVERY sell only, per scrip per day — flat ₹, not %
  depository: 3.5 # ₹3.25 for female demat holders
  groww: 16.5 # ₹0 when debit value < ₹100
  # ≈₹20 flat on every delivery sell. On a ₹5,000 position that is 0.4% —
  # often larger than brokerage. Always include for delivery exits.

gst: 0.18 # 18% on brokerage + exchange txn + SEBI + DP
```

## Lot sizes — FILL IN AND KEEP CURRENT

Index lot sizes are revised periodically; stock F&O lot sizes are revised on
review cycles. **Always confirm with the user before sizing an F&O trade.**

```yaml
lot_sizes:
  NIFTY: TODO
  BANKNIFTY: TODO
  FINNIFTY: TODO
  MIDCPNIFTY: TODO
  SENSEX: TODO
  # stock F&O — add the ones you actually trade
```

## Notes on segment quirks

- **Options premium turnover**: STT and exchange charges on options are computed
  on _premium_ turnover, not notional. A common error is applying them to
  notional, which overstates costs by orders of magnitude.
- **Physical settlement**: stock F&O positions held to expiry settle physically
  and attract delivery-equivalent charges. Flag this if the user is holding a
  stock F&O position near expiry.
- **Expiry-day options**: costs are small in absolute rupees but very large
  relative to a cheap premium. The "costs as % of risk" check matters most here.
