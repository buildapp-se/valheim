import { ITEMS } from './data.js';
import {
  BIOMES,
  BUILDS,
  bestCombos,
  biomeRank,
  gather,
  getItem,
  loadItems,
  portionStep,
  servings,
  rawMaterials,
  snap,
  type Biome,
  type Build,
  type Combo,
  type CraftStep,
  type Item,
} from './model.js';
import {
  BIOME_BLURB,
  BIOME_INDEX,
  biomeIcon,
  closePopover,
  h,
  ic,
  mark,
  raw,
  replace,
  stationIcon,
  togglePopover,
  unverifiedMark,
} from './ui.js';

loadItems(ITEMS);

// ---- state ------------------------------------------------------------------
type SortKey = 'name' | 'health' | 'stamina' | 'eitr' | 'total' | 'healing' | 'duration' | 'station';
interface State {
  biome: Biome | null;
  /** raw resources the player can't be bothered to fetch; everything else is on */
  off: string[];
  picks: Record<string, number>;
  feasts: boolean;
  sort: SortKey;
  dir: 'asc' | 'desc';
  /** overview: sort inside each biome group (true) or one flat list */
  grouped: boolean;
  combos: boolean;
}
const KEY = 'valheim-food-planner:v1';
const state: State = { biome: null, off: [], picks: {}, feasts: false, sort: 'total', dir: 'desc', grouped: true, combos: false };
try {
  const saved = localStorage.getItem(KEY);
  if (saved) Object.assign(state, JSON.parse(saved) as Partial<State>);
} catch {
  /* private mode or blocked storage: run without persistence */
}
// picks are portions; snap anything saved before that (or for a renamed item) to valid steps
for (const [name, n] of Object.entries(state.picks)) {
  try {
    state.picks[name] = snap(getItem(name), n);
  } catch {
    delete state.picks[name];
  }
}
function save(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}
function update(patch: Partial<State>): void {
  Object.assign(state, patch);
  save();
  render();
}

/** view-only state: never persisted, never part of a URL */
let pickerChoice: Biome | null = null;
const expanded = new Set<string>();

// ---- derived --------------------------------------------------------------------
const foods = ITEMS.filter((i) => i.food);
const meads = ITEMS.filter((i) => i.mead);
const raws = ITEMS.filter((i) => !i.recipe);
const rawOf = new Map(ITEMS.map((i) => [i.name, rawMaterials(i)]));
// absolute bar scale: the strongest verified single food; unverified rows may overflow and get clamped
const MAX_TOTAL = Math.max(...foods.filter((f) => !f.food?.feast && !f.food?.unverified).map((f) => total(f)));
const MAX_REGEN = Math.max(...foods.map((f) => f.food?.healing ?? 0));

function total(it: Item): number {
  const f = it.food;
  return f ? f.health + f.stamina + f.eitr : 0;
}
function inBiome(it: Item): boolean {
  return state.biome !== null && biomeRank(it.biome) <= biomeRank(state.biome);
}
/** foods in your biome whose whole ingredient tree is ticked in Resources */
function visibleFoods(): Item[] {
  return foods.filter((f) => inBiome(f) && (state.feasts || !f.food?.feast) && canMake(f));
}
function canMake(it: Item): boolean {
  const off = new Set(state.off);
  for (const r of rawOf.get(it.name) ?? []) if (off.has(r)) return false;
  return true;
}
function mmss(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

let comboCache: { key: string; result: Map<string, Combo[]> } | null = null;
function combosFor(build: Build): Combo[] {
  const key = JSON.stringify([state.biome, state.feasts, [...state.off].sort()]);
  if (comboCache?.key !== key) {
    const cand = visibleFoods();
    comboCache = { key, result: new Map(BUILDS.map((b) => [b.id, bestCombos(cand, b)])) };
  }
  return comboCache.result.get(build.id) ?? [];
}

// ---- shared pieces --------------------------------------------------------------
function bars(s: { health: number; stamina: number; eitr: number; healing: number }, scale: number, regenScale: number): HTMLElement {
  const pct = (v: number): string => `${Math.min(100, (100 * v) / scale)}%`;
  const seg = (cls: string, v: number, label: string): HTMLElement =>
    h('span', { class: cls, style: `width:${pct(v)}`, title: `${label} ${v}`, 'aria-label': `${label} ${v}` });
  return h(
    'div',
    { class: 'bars' },
    h('div', { class: 'bar' }, seg('h', s.health, 'Health'), seg('s', s.stamina, 'Stamina'), seg('e', s.eitr, 'Eitr')),
    h('div', { class: 'regen' }, h('span', { style: `width:${pct((s.healing * scale) / regenScale)}`, title: `${s.healing} hp/tick`, 'aria-label': `${s.healing} hp per tick` })),
  );
}
const legend = (): HTMLElement =>
  h(
    'div',
    { class: 'legend' },
    h('span', {}, h('i', { style: 'background:var(--health)' }), 'health'),
    h('span', {}, h('i', { style: 'background:var(--stamina)' }), 'stamina'),
    h('span', {}, h('i', { style: 'background:var(--eitr)' }), 'eitr'),
    h('span', {}, h('i', { style: 'background:var(--regen)' }), 'hp/tick (thin bar)'),
  );

/** the six stat slots, always in the same order so the eye compares down the column */
function statSlots(s: { health: number; stamina: number; eitr: number; healing: number; duration: number }): HTMLElement {
  const slot = (cls: string, icon: string, text: string, label: string): HTMLElement =>
    h('span', { class: `n ${cls}`, title: label }, ic(icon, 'ic-14'), text);
  return h(
    'div',
    { class: 'sum' },
    slot('h', 'icon-health', String(s.health), 'Health'),
    slot('s', 'icon-stamina', String(s.stamina), 'Stamina'),
    slot('e', 'icon-eitr', String(s.eitr), 'Eitr'),
    slot('t', 'icon-total', String(s.health + s.stamina + s.eitr), 'Total'),
    slot('r', 'icon-regen', `+${s.healing}/tick`, 'Health per tick'),
    slot('d', 'icon-duration', mmss(s.duration), 'Duration'),
  );
}

/** why a dish doesn't step by 1; null for ordinary dishes */
function stepNote(it: Item): string | null {
  const y = it.recipe?.yield ?? 1;
  if (it.food?.feast) return `A feast is placed with the Serving tray and serves ${servings(it)} portions. Portions go in steps of ${portionStep(it)}. Stacks 5 per slot.`;
  if (y > 1) return `One craft makes ${y}, so portions go in steps of ${y}.`;
  return null;
}
const infoMark = (it: Item): HTMLElement | null => {
  const note = stepNote(it);
  return note ? mark('ui-info', 'info', `Why ${it.name} steps in ${portionStep(it)}s`, note) : null;
};
const feastTag = (it: Item): HTMLElement | null =>
  it.food?.feast ? h('span', { class: 'tag-feast' }, ic('ui-feast', 'ic-13'), 'FEAST') : null;

const ingredients = (it: Item): string =>
  Object.entries(it.recipe?.materials ?? {})
    .map(([m, q]) => `${q}× ${m}`)
    .join(', ') || (it.source ?? '');

/** "Cauldron (2): 1× Mushroom, 1× Honey" — the line under a dish and in the overview */
function stationLine(it: Item): string {
  if (!it.recipe) return it.source ?? '';
  const y = it.recipe.yield;
  return `${it.recipe.station}${y > 1 && !it.mead ? ` ×${y}` : ''}: ${ingredients(it)}`;
}

/** a food pill in a combo; click shows its station and ingredients so nobody has to hunt the gather list */
function foodChip(f: Item): HTMLElement {
  const b = h(
    'button',
    {
      type: 'button',
      class: `chip${f.food?.feast ? ' feast' : ''}`,
      'aria-expanded': 'false',
      'aria-label': `${f.name}: show ingredients`,
      onclick: (e: Event) => {
        e.stopPropagation();
        togglePopover(b, stationLine(f));
      },
    },
    f.food?.feast ? ic('ui-feast', 'ic-13') : null,
    f.name,
  );
  return b;
}

// ---- header -----------------------------------------------------------------------
function renderBiome(): void {
  const b = state.biome;
  const idx = b === null ? -1 : biomeRank(b);
  (document.getElementById('biome-control') as HTMLElement).hidden = b === null;
  if (b === null) {
    replace('biome-control');
    return;
  }
  replace(
    'biome-control',
    h('span', { class: 'spoiler-chip' }, `Spoilers: ${b} and earlier`),
    h(
      'span',
      { class: 'pick' },
      ic(biomeIcon(b), 'ic-16'),
      h(
        'select',
        { 'aria-label': 'Highest biome reached', onchange: (e: Event) => update({ biome: (e.target as HTMLSelectElement).value as Biome }) },
        ...BIOMES.map((x) => h('option', { value: x, selected: x === b ? '' : null }, x)),
      ),
    ),
    idx < BIOMES.length - 1 &&
      h('button', { class: 'primary', onclick: () => update({ biome: BIOMES[idx + 1] as Biome }) }, `Next: ${BIOMES[idx + 1]}`, ic('ui-next', 'ic-14')),
    idx < BIOMES.length - 1 && h('button', { onclick: () => update({ biome: 'Deep North' }) }, ic('ui-show-all', 'ic-14'), 'Show all'),
  );
}

// ---- first visit -------------------------------------------------------------------
/** flat polygons for the ridge line, hairline rules for cold mist; no image file, no host */
const RIDGE = `<svg class="ridge" viewBox="0 0 1400 440" preserveAspectRatio="none" aria-hidden="true" focusable="false">
  <polygon points="0,440 250,208 470,440" fill="#14171c"></polygon>
  <polygon points="300,440 620,150 940,440" fill="#1b1f26"></polygon>
  <polygon points="820,440 1080,232 1400,440" fill="#14171c"></polygon>
  <polygon points="560,196 620,150 680,196 650,214 620,190 590,214" fill="#2a3038"></polygon>
  <rect x="0" y="318" width="1400" height="2" fill="#2a3038" opacity=".55"></rect>
  <rect x="0" y="352" width="1400" height="2" fill="#2a3038" opacity=".4"></rect>
  <rect x="0" y="386" width="1400" height="2" fill="#2a3038" opacity=".25"></rect>
</svg>`;

function renderPicker(): void {
  const el = document.getElementById('picker') as HTMLElement;
  el.hidden = state.biome !== null;
  for (const id of ['best', 'overview', 'gather', 'resources']) (document.getElementById(id) as HTMLElement).hidden = state.biome === null;
  if (state.biome !== null) return;
  const chosen = pickerChoice;
  replace(
    'picker',
    h(
      'div',
      { class: 'hero' },
      h('div', { class: 'glow' }),
      raw(RIDGE),
      h('div', { class: 'eyebrow' }, ic('app-icon'), h('span', {}, 'FAN TOOL · NO ADS · NO COOKIES')),
      h('h2', {}, 'Three foods.', h('br'), 'The right three.'),
      h('p', {}, 'Pick your build, take the combo, and walk out with a gather list of exactly what to farm — nothing from biomes you have not reached.'),
    ),
    h(
      'div',
      { class: 'intro' },
      h('h2', {}, 'How far have you come?'),
      h(
        'p',
        {},
        'Pick the furthest biome you have reached. Everything past it stays hidden — no foods, no ingredients, no bosses you have not met. You can change this any time from the header.',
      ),
    ),
    h(
      'div',
      { class: 'choices' },
      ...BIOMES.map((x) =>
        h(
          'button',
          {
            class: 'tile',
            type: 'button',
            'aria-pressed': String(chosen === x),
            onclick: () => {
              pickerChoice = x;
              renderPicker();
            },
          },
          h('span', { class: 'tile-top' }, ic(biomeIcon(x)), h('span', { class: 'num' }, String(BIOME_INDEX.get(x)).padStart(2, '0'))),
          h('span', {}, h('span', { class: 'nm' }, x), h('span', { class: 'sub' }, BIOME_BLURB[x])),
        ),
      ),
    ),
    h(
      'div',
      { class: 'go' },
      h(
        'button',
        { class: 'primary', disabled: chosen === null, onclick: () => chosen && update({ biome: chosen }) },
        chosen ? `Continue to ${chosen}` : 'Pick a biome to continue',
        ic('ui-next', 'ic-18'),
      ),
      h('button', { onclick: () => update({ biome: 'Deep North' }) }, ic('ui-show-all', 'ic-18'), "Show everything, I don't mind spoilers"),
    ),
  );
}

// ---- best food ----------------------------------------------------------------------
function renderBest(): void {
  const cand = visibleFoods();
  const off = state.off.length;
  replace(
    'best',
    h(
      'div',
      { class: 'head' },
      h('h2', {}, 'Best food'),
      h(
        'label',
        { class: 'check' },
        h('input', { type: 'checkbox', checked: state.feasts, onchange: (e: Event) => update({ feasts: (e.target as HTMLInputElement).checked }) }),
        'Include feasts',
      ),
      h('span', { class: 'count-note' }, `${cand.length} foods from your resources${off ? `, ${off} resource${off > 1 ? 's' : ''} skipped` : ''}`),
    ),
    legend(),
    h(
      'div',
      { class: 'builds' },
      ...BUILDS.map((b) => {
        const combos = combosFor(b);
        return h(
          'div',
          { class: 'build card' },
          h('div', { class: 'title' }, ic(buildIcon(b.id), 'ic-20'), h('h3', {}, b.label), h('span', { class: 'hint' }, b.hint)),
          combos.length === 0
            ? h('div', { class: 'empty' }, 'Fewer than three foods available. Tick more resources.')
            : combos.map((c) =>
                h(
                  'div',
                  { class: 'combo' },
                  h('div', { class: 'foods' }, ...c.foods.map((f) => [foodChip(f), unverifiedMark(f)])),
                  h('div', { class: 'row2' }, statSlots(c.sum), comboStepper(c)),
                  bars(c.sum, MAX_TOTAL * 3, MAX_REGEN * 3),
                ),
              ),
        );
      }),
    ),
  );
}
function buildIcon(id: string): string {
  switch (id) {
    case 'health':
      return 'icon-health';
    case 'stamina':
      return 'icon-stamina';
    case 'eitr':
    case 'mage':
      return 'icon-eitr';
    default:
      return 'icon-total';
  }
}

/** add (+1) or remove (-1) one craft of each food in the combo */
function stepCombo(c: Combo, dir: 1 | -1): void {
  const picks = { ...state.picks };
  for (const f of c.foods) {
    const next = Math.max(0, (picks[f.name] ?? 0) + dir * snap(f, 1));
    if (next === 0) delete picks[f.name];
    else picks[f.name] = next;
  }
  update({ picks });
}
/** − N +, where N is how many full rounds of this trio the gather list holds */
function comboStepper(c: Combo): HTMLElement {
  const n = Math.min(...c.foods.map((f) => Math.floor((state.picks[f.name] ?? 0) / snap(f, 1))));
  return h(
    'span',
    { class: 'stepper', title: 'One craft of each food, in the gather list' },
    h('button', { type: 'button', 'aria-label': 'Remove one round', onclick: () => stepCombo(c, -1), disabled: c.foods.every((f) => !state.picks[f.name]) }, ic('ui-remove', 'ic-14')),
    h('b', { class: 'count' }, String(n)),
    h('button', { type: 'button', class: 'plus', 'aria-label': 'Add one round', onclick: () => stepCombo(c, 1) }, ic('ui-add', 'ic-14')),
  );
}

// ---- overview -------------------------------------------------------------------------
/** highest level number in a station name, "Cauldron (7) + Stone oven" -> 7; 0 when there is none */
function stationLevel(it: Item): number {
  const levels = [...(it.recipe?.station ?? '').matchAll(/\((\d+)\)/g)].map((m) => Number(m[1]));
  return levels.length ? Math.max(...levels) : 0;
}
const SORTS: Record<Exclude<SortKey, 'name'>, (a: Item) => number> = {
  health: (a) => a.food?.health ?? 0,
  stamina: (a) => a.food?.stamina ?? 0,
  eitr: (a) => a.food?.eitr ?? 0,
  total,
  healing: (a) => a.food?.healing ?? 0,
  duration: (a) => a.food?.duration ?? 0,
  station: stationLevel,
};
const COMBO_SORTS: Record<Exclude<SortKey, 'name'>, (c: Combo) => number> = {
  health: (c) => c.sum.health,
  stamina: (c) => c.sum.stamina,
  eitr: (c) => c.sum.eitr,
  total: (c) => c.sum.health + c.sum.stamina + c.sum.eitr,
  healing: (c) => c.sum.healing,
  duration: (c) => c.sum.duration,
  station: (c) => Math.max(...c.foods.map(stationLevel)),
};
const COLUMNS: Array<{ key: SortKey; label: string; numeric: boolean; cls?: string }> = [
  { key: 'name', label: 'Food', numeric: false, cls: 'col-name' },
  { key: 'health', label: 'Health', numeric: true },
  { key: 'stamina', label: 'Stamina', numeric: true },
  { key: 'eitr', label: 'Eitr', numeric: true },
  { key: 'total', label: 'Total', numeric: true },
  { key: 'healing', label: 'hp/tick', numeric: true },
  { key: 'duration', label: 'Time', numeric: true, cls: 'col-time' },
  { key: 'station', label: 'Station', numeric: false, cls: 'ing' },
];

/** first click: biggest first (A to Z for names); same column again flips it */
function clickSort(key: SortKey): void {
  if (state.sort === key) update({ dir: state.dir === 'asc' ? 'desc' : 'asc' });
  else update({ sort: key, dir: key === 'name' ? 'asc' : 'desc' });
}
function sortHeader(col: (typeof COLUMNS)[number], label = col.label): HTMLElement {
  const active = state.sort === col.key;
  const arrow = active ? (state.dir === 'asc' ? 'ui-sort-asc' : 'ui-sort-desc') : 'ui-sort-idle';
  const ariaSort = active ? (state.dir === 'asc' ? 'ascending' : 'descending') : 'none';
  return h(
    'th',
    { class: [col.numeric ? 'n' : '', col.cls ?? ''].join(' ').trim() || null, 'aria-sort': ariaSort, scope: 'col' },
    h(
      'button',
      { type: 'button', class: `sort${active ? ' active' : ''}`, onclick: () => clickSort(col.key), title: `Sort by ${label.toLowerCase()}` },
      label,
      h('span', { class: 'arrow' }, ic(arrow, 'ic-13')),
    ),
  );
}

function renderOverview(): void {
  const vis = visibleFoods();
  const sign = state.dir === 'asc' ? 1 : -1;
  const check = (label: string, checked: boolean, onchange: (on: boolean) => void, disabled = false): HTMLElement =>
    h('label', { class: `check${disabled ? ' muted' : ''}` }, h('input', { type: 'checkbox', checked, disabled, onchange: (e: Event) => onchange((e.target as HTMLInputElement).checked) }), label);
  const head = h(
    'div',
    { class: 'head' },
    h('h2', {}, state.combos ? 'Three-food combos' : 'Overview'),
    check('Per biome', state.grouped && !state.combos, (on) => update({ grouped: on }), state.combos),
    check('Combos', state.combos, (on) => update({ combos: on })),
    check('Feasts', state.feasts, (on) => update({ feasts: on })),
  );

  const body: HTMLElement[] = [];
  if (state.combos) {
    // always the top 30 for the chosen column; the arrow only flips their order
    // name and station can't pick a top 30 from summed stats alone, so they order the top 30 by total
    const key = state.sort === 'name' || state.sort === 'station' ? 'total' : state.sort;
    const top = bestCombos(vis, { id: 'x', label: '', hint: '', score: (s) => COMBO_SORTS[key]({ foods: [], sum: s, score: 0 }) }, 30);
    const pick = COMBO_SORTS[state.sort === 'name' ? 'total' : state.sort];
    const names = (c: Combo): string => c.foods.map((f) => f.name).sort().join(', ');
    const sorted =
      state.sort === 'name'
        ? top.sort((a, b) => sign * names(a).localeCompare(names(b)))
        : top.sort((a, b) => sign * (pick(a) - pick(b)) || COMBO_SORTS.total(b) - COMBO_SORTS.total(a));
    body.push(
      ...sorted.map((c) =>
        h(
          'tr',
          {},
          h('td', { class: 'name' }, h('div', { class: 'rowname' }, ...c.foods.map((f) => [foodChip(f), unverifiedMark(f)]))),
          h('td', { class: 'col-bars' }, bars(c.sum, MAX_TOTAL * 3, MAX_REGEN * 3)),
          h('td', { class: 'n num h' }, String(c.sum.health)),
          h('td', { class: 'n num s' }, String(c.sum.stamina)),
          h('td', { class: 'n num e' }, String(c.sum.eitr)),
          h('td', { class: 'n num' }, String(COMBO_SORTS.total(c))),
          h('td', { class: 'n num r' }, String(c.sum.healing)),
          h('td', { class: 'n num d col-time' }, mmss(c.sum.duration)),
          h('td', { class: 'ing' }, h('div', { class: 'inner' }, ic('station-cauldron', 'ic-15'), COMBO_SORTS.station(c) ? `Cauldron level ${COMBO_SORTS.station(c)} or lower` : 'No cauldron')),
          h('td', { class: 'add' }, comboStepper(c)),
        ),
      ),
    );
  } else {
    const cmp = (a: Item, b: Item): number => {
      const primary = state.sort === 'name' ? a.name.localeCompare(b.name) : SORTS[state.sort](a) - SORTS[state.sort](b);
      return sign * primary || total(b) - total(a) || a.name.localeCompare(b.name);
    };
    const rows = (f: Item): HTMLElement[] => {
      const st = f.food as NonNullable<Item['food']>;
      const open = expanded.has(f.name);
      const sIcon = stationIcon(f.recipe?.station);
      const panel = h(
        'tr',
        { class: `panel${open ? ' open' : ''}` },
        h(
          'td',
          { colspan: 10 },
          h(
            'div',
            { class: 'grid' },
            h('span', { class: 'k' }, 'Bars'),
            bars(st, MAX_TOTAL, MAX_REGEN),
            h('span', { class: 'k' }, 'Time'),
            h('span', { class: 'num' }, mmss(st.duration)),
            h('span', { class: 'k' }, f.recipe ? 'Station' : 'Source'),
            h('span', {}, stationLine(f)),
            h('span', { class: 'k' }, 'Add'),
            h('span', {}, rowStepper(f)),
          ),
        ),
      );
      const toggle = h(
        'button',
        {
          type: 'button',
          class: 'expand',
          'aria-expanded': String(open),
          'aria-label': `More about ${f.name}`,
          onclick: () => {
            if (expanded.has(f.name)) expanded.delete(f.name);
            else expanded.add(f.name);
            panel.classList.toggle('open');
            toggle.setAttribute('aria-expanded', String(expanded.has(f.name)));
          },
        },
        ic('ui-sort-desc', 'ic-15'),
      );
      const row = h(
        'tr',
        {},
        h(
          'td',
          { class: 'name' },
          h(
            'div',
            { class: 'rowname' },
            f.name,
            feastTag(f),
            unverifiedMark(f),
            infoMark(f),
            !state.grouped ? h('span', { class: 'tag' }, f.biome) : null,
            toggle,
          ),
        ),
        h('td', { class: 'col-bars' }, bars(st, MAX_TOTAL, MAX_REGEN)),
        h('td', { class: 'n num h' }, String(st.health)),
        h('td', { class: 'n num s' }, String(st.stamina)),
        h('td', { class: 'n num e' }, st.eitr ? String(st.eitr) : ''),
        h('td', { class: 'n num' }, String(total(f))),
        h('td', { class: 'n num r' }, String(st.healing)),
        h('td', { class: 'n num d col-time' }, mmss(st.duration)),
        h('td', { class: 'ing' }, h('div', { class: 'inner' }, sIcon ? ic(sIcon, 'ic-15') : null, stationLine(f))),
        h('td', { class: 'add' }, rowStepper(f)),
      );
      return [row, panel];
    };
    if (state.grouped) {
      for (let r = biomeRank(state.biome as Biome); r >= 0; r--) {
        const biome = BIOMES[r] as Biome;
        const list = vis.filter((f) => f.biome === biome).sort(cmp);
        if (list.length === 0) continue;
        body.push(
          h(
            'tr',
            { class: 'group' },
            h('td', { colspan: 10 }, h('div', { class: 'gh' }, ic(biomeIcon(biome), 'ic-18'), h('h3', {}, biome), h('span', { class: 'cnt' }, `${list.length} foods`))),
          ),
          ...list.flatMap(rows),
        );
      }
    } else {
      body.push(...[...vis].sort(cmp).flatMap(rows));
    }
  }
  const headers = COLUMNS.map((col) => (col.key === 'station' ? sortHeader(col, state.combos ? 'Station' : 'Station: ingredients') : sortHeader(col)));
  const [foodHead, ...numHeads] = headers;
  replace(
    'overview',
    head,
    legend(),
    h(
      'div',
      { class: 'tablewrap' },
      h(
        'div',
        { class: 'scroll' },
        h(
          'table',
          {},
          h('thead', {}, h('tr', {}, foodHead as HTMLElement, h('th', { class: 'plain col-bars', scope: 'col' }, 'Bars'), ...numHeads, h('th', { class: 'plain col-add', scope: 'col' }, h('span', { class: 'muted' }, 'Add')))),
          h('tbody', {}, ...body),
        ),
      ),
      h('span', { class: 'fade' }),
    ),
  );
}

// ---- gather ---------------------------------------------------------------------------
function addPick(it: Item, crafts: number): void {
  const picks = { ...state.picks };
  const next = Math.max(0, (picks[it.name] ?? 0) + crafts * portionStep(it));
  if (next === 0) delete picks[it.name];
  else picks[it.name] = next;
  update({ picks });
}
function stepper(it: Item): HTMLElement {
  const n = state.picks[it.name] ?? 0;
  const step = portionStep(it);
  return h(
    'span',
    { class: 'stepper wide' },
    h('button', { type: 'button', class: 'big', 'aria-label': `Remove ${5 * step} ${it.name}`, onclick: () => addPick(it, -5), disabled: n === 0 }, `−${5 * step}`),
    h('button', { type: 'button', 'aria-label': `Remove ${step} ${it.name}`, onclick: () => addPick(it, -1), disabled: n === 0 }, `−${step}`),
    h('input', {
      type: 'number',
      min: 0,
      step,
      'aria-label': `${it.name} portions`,
      value: n,
      onchange: (e: Event) => {
        const v = snap(it, Number((e.target as HTMLInputElement).value) || 0);
        const picks = { ...state.picks };
        if (v === 0) delete picks[it.name];
        else picks[it.name] = v;
        update({ picks });
      },
    }),
    h('button', { type: 'button', class: 'plus', 'aria-label': `Add ${step} ${it.name}`, onclick: () => addPick(it, 1) }, `+${step}`),
    h('button', { type: 'button', class: 'plus big', title: 'Five crafts, like shift-click in the game', 'aria-label': `Add ${5 * step} ${it.name}`, onclick: () => addPick(it, 5) }, `+${5 * step}`),
  );
}
/** − N + for one dish in the overview, same look as the combo stepper; N is portions */
function rowStepper(it: Item): HTMLElement {
  const n = state.picks[it.name] ?? 0;
  const step = portionStep(it);
  return h(
    'span',
    { class: 'stepper', title: 'Portions in the gather list' },
    h('button', { type: 'button', 'aria-label': `Remove ${step} ${it.name}`, onclick: () => addPick(it, -1), disabled: n === 0 }, ic('ui-remove', 'ic-14')),
    h('b', { class: 'count' }, String(n)),
    h('button', { type: 'button', class: 'plus', 'aria-label': `Add ${step} ${it.name}`, onclick: () => addPick(it, 1) }, ic('ui-add', 'ic-14')),
  );
}
function pickRow(it: Item): HTMLElement {
  const sIcon = stationIcon(it.recipe?.station);
  return h(
    'div',
    { class: `row${(state.picks[it.name] ?? 0) > 0 ? ' picked' : ''}` },
    h(
      'div',
      { class: 'meta' },
      h(
        'div',
        { class: 'nm' },
        it.mead ? ic('ui-mead', 'ic-16 mead') : null,
        it.name,
        feastTag(it),
        unverifiedMark(it),
        infoMark(it),
        it.mead ? h('span', { class: 'effect' }, it.mead.effect) : null,
      ),
      h('div', { class: 'sub' }, sIcon ? ic(sIcon, 'ic-14') : null, stationLine(it)),
    ),
    stepper(it),
  );
}

function craftText(s: CraftStep): string {
  if (s.portions !== s.makes) return `${s.makes} feast${s.makes > 1 ? 's' : ''} = ${s.portions} portions`;
  return s.crafts === s.makes ? `${s.crafts}` : `${s.crafts} craft${s.crafts > 1 ? 's' : ''} → ${s.makes}`;
}
function renderGather(): void {
  const picked = Object.entries(state.picks).filter(([, n]) => n > 0);
  const portions = picked.reduce((a, [, n]) => a + n, 0);
  const g = gather(state.picks);
  const rawByBiome = new Map<Biome, Array<[string, number]>>();
  for (const [name, n] of [...g.raw.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const b = getItem(name).biome;
    rawByBiome.set(b, [...(rawByBiome.get(b) ?? []), [name, n]]);
  }
  const visFoods = visibleFoods().sort((a, b) => biomeRank(b.biome) - biomeRank(a.biome) || total(b) - total(a));
  const visMeads = meads.filter((m) => inBiome(m) && canMake(m)).sort((a, b) => biomeRank(b.biome) - biomeRank(a.biome) || a.name.localeCompare(b.name));
  replace(
    'gather',
    h(
      'div',
      { class: 'head' },
      h('h2', {}, 'Gather list'),
      h('span', { class: 'mono muted' }, `${picked.length} ${picked.length === 1 ? 'entry' : 'entries'} · ${portions} portions`),
      picked.length > 0 &&
        h('span', { class: 'controls right' }, h('button', { class: 'small danger', onclick: () => update({ picks: {} }) }, ic('ui-clear', 'ic-14'), 'Clear')),
    ),
    h(
      'p',
      { class: 'lede' },
      'Counts are portions, one per thing you eat. Dishes marked with an i come in bigger steps — open it to see why. The biggest button is five crafts, like shift-click. The right side is what to bring home, and in which order to craft it.',
    ),
    h(
      'div',
      { class: 'gather' },
      h(
        'div',
        { class: 'list-col' },
        h('div', { class: 'colhead' }, 'Dishes'),
        h('div', { class: 'list' }, ...visFoods.map(pickRow)),
        h('div', { class: 'colhead', style: 'margin-top:20px' }, 'Meads'),
        h('div', { class: 'list' }, ...visMeads.map(pickRow)),
      ),
      h(
        'div',
        { class: 'result' },
        h('div', { class: 'colhead' }, 'Raw resources'),
        picked.length === 0
          ? h('div', { class: 'empty' }, 'Nothing picked yet.')
          : [
              ...[...rawByBiome.entries()]
                .sort((a, b) => biomeRank(a[0]) - biomeRank(b[0]))
                .map(([b, list]) =>
                  h(
                    'div',
                    { class: 'resgroup' },
                    h('div', { class: 'gh' }, ic(biomeIcon(b), 'ic-17'), h('h3', {}, b), h('span', { class: 'cnt' }, `${list.length} item${list.length > 1 ? 's' : ''}`)),
                    ...list.map(([name, n]) =>
                      h(
                        'div',
                        { class: 'item' },
                        h('div', { class: 'meta' }, h('div', { class: 'nm' }, name), h('div', { class: 'src' }, getItem(name).source ?? '')),
                        h('span', { class: 'amt' }, String(n)),
                      ),
                    ),
                  ),
                ),
              h(
                'div',
                { class: 'card craft' },
                h('div', { class: 'colhead', style: 'margin-bottom:10px' }, 'Crafting order'),
                ...g.steps.map((s) => h('div', { class: 'step' }, h('span', {}, s.name, h('span', { class: 'st' }, ` · ${s.station}`)), h('b', {}, craftText(s)))),
              ),
            ],
      ),
    ),
  );
}

// ---- resources --------------------------------------------------------------------------
function renderResources(): void {
  const off = new Set(state.off);
  const vis = raws.filter(inBiome);
  const groups: HTMLElement[] = [];
  for (let r = biomeRank(state.biome as Biome); r >= 0; r--) {
    const biome = BIOMES[r] as Biome;
    const list = vis.filter((x) => x.biome === biome).sort((a, b) => a.name.localeCompare(b.name));
    if (list.length === 0) continue;
    const on = list.filter((x) => !off.has(x.name)).length;
    groups.push(
      h(
        'div',
        { class: 'resgroup' },
        h('div', { class: 'gh' }, ic(biomeIcon(biome), 'ic-17'), h('h3', {}, biome), h('span', { class: 'cnt' }, `${on} / ${list.length}`)),
        ...list.map((x) =>
          h(
            'label',
            { class: off.has(x.name) ? 'off' : '' },
            h('input', {
              type: 'checkbox',
              checked: !off.has(x.name),
              onchange: (e: Event) => {
                const isOn = (e.target as HTMLInputElement).checked;
                update({ off: isOn ? state.off.filter((o) => o !== x.name) : [...state.off, x.name] });
              },
            }),
            h('span', {}, h('span', { class: 'nm' }, x.name), h('span', { class: 'src' }, x.source ?? '')),
          ),
        ),
      ),
    );
  }
  replace(
    'resources',
    h(
      'div',
      { class: 'head' },
      h('h2', {}, 'Resources'),
      h('span', { class: 'controls right' }, h('button', { class: 'small', onclick: () => update({ off: [] }) }, 'Tick all'), h('button', { class: 'small', onclick: () => update({ off: raws.map((x) => x.name) }) }, 'Untick all')),
    ),
    h('p', { class: 'lede' }, 'Untick what you cannot farm. Every dish and mead that needs it, anywhere in its recipe, disappears from the whole page.'),
    h('div', { class: 'resgrid' }, ...groups),
  );
}

// ---- gather badge in the sticky nav -------------------------------------------------------
let lastCount = -1;
function renderBadge(): void {
  const badge = document.getElementById('gather-badge') as HTMLElement;
  const n = Object.values(state.picks).filter((v) => v > 0).length;
  badge.hidden = n === 0 || state.biome === null;
  badge.textContent = String(n);
  if (lastCount >= 0 && n > lastCount) {
    badge.classList.remove('pulse');
    void badge.offsetWidth; // restart the animation
    badge.classList.add('pulse');
  }
  lastCount = n;
}

// ---- render -------------------------------------------------------------------------------
function render(): void {
  closePopover();
  renderBiome();
  renderPicker();
  renderBadge();
  if (state.biome === null) return;
  renderBest();
  renderOverview();
  renderGather();
  renderResources();
}
render();

// highlight the nav link for the section in view
const links = [...document.querySelectorAll<HTMLAnchorElement>('#nav a')];
const observer = new IntersectionObserver(
  (entries) => {
    for (const e of entries) if (e.isIntersecting) links.forEach((a) => a.classList.toggle('active', a.hash === `#${e.target.id}`));
  },
  { rootMargin: '-30% 0px -60% 0px' },
);
for (const s of document.querySelectorAll('main section.panel')) observer.observe(s);
