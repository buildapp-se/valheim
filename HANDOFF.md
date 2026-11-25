---
schemaVersion: 1
status: active
currentGoal: Valheim Food Planner live at buildapp.se/valheim with verified data through Deep North
nextAction: Patrik decides whether the datamined wiki pages are enough to drop the four unverified flags
blockers: []
reviewedAt: 2026-11-25
---
**2026-11-25, webbläsarpass (gren `xb/2026-11-25`, worktree `C:\dev\_wt\valheim-1125x`).** Flödena körda i WebKit (Playwright) med iPhone 13-profilen, Firefox vid 1440 px och Chromium, Playwright 1.64.1. Lika i alla tre utom två saker. (1) `1d1aac7` sökfältet och biomväljaren har 16 px text i stället för 15, eftersom iOS Safari zoomar in fält under 16 px vid fokus (iOS inte testat, bara uppmätt storlek). (2) Inte ändrat, kräver Patrik: decimalkomma i antalsfältet tar bort valet i Firefox (medvetet beteende för skräp sedan 2026-11-24). Detaljer i BACKLOG.md under Webbläsarpass 2026-11-25. `npm test` grönt. Pushad till main; deployen föll fyra gånger på artefaktfelet, den femte gick igenom, och skripten passerar mot https://buildapp.se/valheim/. Klar.
**2026-11-25, P3-funktionspass (gren `p3/2026-11-25`, worktree `C:\dev\_wt\valheim-1125p`).** Öppna P3 och oprioriterade: bara en kunde byggas utan beslut. (1) `840d54c` om `app.js` inte laddas är navigeringen osynlig och en ruta säger att sidan inte laddade (detaljer i BACKLOG.md under Andra användarbuggjakten 2026-11-24). Kvar, kräver Patrik: kontrasten på avbockad resurs (smak), cachehuvud för `?v=`-adresserna (Cloudflare-zonregel), manifest för icon-192/512 (beslut), wikiflaggorna. Kvar, för stort för passet: omritningen per klick (Fart P3). `npm test` grönt. Pushad till main; första deployen föll på 0 artefakter trots väntesteget, en ny `gh workflow run` gick igenom, och Playwright-skripten passerar mot https://buildapp.se/valheim/. Klar.
**2026-11-25, scenariojakt (gren `scen/2026-11-25`, worktree `C:\dev\_wt\valheim-1125c`).** Flerstegsscenarier med Playwright-skript mot lokal server: en vecka komprimerad, två flikar, Deep North med alla 115 val, gårdagens sparade läge, byte av bredd mitt i flödet. (1) `37e9432` ett val sparat med annat skiftläge räknades som dolt för alltid, rättat i `load()`. (2) `c1eb17d` typsnitten självhostas i `fonts/`, sekretesstexten version 1.3, live värdar 4 till 2 och återbesökets FCP 2072 till 1304 ms. (3) `80129a8` deployen väntar tills Pages-artefakten syns i körningens lista innan `deploy-pages` (felet "Found 0 artifact(s)" föll tre gånger i rad i dag); första körningen med steget lyckades. Pushad till main och deployad, scenarioskripten passerar mot https://buildapp.se/valheim/. Detaljer och siffror i BACKLOG.md under Scenariojakt 2026-11-25. Kvar, inte ändrat: hela sidan ritas om per klick (600 till 850 ms vid 4x CPU på Deep North), BACKLOG P3. `npm test` grönt. Klar.
**2026-11-25, fart-, tillgänglighets- och metadatapass (gren `speed/2026-11-25`, worktree `C:\dev\_wt\valheim-1125s`, pushad till main, klar).** Mätt live med Playwright-skript (390 px med 4x CPU och Slow 4G, samt 1440 px). (1) `745d37a` `modulepreload` för `data.js`, `model.js` och `ui.js`, och deployen versionstaggar dem som importerna; förut hämtades de först när `app.js` var klar. (2) `8b2d77a` canonical på båda sidorna, description och favikoner på `privacy.html` (saknades). axe 0 överträdelser före och efter. Siffror i BACKLOG.md under Fartpass 2026-11-25. Deployen föll en gång på 0 artefakter igen, en ny `gh workflow run deploy.yml --ref main` gick igenom.
**2026-11-24, andra användarbuggjakten (gren `hunt2/2026-11-24`, worktree `C:\dev\_wt\valheim-1124k`, pushad till main, klar).** Det batch 6 inte gick: sekretesssidan, återbesök med trasigt sparat läge, två flikar, Untick all plus Next biome, Deep North med Combos, blockerade typsnitt, uteblivet `app.js`, alla länkar (alla 200). Fyra rättade, detaljer i BACKLOG.md under Andra användarbuggjakten 2026-11-24: (1) `ff7f176` sparat läge som inte passar (okänt biom, `null`, okänd sortering) gav tom sida, (2) `ff7f176` Untick all räknade och bockade av alla spelets råvaror, (3) `ba1597d` en andra flik skrev över valen från den första, (4) `c64cd73` sidfotens sekretessruta hade fel datum och typsnittsrad mot `privacy.html` 1.2. `npm test` grönt, nya kontroller failar på gamla koden. Deployen föll tre gånger (två gånger 0 artefakter, en gång "Deployment failed, try again later"), fjärde `gh workflow run deploy.yml --ref main` gick igenom; båda Playwright-skripten passerar mot https://buildapp.se/valheim/. Kvar, inte ändrat: utan `app.js` visas navigeringen över tomma sektioner (BACKLOG P3, avvägning mot CLS).
**2026-11-24, användarbuggjakt (gren `hunt/2026-11-24`, worktree `C:\dev\_wt\valheim-1124h`).** Appen genomgången som spelare vid 390 och 1440 px med Playwright-skript mot lokal server. Tre rättade, en commit var, detaljer och verifiering i BACKLOG.md under Användarbuggjakt 2026-11-24: (1) `dbfafba` ett + klickat direkt efter ett inskrivet antal försvann, (2) `803860a` navigeringen visades på förstabesöket fast länkarna ledde till dolda sektioner, (3) `d90d3cd` kombostegarnas knappar hade 30 likadana namn. `npm test` grönt. Pushad till main (`00bf3d3`), deployen gick igenom, och samma fyra Playwright-skript passerar mot https://buildapp.se/valheim/ (Firefox och WebKit med för inskrivet antal plus Tab, Enter och klick). Klar.
**2026-11-24, funktionspass (gren `feat/2026-11-24`, worktree `C:\dev\_wt\valheim-1124f`).** Öppna P0 till P2 i backloggen kräver fortfarande Patriks beslut (wikiflaggorna) och P3-kontrasten ett smakbeslut, så passet letade användarbuggar i appen. En hittad och rättad (`3f93064`): omritningen tappade tangentbordsfokus efter varje klick. Detaljer och verifiering i BACKLOG.md under Funktionspass 2026-11-24. `npm test` grönt. Pushad till main och deployad; samma Playwright-skript passerar mot https://buildapp.se/valheim/. Deployen: första körningen föll på att `deploy-pages` hittade 0 artefakter (GitHub-fel), och "rerun failed" kan inte lyckas eftersom körningen då har två `github-pages`-artefakter. En ny körning med `gh workflow run deploy.yml --ref main` (Elwyndaz-token) gick igenom.
**2026-11-24, djuppass (gren `deep/2026-11-24`, worktree `C:\dev\valheim-deep-1124`, pushad till main, klar).** Backloggen: inget kvar som en agent kan stänga ensam (samma bedömning som svepet). (1) `test-dom.mjs` (`50944e1`): kompilerade `app.js` körs mot `index.html` i linkedom och klickas igenom, del av `npm test` och därmed deployspärren. Skalet kastar som en webbläsare på ogiltiga taggnamn, något linkedom annars släpper igenom. (2) Mutationstest på `src/ui.ts` och `src/app.ts` (Stryker 9, command runner, `node test.mjs && node test-dom.mjs --fail-fast`): ui 100 %, app 94,18 % till 98,9 %. De 16 som överlever är likvärdiga: `dir: ''` beter sig som `desc`, `biomeRank(null)` är -1, `?.` på poster som alltid har `food` eller `recipe`, reservvärden som aldrig nås, cachenyckeln (bara prestanda), `selected` med valfritt värde. Ingen bugg hittad. (3) ux-audit lokalt: tom samlingslista säger nu vad man gör (`7e1dfbc`), deployad och kontrollerad i live `dist/app.js`. Kontrollkonfigurationen är inte incheckad (`stryker.tmp.json` i worktree, `mutate` begränsad till rad 52 till 251 i sista körningen).

**2026-11-24, backloggsvep (gren `sweep/2026-11-24`, worktree `C:\dev\valheim-sweep-1124`, pushad till main).** Inga öppna P0 till P2 som en agent kan stänga: P1 Oatmeal och P2 Kale Chips, Oat flour, Pulled Bear väntar på Patriks beslut om de dataminade wikisidorna räcker, P3-kontrasten på avbockad resurs är ett smakbeslut. (1) Bugg rättad: ett valt rätt vars rad doldes (råvara avbockad, feasts av, lägre biom) låg kvar i råvarutotalerna och i navmärket och gick bara att ta bort med Clear. Nu räknas bara val med synlig rad (`shownPicks()` i `src/app.ts`), de dolda sparas och huvudet säger hur många som är dolda. Verifierat: `npm test` grönt, headless Chrome-skript (välj Bread, bocka av Barley: Barley försvinner ur totalerna, märket 2 till 1, notis visas, återbockning återställer) som failar på gamla koden och passerar på nya, ingen horisontell scroll vid 390 px. (2) Livemätningar som HANDOFF listade som kvar: Lighthouse mobil CLS 0,031 (prestanda 89, övriga 100), W3C Nu 0 fel på livesidan (`blocking="render"` godtas), live `icons/og.png` byte-identisk med det nya kortet. Auditraderna i CONTEXT.md uppdaterade. Kvar att kolla: pekskärmsikonen på en iPhone-hemskärm (kräver en iPhone).

**2026-11-04, förbättringsrunda (gren `claude/forbattringar-2026-11-04`, PR #1, mergad 2026-11-04).** Fyra rättningar, en commit var. (1) Staplarna: `aria-label` på `<span>` utan roll (axe `aria-prohibited-attr`, 464 noder med biom valt; tidigare axe-körningar såg bara förstabesöket). Nu ett `role="img"` per stapel med hela avläsningen. (2) Tryckytor under 900 px: matpiller 32 till 44 px, märket efter en pille 28 till 44, stegknappar 42 till 44 (ramen åt 2 px), sekretesssidans tillbakalänk 23 till 44. (3) Fokusringen syntes inte på knappar med `all: unset` (stegknappar, märken, sorteringsrubriker, expand, biomrutor): 251 av 400 tabbstopp utan ring, nu 0. Hopplänken sköt ned sidhuvudet vid fokus, nu ligger den ovanpå. (4) `icons/og.png` renderad från nya `og.source.html` i stället för skärmklippet med avklippt rubrik. Verifierat lokalt: `npm test` 15 kontroller gröna, axe 0 överträdelser vid 390 och 1280 px i båda lägena, ingen horisontell scroll vid 390. Inte gjort: kontrasten på avbockad resurs (kräver smakbeslut, se BACKLOG), desktopkontrollerna på 36 px (medvetet val för mus). Inte mätt live.

**2026-11-04, mutationstest (gren `claude/mutation-2026-11-04`, PR #2, mergad 2026-11-04).** Stryker 9 med command runner mot `npm test` på `src/model.ts`, den enda rena logikfilen: 69,23 % till 89,35 % (169 mutanter). Åtta nya kontroller i `test.mjs` (15 till 23): `getItem` före `loadItems`, råvaror, `gather` med valen i omvänd ordning (djupet på delade mellanvaror), noll och negativa val, varje builds formel, `sumOf` och tie-break i `bestCombos`. De 18 kvar är UI-text i `BUILDS` eller likvärdiga. Ingen bugg, ingen produktionskod ändrad. TypeScript 7 saknar API:t Stryker skriver om tsconfig med: peka `tsconfigFile` på en fil som inte finns. PR #1 lägger in en post på samma ställe, så den som mergas sist får en enkel konflikt (behåll båda).

**2026-11-02:** kontaktadressen är nu `kontakt@buildapp.se` (förut `kontakt@orgutveckling.se`). Integritetstexten version 1.2.

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

`npm test` compiles with `tsc` and runs `test.mjs`: every ingredient resolves, no item needs a later biome than its own, gather rounding on shared intermediates, and the wiki's published max combos at Ashlands (300 health, 270 eitr). Then `test-dom.mjs` loads `dist/app.js` into `index.html` in linkedom and clicks through every section; `--fail-fast` stops at the first failure (used by mutation runs).

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

## Overnight batch, 2026-10-06 (branch `batch/2026-10-06`, merged to main and deployed 2026-10-07)

Five backlog items, one commit each. Merged to main and deployed 2026-10-07 on Patrik's order (the deploy workflow runs on push to main).

- `e9beffd` Search field above the gather list. Matches name, station, ingredients and mead effect. Rows are hidden in place, so typing keeps focus; the text is view-only state. Checked headless in Chrome (desktop, phone) and Firefox.
- `e03cac0` CLS. The empty shell was painted before `app.js` drew the page, then header, main and footer jumped. The script now sits in the head with `blocking="render"` and `main` has `min-height: 100vh`. Local, throttled mobile Chrome: first visit 0,24 to 0,00, returning visit 0,87 to 0,09. What is left on a returning visit is the font swap (Grenze against Georgia rewraps the build titles). Browsers without `blocking=render` (Firefox, Safari) keep the header jump, about 0,2 in a Chrome run with the attribute removed. Not measured live, and not run through the W3C validator (html-validate: 0 findings).
- `2958889` Contrast on the three hero texts axe could not judge: lowest 5,35:1, AA passes, no code change. The same run found a real failure that is now its own backlog item: an unticked resource row is 1,98:1.
- `efa0664` PNG icons in `icons/`, linked in the head, copied by the deploy workflow. Made once by screenshot from the two SVG marks, no rasteriser in the build. The assemble and version-tag steps of the workflow were replayed locally and the result served: all five PNGs load at the right size. icon-192/512 are unreferenced until there is a web manifest.
- `4ceec77` Wiki recheck, Food and Mead tables. Oven Pancake, Kale Chips and Berserkir mead corrected, seven mead cooldowns, one new test. Footer date is now 2026-10-06. See Data in `CONTEXT.md`.

Still open: the two verify-in-game items (the wiki now backs all four flags with datamined values, the flags were kept) and the unticked-resource contrast, which needs a decision on how unticked should look.

Still to check now that it is live: Lighthouse CLS on the live page, W3C on the new `blocking` attribute, and the touch icon on an iPhone home screen.

## Beroendeuppdatering 2026-10-17

- typescript 7.0.2 (Go-versionen), inga kodändringar. `npm test` (tsc plus `test.mjs`) grön före och efter, `npm audit` 0. Inte pushat: en push till `main` deployar.
