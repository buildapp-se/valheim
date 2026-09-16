# Backlog

## Built

- Biome gate with first-visit picker, next-biome step and show-all.
- Best food: six builds, top 5 combos, resource-aware, feasts toggle.
- Overview with stacked bars, regen bar, sort, combo mode.
- Gather list with craft-step steppers for dishes and meads, raw totals by biome, crafting order.
- Resource checklist with sources.
- Data checks in `test.mjs`, run in the deploy workflow.
- Full visual redesign from the Claude Design handoff: tokens, original icon set, rune-cut V
  mark and favicon, hero band on first visit, 1280 content width, two-column build cards.
- First-visit picker: select a tile, then Continue. Spoiler-free subtitle per biome.
- Header chip "Spoilers: <biome> and earlier".
- Live gather count badge in the sticky nav, pulses on add.
- Info and unverified marks are click/keyboard popovers (Esc closes), not hover-only titles.
- Overview rows expand on phone to hold Bars, Time, Station and add.

## Open

- [ ] `[P1]` Verify in game: Oatmeal stats (wiki says 39/115/85, total 239, far above every other food). If wrong, fix `src/data.ts` and drop the flag.
- [ ] `[P2]` Verify in game: Kale Chips recipe (wiki gives 12 Kale at the Stone oven, Raw Kale Chips step unclear), Oat flour ratio, Pulled Bear hp/tick.
- [ ] `[P2]` Search field above the gather list. At Deep North it holds over 100 rows.
- [ ] `[P3]` Recheck the weirdgloop Food table after the next patch; Deep North pages are marked work in progress there.
- [ ] `[P3]` PNG icon exports (favicon-32/16, apple-touch-icon-180, icon-192/512). The mark ships
      as an inline SVG data URI today; PNGs need a rasteriser in the build and extra `cp` lines
      in the deploy workflow.

## Granskning 2026-09-16

Fynd från cockpitens granskningskolumner (Lighthouse mobil, W3C, UX-skript, headers, TLS, OWASP). Mätvärdena står under `## Audits` i CONTEXT.md.

- [ ] `[P2]` W3C: `<link rel=icon>` och `apple-touch-icon` har `data:image/svg+xml` med råa mellanslag i href, kodas som `%20`. Och `<h4>Cookie` följer direkt på h1, hoppar två nivåer.
- [ ] `[P3]` Lighthouse: CLS 0,49 vid laddning på mobil, något flyttar sig efter första målningen.
- [ ] `[P3]` UX, Fitts: navlänkarna är 43 px, en pixel under konventionen.
