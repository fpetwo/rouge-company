// HTML rendering for the calculator. Pure string functions: the build pre-renders the
// full calculator with default values (crawlable numbers, no layout shift), and the
// browser re-renders only the result regions on every input change.
import { calculate, type Result } from '../core/calc.ts';
import { AURAS, CARRIER_NAMES, GOLEM_ITEMS, GOLEMS, MONSTERS, type Carrier } from '../core/data.ts';
import { GOLEM_BASES } from '../core/golem-bases.ts';
import { findFit } from '../core/fit.ts';
import * as F from '../core/formulas.ts';
import { BUILD_VARIANTS, golemItemPatch, matchVariant, type State } from '../core/state.ts';

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
export const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
const pct = (n: number) => `${Math.round(n * 100)}%`;
const yd = (r: number) => { const w = Math.floor(r), f = r - w; return `${w}${f > 0.6 ? '⅔' : f > 0.3 ? '⅓' : ''} yd`; };

const num = (key: keyof State, s: State, attrs = '') =>
  `<input type="number" inputmode="decimal" id="f-${key}" data-key="${key}" value="${s[key]}" ${attrs}>`;
const chk = (key: keyof State, s: State) =>
  `<input type="checkbox" id="f-${key}" data-key="${key}"${s[key] ? ' checked' : ''}>`;

let tipCounter = 0;
function tip(title: string, html: string): string {
  const id = `tip-${++tipCounter}`;
  return `<button type="button" class="info" popovertarget="${id}" aria-label="More about ${esc(title)}">i</button>` +
    `<div id="${id}" popover class="tip" role="note"><strong>${esc(title)}</strong>${html}<button type="button" class="tip-close" popovertarget="${id}" popovertargetaction="hide" aria-label="Close">×</button></div>`;
}

function monsterSelect(key: keyof State, s: State, type: 'melee' | 'ranged'): string {
  const opts = [`<option value="">— none —</option>`].concat(
    MONSTERS.filter(m => m.type === type || m.id === 'std').map(m =>
      `<option value="${m.id}"${s[key] === m.id ? ' selected' : ''}>${esc(m.name)}${m.id === 'std' ? '' : ` · ${esc(m.where)}`}</option>`));
  return `<select id="f-${key}" data-key="${key}" aria-label="${type} monster">${opts.join('')}</select>`;
}

function carrierChips(c: Partial<Record<Carrier, true | '1H' | '2H'>>): string {
  return (['N', 'R', 'A2', 'G'] as Carrier[]).map(k => {
    const v = c[k];
    return `<span class="chip ${v ? 'ok' : 'no'}" title="${CARRIER_NAMES[k]}: ${v ? (v === '2H' ? 'yes, two-handed (no shield)' : 'yes') : 'no'}">${k}${v === '2H' ? ' 2H' : ''}</span>`;
  }).join('');
}

// ---------------- dynamic regions ----------------

export function renderRegions(s: State): Record<string, string> {
  const r = calculate(s);
  return {
    kpis: kpis(s, r),
    results: resultTable(r),
    unit: unitTable(r),
    skills: skillsNote(s, r),
    auras: activeAuras(s),
    fit: fitBox(s),
    revives: reviveTable(r),
    pack: packTable(r),
    golem: golemInfo(s, r),
    merc: r.merc === 'act2' ? '<p class="note">Merc: Act 2 Offensive merc (from the gear check). His own attacks are not counted, only his Might aura and the auras of his items.</p>' : '',
    dock: `<a href="#h-result" class="dock-in"><span class="dock-l">Army DPS</span><span><span class="dock-k">pack</span> <b>${fmt(r.totalPack)}</b></span><span><span class="dock-k">Diablo</span> <b>${fmt(r.totalDiablo)}</b></span></a>`
  };
}

function kpis(s: State, r: Result): string {
  const packText = r.pack.map(t => `${t.n} × ${esc(t.monster.name)}`).join(' + ') || 'no enemies selected';
  return `<div class="kpis"><div class="kpi"><span class="kpi-l">vs. enemy pack</span><span class="kpi-v">${fmt(r.totalPack)}</span><span class="kpi-s">${packText}</span></div>` +
    `<div class="kpi"><span class="kpi-l">vs. Diablo (Hell)</span><span class="kpi-v">${fmt(r.totalDiablo)}</span><span class="kpi-s">${s.ampOn ? 'with' : 'without'} Amplify Damage</span></div></div>`;
}

function resultTable(r: Result): string {
  const rows = r.rows.filter(x => x.pack || x.diablo)
    .map(x => `<tr><th scope="row">${esc(x.label)}</th><td>${fmt(x.pack)}</td><td>${fmt(x.diablo)}</td></tr>`).join('');
  return `<table class="num"><caption class="sr">Damage per second by source</caption><thead><tr><th scope="col">Source</th><th scope="col">Pack</th><th scope="col">Diablo</th></tr></thead><tbody>${rows}</tbody>` +
    `<tfoot><tr><th scope="row">Total DPS</th><td>${fmt(r.totalPack)}</td><td>${fmt(r.totalDiablo)}</td></tr></tfoot></table>`;
}

function unitTable(r: Result): string {
  const k = r.skeleton, m = r.mage;
  const rows: [string, string, string][] = [
    ['Skeleton +% damage', `${Math.round(k.percent)}%`, `${Math.round(k.percent)}%`],
    ['Damage per hit (before resist)', fmt(k.damage), fmt(k.damage)],
    ['Attack rating', fmt(k.ar), fmt(k.ar)],
    ['Chance to hit', pct(k.hitPack), pct(k.hitDiablo)],
    ['Attack frames (+ 15 AI delay)', `${k.frames}`, `${k.frames}`],
    ['DPS per skeleton', fmt(k.dpsPack), fmt(k.dpsDiablo)],
    [`Mage missile lvl ${r.missileLevel}: fire / lightning / cold`, `${fmt(m.fire)} / ${fmt(m.light)} / ${fmt(m.cold)}`, ''],
    ['DPS per mage', fmt(m.dpsPack), fmt(m.dpsDiablo)]
  ];
  return `<table class="num"><thead><tr><th scope="col">Per minion</th><th scope="col">Pack</th><th scope="col">Diablo</th></tr></thead><tbody>` +
    rows.map(x => `<tr><th scope="row">${x[0]}</th><td>${x[1]}</td><td>${x[2]}</td></tr>`).join('') + `</tbody></table>`;
}

function skillsNote(s: State, r: Result): string {
  const c = r.counts;
  const lost = (a: number, b: number) => (a > b ? ` <span class="warn">(−${a - b} after swap)</span>` : '');
  return `<p class="derived">Skeletons <b>${c.skeletons}</b>${lost(c.skeletonsSummoned, c.skeletons)} · Mages <b>${c.mages}</b>${lost(c.magesSummoned, c.mages)} · Revives max <b>${c.revivesMax}</b>${lost(s.revS, c.revivesMax)} · Mage missile level <b>${r.missileLevel}</b></p>`;
}

function activeAuras(s: State): string {
  const rows: string[] = [];
  const add = (name: string, r: string, eff: string) => rows.push(`<tr><th scope="row">${name}</th><td>${r}</td><td class="eff">${eff}</td></tr>`);
  if (s.mightOn) add(`Might ${s.mightL}`, yd(F.radius.standard(s.mightL)), `+${F.mightDamage(s.mightL)}% damage`);
  if (s.conOn) add(`Concentration ${s.conL}`, yd(F.radius.standard(s.conL)), `+${F.conDamage(s.conL)}% damage`);
  if (s.fanaOn) add(`Fanaticism ${s.fanaL}`, yd(F.radius.fana(s.fanaL)), `+${F.fanaDamage(s.fanaL)}% damage, +${F.fanaAr(s.fanaL)}% AR, +${F.fanaSpeed(s.fanaL)} attack speed`);
  if (s.convOn) add(`Conviction ${s.convL}`, yd(F.radius.conv()), `−${F.convDefense(s.convL)}% defense, −${F.convResist(s.convL)}% elemental resist`);
  if (s.howOn) add(`Heart of Wolverine ${s.howL}`, yd(F.radius.how(s.howL)), `+${F.howDamage(s.howL)}% damage, +${F.howAr(s.howL)}% AR`);
  if (s.thornsOn) add(`Thorns ${s.thornsL}`, yd(F.radius.standard(s.thornsL)), `${F.thornsPercent(s.thornsL)}% melee damage returned + ${F.thornsFlat(s.thornsL)} per swing`);
  if (s.isOn) add(`Inner Sight ${s.isL}`, yd(F.radius.innerSight()), `−${F.innerSightDefense(s.isL)} monster defense`);
  if (s.ampOn) add('Amplify Damage', '–', '−100% physical resist');
  return rows.length ? `<table class="num auras"><thead><tr><th scope="col">Active</th><th scope="col">Radius</th><th scope="col">Effect</th></tr></thead><tbody>${rows.join('')}</tbody></table>` : '<p class="muted">No auras selected.</p>';
}

const AURA_NAMES: Record<string, string> = { might: 'Might', con: 'Concentration', fana: 'Fanaticism', conv: 'Conviction', thorns: 'Thorns', is: 'Inner Sight' };

function fitBox(s: State): string {
  const f = findFit(s);
  if (!f) {
    // Offer one-click fixes: give the Iron Golem another runeword, or drop one aura.
    const fixes: string[] = [];
    const ironWith = (rw: string) => findFit({ ...s, golemType: 'iron', ...golemItemPatch(rw, s.gBase) });
    for (const rw of ['mania', 'beast', 'pride', 'lastwish', 'infinity', 'bramble']) {
      if ((s.golemType !== 'iron' || rw !== s.gRw) && ironWith(rw))
        fixes.push(`<button type="button" class="btn ghost fix" data-fix-golem="${rw}">Iron Golem with ${esc(GOLEM_ITEMS[rw].name)}</button>`);
    }
    for (const k of Object.keys(AURA_NAMES)) {
      if (s[`${k}On` as keyof State] && findFit({ ...s, [`${k}On`]: false }))
        fixes.push(`<button type="button" class="btn ghost fix" data-fix-off="${k}">Uncheck ${AURA_NAMES[k]}</button>`);
    }
    const why = s.golemType !== 'iron' && s.golemType !== 'none'
      ? `A ${esc(GOLEMS[s.golemType].name)} cannot wear an item, so the golem's aura slot is gone. `
      : s.golemType === 'none' ? 'Without a golem there is no golem aura slot. '
      : `The Iron Golem wears ${esc(GOLEM_ITEMS[s.gRw]?.name ?? 'no aura item')} (section 3). `;
    return `<p class="fit bad"><b>✗ Not possible with single items.</b> ${why}No gear assignment gives all checked auras at these levels.</p>` +
      (fixes.length ? `<p class="fixes">${fixes.join('')}</p>` : '<p class="note">Uncheck an aura, use a level inside an item\'s range, or load a preset.</p>');
  }
  const parts: string[] = [];
  const necro = [...f.necro, s.howOn ? 'Wisp Projector' : '', s.ampOn ? 'Amplify Damage' : ''].filter(Boolean);
  if (necro.length) parts.push(`Necro: ${necro.join(' + ')}`);
  parts.push(`${f.merc === 'rogue' ? 'Rogue' : 'Act 2 merc'}${f.merc_items.length ? ': ' + f.merc_items.join(' + ') : ''}`);
  if (s.golemType === 'iron') parts.push(`Iron Golem: ${GOLEM_ITEMS[s.gRw]?.name ?? 'plain weapon'}`);
  else if (s.golemType !== 'none') parts.push(`${GOLEMS[s.golemType].name} (no item)`);
  const notes: string[] = [];
  const wand = f.necro.find(x => !x.endsWith('(armor)') && x !== 'Last Wish');
  if (wand) notes.push(`The Necro has to wield ${esc(wand.replace(' (2H)', ''))} instead of his +skill weapon${wand.includes('2H') ? ' and shield' : ''}. Summon first, then swap, or your minion levels drop.`);
  if (s.golemType !== 'iron') notes.push(`No golem aura slot: a ${s.golemType === 'none' ? 'missing golem' : esc(GOLEMS[s.golemType].name)} carries no item, so ${esc(GOLEM_ITEMS[s.gRw]?.name ?? 'the golem item')} is not on the golem.`);
  return `<p class="fit ok"><b>✓ Possible.</b> For example ${esc(parts.join(' · '))}.</p>` + (notes.length ? `<p class="fit warn-note">${notes.join(' ')}</p>` : '');
}

function golemInfo(s: State, r: Result): string {
  const g = r.golem;
  if (!g) return '<p class="derived">No golem.</p>';
  const info = GOLEMS[s.golemType as Exclude<State['golemType'], 'none'>];
  const bits = [`DPS <b>${fmt(g.dpsPack)}</b> vs. pack · <b>${fmt(g.dpsDiablo)}</b> vs. Diablo`,
    `${fmt(g.phys)} physical${g.elem ? ` + ${fmt(g.elem)} ${g.elemType}` : ''} per hit (+${fmt(g.percent)}% damage)`,
    `${g.frames} + 15 frames per attack (EIAS ${g.eias})`, `AR ${fmt(g.ar)}, hits ${pct(g.hitPack)} / ${pct(g.hitDiablo)}`];
  if (g.slow) bits.push(`slows enemies by <b>${g.slow}%</b>`);
  const warn: string[] = [];
  if (g.weaponNote) warn.push(`Weapon: ${esc(g.weaponNote)}.`);
  if (s.golemType === 'fire' && r.pack.some(t => t.monster.res[1] >= 100)) warn.push('Fire-immune monsters in your pack take only its physical damage.');
  return `<p class="derived">${bits.join(' · ')}</p><p class="note">${esc(info.note)} ${warn.join(' ')}</p>`;
}

function reviveTable(r: Result): string {
  const c = r.counts;
  const head = `<p class="note">Selected <b>${c.revivesWanted}</b> · allowed by Revive level <b>${c.revivesMax}</b>${c.revivesCounted < c.revivesWanted ? ` <span class="warn">→ only ${c.revivesCounted} count</span>` : ''}</p>`;
  if (!r.revives.length) return head;
  return head + `<div class="scroll"><table class="num small"><thead><tr><th scope="col">Revive</th><th scope="col">Lvl</th><th scope="col">AR*</th><th scope="col">Phys dmg*</th><th scope="col">+ Elem</th><th scope="col">DPS vs. pack</th><th scope="col">vs. Diablo</th></tr></thead><tbody>` +
    r.revives.map(u => `<tr><th scope="row">${esc(u.m.name)}</th><td>${u.m.lvl}</td><td>${fmt(u.ar)}</td><td>${fmt(u.dmg)}</td><td>${fmt(u.m.elem)}</td><td>${fmt(u.pack)}</td><td>${fmt(u.diablo)}</td></tr>`).join('') +
    `</tbody></table></div><p class="note">* after your auras. Values per revive.</p>`;
}

function packTable(r: Result): string {
  if (!r.pack.length) return '<p class="muted">No enemies selected.</p>';
  return `<div class="scroll"><table class="num small"><thead><tr><th scope="col">Enemy</th><th scope="col">Lvl</th><th scope="col">Defense</th><th scope="col">Phys res</th><th scope="col">Fire / Cold / Light</th><th scope="col">Melee dmg</th><th scope="col">Hits your minions</th></tr></thead><tbody>` +
    r.pack.map(t => `<tr><th scope="row">${t.n} × ${esc(t.monster.name)}</th><td>${t.monster.lvl}</td><td>${fmt(t.monster.def)}</td><td>${t.monster.res[0]}%</td><td>${t.monster.res[1]} / ${t.monster.res[2]} / ${t.monster.res[3]}%</td><td>${t.melee ? `${t.monster.min}–${t.monster.max}` : 'ranged'}</td><td>${pct(t.hitsMinions)}</td></tr>`).join('') +
    `</tbody></table></div><p class="note">Hit chance is calculated from each enemy's attack rating and level against your minions' defense (skeletons ${fmt(r.minionDefense.skeleton)}, mages ${fmt(r.minionDefense.mage)}, revives their own), weighted by how many of each you have. Diablo: ${pct(r.diabloHitsMinions)}.</p>`;
}

const region = (id: string, html: string, live = false) => `<div data-region="${id}"${live ? ' aria-live="polite"' : ''}>${html}</div>`;

// ---------------- full calculator markup ----------------

export function renderCalculator(s: State): string {
  tipCounter = 0;
  const R = renderRegions(s);

  const active = matchVariant(s);
  const activeV = BUILD_VARIANTS.find(v => v.id === active?.id);
  const variants = BUILD_VARIANTS.map(v =>
    `<button type="button" class="variant" data-variant="${v.id}" data-beast="${v.beast ? 1 : 0}" aria-pressed="${v.id === active?.id}" title="${esc(v.summary)}">${esc(v.name)}</button>`).join('');
  const beastOn = Boolean(activeV?.beast);

  const skillRow = (label: string, hint: string, a: keyof State, b?: keyof State, noB = '–') =>
    `<tr><th scope="row"><label for="f-${a}">${label}</label><span class="hint">${hint}</span></th><td>${num(a, s, 'min="0" max="99"')}</td><td>${b ? num(b, s, 'min="0" max="99" aria-label="' + label + ' during play"') : `<span class="hint">${noB}</span>`}</td></tr>`;

  const auraRows = AURAS.map(a => {
    const lines = a.sources.map(src => {
      const lv = src.pick ?? src.max;
      const what = src.pick ? `level ${lv}` : src.min === src.max ? `level ${lv}` : `level ${lv}, the best roll (${src.min}–${src.max})`;
      const on = s[`${a.key}On` as keyof State] && s[`${a.key}L` as keyof State] === lv;
      return `<span class="src"><button type="button" class="src-n src-pick" data-aura="${a.key}" data-lvl="${lv}" aria-pressed="${Boolean(on)}" title="Set ${esc(a.name)} to ${what} – ${esc(src.name)}">${esc(src.name)} <span class="src-lv">${lv}</span></button> <span class="src-b">${esc(src.base)}</span>${carrierChips(src.carriers)}</span>`;
    }).join('');
    return `<tr><th scope="row"><label class="chk">${chk(`${a.key}On` as keyof State, s)}<span><span class="aura-n">${a.name}</span>${lines}</span></label></th><td>${num(`${a.key}L` as keyof State, s, `min="1" max="60" aria-label="${a.name} level"`)}</td></tr>`;
  }).join('') + `<tr><th scope="row"><label class="chk">${chk('ampOn', s)}<span><span class="aura-n">Amplify Damage</span><span class="src"><span class="src-n">Necro curse</span> <span class="src-b">−100% physical resist</span>${carrierChips({ N: true })}</span></span></label></th><td></td></tr>`;

  return `
<div class="calc" id="calculator">
  <div class="calc-main">
    <section class="card" aria-labelledby="h-variants">
      <h2 id="h-variants">Presets ${tip('Presets', '<p>Each preset is a complete, wearable setup: it sets skill levels, auras and the Iron Golem. Your enemy pack and revive selection stay as they are, so you can compare presets against the same monsters.</p><p><b>Low budget</b> – Mist and Bramble with low rolls, Mania golem.<br><b>Rogue Company</b> – the Rogue at maximum aura rolls, Mania golem.<br><b>Desert Storm</b> – Act 2 Offensive merc with Might, Pride and Bramble, Beast golem.<br><b>Max Auras</b> – Last Wish swap, Faith Rogue, Pride golem and 25 revives.</p><p><b>Beast mode</b> gives the Iron Golem Beast (Fanaticism 9) instead of Mania (Fanaticism 1). It only exists for the two presets that use Mania; the other two already use Beast or Pride.</p><p>Gear lists: <a href="/guide/presets/">presets guide</a>.</p>')}</h2>
      <div class="variants">${variants}</div>
      <label class="chk beast" id="beast-wrap"><input type="checkbox" id="beast"${active?.beast ? ' checked' : ''}${beastOn ? '' : ' disabled'}><span><b>Beast mode</b> <span class="hint" id="beast-hint">Iron Golem wears Beast (Fanaticism 9) instead of Mania. Only for Low budget and Rogue Company.</span></span></label>
      <p class="note">Pick a preset, then adjust anything below. The link in your address bar always contains your current setup.</p>
    </section>

    <section class="card" aria-labelledby="h-skills">
      <h2 id="h-skills">1 · Skills ${tip('Skills on summoning vs. during play', '<p><b>On summoning</b> is your skill level while you cast, including all +skills from gear and Battle Command. Damage, attack rating and mage missile level are fixed at that moment and kept until the minion dies.</p><p><b>During play</b> is your level after swapping gear, for example from Arm of King Leoric to Last Wish. Only the minion limit follows this value; minions above the new limit disappear.</p><p>Skeleton Mastery and character level have no "during play" value: they only change minion stats, and those are kept from the moment of summoning. Swapping Mastery gear after summoning does nothing to the minions already standing.</p><p>Skeletons and mages: level 1–3 gives that many, from level 4 it is 2 + ⌊level/3⌋. Revive: one monster per level.</p>')}</h2>
      <table class="form-table"><thead><tr><th scope="col">Skill level incl. +skills</th><th scope="col">On summoning <span class="hint">pre-buff</span></th><th scope="col">During play <span class="hint">after swap</span></th></tr></thead><tbody>
        ${skillRow('Raise Skeleton', 'damage, AR, count', 'rsS', 'rsP')}
        ${skillRow('Skeleton Mastery', 'damage, defense, mage missile level', 'smS', undefined, 'kept from summoning')}
        ${skillRow('Raise Skeletal Mage', 'mage damage, count', 'rsmS', 'rsmP')}
        ${skillRow('Revive', 'count', 'revS', 'revP')}
        ${skillRow('Character level', 'hit chance, minion level', 'clvl', undefined, 'kept from summoning')}
      </tbody></table>
      ${region('skills', R.skills)}
    </section>

    <section class="card" aria-labelledby="h-auras">
      <h2 id="h-auras">2 · Auras &amp; buffs ${tip('How auras work here', '<p>Aura levels from items never increase with +skills; only the Act 2 merc\'s own aura does.</p><p>The same aura from two items on <b>one</b> carrier adds up (Edge + Bramble on the Rogue = Thorns 36). The same aura from <b>different</b> carriers does not stack; only the highest level counts.</p><p>The calculator assumes every minion stands inside every aura radius. Small radii, like Fanaticism at about 17 yards around a Rogue, miss part of a big army in practice.</p>')}</h2>
      <div class="callout">
        <p><b>You cannot run every aura at once.</b> Each aura comes from an item or skill, and slots are limited: the Necromancer has one weapon (two-handed costs the shield), you hire either a Rogue (bow + armor) <em>or</em> an Act 2 merc (polearm + armor), and the Iron Golem takes one item. The presets above are valid combinations.</p>
        ${region('fit', R.fit, true)}
      </div>
      <p class="legend"><b>Click an item</b> to switch the aura on at that item&#39;s best level (the number shown). Who can carry the source: ${carrierChips({ N: true, R: true, A2: true, G: true })} = Necromancer, Rogue, Act 2 merc, Iron Golem · <span class="chip no">struck</span> = not possible · 2H = two-handed</p>
      <table class="form-table auras-in"><thead><tr><th scope="col">Aura and sources</th><th scope="col">Level</th></tr></thead><tbody>${auraRows}</tbody></table>
      ${region('auras', R.auras)}
    </section>

    <section class="card" aria-labelledby="h-other">
      <h2 id="h-other">3 · Golem &amp; Rogue ${tip('Golems', '<p>Only the <b>Iron Golem</b> can wear an item, so only he adds an aura (section 2). Clay, Blood and Fire Golem free you from risking an item, but their aura slot is gone.</p><p>Golem damage is calculated from the game data: base damage, the weapon\'s one-hand damage with the item\'s enhanced damage, plus all your auras on top. Two-handed weapon damage does not transfer to the Iron Golem. Golems attack with a 15-frame pause between attacks (Basin Wiki).</p><p><b>Synergies</b> only count hard skill points (no +skills): Fire Golem +6% golem damage, Clay Golem +20 AR, Blood Golem +5% life, Iron Golem +35 defense per point.</p>')}</h2>
      <div class="grid">
        <label>Golem<select id="f-golemType" data-key="golemType">${(['iron', 'clay', 'blood', 'fire', 'none'] as const).map(t => `<option value="${t}"${s.golemType === t ? ' selected' : ''}>${t === 'none' ? 'No golem' : GOLEMS[t].name}</option>`).join('')}</select></label>
        <label>Golem skill level<span class="hint">on summoning, incl. +skills</span>${num('golemLvl', s, 'min="1" max="60"')}</label>
        <label>Golem Mastery level<span class="hint">on summoning, incl. +skills</span>${num('gmLvl', s, 'min="0" max="60"')}</label>
      </div>
      ${region('golem', R.golem)}
      <details class="more" id="d-golem-item"${s.golemType === 'iron' ? '' : ' hidden'}><summary>Golem item: weapon and runeword <span class="hint">Iron Golem only</span></summary>
        <div class="grid">
          <label>Runeword<select id="f-gRw" data-key="gRw">${Object.entries(GOLEM_ITEMS).map(([k, it]) => `<option value="${k}"${s.gRw === k ? ' selected' : ''}>${esc(it.name)}${it.aura !== '–' ? ` (${esc(it.aura)})` : ''}</option>`).join('')}</select></label>
          <label>Base<select id="f-gBase" data-key="gBase"><option value="">— none / armor —</option>${[...new Set(GOLEM_BASES.map(b => b.type))].map(t => `<optgroup label="${t}">${GOLEM_BASES.filter(b => b.type === t).map(b => `<option value="${b.code}"${s.gBase === b.code ? ' selected' : ''}>${esc(b.name)} · ${b.one ? `${b.one[0]}–${b.one[1]}` : '2H only'}</option>`).join('')}</optgroup>`).join('')}</select></label>
          <label>Enhanced damage %<span class="hint">on the weapon damage</span>${num('gEd', s, 'min="0"')}</label>
          <label>Increased attack speed %${num('gIas', s, 'min="0"')}</label>
          <label>Deadly Strike %<span class="hint">double physical damage</span>${num('gDs', s, 'min="0" max="100"')}</label>
          <label>Attack rating %${num('gAr', s, 'min="0"')}</label>
          <label>Lightning damage per hit<span class="hint">average, e.g. Pride 50–280</span>${num('gElem', s, 'min="0"')}</label>
        </div>
        <p class="note">Picking a runeword fills in its best rolls (runes included, e.g. Shael's 20% attack speed in Mania). Crushing Blow, Open Wounds and damage against demons are not counted.</p>
      </details>
      <details class="more" id="d-golem-syn"><summary>Golem synergies <span class="hint">hard skill points only</span></summary>
        <div class="grid">
          <label>Clay Golem points<span class="hint">+20 AR each</span>${num('synClay', s, 'min="0" max="20"')}</label>
          <label>Blood Golem points<span class="hint">+5% life each</span>${num('synBlood', s, 'min="0" max="20"')}</label>
          <label>Iron Golem points<span class="hint">+35 defense each</span>${num('synIron', s, 'min="0" max="20"')}</label>
          <label>Fire Golem points<span class="hint">+6% damage each</span>${num('synFire', s, 'min="0" max="20"')}</label>
        </div>
        <p class="note">Only damage and attack rating change the DPS. Life and defense keep the golem alive but are not part of the result.</p>
      </details>
      <table class="form-table rogue-row" id="rogue-row"${calculate(s).merc === 'rogue' ? '' : ' hidden'}><tbody>
        <tr><th scope="row"><label class="chk">${chk('rogueOn', s)}<span><span class="aura-n">Rogue arrows</span><span class="hint">reference with max gear: vs. pack / vs. Diablo</span></span></label></th><td>${num('rogueS', s, 'min="0" aria-label="Rogue DPS vs. pack"')}</td><td>${num('rogueD', s, 'min="0" aria-label="Rogue DPS vs. Diablo"')}</td></tr>
      </tbody></table>
      ${region('merc', R.merc)}
    </section>

    <section class="card" aria-labelledby="h-revives">
      <h2 id="h-revives">4 · Revives ${tip('How revives are calculated', '<p>The number of revives is capped by your Revive level during play. If you select more, all groups are cut proportionally.</p><p>Each revive uses the monster\'s own Hell stats: level, attack rating and damage. Your auras raise its physical damage and attack rating, Amplify Damage lowers the target\'s physical resist. Elemental add-on damage (for example the Doom Knight\'s random element) is not boosted and is reduced by the target\'s resist.</p><p>Monster attack speed is not part of the game data tables, so swings per second are an assumption you can change.</p>')}</h2>
      <div class="pick"><label for="f-revMelee">Melee</label>${monsterSelect('revMelee', s, 'melee')}${num('revMeleeN', s, 'min="0" aria-label="Number of melee revives"')}</div>
      <div class="pick"><label for="f-revRanged">Ranged</label>${monsterSelect('revRanged', s, 'ranged')}${num('revRangedN', s, 'min="0" aria-label="Number of ranged revives"')}</div>
      <div class="grid">
        <label>Swings/s per melee revive<span class="hint">assumed</span>${num('revMeleeAps', s, 'min="0" step="0.05"')}</label>
        <label>Shots/s per ranged revive<span class="hint">assumed</span>${num('revRangedAps', s, 'min="0" step="0.05"')}</label>
      </div>
      <label class="chk">${chk('revFana', s)}<span>Fanaticism attack speed also applies to revives <span class="hint">unverified</span></span></label>
      ${region('revives', R.revives)}
    </section>

    <section class="card" aria-labelledby="h-pack">
      <h2 id="h-pack">5 · Enemy pack ${tip('Enemy pack', '<p>The army\'s damage is spread over the pack by count. The total is the DPS your whole army deals to the pack.</p><p><b>Swings/s per melee enemy:</b> how often one melee enemy attacks, hit or miss. Thorns\' flat damage triggers on every swing.</p><p><b>Hits your minions:</b> calculated, not assumed. Each enemy\'s attack rating and level are compared with your minions\' defense and level, using the game\'s hit formula (5–95%). Thorns\' percentage part only triggers on hits.</p><p>Monster attack speed is not in the game\'s data tables, so swings per second stays an assumption. Ranged enemies never trigger Thorns.</p>')}</h2>
      <div class="pick"><label for="f-enMelee">Melee</label>${monsterSelect('enMelee', s, 'melee')}${num('enMeleeN', s, 'min="0" aria-label="Number of melee enemies"')}</div>
      <div class="pick"><label for="f-enRanged">Ranged</label>${monsterSelect('enRanged', s, 'ranged')}${num('enRangedN', s, 'min="0" aria-label="Number of ranged enemies"')}</div>
      <div class="grid">
        <label>Swings/s per melee enemy<span class="hint">assumed</span>${num('enAps', s, 'min="0" step="0.05"')}</label>
      </div>
      ${region('pack', R.pack)}
      <p class="note">Diablo (Hell) is fixed: level 94, defense 2,154, physical resist 45%, elemental resists 50%.</p>
    </section>
  </div>

  <aside class="calc-side" aria-label="Results">
    <section class="card sticky" aria-labelledby="h-result">
      <h2 id="h-result">Army DPS ${tip('Result', '<p>Damage per second of the whole army: against the enemy pack (spread over all its monsters) and against Diablo in Hell.</p><p>All minions are assumed to be inside every aura radius and attacking. Read the <a href="/guide/how-it-works/">model guide</a> for every formula and assumption.</p>')}</h2>
      ${region('kpis', R.kpis, true)}
      ${region('results', R.results)}
      <details class="unit"><summary>Per minion values</summary>${region('unit', R.unit)}</details>
      <div class="actions"><button type="button" id="share" class="btn">Copy link to this setup</button><button type="button" id="reset" class="btn ghost">Reset</button></div>
    </section>
  </aside>
  ${region('dock', R.dock)}
</div>`;
}
