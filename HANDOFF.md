---
schemaVersion: 1
status: active
currentGoal: Valheim Food Planner live at buildapp.se/valheim with verified data through Deep North
nextAction: Patrik checks Oatmeal stats in game and tries the site
blockers: []
reviewedAt: 2026-09-14
---

# Handoff

First version built and deployed 2026-09-14. Scope came from a grill session the same day; the decisions are recorded in `CONTEXT.md`.

## Verify

```
npm ci
npm test
```

`npm test` compiles with `tsc` and runs `test.mjs`: every ingredient resolves, no item needs a later biome than its own, gather rounding on shared intermediates, and the wiki's published max combos at Ashlands (300 health, 270 eitr).

Local run: `python -m http.server 8787` in the repo root, then open http://127.0.0.1:8787/.

## Choices made while building

- Bar scale is the strongest verified single food (160 total), shared by all rows. Oatmeal is unverified and clamps at full width.
- The overview combo mode ignores the resource checklist, so it shows what exists; the best-food panel shows what you can make.
- Meads never enter build combos. Their biome is the latest biome among their ingredients.
- Bog Witch spices are listed as resources in the Swamp or Mountain tier they unlock in.
