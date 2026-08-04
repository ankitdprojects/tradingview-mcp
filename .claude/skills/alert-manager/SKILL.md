---
name: alert-manager
description: Create, list, and clean up TradingView alerts for armed setups and key levels, so trades are not missed without watching the screen. Use when the user asks to set an alert, be notified of a trigger, watch a level, or asks what alerts are currently active.
---

# Alert Manager

## Why this exists

MCX runs to 23:30 IST and setups arm at unpredictable times. Alerts let the
rules do the watching. This matters more than it sounds: screen-watching is
what produces the impulse entries that `/review` tags `IMPULSE` — the category
that historically wins far less than planned setups.

## Requirements

- TradingView with CDP, logged in
- For indicator alerts, `Swing Pullback Console` must be on the chart

## What to alert on

The console exposes three alert conditions:

| Condition | Fires when |
|---|---|
| `BUY trigger` | long pullback trigger — close back above the fast EMA |
| `SELL trigger` | short pullback trigger — close back below it |
| `Any trigger` | either |

Plus price alerts via `alert_create` for levels from the console's S/R rows.

## ⚠️ Always use "Once Per Bar Close"

TradingView's default fires **intrabar**. The console's triggers are gated on
bar close (see the no-repaint setting), so an intrabar alert can fire on a
signal that then vanishes before the bar closes — reintroducing exactly the
repaint problem the indicator was fixed to avoid.

If the alert dialog's frequency cannot be set to Once Per Bar Close, say so
rather than creating an alert that will produce false notifications.

## Method

**Indicator alerts** — open the alert dialog on the chart, choose the
`Swing Pullback Console` condition, set frequency to Once Per Bar Close, and
name it `<symbol> <mode> <BUY|SELL>` so the notification is self-explanatory.

**Price alerts** — `alert_create` with the level, condition (`crossing`,
`greater_than`, `less_than`), and a message naming the symbol and what the
level means (e.g. `CRUDEOILM resistance 7773`).

**Listing / cleanup** — `alert_list`, then `alert_delete` for anything stale.

## Housekeeping rules

- **One alert per symbol per direction.** Duplicates train you to ignore them.
- **Delete alerts when the setup disarms.** An alert for a setup that no longer
  exists is noise, and noise is what makes people stop reading alerts.
- **Delete alerts on expired contracts.** A `Q2026` alert is worthless in
  September. Check with `expiry-watch`.
- **Cap the total.** Beyond roughly 10 active alerts, they stop being signal.
  If the user wants more, ask which universe actually matters.

## Output

```
# Alerts
Created: <name> — <symbol> <condition> <frequency>
Active:  __ total
| Name | Symbol | Condition | Frequency |

Suggested cleanup: <stale / expired / duplicate alerts, with the reason>
```

## Rules for you

- Always confirm the frequency is Once Per Bar Close, and say so explicitly in
  the output. This is the single most common way alerts go wrong.
- Name alerts so the notification is actionable without opening the chart.
  `CRUDEOILM 15m BUY` beats `Alert on Swing Pullback Console`.
- An alert firing is **not** an instruction to trade. It means look at the
  chart and check the setup against `rules.md` — including the daily loss
  limit and trade count, which the alert knows nothing about.
- Before creating alerts for a new symbol, check `expiry-watch` if it is a
  dated contract.
