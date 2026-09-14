// Domain model: items, recipe expansion, build scoring. No DOM here, so test.mjs can import it in node.

export const BIOMES = ['Meadows', 'Black Forest', 'Swamp', 'Mountain', 'Plains', 'Mistlands', 'Ashlands', 'Deep North'] as const;
export type Biome = (typeof BIOMES)[number];

export interface Recipe {
  station: string;
  /** items produced per craft; the in-game shift-click makes 5 crafts */
  yield: number;
  materials: Record<string, number>;
}
export interface FoodStats {
  health: number;
  stamina: number;
  eitr: number;
  /** hp per tick */
  healing: number;
  /** seconds */
  duration: number;
  /** feasts sit on a table and give 10 servings, but count as one of the three food slots */
  feast?: boolean;
  unverified?: string;
}
export interface MeadStats {
  effect: string;
  duration: number;
  cooldown: number;
}
export interface Item {
  name: string;
  /** progression tier: the biome you must have reached to make it, per the wiki table */
  biome: Biome;
  /** raw resources only: where it comes from */
  source?: string;
  recipe?: Recipe;
  food?: FoodStats;
  mead?: MeadStats;
  unverified?: string;
}

export class NotFoundError extends Error {}

let index: Map<string, Item> | null = null;
let all: Item[] = [];

export function loadItems(items: Item[]): void {
  all = items;
  index = new Map(items.map((i) => [i.name.toLowerCase(), i]));
}
export function allItems(): Item[] {
  return all;
}
export function getItem(name: string): Item {
  const it = index?.get(name.toLowerCase());
  if (!it) throw new NotFoundError(`Unknown item: ${name}`);
  return it;
}

export function biomeRank(b: Biome): number {
  return BIOMES.indexOf(b);
}
export function isRaw(it: Item): boolean {
  return !it.recipe;
}

/** every raw resource name in the item's ingredient tree */
export function rawMaterials(it: Item, into: Set<string> = new Set()): Set<string> {
  if (!it.recipe) {
    into.add(it.name);
    return into;
  }
  for (const m of Object.keys(it.recipe.materials)) rawMaterials(getItem(m), into);
  return into;
}

/** round n up to the nearest multiple of the recipe yield (raw items snap to 1) */
export function snap(it: Item, n: number): number {
  const y = it.recipe?.yield ?? 1;
  return Math.max(0, Math.ceil(n / y) * y);
}

export interface CraftStep {
  name: string;
  crafts: number;
  makes: number;
  station: string;
}
export interface GatherList {
  raw: Map<string, number>;
  /** crafting order: ingredients before the things made from them */
  steps: CraftStep[];
}

/**
 * Expand picks (item name -> how many you want) down to raw resources and a crafting order.
 * Items are processed in order of their longest distance from a pick, so every demand on a
 * shared intermediate (Barley flour feeds both Bread dough and Fish wraps) is summed before
 * it is rounded up to whole crafts. Rounding once per item is what makes the totals right.
 */
export function gather(picks: Record<string, number>): GatherList {
  const depth = new Map<string, number>();
  const setDepth = (it: Item, d: number): void => {
    if ((depth.get(it.name) ?? -1) >= d) return;
    depth.set(it.name, d);
    if (it.recipe) for (const m of Object.keys(it.recipe.materials)) setDepth(getItem(m), d + 1);
  };
  const need = new Map<string, number>();
  for (const [name, n] of Object.entries(picks)) {
    if (n <= 0) continue;
    const it = getItem(name);
    setDepth(it, 0);
    need.set(it.name, (need.get(it.name) ?? 0) + n);
  }
  const order = [...depth.entries()].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));
  const raw = new Map<string, number>();
  const steps: CraftStep[] = [];
  for (const [name] of order) {
    const n = need.get(name) ?? 0;
    if (n === 0) continue;
    const it = getItem(name);
    if (!it.recipe) {
      raw.set(name, n);
      continue;
    }
    const crafts = Math.ceil(n / it.recipe.yield);
    steps.push({ name, crafts, makes: crafts * it.recipe.yield, station: it.recipe.station });
    for (const [m, q] of Object.entries(it.recipe.materials)) need.set(m, (need.get(m) ?? 0) + q * crafts);
  }
  steps.reverse(); // deepest first: make the flour before the dough before the bread
  return { raw, steps };
}

// ---- builds -----------------------------------------------------------------

export interface Sum {
  health: number;
  stamina: number;
  eitr: number;
  healing: number;
  duration: number;
}
export interface Build {
  id: string;
  label: string;
  hint: string;
  score: (s: Sum) => number;
}
// The formulas Patrik and I agreed on (grill 2026-09-14). Balanced modes reward the
// total and punish the health/stamina gap one-to-one; the mage mode doubles eitr on top.
export const BUILDS: Build[] = [
  { id: 'health', label: 'Max health', hint: 'Shield and stagger. Health only.', score: (s) => s.health },
  { id: 'stamina', label: 'Max stamina', hint: 'Dodge, run, sail. Stamina only.', score: (s) => s.stamina },
  { id: 'eitr', label: 'Max eitr', hint: 'Staff casting. Eitr only.', score: (s) => s.eitr },
  {
    id: 'warrior',
    label: 'Warrior',
    hint: 'Balanced health and stamina: H + S − |H − S|. Eitr ignored.',
    score: (s) => s.health + s.stamina - Math.abs(s.health - s.stamina),
  },
  {
    id: 'mage',
    label: 'Mage',
    hint: 'Balanced health and stamina with eitr weighted double: 2E + H + S − |H − S|.',
    score: (s) => 2 * s.eitr + s.health + s.stamina - Math.abs(s.health - s.stamina),
  },
  { id: 'total', label: 'Max total', hint: 'Health + stamina + eitr, whatever the split.', score: (s) => s.health + s.stamina + s.eitr },
];

export interface Combo {
  foods: Item[];
  sum: Sum;
  score: number;
}

export function sumOf(foods: Item[]): Sum {
  const s: Sum = { health: 0, stamina: 0, eitr: 0, healing: 0, duration: Infinity };
  for (const f of foods) {
    const st = f.food as FoodStats;
    s.health += st.health;
    s.stamina += st.stamina;
    s.eitr += st.eitr;
    s.healing += st.healing;
    s.duration = Math.min(s.duration, st.duration);
  }
  if (!isFinite(s.duration)) s.duration = 0;
  return s;
}

/** top N distinct three-food combos for a build. Ties break on healing, then on the shortest duration. */
export function bestCombos(candidates: Item[], build: Build, top = 5): Combo[] {
  const out: Combo[] = [];
  const n = candidates.length;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      for (let k = j + 1; k < n; k++) {
        const foods = [candidates[i] as Item, candidates[j] as Item, candidates[k] as Item];
        const sum = sumOf(foods);
        const score = build.score(sum);
        if (out.length === top && score < (out[top - 1] as Combo).score) continue;
        out.push({ foods, sum, score });
        out.sort((a, b) => b.score - a.score || b.sum.healing - a.sum.healing || b.sum.duration - a.sum.duration);
        if (out.length > top) out.pop();
      }
  return out;
}
