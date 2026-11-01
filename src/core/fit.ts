// Checks whether the selected auras (at the selected levels) can be worn at the same time,
// and returns one possible gear assignment. The merc and the Iron Golem carry the items picked for them.
import { GOLEM_ITEMS } from './data.ts';
import { MERC_ITEMS, MERC_TYPES, type MercType } from './merc.ts';
import type { State } from './state.ts';

type Aura = 'might' | 'con' | 'fana' | 'conv' | 'thorns';
const ITEMS: Record<string, [Aura, number, number]> = {
  'Last Wish': ['might', 17, 17], 'Beast': ['fana', 9, 9], 'Mania': ['fana', 1, 1], 'Pride': ['con', 16, 20],
  'Infinity': ['conv', 12, 12], 'Faith': ['fana', 12, 15], 'Mist': ['con', 8, 12], 'Edge': ['thorns', 15, 15],
  'Bramble': ['thorns', 15, 21]
};
const SLOTS = {
  necroWeapon: ['', 'Last Wish', 'Beast', 'Mania', 'Pride (2H)', 'Infinity (2H)', 'Faith (2H)', 'Mist (2H)', 'Edge (2H)'],
  necroArmor: ['', 'Bramble'],
  mercArmor: ['', 'Bramble'],
};

export interface Fit { merc: MercType; necro: string[]; merc_items: string[]; golem: string }

/** The golem slot holds exactly the item the Iron Golem wears (section 3); other golems carry nothing. */
function golemSlot(s: State): string {
  if (s.golemType !== 'iron') return '';
  const name = GOLEM_ITEMS[s.gRw]?.name;
  return name && ITEMS[name] ? name : '';
}

/** The merc's weapon(s) from the merc section; only aura runewords matter here. */
export function mercWeapons(s: State): string[] {
  const key = (rw: string) => MERC_ITEMS[rw]?.auraKey ?? '';
  return [key(s.mRw), s.mType === 'a5dual' ? key(s.mRw2) : ''].filter(x => x && ITEMS[x]);
}

/** Own merc auras: the Rogue's Inner Sight, the Act 2 merc's Might or Thorns. */
function ownAuras(s: State): string[] {
  if (s.mType === 'rogue') return ['is'];
  if (s.mType === 'a2' && s.mSub === 'might') return ['might'];
  if (s.mType === 'a2' && s.mSub === 'thorns') return ['thorns'];
  return [];
}

export function findFit(s: State): Fit | null {
  const want: Partial<Record<Aura | 'is', number>> = {};
  for (const k of ['might', 'con', 'fana', 'conv', 'thorns', 'is'] as const) if (s[`${k}On`]) want[k] = s[`${k}L`];

  const provides = (item: string): Aura | null => {
    if (!item) return null;
    const it = ITEMS[item.replace(' (2H)', '')];
    const level = it && want[it[0]];
    return it && level !== undefined && level >= it[1] && level <= it[2] ? it[0] : null;
  };
  // Same aura from two items on one carrier adds up (two Last Wish swords = Might 34): accept the sum too.
  const mw = mercWeapons(s);
  const stacked = (aura: Aura) => mw.filter(x => ITEMS[x][0] === aura).reduce((a, x) => a + ITEMS[x][2], 0);

  const g = golemSlot(s);
  const own = ownAuras(s);
  let best: (Fit & { cost: number }) | null = null;
  for (const nw of SLOTS.necroWeapon) for (const na of SLOTS.necroArmor) for (const ma of SLOTS.mercArmor) {
    // Necro and merc armor only hold aura items that are needed; the golem's and merc's weapons are fixed and may give an unused aura.
    if ([nw, na, ma].some(x => x && !provides(x))) continue;
    const have = new Set<string>([nw, na, ma, g, ...mw].map(provides).filter((x): x is Aura => x !== null));
    for (const a of ['might', 'con', 'fana', 'thorns'] as Aura[]) if (mw.length > 1 && want[a] !== undefined && stacked(a) === want[a]) have.add(a);
    for (const o of own) have.add(o);
    if (!Object.keys(want).every(a => have.has(a))) continue;
    const cost = [nw, na, ma].filter(Boolean).length * 10 + (nw.includes('2H') ? 5 : 0) + (na ? 3 : 0) + (nw ? 1 : 0);
    if (!best || cost < best.cost) {
      const ownLabel = s.mType === 'rogue' ? (s.isOn ? 'Inner Sight' : '') : own.includes('might') ? 'own Might' : own.includes('thorns') ? 'own Thorns' : '';
      best = { cost, merc: s.mType, necro: [nw, na && `${na} (armor)`].filter(Boolean), merc_items: [...mw, ma, ownLabel].filter(Boolean), golem: g };
    }
  }
  if (!best) return null;
  const { cost: _c, ...fit } = best;
  return fit;
}

export const mercLabel = (t: MercType) => MERC_TYPES[t].short;
