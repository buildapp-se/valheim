// Data and model checks. Runs against the compiled dist/ (npm test builds first).
// Prints one line per check on failure; exits non-zero if anything fails.
import assert from 'node:assert/strict';
import { ITEMS } from './dist/data.js';
import { BIOMES, BUILDS, NotFoundError, allItems, bestCombos, biomeRank, gather, getItem, isRaw, loadItems, portionStep, rawMaterials, snap, sumOf } from './dist/model.js';

// a second copy of the module, never loaded: getItem must fail cleanly before loadItems
const fresh = await import('./dist/model.js?fresh');

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
  assert.equal(snap(getItem('Scorching medley'), 7), 9);
});
check('feasts count portions: 10 portions = 1 feast, 11 portions = 2 feasts', () => {
  const bowl = getItem('Ashlands gourmet bowl');
  assert.equal(portionStep(bowl), 10);
  assert.equal(snap(bowl, 11), 20);
  const one = gather({ 'Ashlands gourmet bowl': 10 });
  assert.equal(one.raw.get('Fiery spice powder'), 1);
  assert.deepEqual(one.steps.find((s) => s.name === 'Ashlands gourmet bowl'), { name: 'Ashlands gourmet bowl', crafts: 1, makes: 1, portions: 10, station: 'Food preparation table' });
  assert.equal(gather({ 'Ashlands gourmet bowl': 11 }).raw.get('Fiery spice powder'), 2);
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
  assert.deepEqual(g.steps.find((s) => s.name === 'Bread dough'), { name: 'Bread dough', crafts: 1, makes: 2, portions: 2, station: 'Food preparation table' });
});
check('gather counts feasts and meads', () => {
  const g = gather({ 'Northern Morning Fare': 10, 'Minor stamina mead': 6 });
  assert.equal(g.raw.get('Moose meat'), 3);
  assert.equal(g.raw.get('Honey'), 10);
});
check('wiki recheck 2026-10-06: Oven Pancake is an eitr food, Kale Chips and Berserkir mead batch sizes', () => {
  assert.deepEqual(getItem('Oven Pancake').food, { health: 37, stamina: 18, eitr: 105, healing: 5, duration: 1800 });
  assert.equal(gather({ 'Oven Pancake': 1 }).raw.get('Poteitr'), 2);
  assert.equal(gather({ 'Kale Chips': 4 }).raw.get('Kale'), 12);
  assert.equal(snap(getItem('Kale Chips'), 1), 4);
  assert.equal(gather({ 'Berserkir mead': 3 }).raw.get('Toadstool'), 1);
  assert.equal(gather({ 'Berserkir mead': 4 }).raw.get('Toadstool'), 2);
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

// ---- mutation test 2026-11-04: checks for what Stryker showed the suite above let through ----
const food = (name, health, stamina, eitr, healing, duration) => ({ name, biome: 'Meadows', source: 'test', food: { health, stamina, eitr, healing, duration } });
const build = (id) => BUILDS.find((b) => b.id === id);

check('getItem throws NotFoundError for unknown names and before loadItems', () => {
  assert.throws(() => getItem('Nope'), (e) => e instanceof NotFoundError && e.message === 'Unknown item: Nope');
  assert.throws(() => fresh.getItem('Bread'), (e) => e instanceof fresh.NotFoundError && e.message === 'Unknown item: Bread');
  assert.equal(getItem('bREAD').name, 'Bread');
  assert.equal(allItems(), ITEMS);
  assert.deepEqual(fresh.allItems(), []);
});
check('isRaw, rawMaterials and portionStep on raw resources and recipes', () => {
  assert.equal(isRaw(getItem('Barley')), true);
  assert.equal(isRaw(getItem('Bread')), false);
  assert.deepEqual([...rawMaterials(getItem('Bread'))], ['Barley']);
  assert.deepEqual([...rawMaterials(getItem('Barley'))], ['Barley']);
  assert.equal(portionStep(getItem('Raspberries')), 1);
  assert.equal(snap(getItem('Raspberries'), 3), 3);
  assert.equal(snap(getItem('Sausages'), -5), 0);
});
check('gather gives the same totals whichever pick comes first', () => {
  // Bread first reaches Barley flour at depth 2, Fish wraps then at depth 1: the deeper depth must win.
  const g = gather({ Bread: 2, 'Fish wraps': 2 });
  assert.equal(g.raw.get('Barley'), 18);
  assert.deepEqual([...g.raw.keys()].sort(), ['Barley', 'Raw fish']);
});
check('gather skips zero and negative picks', () => {
  const g = gather({ Bread: 0, Sausages: -4 });
  assert.equal(g.raw.size, 0);
  assert.deepEqual(g.steps, []);
});
check('every build scores by its formula', () => {
  const s = { health: 100, stamina: 60, eitr: 30, healing: 3, duration: 900 };
  assert.deepEqual(Object.fromEntries(BUILDS.map((b) => [b.id, b.score(s)])), { health: 100, stamina: 60, eitr: 30, warrior: 120, mage: 180, total: 190 });
});
check('sumOf adds healing, and an empty list lasts 0 seconds', () => {
  assert.equal(sumOf([getItem('Raspberries'), getItem('Bread')]).healing, 3);
  assert.deepEqual(sumOf([]), { health: 0, stamina: 0, eitr: 0, healing: 0, duration: 0 });
});
check('bestCombos returns exactly top, equal scores broken on healing, then on the longer shortest duration', () => {
  // the short ones first, so the winner is not simply the first combo tried
  const same = [food('D', 10, 0, 0, 1, 600), food('E', 10, 0, 0, 1, 600), food('A', 10, 0, 0, 1, 1800), food('B', 10, 0, 0, 1, 1800), food('C', 10, 0, 0, 1, 1800)];
  assert.equal(bestCombos(same, build('health'), 3).length, 3);
  assert.equal(bestCombos(same, build('health')).length, 5);
  // every combo scores 30 and heals 3; only A, B and C together last 1800 s
  assert.deepEqual(bestCombos(same, build('health'), 1)[0].foods.map((f) => f.name), ['A', 'B', 'C']);
  const heal = [food('A', 10, 0, 0, 1, 1800), food('B', 10, 0, 0, 1, 1800), food('C', 10, 0, 0, 1, 1800), food('D', 10, 0, 0, 5, 600)];
  // healing comes before duration: a D combo heals 7 and wins although it lasts only 600 s
  const [first, second] = bestCombos(heal, build('health'), 2);
  assert.equal(first.sum.healing, 7);
  assert.equal(second.sum.healing, 7);
});
check('bestCombos keeps a later combo that ties the last place but heals more', () => {
  const foods = [food('A', 10, 0, 0, 1, 600), food('B', 10, 0, 0, 1, 600), food('C', 10, 0, 0, 1, 600), food('D', 10, 0, 0, 9, 600)];
  const [best] = bestCombos(foods, build('health'), 1);
  assert.ok(best.foods.some((f) => f.name === 'D'));
});

if (failed) {
  console.log(`${failed} check(s) failed`);
  process.exit(1);
}
console.log('all checks pass');
