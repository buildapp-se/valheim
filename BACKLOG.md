# Backlog

## Built

- Biome gate with first-visit picker, next-biome step and show-all.
- Best food: six builds, top 5 combos, resource-aware, feasts toggle.
- Overview with stacked bars, regen bar, sort, combo mode.
- Gather list with craft-step steppers for dishes and meads, raw totals by biome, crafting order.
- Resource checklist with sources.
- Data checks in `test.mjs`, run in the deploy workflow.

## Open

- [ ] `[P1]` Verify in game: Oatmeal stats (wiki says 39/115/85, total 239, far above every other food). If wrong, fix `src/data.ts` and drop the flag.
- [ ] `[P2]` Verify in game: Kale Chips recipe (wiki gives 12 Kale at the Stone oven, Raw Kale Chips step unclear), Oat flour ratio, Pulled Bear hp/tick.
- [ ] `[P2]` Search field above the gather list. At Deep North it holds over 100 rows.
- [ ] `[P3]` Recheck the weirdgloop Food table after the next patch; Deep North pages are marked work in progress there.
