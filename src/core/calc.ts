import { DIABLO, GOLEM_ITEMS, GOLEMS, fireGolemFire, monlvlAr, monsterById, type Monster } from './data.ts';
import { GOLEM_BASES } from './golem-bases.ts';
import { findFit } from './fit.ts';
import * as F from './formulas.ts';
import type { State } from './state.ts';

interface Target { lvl: number; def: number; res: [number, number, number, number]; w: number }
export interface Row { label: string; pack: number; diablo: number }

export interface RevUnit { m: Monster; dmg: number; ar: number; pack: number; diablo: number; hitPack: number; hitDiablo: number }

export interface Result {
  rows: Row[];
  totalPack: number;
  totalDiablo: number;
  counts: { skeletons: number; skeletonsSummoned: number; mages: number; magesSummoned: number; revivesMax: number; revivesWanted: number; revivesCounted: number };
  missileLevel: number;
  pack: { monster: Monster; n: number; melee: boolean; hitsMinions: number }[];
  minionDefense: { skeleton: number; mage: number };
  diabloHitsMinions: number;
  revives: RevUnit[];
  skeleton: { percent: number; damage: number; ar: number; frames: number; speed: number; hitPack: number; hitDiablo: number; dpsPack: number; dpsDiablo: number };
  mage: { fire: number; light: number; cold: number; dpsPack: number; dpsDiablo: number };
  golem: GolemResult | null;
  merc: 'rogue' | 'act2';
}

export interface GolemResult {
  name: string; percent: number; phys: number; elem: number; elemType: string; ar: number; eias: number; frames: number;
  hitPack: number; hitDiablo: number; dpsPack: number; dpsDiablo: number; slow: number; weaponNote: string;
}

export function calculate(s: State): Result {
  const lvl = (k: 'might' | 'con' | 'fana' | 'conv' | 'how' | 'thorns' | 'is') => (s[`${k}On`] ? s[`${k}L`] : 0);
  const speed = F.fanaSpeed(lvl('fana'));
  const auraPct = F.conDamage(lvl('con')) + F.mightDamage(lvl('might')) + F.fanaDamage(lvl('fana')) + F.howDamage(lvl('how'));
  const arPct = F.fanaAr(lvl('fana')) + F.howAr(lvl('how'));
  const convRes = F.convResist(lvl('conv'));
  const effDef = (d: number) => Math.max(0, d * (1 - F.convDefense(lvl('conv')) / 100) - F.innerSightDefense(lvl('is')));

  // Targets: enemy pack weighted by count, and Diablo.
  const pack: Result['pack'] = [];
  const em = monsterById(s.enMelee), er = monsterById(s.enRanged);
  if (em && s.enMeleeN > 0) pack.push({ monster: em, n: s.enMeleeN, melee: em.type === 'melee', hitsMinions: 0 });
  if (er && s.enRangedN > 0) pack.push({ monster: er, n: s.enRangedN, melee: er.type === 'melee', hitsMinions: 0 });
  const packN = pack.reduce((a, t) => a + t.n, 0);
  const targets: Target[] = pack.map(t => ({ lvl: t.monster.lvl, def: t.monster.def, res: t.monster.res, w: t.n / packN }));
  const diablo: Target[] = [{ lvl: DIABLO.lvl, def: DIABLO.def, res: DIABLO.res, w: 1 }];
  const avgElemRes = (r: Target['res']) => (r[1] + r[2] + r[3]) / 3;

  const physDps = (dmg: number, elem: number, alvl: number, ar: number, aps: number, T: Target[]) =>
    T.reduce((a, t) => a + t.w * (dmg * F.physicalFactor(t.res[0], s.ampOn) + elem * F.elementalFactor(avgElemRes(t.res), convRes)) * F.hitChance(alvl, t.lvl, ar, effDef(t.def)) * aps, 0);
  const avgHit = (alvl: number, ar: number, T: Target[]) => T.reduce((a, t) => a + t.w * F.hitChance(alvl, t.lvl, ar, effDef(t.def)), 0);

  // Skeleton warriors (stats from summoning levels, count from the lower level).
  const skeletonsSummoned = F.minionCount(s.rsS);
  const skeletons = Math.min(skeletonsSummoned, F.minionCount(s.rsP));
  const percent = F.skeletonBasePercent(s.smS) + auraPct;
  const damage = Math.max(0, F.skeletonBaseDamage(s.rsS, s.smS)) * (1 + percent / 100) * F.CRIT_FACTOR;
  const ar = F.skeletonBaseAr(s.rsS) * (1 + arPct / 100);
  const frames = F.skeletonFrames(speed);
  const aps = 25 / (frames + F.AI_DELAY_FRAMES);
  const skPack = physDps(damage, 0, s.clvl, ar, aps, targets);
  const skDia = physDps(damage, 0, s.clvl, ar, aps, diablo);

  // Skeletal mages: random element each; poison counts once per target and is left out.
  const magesSummoned = F.minionCount(s.rsmS);
  const mages = Math.min(magesSummoned, F.minionCount(s.rsmP));
  const missileLevel = F.mageMissileLevel(s.rsmS, s.smS);
  const E = F.mageMissileDamage(missileLevel);
  const mageDps = (T: Target[]) => (s.rsmS > 0
    ? T.reduce((a, t) => a + t.w * (E.fire * F.elementalFactor(t.res[1], convRes) + E.cold * F.elementalFactor(t.res[2], convRes) + E.light * F.elementalFactor(t.res[3], convRes)) / 4, 0) * aps
    : 0);
  const maPack = mageDps(targets), maDia = mageDps(diablo);

  // Golem: computed from game data. Off-weapon +% damage (auras, own skill bonus, Fire Golem synergy) applies to
  // base + weapon damage; the item's enhanced damage only to the weapon part (Basin Wiki, Iron Golem).
  const golemRes = ((): GolemResult | null => {
    if (s.golemType === 'none') return null;
    const g = GOLEMS[s.golemType];
    const item = GOLEM_ITEMS[s.gRw] ?? GOLEM_ITEMS.none;
    const base = GOLEM_BASES.find(b => b.code === s.gBase);
    const iron = s.golemType === 'iron';
    const weaponAvg = iron && item.weapon && base?.one ? (base.one[0] + base.one[1]) / 2 : 0;
    const weaponNote = !iron ? '' : !item.weapon ? 'armor: no weapon damage' : !base ? 'no base selected' : base.one ? `${base.name} ${base.one[0]}–${base.one[1]}` : `${base.name}: two-handed only, its damage does not transfer`;
    const pct = g.dmgPerLvl * Math.max(0, s.golemLvl - 1) + (s.golemType === 'fire' ? 0 : 6 * s.synFire) + auraPct;
    const phys = (((g.dmg[0] + g.dmg[1]) / 2) + weaponAvg * (1 + (iron ? s.gEd : 0) / 100)) * (1 + pct / 100) * (1 + (iron ? s.gDs : 0) / 100);
    const elem = iron ? s.gElem : s.golemType === 'fire' ? fireGolemFire(s.golemLvl) : 0;
    const elemIdx = iron ? 3 : 1;   // Pride adds lightning; Fire Golem deals fire
    const arBase = g.ar + monlvlAr(s.clvl) + 25 * s.gmLvl + (s.golemType === 'clay' ? g.arPerLvl * s.golemLvl : 20 * s.synClay);
    const gAr = arBase * (1 + (arPct + (iron ? s.gAr : 0)) / 100);
    const ias = iron ? s.gIas : 0;
    const eias = Math.floor((120 * ias) / (120 + ias)) - (iron && item.weapon && base ? base.wsm : 0) + speed;
    const frames = [...g.frames].reverse().find(([e]) => eias >= e)?.[1] ?? g.frames[0][1];
    const gAps = 25 / (frames + F.AI_DELAY_FRAMES);
    const dps = (T: Target[]) => T.reduce((a, t) => a + t.w * (phys * F.physicalFactor(t.res[0], s.ampOn) + elem * F.elementalFactor(t.res[elemIdx], convRes)) * F.hitChance(s.clvl, t.lvl, gAr, effDef(t.def)) * gAps, 0);
    const slow = s.golemType === 'clay' ? Math.min(Math.floor(75 * Math.floor((110 * s.golemLvl) / (s.golemLvl + 6)) / 100), 75) : 0;
    return { name: g.name, percent: pct, phys, elem, elemType: iron ? 'lightning' : 'fire', ar: gAr, eias, frames, hitPack: avgHit(s.clvl, gAr, targets), hitDiablo: avgHit(s.clvl, gAr, diablo), dpsPack: dps(targets), dpsDiablo: dps(diablo), slow, weaponNote };
  })();
  const golemPack = golemRes?.dpsPack ?? 0, golemDia = golemRes?.dpsDiablo ?? 0;

  // Revives: monster's own stats, boosted by auras.
  const revivesMax = Math.min(s.revS, s.revP);
  const rm = monsterById(s.revMelee), rr = monsterById(s.revRanged);
  const revivesWanted = (rm ? s.revMeleeN : 0) + (rr ? s.revRangedN : 0);
  const scale = revivesWanted > 0 ? Math.min(1, revivesMax / revivesWanted) : 1;
  const revSpeed = s.revFana ? 1 + speed / 100 : 1;
  const revUnit = (m: Monster | undefined, apsBase: number): RevUnit | null => {
    if (!m) return null;
    const a = m.ar * (1 + arPct / 100), d = ((m.min + m.max) / 2) * (1 + auraPct / 100);
    return { m, dmg: d, ar: a, pack: physDps(d, m.elem, m.lvl, a, apsBase * revSpeed, targets), diablo: physDps(d, m.elem, m.lvl, a, apsBase * revSpeed, diablo), hitPack: avgHit(m.lvl, a, targets), hitDiablo: avgHit(m.lvl, a, diablo) };
  };
  const ru = revUnit(rm, s.revMeleeAps), rru = revUnit(rr, s.revRangedAps);
  const revPack = scale * ((ru ? s.revMeleeN * ru.pack : 0) + (rru ? s.revRangedN * rru.pack : 0));
  const revDia = scale * ((ru ? s.revMeleeN * ru.diablo : 0) + (rru ? s.revRangedN * rru.diablo : 0));

  // How often enemies hit the army: their attack rating against the minions' defense, weighted by minion count.
  // Skeletons and mages use the caster level at summoning; revives keep their monster defense (Basin Wiki).
  const skDef = F.skeletonDefense(s.rsS, s.smS, s.clvl), maDef = F.mageDefense(s.rsmS, s.smS, s.clvl);
  const army: { lvl: number; def: number; n: number }[] = [
    { lvl: s.clvl, def: skDef, n: skeletons },
    { lvl: s.clvl, def: maDef, n: mages },
    ...(rm ? [{ lvl: Math.min(s.clvl, rm.lvl), def: rm.def, n: s.revMeleeN * scale }] : []),
    ...(rr ? [{ lvl: Math.min(s.clvl, rr.lvl), def: rr.def, n: s.revRangedN * scale }] : [])
  ].filter(u => u.n > 0);
  const armyN = army.reduce((a, u) => a + u.n, 0);
  const hitsArmy = (alvl: number, atk: number) => (armyN > 0 ? army.reduce((a, u) => a + u.n * F.hitChance(alvl, u.lvl, atk, u.def), 0) / armyN : 0);
  for (const t of pack) t.hitsMinions = hitsArmy(t.monster.lvl, t.monster.ar);
  const diabloHits = hitsArmy(DIABLO.lvl, DIABLO.ar);

  // Thorns: only melee enemies trigger it. Flat part on every swing, percentage part on hits.
  const tl = lvl('thorns');
  let thPack = 0, thDia = 0, meleeN = 0;
  if (tl > 0) {
    const p = F.thornsPercent(tl) / 100, f = F.thornsFlat(tl);
    for (const t of pack) if (t.melee) {
      meleeN += t.n;
      const avg = (t.monster.min + t.monster.max) / 2;
      thPack += (avg * p * t.hitsMinions * s.enAps + f * s.enAps) * F.physicalFactor(t.monster.res[0], s.ampOn) * t.n;
    }
    thDia = (DIABLO.dmg * p * diabloHits * DIABLO.aps + f * DIABLO.aps) * F.physicalFactor(DIABLO.res[0], s.ampOn);
  }
  // The Rogue's arrows only count when the merc is a Rogue (an Act 2 merc's own attacks are not modelled).
  const merc = findFit(s)?.merc ?? (s.isOn ? 'rogue' : 'act2');
  const rogue = s.rogueOn && merc === 'rogue' ? { pack: s.rogueS, diablo: s.rogueD } : { pack: 0, diablo: 0 };
  const has = packN > 0 ? 1 : 0;

  const rows: Row[] = [
    { label: `Skeleton warriors (${skeletons})`, pack: has * skeletons * skPack, diablo: skeletons * skDia },
    { label: `Skeletal mages (${mages})`, pack: has * mages * maPack, diablo: mages * maDia },
    { label: golemRes?.name ?? 'Golem', pack: has * golemPack, diablo: golemDia },
    { label: `Revives (${Math.round(revivesWanted * scale)})`, pack: has * revPack, diablo: revDia },
    { label: `Thorns (${meleeN} melee attackers)`, pack: thPack, diablo: thDia },
    { label: 'Rogue Cold Arrow', pack: has * rogue.pack, diablo: rogue.diablo }
  ];
  return {
    rows,
    totalPack: rows.reduce((a, r) => a + r.pack, 0),
    totalDiablo: rows.reduce((a, r) => a + r.diablo, 0),
    counts: { skeletons, skeletonsSummoned, mages, magesSummoned, revivesMax, revivesWanted, revivesCounted: Math.round(revivesWanted * scale) },
    missileLevel,
    pack,
    minionDefense: { skeleton: skDef, mage: maDef },
    diabloHitsMinions: diabloHits,
    revives: [ru, rru].filter((x): x is RevUnit => x !== null),
    skeleton: { percent, damage, ar, frames, speed, hitPack: avgHit(s.clvl, ar, targets), hitDiablo: avgHit(s.clvl, ar, diablo), dpsPack: skPack, dpsDiablo: skDia },
    mage: { ...E, dpsPack: maPack, dpsDiablo: maDia },
    golem: golemRes,
    merc
  };
}
