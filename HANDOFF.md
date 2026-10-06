---
schemaVersion: 1
status: active
currentGoal: Valheim Food Planner live at buildapp.se/valheim with verified data through Deep North
nextAction: Patrik reviews and merges branch batch/2026-10-06 (merge deploys), then decides whether the datamined wiki pages are enough to drop the four unverified flags
blockers: []
reviewedAt: 2026-10-06
---

**2026-09-24, audits från aifabriken (`tools/audit-run.mjs`).** Actions: `persist-credentials: false` på checkout i deploy.yml. Nya auditrader Secrets och Actions, båda pass.

# Handoff

## 2026-09-16: granskningsbatchen

W3C-felen (kodade mellanslag i ikonernas data-URI, h2 i stället för h4 i
sekretessrutan) och flikarnas 43 px rättade i `c7e4d8d`, CI-deployade, mätta
live: W3C 0 fel, 0 tryckytor under 44 px. Kvar från granskningen: CLS 0,49 på
mobil (P3), inte undersökt.

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

## Automated audit batch, 2026-10-06

Cross-project run from elwyn-dash with aifabriken `tools/audit-suite.ts` (headers, npm audit, secrets, Actions, markup, axe at one mobile viewport; TLS and Lighthouse not run). Results are the `(automated)` lines under `## Audits` in CONTEXT.md, findings under `## Granskning 2026-10-06` in BACKLOG.md. Markup 0 findings (one external link outside the suite's scope), axe 0 violations with 3 contrast nodes for manual review, npm audit pass. Headers fail is the shared buildapp.se CSP without `script-src` (zone Transform Rule, owned by elwyn-dash `docs/security.md` §Open 11), not something this repository can fix. No application code or deployment changed. `reviewedAt` was left alone: the goal and next action above were not reviewed.

## Overnight batch, 2026-10-06 (branch `batch/2026-10-06`, not merged, not deployed)

Five backlog items, one commit each. Nothing is live: the deploy workflow runs on push to main.

- `e9beffd` Search field above the gather list. Matches name, station, ingredients and mead effect. Rows are hidden in place, so typing keeps focus; the text is view-only state. Checked headless in Chrome (desktop, phone) and Firefox.
- `e03cac0` CLS. The empty shell was painted before `app.js` drew the page, then header, main and footer jumped. The script now sits in the head with `blocking="render"` and `main` has `min-height: 100vh`. Local, throttled mobile Chrome: first visit 0,24 to 0,00, returning visit 0,87 to 0,09. What is left on a returning visit is the font swap (Grenze against Georgia rewraps the build titles). Browsers without `blocking=render` (Firefox, Safari) keep the header jump, about 0,2 in a Chrome run with the attribute removed. Not measured live, and not run through the W3C validator (html-validate: 0 findings).
- `2958889` Contrast on the three hero texts axe could not judge: lowest 5,35:1, AA passes, no code change. The same run found a real failure that is now its own backlog item: an unticked resource row is 1,98:1.
- `efa0664` PNG icons in `icons/`, linked in the head, copied by the deploy workflow. Made once by screenshot from the two SVG marks, no rasteriser in the build. The assemble and version-tag steps of the workflow were replayed locally and the result served: all five PNGs load at the right size. icon-192/512 are unreferenced until there is a web manifest.
- `4ceec77` Wiki recheck, Food and Mead tables. Oven Pancake, Kale Chips and Berserkir mead corrected, seven mead cooldowns, one new test. Footer date is now 2026-10-06. See Data in `CONTEXT.md`.

Still open: the two verify-in-game items (the wiki now backs all four flags with datamined values, the flags were kept) and the unticked-resource contrast, which needs a decision on how unticked should look.

Check after merge: Lighthouse CLS on the live page, W3C on the new `blocking` attribute, and the touch icon on an iPhone home screen.
