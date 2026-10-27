// Browser entry: hydrates the pre-rendered calculator. No framework, ~small bundle.
import { applyVariant, BUILD_VARIANTS, decodeState, DEFAULT_STATE, encodeState, golemItemPatch, matchVariant, type State } from '../core/state.ts';
import { renderRegions } from './view.ts';

const root = document.getElementById('calculator');
if (root) init(root);

function init(root: HTMLElement) {
  const inputs = Array.from(root.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-key]'));
  const regions = new Map<string, HTMLElement>();
  root.querySelectorAll<HTMLElement>('[data-region]').forEach(el => regions.set(el.dataset.region!, el));

  const read = (): State => {
    const s: State = { ...DEFAULT_STATE };
    for (const el of inputs) {
      const k = el.dataset.key as keyof State;
      const d = DEFAULT_STATE[k];
      if (el instanceof HTMLInputElement && el.type === 'checkbox') (s as any)[k] = el.checked;
      else if (typeof d === 'number') { const n = parseFloat(el.value); (s as any)[k] = Number.isFinite(n) ? n : 0; }
      else (s as any)[k] = el.value;
    }
    return s;
  };

  const write = (s: State) => {
    for (const el of inputs) {
      const v = s[el.dataset.key as keyof State];
      if (el instanceof HTMLInputElement && el.type === 'checkbox') el.checked = Boolean(v);
      else el.value = String(v);
    }
  };

  const syncDisabled = (s: State) => {
    for (const k of ['might', 'con', 'fana', 'conv', 'how', 'thorns', 'is'] as const) {
      const el = root.querySelector<HTMLInputElement>(`#f-${k}L`);
      if (el) el.disabled = !s[`${k}On`];
    }
    const dis = (id: string, off: boolean) => { const el = root.querySelector<HTMLInputElement>(`#f-${id}`); if (el) el.disabled = off; };
    dis('rogueS', !s.rogueOn); dis('rogueD', !s.rogueOn);
    dis('golemLvl', s.golemType === 'none'); dis('gmLvl', s.golemType === 'none');
    for (const k of ['gRw', 'gBase', 'gEd', 'gIas', 'gDs', 'gAr', 'gElem']) dis(k, s.golemType !== 'iron');
    dis('revMeleeN', !s.revMelee); dis('revRangedN', !s.revRanged);
    dis('enMeleeN', !s.enMelee); dis('enRangedN', !s.enRanged);
  };

  // In the claude.ai artifact the address bar is not ours: remember the setup in this browser instead.
  const ARTIFACT = root.dataset.mode === 'artifact';
  const STORE = 'd2r-summoner-setup';
  const persist = (q: string) => {
    if (ARTIFACT) { try { localStorage.setItem(STORE, q); } catch { /* storage blocked */ } }
    else history.replaceState(null, '', q ? `#${q}` : location.pathname);
  };
  let urlTimer = 0;
  const update = () => {
    const s = read();
    const html = renderRegions(s);
    for (const [id, el] of regions) if (html[id] !== undefined && el.innerHTML !== html[id]) el.innerHTML = html[id];
    syncDisabled(s);
    syncPreset(s);
    syncPicks();
    window.clearTimeout(urlTimer);
    urlTimer = window.setTimeout(() => persist(encodeState(s)), 250);
  };

  const beast = document.getElementById('beast') as HTMLInputElement | null;
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-variant]'));
  let activeId: string | null = null;
  let beastPref = false;   // remembered while a preset without Beast mode is active

  // Highlight the preset the current inputs equal; Beast mode is only offered for presets that support it.
  const syncPreset = (s: State) => {
    const m = matchVariant(s);
    activeId = m?.id ?? null;
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.variant === activeId)));
    const item = root.querySelector<HTMLElement>('#d-golem-item');
    if (item) item.hidden = s.golemType !== 'iron';
    const hint = root.querySelector<HTMLElement>('#beast-hint');
    if (hint) hint.textContent = s.golemType !== 'iron'
      ? 'Needs the Iron Golem: Beast and Mania are items the golem wears. Pick Iron Golem in section 3 or load a preset.'
      : 'Iron Golem wears Beast (Fanaticism 9) instead of Mania. Only for Low budget and Rogue Company.';
    if (!beast) return;
    const supported = Boolean(BUILD_VARIANTS.find(x => x.id === activeId)?.beast);
    if (m && supported) beastPref = m.beast;
    beast.disabled = !supported;
    beast.checked = supported && beastPref;
  };

  root.addEventListener('input', e => {
    const key = (e.target as HTMLElement).dataset.key;
    if (!key) return;
    // A runeword choice fills in its best rolls and a fitting base.
    if (key === 'gRw') { const cur = read(); write({ ...cur, ...golemItemPatch(cur.gRw, cur.gBase) }); }
    update();
  });
  // One-click fixes offered by the gear check (rendered inside a region, so delegate).
  root.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-fix-golem],[data-fix-off]');
    if (!b) return;
    const cur = read();
    if (b.dataset.fixGolem) write({ ...cur, golemType: 'iron', ...golemItemPatch(b.dataset.fixGolem, cur.gBase) });
    else if (b.dataset.fixOff) write({ ...cur, [`${b.dataset.fixOff}On`]: false } as State);
    update();
  });
  root.addEventListener('change', e => { if ((e.target as HTMLElement).dataset.key) update(); });
  buttons.forEach(b => b.addEventListener('click', () => {
    write(applyVariant(read(), b.dataset.variant!, { beast: beastPref }));
    update();
  }));
  beast?.addEventListener('change', () => {
    beastPref = beast.checked;
    if (activeId) { write(applyVariant(read(), activeId, { beast: beastPref })); update(); }
  });

  // Click an aura source (e.g. "Mist 12") to switch the aura on at that source's best level.
  const picks = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-aura]'));
  const syncPicks = () => picks.forEach(b => {
    const on = root.querySelector<HTMLInputElement>(`#f-${b.dataset.aura}On`)?.checked;
    const lv = root.querySelector<HTMLInputElement>(`#f-${b.dataset.aura}L`)?.value;
    b.setAttribute('aria-pressed', String(Boolean(on) && lv === b.dataset.lvl));
  });
  picks.forEach(b => b.addEventListener('click', e => {
    e.preventDefault();
    const on = root.querySelector<HTMLInputElement>(`#f-${b.dataset.aura}On`), lv = root.querySelector<HTMLInputElement>(`#f-${b.dataset.aura}L`);
    if (on) on.checked = true;
    if (lv) lv.value = b.dataset.lvl!;
    update();
  }));

  const share = document.getElementById('share');
  share?.addEventListener('click', async () => {
    const url = location.href;
    try { await navigator.clipboard.writeText(url); share.textContent = 'Link copied'; }
    catch { window.prompt('Copy this link:', url); }
    window.setTimeout(() => { share.textContent = 'Copy link to this setup'; }, 1800);
  });
  document.getElementById('reset')?.addEventListener('click', () => { write(DEFAULT_STATE); update(); });

  // Restore a shared setup from the URL hash (website) or the last setup in this browser (artifact).
  if (ARTIFACT) { try { const q = localStorage.getItem(STORE); if (q) write(decodeState(q)); } catch { /* storage blocked */ } }
  else if (location.hash.length > 1) write(decodeState(location.hash));
  update();
}
