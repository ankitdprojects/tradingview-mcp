# Installed third-party skills

Source: https://github.com/tradermonty/claude-trading-skills (MIT)

This directory is **gitignored** — it is personal tooling, not part of the
tradingview-mcp product. To reinstall after a fresh clone:

```bash
git clone --depth 1 https://github.com/tradermonty/claude-trading-skills.git /tmp/cts
mkdir -p .claude/skills
for s in market-breadth-analyzer uptrend-analyzer position-sizer \
         trader-memory-core signal-postmortem; do
  cp -r "/tmp/cts/skills/$s" .claude/skills/
done
```

## What is installed

The upstream repo's "no API key starter path" — the 5 skills that need no paid
FMP / FINVIZ / Alpaca subscription:

| Skill | Purpose | Inputs it needs |
|---|---|---|
| `market-breadth-analyzer` | breadth scoring | public CSVs |
| `uptrend-analyzer` | uptrend participation | public CSVs |
| `position-sizer` | position sizing | pure calculation, no I/O |
| `trader-memory-core` | journaling to local YAML | local files |
| `signal-postmortem` | trade review framework | local files |

The other 66 skills in the upstream repo are not installed. Most require paid
data APIs, and many are US-equities specific (CANSLIM, VCP, IBD, FINVIZ,
US dividend tax accounting).

## ⚠️ Local edits that a reinstall will wipe

Both the US and India skill sets are kept. To stop them competing for the same
requests, three upstream descriptions were scoped to "US" by hand. **Reinstalling
from upstream overwrites these — redo them.**

| File | Change to the `description:` line |
|---|---|
| `position-sizer/SKILL.md` | "for long **US** stock trades"; added "For NSE/BSE trades, or anything sized in lots (NIFTY, BANKNIFTY, Indian F&O), use india-position-sizer instead." |
| `market-breadth-analyzer/SKILL.md` | "**US** market breadth"; added "For Indian markets (NIFTY, NSE, BSE) use india-market-breadth instead." |
| `uptrend-analyzer/SKILL.md` | "**US** market breadth"; added the same India pointer |

Without this, "how many shares should I buy?" matches both sizers and the wrong
one can fire — giving you share counts with US cost assumptions on an NSE trade.

## Routing: which skill for which market

| Task | US | India |
|---|---|---|
| Position sizing | `position-sizer` | `india-position-sizer` |
| Market breadth | `market-breadth-analyzer`, `uptrend-analyzer` | `india-market-breadth` |
| Sector rotation | *(not installed — needs FMP/FINVIZ)* | `india-sector-rotation` |

Name the market in your request ("size this NIFTY trade", "US market breadth")
and the right one fires. The India skills are tracked in git; the US ones are not.

## Important: these do NOT read your TradingView chart

These skills have their own data paths (CSVs, local files, optional APIs).
They do not use the tradingview MCP server. Live-chart analysis comes from
`/premarket`; these are a separate, complementary layer.

## Overlap with the local commands

`trader-memory-core` and `signal-postmortem` overlap with `/journal` and
`/review` in `.claude/commands/`. They are different systems with different
storage:

- `/journal` + `/review` → `journal/trades.csv`, graded against `.claude/rules.md`
- `trader-memory-core` → its own local YAML store

Pick one as the system of record. Running both means your trade history is
split across two stores and neither review sees all of it.

## Python dependencies

Several skills ship Python scripts (`uv`-managed, see upstream `pyproject.toml`).
They are only executed when a skill actually runs, so nothing is required until
you invoke one.
