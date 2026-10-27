// Checks whether the selected auras (at the selected levels) can be worn at the same time,
// and returns one possible gear assignment.
import { GOLEM_ITEMS } from './data.ts';
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
  rogueWeapon: ['', 'Faith', 'Mist', 'Edge', 'Mania'],
  act2Weapon: ['', 'Pride', 'Infinity', 'Mania'],
  mercArmor: ['', 'Bramble'],
  golem: ['', 'Pride', 'Beast', 'Last Wish', 'Infinity', 'Mania', 'Bramble']
};

export interface Fit { merc: 'rogue' | 'act2'; necro: string[]; merc_items: string[]; golem: string }

/** The golem slot holds exactly the item the Iron Golem wears (section 3); other golems carry nothing. */
function golemSlot(s: State): string[] {
  if (s.golemType !== 'iron') return [''];
  const name = GOLEM_ITEMS[s.gRw]?.name;
  return name && ITEMS[name] ? [name] : [''];
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

  let best: (Fit & { cost: number }) | null = null;
  for (const merc of ['rogue', 'act2'] as const) {
    if (merc === 'act2' && want.is !== undefined) continue;
    const mercWeapons = merc === 'rogue' ? SLOTS.rogueWeapon : SLOTS.act2Weapon;
    for (const nw of SLOTS.necroWeapon) for (const na of SLOTS.necroArmor) for (const mw of mercWeapons)
      for (const ma of SLOTS.mercArmor) for (const g of golemSlot(s)) {
        const picks = [nw, na, mw, ma, g];
        // Necro and merc only wear aura items that are needed; the golem's item is fixed and may give an unused aura.
        if ([nw, na, mw, ma].some(x => x && !provides(x))) continue;
        const have = new Set<string>(picks.map(provides).filter((x): x is Aura => x !== null));
        have.add(merc === 'rogue' ? 'is' : 'might');
        if (!Object.keys(want).every(a => have.has(a))) continue;
        const cost = picks.filter(Boolean).length * 10 + (nw.includes('2H') ? 5 : 0) + (na ? 3 : 0) + (nw ? 1 : 0);
        if (!best || cost < best.cost) {
          best = {
            cost, merc,
            necro: [nw, na && `${na} (armor)`].filter(Boolean),
            merc_items: merc === 'rogue' ? [mw, ma, s.isOn ? 'Inner Sight' : ''].filter(Boolean) : ['own Might', mw, ma].filter(Boolean),
            golem: g
          };
        }
      }
  }
  if (!best) return null;
  const { cost: _c, ...fit } = best;
  return fit;
}
