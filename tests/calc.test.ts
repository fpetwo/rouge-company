import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculate } from '../src/core/calc.ts';
import { findFit } from '../src/core/fit.ts';
import { applyVariant, DEFAULT_STATE, decodeState, encodeState, type State } from '../src/core/state.ts';
import * as F from '../src/core/formulas.ts';
import { attackFrames, elemBand, frameSteps, iasForEias, mercActions } from '../src/core/merc.ts';

// Reference model: one "model monster" (no resists), as in the original DPS spreadsheet.
const modelPack: Partial<State> = { enMelee: 'std', enMeleeN: 1, enRanged: '', enRangedN: 0, revMelee: 'std', revMeleeN: 0, revRanged: '', revRangedN: 0 };
const variant = (id: string, extra: Partial<State> = {}, beast = false) => ({ ...applyVariant({ ...DEFAULT_STATE, ...modelPack }, id, { beast }), ...extra });
const near = (actual: number, expected: number, tol = 0.02) =>
  assert.ok(Math.abs(actual - expected) / expected <= tol, `${Math.round(actual)} not within ${tol * 100}% of ${expected}`);

// The reference spreadsheet used flat golem values and no Battle Command bonus while summoning, so these
// checks compare the army without the golem and Rogue arrows at the spreadsheet's skill levels (doc total minus its golem value).
const docLevels = (sum: number, rsm: number): Partial<State> => ({ rsS: sum, smS: sum, rsmS: rsm, golemType: 'none', mercOn: false, revFana: false });

test('presets reproduce the reference model totals (without golem)', () => {
  // The spreadsheet used character level 84 for every row (presets now default to 88), so it is pinned here.
  // Low budget now mirrors a real character; its spreadsheet row used 40/39 during play and Inner Sight 30.
  near(calculate(variant('low-budget', { ...docLevels(40, 39), clvl: 84, rsP: 40, rsmP: 39, isL: 30 })).totalPack, 29400 - 1150);
  near(calculate(variant('rogue-company', { ...docLevels(45, 44), clvl: 84 }, true)).totalPack, 50800 - 2100);
  near(calculate(variant('desert-storm', { ...docLevels(45, 44), clvl: 84 }, true)).totalPack, 63900 - 2900);
  near(calculate(variant('max-auras', { ...docLevels(45, 44), clvl: 84, revMeleeN: 25 })).totalPack, 86500 - 1850);
});

test('presets summon one level higher than they play (Battle Command)', () => {
  for (const id of ['rogue-company', 'desert-storm']) {
    const v = variant(id);
    assert.equal(v.rsS - v.rsP, 1, id);
    assert.equal(v.rsmS - v.rsmP, 1, id);
  }
  const m = variant('max-auras');
  assert.equal(m.rsS, 46); assert.equal(m.rsP, 40);   // Arm of King Leoric swap (−5) plus Battle Command (+1)
});

test('every preset keeps the default character level 88', () => {
  for (const id of ['low-budget', 'rogue-company', 'desert-storm', 'max-auras', 'twin-blades']) assert.equal(variant(id).clvl, DEFAULT_STATE.clvl, id);
  assert.equal(DEFAULT_STATE.clvl, 88);
});

test('Beast mode applies to every preset except Max Auras', () => {
  assert.equal(variant('low-budget').fanaL, 1);
  assert.equal(variant('low-budget', {}, true).fanaL, 9);
  assert.equal(variant('low-budget', {}, true).gRw, 'beast');
  assert.ok(calculate(variant('rogue-company', {}, true)).totalPack > calculate(variant('rogue-company')).totalPack);
  assert.deepEqual(variant('max-auras', {}, true), variant('max-auras'));
  assert.equal(variant('desert-storm').gRw, 'mania');
  assert.equal(variant('desert-storm').fanaL, 1);
  assert.equal(variant('desert-storm', {}, true).gRw, 'beast');
  assert.ok(calculate(variant('desert-storm', {}, true)).totalPack > calculate(variant('desert-storm')).totalPack);
});

test('golem damage follows the game data', () => {
  // Beast on a Berserker Axe with Concentration 12, Fanaticism 9, Heart of Wolverine 5 (Rogue Company + Beast mode).
  const g = calculate(variant('rogue-company', {}, true)).golem!;
  assert.equal(g.frames, 10);                     // EIAS 30 (40% IAS) + 29 (Fanaticism 9) = 59 → 10 frames
  near(g.phys, ((12 + 33) / 2 + ((24 + 71) / 2) * 3.7) * (1 + 366 / 100), 0.001);
  // Two-handed bases give the Iron Golem no weapon damage.
  assert.ok(calculate(variant('max-auras')).golem!.weaponNote.includes('two-handed'));
  // Clay Golem: almost no damage, but slows; no item, so no golem aura slot.
  const clay = calculate({ ...variant('rogue-company'), golemType: 'clay', golemLvl: 19 });
  assert.equal(clay.golem!.slow, 62);
  assert.ok(clay.golem!.dpsPack < 200);
  assert.equal(findFit({ ...variant('max-auras'), golemType: 'clay' }), null);   // Pride had no other carrier
  assert.ok(findFit({ ...variant('low-budget'), golemType: 'clay' }));         // Mania's Fanaticism 1 fits elsewhere
  // Fire Golem synergy raises Iron Golem damage by 6% per hard point.
  const base = calculate(variant('rogue-company')).golem!, syn = calculate(variant('rogue-company', { synFire: 5 })).golem!;
  near(syn.percent - base.percent, 30, 0.001);
});

test('skill formulas match Basin Wiki tables', () => {
  assert.equal(F.mageMissileLevel(39, 40), 58);
  assert.equal(F.mageMissileLevel(44, 45), 66);
  assert.equal(F.innerSightDefense(30), 1615);
  assert.equal(F.innerSightDefense(32), 1815);
  assert.equal(F.howDamage(5), 48);
  assert.equal(F.howAr(5), 53);
  assert.equal(F.fanaSpeed(15), 33);
  assert.equal(F.minionCount(45), 17);
  assert.equal(F.minionCount(40), 15);
});

test('gear swap removes surplus minions', () => {
  const r = calculate(variant('max-auras'));
  assert.equal(r.counts.skeletonsSummoned, 17);
  assert.equal(r.counts.skeletons, 15);
  assert.equal(r.counts.mages, 15);
});

test('feasibility check resolves variants to their real gear', () => {
  const fit = (id: string) => findFit(variant(id));
  assert.deepEqual(fit('low-budget'), { merc: 'rogue', necro: [], merc_items: ['Mist', 'Bramble', 'Inner Sight'], golem: 'Mania' });
  assert.equal(fit('desert-storm')?.merc, 'a2');
  assert.equal(findFit(variant('low-budget', {}, true))?.golem, 'Beast');
  assert.equal(findFit(variant('rogue-company'))?.golem, 'Mania');
  assert.equal(fit('max-auras')?.necro[0], 'Last Wish');
  assert.equal(findFit(variant('max-auras', { convOn: true })), null);
});

test('state survives URL round trip', () => {
  const s = variant('desert-storm', { enMeleeN: 3 });
  assert.deepEqual(decodeState(encodeState(s)), s);
});

test('real monsters reduce damage through resists', () => {
  const real = calculate({ ...DEFAULT_STATE });
  const model = calculate({ ...DEFAULT_STATE, enMelee: 'std', enMeleeN: 10, enRanged: '', enRangedN: 0 });
  assert.ok(real.totalPack < model.totalPack);
});

test('enemy hit chance follows attack rating against minion defense', () => {
  assert.equal(F.skeletonDefense(45, 45, 84), 6 + 15 * 90 + 1634);
  const r = calculate({ ...DEFAULT_STATE });
  const dk = r.pack.find(p => p.monster.id === 'doomkn')!;
  assert.ok(dk.hitsMinions > 0.6 && dk.hitsMinions < 0.8, `Doom Knight hits ${dk.hitsMinions}`);
  // Higher Skeleton Mastery at summoning means fewer hits taken.
  const tougher = calculate({ ...DEFAULT_STATE, smS: 60 }).pack.find(p => p.monster.id === 'doomkn')!;
  assert.ok(tougher.hitsMinions < dk.hitsMinions);
});

test('default setup is the Low budget preset', () => {
  assert.deepEqual(applyVariant(DEFAULT_STATE, 'low-budget'), DEFAULT_STATE);
});

// ---- Mercenary ----
// Reference: the author's level 88 Rogue (character screen and skill tooltips): Str 142, Dex 215, Inner Sight 31,
// Cold Arrow 34 (69% physical → cold, AR +307%, cold 235–248), Freezing Arrow 14 (cold 872–915), Mist on a Matriarchal Bow (93–227).
test('Rogue stats and skills match the in-game screen', () => {
  const m = calculate({ ...DEFAULT_STATE }).mercRes;
  assert.equal(m.str, 142); assert.equal(m.dex, 215);
  const lv = Object.fromEntries(m.skillLevels.map(x => [x.skill, x.lvl]));
  assert.equal(lv['Inner Sight'], 31); assert.equal(lv['Cold Arrow'], 34); assert.equal(lv['Freezing Arrow'], 14);
  assert.deepEqual(elemBand('Cold Arrow', 34), [235, 248]);
  const ca = m.attacks.find(a => a.id === 'Cold Arrow')!;
  assert.equal(ca.conv, 69);
  const fa = m.attacks.find(a => a.id === 'Freezing Arrow')!;
  near(fa.cold - DEFAULT_STATE.mCold, (872 + 915) / 2, 0.002);   // Cold Arrow synergy: base level 28 × 12%
  // Weapon: Mist 365% on Matriarchal Bow (20–47) = 93–227 (+9 max), plus the merc's base damage 40–42.
  assert.deepEqual([m.weapon!.min, m.weapon!.max], [93 + 40, 227 + 42]);
});

test('Rogue damage on screen is reproduced within 5%', () => {
  // Screen 667–1367 with Concentration 9 and the golem's Fanaticism 1, without Heart of Wolverine.
  const m = calculate({ ...DEFAULT_STATE, howOn: false }).mercRes;
  const normal = m.attacks.find(a => a.id === 'normal')!;
  near(normal.phys, (667 + 1367) / 2, 0.05);
});

test('attack frames follow the Basin Wiki merc tables', () => {
  // Desert merc normal attack (16 frames/direction): 15 frames at 0 EIAS, 9 frames from EIAS 61.
  assert.equal(attackFrames(16, 0), 15); assert.equal(attackFrames(16, 60), 10); assert.equal(attackFrames(16, 61), 9);
  // Jab is a 14-frame sequence: 14 at 0, 12 from EIAS 17, 8 from EIAS 75.
  assert.equal(attackFrames(14, 0, true), 14); assert.equal(attackFrames(14, 16, true), 13); assert.equal(attackFrames(14, 17, true), 12); assert.equal(attackFrames(14, 75, true), 8);
  // Rogue bow (15): 14 at 0, 9 from 50, 8 from 67.
  assert.equal(attackFrames(15, 0), 14); assert.equal(attackFrames(15, 50), 9); assert.equal(attackFrames(15, 67), 8);
  // The author's Rogue: 20% IAS on a Matriarchal Bow (WSM −10), no Fanaticism → EIAS 27 → 11 frames.
  assert.equal(attackFrames(15, 27), 11);
  assert.deepEqual(frameSteps(15).filter(x => x.eias >= 0).map(x => x.eias), [0, 8, 16, 25, 37, 50, 67]);
  assert.equal(iasForEias(30), 40); assert.equal(iasForEias(75), 200);
});

test('merc AI mix follows the hireling table chances', () => {
  const a2 = mercActions({ type: 'a2', sub: 'might', lvl: 88 } as never);
  assert.deepEqual(a2.map(a => [a.id, a.weight]), [['normal', 30], ['Jab', 149]]);   // 136 + 13 × 4 / 4
  const dual = mercActions({ type: 'a5dual', sub: 'frenzy', lvl: 88 } as never);
  assert.deepEqual(dual.map(a => a.id), ['normal', 'Frenzy', 'Taunt']);              // Iron Skin is passive
});

test('merc damage respects resistances and immunities', () => {
  // Cold Arrow only: Flesh Archers are cold immune, so a pack of them takes far less than Doom Knights.
  const only = { ...DEFAULT_STATE, mMode: 'Cold Arrow', enMeleeN: 0, enRangedN: 3 };
  const archers = calculate(only).mercRes.dpsPack;
  const knights = calculate({ ...only, enMeleeN: 3, enRangedN: 0 }).mercRes.dpsPack;
  assert.ok(archers < knights * 0.6, `${archers} vs ${knights}`);
  // Amplify Damage only helps the physical part.
  const amp = calculate({ ...DEFAULT_STATE }).mercRes.dpsDiablo, noAmp = calculate({ ...DEFAULT_STATE, ampOn: false }).mercRes.dpsDiablo;
  assert.ok(amp > noAmp);
});

test('merc DPS counts in the total and every merc type computes', () => {
  const on = calculate({ ...DEFAULT_STATE }), off = calculate({ ...DEFAULT_STATE, mercOn: false });
  near(on.totalPack - off.totalPack, on.mercRes.dpsPack, 0.001);
  for (const id of ['low-budget', 'rogue-company', 'desert-storm', 'max-auras', 'twin-blades']) {
    const r = calculate(variant(id));
    assert.ok(r.mercRes.dpsPack > 0 && Number.isFinite(r.totalPack), id);
    assert.ok(findFit(variant(id)), `${id} gear fits`);
  }
  assert.equal(findFit(variant('desert-storm'))?.merc, 'a2');
  assert.equal(findFit(variant('twin-blades'))?.merc, 'a5dual');
  // Dual wield: summing both swords per hit doubles roughly the weapon part.
  const tw = variant('twin-blades');
  assert.ok(calculate({ ...tw, mDualSum: true }).mercRes.dpsPack > calculate(tw).mercRes.dpsPack * 1.5);
});
