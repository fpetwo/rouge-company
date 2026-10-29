import { GOLEM_ITEMS, type AuraKey, type GolemType } from './data.ts';

export interface State {
  clvl: number;
  rsS: number; rsP: number; smS: number; rsmS: number; rsmP: number; revS: number; revP: number;
  mightOn: boolean; mightL: number;
  conOn: boolean; conL: number;
  fanaOn: boolean; fanaL: number;
  convOn: boolean; convL: number;
  howOn: boolean; howL: number;
  thornsOn: boolean; thornsL: number;
  isOn: boolean; isL: number;
  ampOn: boolean;
  golemType: GolemType; golemLvl: number; gmLvl: number;
  synClay: number; synBlood: number; synIron: number; synFire: number;
  gRw: string; gBase: string; gEd: number; gIas: number; gDs: number; gAr: number; gElem: number;
  rogueOn: boolean; rogueS: number; rogueD: number;
  revMelee: string; revMeleeN: number; revRanged: string; revRangedN: number;
  revMeleeAps: number; revRangedAps: number; revFana: boolean;
  enMelee: string; enMeleeN: number; enRanged: string; enRangedN: number;
  enAps: number;
}

export const AURA_KEYS: AuraKey[] = ['might', 'con', 'fana', 'conv', 'how', 'thorns', 'is'];

export const DEFAULT_STATE: State = {
  clvl: 84, rsS: 46, rsP: 40, smS: 46, rsmS: 45, rsmP: 40, revS: 28, revP: 25,
  mightOn: true, mightL: 17, conOn: true, conL: 20, fanaOn: true, fanaL: 15,
  convOn: false, convL: 12, howOn: true, howL: 5, thornsOn: true, thornsL: 21, isOn: true, isL: 31,
  ampOn: true,
  golemType: 'iron', golemLvl: 21, gmLvl: 23,
  synClay: 1, synBlood: 1, synIron: 1, synFire: 0,
  gRw: 'pride', gBase: '7pa', gEd: 0, gIas: 0, gDs: 20, gAr: 300, gElem: 165,
  rogueOn: true, rogueS: 3700, rogueD: 2100,
  revMelee: 'doomkn', revMeleeN: 15, revRanged: 'flesharc', revRangedN: 10,
  revMeleeAps: 0.5, revRangedAps: 0.6, revFana: true,
  enMelee: 'doomkn', enMeleeN: 7, enRanged: 'flesharc', enRangedN: 3, enAps: 0.5
};

export interface BuildVariant {
  id: string;
  name: string;
  summary: string;
  gear: string[];          // human-readable gear list per carrier
  patch: Partial<State>;   // fields this variant sets (on top of the base state)
  beast?: boolean;         // Beast mode toggle available (golem swaps Mania for Beast)
}

/** Fields a build variant may change. Enemy pack and revive picks are left alone. */
// "On summoning" is always one level above "during play": Battle Command from Call to Arms (+1 to all skills) while summoning.
const MANIA: Partial<State> = { gRw: 'mania', gBase: '7wa', gEd: 200, gIas: 30, gDs: 0, gAr: 0, gElem: 0 };
const BEAST: Partial<State> = { gRw: 'beast', gBase: '7wa', gEd: 270, gIas: 40, gDs: 0, gAr: 0, gElem: 0 };
const PRIDE: Partial<State> = { gRw: 'pride', gBase: '7pa', gEd: 0, gIas: 0, gDs: 20, gAr: 300, gElem: 165 };
const VARIANT_BASE: Partial<State> = {
  clvl: 84, rsS: 46, rsP: 45, smS: 46, rsmS: 45, rsmP: 44, golemType: 'iron', golemLvl: 19, gmLvl: 21,
  mightOn: false, mightL: 17, conOn: true, conL: 20, fanaOn: true, fanaL: 15,
  convOn: false, convL: 12, howOn: true, howL: 5, thornsOn: true, thornsL: 21, isOn: true, isL: 31,
  ampOn: true, rogueOn: true
};

export const BUILD_VARIANTS: BuildVariant[] = [
  {
    id: 'low-budget', name: 'Low budget',
    summary: 'Affordable Rogue setup: Mist and Bramble with low aura rolls, Mania in the Iron Golem, skills 40/40. No Ber or Jah needed (Beast mode needs one Ber).',
    gear: ['Rogue: Mist (Concentration 9), Bramble (Thorns 15), Inner Sight 30', 'Iron Golem: Mania (Fanaticism 1) on a Berserker Axe – or Beast (Fanaticism 9) in Beast mode', 'Summon after Battle Command from Call to Arms (+1 to all skills)', 'Necro: Wisp Projector (Heart of Wolverine), Amplify Damage'],
    patch: { ...VARIANT_BASE, ...MANIA, rsS: 41, rsP: 40, smS: 41, rsmS: 40, rsmP: 39, conL: 9, fanaL: 1, thornsL: 15, isL: 30 },
    beast: true
  },
  {
    id: 'rogue-company', name: 'Rogue Company',
    summary: 'The Rogue at maximum aura rolls: perfect Mist and Bramble, Inner Sight 32, Mania in the Iron Golem.',
    gear: ['Rogue: Mist (Concentration 12), Bramble (Thorns 21), Inner Sight 32', 'Iron Golem: Mania (Fanaticism 1) on a Berserker Axe – or Beast (Fanaticism 9) in Beast mode', 'Summon after Battle Command from Call to Arms (+1 to all skills)', 'Necro: Wisp Projector (Heart of Wolverine), Amplify Damage'],
    patch: { ...VARIANT_BASE, ...MANIA, conL: 12, fanaL: 1, isL: 32 },
    beast: true
  },
  {
    id: 'desert-storm', name: 'Desert Storm',
    summary: 'Act 2 Offensive merc at maximum levels: his own Might aura plus Pride and Bramble, Beast in the Iron Golem. No Inner Sight.',
    gear: ['Act 2 Offensive merc: Might 19 (own aura), Pride (Concentration 20), Bramble (Thorns 21)', 'Iron Golem: Beast (Fanaticism 9) on a Berserker Axe', 'Summon after Battle Command from Call to Arms (+1 to all skills)', 'Necro: Wisp Projector (Heart of Wolverine), Amplify Damage'],
    patch: { ...VARIANT_BASE, ...BEAST, mightOn: true, mightL: 19, fanaL: 9, isOn: false }
  },
  {
    id: 'max-auras', name: 'Max Auras',
    summary: 'The highest aura stack: summon with full +skill gear, then swap the wand for Last Wish (Might 17). Faith on the Rogue, Pride in the Iron Golem, plus 25 revives.',
    gear: ['Necro: summon with Arm of King Leoric, then Last Wish (Might 17), Wisp Projector (Heart of Wolverine), Amplify Damage', 'Rogue: Faith (Fanaticism 15), Bramble (Thorns 21), Inner Sight 31', 'Iron Golem: Pride (Concentration 20) on a Cryptic Axe', 'Summon with Arm of King Leoric and Battle Command from Call to Arms (+1 to all skills), then swap'],
    patch: { ...VARIANT_BASE, ...PRIDE, mightOn: true, mightL: 17, rsP: 40, rsmP: 40, revS: 28, revP: 25, golemLvl: 21, gmLvl: 23 }
  }
];

/** Beast mode: the Iron Golem wears Beast (Fanaticism 9) instead of Mania (Fanaticism 1). */
export const BEAST_PATCH: Partial<State> = { fanaOn: true, fanaL: 9, ...BEAST };

export function applyVariant(current: State, id: string, opts: { beast?: boolean } = {}): State {
  const v = BUILD_VARIANTS.find(b => b.id === id);
  if (!v) return current;
  const next = { ...current, ...v.patch };
  return opts.beast && v.beast ? { ...next, ...BEAST_PATCH } : next;
}

/** Fields set when the Iron Golem gets a runeword: the runeword's best rolls and a fitting default base. */
export function golemItemPatch(rw: string, currentBase?: string): Partial<State> {
  const it = GOLEM_ITEMS[rw] ?? GOLEM_ITEMS.none;
  const keepBase = rw === 'mania' || rw === 'none';
  return { gRw: rw, gBase: keepBase && currentBase ? currentBase : it.base, gEd: it.ed, gIas: it.ias, gDs: it.ds, gAr: it.ar, gElem: it.elem };
}

/** Which preset (and Beast mode) the state currently equals, if any. */
export function matchVariant(s: State): { id: string; beast: boolean } | null {
  for (const v of BUILD_VARIANTS) {
    for (const beast of v.beast ? [false, true] : [false]) {
      const want = applyVariant(s, v.id, { beast });
      if ((Object.keys(want) as (keyof State)[]).every(k => want[k] === s[k])) return { id: v.id, beast };
    }
  }
  return null;
}

// ---- URL encoding: compact query string so setups can be shared ----
const KEYS = Object.keys(DEFAULT_STATE) as (keyof State)[];

export function encodeState(s: State): string {
  const parts: string[] = [];
  for (const k of KEYS) {
    const v = s[k], d = DEFAULT_STATE[k];
    if (v === d) continue;
    parts.push(`${k}=${typeof v === 'boolean' ? (v ? 1 : 0) : encodeURIComponent(String(v))}`);
  }
  return parts.join('&');
}

export function decodeState(query: string): State {
  const s: State = { ...DEFAULT_STATE };
  const params = new URLSearchParams(query.replace(/^[#?]/, ''));
  for (const k of KEYS) {
    const raw = params.get(k);
    if (raw === null) continue;
    const d = DEFAULT_STATE[k];
    if (typeof d === 'boolean') (s as any)[k] = raw === '1';
    else if (typeof d === 'number') { const n = Number(raw); if (Number.isFinite(n)) (s as any)[k] = n; }
    else (s as any)[k] = raw;
  }
  return s;
}
