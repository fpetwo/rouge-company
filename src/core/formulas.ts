// Skill and aura formulas. Sources: Basin Wiki skill pages (theamazonbasin.com/wiki).
import { monlvlDef } from './data.ts';

/** Minion count for Raise Skeleton / Raise Skeletal Mage: lvl 1–3 = lvl, from 4 = 2 + ⌊lvl/3⌋. */
export const minionCount = (l: number): number => (l <= 0 ? 0 : l < 4 ? Math.floor(l) : 2 + Math.floor(l / 3));

/** Diminishing-returns curve used by several auras: a + ⌊b·⌊110·L/(L+6)⌋/100⌋, capped. */
const curve = (l: number, a: number, b: number, cap: number): number =>
  Math.min(a + Math.floor((b * Math.floor((110 * l) / (l + 6))) / 100), cap);

export const fanaSpeed = (l: number): number => (l <= 0 ? 0 : curve(l, 10, 30, 40));
export const fanaDamage = (l: number): number => (l <= 0 ? 0 : Math.floor((33 + 17 * l) / 2)); // allied value
export const fanaAr = (l: number): number => (l <= 0 ? 0 : 35 + 5 * l);
export const conDamage = (l: number): number => (l <= 0 ? 0 : 45 + 15 * l);
export const mightDamage = (l: number): number => (l <= 0 ? 0 : 30 + 10 * l);
export const howDamage = (l: number): number => (l <= 0 ? 0 : 13 + 7 * l);
export const howAr = (l: number): number => (l <= 0 ? 0 : 18 + 7 * l);
export const convDefense = (l: number): number => (l <= 0 ? 0 : curve(l, 40, 60, 100));
export const convResist = (l: number): number => (l <= 0 ? 0 : Math.min(25 + 5 * l, 150));

export function innerSightDefense(l: number): number {
  if (l <= 0) return 0;
  if (l <= 8) return 25 * l + 15;
  if (l <= 16) return 45 * l - 145;
  if (l <= 22) return 60 * l - 385;
  if (l <= 28) return 80 * l - 825;
  return 100 * l - 1385;
}

/** Thorns flat damage per attack attempt (patch 2.4). Levels 15–20 from tables, others extrapolated. */
export function thornsFlat(l: number): number {
  if (l <= 0) return 0;
  const t: Record<number, number> = { 15: 88, 16: 96, 17: 108, 18: 120, 19: 132, 20: 144 };
  if (t[l] !== undefined) return t[l];
  return l > 20 ? 144 + 12 * (l - 20) : Math.max(0, 88 - 8 * (15 - l));
}
export const thornsPercent = (l: number): number => (l <= 0 ? 0 : 210 + 40 * l);

/** Aura radii in yards. */
export const radius = {
  standard: (l: number) => (28 + 4 * l) / 3, // Might, Concentration, Thorns
  fana: (l: number) => (20 + 2 * l) / 3,
  how: (l: number) => ((2 * l + 28) * 2) / 3,
  conv: () => 40 / 3,
  innerSight: () => 18
};

/** Skeleton attack frames by Fanaticism speed bonus (calibrated to the reference model). */
export const skeletonFrames = (speed: number): number =>
  speed >= 33 ? 13 : speed >= 29 ? 14 : speed >= 21 ? 15 : speed >= 14 ? 16 : speed >= 7 ? 17 : 18;
export const AI_DELAY_FRAMES = 15;

/** Physical damage factor after resist, Amplify Damage lowers resist by 100. */
export const physicalFactor = (res: number, amp: boolean): number => 1 - (res - (amp ? 100 : 0)) / 100;

/** Elemental damage factor; Conviction only works at 1/5 against immune monsters. */
export function elementalFactor(res: number, conviction: number): number {
  const reduction = res >= 100 ? Math.floor(conviction / 5) : conviction;
  return Math.max(0, 1 - (res - reduction) / 100);
}

/** Chance to hit: 2·alvl/(alvl+dlvl) · AR/(AR+Def), clamped to 5–95 %. */
export const hitChance = (alvl: number, dlvl: number, ar: number, def: number): number =>
  Math.max(0.05, Math.min(0.95, ((2 * alvl) / (alvl + dlvl)) * (ar / (ar + def))));

/** Skeletal Mage missile level = ⌊(RSM−2)/2⌋ (if RSM ≥ 4) + Skeleton Mastery. */
export const mageMissileLevel = (rsm: number, sm: number): number => (rsm >= 4 ? Math.floor((rsm - 2) / 2) : 0) + sm;

/** Average damage per mage missile by element. */
export function mageMissileDamage(l: number): { fire: number; light: number; cold: number } {
  const band = (a: number, b: number, c: number, d: number, e: number) =>
    l <= 8 ? a : l <= 16 ? b : l <= 22 ? c : l <= 28 ? d : e;
  return {
    fire: band(2 * l + 2, 3 * l - 6, 5 * l - 38, 7 * l - 82, 9 * l - 138),
    light: (l + band(4 + 3 * l, 5 * l - 12, 8 * l - 60, 11 * l - 126, 14 * l - 210)) / 2,
    cold: band(l + 1.5, 2 * l - 6.5, 3 * l - 22.5, 4 * l - 44.5, 5 * l - 72.5)
  };
}

/** Skeleton warrior base values, calibrated to the reference model at RS/SM 40/40 and 45/45. */
export const skeletonBaseDamage = (rs: number, sm: number): number => 167.4 + 4.02 * (rs - 40) + 2 * (sm - 40);
export const skeletonBasePercent = (sm: number): number => 7 * sm - 21;
export const skeletonBaseAr = (rs: number): number => 4576 + 30 * (rs - 40);
export const CRIT_FACTOR = 1.05;

// Minion defense in Hell (Amazon Basin, from skills.txt/monstats.txt): base + per-level bonus + monster-level table at the caster's level.
export const skeletonDefense = (rs: number, sm: number, clvl: number) => (rs > 0 ? 6 + 15 * (rs + sm) + monlvlDef(clvl) : 0);
export const mageDefense = (rsm: number, sm: number, clvl: number) => (rsm > 0 ? 28 + 10 * (rsm + sm) + monlvlDef(clvl) : 0);
