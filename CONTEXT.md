# Valheim Food Planner

Static web app at `buildapp.se/valheim/` for picking Valheim food. Unlisted on the buildapp.se front page. English only. Desktop first, works at phone width.

## What it does

- **Biome gate.** First visit asks for the highest biome reached. Everything from later biomes is hidden: foods, meads, resources, combos. Header has "Next biome" (one step) and "Show all".
- **Best food.** Top 5 three-food combos per build, from dishes whose whole ingredient tree is ticked in Resources. Feasts behind a toggle, default off.
- **Overview.** Every food with a stacked bar (red health, yellow stamina, blue eitr) and a thin green hp/tick bar. Column headers sort: first click biggest first (Food A to Z), second click flips. Station sorts by the level number in the station name, none counts as 0. "Per biome" (default on) sorts inside biome groups, highest biome first; off gives one flat list with a biome tag. "Combos" switches to the top 30 three-food sums for the clicked column; Food and Station order the top 30 by total.
- **Best-food cards** show health, stamina, eitr, total, hp/tick and duration per combo.
- **Gather list.** Dishes and meads counted in portions, one per thing you eat. Steppers move in whole crafts: a dish that makes 3 per craft steps by 3, a feast by 10 (one placed feast serves 10, wiki Feast page). The big buttons are five crafts, the in-game shift-click. Dishes that do not step by 1 carry an i tooltip explaining why. Output: raw resources grouped by biome with source, plus crafting order, feasts shown as feasts = portions.
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

## Architecture

- Vanilla TypeScript, `strict`, compiled by `tsc` to `dist/`. No framework, no bundler, no backend.
- `src/model.ts`: types, recipe expansion (`gather`), scoring (`BUILDS`, `bestCombos`). No DOM, so `test.mjs` runs it in node.
- `src/data.ts`: every item. One `Item` is a raw resource (`source`), a crafted intermediate (`recipe`), a food (`food`, optionally with `recipe`) or a mead (`mead` + `recipe`). Material names must match an item name exactly.
- `src/app.ts`: all rendering. State in `localStorage` key `valheim-food-planner:v1`.
- Deploy: GitHub Actions builds, runs `npm test`, publishes `index.html`, `style.css` and `dist/*.js` to Pages. A failing check blocks the deploy.

## Data

Source: the Food and Mead tables on `valheim.weirdgloop.org` (CC BY-NC-SA), read 2026-09-14, Valheim 1.0.12. That wiki is the only one with Deep North rows; Fandom stops at Ashlands, wiki.gg blocks scripted reads. Resource sources come from each item's wiki page. Credit is in the footer.

`biome` means the progression tier the wiki table gives, not where the item grows. Egg is Plains because Haldor sells it after Yagluth.

Items flagged `unverified` show a warning mark with the reason on hover. Current flags: Oatmeal stats, Pulled Bear healing, the Kale Chips recipe, and the Oat flour windmill ratio.
