# Valheim Food Planner

Static web app at `buildapp.se/valheim/` for picking Valheim food. Listed last on the buildapp.se front page (since 2026-09-15). English only. Desktop first, works at phone width.

## What it does

- **Biome gate.** First visit asks for the highest biome reached. Everything from later biomes is hidden: foods, meads, resources, combos. Header has "Next biome" (one step) and "Show all".
- **Best food.** Top 5 three-food combos per build, from dishes whose whole ingredient tree is ticked in Resources. Feasts behind a toggle, default off.
- **Overview.** Every food with a stacked bar (red health, yellow stamina, blue eitr) and a thin green hp/tick bar. Column headers sort: first click biggest first (Food A to Z), second click flips. Station sorts by the level number in the station name, none counts as 0. "Per biome" (default on) sorts inside biome groups, highest biome first; off gives one flat list with a biome tag. "Combos" switches to the top 30 three-food sums for the clicked column; Food and Station order the top 30 by total.
- **Best-food cards** show health, stamina, eitr, total, hp/tick and duration per combo.
- **Gather list.** Dishes and meads counted in portions, one per thing you eat. Steppers move in whole crafts: a dish that makes 3 per craft steps by 3, a feast by 10 (one placed feast serves 10, wiki Feast page). The big buttons are five crafts, the in-game shift-click. Dishes that do not step by 1 carry an i tooltip explaining why. Meads show their effect in small text on the name line and "Mead ketill + Fermenter: ingredients" on the second line. Output: raw resources grouped by biome with source, plus crafting order, feasts shown as feasts = portions.
- **Resources.** Checklist of raw resources up to your biome, all ticked by default, each with a one-line source. An unticked resource hides every dish and mead that needs it, anywhere in its recipe tree, from every section.
- **Combo stepper.** Each combo shows `− N +`: plus adds one craft of each of its three foods to the gather list, N is how many full rounds the list holds.

## Build scores

Three foods, summed. Decided in the grill 2026-09-14.

| Build | Score |
|---|---|
| Max health / stamina / eitr | that stat |
| Warrior | H + S − abs(H − S) |
| Mage | 2E + H + S − abs(H − S) |
| Max total | H + S + E |

Ties break on summed hp/tick, then on the shortest duration.

## Look

Redesigned 2026-09-14 from a Claude Design handoff: **carved dark wood, cold iron, one ember**.
Flat plank surfaces with a hairline top light and a 2px radius; firelight only on the active
section, the chosen biome and the primary action. Dark theme only.

- Tokens live at the top of `style.css` as custom properties. Surfaces `--bg/--plank/--plank-2`,
  ink `--ink/--ink-2/--ink-3`, accent `--ember/--ember-hi`. Old names (`--gold`, `--text`,
  `--panel`) are kept as aliases so `privacy.html` keeps resolving.
- Type: Grenze (display), IBM Plex Sans (UI), IBM Plex Mono (every number, so columns align).
  One Google Fonts request, three families.
- Stat colours keep their meaning, shades lifted for AA on the new ground:
  health `#ef6b5e`, stamina `#e8c24a`, eitr `#6ea8ff`, regen `#63c48b`.
- Content max width is 1280 (was 1600): six build cards over 1600 made comparing combos a
  head-turn. Build cards are two columns, never three, because that is what the longest
  three-food pill line needs.
- Icons are one original set on a 24px grid, 1.75px stroke, `currentColor`, shipped as a hidden
  `<symbol>` sprite at the top of `index.html` and used via `<svg class="ic"><use href="#id">`.
  Names are kebab-case: `icon-*` stats, `biome-*`, `station-*`, `ui-*`, plus `app-icon` (the
  rune-cut V, also the favicon as an inline data URI).
- Four sections stay **one scrolling page**, not tabs: choosing a combo, checking the numbers and
  gathering is one workflow, and tabs would hide the gather list exactly while it is being filled.
  The nav is sticky with scroll-spy and carries a live gather count.

## Architecture

- Vanilla TypeScript, `strict`, compiled by `tsc` to `dist/`. No framework, no bundler, no backend.
- `src/model.ts`: types, recipe expansion (`gather`), scoring (`BUILDS`, `bestCombos`). No DOM, so `test.mjs` runs it in node.
- `src/ui.ts`: presentation helpers only — icon refs, the station/biome icon maps, the `h()` DOM
  builder and the single popover used by the info and warning marks.
- `src/data.ts`: every item. One `Item` is a raw resource (`source`), a crafted intermediate (`recipe`), a food (`food`, optionally with `recipe`) or a mead (`mead` + `recipe`). Material names must match an item name exactly.
- `src/app.ts`: all rendering. State in `localStorage` key `valheim-food-planner:v1`.
  Two pieces of view-only state are deliberately **not** persisted: the first-visit tile
  selection (you pick a tile, then confirm with Continue) and which overview rows are
  expanded on phone.
- Station strings are compound (`Cauldron (7) + Stone oven`, `Mead ketill + Fermenter`), so
  `stationIcon()` matches the **primary** station at the start of the string.
- Deploy: GitHub Actions builds, runs `npm test`, publishes `index.html`, `style.css` and `dist/*.js` to Pages. A failing check blocks the deploy.

## Data

Source: the Food and Mead tables on `valheim.weirdgloop.org` (CC BY-NC-SA), read 2026-09-14, Valheim 1.0.12. That wiki is the only one with Deep North rows; Fandom stops at Ashlands, wiki.gg blocks scripted reads. Resource sources come from each item's wiki page. Credit is in the footer.

`biome` means the progression tier the wiki table gives, not where the item grows. Egg is Plains because Haldor sells it after Yagluth.

Items flagged `unverified` show a warning mark opening a popover with the reason. Current flags: Oatmeal stats, Pulled Bear healing, the Kale Chips recipe, and the Oat flour windmill ratio.

## Audits
Read by the cockpit Audits tab. One `- Label: YYYY-MM-DD, result` per check; conventions in elwyn-dash `docs/security.md`.
- Headers: 2026-09-16, pass, 6 of 6 on buildapp.se via a host-scoped Transform Rule on the zone, measured after the change
- TLS: 2026-09-16, pass, SSL Labs A+ on buildapp.se, TLS 1.2 minimum and HSTS since today
- Lighthouse: 2026-09-16, pass, a11y 100, best practices 100, SEO 100, CLS 0,49 flagged (mobile, no perf)
- Markup: 2026-09-16, pass, W3C 0 errors, 5 warnings after the fix (icon hrefs encoded, privacy headings h2); 0 broken links
- UX: 2026-09-16, pass, 0 targets under 44 px after the fix (tabs and skip link 44 px), 5 of 6 script checks pass, no --interact
- npm audit: 2026-09-16, pass, 0
