import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculate } from '../src/core/calc.ts';
import { findFit } from '../src/core/fit.ts';
import { applyVariant, DEFAULT_STATE, decodeState, encodeState, type State } from '../src/core/state.ts';
import * as F from '../src/core/formulas.ts';

// Reference model: one "model monster" (no resists), as in the original DPS spreadsheet.
const modelPack: Partial<State> = { enMelee: 'std', enMeleeN: 1, enRanged: '', enRangedN: 0, revMelee: 'std', revMeleeN: 0, revRanged: '', revRangedN: 0 };
const variant = (id: string, extra: Partial<State> = {}, beast = false) => ({ ...applyVariant({ ...DEFAULT_STATE, ...modelPack }, id, { beast }), ...extra });
const near = (actual: number, expected: number, tol = 0.02) =>
  assert.ok(Math.abs(actual - expected) / expected <= tol, `${Math.round(actual)} not within ${tol * 100}% of ${expected}`);

// The reference spreadsheet used flat golem values and no Battle Command bonus while summoning, so these
// checks compare the army without the golem and Rogue arrows at the spreadsheet's skill levels (doc total minus its golem value).
const docLevels = (sum: number, rsm: number): Partial<State> => ({ rsS: sum, smS: sum, rsmS: rsm, golemType: 'none', rogueOn: false, revFana: false });

test('presets reproduce the reference model totals (without golem)', () => {
  // Low budget now mirrors a real character; the spreadsheet row used level 84, 40/39 during play and Inner Sight 30.
  near(calculate(variant('low-budget', { ...docLevels(40, 39), clvl: 84, rsP: 40, rsmP: 39, isL: 30 })).totalPack, 29400 - 1150);
  near(calculate(variant('rogue-company', docLevels(45, 44), true)).totalPack, 50800 - 2100);
  near(calculate(variant('desert-storm', docLevels(45, 44))).totalPack, 63900 - 2900);
  near(calculate(variant('max-auras', { ...docLevels(45, 44), revMeleeN: 25 })).totalPack, 86500 - 1850);
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

test('Beast mode only applies to the Rogue presets', () => {
  assert.equal(variant('low-budget').fanaL, 1);
  assert.equal(variant('low-budget', {}, true).fanaL, 9);
  assert.equal(variant('low-budget', {}, true).gRw, 'beast');
  assert.ok(calculate(variant('rogue-company', {}, true)).totalPack > calculate(variant('rogue-company')).totalPack);
  assert.deepEqual(variant('max-auras', {}, true), variant('max-auras'));
  assert.deepEqual(variant('desert-storm', {}, true), variant('desert-storm'));
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
  assert.equal(fit('desert-storm')?.merc, 'act2');
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
