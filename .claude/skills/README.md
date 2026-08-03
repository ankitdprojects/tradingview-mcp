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
