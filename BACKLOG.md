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
- [x] `[P3]` (rättad 2026-10-06, mätt lokalt; live sedan 2026-10-07, mätt live 2026-11-24: Lighthouse mobil CLS 0,031) Lighthouse: CLS 0,49 vid laddning på mobil, något flyttar sig efter första målningen. Orsak: tomt skal målades före `app.js`, sedan hoppade sidhuvud, main och sidfot. `blocking="render"` på skriptet plus `min-height` på main: första besök 0,24 till 0,00, återbesök 0,87 till 0,09 (strypt mobil, Chrome). Kvar: 0,08 till 0,09 från typsnittsbytet på återbesök, och webbläsare utan `blocking=render` hamnar på cirka 0,2.
- [x] `[P3]` (rättad 2026-09-16, `c7e4d8d`, 0 ytor under 44 px live) UX, Fitts: navlänkarna är 43 px, en pixel under konventionen.

## Granskning 2026-10-06

Fynd från den automatiska sviten (aifabriken `tools/audit-suite.ts`: headers, npm audit, secrets, Actions, markup, axe). Mätvärdena står som `(automated)`-rader under `## Audits` i CONTEXT.md.

- [x] `[P3]` (kontrollerad 2026-10-06, ingen kodändring) WCAG: axe hittar 0 fel men kan inte avgöra kontrasten på 3 element. Manuell kontrastkontroll återstår. De tre är hjältebandets texter ovanpå bergskammen (`.eyebrow span`, `h2`, `p`). Mätt mot den ljusaste bakgrundspixeln bakom varje text, sex bredder 360 till 1920 px: lägst 5,35:1 (krav 4,5), rubriken 10,43:1 (krav 3), brödtexten 7,08:1. Alla klarar AA.
- [ ] `[P3]` WCAG: avbockad resurs i Resources (`.resgrid label.off`, `opacity: 0.45` i `style.css`) ger 3,78:1 på namnet och 1,98:1 på källraden, under 4,5. Raden är fortfarande klickbar, så undantaget för inaktiva kontroller gäller inte. Hittad med axe lokalt 2026-10-06 med en resurs avbockad, ett läge sviten inte besöker. Kräver ett smakbeslut om hur avbockat ska se ut.

## Granskning 2026-11-24 (UX)

ux-audit-skriptet lokalt (390 px, --interact) på förstabesöket och med ett biom valt, plus skärmbilder i 390 och 1440 px av väljaren, best food, översikten, tom och fylld samlingslista och resurserna. Raden står under `## Audits` i CONTEXT.md.

- [x] `[P3]` (rättad 2026-11-24, `7e1dfbc`) UX, Paradox of the Active User: tom samlingslista (`#gather .result .empty`) sa bara "Nothing picked yet." Nu också hur: "Use + on a dish or mead, or on a combo under Best food." Kontrollerad i `test-dom.mjs`.

## Funktionspass 2026-11-24

- [x] `[P2]` (rättad 2026-11-24, `3f93064`) Bugg: varje klick ritar om hela sidan och tappade tangentbordsfokus till `<body>`. Enter på +1 i samlingslistan lade till en gång, nästa Enter gjorde inget; Tab började om från sidans topp. Gällde stegknappar, kombostegare, sorteringsrubriker, resursrutor och biomrutorna på förstabesöket. Nu fokuseras samma kontroll i den nya sidan. Verifierat: Playwright-skript i headless Chrome mot lokal server (Enter två gånger, kombo +, sorteringsrubrik, resursruta, biomruta, inskrivet antal plus Tab landar på +1) failar på gamla koden och passerar på nya; musklick ger ingen fokusring och inget scrollhopp; ny kontroll i `test-dom.mjs` failar på gamla koden. Firefox och Safari inte testat.

## Användarbuggjakt 2026-11-24

Appen genomgången som spelare vid 390 och 1440 px (förstabesök, välj biom, best food, översikt, samlingslistan med inskrivna antal: tomt, 0, negativt, decimalkomma, mycket stort, sökning med å, versaler, 300 tecken, blanksteg; omladdning, bakåtknapp, tangentbord). Lokal server, Playwright-skript i headless Chromium.

- [x] `[P2]` (rättad 2026-11-24, `dbfafba`) Bugg: skrev man ett antal i samlingslistan och klickade direkt på ett + (utan Tab först) försvann klicket. Ett + på en annan rätt gjorde ingenting, ett + på samma rätt gav det inskrivna värdet i stället för värdet plus ett steg. Orsak: change-hanteraren väntade en tick och skrev sedan över valen med en kopia tagen före klicket, och omritningen bytte ut knappen medan den hölls nere. Nu sparas det inskrivna värdet direkt och omritningen väntar tills tryckningen är klar. Verifierat: Playwright-skript (Bread 10 och klick på + vid Cooked boar meat, Bread 20 och klick på +2) failar på gamla koden och passerar på nya vid 390 och 1440 px; Tab, Enter och klick passerar i Chromium, Firefox och WebKit; ny kontroll i `test-dom.mjs` failar på gamla koden.
- [x] `[P3]` (rättad 2026-11-24, `803860a`) Bugg: på förstabesöket visades navigeringen (Best food, Overview, Gather list, Resources) men alla fyra sektioner var dolda, så länkarna ledde ingenstans. Nu döljs navigeringen tills ett biom är valt, som biomväljaren i sidhuvudet. Verifierat: Playwright-skript (dold vid förstabesök, synlig efter Continue och vid omladdning, länken till Gather list fungerar) failar på gamla koden och passerar på nya; CLS vid förstabesöket oförändrat (0,030 före, 0,034 efter, lokalt, 390 px); `test-dom.mjs` kontrollerar `#nav`.
- [x] `[P3]` (rättad 2026-11-24, `d90d3cd`) Tillgänglighet: kombostegarnas knappar hette alla "Add one round" och "Remove one round", 30 likadana namn med Plains valt. Nu "Add one round of Cooked serpent meat, Serpent stew, and Fish wraps". Verifierat i Chromium: 30 namngivna, 0 utan trio, Enter två gånger behåller fokus och räknar till 2; `test-dom.mjs` kontrollerar namnen.

Inte ändrat: skräp i antalsfältet (till exempel `1e400` eller bokstäver i Firefox) ger tomt värde och tar bort valet. Det är ett medvetet beteende som `test-dom.mjs` redan kontrollerar (`x` tar bort).
