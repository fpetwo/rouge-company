// Static site build: Markdown pages + pre-rendered calculator → dist/.
// Every page is plain HTML with full SEO metadata; the calculator script is optional enhancement.
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { Marked } from 'marked';
import { site } from '../../site.config.ts';
import { DEFAULT_STATE } from '../core/state.ts';
import { renderCalculator } from '../client/view.ts';
import { auraTable, monsterTable, variantDetails, variantTable } from './content.ts';
import { armorTables, itemCounts, setDetails, setItemTable, setTable, uniqueTable, weaponTables } from './items.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIST = join(ROOT, 'dist');
const CONTENT = join(ROOT, 'content');

interface Page {
  path: string;            // URL path, e.g. /guide/auras/
  title: string;
  description: string;
  h1?: string;
  type: 'website' | 'article';
  nav?: string;            // short label (breadcrumbs, menu)
  menu?: boolean;          // show in the header navigation
  wide?: boolean;          // wide layout for big tables
  script?: string;         // client script to load: 'app' or 'tables'
  order?: number;          // position in the navigation
  breadcrumb?: string;     // label in breadcrumbs
  faq?: { q: string; a: string }[];
  noindex?: boolean;
  body: string;            // HTML
  updated: string;
}

// ---------- tiny front matter parser (key: value, plus a "faq" list) ----------
function parseFrontMatter(src: string): { data: Record<string, any>; body: string } {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(src);
  if (!m) return { data: {}, body: src };
  const data: Record<string, any> = {};
  let list: { q: string; a: string }[] | null = null;
  for (const line of m[1].split('\n')) {
    const q = /^\s+- q:\s*(.*)$/.exec(line), a = /^\s+a:\s*(.*)$/.exec(line);
    if (q && list) { list.push({ q: q[1], a: '' }); continue; }
    if (a && list) { list[list.length - 1].a = a[1]; continue; }
    const kv = /^(\w+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    if (kv[2] === '') { list = []; data[kv[1]] = list; continue; }
    list = null;
    data[kv[1]] = kv[2] === 'true' ? true : kv[2] === 'false' ? false : kv[2].replace(/^"(.*)"$/, '$1');
  }
  return { data, body: src.slice(m[0].length) };
}

const slug = (s: string) => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const marked = new Marked({ gfm: true });
marked.use({
  renderer: {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      return depth === 1 ? `<h1>${text}</h1>\n` : `<h${depth} id="${slug(text)}">${text}</h${depth}>\n`;
    },
    table(token) {
      const html = marked.Renderer.prototype.table.call(this, token);
      return `<div class="scroll">${html.replace('<table>', '<table class="data">')}</div>`;
    }
  }
});

const PLACEHOLDERS: Record<string, () => string> = {
  calculator: () => renderCalculator(DEFAULT_STATE),
  'table:auras': auraTable,
  'table:monsters': monsterTable,
  'table:variants': variantTable,
  'variants:details': variantDetails,
  'items:weapons': weaponTables,
  'items:armor': armorTables,
  'items:uniques': uniqueTable,
  'items:sets': setTable,
  'items:set-details': setDetails,
  'items:set-items': setItemTable,
  'count:weapons': itemCounts.weapons,
  'count:armor': itemCounts.armor,
  'count:uniques': itemCounts.uniques,
  'count:sets': itemCounts.sets,
  'count:set-items': itemCounts.setItems,
  'site.contact': () => (site.contact ? `<p>Contact: ${site.contact}</p>` : ''),
  'site.name': () => site.name,
  'site.url': () => site.url,
  'site.updated': () => site.updated,
  'site.data': () => site.dataVersion
};
// Filled after Markdown rendering: block placeholders stand alone in a paragraph.
const fill = (s: string) => s
  .replace(/<p>\{\{([\w.:-]+)\}\}<\/p>/g, (m, k) => (PLACEHOLDERS[k] ? PLACEHOLDERS[k]() : m))
  .replace(/\{\{([\w.:-]+)\}\}/g, (m, k) => (PLACEHOLDERS[k] ? PLACEHOLDERS[k]() : m));

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap(f => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : p.endsWith('.md') ? [p] : []; });
}

function loadPages(): Page[] {
  return walk(CONTENT).map(file => {
    const { data, body } = parseFrontMatter(readFileSync(file, 'utf8'));
    let rel = relative(CONTENT, file).replace(/\\/g, '/').replace(/\.md$/, '');
    rel = rel === 'index' ? '' : rel.replace(/\/index$/, '');
    const path = rel ? `/${rel}/` : '/';
    const html = fill(marked.parse(body) as string);
    return {
      path, body: html, title: data.title, description: data.description, h1: data.h1,
      type: data.type ?? 'article', nav: data.nav, menu: data.menu === true, wide: data.wide === true, script: data.script ?? (path === '/' ? 'app' : undefined), order: data.order ? Number(data.order) : 99, breadcrumb: data.breadcrumb ?? data.nav ?? data.title,
      faq: data.faq, noindex: data.noindex === true, updated: data.updated ?? site.updated
    };
  });
}

// ---------- assets ----------
function hashName(name: string, content: string | Buffer) {
  const h = createHash('sha256').update(content).digest('hex').slice(0, 10);
  return name.replace(/(\.\w+)$/, `.${h}$1`);
}

async function bundleScripts(): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const name of ['app', 'tables']) {
    const res = await esbuild.build({
      entryPoints: [join(ROOT, `src/client/${name}.ts`)], bundle: true, minify: true, format: 'esm',
      target: ['es2020'], write: false, legalComments: 'none'
    });
    const code = res.outputFiles[0].text;
    const file = hashName(`${name}.js`, code);
    writeFileSync(join(DIST, 'assets', file), code);
    out[name] = `/assets/${file}`;
  }
  return out;
}

async function buildOgImage(): Promise<void> {
  const svg = readFileSync(join(ROOT, 'public/og.svg'));
  try {
    const sharp = (await import('sharp')).default;
    await sharp(svg).png().toFile(join(DIST, 'og.png'));
  } catch (e) {
    console.warn('sharp not available – og.png not generated', e);
  }
}

// ---------- layout ----------
const abs = (p: string) => `${site.url}${p}`;
// Prefix root-relative links with the base path (GitHub Pages project sites live under /<repo>/).
const withBase = (html: string) => (site.base ? html.replace(/(\s(?:href|src))="\/(?!\/)/g, `$1="${site.base}/`) : html);

function jsonLd(page: Page, all: Page[]): string {
  const graph: any[] = [{
    '@type': 'WebSite', '@id': abs('/#website'), url: abs('/'), name: site.name, description: site.tagline, inLanguage: site.lang
  }];
  if (page.path === '/') {
    graph.push({
      '@type': 'WebApplication', '@id': abs('/#app'), name: site.name, url: abs('/'), applicationCategory: 'GameApplication',
      operatingSystem: 'Any (web browser)', browserRequirements: 'Requires JavaScript for live updates',
      description: page.description, offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' }, isAccessibleForFree: true
    });
  } else {
    const crumbs = [{ name: 'Calculator', path: '/' }];
    const parts = page.path.split('/').filter(Boolean);
    let acc = '/';
    for (const part of parts) {
      acc += `${part}/`;
      const p = all.find(x => x.path === acc);
      if (p) crumbs.push({ name: p.breadcrumb ?? p.title, path: acc });
    }
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.path) }))
    });
    if (page.type === 'article') graph.push({
      '@type': 'TechArticle', headline: page.h1 ?? page.title, description: page.description, url: abs(page.path),
      dateModified: page.updated, inLanguage: site.lang, isPartOf: { '@id': abs('/#website') },
      about: { '@type': 'VideoGame', name: 'Diablo II: Resurrected' }
    });
  }
  if (page.faq?.length) graph.push({
    '@type': 'FAQPage', mainEntity: page.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
  });
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>`;
}

function layout(input: Page, all: Page[], css: string, scripts: Record<string, string>): string {
  let page = input;
  const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const full = `${page.title} – ${site.name}`;
  const title = esc(page.path === '/' || page.title.includes('D2R') || full.length > 65 ? page.title : full);
  page = { ...page, title: esc(page.title), description: esc(page.description) };
  const nav = all.filter(p => p.menu).sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  const navHtml = nav.map(p => `<a href="${p.path}"${p.path === page.path ? ' aria-current="page"' : p.path !== '/' && page.path.startsWith(p.path) ? ' aria-current="true"' : ''}>${p.nav}</a>`).join('');
  const trail: string[] = [];
  { let acc = '/'; const parts = page.path.split('/').filter(Boolean); parts.pop();
    for (const part of parts) { acc += `${part}/`; const p = all.find(x => x.path === acc); if (p) trail.push(` › <a href="${acc}">${esc(p.breadcrumb ?? p.title)}</a>`); } }
  const crumbs = page.path === '/' ? '' : `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Calculator</a>${trail.join('')} › <span aria-current="page">${page.breadcrumb}</span></nav>`;
  const isWide = page.path === '/' || page.wide;
  return `<!doctype html>
<html lang="${site.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'none'">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${title}</title>
<meta name="description" content="${page.description}">
<link rel="canonical" href="${abs(page.path)}">
${page.noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
<meta name="color-scheme" content="dark light">
<meta name="theme-color" content="#16110e">
<meta property="og:type" content="${page.path === '/' ? 'website' : 'article'}">
<meta property="og:site_name" content="${site.name}">
<meta property="og:title" content="${page.title}">
<meta property="og:description" content="${page.description}">
<meta property="og:url" content="${abs(page.path)}">
<meta property="og:image" content="${abs('/og.png')}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="${site.locale}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="manifest" href="/site.webmanifest">
${page.type === 'article' ? `<meta property="article:modified_time" content="${page.updated}">` : ''}
${jsonLd(page, all)}
<style>${css}</style>
</head>
<body${isWide ? ' class="wide"' : ''}>
<a class="skip" href="#main">Skip to content</a>
<header class="site-head"><div class="wrap">
<a class="brand" href="/"><svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true"><use href="/favicon.svg#mark"/></svg>${site.name}</a>
<nav class="site-nav" aria-label="Main">${navHtml}</nav>
</div></header>
<main id="main" class="wrap">
${crumbs}
${page.body}
</main>
<footer class="site-foot"><div class="wrap">
<p>${site.name} · data: ${site.dataVersion} · last updated ${page.updated}</p>
<p>Free, non-commercial fan project. Not affiliated with or endorsed by Blizzard Entertainment. Diablo is a trademark of Blizzard Entertainment, Inc.</p>
<p>Built with the help of AI (Claude by Anthropic): code, formulas and texts were generated with AI and checked against game data, but may still contain errors.</p>
<p><a href="/help/">Help</a> · <a href="/guide/how-it-works/">How the calculator works</a> · <a href="/items/">Item database</a> · <a href="/legal/privacy/">Privacy</a></p>
</div></footer>
${page.script && scripts[page.script] ? `<script type="module" src="${scripts[page.script]}"></script>` : ''}
</body>
</html>`;
}

// ---------- main ----------
async function main() {
  if (existsSync(DIST)) rmSync(DIST, { recursive: true });
  mkdirSync(join(DIST, 'assets'), { recursive: true });
  cpSync(join(ROOT, 'public'), DIST, { recursive: true, filter: src => !src.endsWith('og.svg') });
  const manifest = join(DIST, 'site.webmanifest');
  writeFileSync(manifest, readFileSync(manifest, 'utf8').replace(/"\/(?!\/)/g, `"${site.base}/`));

  const css = readFileSync(join(ROOT, 'src/client/styles.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();
  const scripts = await bundleScripts();
  await buildOgImage();

  const pages = loadPages();
  for (const p of pages) {
    if (!p.title || !p.description) throw new Error(`${p.path}: title and description are required`);
    if (p.description.length > 165) console.warn(`${p.path}: description is ${p.description.length} chars (aim for ≤ 160)`);
    const html = layout(p, pages, css, scripts);
    const out = p.path === '/404/' ? join(DIST, '404.html') : join(DIST, p.path, 'index.html');
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, withBase(html));
  }

  const indexed = pages.filter(p => !p.noindex && p.path !== '/404/').sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  writeFileSync(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexed.map(p => `  <url><loc>${abs(p.path)}</loc><lastmod>${p.updated}</lastmod></url>`).join('\n')}
</urlset>
`);
  writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${abs('/sitemap.xml')}\n`);
  console.log(`Built ${pages.length} pages → dist/ (scripts ${Object.values(scripts).join(', ')})`);
}

main().catch(e => { console.error(e); process.exit(1); });
