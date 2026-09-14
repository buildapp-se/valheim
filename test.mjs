// Data and model checks. Runs against the compiled dist/ (npm test builds first).
// Prints one line per check on failure; exits non-zero if anything fails.
import assert from 'node:assert/strict';
import { ITEMS } from './dist/data.js';
import { BIOMES, BUILDS, bestCombos, biomeRank, gather, getItem, loadItems, rawMaterials, snap, sumOf } from './dist/model.js';

loadItems(ITEMS);
let failed = 0;
const check = (name, fn) => {
  try {
    fn();
  } catch (e) {
    failed++;
    console.log(`FAIL ${name}: ${e.message}`);
  }
};

check('every material resolves to an item', () => {
  for (const it of ITEMS) for (const m of Object.keys(it.recipe?.materials ?? {})) getItem(m);
});
check('no item needs a later biome than its own', () => {
  for (const it of ITEMS) {
    for (const r of rawMaterials(it)) assert.ok(biomeRank(getItem(r).biome) <= biomeRank(it.biome), `${it.name} needs ${r} (${getItem(r).biome})`);
  }
});
check('names are unique, case-insensitively', () => {
  const seen = new Set();
  for (const it of ITEMS) {
    assert.ok(!seen.has(it.name.toLowerCase()), it.name);
    seen.add(it.name.toLowerCase());
  }
});
check('every item is a raw resource, a food, a mead or an intermediate with a recipe', () => {
  for (const it of ITEMS) assert.ok(it.source || it.recipe, it.name);
});
check('food stats are sane', () => {
  for (const it of ITEMS) {
    if (!it.food) continue;
    const f = it.food;
    assert.ok(f.health >= 0 && f.stamina >= 0 && f.eitr >= 0, it.name);
    assert.ok(f.duration >= 600 && f.duration <= 3000, `${it.name} duration ${f.duration}`);
    assert.ok(f.healing >= 1 && f.healing <= 7, `${it.name} healing ${f.healing}`);
    assert.ok(BIOMES.includes(it.biome), it.name);
  }
});
check('counts match the source: 95 foods, 20 meads, 21 Deep North foods', () => {
  // the 1.0 notes list 23 "food" lines: 21 Deep North foods plus Oat Flour (intermediate) and Pulled Bear (Black Forest)
  assert.equal(ITEMS.filter((i) => i.food).length, 95);
  assert.equal(ITEMS.filter((i) => i.mead).length, 20);
  assert.equal(ITEMS.filter((i) => i.food && i.biome === 'Deep North').length, 21);
});
check('snap rounds up to the yield', () => {
  const s = getItem('Sausages');
  assert.equal(snap(s, 1), 4);
  assert.equal(snap(s, 4), 4);
  assert.equal(snap(s, 9), 12);
  assert.equal(snap(getItem('Serpent stew'), 3), 3);
});
check('gather expands shared intermediates once: 2 Fish wraps + 2 Bread', () => {
  // Fish wraps: 2 cooked fish + 4 barley flour each. Bread: 1 dough each, dough = 10 flour -> 2.
  // 2 bread need 2 dough = 1 craft = 10 flour. 2 wraps need 8 flour. 18 flour = 18 barley.
  const g = gather({ 'Fish wraps': 2, Bread: 2 });
  assert.equal(g.raw.get('Barley'), 18);
  assert.equal(g.raw.get('Raw fish'), 4);
  const names = g.steps.map((s) => s.name);
  assert.ok(names.indexOf('Barley flour') < names.indexOf('Bread dough'), names.join(','));
  assert.ok(names.indexOf('Bread dough') < names.indexOf('Bread'), names.join(','));
  assert.deepEqual(g.steps.find((s) => s.name === 'Bread dough'), { name: 'Bread dough', crafts: 1, makes: 2, station: 'Food preparation table' });
});
check('gather counts feasts and meads', () => {
  const g = gather({ 'Northern Morning Fare': 1, 'Minor stamina mead': 6 });
  assert.equal(g.raw.get('Moose meat'), 3);
  assert.equal(g.raw.get('Honey'), 10);
});
check('max health at Ashlands is Piquant pie + Mashed meat + Fiery svinstew = 300 (wiki)', () => {
  const foods = ITEMS.filter((i) => i.food && !i.food.feast && biomeRank(i.biome) <= biomeRank('Ashlands'));
  const [best] = bestCombos(foods, BUILDS.find((b) => b.id === 'health'));
  assert.deepEqual(best.foods.map((f) => f.name).sort(), ['Fiery svinstew', 'Mashed meat', 'Piquant pie']);
  assert.equal(best.sum.health, 300);
  assert.equal(best.sum.stamina, 101);
});
check('max eitr at Ashlands is 270 (wiki)', () => {
  const foods = ITEMS.filter((i) => i.food && !i.food.feast && biomeRank(i.biome) <= biomeRank('Ashlands'));
  const [best] = bestCombos(foods, BUILDS.find((b) => b.id === 'eitr'));
  assert.equal(best.sum.eitr, 270);
});
check('warrior score punishes imbalance', () => {
  const w = BUILDS.find((b) => b.id === 'warrior');
  assert.ok(w.score({ health: 150, stamina: 150, eitr: 0 }) > w.score({ health: 250, stamina: 60, eitr: 0 }));
});
check('sumOf takes the shortest duration', () => {
  assert.equal(sumOf([getItem('Raspberries'), getItem('Serpent stew')]).duration, 600);
});

if (failed) {
  console.log(`${failed} check(s) failed`);
  process.exit(1);
}
console.log('all checks pass');
