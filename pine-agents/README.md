# pine-agents (vendored from TradersPost/pinescript-agents)

Source: https://github.com/TradersPost/pinescript-agents (MIT, 162 stars, cloned 2026-09-14).

What was brought in:

- `.claude/skills/pine-*` — the seven Pine Script skills (visualizer, developer, debugger, backtester,
  optimizer, manager, publisher). They load automatically when a request matches their triggers.
- `pine-agents/manual/` — the Pine Script v6 reference the skills read from (`pinescriptv6_complete_reference.md`,
  execution model, concepts, writing_scripts).
- `pine-agents/templates/` and `pine-agents/examples/` — starter indicators / strategies referenced by the skills.

Not brought in: the upstream `.claude/hooks`, statusline, `start` launcher, video-analysis tools and the
`thepatternsite` scraper — they assume their own project layout and are not needed here.

Note: the skills reference `templates/...` paths relative to their own repo root; here they live under
`pine-agents/templates/...`.
