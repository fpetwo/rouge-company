// Builds one self-contained HTML file of the calculator for publishing as a claude.ai artifact.
// Usage: npx tsx scripts/build-artifact.ts <out.html>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as esbuild from 'esbuild';
import { renderCalculator } from '../src/client/view.ts';
import { DEFAULT_STATE } from '../src/core/state.ts';
import { site } from '../site.config.ts';

const ROOT = join(import.meta.dirname, '..');
const out = process.argv[2] ?? join(ROOT, 'dist-artifact.html');

// Theme: dark first, light for viewers who prefer it or pick it explicitly.
let css = readFileSync(join(ROOT, 'src/client/styles.css'), 'utf8');
const light = /@media \(prefers-color-scheme: light\)\{\s*:root\{([\s\S]*?)\}\s*\}/.exec(css);
if (!light) throw new Error('light theme block not found');
css = css.replace(light[0], `@media (prefers-color-scheme: light){:root:not([data-theme="dark"]){${light[1]}}}\n:root[data-theme="light"]{${light[1]}}`);
css += `
.wrap,body.wide .wrap{max-width:1240px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
.art-head{padding-block:18px 4px}
.art-head h1{margin:0 0 6px}
.art-head .lead{margin:0}
.site-foot{margin-top:24px}
`;

// Calculator markup: no links to the website's guide pages, no share-by-link button.
let html = renderCalculator(DEFAULT_STATE)
  .replace('<div class="calc" id="calculator">', '<div class="calc" id="calculator" data-mode="artifact">')
  .replace(/<a href="\/[^"]*">([^<]*)<\/a>/g, '$1')
  .replace(/<button type="button" id="share" class="btn">[^<]*<\/button>/, '');
html = html.replace('The link in your address bar always contains your current setup.', 'Your last setup is remembered in this browser.');

const js = (await esbuild.build({
  entryPoints: [join(ROOT, 'src/client/app.ts')], bundle: true, minify: true, format: 'iife',
  target: ['es2020'], write: false, legalComments: 'none'
})).outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

const page = `<title>D2R Summoner Calculator</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="${site.tagline}">
<style>${css}</style>
<main class="wrap" id="main">
<header class="art-head">
<h1>D2R Summoner DPS Calculator</h1>
<p class="lead">Skeleton army damage for the Diablo II: Resurrected summon Necromancer (${site.dataVersion}). Pick a preset, adjust skills and auras, and compare against real Hell monsters and Diablo.</p>
</header>
${html}
</main>
<footer class="site-foot"><div class="wrap">
<p>Free, non-commercial fan project. Not affiliated with or endorsed by Blizzard Entertainment. Diablo is a trademark of Blizzard Entertainment, Inc.</p>
<p>Built with the help of AI (Claude by Anthropic): code, formulas and texts were generated with AI and checked against game data, but may still contain errors.</p>
</div></footer>
<script>${js}</script>
`;
writeFileSync(out, page);
console.log(`${out} (${Math.round(page.length / 1024)} KB)`);
