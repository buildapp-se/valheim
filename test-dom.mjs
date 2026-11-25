// Page checks: runs the compiled app against index.html in linkedom (a DOM in node) and
// drives it the way a player does, by clicking. Same output contract as test.mjs.
// Meadows holds six foods and no cauldron, so most expectations below are worked out by hand.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';

const { window, document, Node, Event, HTMLElement } = parseHTML(readFileSync(new URL('./index.html', import.meta.url), 'utf8'));
const store = new Map();
let storageBroken = false;
Object.assign(globalThis, {
  window,
  document,
  Node,
  Event,
  localStorage: {
    getItem: (k) => {
      if (storageBroken) throw new Error('blocked');
      return store.get(k) ?? null;
    },
    setItem: (k, v) => {
      if (storageBroken) throw new Error('blocked');
      store.set(k, String(v));
    },
  },
  IntersectionObserver: class {
    observe() {}
  },
  // the typed-count commit waits one tick for focus to settle; run it at once so checks stay synchronous
  setTimeout: (fn) => fn(),
});
// linkedom has no focus: a minimal model where focus() sets activeElement and a detached element drops it to body
let active = null;
Object.defineProperty(document, 'activeElement', { get: () => (active && document.contains(active) ? active : document.body) });
HTMLElement.prototype.focus = function () {
  active = this.disabled ? active : this;
};
// linkedom has no layout: a 1000 px wide window, every element at (anchorLeft, 300), 200 x 40
let anchorLeft = 50;
HTMLElement.prototype.getBoundingClientRect = () => ({ top: 300, left: anchorLeft });
Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { get: () => 200 });
Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { get: () => 40 });
Object.defineProperty(document.documentElement, 'clientWidth', { get: () => 1000 });
Object.assign(window, { scrollX: 0, scrollY: 0 });
// browsers throw on an invalid tag name; linkedom does not, so a broken h() call would pass unseen
const createElement = document.createElement.bind(document);
document.createElement = (tag, ...rest) => {
  if (!/^[a-z][a-z0-9-]*$/i.test(tag)) throw new Error(`InvalidCharacterError: <${tag}>`);
  return createElement(tag, ...rest);
};

const KEY = 'valheim-food-planner:v1';
let failed = 0;
const check = (name, fn) => {
  try {
    fn();
  } catch (e) {
    failed++;
    console.log(`FAIL ${name}: ${e.message}`);
    if (process.argv.includes('--fail-fast')) process.exit(1); // mutation runs: one failure is enough
  }
};
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const text = (el) => el.textContent.replace(/\s+/g, ' ').trim();
const fire = (el, type, init = {}) => {
  assert.ok(el, `nothing to ${type}`);
  el.dispatchEvent(Object.assign(new Event(type, { bubbles: true }), init));
};
const click = (el) => fire(el, 'click');
const change = (input, patch) => {
  Object.assign(input, patch);
  fire(input, 'change');
};
const button = (label, root = document) => {
  // "Add one round" also finds a combo stepper's "Add one round of A, B, and C"
  const round = label.endsWith(' one round') ? `${label} of ` : null;
  const b = $$('button', root).find((x) => text(x) === label || x.getAttribute('aria-label') === label || (round && x.getAttribute('aria-label')?.startsWith(round)));
  assert.ok(b, `no button "${label}"`);
  return b;
};
const checkbox = (section, label) => {
  const l = $$(`#${section} .head label`).find((x) => text(x) === label);
  assert.ok(l, `no checkbox "${label}"`);
  return l;
};
const toggle = (section, label) => {
  const input = $('input', checkbox(section, label));
  change(input, { checked: !input.checked });
};
const saved = () => JSON.parse(store.get(KEY));
const pickBiome = (b) => {
  const s = $('#biome-control select');
  for (const o of $$('option', s)) o.toggleAttribute('selected', o.value === b);
  fire(s, 'change');
};
const width = (el) => parseFloat(/^width:([\d.]+)%$/.exec(el.getAttribute('style'))[1]).toFixed(6);
const icon = (svg) => svg.querySelector('use').getAttribute('href');
const popover = () => $('#vfp-popover');
const rowName = (r) => [...$('.nm', r).childNodes].find((n) => n.nodeType === 3).textContent;
const gatherRow = (name) => $$('#gather .list .row').find((r) => rowName(r) === name);
const gatherNames = () => $$('#gather .list .row').filter((r) => !r.hidden).map(rowName);
const totals = () => Object.fromEntries($$('#gather .result .item').map((i) => [text($('.nm', i)), Number(text($('.amt', i)))]));
const steps = () => $$('#gather .craft .step').map(text);
const rows = () => $$('#overview tbody tr:not(.group):not(.panel)');
const overviewNames = () => rows().map((r) => $('.rowname', r).firstChild.textContent);
const comboNames = (row) => $$('.chip', row).map(text);
const sortBy = (label) => click($$('#overview th button.sort').find((b) => b.title.startsWith(`Sort by ${label}`)));
const builds = () => $$('#best .build');
const build = (label) => builds().find((b) => text($('h3', b)) === label);
let boots = 0;
/** a fresh app instance on the same page, reading whatever is in storage now */
const boot = async () => import(`./dist/app.js?boot=${boots++}`);

// ---- first visit -------------------------------------------------------------------------
store.set(KEY, JSON.stringify({ picks: { Bread: 1, 'No such dish': 3, Sausages: 5 } }));
await boot();

check('first visit shows only the picker, Continue disabled until a tile is chosen', () => {
  assert.equal($('#picker').hidden, false);
  for (const id of ['nav', 'best', 'overview', 'gather', 'resources']) assert.equal($(`#${id}`).hidden, true, id);
  assert.equal($('#biome-control').hidden, true);
  assert.equal($('#biome-control').childNodes.length, 0);
  assert.equal($('#gather-badge').hidden, true);
  const go = $('.go .primary');
  assert.equal(go.disabled, true);
  assert.equal(text(go), 'Pick a biome to continue');
  click(go);
  assert.equal($('#picker').hidden, false, 'a disabled Continue does nothing');
  assert.deepEqual($$('.tile .nm').map(text), ['Meadows', 'Black Forest', 'Swamp', 'Mountain', 'Plains', 'Mistlands', 'Ashlands', 'Deep North']);
  assert.deepEqual($$('.tile .num').map(text), ['01', '02', '03', '04', '05', '06', '07', '08']);
  assert.equal(text($('.tile .sub')), 'Where you wake up');
  assert.equal(icon($('.tile svg')), '#biome-meadows');
  assert.equal(icon($$('.tile svg')[7]), '#biome-deep-north');
  assert.deepEqual($$('.tile').map((t) => t.getAttribute('aria-pressed')), Array(8).fill('false'));
  assert.equal(text($('.hero h2')), 'Three foods.The right three.');
  assert.ok($('.hero svg.ridge polygon'), 'ridge markup parsed into nodes');
});
check('a tile is a choice, Continue makes it; saved picks are snapped to whole crafts, unknown dishes dropped', () => {
  click($$('.tile')[2]);
  assert.equal(text($('.go .primary')), 'Continue to Swamp');
  assert.equal($('.go .primary').disabled, false);
  assert.deepEqual($$('.tile').map((t) => t.getAttribute('aria-pressed')).indexOf('true'), 2);
  assert.equal('biome' in saved(), false, 'choosing a tile is not saved');
  click($('.go .primary'));
  assert.equal(saved().biome, 'Swamp');
  assert.deepEqual(saved().picks, { Bread: 2, Sausages: 8 });
  assert.equal($('#picker').hidden, true);
  for (const id of ['nav', 'best', 'overview', 'gather', 'resources']) assert.equal($(`#${id}`).hidden, false, id);
});

// ---- header -----------------------------------------------------------------------------
check('header: spoiler line, biome select, a step to the next biome and show all', () => {
  assert.equal($('#biome-control').hidden, false);
  assert.equal(text($('.spoiler-chip')), 'Spoilers: Swamp and earlier');
  assert.equal($('#biome-control select').value, 'Swamp');
  assert.equal($$('#biome-control option').length, 8);
  assert.equal(icon($('#biome-control .pick svg')), '#biome-swamp');
  assert.equal($('#biome-control .pick svg').getAttribute('class'), 'ic ic-16');
  assert.equal($('#biome-control select').getAttribute('aria-label'), 'Highest biome reached');
  assert.equal(text($('#biome-control .primary')), 'Next: Mountain');
  click($('#biome-control .primary'));
  assert.equal(saved().biome, 'Mountain');
  click(button('Show all', $('#biome-control')));
  assert.equal(saved().biome, 'Deep North');
  assert.equal($$('#biome-control button').length, 0, 'nothing after the last biome');
  pickBiome('Meadows');
  assert.equal(saved().biome, 'Meadows');
  assert.equal(text($('#biome-control .primary')), 'Next: Black Forest');
});

// ---- hidden picks ----------------------------------------------------------------------
check('picks from a later biome stay saved but count nowhere', () => {
  assert.equal($('#gather-badge').hidden, true);
  assert.equal(text($('#gather .head .mono')), '0 entries · 0 portions');
  assert.equal(text($('#gather-hidden')), '2 more entries hidden by feasts, resources or biome, not counted');
  assert.equal(text($('#gather .result .empty')), 'Nothing picked yet. Use + on a dish or mead, or on a combo under Best food.');
  click(button('Clear', $('#gather')));
  assert.deepEqual(saved().picks, {});
  assert.equal($('#gather-hidden'), null);
  assert.equal($$('#gather .head button').length, 0, 'no Clear on an empty list');
});

// ---- best food at Meadows --------------------------------------------------------------
check('six builds, top combos by formula, stat slots in fixed order', () => {
  assert.equal(text($('#best .count-note')), '6 foods from your resources');
  assert.deepEqual(builds().map((b) => text($('h3', b))), ['Max health', 'Max stamina', 'Max eitr', 'Warrior', 'Mage', 'Max total']);
  assert.deepEqual(builds().map((b) => icon($('.title svg', b))), ['#icon-health', '#icon-stamina', '#icon-eitr', '#icon-total', '#icon-eitr', '#icon-total']);
  assert.equal(text($('.hint', build('Max health'))), 'Shield and stagger. Health only.');
  for (const b of builds()) assert.equal($$('.combo', b).length, 5);
  const top = $('.combo', build('Max health'));
  assert.deepEqual(comboNames(top), ['Cooked boar meat', 'Cooked deer meat', 'Grilled neck tail']);
  assert.deepEqual($$('.sum .n', top).map(text), ['90', '30', '0', '120', '+6/tick', '20:00']);
  assert.deepEqual($$('.sum .n', top).map((s) => s.title), ['Health', 'Stamina', 'Eitr', 'Total', 'Health per tick', 'Duration']);
  assert.deepEqual(comboNames($('.combo', build('Max stamina'))), ['Honey', 'Mushroom', 'Raspberries']);
  assert.equal(text($('.sum .d', $('.combo', build('Max stamina')))), '10:00');
  assert.deepEqual($$('.sum .n', top).map((s) => s.className), ['n h', 'n s', 'n e', 'n t', 'n r', 'n d']);
  assert.deepEqual($$('.sum .n svg', top).map(icon), ['#icon-health', '#icon-stamina', '#icon-eitr', '#icon-total', '#icon-regen', '#icon-duration']);
  assert.equal($('.sum .n svg', top).getAttribute('class'), 'ic ic-14');
});
check('a colour legend above the builds and the overview', () => {
  for (const id of ['best', 'overview']) {
    const legend = $(`#${id} .legend`);
    assert.deepEqual($$('span', legend).map(text), ['health', 'stamina', 'eitr', 'hp/tick (thin bar)'], id);
    assert.deepEqual($$('i', legend).map((i) => i.getAttribute('style')), ['health', 'stamina', 'eitr', 'regen'].map((v) => `background:var(--${v})`));
  }
});
check('combo bars: one labelled image, segments scaled to three of the strongest verified food (160)', () => {
  const top = $('.combo', build('Max health'));
  const bar = $('.bars > .bar', top);
  assert.equal(bar.getAttribute('role'), 'img');
  assert.deepEqual($$('span', bar).map((s) => s.className), ['h', 's', 'e']);
  assert.equal(bar.getAttribute('aria-label'), 'Health 90, stamina 30, eitr 0');
  assert.deepEqual($$('span', bar).map((s) => s.getAttribute('style')), ['width:18.75%', 'width:6.25%', 'width:0%']);
  assert.deepEqual($$('span', bar).map((s) => s.title), ['Health 90', 'Stamina 30', 'Eitr 0']);
  const regen = $('.bars > .regen', top);
  assert.equal(regen.getAttribute('role'), 'img');
  assert.equal(regen.getAttribute('aria-label'), '6 hp per tick');
  // hp/tick scale is three of the best single food (7 hp/tick): 6 / 21
  assert.equal(width($('span', regen)), ((100 * 6) / 21).toFixed(6));
  assert.equal($('span', regen).title, '6 hp/tick');
});
check('a food pill opens its station and ingredients; Esc, an outside click and a second click close it', () => {
  const chip = $('.chip', build('Max health'));
  assert.equal(chip.getAttribute('aria-label'), 'Cooked boar meat: show ingredients');
  assert.equal(chip.getAttribute('type'), 'button');
  assert.equal(chip.getAttribute('aria-expanded'), 'false');
  click(chip);
  assert.equal(popover().hidden, false);
  assert.equal(popover().textContent, 'Cooking station: 1× Boar meat');
  assert.equal(chip.getAttribute('aria-expanded'), 'true');
  assert.equal(chip.getAttribute('aria-describedby'), 'vfp-popover');
  assert.equal(popover().style.left, '50px');
  assert.equal(popover().style.top, '252px', 'above the mark: 300 - 40 - 8');
  click(chip);
  anchorLeft = 900;
  click(chip);
  assert.equal(popover().style.left, '784px', 'kept 16 px inside the right edge');
  anchorLeft = -30;
  click(chip);
  click(chip);
  assert.equal(popover().style.left, '8px', 'and 8 px inside the left');
  anchorLeft = 50;
  click(popover());
  assert.equal(popover().hidden, false, 'a click inside the popover keeps it');
  click(chip);
  assert.equal(popover().hidden, true, 'second click closes');
  assert.equal(chip.getAttribute('aria-expanded'), 'false');
  assert.equal(chip.hasAttribute('aria-describedby'), false);
  click(chip);
  click(document.body);
  assert.equal(popover().hidden, true, 'outside click closes');
  click(chip);
  fire(document, 'keydown', { key: 'Enter' });
  assert.equal(popover().hidden, false, 'only Esc closes from the keyboard');
  let focused = false;
  chip.focus = () => (focused = true);
  fire(document, 'keydown', { key: 'Escape' });
  assert.equal(popover().hidden, true);
  assert.ok(focused, 'Esc returns focus to the pill');
  const other = $$('.chip', build('Max health'))[1];
  click(chip);
  click(other);
  assert.equal(popover().textContent, 'Cooking station: 1× Deer meat');
  assert.equal(chip.getAttribute('aria-expanded'), 'false', 'opening another closes the first');
  fire(window, 'resize');
  assert.equal(popover().hidden, true);
  assert.equal($$('#vfp-popover').length, 1, 'one popover, reused');
});
check('combo stepper adds and removes one craft of each of its three foods', () => {
  const stepper = () => $('.combo .stepper', build('Max health'));
  assert.equal(text($('.count', stepper())), '0');
  assert.equal(button('Remove one round', stepper()).disabled, true);
  assert.deepEqual($$('button', stepper()).map((b) => b.getAttribute('aria-label')), [
    'Remove one round of Cooked boar meat, Cooked deer meat, and Grilled neck tail',
    'Add one round of Cooked boar meat, Cooked deer meat, and Grilled neck tail',
  ]);
  click(button('Add one round', stepper()));
  click(button('Add one round', stepper()));
  assert.deepEqual(saved().picks, { 'Cooked boar meat': 2, 'Cooked deer meat': 2, 'Grilled neck tail': 2 });
  assert.equal(text($('.count', stepper())), '2');
  assert.equal($('#gather-badge').textContent, '3');
  assert.equal($('#gather-badge').classList.contains('pulse'), true);
  click(button('Remove one round', stepper()));
  assert.deepEqual(saved().picks, { 'Cooked boar meat': 1, 'Cooked deer meat': 1, 'Grilled neck tail': 1 });
  click(button('Remove one round', stepper()));
  assert.deepEqual(saved().picks, {}, 'zero removes the entry');
  assert.equal($('#gather-badge').hidden, true);
});

// ---- overview ----------------------------------------------------------------------------
check('overview: grouped by biome, total biggest first, then Food A to Z and back', () => {
  assert.equal(text($('#overview h2')), 'Overview');
  assert.equal(text($('#overview tr.group h3')), 'Meadows');
  assert.equal(text($('#overview tr.group .cnt')), '6 foods');
  assert.deepEqual(overviewNames(), ['Cooked deer meat', 'Honey', 'Cooked boar meat', 'Grilled neck tail', 'Mushroom', 'Raspberries']);
  const th = (label) => $$('#overview th').find((x) => x.querySelector('button')?.title === `Sort by ${label}`);
  assert.equal(th('total').getAttribute('aria-sort'), 'descending');
  assert.equal(th('health').getAttribute('aria-sort'), 'none');
  assert.equal(icon($('.arrow svg', th('total'))), '#ui-sort-desc');
  assert.equal(icon($('.arrow svg', th('health'))), '#ui-sort-idle');
  assert.equal(th('health').className, 'n');
  assert.equal(th('food').className, 'col-name');
  assert.equal(th('time').className, 'n col-time');
  sortBy('food');
  assert.deepEqual(overviewNames(), ['Cooked boar meat', 'Cooked deer meat', 'Grilled neck tail', 'Honey', 'Mushroom', 'Raspberries']);
  assert.equal(th('food').getAttribute('aria-sort'), 'ascending');
  assert.equal(icon($('.arrow svg', th('food'))), '#ui-sort-asc');
  sortBy('food');
  assert.equal(overviewNames()[0], 'Raspberries');
  sortBy('health');
  assert.deepEqual(overviewNames(), ['Cooked deer meat', 'Cooked boar meat', 'Grilled neck tail', 'Mushroom', 'Honey', 'Raspberries']);
  sortBy('health');
  assert.deepEqual(overviewNames(), ['Raspberries', 'Honey', 'Mushroom', 'Grilled neck tail', 'Cooked boar meat', 'Cooked deer meat']);
  sortBy('stamina');
  assert.equal(overviewNames()[0], 'Honey');
  sortBy('hp/tick');
  // three foods heal 2: the tie breaks on total, biggest first
  assert.deepEqual(overviewNames().slice(0, 3), ['Cooked deer meat', 'Cooked boar meat', 'Grilled neck tail']);
  sortBy('time');
  assert.equal(overviewNames()[5], 'Raspberries');
  sortBy('eitr');
  assert.deepEqual(overviewNames(), ['Cooked deer meat', 'Honey', 'Cooked boar meat', 'Grilled neck tail', 'Mushroom', 'Raspberries'], 'all 0 eitr: total, then name');
  sortBy('total');
  assert.equal(saved().sort, 'total');
  assert.equal(saved().dir, 'desc');
});
check('overview row: numbers, bars at single-food scale, station line, expand panel on phone', () => {
  const row = rows()[0];
  assert.deepEqual($$('td.num', row).map(text), ['35', '12', '', '47', '2', '20:00']);
  assert.equal($('.bar span', row).getAttribute('style'), `width:${(100 * 35) / 160}%`);
  assert.equal(width($('.regen span', row)), ((100 * 2) / 7).toFixed(6));
  assert.equal(text($('td.ing', row)), 'Cooking station: 1× Deer meat');
  assert.equal(icon($('td.ing svg', row)), '#station-cooking-station');
  const panel = row.nextElementSibling;
  assert.equal(panel.className, 'panel');
  assert.equal(text($('.num', panel)), '20:00');
  assert.deepEqual($$('.k', panel).map(text), ['Bars', 'Time', 'Station', 'Add']);
  const toggleBtn = $('.expand', row);
  assert.equal(toggleBtn.getAttribute('aria-label'), 'More about Cooked deer meat');
  click(toggleBtn);
  assert.equal(panel.className, 'panel open');
  assert.equal(toggleBtn.getAttribute('aria-expanded'), 'true');
  sortBy('total');
  sortBy('total'); // two re-renders later it is still open
  assert.equal(rows()[0].nextElementSibling.className, 'panel open');
  click($('.expand', rows()[0]));
  assert.equal($('.expand', rows()[0]).getAttribute('aria-expanded'), 'false');
  const honey = rows()[1];
  assert.equal(text($('td.ing', honey)), 'Beehive (Queen bee from abandoned houses)');
  assert.equal($('td.ing svg', honey), null, 'no station, no icon');
  assert.equal(text($$('.k', honey.nextElementSibling)[2]), 'Source');
});
check('overview row stepper adds one craft and shows portions', () => {
  const add = button('Add 1 Honey', rows()[1].querySelector('td.add'));
  click(add);
  assert.equal(text($('td.add .count', rows()[1])), '1');
  assert.equal(button('Remove 1 Honey', rows()[1].querySelector('td.add')).disabled, false);
  click(button('Remove 1 Honey', rows()[1].querySelector('td.add')));
  assert.deepEqual(saved().picks, {});
});
check('Per biome off gives one flat list with a biome tag', () => {
  toggle('overview', 'Per biome');
  assert.equal(saved().grouped, false);
  assert.equal($('#overview tr.group'), null);
  assert.equal(text($('.tag', rows()[0])), 'Meadows');
  toggle('overview', 'Per biome');
  assert.equal($('.tag', rows()[0]), null);
});
check('Combos: the top three-food sums for the clicked column', () => {
  toggle('overview', 'Combos');
  assert.equal(text($('#overview h2')), 'Three-food combos');
  const perBiome = checkbox('overview', 'Per biome');
  assert.equal($('input', perBiome).disabled, true);
  assert.equal(!!$('input', perBiome).checked, false);
  assert.equal(perBiome.className, 'check muted');
  assert.equal(rows().length, 20, 'C(6,3), fewer than 30');
  assert.deepEqual(comboNames(rows()[0]), ['Cooked boar meat', 'Cooked deer meat', 'Honey']);
  assert.deepEqual($$('td.num', rows()[0]).map(text), ['73', '57', '0', '130', '5', '15:00']);
  assert.equal(text($('td.ing', rows()[0])), 'No cauldron');
  assert.equal(text($$('#overview th')[8]), 'Station');
  sortBy('health');
  assert.deepEqual(comboNames(rows()[0]), ['Cooked boar meat', 'Cooked deer meat', 'Grilled neck tail']);
  sortBy('health');
  assert.equal(text($('td.num', rows()[0])), '30', 'flipped: the weakest of the top 30 first');
  sortBy('food');
  assert.deepEqual(comboNames(rows()[0]), ['Cooked boar meat', 'Cooked deer meat', 'Grilled neck tail']);
  sortBy('food');
  assert.deepEqual(comboNames(rows()[0]), ['Honey', 'Mushroom', 'Raspberries']);
  sortBy('station');
  assert.equal($$('td.num', rows()[0])[3].textContent, '130', 'station orders by total');
  sortBy('hp/tick');
  assert.equal($$('td.num', rows()[0])[4].textContent, '6');
  click(button('Add one round', rows()[0]));
  assert.equal(Object.keys(saved().picks).length, 3);
  click(button('Clear', $('#gather')));
  toggle('overview', 'Combos');
  sortBy('total');
  assert.equal(text($$('#overview th')[8]), 'Station: ingredients');
});

// ---- Black Forest: cauldrons, yields, meads, an unverified food ----------------------------
check('station levels: overview sorts cauldron dishes above raw food, combos name the cauldron', () => {
  click($('#biome-control .primary'));
  assert.equal(saved().biome, 'Black Forest');
  assert.deepEqual($$('#overview tr.group h3').map(text), ['Black Forest', 'Meadows']);
  sortBy('station');
  const bf = overviewNames().slice(0, 9);
  assert.deepEqual(bf.slice(0, 6).sort(), ["Boar jerky", 'Carrot soup', 'Deer stew', 'Minced meat sauce', 'Pulled Bear', "Queen's jam"]);
  sortBy('station');
  assert.equal(overviewNames()[0], 'Cooked bear meat', 'ascending: level 0 first, ties still biggest total first');
  toggle('overview', 'Combos');
  assert.match(text($('td.ing', rows()[0])), /^Cauldron level 1 or lower$/);
  toggle('overview', 'Combos');
  sortBy('total');
});
check('an unverified food carries a warning mark that opens the reason', () => {
  const pb = rows().find((r) => $('.rowname', r).firstChild.textContent === 'Pulled Bear');
  const warn = $('.mark.warn', pb);
  assert.equal(warn.getAttribute('aria-label'), 'Unverified values for Pulled Bear');
  assert.equal(icon($('svg', warn)), '#ui-warning');
  click(warn);
  assert.match(popover().textContent, /3 hp\/tick/);
  click(warn);
  assert.equal($('.mark.warn', rows()[0]), null);
});
check('gather list: steps in whole crafts, five-craft buttons, typed counts snap up', () => {
  assert.ok(gatherNames().length > 10, String(gatherNames().length));
  assert.equal(gatherNames().length, $$('#gather .list .row').length, 'no search typed: every row shows');
  const jam = gatherRow("Queen's jam");
  assert.equal(text($('.sub', jam)), 'Cauldron (1) ×4: 8× Raspberries, 6× Blueberries');
  assert.equal(icon($('.sub svg', jam)), '#station-cauldron');
  const info = $('.mark.info', jam);
  assert.equal(info.getAttribute('aria-label'), "Why Queen's jam steps in 4s");
  assert.equal(icon($('svg', info)), '#ui-info');
  click(info);
  assert.equal(popover().textContent, 'One craft makes 4, so portions go in steps of 4.');
  click(info);
  assert.deepEqual($$('.stepper button', jam).map(text), ['−20', '−4', '+4', '+20']);
  assert.equal(button("Remove 20 Queen's jam", jam).disabled, true);
  assert.equal(button("Remove 4 Queen's jam", jam).disabled, true);
  click(button("Add 20 Queen's jam", gatherRow("Queen's jam")));
  assert.equal(saved().picks["Queen's jam"], 20);
  click(button("Remove 4 Queen's jam", gatherRow("Queen's jam")));
  assert.equal(saved().picks["Queen's jam"], 16);
  click(button("Remove 20 Queen's jam", gatherRow("Queen's jam")));
  assert.equal("Queen's jam" in saved().picks, false, 'never below zero');
  click(button("Add 4 Queen's jam", gatherRow("Queen's jam")));
  assert.equal(gatherRow("Queen's jam").className, 'row picked');
  const input = $('input', gatherRow("Queen's jam"));
  assert.equal(input.getAttribute('step'), '4');
  assert.equal(input.getAttribute('aria-label'), "Queen's jam portions");
  change(input, { value: '5' });
  assert.equal(saved().picks["Queen's jam"], 8);
  change($('input', gatherRow("Queen's jam")), { value: 'x' });
  assert.equal("Queen's jam" in saved().picks, false);
  assert.equal(gatherRow('Carrot soup').className, 'row');
  assert.equal($('.mark.info', gatherRow('Carrot soup')), null, 'yield 1: no info mark');
});
check('a + pressed straight after typing a count keeps both', () => {
  // the press blurs the input, so change fires while the button is held
  const plus = button('Add 1 Carrot soup', gatherRow('Carrot soup'));
  fire(plus, 'pointerdown');
  change($('input', gatherRow("Queen's jam")), { value: '7' });
  assert.equal(saved().picks["Queen's jam"], 8, 'typed count committed at once');
  assert.ok(document.contains(plus), 'no render under the held button, or its click is lost');
  fire(plus, 'pointerup');
  click(plus);
  assert.equal(saved().picks["Queen's jam"], 8);
  assert.equal(saved().picks['Carrot soup'], 1);
  assert.equal($('input', gatherRow("Queen's jam")).value, '8');
  click(button("Remove 20 Queen's jam", gatherRow("Queen's jam")));
  click(button('Remove 1 Carrot soup', gatherRow('Carrot soup')));
});
check('keyboard focus survives the re-render a click causes', () => {
  const add = button('Add 1 Carrot soup', gatherRow('Carrot soup'));
  add.focus();
  click(add);
  const now = document.activeElement;
  assert.notEqual(now, add, 'the old button is gone');
  assert.equal(now.getAttribute('aria-label'), 'Add 1 Carrot soup');
  assert.ok(gatherRow('Carrot soup').contains(now));
  const comboPlus = $$('#best .combo button.plus')[2];
  comboPlus.focus();
  click(comboPlus);
  assert.equal($$('#best .combo button.plus').indexOf(document.activeElement), 2, 'same-named buttons: the same one by position');
  click(button('Remove 1 Carrot soup', gatherRow('Carrot soup')));
  click(button('Remove one round', $$('#best .combo')[2]));
});
check('gather totals: raw resources by biome with source, crafting order deepest first', () => {
  click(button('Add 1 Deer stew', gatherRow('Deer stew')));
  click(button('Add 2 Boar jerky', gatherRow('Boar jerky')));
  assert.equal(text($('#gather .head .mono')), '2 entries · 3 portions');
  assert.deepEqual($$('#gather .result .resgroup h3').map(text), ['Meadows', 'Black Forest']);
  assert.deepEqual($$('#gather .result .resgroup .cnt').map(text), ['3 items', '2 items']);
  assert.deepEqual(totals(), { 'Boar meat': 1, 'Deer meat': 1, Honey: 1, Blueberries: 1, Carrot: 1 });
  assert.equal(text($('#gather .result .item .src')), 'Boar');
  assert.deepEqual(steps(), ['Cooked deer meat · Cooking station1', 'Deer stew · Cauldron (1)1', 'Boar jerky · Cauldron (1)1 craft → 2']);
  click(button('Add 2 Boar jerky', gatherRow('Boar jerky')));
  assert.equal(steps()[2],'Boar jerky · Cauldron (1)2 crafts → 4');
  assert.equal(text($('#gather .head .mono')), '2 entries · 5 portions');
  click(button('Remove 1 Deer stew', gatherRow('Deer stew')));
  assert.equal(text($('#gather .head .mono')), '1 entry · 4 portions');
  assert.deepEqual($$('#gather .result .resgroup .cnt').map(text), ['2 items']);
  click(button('Add 1 Carrot soup', gatherRow('Carrot soup')));
  assert.deepEqual($$('#gather .result .resgroup .cnt').map(text), ['3 items', '1 item']);
  click(button('Clear', $('#gather')));
});
check('meads: effect on the name line, no yield on the station line', () => {
  const m = gatherRow('Tasty mead');
  assert.equal(text($('.effect', m)), '+100% stamina regen, -50% health regen');
  assert.equal(icon($('.nm svg', m)), '#ui-mead');
  assert.equal(text($('.sub', m)), 'Mead ketill + Fermenter: 10× Honey, 10× Raspberries, 5× Blueberries');
  assert.equal(icon($('.sub svg', m)), '#station-mead-ketill');
  assert.deepEqual($$('#gather .colhead').map(text).slice(0, 2), ['Dishes', 'Meads']);
});
check('search hides rows in place and says when nothing matches', () => {
  const search = $('#gather input.search');
  change(search, { value: '  MEAD ' });
  fire(search, 'input');
  assert.deepEqual(gatherNames().sort(), ['Minor healing mead', 'Minor stamina mead', 'Poison resistance mead', 'Tasty mead']);
  assert.equal($('#gather-none').hidden, true);
  search.value = 'carrot';
  fire(search, 'input');
  assert.ok(gatherNames().includes('Deer stew'), 'matches ingredients');
  search.value = 'stamina regen';
  fire(search, 'input');
  assert.deepEqual(gatherNames(), ['Tasty mead'], 'matches the mead effect');
  search.value = 'zzz';
  fire(search, 'input');
  assert.deepEqual(gatherNames(), []);
  assert.equal($('#gather-none').hidden, false);
  click(button('Add 2 Boar jerky', $$('#gather .list .row').find((r) => r.textContent.includes('Boar jerky'))));
  assert.equal($('#gather input.search').value, 'zzz', 'the query survives a re-render');
  assert.deepEqual(gatherNames(), []);
  search.value = '';
  fire($('#gather input.search'), 'input');
  $('#gather input.search').value = '';
  fire($('#gather input.search'), 'input');
  assert.equal($('#gather-none').hidden, true);
  click(button('Clear', $('#gather')));
});

// ---- resources ----------------------------------------------------------------------------
check('unticking a resource hides every dish that needs it, everywhere', () => {
  assert.deepEqual($$('#resources .resgroup h3').map(text), ['Black Forest', 'Meadows']);
  const bf = $('#resources .resgroup');
  assert.equal(text($('.cnt', bf)), '9 / 9');
  const names = $$('label .nm', bf).map(text);
  assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b)));
  const carrot = $$('label', bf).find((l) => text($('.nm', l)) === 'Carrot');
  assert.equal(text($('.src', carrot)), 'Grow from Carrot seeds (ground)');
  click(button('Add 1 Deer stew', gatherRow('Deer stew')));
  change($('input', carrot), { checked: false });
  assert.deepEqual(saved().off, ['Carrot']);
  assert.equal(text($('#resources .resgroup .cnt')), '8 / 9');
  assert.equal($$('#resources label').find((l) => text($('.nm', l)) === 'Carrot').className, 'off');
  for (const gone of ['Carrot', 'Carrot soup', 'Deer stew', 'Minced meat sauce', 'Pulled Bear']) {
    assert.equal(overviewNames().includes(gone), false, gone);
    assert.equal(gatherRow(gone), undefined, gone);
  }
  assert.equal(text($('#best .count-note')), '11 foods from your resources, 1 resource skipped');
  assert.equal($('#gather-badge').hidden, true);
  assert.equal(text($('#gather-hidden')), '1 more entry hidden by feasts, resources or biome, not counted');
  change($('input', $$('#resources label').find((l) => text($('.nm', l)) === 'Honey')), { checked: false });
  assert.equal(text($('#best .count-note')), '9 foods from your resources, 2 resources skipped');
  change($('input', $$('#resources label').find((l) => text($('.nm', l)) === 'Carrot')), { checked: true });
  assert.deepEqual(saved().off, ['Honey']);
  click(button('Untick all', $('#resources')));
  // only what the player can see: 18 at Black Forest, not every resource in the game
  assert.equal(text($('#best .count-note')), '0 foods from your resources, 18 resources skipped');
  assert.equal(saved().off.length, 18);
  for (const b of builds()) assert.equal(text($('.empty', b)), 'Fewer than three foods available. Tick more resources.');
  click(button('Tick all', $('#resources')));
  assert.deepEqual(saved().off, []);
  assert.equal($('#gather-badge').textContent, '1');
  click(button('Clear', $('#gather')));
});

// ---- feasts at Swamp ----------------------------------------------------------------------
check('feasts: off by default, step by 10 portions, counted as feasts in the crafting order', () => {
  click($('#biome-control .primary'));
  assert.equal(gatherRow("Sailor's bounty"), undefined);
  toggle('best', 'Include feasts');
  assert.equal(saved().feasts, true);
  assert.equal($('input', checkbox('overview', 'Feasts')).checked, true);
  const feast = gatherRow("Sailor's bounty");
  assert.equal(text($('.tag-feast', feast)), 'FEAST');
  assert.equal(icon($('.tag-feast svg', feast)), '#ui-feast');
  assert.equal($('.tag-feast svg', feast).getAttribute('class'), 'ic ic-13');
  click($('.mark.info', feast));
  assert.equal(popover().textContent, 'A feast is placed with the Serving tray and serves 10 portions. Portions go in steps of 10. Stacks 5 per slot.');
  click($('.mark.info', feast));
  assert.equal(text($('.sub', feast)), "Food preparation table: 5× Cooked fish, 4× Thistle, 2× Cooked serpent meat, 1× Seafarer's herbs");
  click(button("Add 10 Sailor's bounty", feast));
  assert.equal(steps().at(-1), "Sailor's bounty · Food preparation table1 feast = 10 portions");
  click(button("Add 10 Sailor's bounty", gatherRow("Sailor's bounty")));
  assert.equal(steps().at(-1), "Sailor's bounty · Food preparation table2 feasts = 20 portions");
  assert.equal(totals()["Seafarer's herbs"], 2);
  const chips = $$('#best .chip.feast');
  if (chips.length) assert.ok($('svg', chips[0]), 'feast pill has the feast icon');
  toggle('overview', 'Feasts');
  assert.equal(saved().feasts, false);
  assert.equal(text($('#gather-hidden')), '1 more entry hidden by feasts, resources or biome, not counted');
  click(button('Clear', $('#gather')));
});

// ---- storage ------------------------------------------------------------------------------
store.set(KEY, JSON.stringify({ biome: 'Meadows', sort: 'health', dir: 'asc', grouped: false }));
await boot();
check('a returning visit restores biome and sort', () => {
  assert.equal($('#picker').hidden, true);
  assert.equal(text($('.spoiler-chip')), 'Spoilers: Meadows and earlier');
  assert.equal(overviewNames()[0], 'Raspberries');
  assert.equal($('#overview tr.group'), null);
});
storageBroken = true;
await boot();
check('blocked storage: the page still runs, starting at the picker', () => {
  assert.equal($('#picker').hidden, false);
  click(button("Show everything, I don't mind spoilers"));
  assert.equal(text($('.spoiler-chip')), 'Spoilers: Deep North and earlier');
  assert.equal($('#biome-control .primary'), null);
});
check('Deep North: an eitr combo totals all three stats; a feast pill carries the feast mark', () => {
  const sums = $$('.sum .n', $('.combo', build('Max eitr'))).map((s) => Number(text(s)));
  assert.ok(sums[2] > 0, 'an eitr food');
  assert.equal(sums[3], sums[0] + sums[1] + sums[2]);
  toggle('best', 'Include feasts');
  toggle('overview', 'Combos');
  const chip = $('#overview .chip.feast');
  assert.ok(chip, 'a feast among the top combos');
  assert.equal(chip.className, 'chip feast');
  assert.equal(icon($('svg', chip)), '#ui-feast');
  assert.equal($('svg', chip).getAttribute('class'), 'ic ic-13');
  assert.equal($$('#overview .chip').filter((c) => c.className === 'chip feast').length, $$('#overview .chip svg').length, 'only feasts carry the mark');
});
storageBroken = false;
store.set(KEY, JSON.stringify({ biome: 'Meadows', picks: { Honey: 0 } }));
await boot();
check('a saved zero pick counts as nothing', () => {
  assert.equal(text($('#gather .head .mono')), '0 entries · 0 portions');
  assert.equal($('#gather-badge').hidden, true);
});
for (const [label, bad] of [
  ['a biome that no longer exists', { biome: 'Ocean' }],
  ['null picks and off, an unknown sort', { biome: 'Meadows', picks: null, off: null, sort: 'weight', dir: 'up' }],
]) {
  store.set(KEY, JSON.stringify(bad));
  await boot();
  check(`saved state with ${label} falls back to defaults instead of a blank page`, () => {
    if (bad.biome === 'Ocean') return assert.equal($('#picker').hidden, false);
    assert.equal(text($('.spoiler-chip')), 'Spoilers: Meadows and earlier');
    assert.equal(overviewNames().length, 6);
    assert.equal(text($('#gather .head .mono')), '0 entries · 0 portions');
  });
}
check('a save in another tab shows here, so the next click does not overwrite it', () => {
  store.set(KEY, JSON.stringify({ biome: 'Meadows', picks: { Raspberries: 1 } }));
  fire(window, 'storage', { key: KEY });
  assert.equal($('#gather-badge').textContent, '1');
  click(button('Add 1 Honey', gatherRow('Honey')));
  assert.deepEqual(saved().picks, { Raspberries: 1, Honey: 1 });
  click(button('Clear', $('#gather')));
});
check('the footer privacy summary carries the same date and version as privacy.html', () => {
  const full = /Last updated ([^<]+?) &middot; Version ([\d.]+)/.exec(readFileSync(new URL('./privacy.html', import.meta.url), 'utf8'));
  assert.equal(text($('#privacy p')), `Last updated ${full[1]}, version ${full[2]}.`);
});

if (failed) {
  console.log(`${failed} page check(s) failed`);
  process.exit(1);
}
console.log('all page checks pass');
