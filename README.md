# D2R Summoner Calculator

Static website: skeleton-army DPS calculator for the Diablo II: Resurrected summon Necromancer,
plus guides, an item database (bases, uniques and sets by level) and a help page.
Plain HTML with full SEO metadata; the calculator and table filters are small scripts on top.
Live: https://fpetwo.github.io/rouge-company/ (deployed by GitHub Actions, see DEPLOY.md).

## Commands

| Command | What it does |
|---|---|
| `npm run build` | Builds the site into `dist/` |
| `npm test` | Checks the damage model, presets, Beast mode, gear-fit check and URL sharing |
| `npm run check` | TypeScript type check |
| `npm run preview` | Serves `dist/` at http://localhost:4173 (with `base` set, open the pages under `/<base>/` on a static server) |

Needs Node 22+ and the packages in `package.json` (`npm install`).

## Where things live

| Path | Content |
|---|---|
| `site.config.ts` | Site URL, name, optional public contact, data version |
| `content/**/*.md` | All pages (front matter: title, description, nav, menu, order, faq, script, wide) |
| `src/core/` | Damage model: monster data, formulas, presets (`state.ts`), gear-fit check |
| `src/client/` | Calculator UI, item-table filters, styles |
| `src/build/` | Static site generator and generated tables |
| `data/game-data.json` | Item bases, uniques and sets, extracted from the game tables |
| `scripts/extract_game_data.py` | Re-creates `data/game-data.json` after a game patch |
| `public/` | Favicon, social image, `_headers` (security headers, CSP) |

## Updating item data after a patch

```
git clone --depth 1 https://github.com/blizzhackers/d2data /tmp/d2data   # MIT licensed JSON export of the game tables
python3 scripts/extract_game_data.py /tmp/d2data/json
npm run build
```

Then update `dataVersion` and `updated` in `site.config.ts`.

## Content rules

- No game artwork, logos or screenshots; text and numbers only.
- No trading, price or real-money features; no bots or automation.
- Keep the "not affiliated with Blizzard" footer.
- Non-commercial: no ads, affiliate links or donations. That is what keeps the site a private fan project without an Impressum.
