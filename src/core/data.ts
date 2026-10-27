// Game data used by the calculator. Single source of truth: the guide pages render
// their tables from these objects, so text and calculator can never disagree.

export type AuraKey = 'might' | 'con' | 'fana' | 'conv' | 'how' | 'thorns' | 'is';
export type Carrier = 'N' | 'R' | 'A2' | 'G';

export interface AuraSource {
  name: string;          // item or skill name
  base: string;          // item base / slot description
  min: number;           // aura level range of the item
  max: number;
  pick?: number;         // level set when the source is clicked (default: max); for skills and merc auras a typical high value
  carriers: Partial<Record<Carrier, true | '1H' | '2H'>>;
  slot?: 'weapon' | 'armor' | 'ring' | 'skill' | 'own';
}

export interface AuraInfo {
  key: AuraKey;
  name: string;
  summary: string;       // one-line effect for the minion army
  sources: AuraSource[];
}

export const CARRIER_NAMES: Record<Carrier, string> = {
  N: 'Necromancer',
  R: 'Rogue (Act 1 merc)',
  A2: 'Desert merc (Act 2)',
  G: 'Iron Golem'
};

export const AURAS: AuraInfo[] = [
  {
    key: 'might', name: 'Might', summary: '+% physical damage for all allies in range',
    sources: [
      { name: 'Last Wish', base: 'sword / axe / hammer', min: 17, max: 17, carriers: { N: '1H', G: true }, slot: 'weapon' },
      { name: 'Act 2 Offensive merc', base: 'own aura, rises with +skills on merc gear', min: 1, max: 40, pick: 19, carriers: { A2: true }, slot: 'own' }
    ]
  },
  {
    key: 'con', name: 'Concentration', summary: '+% physical damage, attacks cannot be interrupted',
    sources: [
      { name: 'Pride', base: 'polearm / spear', min: 16, max: 20, carriers: { N: '2H', A2: true, G: true }, slot: 'weapon' },
      { name: 'Mist', base: 'bow / crossbow', min: 8, max: 12, carriers: { N: '2H', R: true }, slot: 'weapon' }
    ]
  },
  {
    key: 'fana', name: 'Fanaticism', summary: '+% damage, +% attack rating and faster attacks',
    sources: [
      { name: 'Faith', base: 'bow / crossbow', min: 12, max: 15, carriers: { N: '2H', R: true }, slot: 'weapon' },
      { name: 'Beast', base: 'axe / hammer / scepter', min: 9, max: 9, carriers: { N: true, G: true }, slot: 'weapon' },
      { name: 'Mania', base: 'any weapon', min: 1, max: 1, carriers: { N: true, R: true, A2: true, G: true }, slot: 'weapon' }
    ]
  },
  {
    key: 'conv', name: 'Conviction', summary: 'lowers monster defense and elemental resistances',
    sources: [
      { name: 'Infinity', base: 'polearm / spear', min: 12, max: 12, carriers: { N: '2H', A2: true, G: true }, slot: 'weapon' }
    ]
  },
  {
    key: 'how', name: 'Heart of Wolverine', summary: '+% damage and +% attack rating (Druid spirit)',
    sources: [
      { name: 'Wisp Projector', base: 'ring, charges', min: 5, max: 5, carriers: { N: true }, slot: 'ring' }
    ]
  },
  {
    key: 'thorns', name: 'Thorns', summary: 'reflects melee damage back to attackers',
    sources: [
      { name: 'Bramble', base: 'body armor', min: 15, max: 21, carriers: { N: true, R: true, A2: true, G: true }, slot: 'armor' },
      { name: 'Edge', base: 'bow / crossbow', min: 15, max: 15, carriers: { N: '2H', R: true }, slot: 'weapon' }
    ]
  },
  {
    key: 'is', name: 'Inner Sight', summary: 'lowers monster defense (Rogue skill)',
    sources: [
      { name: 'Inner Sight', base: 'Rogue skill, tooltip level', min: 1, max: 60, pick: 32, carriers: { R: true }, slot: 'skill' }
    ]
  }
];

// Monster data: Hell difficulty, native monster level. Source: Diablo Wiki monster pages
// (data from LoD 1.11). elem = expected elemental damage per hit (chance × average, poison
// left out because it only counts once per target). res = [physical, fire, cold, lightning].
export interface Monster {
  id: string;
  name: string;
  where: string;
  type: 'melee' | 'ranged';
  lvl: number;
  def: number;
  ar: number;
  min: number;
  max: number;
  pick?: number;         // level set when the source is clicked (default: max); for skills and merc auras a typical high value
  elem: number;
  elemNote: string;
  res: [number, number, number, number];
  source: string;
}

const WIKI = 'https://diablo2.diablowiki.net/';
export const MONSTERS: Monster[] = [
  { id: 'std', name: 'Model monster', where: 'reference values', type: 'melee', lvl: 85, def: 2000, ar: 5929, min: 102, max: 102, elem: 0, elemNote: '–', res: [0, 0, 0, 0], source: '' },
  { id: 'doomkn', name: 'Doom Knight', where: 'Chaos Sanctuary', type: 'melee', lvl: 82, def: 1837, ar: 5929, min: 65, max: 139, elem: 0.6 * 41, elemNote: '60% chance of 27–55 fire/cold/lightning/magic', res: [33, 110, 20, 20], source: WIKI + 'Doom_Knight' },
  { id: 'venom', name: 'Venom Lord', where: 'Chaos Sanctuary', type: 'melee', lvl: 85, def: 1898, ar: 5452, min: 96, max: 153, elem: 0, elemNote: 'Inferno breath (not counted)', res: [50, 130, 50, 75], source: WIKI + 'Venom_Lord' },
  { id: 'deathl', name: 'Death Lord', where: 'Worldstone Keep 3', type: 'melee', lvl: 85, def: 2146, ar: 6134, min: 76, max: 115, elem: 0.33 * 71.5, elemNote: '33% chance of 67–76 fire', res: [66, 120, 33, 33], source: WIKI + 'Blood_Lord' },
  { id: 'flesharc', name: 'Flesh Archer', where: 'Kurast temples (Act 3)', type: 'ranged', lvl: 85, def: 1485, ar: 5112, min: 57, max: 86, elem: 0, elemNote: '–', res: [15, 25, 130, 25], source: WIKI + 'Vile_Archer' },
  { id: 'horrarc', name: 'Horror Archer', where: 'Abaddon (Act 5)', type: 'ranged', lvl: 85, def: 1651, ar: 3919, min: 32, max: 46, elem: 0.8 * 60, elemNote: 'random element 46–74 per hit', res: [33, 66, 66, 66], source: WIKI + 'Skeleton_Archer' },
  { id: 'hellsl', name: 'Hell Slinger', where: 'Canyon of the Magi (Act 2)', type: 'ranged', lvl: 80, def: 1484, ar: 4666, min: 45, max: 77, elem: 0.15 * 52, elemNote: '15% chance of 36–68 fire', res: [10, 105, 0, 0], source: WIKI + 'Slinger' }
];
export const monsterById = (id: string): Monster | undefined => MONSTERS.find(m => m.id === id);

export const DIABLO = { lvl: 94, def: 2154, ar: 8062, res: [45, 50, 50, 50] as [number, number, number, number], dmg: 213.5, aps: 0.5 * 0.33 };

// Flat DPS values for the Iron Golem by item (with Amplify Damage, without Might).

/** Hell defense by monster level (monlvl.txt, column L-AC(H)), index = level − 1. Summons add it to their own base. */
export const MONLVL_DEF_HELL = [173,190,208,226,243,261,278,296,314,331,349,366,384,402,419,437,454,472,490,507,525,542,560,578,595,613,630,648,666,683,701,718,736,754,771,789,806,824,842,859,877,894,912,930,947,965,982,1000,1018,1035,1053,1070,1088,1106,1123,1141,1158,1176,1194,1211,1229,1246,1264,1282,1299,1317,1334,1352,1370,1387,1405,1422,1440,1458,1475,1493,1510,1528,1546,1563,1581,1598,1616,1634,1651,1669,1686,1704,1722,1739,1757,1774,1792,1810,1827,1845,1862,1880,1898];
export const monlvlDef = (lvl: number) => MONLVL_DEF_HELL[Math.max(1, Math.min(99, Math.round(lvl))) - 1];

/** Hell attack rating by monster level (monlvl.txt, column L-TH(H)), index = level − 1. */
export const MONLVL_AR_HELL = [216,254,292,330,368,406,444,482,520,558,596,634,672,710,748,786,824,862,900,938,976,1014,1052,1090,1128,1166,1204,1242,1280,1318,1356,1394,1432,1470,1508,1546,1584,1622,1660,1698,1736,1774,1812,1850,1888,1926,1964,2002,2040,2078,2116,2154,2192,2230,2268,2306,2344,2382,2420,2458,2496,2534,2572,2610,2648,2686,2724,2762,2800,2838,2876,2914,2952,2990,3028,3066,3104,3142,3180,3218,3256,3294,3332,3370,3408,3446,3484,3522,3560,3598,3636,3674,3712,3750,3788,3826,3864,3902,3940];
export const monlvlAr = (lvl: number) => MONLVL_AR_HELL[Math.max(1, Math.min(99, Math.round(lvl))) - 1];

// ---- Golems (Hell). Damage and AR base from monstats.txt/skills.txt (game data), frames per attack
// by EIAS and the 15-frame AI delay from the Basin Wiki golem pages. ----
export type GolemType = 'iron' | 'clay' | 'blood' | 'fire' | 'none';
export interface GolemInfo {
  name: string;
  dmg: [number, number];          // Hell physical base damage (attack 1)
  ar: number;                     // Hell attack rating base, added to the monster-level table
  dmgPerLvl: number;              // own +% damage per skill level above 1
  arPerLvl: number;               // own +AR per skill level (Clay Golem)
  frames: [number, number][];     // [EIAS, frames per attack], ascending EIAS
  wearsItem: boolean;
  note: string;
}
export const GOLEMS: Record<Exclude<GolemType, 'none'>, GolemInfo> = {
  iron: { name: 'Iron Golem', dmg: [12, 33], ar: 197, dmgPerLvl: 0, arPerLvl: 0, wearsItem: true,
    frames: [[-20, 20], [-19, 19], [-15, 18], [-10, 17], [-5, 16], [0, 15], [8, 14], [15, 13], [24, 12], [34, 11], [46, 10], [61, 9]],
    note: 'Made from a metal item and takes over its aura, damage and attack speed. The item is lost when the golem dies.' },
  clay: { name: 'Clay Golem', dmg: [3, 7], ar: 92, dmgPerLvl: 35, arPerLvl: 20, wearsItem: false,
    frames: [[0, 17], [4, 16], [11, 15], [19, 14], [27, 13], [37, 12]],
    note: 'Slows enemies it hits and enemies that hit it in melee. 25% physical damage reduction. Almost no damage of its own.' },
  blood: { name: 'Blood Golem', dmg: [12, 33], ar: 148, dmgPerLvl: 55, arPerLvl: 0, wearsItem: false,
    frames: [[0, 15], [8, 14], [15, 13], [24, 12], [34, 11]],
    note: 'Shares stolen life and the damage it takes with you.' },
  fire: { name: 'Fire Golem', dmg: [18, 47], ar: 298, dmgPerLvl: 0, arPerLvl: 0, wearsItem: false,
    frames: [[0, 16], [7, 15], [14, 14], [22, 13], [31, 12]],
    note: 'Fire damage on every hit and a Holy Fire burst when summoned and when it dies (not counted). Absorbs fire.' }
};

/** Fire Golem fire damage per hit by skill level (d2emu, values since patch 2.4), linear between the listed levels. */
const FIRE_GOLEM_FIRE: [number, number, number][] = [[1, 34, 81], [10, 213, 299], [20, 509, 635], [30, 863, 1029], [40, 1196, 1395]];
export function fireGolemFire(lvl: number): number {
  const t = FIRE_GOLEM_FIRE;
  if (lvl <= t[0][0]) return (t[0][1] + t[0][2]) / 2;
  for (let i = 1; i < t.length; i++) if (lvl <= t[i][0]) {
    const [l0, a0, b0] = t[i - 1], [l1, a1, b1] = t[i], f = (lvl - l0) / (l1 - l0);
    return ((a0 + f * (a1 - a0)) + (b0 + f * (b1 - b0))) / 2;
  }
  const [l0, a0, b0] = t[t.length - 2], [l1, a1, b1] = t[t.length - 1], f = (lvl - l0) / (l1 - l0);
  return ((a0 + f * (a1 - a0)) + (b0 + f * (b1 - b0))) / 2;
}

/** Runewords an Iron Golem can wear (runes.txt + rune weapon bonuses from gems.txt, best rolls). */
export interface GolemItem { name: string; aura: string; ed: number; ias: number; ds: number; ar: number; elem: number; weapon: boolean; bases: string; base: string }
export const GOLEM_ITEMS: Record<string, GolemItem> = {
  mania: { name: 'Mania', aura: 'Fanaticism 1', ed: 200, ias: 30, ds: 0, ar: 0, elem: 0, weapon: true, bases: 'any weapon, 3 sockets', base: '7wa' },
  beast: { name: 'Beast', aura: 'Fanaticism 9', ed: 270, ias: 40, ds: 0, ar: 0, elem: 0, weapon: true, bases: 'axe, scepter or hammer, 5 sockets', base: '7wa' },
  pride: { name: 'Pride', aura: 'Concentration 16–20', ed: 0, ias: 0, ds: 20, ar: 300, elem: 165, weapon: true, bases: 'polearm or spear, 4 sockets', base: '7pa' },
  lastwish: { name: 'Last Wish', aura: 'Might 17', ed: 375, ias: 0, ds: 0, ar: 0, elem: 0, weapon: true, bases: 'sword, axe or hammer, 6 sockets', base: '7cr' },
  infinity: { name: 'Infinity', aura: 'Conviction 12', ed: 325, ias: 0, ds: 0, ar: 0, elem: 0, weapon: true, bases: 'polearm or spear, 4 sockets', base: '7pa' },
  bramble: { name: 'Bramble', aura: 'Thorns 15–21', ed: 0, ias: 0, ds: 0, ar: 0, elem: 0, weapon: false, bases: 'body armor (metal), 4 sockets', base: '' },
  none: { name: 'Plain weapon', aura: '–', ed: 0, ias: 0, ds: 0, ar: 0, elem: 0, weapon: true, bases: 'any metal weapon', base: '7wa' }
};
