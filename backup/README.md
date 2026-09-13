# Setup backups

Each folder is a full snapshot of the trading setup taken with `node scripts/backup_setup.mjs [label]`:

- `pine/` — every Pine script (Screener = swing_pullback_console.pine, OI Profile, backtest strategy, Quad Stack)
- `tools/` — feeder / picker / scan tooling from `scripts/`
- `scratchpad/` — editor push, study swap, backtest sweep helpers
- `chart_state.json` — what was live on TradingView: symbol, timeframe, each study's Pine id, version and every `in_*` input value
- `manifest.json` — summary

`LATEST.txt` names the most recent snapshot. Git tag `backup-<stamp>` marks the same point in history.

## Restore ("undo")

1. Source: `cp backup/<stamp>/pine/*.pine scripts/` (or `git checkout backup-<stamp> -- scripts/`).
2. Push to the TradingView web Pine editor with `scratchpad/push_web_pine.mjs` (saves a new version of the same script id).
3. Re-insert on chart with `swap_console.mjs` (Screener) / `swap_generic.mjs` (OI Profile) using the new version number, then apply the inputs listed in `chart_state.json`.
4. Save the layout (`saveChartToServer`).

Never navigate to bare `/pine/` and never round-trip all Screener inputs (parse error) — set only in_5 / in_43 / in_32 / in_61.
