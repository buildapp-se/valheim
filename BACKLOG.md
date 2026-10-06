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

- [ ] `[P1]` Verify in game: Oatmeal stats (wiki says 39/115/85, total 239, far above every other food). If wrong, fix `src/data.ts` and drop the flag. 2026-10-06: the wiki's Oatmeal page is no longer work in progress and gives the same numbers from datamined values (revision 2026-09-28). Decide whether that is enough to drop the flag.
- [ ] `[P2]` Verify in game: Kale Chips recipe (wiki gives 12 Kale at the Stone oven, Raw Kale Chips step unclear), Oat flour ratio, Pulled Bear hp/tick. 2026-10-06: the wiki now gives all three from datamined values: 12 Kale make 4 Raw Kale Chips at a level 6 Cauldron (data updated), 1 Oats to 1 Oat Flour, Pulled Bear 3 hp/tick. Same decision as Oatmeal.
- [x] `[P2]` (built 2026-10-06) Search field above the gather list. At Deep North it holds over 100 rows. Matches name, station, ingredients and mead effect.
- [x] `[P3]` (rechecked 2026-10-06, Food and Mead tables, all 95 foods and 20 meads diffed by script) Recheck the weirdgloop Food table after the next patch; Deep North pages are marked work in progress there. Changed: Oven Pancake, Kale Chips, Berserkir mead batch size, seven mead cooldowns. Details in CONTEXT.md under Data.
- [x] `[P3]` (built 2026-10-06) PNG icon exports (favicon-32/16, apple-touch-icon-180, icon-192/512). Committed
      under `icons/`, rasterised once from the two inline SVG marks, so the build needs no rasteriser.
      The deploy workflow copies `icons/*.png`. icon-192/512 ship but nothing links them: that takes a
      web manifest, which is a separate decision.

## Granskning 2026-09-16

Fynd från cockpitens granskningskolumner (Lighthouse mobil, W3C, UX-skript, headers, TLS, OWASP). Mätvärdena står under `## Audits` i CONTEXT.md.

- [x] `[P2]` (rättad 2026-09-16, `c7e4d8d`, W3C 0 fel live) W3C: `<link rel=icon>` och `apple-touch-icon` har `data:image/svg+xml` med råa mellanslag i href, kodas som `%20`. Och `<h4>Cookie` följer direkt på h1, hoppar två nivåer.
- [x] `[P3]` (rättad 2026-10-06, mätt lokalt, inte live) Lighthouse: CLS 0,49 vid laddning på mobil, något flyttar sig efter första målningen. Orsak: tomt skal målades före `app.js`, sedan hoppade sidhuvud, main och sidfot. `blocking="render"` på skriptet plus `min-height` på main: första besök 0,24 till 0,00, återbesök 0,87 till 0,09 (strypt mobil, Chrome). Kvar: 0,08 till 0,09 från typsnittsbytet på återbesök, och webbläsare utan `blocking=render` hamnar på cirka 0,2.
- [x] `[P3]` (rättad 2026-09-16, `c7e4d8d`, 0 ytor under 44 px live) UX, Fitts: navlänkarna är 43 px, en pixel under konventionen.

## Granskning 2026-10-06

Fynd från den automatiska sviten (aifabriken `tools/audit-suite.ts`: headers, npm audit, secrets, Actions, markup, axe). Mätvärdena står som `(automated)`-rader under `## Audits` i CONTEXT.md.

- [x] `[P3]` (kontrollerad 2026-10-06, ingen kodändring) WCAG: axe hittar 0 fel men kan inte avgöra kontrasten på 3 element. Manuell kontrastkontroll återstår. De tre är hjältebandets texter ovanpå bergskammen (`.eyebrow span`, `h2`, `p`). Mätt mot den ljusaste bakgrundspixeln bakom varje text, sex bredder 360 till 1920 px: lägst 5,35:1 (krav 4,5), rubriken 10,43:1 (krav 3), brödtexten 7,08:1. Alla klarar AA.
- [ ] `[P3]` WCAG: avbockad resurs i Resources (`.resgrid label.off`, `opacity: 0.45` i `style.css`) ger 3,78:1 på namnet och 1,98:1 på källraden, under 4,5. Raden är fortfarande klickbar, så undantaget för inaktiva kontroller gäller inte. Hittad med axe lokalt 2026-10-06 med en resurs avbockad, ett läge sviten inte besöker. Kräver ett smakbeslut om hur avbockat ska se ut.
