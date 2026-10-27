// Generated content blocks used inside the Markdown pages ({{table:...}} placeholders).
// They read the same data the calculator uses, so numbers on the guide pages stay correct.
import { calculate } from '../core/calc.ts';
import { AURAS, CARRIER_NAMES, MONSTERS, type Carrier } from '../core/data.ts';
import * as F from '../core/formulas.ts';
import { applyVariant, BUILD_VARIANTS, DEFAULT_STATE, encodeState } from '../core/state.ts';

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
const yd = (r: number) => `${(Math.round(r * 10) / 10).toString()} yd`;

function carriers(c: Partial<Record<Carrier, true | '1H' | '2H'>>): string {
  return (Object.keys(CARRIER_NAMES) as Carrier[]).filter(k => c[k])
    .map(k => `${CARRIER_NAMES[k]}${c[k] === '2H' ? ' (two-handed)' : ''}`).join(', ');
}

const AURA_RANGE: Record<string, (l: number) => number> = {
  might: F.radius.standard, con: F.radius.standard, thorns: F.radius.standard,
  fana: F.radius.fana, how: F.radius.how, conv: () => F.radius.conv(), is: () => F.radius.innerSight()
};
const AURA_EFFECT: Record<string, (l: number) => string> = {
  might: l => `+${F.mightDamage(l)}% damage`,
  con: l => `+${F.conDamage(l)}% damage`,
  fana: l => `+${F.fanaDamage(l)}% damage, +${F.fanaAr(l)}% AR, +${F.fanaSpeed(l)} attack speed`,
  conv: l => `−${F.convDefense(l)}% defense, −${F.convResist(l)}% elemental resists`,
  how: l => `+${F.howDamage(l)}% damage, +${F.howAr(l)}% AR`,
  thorns: l => `${F.thornsPercent(l)}% melee damage returned + ${F.thornsFlat(l)} per swing`,
  is: l => `−${F.innerSightDefense(l)} defense`
};

export function auraTable(): string {
  const rows: string[] = [];
  for (const a of AURAS) for (const src of a.sources) {
    if (src.slot === 'own' || src.slot === 'skill') continue;
    const lvl = src.min === src.max ? `${src.min}` : `${src.min}–${src.max}`;
    rows.push(`<tr><th scope="row">${a.name}</th><td>${esc(src.name)}</td><td>${esc(src.base)}</td><td>${lvl}</td><td>${yd(AURA_RANGE[a.key](src.max))}</td><td>${AURA_EFFECT[a.key](src.max)}</td><td>${carriers(src.carriers)}</td></tr>`);
  }
  return `<div class="scroll"><table class="data"><caption>Aura sources for a summoner army (effect and radius at the item's highest level)</caption><thead><tr><th scope="col">Aura</th><th scope="col">Item</th><th scope="col">Base</th><th scope="col">Level</th><th scope="col">Radius</th><th scope="col">Effect for minions</th><th scope="col">Who can wear it</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}

export function monsterTable(): string {
  const rows = MONSTERS.filter(m => m.id !== 'std').map(m =>
    `<tr><th scope="row"><a href="${m.source}" rel="nofollow noopener" target="_blank">${esc(m.name)}</a></th><td>${esc(m.where)}</td><td>${m.type}</td><td>${m.lvl}</td><td>${fmt(m.def)}</td><td>${fmt(m.ar)}</td><td>${m.min}–${m.max}</td><td>${esc(m.elemNote)}</td><td>${m.res[0]}%</td><td>${m.res[1]} / ${m.res[2]} / ${m.res[3]}%</td></tr>`).join('');
  return `<div class="scroll"><table class="data"><caption>Hell difficulty values at the monster's native level</caption><thead><tr><th scope="col">Monster</th><th scope="col">Area</th><th scope="col">Type</th><th scope="col">Level</th><th scope="col">Defense</th><th scope="col">Attack rating</th><th scope="col">Physical damage</th><th scope="col">Elemental add-on</th><th scope="col">Phys. resist</th><th scope="col">Fire / Cold / Light</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

export function variantTable(): string {
  const model = { ...DEFAULT_STATE, enMelee: 'std', enMeleeN: 1, enRanged: '', enRangedN: 0, revMeleeN: 0, revRangedN: 0 };
  const real = { ...DEFAULT_STATE, revMeleeN: 0, revRangedN: 0 };
  const rows = BUILD_VARIANTS.flatMap(v => (v.beast ? [false, true] : [false]).map(beast => {
    const m = calculate(applyVariant(model, v.id, { beast }));
    const r = calculate(applyVariant(real, v.id, { beast }));
    const link = `/#${encodeState(applyVariant(DEFAULT_STATE, v.id, { beast }))}`;
    const name = beast ? `${esc(v.name)} + Beast mode` : esc(v.name);
    return `<tr><th scope="row"><a href="${link}">${name}</a></th><td>${fmt(m.totalPack)}</td><td>${fmt(r.totalPack)}</td><td>${fmt(r.totalDiablo)}</td></tr>`;
  })).join('');
  return `<div class="scroll"><table class="data num-right"><caption>Army DPS without revives. "Model monster": one target without resists. "Real pack": 7 Doom Knights + 3 Flesh Archers.</caption><thead><tr><th scope="col">Preset</th><th scope="col">vs. model monster</th><th scope="col">vs. real pack</th><th scope="col">vs. Diablo</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

export function variantDetails(): string {
  return BUILD_VARIANTS.map(v => {
    const link = `/#${encodeState(applyVariant(DEFAULT_STATE, v.id))}`;
    const beast = v.beast ? ` <a class="btn ghost" href="/#${encodeState(applyVariant(DEFAULT_STATE, v.id, { beast: true }))}">Open with Beast mode</a>` : '';
    return `<section class="variant-card" id="${v.id}"><h3>${esc(v.name)}</h3><p>${esc(v.summary)}</p><ul>${v.gear.map(g => `<li>${esc(g)}</li>`).join('')}</ul><p><a class="btn" href="${link}">Open in the calculator</a>${beast}</p></section>`;
  }).join('');
}
