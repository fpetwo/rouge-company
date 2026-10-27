// Filters for the long item tables (search, type, "my level"). The tables work without it.
for (const bar of Array.from(document.querySelectorAll<HTMLElement>('.filter[data-for]'))) {
  const table = document.getElementById(bar.dataset.for!);
  if (!table) continue;
  const rows = Array.from(table.querySelectorAll<HTMLTableRowElement>('tbody tr'));
  const text = rows.map(r => (r.textContent ?? '').toLowerCase());
  const q = bar.querySelector<HTMLInputElement>('[data-f=q]')!;
  const type = bar.querySelector<HTMLSelectElement>('[data-f=type]')!;
  const lvl = bar.querySelector<HTMLInputElement>('[data-f=lvl]')!;
  const count = bar.querySelector<HTMLElement>('[data-f=count]')!;
  const total = count.textContent ?? '';

  const apply = () => {
    const words = q.value.toLowerCase().split(/\s+/).filter(Boolean);
    const t = type.value, max = parseInt(lvl.value, 10);
    let shown = 0;
    rows.forEach((r, i) => {
      const ok = words.every(w => text[i].includes(w)) && (!t || r.dataset.type === t) && (!Number.isFinite(max) || Number(r.dataset.lvl) <= max);
      r.hidden = !ok;
      if (ok) shown++;
    });
    count.textContent = shown === rows.length ? total : `${shown} of ${total}`;
  };
  bar.addEventListener('input', apply);
  bar.hidden = false;
}
