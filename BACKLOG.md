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
- [x] `[P3]` (rättad 2026-11-25, `840d54c`) Om `app.js` inte laddas (nätfel) visas navigeringen med fyra länkar till tomma sektioner och ingen text om vad som hände. Att dölja navigeringen i HTML och visa den från skriptet kan flytta sidhuvudet i Firefox och Safari (som saknar `blocking="render"`), alltså ett avvägande mot CLS. Löst utan avvägningen: navigeringen har `visibility: hidden` (tar samma plats, flyttar inget) tills `app.js` har ritat sidan och satt `ready` på `<html>`, och en ruta i `main` säger "The planner did not load" efter 3 s om `ready` aldrig kommer (nätfel, JavaScript av, krasch vid start). Verifierat: Playwright-skript i Chromium, Firefox och WebKit vid 390 och 1440 px (vanlig laddning: navigeringen syns, rutan inte; `app.js` blockerad: navigeringen osynlig, rutan dold vid 1 s och synlig efter 3 s; `app.js` 2 s långsam: rutan visas aldrig) passerar lokalt, och fallet med blockerad `app.js` failar mot den gamla livesidan; CLS i Chromium 390 px oförändrat (förstabesök 0,036, återbesök 0,009, lokalt och gamla live lika); ny kontroll i `test-dom.mjs` failar utan ändringen i `app.ts`. Live på https://buildapp.se/valheim/ (`84d9938`): samma skript passerar i alla tre webbläsare, CLS 0,036 och 0,008.

## Fartpass 2026-11-25

Live på https://buildapp.se/valheim/ med Playwright-skript i headless Chromium: 390 px med 4x CPU-strypning och Slow 4G (150 ms, 1,6 Mbit/s), och 1440 px utan strypning. En körning per läge före och efter, så siffrorna har brus på 50 till 100 ms. axe-core 4.14.0 på index (förstabesök och Plains valt) och `privacy.html` i båda bredderna.

- [x] `[P3]` (rättad 2026-11-25, `745d37a`) Fart: `app.js` importerar `data.js`, `model.js` och `ui.js`, som webbläsaren hittade först när `app.js` var nedladdad (strypt mobil: start 594 ms, klart 827 ms, FCP 1036 ms). Nu `modulepreload` i head, och deployen versionstaggar dem så att adresserna matchar importerna. Efter, tre körningar: alla fyra startar samtidigt (223 till 303 ms) och är klara när `app.js` är klar, FCP 816 till 904 ms. LCP 390 px förstabesök 1104 till 884 ms, återbesök 1804 till 1268 ms, 1440 px förstabesök 396 till 200 ms. CLS oförändrat (0,035 på 390 px förstabesök). Överföring 148 KB, oförändrat.
- [x] `[P3]` (rättad 2026-11-25, `8b2d77a`) Metadata: `privacy.html` saknade description och favikon. Nu båda, plus canonical på båda sidorna (index pekar på `https://buildapp.se/valheim/`, samma som `og:url`). Verifierat live: alla fem taggar på plats, axe 0.
- Kontrollerat, inte ändrat: axe 0 överträdelser före och efter i alla sex lägen. Inga `<img>` på sidorna (ikonerna är en inline SVG-sprite), så inget att lata-ladda eller storleksätta. Tre woff2-filer laddas (Plex Sans 45 KB, Grenze 37 KB, Plex Mono 15 KB) med ett års cache från Google; vikterna per familj är inte genomgångna. Ingen manifest, sidan är ingen PWA. `privacy.html` har ingen OG-bild, den delas inte.
- [ ] `[P3]` Cache: `style.css` och `dist/*.js` är versionstaggade men skickas med `max-age=14400` (GitHub Pages bestämmer, går inte att ändra i repot), `index.html` med 600. Ett längre cache-huvud för `?v=`-adresserna kräver en Cloudflare-cacheregel på zonen, som delas med andra projekt. Inte ändrat. Cloudflare lägger också in `email-decode.min.js` (e-postskydd för mailto-länken i sidfoten), en zoninställning.

## Scenariojakt 2026-11-25

Flerstegsscenarier med Playwright-skript i headless Chromium mot lokal server: en vecka komprimerad (Meadows, tre +, två biom framåt, kombo +, avbockad råvara och tillbaka, lägre biom, inskrivet antal, minus, Clear, nytt val), två flikar (val i båda, sökning i A medan B sparar: fokus, markör och text kvar, biombyte i B följer med till A), Deep North med alla 115 rätter och mjöder valda (28 170 portioner) vid 390 px och 4x CPU, gårdagens sparade läge med avvikande skiftläge, ej stegade antal, okända namn och negativa värden, och byte 390 till 1440 till 390 px mitt i ett flöde (öppen popover, expanderad rad). Import, export, inloggning och service worker finns inte i appen.

- [x] `[P3]` (rättad 2026-11-25, `37e9432`) Bugg: ett val sparat med annat skiftläge (`bread` i stället för `Bread`) togs emot av `load()`, eftersom `getItem` bortser från skiftläge, men låg kvar under det gamla namnet. Raden visades aldrig, valet räknades som "1 more entry hidden by feasts, resources or biome" och gick bara att ta bort med Clear. Skulle slå till om en rätt i `src/data.ts` byter skiftläge (`Pulled Bear`, `Kale Chips` och `Oven Pancake` avviker redan från resten). Nu sparas valet under rättens eget namn, och två stavningar av samma rätt läggs ihop. Verifierat: scenarioskriptet och en ny kontroll i `test-dom.mjs` failar på gamla koden och passerar på nya.
- [x] `[P3]` (gjort 2026-11-25, `c1eb17d`) Fart och integritet: typsnitten självhostas (latin-delmängderna från Google, `fonts/`), så sidan pratar bara med buildapp.se. Sekretesstexten version 1.3 (Google Fonts borttaget, i `privacy.html` och sidfoten), `test-dom.mjs` kontrollerar att ingen sida länkar Google Fonts. Mätt lokalt, 390 px, 4x CPU, Slow 4G, median av tre: värdar 3 till 1, förstabesök FCP 1148 till 1164 ms (brus) och typsnitt klara 1672 till 1627 ms, återbesök FCP 1944 till 1824 ms och typsnitt klara 2290 till 2069 ms, CLS oförändrat. `preload` på två typsnitt provades och togs bort: FCP blev 340 ms sämre på strypt nät. Live på https://buildapp.se/valheim/ med samma skript, före och efter deployen: värdar 4 till 2 (kvar: buildapp.se och Cloudflares analysskript), förstabesök FCP 956 till 788 ms och typsnitt klara 1437 till 1344 ms, återbesök FCP 2072 till 1304 ms och typsnitt klara 2760 till 1770 ms. Tre körningar per läge, så nätbrus ingår.
- [ ] `[P3]` Fart: varje klick ritar om hela sidan. Vid Deep North med feasts är det 9 313 DOM-noder, och ett + tar 600 till 850 ms till nästa bildruta vid 4x CPU (390 och 1440 px, oberoende av antal val: 10 eller 115 ger samma). Ungefär en tredjedel är JavaScript (`h()`, `replaceChildren`), resten stil och layout. `content-visibility: auto` på sektionerna provades: ingen vinst. Att bara rita om det som ändrats är en större omskrivning av `render()`, inte gjord.
- [x] `[P2]` (rättad 2026-11-25, `80129a8`) Deploy: `deploy-pages` hittade 0 artefakter direkt efter en lyckad uppladdning (loggen: uppladdad och slutförd 05:35:23,17, "Found 0 artifact(s)" samma sekund). Så föll de flesta körningar 2026-11-24 och 25, och varje gång krävdes nya `gh workflow run`. Nu väntar ett steg tills körningens artefaktlista visar `github-pages` (`actions: read`). Första körningen med steget: listad efter 1 försök, deployen lyckades. En körning bevisar inte att felet är borta. 2026-11-25 09:17 föll det igen trots steget ("listed after 1 tries", sedan "Found 0 artifact(s)" samma sekund), en ny `gh workflow run deploy.yml --ref main` gick igenom. Väntesteget räcker alltså inte. zizmor: samma 5 höga `unpinned-uses` som före ändringen (actions på tagg, inte SHA), inga nya.

## Webbläsarpass 2026-11-25

Samma flöden i WebKit (Playwright) med enhetsprofilen iPhone 13 (390 px, pekskärm, mobil-UA), Firefox vid 1440 px och Chromium i båda lägena, lokal server, Playwright 1.64.1 (webkit-2370, firefox-1555). Förstabesök, biomval, kombo +, samlingslistans antalsfält (`2,5`, `4`, `6,0`, `3.5`, tomt, inskrivet antal och sedan +), sökning, popover och Esc, sorteringsrubrik, expanderad rad, resursruta, omladdning, två flikar, sticky nav, horisontell scroll, scrollposition efter tryck på + och resursruta. Lika i alla tre utom det som står nedan. Appen har inga datum, ingen urklipps- eller delningsknapp, ingen service worker, ingen IndexedDB, inget `<dialog>` och ingen av `:has`, containerfrågor, `dvh`, `backdrop-filter`, `subgrid`, lookbehind eller `structuredClone`; `Intl.ListFormat` (kombostegarnas namn) ger samma text i alla tre. Ett headless WebKit på Windows är ingen iPhone: iOS är inte testat.

- [x] `[P3]` (rättad 2026-11-25, `1d1aac7`) iPhone: sökfältet i samlingslistan och biomväljaren i sidhuvudet hade 15 px text. iOS Safari zoomar in sidan när ett fält under 16 px får fokus (dokumenterat beteende i Safari, zoomen i sig går inte att återskapa i Playwright och är inte testad på en iPhone). Nu 16 px på båda. Verifierat: Playwright-skript som kräver minst 16 px på varje textfält och väljare vid 390 px failar på livesidan före ändringen (båda 15 px i WebKit, Chromium och Firefox) och passerar på nya; sidhuvudet lika högt i alla tre motorer vid 390 och 1440 px, väljaren 5 till 6 px bredare, ingen horisontell scroll. Live på https://buildapp.se/valheim/ (`bd4079a`): skriptet passerar i alla tre, och hela flödet i WebKit (Playwright) med iPhone 13-profilen ger samma resultat som lokalt.
- [ ] `[P3]` Firefox: decimalkomma i antalsfältet. `2,5` eller `6,0` är ogiltigt för `type=number` i Firefox, fältet blir tomt och valet tas bort. Chromium och WebKit läser samma inmatning som 2,5 och 6 och avrundar till hela kok. Ändras inte här: att skräp tar bort valet är ett medvetet beteende (se Användarbuggjakt 2026-11-24), och Firefox lämnar inte ut den inskrivna texten, så alternativet är att behålla det gamla värdet vid ogiltig inmatning. Kräver Patriks beslut.
- Deployen 2026-11-25 12:16 till 12:23: push-körningen och tre nya `gh workflow run` föll ("Fetching artifact metadata failed", sedan 0 artefakter), den femte gick igenom efter två minuters paus. Se P2-posten om deployen under Scenariojakt 2026-11-25.
- Kontrollerat, inte ändrat: i WebKit flyttar ett klick eller tryck inte fokus till knappen (Safaris standardbeteende), så fokus står på `<body>` efter ett + i stället för på knappen som i Chromium. Ingen synlig skillnad: scrollpositionen står still i alla tre, och tangentbordsfallet (Tab och Enter) passerade i WebKit redan 2026-11-24.

## Preferenspass 2026-11-25

Text och användarinställningar. Allt användarvänt i `index.html`, `privacy.html` och `src/*.ts` läst (appen är på engelska). Sedan Playwright 1.64.1 i headless Chromium mot lokal server, skript `prefs.mjs` (förstabesök, Plains valt och `privacy.html`): `colorScheme` mörkt och ljust, `reducedMotion: reduce`, 200 % zoom (CSS-bredd 640 och 195 px med dpr 2, alltså 1280 och 390 px) och `forcedColors: active`.

- [x] `[P3]` (rättad 2026-11-25, `ec843eb`) Text: fyra tankstreck i hjälptexterna (hjälteraden, biomväljaren, samlingslistans ingress) ersatta med kommatecken, kolon och semikolon, och singular vid 1: "1 food", "1 portion". `test-dom.mjs` kontrollerar "1 entry · 1 portion".
- [x] `[P2]` (rättad 2026-11-25, `6c2f2c3`) Forced colors: fokusringen var en `box-shadow` med `outline: none`, och forced colors tar bort skuggor, så tangentbordsfokus syntes inte på någon kontroll (24 sorters element på de tre sidorna). Nu `outline: 2px solid transparent` under skuggan: osynlig i vanligt läge, systemfärgad i forced colors.
- [x] `[P3]` (rättad 2026-11-25, `6c2f2c3`) Forced colors: staplarna i översikten och färgrutorna i förklaringen är bara bakgrunder och blev tomma. Nu `forced-color-adjust: none` på dem.
- [x] `[P3]` (rättad 2026-11-25, `6c2f2c3`) 200 % zoom vid 390 px: spoilerchippen (`white-space: nowrap`) och lagringsnyckeln `valheim-food-planner:v1` i `privacy.html` och sidfoten gick inte att bryta, så sidan scrollade i sidled (247 och 261 px på 195). Nu bryts chippen och `code` får `overflow-wrap: anywhere`. Sidhuvudets mått vid 100 % oförändrade vid 320, 390, 768, 1280 och 1440 px.
- Verifierat: `prefs.mjs` ger 7 fel mot livesidan före ändringen och 0 lokalt efter; `npm test` grönt. Live efter deployen (`6c2f2c3`): 0 fel.
- Kontrollerat, inte ändrat: sidan har bara mörkt tema (`color-scheme: dark`), samma i båda lägena och ingen text under 3:1. Reducerad rörelse stänger redan av märkets puls och kryssrutans övergång (ingen animation eller övergång över 10 ms efter ett +), ingen mjuk scroll. Kryssrutor och knappar har kant i forced colors.

