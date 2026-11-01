import { GOLEM_ITEMS, type AuraKey, type GolemType } from './data.ts';
import { MERC_ITEMS, basesFor, mercBase, type MercType } from './merc.ts';

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
  mercOn: boolean; mType: MercType; mSub: string; mLvl: number; mSkills: number; mAtk: number; mStr: number; mDex: number;
  mRw: string; mBase: string; mEd: number; mMin: number; mMax: number; mFlat: number; mIas: number; mEth: boolean;
  mRw2: string; mBase2: string; mEd2: number; mMin2: number; mMax2: number; mFlat2: number; mEth2: boolean;
  mIasO: number; mFire: number; mCold: number; mLtng: number; mAr: number; mDs: number; mFcr: number; mMode: string; mDualSum: boolean;
  revMelee: string; revMeleeN: number; revRanged: string; revRangedN: number;
  revMeleeAps: number; revRangedAps: number; revFana: boolean;
  enMelee: string; enMeleeN: number; enRanged: string; enRangedN: number;
  enAps: number;
}

export const AURA_KEYS: AuraKey[] = ['might', 'con', 'fana', 'conv', 'how', 'thorns', 'is'];

// Merc defaults per type: a typical weapon for each, best runeword rolls. Elemental damage fields hold all
// elemental adds on the merc's gear (weapon + helm etc.), +skills the merc's +all skills and attack skill bonuses.
const W0 = { mEd: 0, mMin: 0, mMax: 0, mFlat: 0, mIas: 0, mEth: false };
const W2_0 = { mRw2: 'none', mBase2: '', mEd2: 0, mMin2: 0, mMax2: 0, mFlat2: 0, mEth2: false };
const G0 = { mDualSum: false, mIasO: 0, mFire: 0, mCold: 0, mLtng: 0, mAr: 0, mDs: 0, mFcr: 0, mStr: 0, mDex: 0, mSkills: 0, mAtk: 0, mMode: 'ai' };
export const MERC_DEFAULTS: Record<MercType, Partial<State>> = {
  rogue: { ...G0, ...W0, ...W2_0, mType: 'rogue', mSub: 'cold', mRw: 'mist', mBase: 'amb', mEd: 375, mMax: 9, mIas: 20, mCold: 8.5, mAr: 20, mSkills: 3, mAtk: 3 },
  a2: { ...G0, ...W0, ...W2_0, mType: 'a2', mSub: 'might', mRw: 'pride', mBase: '7wc', mLtng: 165, mAr: 300, mDs: 20 },
  a3: { ...G0, ...W0, ...W2_0, mType: 'a3', mSub: 'cold', mRw: 'none', mBase: '7cr' },
  a5: { ...G0, ...W0, ...W2_0, mType: 'a5', mSub: 'bash', mRw: 'grief', mBase: '7cr', mFlat: 400, mIas: 40, mDs: 20 },
  a5dual: { ...G0, ...W0, mType: 'a5dual', mSub: 'frenzy', mRw: 'lastwish', mBase: '7cr', mEd: 375,
    mRw2: 'grief', mBase2: '7cr', mEd2: 0, mMin2: 0, mMax2: 0, mFlat2: 400, mEth2: false, mDs: 20 }
};
/** Fields set when the merc type changes: that type's default weapon and gear. */
export const mercTypePatch = (type: MercType): Partial<State> => ({ ...MERC_DEFAULTS[type] });

/** Fields set when a merc weapon runeword is picked (slot 1 or the dual-wield slot 2). */
export function mercItemPatch(s: State, rw: string, slot: 1 | 2): Partial<State> {
  const it = MERC_ITEMS[rw] ?? MERC_ITEMS.none;
  const allowed = basesFor(s.mType, slot === 2).filter(b => it.groups.includes(b.group));
  const cur = slot === 1 ? s.mBase : s.mBase2;
  const keep = allowed.find(b => b.code === cur);
  const base = keep?.code ?? (allowed.find(b => b.code === '7cr' || b.code === 'amb' || b.code === '7wc') ?? allowed[allowed.length - 1])?.code ?? cur;
  const other = MERC_ITEMS[slot === 1 ? s.mRw2 : s.mRw] ?? MERC_ITEMS.none;
  const skills = it.skills + (s.mType === 'a5dual' ? other.skills : 0);
  if (slot === 2) return { mRw2: rw, mBase2: base, mEd2: it.ed, mMin2: it.min, mMax2: it.max, mFlat2: it.flat, mSkills: skills };
  return { mRw: rw, mBase: base, mEd: it.ed, mMin: it.min, mMax: it.max, mFlat: it.flat, mIas: it.ias, mFire: it.fire, mCold: it.cold, mLtng: it.ltng, mAr: it.ar, mDs: it.ds, mSkills: skills, mStr: it.str, mDex: it.dex };
}
export { mercBase };

/** Aura levels the merc's weapon(s) give at their best roll; the same aura on both swords adds up (Last Wish + Last Wish = Might 34). */
const MERC_AURA: Record<string, [AuraKey, number]> = { mist: ['con', 12], faith: ['fana', 15], pride: ['con', 20], infinity: ['conv', 12], lastwish: ['might', 17], mania: ['fana', 1], edge: ['thorns', 15] };
export function mercAuraLevels(s: Pick<State, 'mType' | 'mRw' | 'mRw2'>): Partial<Record<AuraKey, number>> {
  const out: Partial<Record<AuraKey, number>> = {};
  for (const rw of [s.mRw, s.mType === 'a5dual' ? s.mRw2 : '']) {
    const a = MERC_AURA[rw];
    if (a) out[a[0]] = (out[a[0]] ?? 0) + a[1];
  }
  return out;
}
/** After the merc's weapons change: switch on the auras they give at their level, and drop the ones the old weapons gave. */
export function syncMercAuras(prev: State, next: State): State {
  const before = mercAuraLevels(prev), after = mercAuraLevels(next);
  const s: State = { ...next };
  for (const [k, lv] of Object.entries(before) as [AuraKey, number][]) {
    if (after[k] === undefined && s[`${k}L`] === lv) (s as any)[`${k}On`] = false;
  }
  for (const [k, lv] of Object.entries(after) as [AuraKey, number][]) { (s as any)[`${k}On`] = true; (s as any)[`${k}L`] = lv; }
  return s;
}

// Default = a real level 88 character without Call to Arms (summoning level = level during play):
// Mist (Concentration 9, 365% ED, Matriarchal Bow) with Vampire Gaze (adds 6–22 cold) and Bramble (Thorns 15) on a level 88 Rogue, Inner Sight 31, Mania on a Berserker Axe in the
// Iron Golem, Wisp Projector (Heart of Wolverine 5), Amplify Damage, Revive 24.
export const DEFAULT_STATE: State = {
  clvl: 88, rsS: 44, rsP: 44, smS: 46, rsmS: 43, rsmP: 43, revS: 24, revP: 24,
  mightOn: false, mightL: 17, conOn: true, conL: 9, fanaOn: true, fanaL: 1,
  convOn: false, convL: 12, howOn: true, howL: 5, thornsOn: true, thornsL: 15, isOn: true, isL: 31,
  ampOn: true,
  golemType: 'iron', golemLvl: 22, gmLvl: 41,
  synClay: 1, synBlood: 1, synIron: 1, synFire: 0,
  gRw: 'mania', gBase: '7wa', gEd: 200, gIas: 30, gDs: 0, gAr: 0, gElem: 0,
  mercOn: true, mType: 'rogue', mSub: 'cold', mLvl: 88, mSkills: 3, mAtk: 3, mStr: 0, mDex: 0,
  mRw: 'mist', mBase: 'amb', mEd: 365, mMin: 0, mMax: 9, mFlat: 0, mIas: 20, mEth: false,
  mRw2: 'none', mBase2: '', mEd2: 0, mMin2: 0, mMax2: 0, mFlat2: 0, mEth2: false,
  mIasO: 0, mFire: 0, mCold: 22.5, mLtng: 0, mAr: 20, mDs: 0, mFcr: 0, mMode: 'ai', mDualSum: false,
  revMelee: 'doomkn', revMeleeN: 14, revRanged: 'flesharc', revRangedN: 10,
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
  clvl: 88, rsS: 46, rsP: 45, smS: 46, rsmS: 45, rsmP: 44, golemType: 'iron', golemLvl: 19, gmLvl: 21,
  mightOn: false, mightL: 17, conOn: true, conL: 20, fanaOn: true, fanaL: 15,
  convOn: false, convL: 12, howOn: true, howL: 5, thornsOn: true, thornsL: 21, isOn: true, isL: 31,
  ampOn: true, mercOn: true, mLvl: 88, revS: 28, revP: 25
};
const ROGUE_MIST: Partial<State> = { ...MERC_DEFAULTS.rogue };
const ROGUE_LOW: Partial<State> = { ...MERC_DEFAULTS.rogue, mEd: 365, mCold: 22.5 };   // the real character: Mist 365% ED, Vampire Gaze helm
const ROGUE_FAITH: Partial<State> = { ...MERC_DEFAULTS.rogue, mRw: 'faith', mEd: 330, mMax: 0, mIas: 0, mCold: 0, mFire: 120, mAr: 300, mSkills: 2 };
const A2_PRIDE: Partial<State> = { ...MERC_DEFAULTS.a2 };
const A5_TWIN: Partial<State> = { ...MERC_DEFAULTS.a5dual };   // Last Wish (Might 17) + Grief

export const BUILD_VARIANTS: BuildVariant[] = [
  {
    id: 'low-budget', name: 'Low budget',
    summary: 'A real level 88 character without Call to Arms: Mist and Bramble with low aura rolls, Mania in the Iron Golem, Raise Skeleton 44. No Ber or Jah needed (Beast mode needs one Ber).',
    gear: ['Rogue: Mist (Concentration 9), Bramble (Thorns 15), Inner Sight 31', 'Iron Golem: Mania (Fanaticism 1) on a Berserker Axe – or Beast (Fanaticism 9) in Beast mode', 'No Call to Arms: summoning level = level during play', 'Necro: Enigma, Marrowwalk, Arachnid Mesh, Wisp Projector (Heart of Wolverine), Amplify Damage, Revive 24'],
    patch: { ...VARIANT_BASE, ...MANIA, ...ROGUE_LOW, rsS: 44, rsP: 44, smS: 46, rsmS: 43, rsmP: 43, golemLvl: 22, gmLvl: 41, revS: 24, revP: 24, conL: 9, fanaL: 1, thornsL: 15, isL: 31 },
    beast: true
  },
  {
    id: 'rogue-company', name: 'Rogue Company',
    summary: 'The Rogue at maximum aura rolls: perfect Mist and Bramble, Inner Sight 32, Mania in the Iron Golem.',
    gear: ['Rogue: Mist (Concentration 12), Bramble (Thorns 21), Inner Sight 32', 'Iron Golem: Mania (Fanaticism 1) on a Berserker Axe – or Beast (Fanaticism 9) in Beast mode', 'Summon after Battle Command from Call to Arms (+1 to all skills)', 'Necro: Wisp Projector (Heart of Wolverine), Amplify Damage'],
    patch: { ...VARIANT_BASE, ...MANIA, ...ROGUE_MIST, conL: 12, fanaL: 1, isL: 32 },
    beast: true
  },
  {
    id: 'desert-storm', name: 'Desert Storm',
    summary: 'Act 2 Offensive merc at maximum levels: his own Might aura plus Pride and Bramble, Mania in the Iron Golem. No Inner Sight.',
    gear: ['Act 2 Offensive merc: Might 19 (own aura), Pride (Concentration 20), Bramble (Thorns 21)', 'Iron Golem: Mania (Fanaticism 1) on a Berserker Axe – or Beast (Fanaticism 9) in Beast mode', 'Summon after Battle Command from Call to Arms (+1 to all skills)', 'Necro: Wisp Projector (Heart of Wolverine), Amplify Damage'],
    patch: { ...VARIANT_BASE, ...MANIA, ...A2_PRIDE, mightOn: true, mightL: 19, fanaL: 1, isOn: false },
    beast: true
  },
  {
    id: 'max-auras', name: 'Max Auras',
    summary: 'The highest aura stack: summon with full +skill gear, then swap the wand for Last Wish (Might 17). Faith on the Rogue, Pride in the Iron Golem, plus 25 revives.',
    gear: ['Necro: summon with Arm of King Leoric, then Last Wish (Might 17), Wisp Projector (Heart of Wolverine), Amplify Damage', 'Rogue: Faith (Fanaticism 15), Bramble (Thorns 21), Inner Sight 31', 'Iron Golem: Pride (Concentration 20) on a Cryptic Axe', 'Summon with Arm of King Leoric and Battle Command from Call to Arms (+1 to all skills), then swap'],
    patch: { ...VARIANT_BASE, ...PRIDE, ...ROGUE_FAITH, mightOn: true, mightL: 17, rsP: 40, rsmP: 40, revS: 28, revP: 25, golemLvl: 21, gmLvl: 23 }
  },
  {
    id: 'twin-blades', name: 'Twin Blades',
    summary: 'Act 5 merc dual wielding Last Wish (Might 17) and Grief, Pride in the Iron Golem. No weapon swap on the Necro, so no minions are lost; no Inner Sight and no Fanaticism.',
    gear: ['Act 5 Barbarian merc (dual wield): Last Wish (Might 17) + Grief on two Phase Blades, Bramble (Thorns 21)', 'Iron Golem: Pride (Concentration 20) on a Cryptic Axe', 'Summon after Battle Command from Call to Arms (+1 to all skills)', 'Necro: keeps his +skill weapon, Wisp Projector (Heart of Wolverine), Amplify Damage'],
    patch: { ...VARIANT_BASE, ...PRIDE, ...A5_TWIN, mightOn: true, mightL: 17, fanaOn: false, isOn: false, golemLvl: 21, gmLvl: 23 }
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
