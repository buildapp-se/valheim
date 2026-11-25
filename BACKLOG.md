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

## Andra användarbuggjakten 2026-11-24

Det batch 6 inte gick: sekretesssidan, sidfotens sekretessruta, återbesök med gammalt eller trasigt sparat läge, två flikar, Untick all och sedan Next biome, Deep North med Combos och feasts vid 390 och 1440 px, typsnitt blockerade, långsamt och uteblivet `app.js`, alla interna och externa länkar (HEAD/GET, alla 200). Lokal server, Playwright-skript i headless Chromium, samma skript passerar mot https://buildapp.se/valheim/ efter deployen.

- [x] `[P2]` (rättad 2026-11-24, `ff7f176`) Bugg: ett sparat läge som inte längre passar gav en tom sida. Ett biomnamn som inte finns gömde både väljaren och sektionerna, `picks` eller `off` som `null` och en okänd sortering kastade fel och tömde sidan. Nu tas varje sparat fält bara om det passar, annars gäller standardvärdet. Verifierat: Playwright-skript (sex trasiga lägen) visar tom sida på gamla koden och fungerande sida på nya; två nya kontroller i `test-dom.mjs` failar på gamla koden.
- [x] `[P3]` (rättad 2026-11-24, `ff7f176`) Bugg: Untick all i Meadows sa "69 resources skipped" fast Resources visar 9, eftersom alla spelets råvaror räknades. Nu räknas och avbockas bara de synliga (och de redan avbockade), så nästa biom kommer med sina råvaror ibockade som standard. Verifierat: skriptet ger 9 i stället för 69 och 9 av 18 avbockade efter Next biome (var 18 av 18); `test-dom.mjs` kontrollerar 18 vid Black Forest.
- [x] `[P2]` (rättad 2026-11-24, `ba1597d`) Bugg: med sidan öppen i två flikar skrev nästa klick i den ena över det som lagts till i den andra (Raspberries i flik A, Honey i flik B: bara Honey sparat). Nu läser fliken in det sparade läget när en annan flik sparar (`storage`-händelsen). Verifierat: Playwright-skript med två flikar sparar båda; ny kontroll i `test-dom.mjs` failar på gamla koden.
- [x] `[P3]` (rättad 2026-11-24, `c64cd73`) Innehåll: sidfotens sekretessruta sa "Last updated 14 September 2026" och att Google Fonts bara levererar rubriktypsnittet, medan `privacy.html` är version 1.2 från 2 november och säger alla tre. Nu samma datum, version och typsnittsrad. `test-dom.mjs` jämför datum och version mot `privacy.html`.
- [ ] `[P3]` Om `app.js` inte laddas (nätfel) visas navigeringen med fyra länkar till tomma sektioner och ingen text om vad som hände. Att dölja navigeringen i HTML och visa den från skriptet kan flytta sidhuvudet i Firefox och Safari (som saknar `blocking="render"`), alltså ett avvägande mot CLS. Inte ändrat.

## Fartpass 2026-11-25

Live på https://buildapp.se/valheim/ med Playwright-skript i headless Chromium: 390 px med 4x CPU-strypning och Slow 4G (150 ms, 1,6 Mbit/s), och 1440 px utan strypning. En körning per läge före och efter, så siffrorna har brus på 50 till 100 ms. axe-core 4.14.0 på index (förstabesök och Plains valt) och `privacy.html` i båda bredderna.

- [x] `[P3]` (rättad 2026-11-25, `745d37a`) Fart: `app.js` importerar `data.js`, `model.js` och `ui.js`, som webbläsaren hittade först när `app.js` var nedladdad (strypt mobil: start 594 ms, klart 827 ms, FCP 1036 ms). Nu `modulepreload` i head, och deployen versionstaggar dem så att adresserna matchar importerna. Efter, tre körningar: alla fyra startar samtidigt (223 till 303 ms) och är klara när `app.js` är klar, FCP 816 till 904 ms. LCP 390 px förstabesök 1104 till 884 ms, återbesök 1804 till 1268 ms, 1440 px förstabesök 396 till 200 ms. CLS oförändrat (0,035 på 390 px förstabesök). Överföring 148 KB, oförändrat.
- [x] `[P3]` (rättad 2026-11-25, `8b2d77a`) Metadata: `privacy.html` saknade description och favikon. Nu båda, plus canonical på båda sidorna (index pekar på `https://buildapp.se/valheim/`, samma som `og:url`). Verifierat live: alla fem taggar på plats, axe 0.
- Kontrollerat, inte ändrat: axe 0 överträdelser före och efter i alla sex lägen. Inga `<img>` på sidorna (ikonerna är en inline SVG-sprite), så inget att lata-ladda eller storleksätta. Tre woff2-filer laddas (Plex Sans 45 KB, Grenze 37 KB, Plex Mono 15 KB) med ett års cache från Google; vikterna per familj är inte genomgångna. Ingen manifest, sidan är ingen PWA. `privacy.html` har ingen OG-bild, den delas inte.
- [ ] `[P3]` Cache: `style.css` och `dist/*.js` är versionstaggade men skickas med `max-age=14400` (GitHub Pages bestämmer, går inte att ändra i repot), `index.html` med 600. Ett längre cache-huvud för `?v=`-adresserna kräver en Cloudflare-cacheregel på zonen, som delas med andra projekt. Inte ändrat. Cloudflare lägger också in `email-decode.min.js` (e-postskydd för mailto-länken i sidfoten), en zoninställning.
