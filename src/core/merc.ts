// Mercenary damage model. Stats, skills and weapon bases come from the game tables (merc-data.ts);
// formulas follow the game code as reimplemented by D2MOO and the Basin Wiki merc pages.
import { MERC_BASES, MERC_ROWS, SKILL_ROWS, type MercBase, type MercRow, type SkillRow } from './merc-data.ts';

export type MercType = 'rogue' | 'a2' | 'a3' | 'a5' | 'a5dual';

export interface MercTypeInfo {
  name: string;
  short: string;
  groups: string[];                       // weapon groups the merc can wield
  subs: { id: string; label: string; row: string }[];
  note: string;
}

export const MERC_TYPES: Record<MercType, MercTypeInfo> = {
  rogue: { name: 'Rogue Scout (Act 1)', short: 'Rogue', groups: ['bow'],
    subs: [{ id: 'cold', label: 'Cold: Cold Arrow, Freezing Arrow', row: 'rogueCold' }, { id: 'fire', label: 'Fire: Fire Arrow, Exploding Arrow', row: 'rogueFire' }],
    note: 'Bows only. Inner Sight lowers monster defense for the whole army.' },
  a2: { name: 'Desert Mercenary (Act 2)', short: 'Act 2 merc', groups: ['pole', 'spea'],
    subs: [{ id: 'might', label: 'Might', row: 'a2Might' }, { id: 'thorns', label: 'Thorns', row: 'a2Thorns' }, { id: 'freeze', label: 'Holy Freeze', row: 'a2Freeze' },
      { id: 'prayer', label: 'Prayer', row: 'a2Combat' }, { id: 'defiance', label: 'Defiance', row: 'a2Def' }, { id: 'aim', label: 'Blessed Aim', row: 'a2Off' }],
    note: 'Polearms and spears. Attacks with Jab: two hits per 14-frame sequence. Weapon damage is doubled (Basin Wiki).' },
  a3: { name: 'Iron Wolf (Act 3)', short: 'Act 3 merc', groups: ['swor'],
    subs: [{ id: 'fire', label: 'Fire: Fire Bolt, Fire Ball', row: 'a3Fire' }, { id: 'cold', label: 'Cold: Ice Blast, Glacial Spike', row: 'a3Cold' }, { id: 'ltng', label: 'Lightning: Lightning, Charged Bolt', row: 'a3Ltng' }],
    note: 'Casts spells; only Faster Cast Rate speeds him up. Spell damage ignores attack rating, auras and Amplify Damage.' },
  a5: { name: 'Barbarian (Act 5), one sword', short: 'Act 5 merc', groups: ['swor'],
    subs: [{ id: 'bash', label: 'Bash, Stun, Battle Cry', row: 'a5Bash' }],
    note: 'One sword (one- or two-handed). One-handed sword damage is doubled (Basin Wiki). 5% critical strike.' },
  a5dual: { name: 'Barbarian (Act 5), dual wield', short: 'Act 5 dual', groups: ['swor'],
    subs: [{ id: 'frenzy', label: 'Frenzy, Taunt, Iron Skin', row: 'a5Frenzy' }],
    note: 'Two one-handed swords. Frenzy raises his attack speed for every attack while it lasts. 5% critical strike.' }
};

export const mercRow = (type: MercType, sub: string): MercRow => {
  const t = MERC_TYPES[type];
  return MERC_ROWS[(t.subs.find(x => x.id === sub) ?? t.subs[0]).row];
};
export const mercBase = (code: string): MercBase | undefined => MERC_BASES.find(b => b.code === code);
export const basesFor = (type: MercType, slot2 = false): MercBase[] =>
  MERC_BASES.filter(b => MERC_TYPES[type].groups.includes(b.group) && (type !== 'a5dual' || (!b.twoHanded && !b.oneOrTwo)) && !(slot2 && type !== 'a5dual'));

/** Merc weapon runewords and plain weapons; best rolls, rune bonuses included (runes.txt, gems.txt). */
export interface MercItem {
  name: string; aura: string; auraKey: string; groups: string[];
  ed: number; ias: number; min: number; max: number; flat: number; fire: number; cold: number; ltng: number; ar: number; ds: number; skills: number; str: number; dex: number;
  note?: string;
}
const ITEM0 = { ed: 0, ias: 0, min: 0, max: 0, flat: 0, fire: 0, cold: 0, ltng: 0, ar: 0, ds: 0, skills: 0, str: 0, dex: 0 };
export const MERC_ITEMS: Record<string, MercItem> = {
  none: { ...ITEM0, name: 'Plain weapon / own item', aura: '–', auraKey: '', groups: ['bow', 'pole', 'spea', 'swor'] },
  mist: { ...ITEM0, name: 'Mist', aura: 'Concentration 8–12', auraKey: 'Mist', groups: ['bow'], ed: 375, ias: 20, max: 9, cold: 8.5, ar: 20, skills: 3 },
  faith: { ...ITEM0, name: 'Faith', aura: 'Fanaticism 12–15', auraKey: 'Faith', groups: ['bow'], ed: 330, fire: 120, ar: 300, skills: 2 },
  edge: { ...ITEM0, name: 'Edge', aura: 'Thorns 15', auraKey: 'Edge', groups: ['bow'], ias: 35, str: 10, dex: 10, note: 'Damage against demons and undead not counted.' },
  pride: { ...ITEM0, name: 'Pride', aura: 'Concentration 16–20', auraKey: 'Pride', groups: ['pole', 'spea'], ltng: 165, ar: 300, ds: 20 },
  infinity: { ...ITEM0, name: 'Infinity', aura: 'Conviction 12', auraKey: 'Infinity', groups: ['pole', 'spea'], ed: 325, note: 'Crushing Blow not counted.' },
  insight: { ...ITEM0, name: 'Insight', aura: 'Meditation 12–17', auraKey: '', groups: ['pole', 'bow'], ed: 260, ar: 250 },
  doom: { ...ITEM0, name: 'Doom', aura: 'Holy Freeze 12', auraKey: '', groups: ['pole'], ed: 370, ias: 45, ds: 20, skills: 2 },
  lastwish: { ...ITEM0, name: 'Last Wish', aura: 'Might 17', auraKey: 'Last Wish', groups: ['swor'], ed: 375, note: 'Crushing Blow not counted.' },
  mania: { ...ITEM0, name: 'Mania', aura: 'Fanaticism 1', auraKey: 'Mania', groups: ['bow', 'pole', 'spea', 'swor'], ed: 200, ias: 30 },
  grief: { ...ITEM0, name: 'Grief', aura: '–', auraKey: '', groups: ['swor'], flat: 400, ias: 40, ds: 20 },
  botd: { ...ITEM0, name: 'Breath of the Dying', aura: '–', auraKey: '', groups: ['bow', 'pole', 'spea', 'swor'], ed: 400, ias: 60, str: 30, dex: 30 },
  lawbringer: { ...ITEM0, name: 'Lawbringer', aura: 'Sanctuary 16–18', auraKey: '', groups: ['swor'], fire: 180, cold: 155, dex: 10 },
  death: { ...ITEM0, name: 'Death', aura: '–', auraKey: '', groups: ['swor'], ed: 385, ltng: 25.5, ar: 20, ds: 44, note: 'Deadly Strike shown for merc level 88; Crushing Blow not counted.' }
};

// ---------------- attack speed ----------------

export const EIAS_CAP = 75;
export const eiasFromIas = (ias: number) => Math.floor((120 * ias) / (120 + ias));
export const iasForEias = (e: number) => (e <= 0 ? 0 : e >= 120 ? Infinity : Math.ceil((120 * e) / (120 - e)));

/** Frames per attack: ⌈256 × FPD / ⌊256 × (100 + EIAS) / 100⌋⌉ − 1 (sequences without the −1). Basin Wiki "Attack speed". */
export function attackFrames(fpd: number, eias: number, seq = false): number {
  const e = Math.max(-85, Math.min(EIAS_CAP, eias));
  return Math.ceil((256 * fpd) / Math.floor((256 * (100 + e)) / 100)) - (seq ? 0 : 1);
}

/** Lowest EIAS that reaches each frame count, from 0 EIAS... down to the cap. */
export function frameSteps(fpd: number, seq = false, from = -20): { frames: number; eias: number }[] {
  const out: { frames: number; eias: number }[] = [];
  let last = Infinity;
  for (let e = from; e <= EIAS_CAP; e++) {
    const f = attackFrames(fpd, e, seq);
    if (f < last) { out.push({ frames: f, eias: e }); last = f; }
  }
  return out;
}

/** Act 3 cast frames by Faster Cast Rate (Basin Wiki, Iron Wolf). */
export const A3_FCR: [number, number][] = [[0, 17], [8, 16], [15, 15], [26, 14], [39, 13], [58, 12], [86, 11], [138, 10]];
export const a3CastFrames = (fcr: number) => [...A3_FCR].reverse().find(([f]) => fcr >= f)![1];

export interface Animation { id: string; label: string; fpd: number; seq: boolean; hits: number; source: string }
export const ANIMS: Record<string, Animation> = {
  rogueBow: { id: 'rogueBow', label: 'Bow attack and arrow skills', fpd: 15, seq: false, hits: 1, source: 'Basin Wiki Rogue Scout table' },
  a2Attack: { id: 'a2Attack', label: 'Normal attack', fpd: 16, seq: false, hits: 1, source: 'Basin Wiki Desert Mercenary table' },
  a2Jab: { id: 'a2Jab', label: 'Jab (sequence, 2 hits)', fpd: 14, seq: true, hits: 2, source: 'monseq.txt seq_act2guardjab, Basin Wiki' },
  a5Attack: { id: 'a5Attack', label: 'Attack, Bash, Stun, Frenzy', fpd: 16, seq: false, hits: 1, source: 'Basin Wiki Barbarian (mercenary) table' }
};
export const ANIMS_FOR: Record<MercType, string[]> = { rogue: ['rogueBow'], a2: ['a2Jab', 'a2Attack'], a3: [], a5: ['a5Attack'], a5dual: ['a5Attack'] };

// ---------------- skill helpers ----------------

const num = (r: SkillRow, k: string) => (typeof r[k] === 'number' ? (r[k] as number) : 0);
const linear = (a: number, b: number, l: number) => a + b * (l - 1);           // ln12 / ln34 style
const dim = (lo: number, hi: number, l: number) => (l <= 0 ? 0 : lo + Math.floor(((hi - lo) * Math.floor((110 * l) / (l + 6))) / 100));

/** Elemental damage of a skill at level l: base + per-level bands (2–8, 9–16, 17–22, 23–28, 29+), scaled by HitShift. */
export function elemBand(skill: string, l: number): [number, number] {
  const r = SKILL_ROWS[skill];
  if (!r || l <= 0) return [0, 0];
  const band = (k: 'EMin' | 'EMax') => {
    let v = num(r, k);
    for (let L = 2; L <= l; L++) v += num(r, `${k}Lev${L <= 8 ? 1 : L <= 16 ? 2 : L <= 22 ? 3 : L <= 28 ? 4 : 5}`);
    return (v * 2 ** num(r, 'HitShift')) / 256;
  };
  return [band('EMin'), band('EMax')];
}

/** Synergy percent from EDmgSymPerCalc: base levels (no +skills) of the merc's own skills × par8. */
export function synergy(skill: string, blvl: (s: string) => number): number {
  const r = SKILL_ROWS[skill];
  const calc = typeof r?.EDmgSymPerCalc === 'string' ? r.EDmgSymPerCalc : '';
  let sum = 0;
  for (const m of calc.matchAll(/skill\('([^']+)'\.blvl\)/g)) sum += blvl(m[1]);
  return sum * num(r, 'Param8');
}

// ---------------- merc calculation ----------------

export interface MercInput {
  type: MercType; sub: string; lvl: number; skills: number; atkSkills: number; str: number; dex: number;
  base: string; ed: number; minAdd: number; maxAdd: number; flat: number; ias: number; eth: boolean;
  base2: string; ed2: number; minAdd2: number; maxAdd2: number; flat2: number; eth2: boolean;
  iasOther: number; fire: number; cold: number; ltng: number; arPct: number; ds: number; fcr: number;
  mode: string; dualSum: boolean;
}
export interface MercAuras { dmgPct: number; arPct: number; speed: number }
export interface Target { lvl: number; def: number; res: [number, number, number, number]; w: number }

export interface MercAttack {
  id: string; label: string; share: number; frames: number; hits: number; spell: boolean;
  phys: number; fire: number; cold: number; ltng: number; mag: number; ar: number; conv: number; convType: string;
  hitPack: number; hitDiablo: number; dpsPack: number; dpsDiablo: number;
}
export interface MercResult {
  type: MercType; row: MercRow; lvl: number; str: number; dex: number; baseDmg: [number, number]; ar: number;
  skillLevels: { skill: string; blvl: number; lvl: number }[];
  weapon: { name: string; min: number; max: number; doubled: boolean; twoHand: boolean } | null;
  weapon2: { name: string; min: number; max: number } | null;
  physPct: number; statPct: number; crit: number; ias: number; wsm: number; sias: number; eias: number; frenzySpeed: number;
  attacks: MercAttack[]; dpsPack: number; dpsDiablo: number; actionsPerSec: number; ownAura: { name: string; lvl: number } | null;
}

const MODE_SEQ = 14, MODE_CAST = 7;
const DAMAGE_SKILLS = new Set(['Fire Arrow', 'Cold Arrow', 'Exploding Arrow', 'Freezing Arrow', 'Jab', 'Bash', 'Stun', 'Frenzy',
  'Fire Bolt', 'Fire Ball', 'Glacial Spike', 'Ice Blast', 'Charged Bolt', 'Lightning']);
/** Charged Bolt: share of the bolts assumed to hit one target (they spread out). */
export const CHARGED_BOLT_HIT_SHARE = 1 / 3;

/** Attack options the merc AI picks from (hireling.txt chances): normal attack plus every usable skill. */
export function mercActions(m: MercInput): { id: string; label: string; weight: number }[] {
  const row = mercRow(m.type, m.sub);
  const ups = Math.max(0, m.lvl - row.lvl);
  const out = [{ id: 'normal', label: m.type === 'rogue' ? 'Normal arrow' : m.type === 'a3' ? 'Sword attack' : 'Normal attack', weight: row.defaultChance }];
  for (const sk of row.skills) {
    // Auras and buffs that stay up (Chilling Armor) are re-cast only when they drop, passives never: left out.
    if (sk.mode === 1 || sk.skill === 'Chilling Armor') continue;
    const weight = sk.chance + Math.floor((ups * sk.chancePerLvl) / 4);
    if (weight > 0) out.push({ id: sk.skill, label: sk.skill, weight });          // Iron Skin (passive) has no chance
  }
  return out;
}

export function calcMerc(m: MercInput, auras: MercAuras, conv: number, amp: boolean, effDef: (d: number) => number,
  targets: Target[], diablo: Target[], physFactor: (res: number, amp: boolean) => number,
  elemFactor: (res: number, conv: number) => number, hitChance: (al: number, dl: number, ar: number, def: number) => number): MercResult {
  const row = mercRow(m.type, m.sub);
  const ups = Math.max(0, m.lvl - row.lvl);
  const blvl = (skill: string) => {
    const r = row.skills.find(x => x.skill === skill);
    if (!r) return 0;
    if (m.lvl < num(SKILL_ROWS[skill] ?? {}, 'reqlevel')) return 0;
    return Math.max(0, Math.min(32, r.level + ((ups * r.lvlPerLvl) >> 5)));
  };
  const slvl = (skill: string) => { const b = blvl(skill); return b > 0 ? b + m.skills + (DAMAGE_SKILLS.has(skill) || skill === 'Freezing Arrow' ? m.atkSkills : 0) : 0; };
  const auraSkill = row.skills.find(x => x.mode === 1);
  const ownAura = auraSkill ? { name: auraSkill.skill, lvl: blvl(auraSkill.skill) + m.skills } : null;

  const str = row.str + Math.floor((ups * row.strPerLvl) / 8) + m.str;
  const dex = row.dex + Math.floor((ups * row.dexPerLvl) / 8) + m.dex;
  const baseDmg: [number, number] = [row.dmgMin + Math.floor((ups * row.dmgPerLvl) / 8), row.dmgMax + Math.floor((ups * row.dmgPerLvl) / 8)];

  // Weapon damage. Two-handed use adds the hireling's own base damage (it sits in the two-hand damage stat);
  // the Act 2 merc and the Act 5 merc with one one-handed sword deal double weapon damage (Basin Wiki).
  const weaponOf = (code: string, ed: number, mn: number, mx: number, eth: boolean, flat: number, dual: boolean) => {
    const b = mercBase(code);
    if (!b) return null;
    const twoHand = !dual && (m.type === 'rogue' || m.type === 'a2' || (m.type === 'a5' && (b.twoHanded || b.oneOrTwo)));
    const src = twoHand ? (b.two ?? b.one) : (b.one ?? b.two);
    if (!src) return null;
    const scale = (v: number) => Math.floor(Math.floor(v * (eth ? 1.5 : 1)) * (1 + ed / 100));
    const doubled = m.type === 'a2' || (m.type === 'a5' && !twoHand);
    const k = doubled ? 2 : 1;
    let min = (scale(src[0]) + mn) * k + flat, max = (scale(src[1]) + mx) * k + flat;
    if (twoHand) { min += baseDmg[0]; max += baseDmg[1]; }
    if (max <= min) max = min + 1;
    return { b, name: b.name, min, max, doubled, twoHand };
  };
  const w1 = weaponOf(m.base, m.ed, m.minAdd, m.maxAdd, m.eth, m.flat, m.type === 'a5dual');
  const w2 = m.type === 'a5dual' ? weaponOf(m.base2, m.ed2, m.minAdd2, m.maxAdd2, m.eth2, m.flat2, true) : null;

  const statPctOf = (b: MercBase | undefined) => (b ? Math.floor((b.strBonus * str) / 100) + Math.floor((b.dexBonus * dex) / 100) : str);
  const statPct = statPctOf(w1?.b);
  const crit = m.type === 'a5' || m.type === 'a5dual' ? 0.05 : 0;
  const critFactor = 1 + (1 - (1 - crit) * (1 - Math.min(100, m.ds) / 100));

  // Attack speed: item IAS (primary weapon + other gear), weapon speed (dual: average of both), skill speed.
  const frenzyLvl = m.type === 'a5dual' ? slvl('Frenzy') : 0;
  const frenzySpeed = frenzyLvl ? dim(num(SKILL_ROWS.Frenzy, 'Param5'), num(SKILL_ROWS.Frenzy, 'Param6'), frenzyLvl) : 0;
  const ias = m.ias + m.iasOther;
  const wsm = m.type === 'a5dual' && w1 && w2 ? Math.floor((w1.b.wsm + w2.b.wsm) / 2) : w1?.b.wsm ?? 0;
  const sias = auras.speed + frenzySpeed;
  const eias = Math.max(-85, Math.min(EIAS_CAP, eiasFromIas(ias) - wsm + sias));

  const arBase = row.ar + ups * row.arPerLvl + 5 * dex;
  const castFrames = a3CastFrames(m.fcr);

  const attack = (id: string, label: string): Omit<MercAttack, 'share' | 'hitPack' | 'hitDiablo' | 'dpsPack' | 'dpsDiablo'> => {
    const l = id === 'normal' ? 0 : slvl(id);
    const sk = SKILL_ROWS[id] ?? {};
    let anim = m.type === 'rogue' ? ANIMS.rogueBow : m.type === 'a2' ? ANIMS.a2Attack : ANIMS.a5Attack;
    if (id === 'Jab') anim = ANIMS.a2Jab;
    const isSpell = m.type === 'a3' && id !== 'normal';
    const frames = m.type === 'a3' ? castFrames : attackFrames(anim.fpd, eias, anim.seq);
    const res = { id, label, frames, hits: anim.hits, spell: isSpell, phys: 0, fire: 0, cold: 0, ltng: 0, mag: 0, ar: 0, conv: 0, convType: '' };
    if (!DAMAGE_SKILLS.has(id) && id !== 'normal') return { ...res, hits: 0 };          // Inner Sight, Battle Cry, Taunt, Enchant, Static Field
    const avg = (r: [number, number]) => (r[0] + r[1]) / 2;
    if (isSpell) {
      const syn = 1 + synergy(id, blvl) / 100;
      let e = avg(elemBand(id, l)) * syn;
      if (id === 'Charged Bolt') e *= Math.min(24, linear(num(sk, 'Param1'), num(sk, 'Param2'), l)) * CHARGED_BOLT_HIT_SHARE;
      const t = sk.EType as string;
      return { ...res, fire: t === 'fire' ? e : 0, cold: t === 'cold' ? e : 0, ltng: t === 'ltng' ? e : 0, ar: Infinity };
    }
    // Weapon attack. Dual wield: by the player rule the swords take turns, so a hit is the average of both;
    // the "both swords per hit" option adds them up instead (unconfirmed for the D2R merc).
    const ws = [w1, w2].filter((x): x is NonNullable<typeof w1> => Boolean(x));
    const wSum = ws.reduce((a, w) => a + (w.min + w.max) / 2, 0);
    const wAvg = !ws.length ? (baseDmg[0] + baseDmg[1]) / 2 : m.type === 'a5dual' && m.dualSum ? wSum : wSum / ws.length;
    const wStat = ws.length ? ws.reduce((a, w) => a + statPctOf(w.b), 0) / ws.length : str;
    let skillPct = 0, skillFlat = 0, toHit = 0;
    if (id === 'Jab') { skillPct = linear(num(sk, 'Param3'), num(sk, 'Param4'), l); toHit = linear(num(sk, 'ToHit'), num(sk, 'LevToHit'), l); }
    if (id === 'Bash') { skillPct = linear(num(sk, 'Param1'), num(sk, 'Param2'), l) + blvl('Stun') * num(sk, 'Param8'); skillFlat = linear(num(sk, 'Param3'), num(sk, 'Param4'), l); toHit = 15 + 5 * l; }
    if (id === 'Stun') toHit = 10 + 5 * l;
    if (id === 'Frenzy') { skillPct = linear(num(sk, 'Param1'), num(sk, 'Param2'), l) + blvl('Taunt') * num(sk, 'Param8'); toHit = linear(num(sk, 'ToHit'), num(sk, 'LevToHit'), l); }
    if (['Fire Arrow', 'Cold Arrow', 'Exploding Arrow', 'Freezing Arrow'].includes(id)) toHit = linear(num(sk, 'ToHit'), num(sk, 'LevToHit'), l);
    const pct = wStat + auras.dmgPct + skillPct;
    let phys = (wAvg * (1 + pct / 100) + skillFlat) * critFactor;
    let fire = m.fire, cold = m.cold, ltng = m.ltng;
    if (['Fire Arrow', 'Cold Arrow', 'Exploding Arrow', 'Freezing Arrow'].includes(id)) {
      const e = avg(elemBand(id, l)) * (1 + synergy(id, blvl) / 100);
      if (sk.EType === 'fire') fire += e; else cold += e;
    }
    let convPct = 0;
    const cv = sk.conv as number[] | undefined;
    if (cv) {
      convPct = Math.min(100, linear(cv[0], cv[1], l));
      const moved = (phys * convPct) / 100;
      phys -= moved;
      if (sk.EType === 'fire') fire += moved; else cold += moved;
    }
    const ar = arBase * (1 + (m.arPct + toHit + auras.arPct) / 100);
    return { ...res, phys, fire, cold, ltng, ar, conv: convPct, convType: (sk.EType as string) ?? '' };
  };

  const actions = mercActions(m);
  const chosen = m.mode === 'ai' ? actions : actions.filter(a => a.id === m.mode).map(a => ({ ...a, weight: 1 }));
  const list = chosen.length ? chosen : actions;
  const totalW = list.reduce((a, x) => a + x.weight, 0) || 1;
  const perHit = (a: ReturnType<typeof attack>, t: Target) =>
    a.phys * physFactor(t.res[0], amp) + a.fire * elemFactor(t.res[1], conv) + a.cold * elemFactor(t.res[2], conv) + a.ltng * elemFactor(t.res[3], conv) + a.mag;
  const hit = (a: ReturnType<typeof attack>, t: Target) => (a.hits === 0 ? 0 : a.spell ? 1 : hitChance(m.lvl, t.lvl, a.ar, effDef(t.def)));
  const raw = list.map(x => ({ ...attack(x.id, x.label), share: x.weight / totalW }));
  // Time-weighted: each action takes its frames plus the 1-frame hireling AI delay (monstats.txt aidel).
  const cycle = raw.reduce((a, x) => a + x.share * (x.frames + 1), 0);
  const dpsOf = (a: typeof raw[number], T: Target[]) => T.reduce((s, t) => s + t.w * perHit(a, t) * hit(a, t), 0) * a.hits * a.share * 25 / cycle;
  const attacks: MercAttack[] = raw.map(a => ({
    ...a,
    hitPack: targets.reduce((s, t) => s + t.w * hit(a, t), 0), hitDiablo: diablo.reduce((s, t) => s + t.w * hit(a, t), 0),
    dpsPack: dpsOf(a, targets), dpsDiablo: dpsOf(a, diablo)
  }));

  const skillLevels = row.skills.filter(x => x.mode !== 5 || true).map(x => ({ skill: x.skill, blvl: blvl(x.skill), lvl: x.mode === 1 ? blvl(x.skill) + m.skills : slvl(x.skill) }));
  return {
    type: m.type, row, lvl: m.lvl, str, dex, baseDmg, ar: arBase * (1 + (m.arPct + auras.arPct) / 100), skillLevels,
    weapon: w1 ? { name: w1.name, min: w1.min, max: w1.max, doubled: w1.doubled, twoHand: w1.twoHand } : null,
    weapon2: w2 ? { name: w2.name, min: w2.min, max: w2.max } : null,
    physPct: statPct + auras.dmgPct, statPct, crit, ias, wsm, sias, eias, frenzySpeed,
    attacks, dpsPack: attacks.reduce((a, x) => a + x.dpsPack, 0), dpsDiablo: attacks.reduce((a, x) => a + x.dpsDiablo, 0),
    actionsPerSec: 25 / cycle, ownAura
  };
}

export { MODE_SEQ, MODE_CAST };
