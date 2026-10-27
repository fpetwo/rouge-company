// Item reference tables for the /items/ pages, generated from data/game-data.json
// (extracted from the game's item tables by scripts/extract_game_data.py).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

interface Weapon { name: string; code: string; type: string; typeCode: string; tier: string; family: string; class: string; oneHand: string; twoHand: string; throw: string; str: number; dex: number; lvl: number; qlvl: number; speed: number; sockets: number }
interface Armor { name: string; code: string; type: string; typeCode: string; tier: string; family: string; class: string; def: string; block: number; str: number; lvl: number; qlvl: number; sockets: number }
interface Unique { name: string; base: string; type: string; lvl: number; ownLvl: number; baseLvl: number; tier: string }
interface SetItem { name: string; base: string; type: string; lvl: number }
interface ItemSet { name: string; lvl: number; minLvl: number; items: SetItem[] }
interface GameData { source: string; weapons: Weapon[]; armor: Armor[]; uniques: Unique[]; sets: ItemSet[] }

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const data: GameData = JSON.parse(readFileSync(join(ROOT, 'data', 'game-data.json'), 'utf8'));

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const dash = (n: number | string) => (n === 0 || n === '' ? '–' : String(n));
const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const TIER_ORDER: Record<string, number> = { Normal: 0, Exceptional: 1, Elite: 2 };
const TIER_SHORT: Record<string, string> = { Normal: 'N', Exceptional: 'Exc', Elite: 'Elite' };

/** Group items by type, in the order of the given list; within a type, by item family (normal → exceptional → elite). */
function byType<T extends { type: string; tier: string; qlvl: number; name: string }>(rows: T[], order: string[], family: (r: T) => string) {
  const groups = new Map<string, T[]>();
  for (const t of order) groups.set(t, []);
  for (const r of rows) { if (!groups.has(r.type)) groups.set(r.type, []); groups.get(r.type)!.push(r); }
  for (const [t, list] of groups) {
    const famQ = new Map<string, number>();
    for (const r of list) famQ.set(family(r), Math.min(famQ.get(family(r)) ?? 999, r.qlvl));
    list.sort((a, b) => (famQ.get(family(a))! - famQ.get(family(b))!) || family(a).localeCompare(family(b)) || TIER_ORDER[a.tier] - TIER_ORDER[b.tier] || a.qlvl - b.qlvl);
    if (!list.length) groups.delete(t);
  }
  return groups;
}

const WEAPON_ORDER = ['Axe', 'Bow', 'Crossbow', 'Dagger', 'Javelin', 'Throwing Axe', 'Throwing Knife', 'Club', 'Mace', 'Hammer', 'Scepter', 'Polearm', 'Spear', 'Staff', 'Sword', 'Wand', 'Amazon Bow', 'Amazon Spear', 'Amazon Javelin', 'Claw', 'Sorceress Orb'];
const ARMOR_ORDER = ['Helm', 'Circlet', 'Body Armor', 'Shield', 'Gloves', 'Boots', 'Belt', 'Barbarian Helm', 'Druid Pelt', 'Paladin Shield', 'Shrunken Head', 'Warlock Grimoire'];
const plural = (t: string) => (t.endsWith('Staff') ? t.replace(/Staff$/, 'Staves') : t.endsWith('Knife') ? t.replace(/Knife$/, 'Knives') : /(s|x|sh|ch)$/.test(t) ? `${t}es` : t === 'Body Armor' ? t : `${t}s`);

function typeNav(types: string[]): string {
  return `<nav class="jump" aria-label="Item types">${types.map(t => `<a href="#${slug(plural(t))}">${esc(plural(t))}</a>`).join('')}</nav>`;
}

export function weaponTables(): string {
  const groups = byType(data.weapons, WEAPON_ORDER, w => w.family);
  const sections = [...groups].map(([type, list]) => {
    const has1 = list.some(w => w.oneHand), has2 = list.some(w => w.twoHand), hasT = list.some(w => w.throw);
    const cls = list[0].class ? ` <span class="muted">(${esc(list[0].class)} only)</span>` : '';
    let fam = '';
    const rows = list.map(w => {
      const f = w.family, start = f !== fam; fam = f;
      return `<tr${start ? ' class="fam"' : ''}><th scope="row">${esc(w.name)}</th><td>${TIER_SHORT[w.tier]}</td>${has1 ? `<td>${dash(w.oneHand)}</td>` : ''}${has2 ? `<td>${dash(w.twoHand)}</td>` : ''}${hasT ? `<td>${dash(w.throw)}</td>` : ''}<td>${dash(w.str)}</td><td>${dash(w.dex)}</td><td>${dash(w.lvl)}</td><td>${signed(w.speed)}</td><td>${dash(w.sockets)}</td></tr>`;
    }).join('');
    return `<h2 id="${slug(plural(type))}">${esc(plural(type))}${cls}</h2>
<div class="scroll"><table class="data items"><thead><tr><th scope="col">Name</th><th scope="col">Tier</th>${has1 ? '<th scope="col">One-hand dmg</th>' : ''}${has2 ? '<th scope="col">Two-hand dmg</th>' : ''}${hasT ? '<th scope="col">Throw dmg</th>' : ''}<th scope="col">Str</th><th scope="col">Dex</th><th scope="col">Level</th><th scope="col">Speed</th><th scope="col">Max sockets</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  });
  return typeNav([...groups.keys()]) + sections.join('\n');
}

export function armorTables(): string {
  const groups = byType(data.armor, ARMOR_ORDER, a => a.family);
  const sections = [...groups].map(([type, list]) => {
    const hasBlock = list.some(a => a.block);
    const cls = list[0].class ? ` <span class="muted">(${esc(list[0].class)} only)</span>` : '';
    let fam = '';
    const rows = list.map(a => {
      const f = a.family, start = f !== fam; fam = f;
      return `<tr${start ? ' class="fam"' : ''}><th scope="row">${esc(a.name)}</th><td>${TIER_SHORT[a.tier]}</td><td>${dash(a.def)}</td>${hasBlock ? `<td>${a.block ? `${a.block}%` : '–'}</td>` : ''}<td>${dash(a.str)}</td><td>${dash(a.lvl)}</td><td>${dash(a.sockets)}</td></tr>`;
    }).join('');
    return `<h2 id="${slug(plural(type))}">${esc(plural(type))}${cls}</h2>
<div class="scroll"><table class="data items"><thead><tr><th scope="col">Name</th><th scope="col">Tier</th><th scope="col">Defense</th>${hasBlock ? '<th scope="col">Block</th>' : ''}<th scope="col">Str</th><th scope="col">Level</th><th scope="col">Max sockets</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  });
  return typeNav([...groups.keys()]) + sections.join('\n');
}

/** Search box, type filter and "my level" filter; hidden until the table script runs. */
function filterBar(id: string, types: string[], label: string): string {
  const opts = ['<option value="">All types</option>', ...types.map(t => `<option value="${esc(t)}">${esc(t)}</option>`)].join('');
  return `<div class="filter" data-for="${id}" hidden>
<label>Search <input type="search" data-f="q" placeholder="Name or base" autocomplete="off"></label>
<label>Type <select data-f="type">${opts}</select></label>
<label>My level <input type="number" data-f="lvl" min="1" max="99" inputmode="numeric" placeholder="any"></label>
<p class="note" data-f="count" aria-live="polite">${label}</p>
</div>`;
}

const sortedTypes = (rows: { type: string }[]) => [...new Set(rows.map(r => r.type))].sort();

export function uniqueTable(): string {
  const rows = data.uniques.map(u => {
    const note = u.baseLvl > u.ownLvl ? ` <span class="muted" title="The base item needs level ${u.baseLvl}; the unique itself lists ${u.ownLvl}.">*</span>` : '';
    return `<tr data-type="${esc(u.type)}" data-lvl="${u.lvl}"><td>${u.lvl}${note}</td><th scope="row">${esc(u.name)}</th><td>${esc(u.base)}</td><td>${esc(u.type)}</td><td>${u.tier ? TIER_SHORT[u.tier] : '–'}</td></tr>`;
  }).join('');
  return filterBar('t-uniques', sortedTypes(data.uniques), `${data.uniques.length} unique items`) +
    `<div class="scroll"><table class="data items" id="t-uniques"><caption>Level = required character level, including the base item's requirement. * the base item needs a higher level than the unique itself.</caption><thead><tr><th scope="col">Level</th><th scope="col">Unique</th><th scope="col">Base</th><th scope="col">Type</th><th scope="col">Tier</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

export function setTable(): string {
  const rows = data.sets.map(s =>
    `<tr><td>${s.lvl}</td><th scope="row"><a href="#${slug(s.name)}">${esc(s.name)}</a></th><td>${s.items.length}</td><td>${s.minLvl === s.lvl ? s.lvl : `${s.minLvl}–${s.lvl}`}</td></tr>`).join('');
  return `<div class="scroll"><table class="data items"><caption>Full-set level = the highest requirement among its pieces.</caption><thead><tr><th scope="col">Full set</th><th scope="col">Set</th><th scope="col">Pieces</th><th scope="col">Piece levels</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

export function setDetails(): string {
  return data.sets.map(s => `<section class="variant-card" id="${slug(s.name)}"><h3>${esc(s.name)} <span class="muted">· level ${s.lvl}</span></h3><ul class="pieces">${s.items.map(i => `<li><b>${esc(i.name)}</b> – ${esc(i.base)} <span class="muted">(${esc(i.type)}, level ${i.lvl})</span></li>`).join('')}</ul></section>`).join('');
}

export function setItemTable(): string {
  const all = data.sets.flatMap(s => s.items.map(i => ({ ...i, set: s.name }))).sort((a, b) => a.lvl - b.lvl || a.name.localeCompare(b.name));
  const rows = all.map(i => `<tr data-type="${esc(i.type)}" data-lvl="${i.lvl}"><td>${i.lvl}</td><th scope="row">${esc(i.name)}</th><td>${esc(i.base)}</td><td>${esc(i.type)}</td><td><a href="#${slug(i.set)}">${esc(i.set)}</a></td></tr>`).join('');
  return filterBar('t-setitems', sortedTypes(all), `${all.length} set items`) +
    `<div class="scroll"><table class="data items" id="t-setitems"><thead><tr><th scope="col">Level</th><th scope="col">Set item</th><th scope="col">Base</th><th scope="col">Type</th><th scope="col">Set</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

export const itemCounts = {
  weapons: () => String(data.weapons.length),
  armor: () => String(data.armor.length),
  uniques: () => String(data.uniques.length),
  sets: () => String(data.sets.length),
  setItems: () => String(data.sets.reduce((n, s) => n + s.items.length, 0))
};
