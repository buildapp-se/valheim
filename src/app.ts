import { ITEMS } from './data.js';
import {
  BIOMES,
  BUILDS,
  bestCombos,
  biomeRank,
  gather,
  getItem,
  loadItems,
  rawMaterials,
  snap,
  sumOf,
  type Biome,
  type Build,
  type Combo,
  type Item,
  type Sum,
} from './model.js';

loadItems(ITEMS);

// ---- state ------------------------------------------------------------------
type SortKey = 'total' | 'health' | 'stamina' | 'eitr' | 'healing' | 'duration';
interface State {
  biome: Biome | null;
  /** raw resources the player can't be bothered to fetch; everything else is on */
  off: string[];
  picks: Record<string, number>;
  feasts: boolean;
  sort: SortKey;
  combos: boolean;
}
const KEY = 'valheim-food-planner:v1';
const state: State = { biome: null, off: [], picks: {}, feasts: false, sort: 'total', combos: false };
try {
  const saved = localStorage.getItem(KEY);
  if (saved) Object.assign(state, JSON.parse(saved) as Partial<State>);
} catch {
  /* private mode or blocked storage: run without persistence */
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
function visibleFoods(): Item[] {
  return foods.filter((f) => inBiome(f) && (state.feasts || !f.food?.feast));
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
    const cand = visibleFoods().filter(canMake);
    comboCache = { key, result: new Map(BUILDS.map((b) => [b.id, bestCombos(cand, b)])) };
  }
  return comboCache.result.get(build.id) ?? [];
}

// ---- tiny DOM helper ----------------------------------------------------------------
type Child = Node | string | null | undefined | false | Child[];
function h(tag: string, attrs: Record<string, unknown> = {}, ...children: Child[]): HTMLElement {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v as EventListener);
    else if (k === 'class') el.className = String(v);
    else if (k === 'checked' || k === 'disabled' || k === 'hidden') (el as unknown as Record<string, unknown>)[k] = v;
    else if (k === 'value') (el as HTMLInputElement).value = String(v);
    else el.setAttribute(k, String(v));
  }
  const append = (c: Child): void => {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) c.forEach(append);
    else el.append(c instanceof Node ? c : document.createTextNode(c));
  };
  children.forEach(append);
  return el;
}
function replace(id: string, ...children: Child[]): HTMLElement {
  const el = document.getElementById(id) as HTMLElement;
  el.replaceChildren(...Array.from(h('div', {}, ...children).childNodes));
  return el;
}

function bars(s: { health: number; stamina: number; eitr: number; healing: number }, scale: number, regenScale: number): HTMLElement {
  const pct = (v: number): string => `${Math.min(100, (100 * v) / scale)}%`;
  return h(
    'div',
    { class: 'bars' },
    h('div', { class: 'bar' }, h('span', { class: 'h', style: `width:${pct(s.health)}` }), h('span', { class: 's', style: `width:${pct(s.stamina)}` }), h('span', { class: 'e', style: `width:${pct(s.eitr)}` })),
    h('div', { class: 'regen' }, h('span', { style: `width:${pct((s.healing * scale) / regenScale)}` })),
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
const unverifiedMark = (it: Item): HTMLElement | null => {
  const note = it.food?.unverified ?? it.unverified;
  return note ? h('span', { class: 'warn', title: note }, ' ⚠') : null;
};
const ingredients = (it: Item): string =>
  Object.entries(it.recipe?.materials ?? {})
    .map(([m, q]) => `${q}× ${m}`)
    .join(', ') || (it.source ?? '');

// ---- sections ----------------------------------------------------------------------------
function renderBiome(): void {
  const b = state.biome;
  const idx = b === null ? -1 : biomeRank(b);
  (document.getElementById('biome-control') as HTMLElement).hidden = b === null;
  replace(
    'biome-control',
    h('span', { class: 'muted' }, 'Highest biome reached:'),
    h(
      'select',
      { onchange: (e: Event) => update({ biome: (e.target as HTMLSelectElement).value as Biome }) },
      ...BIOMES.map((x) => h('option', { value: x, selected: x === b ? '' : null }, x)),
    ),
    idx >= 0 && idx < BIOMES.length - 1 && h('button', { onclick: () => update({ biome: BIOMES[idx + 1] as Biome }) }, `Next: ${BIOMES[idx + 1]} ›`),
    idx < BIOMES.length - 1 && h('button', { onclick: () => update({ biome: 'Deep North' }) }, 'Show all'),
  );
}

function renderPicker(): void {
  const el = document.getElementById('picker') as HTMLElement;
  el.hidden = state.biome !== null;
  for (const id of ['best', 'overview', 'gather', 'resources']) (document.getElementById(id) as HTMLElement).hidden = state.biome === null;
  if (state.biome !== null) return;
  replace(
    'picker',
    h('h2', {}, 'Where are you in Valheim?'),
    h('p', {}, 'Pick the highest biome you have reached. Everything from later biomes stays hidden so nothing spoils you. You can move it one step at a time from the top of the page.'),
    h('div', { class: 'choices' }, ...BIOMES.map((x) => h('button', { class: 'primary', onclick: () => update({ biome: x }) }, x))),
  );
}

function renderBest(): void {
  const cand = visibleFoods().filter(canMake);
  const off = state.off.length;
  replace(
    'best',
    h(
      'div',
      { class: 'head' },
      h('h2', {}, 'Best food you can make'),
      h(
        'div',
        { class: 'controls' },
        h('span', { class: 'muted' }, `${cand.length} foods from your resources${off ? `, ${off} resource${off > 1 ? 's' : ''} skipped` : ''}`),
        h('label', {}, h('input', { type: 'checkbox', checked: state.feasts, onchange: (e: Event) => update({ feasts: (e.target as HTMLInputElement).checked }) }), ' include feasts'),
      ),
    ),
    legend(),
    h(
      'div',
      { class: 'builds', style: 'margin-top:0.6rem' },
      ...BUILDS.map((b) => {
        const combos = combosFor(b);
        return h(
          'div',
          { class: 'build' },
          h('h3', {}, b.label),
          h('div', { class: 'hint' }, b.hint),
          combos.length === 0
            ? h('div', { class: 'empty' }, 'Fewer than three foods available. Tick more resources.')
            : combos.map((c) =>
                h(
                  'div',
                  { class: 'combo' },
                  h('div', { class: 'foods' }, ...c.foods.map((f) => h('span', { class: 'chip' }, f.name, unverifiedMark(f)))),
                  h('button', { class: 'small', title: 'Add one craft of each to the gather list', onclick: () => addCombo(c) }, '+ gather'),
                  h(
                    'div',
                    { class: 'sum' },
                    h('span', { class: 'n h' }, `H ${c.sum.health}`),
                    h('span', { class: 'n s' }, `S ${c.sum.stamina}`),
                    h('span', { class: 'n e' }, `E ${c.sum.eitr}`),
                    h('span', { class: 'n r' }, `+${c.sum.healing}/tick`),
                    h('span', { class: 'muted' }, `${mmss(c.sum.duration)} min`),
                  ),
                  bars(c.sum, MAX_TOTAL * 3, MAX_REGEN * 3),
                ),
              ),
        );
      }),
    ),
  );
}
function addCombo(c: Combo): void {
  const picks = { ...state.picks };
  for (const f of c.foods) picks[f.name] = (picks[f.name] ?? 0) + snap(f, 1);
  update({ picks });
  document.getElementById('gather')?.scrollIntoView({ behavior: 'smooth' });
}

const SORTS: Record<SortKey, (a: Item) => number> = {
  total,
  health: (a) => a.food?.health ?? 0,
  stamina: (a) => a.food?.stamina ?? 0,
  eitr: (a) => a.food?.eitr ?? 0,
  healing: (a) => a.food?.healing ?? 0,
  duration: (a) => a.food?.duration ?? 0,
};
const COMBO_SORTS: Record<SortKey, (s: Sum) => number> = {
  total: (s) => s.health + s.stamina + s.eitr,
  health: (s) => s.health,
  stamina: (s) => s.stamina,
  eitr: (s) => s.eitr,
  healing: (s) => s.healing,
  duration: (s) => s.duration,
};

function renderOverview(): void {
  const vis = visibleFoods();
  const head = h(
    'div',
    { class: 'head' },
    h('h2', {}, state.combos ? 'Three-food combos, all that exist' : 'All foods'),
    h(
      'div',
      { class: 'controls' },
      h('label', {}, 'Sort by ', h('select', { onchange: (e: Event) => update({ sort: (e.target as HTMLSelectElement).value as SortKey }) }, ...(Object.keys(SORTS) as SortKey[]).map((k) => h('option', { value: k, selected: k === state.sort ? '' : null }, k)))),
      h('label', {}, h('input', { type: 'checkbox', checked: state.combos, onchange: (e: Event) => update({ combos: (e.target as HTMLInputElement).checked }) }), ' combos'),
      h('label', {}, h('input', { type: 'checkbox', checked: state.feasts, onchange: (e: Event) => update({ feasts: (e.target as HTMLInputElement).checked }) }), ' feasts'),
    ),
  );
  const numHead = [h('th', { class: 'n' }, 'Health'), h('th', { class: 'n' }, 'Stamina'), h('th', { class: 'n' }, 'Eitr'), h('th', { class: 'n' }, 'Total'), h('th', { class: 'n' }, 'hp/tick'), h('th', { class: 'n' }, 'Time')];
  let body: HTMLElement[];
  if (state.combos) {
    // ignores the resource checklist on purpose: this is "what exists", the builds panel is "what you can make"
    const sortBy = COMBO_SORTS[state.sort];
    const top = bestCombos(vis, { id: 'x', label: '', hint: '', score: sortBy }, 30);
    body = top.map((c) =>
      h(
        'tr',
        {},
        h('td', { class: 'name' }, h('div', { class: 'foods' }, ...c.foods.map((f) => h('span', { class: 'chip' }, f.name, unverifiedMark(f))))),
        h('td', {}, bars(c.sum, MAX_TOTAL * 3, MAX_REGEN * 3)),
        h('td', { class: 'n h' }, String(c.sum.health)),
        h('td', { class: 'n s' }, String(c.sum.stamina)),
        h('td', { class: 'n e' }, String(c.sum.eitr)),
        h('td', { class: 'n' }, String(c.sum.health + c.sum.stamina + c.sum.eitr)),
        h('td', { class: 'n r' }, String(c.sum.healing)),
        h('td', { class: 'n muted' }, mmss(c.sum.duration)),
        h('td', {}, h('button', { class: 'small', onclick: () => addCombo(c) }, '+')),
      ),
    );
  } else {
    const sortBy = SORTS[state.sort];
    body = [];
    for (let r = biomeRank(state.biome as Biome); r >= 0; r--) {
      const biome = BIOMES[r] as Biome;
      const rows = vis.filter((f) => f.biome === biome).sort((a, b) => sortBy(b) - sortBy(a) || total(b) - total(a));
      if (rows.length === 0) continue;
      body.push(h('tr', { class: 'group' }, h('td', { colspan: 10 }, h('h3', {}, biome))));
      for (const f of rows) {
        const st = f.food as NonNullable<Item['food']>;
        body.push(
          h(
            'tr',
            {},
            h('td', { class: 'name' }, f.name, unverifiedMark(f), st.feast ? h('span', { class: 'muted' }, ' (feast)') : null),
            h('td', {}, bars(st, MAX_TOTAL, MAX_REGEN)),
            h('td', { class: 'n h' }, String(st.health)),
            h('td', { class: 'n s' }, String(st.stamina)),
            h('td', { class: 'n e' }, st.eitr ? String(st.eitr) : ''),
            h('td', { class: 'n' }, String(total(f))),
            h('td', { class: 'n r' }, String(st.healing)),
            h('td', { class: 'n muted' }, mmss(st.duration)),
            h('td', { class: 'ing' }, f.recipe ? `${f.recipe.station}${f.recipe.yield > 1 ? ` ×${f.recipe.yield}` : ''}: ${ingredients(f)}` : f.source ?? ''),
            h('td', {}, h('button', { class: 'small', title: 'Add to gather list', onclick: () => addPick(f, 1) }, '+')),
          ),
        );
      }
    }
  }
  replace(
    'overview',
    head,
    legend(),
    h(
      'div',
      { class: 'scroll', style: 'margin-top:0.6rem' },
      h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'Food'), h('th', {}, 'Bars'), ...numHead, h('th', { class: 'ing' }, state.combos ? '' : 'Station: ingredients'), h('th', {}, ''))), h('tbody', {}, ...body)),
    ),
  );
}

function addPick(it: Item, crafts: number): void {
  const y = it.recipe?.yield ?? 1;
  const picks = { ...state.picks };
  const next = Math.max(0, (picks[it.name] ?? 0) + crafts * y);
  if (next === 0) delete picks[it.name];
  else picks[it.name] = next;
  update({ picks });
}
function stepper(it: Item): HTMLElement {
  const n = state.picks[it.name] ?? 0;
  const y = it.recipe?.yield ?? 1;
  return h(
    'span',
    { class: 'stepper' },
    h('button', { class: 'small', onclick: () => addPick(it, -5), disabled: n === 0 }, '−5'),
    h('button', { class: 'small', onclick: () => addPick(it, -1), disabled: n === 0 }, '−1'),
    h('input', {
      type: 'number',
      min: 0,
      step: y,
      value: n,
      onchange: (e: Event) => {
        const v = snap(it, Number((e.target as HTMLInputElement).value) || 0);
        const picks = { ...state.picks };
        if (v === 0) delete picks[it.name];
        else picks[it.name] = v;
        update({ picks });
      },
    }),
    h('button', { class: 'small', onclick: () => addPick(it, 1) }, '+1'),
    h('button', { class: 'small', onclick: () => addPick(it, 5), title: 'Five crafts, like shift-click in the game' }, '+5'),
  );
}
function pickRow(it: Item): HTMLElement {
  const y = it.recipe?.yield ?? 1;
  const sub = it.mead ? `${it.mead.effect}. ${it.recipe?.station}` : it.recipe ? `${it.recipe.station}${y > 1 ? `, ${y} per craft` : ''}: ${ingredients(it)}` : it.source ?? '';
  return h('div', { class: `row${(state.picks[it.name] ?? 0) > 0 ? ' picked' : ''}` }, h('span', {}, it.name, unverifiedMark(it), h('span', { class: 'sub' }, sub)), stepper(it));
}

function renderGather(): void {
  const picked = Object.entries(state.picks).filter(([, n]) => n > 0);
  const g = gather(state.picks);
  const rawByBiome = new Map<Biome, Array<[string, number]>>();
  for (const [name, n] of [...g.raw.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const b = getItem(name).biome;
    rawByBiome.set(b, [...(rawByBiome.get(b) ?? []), [name, n]]);
  }
  const visFoods = visibleFoods().sort((a, b) => biomeRank(b.biome) - biomeRank(a.biome) || total(b) - total(a));
  const visMeads = meads.filter(inBiome).sort((a, b) => biomeRank(b.biome) - biomeRank(a.biome) || a.name.localeCompare(b.name));
  replace(
    'gather',
    h('div', { class: 'head' }, h('h2', {}, 'Gather list'), picked.length > 0 && h('button', { onclick: () => update({ picks: {} }) }, 'Clear')),
    h('p', { class: 'muted', style: 'margin:0 0 0.6rem' }, 'Pick what you want to cook. Counts step by what one craft makes; +5 is a shift-click. The right side is what to bring home and in which order to craft it.'),
    h(
      'div',
      { class: 'gather' },
      h(
        'div',
        {},
        h('h3', {}, 'Dishes'),
        h('div', { class: 'list' }, ...visFoods.map(pickRow)),
        h('h3', {}, 'Meads'),
        h('div', { class: 'list' }, ...visMeads.map(pickRow)),
      ),
      h(
        'div',
        { class: 'result' },
        picked.length === 0
          ? h('div', { class: 'empty' }, 'Nothing picked yet.')
          : [
              h('h3', {}, 'Raw resources'),
              ...[...rawByBiome.entries()]
                .sort((a, b) => biomeRank(a[0]) - biomeRank(b[0]))
                .map(([b, rows]) => [h('div', { class: 'muted', style: 'margin-top:0.4rem' }, b), h('ul', {}, ...rows.map(([name, n]) => h('li', {}, h('span', {}, name, h('span', { class: 'st' }, ` · ${getItem(name).source ?? ''}`)), h('b', {}, String(n)))))]),
              h('h3', {}, 'Crafting order'),
              h('ul', {}, ...g.steps.map((s) => h('li', {}, h('span', {}, `${s.name}`, h('span', { class: 'st' }, ` · ${s.station}`)), h('b', {}, s.crafts === s.makes ? `${s.crafts}` : `${s.crafts} craft${s.crafts > 1 ? 's' : ''} → ${s.makes}`)))),
            ],
      ),
    ),
  );
}

function renderResources(): void {
  const off = new Set(state.off);
  const vis = raws.filter(inBiome);
  const groups: HTMLElement[] = [];
  for (let r = biomeRank(state.biome as Biome); r >= 0; r--) {
    const biome = BIOMES[r] as Biome;
    const rows = vis.filter((x) => x.biome === biome).sort((a, b) => a.name.localeCompare(b.name));
    if (rows.length === 0) continue;
    groups.push(
      h('h3', {}, biome),
      h(
        'div',
        { class: 'res' },
        ...rows.map((x) =>
          h(
            'label',
            { class: off.has(x.name) ? 'off' : '' },
            h('input', {
              type: 'checkbox',
              checked: !off.has(x.name),
              onchange: (e: Event) => {
                const on = (e.target as HTMLInputElement).checked;
                update({ off: on ? state.off.filter((o) => o !== x.name) : [...state.off, x.name] });
              },
            }),
            h('span', {}, x.name, h('span', { class: 'src' }, x.source ?? '')),
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
      h('h2', {}, 'Resources you can be bothered to fetch'),
      h('div', { class: 'controls' }, h('button', { onclick: () => update({ off: [] }) }, 'Tick all'), h('button', { onclick: () => update({ off: raws.map((x) => x.name) }) }, 'Untick all')),
    ),
    h('p', { class: 'muted', style: 'margin:0' }, 'Untick what you refuse to farm. The best-food panel only uses dishes whose whole ingredient tree is ticked.'),
    ...groups,
  );
}

function render(): void {
  renderBiome();
  renderPicker();
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
