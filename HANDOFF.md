---
schemaVersion: 1
status: active
currentGoal: Valheim Food Planner live at buildapp.se/valheim with verified data through Deep North
nextAction: Patrik checks Oatmeal stats in game and tries the site
blockers: []
reviewedAt: 2026-09-16
---

# Handoff

First version built and deployed 2026-09-14. Scope came from a grill session the same day; the decisions are recorded in `CONTEXT.md`.

## 2026-09-16: policy 1.1

privacy.html said Google Fonts served only the title typeface; index.html loads three families (Grenze, IBM Plex Sans, IBM Plex Mono). Fixed, version 1.1, commit `1a43445`, verified live. Found by an external privacy review of a sister site.

## Verify

```
npm ci
npm test
```

`npm test` compiles with `tsc` and runs `test.mjs`: every ingredient resolves, no item needs a later biome than its own, gather rounding on shared intermediates, and the wiki's published max combos at Ashlands (300 health, 270 eitr).

Local run: `python -m http.server 8787` in the repo root, then open http://127.0.0.1:8787/.

## Choices made while building

- Bar scale is the strongest verified single food (160 total), shared by all rows. Oatmeal is unverified and clamps at full width.
- The resource checklist filters every section (changed 2026-09-14 after Patrik's first test; the first version only filtered best food).
- Meads never enter build combos. Their biome is the latest biome among their ingredients.
- Bog Witch spices are listed as resources in the Swamp or Mountain tier they unlock in.
- Steppers set `width` as well as flex-basis: Firefox and Safari ignore flex-basis when sizing the box, so after the redesign their +1/+5 and card + spilled outside (fixed 2026-09-14). Check layout changes in Firefox or WebKit too, not only Chrome.
- Overview food rows use the same `− N +` as combos (N = portions). Food pills in combos are buttons that open station and ingredients in the popover.
- Per biome is disabled while Combos is on, by design: a trio spans biomes.

## Granskning 2026-09-16

Cross-project audit run from elwyn-dash (session 5 in the daily note). Results written to `## Audits` in CONTEXT.md, findings appended to BACKLOG.md under `## Granskning 2026-09-16`. Headers on buildapp.se and the TLS grade are zone-level and are fixed once in Cloudflare, not here.
