// Central site settings. Canonical URLs, sitemap and social previews are generated from url.
// base is the path the site lives under: '' on its own domain, '/<repo>' on a GitHub Pages project site.
export const site = {
  url: 'https://fpetwo.github.io/rouge-company',
  base: '/rouge-company',
  name: 'D2R Summoner Calculator',
  shortName: 'Summoner Calc',
  tagline: 'Skeleton army DPS calculator for the Diablo II: Resurrected necromancer',
  locale: 'en_US',
  lang: 'en',
  // Optional public contact (e.g. a pseudonymous e-mail or a GitHub issues link). Leave empty for none.
  contact: '',
  // Date of the last content/data review, used for "last updated" and sitemap lastmod.
  updated: '2026-10-25',
  dataVersion: 'Reign of the Warlock, patch 3.3'
} as const;
