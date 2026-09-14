// Presentation helpers shared by the sections: icon refs, the popover used by the info and
// warning marks, and the small DOM builder. No domain logic here.

import { BIOMES, type Biome, type Item } from './model.js';

const SVGNS = 'http://www.w3.org/2000/svg';

/** <svg class="ic"><use href="#id"></svg> — size from CSS, colour from currentColor */
export function ic(id: string, cls = ''): SVGSVGElement {
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('class', `ic ${cls}`.trim());
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const use = document.createElementNS(SVGNS, 'use');
  use.setAttribute('href', `#${id}`);
  svg.append(use);
  return svg;
}

export function biomeIcon(b: Biome): string {
  return `biome-${b.toLowerCase().replace(/\s+/g, '-')}`;
}

/** Station strings are compound ("Cauldron (7) + Stone oven", "Mead ketill + Fermenter"),
 *  so match the primary station at the start of the string. */
const STATIONS: Array<[RegExp, string]> = [
  [/^iron cooking station/i, 'station-iron-cooking-station'],
  [/^cooking station/i, 'station-cooking-station'],
  [/^cauldron/i, 'station-cauldron'],
  [/^stone oven/i, 'station-stone-oven'],
  [/^food preparation table/i, 'station-food-preparation-table'],
  [/^mead ketill/i, 'station-mead-ketill'],
  [/^fermenter/i, 'station-fermenter'],
  [/^windmill/i, 'station-windmill'],
];
export function stationIcon(station: string | undefined): string | null {
  const s = (station ?? '').trim();
  for (const [re, id] of STATIONS) if (re.test(s)) return id;
  return null;
}

/** Spoiler-free one-liners for the first-visit tiles. Nothing here names a boss or a later biome. */
export const BIOME_BLURB: Record<Biome, string> = {
  Meadows: 'Where you wake up',
  'Black Forest': 'Copper, tin, greydwarves',
  Swamp: 'Iron and turnips',
  Mountain: 'Silver, wolves, onions',
  Plains: 'Barley, flax, lox',
  Mistlands: 'Eitr begins',
  Ashlands: 'Fire, flametal, gourmet bowls',
  'Deep North': 'The last cold',
};

export type Child = Node | string | null | undefined | false | Child[];

export function h(tag: string, attrs: Record<string, unknown> = {}, ...children: Child[]): HTMLElement {
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

export function replace(id: string, ...children: Child[]): HTMLElement {
  const el = document.getElementById(id) as HTMLElement;
  el.replaceChildren(...Array.from(h('div', {}, ...children).childNodes));
  return el;
}

/** parse a markup string into nodes (used for the hero's flat-polygon ridge) */
export function raw(markup: string): DocumentFragment {
  const t = document.createElement('div');
  t.innerHTML = markup;
  const frag = document.createDocumentFragment();
  frag.append(...Array.from(t.childNodes));
  return frag;
}

// ---- popover ----------------------------------------------------------------
// One popover element, reused. Opens on click, Enter or Space and closes on Esc, on an
// outside click or when its owner is clicked again — so it works on touch and by keyboard,
// which the old hover-only title attributes did not.
let popEl: HTMLElement | null = null;
let popOwner: HTMLElement | null = null;

function popNode(): HTMLElement {
  if (!popEl) {
    popEl = h('div', { class: 'popover', role: 'tooltip', id: 'vfp-popover', hidden: true });
    document.body.append(popEl);
  }
  return popEl;
}

export function closePopover(): void {
  if (!popOwner) return;
  popOwner.setAttribute('aria-expanded', 'false');
  popOwner.removeAttribute('aria-describedby');
  popNode().hidden = true;
  popOwner = null;
}

export function togglePopover(owner: HTMLElement, text: string): void {
  if (popOwner === owner) {
    closePopover();
    return;
  }
  closePopover();
  const el = popNode();
  el.textContent = text;
  el.hidden = false;
  // desktop: anchored above the mark, nudged to stay on screen. Phone: CSS pins it to the bottom.
  const r = owner.getBoundingClientRect();
  el.style.top = `${window.scrollY + r.top - el.offsetHeight - 8}px`;
  const left = Math.min(window.scrollX + r.left, window.scrollX + document.documentElement.clientWidth - el.offsetWidth - 16);
  el.style.left = `${Math.max(window.scrollX + 8, left)}px`;
  owner.setAttribute('aria-expanded', 'true');
  owner.setAttribute('aria-describedby', 'vfp-popover');
  popOwner = owner;
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && popOwner) {
    const o = popOwner;
    closePopover();
    o.focus();
  }
});
document.addEventListener('click', (e) => {
  if (!popOwner) return;
  const t = e.target as Node;
  if (popOwner.contains(t) || popNode().contains(t)) return;
  closePopover();
});
window.addEventListener('resize', closePopover);

/** a 36px (44px on phone) button that opens `text` in the popover */
export function mark(icon: string, cls: string, label: string, text: string): HTMLElement {
  const b = h('button', {
    class: `mark ${cls}`,
    type: 'button',
    'aria-label': label,
    'aria-expanded': 'false',
    onclick: (e: Event) => {
      e.stopPropagation();
      togglePopover(b, text);
    },
  }, ic(icon));
  return b;
}

/** the unverified-values warning, or null when the item is verified */
export function unverifiedMark(it: Item): HTMLElement | null {
  const note = it.food?.unverified ?? it.unverified;
  return note ? mark('ui-warning', 'warn', `Unverified values for ${it.name}`, note) : null;
}

export const BIOME_INDEX = new Map(BIOMES.map((b, i) => [b, i + 1]));
