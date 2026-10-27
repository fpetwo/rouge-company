# Deployment

The site is published with GitHub Pages: every push to `main` runs `.github/workflows/pages.yml`
(install, test, build) and deploys `dist/` to https://fpetwo.github.io/rouge-company/.

## One-time setup

1. Repository **Settings → Pages → Build and deployment → Source: "GitHub Actions"**.
2. Push to `main` (or run the workflow by hand under **Actions → Deploy to GitHub Pages → Run workflow**).
3. After 1–2 minutes the site is live.

## Changing the address

`site.config.ts` holds `url` and `base`. For a site at the root of a domain (for example a repo named
`<account>.github.io` or an own domain) set `base: ''` and `url` to the new address. All links,
the sitemap and social previews follow.

## Notes

- GitHub Pages ignores `public/_headers` (that file is for Cloudflare Pages). The pages carry the
  Content-Security-Policy as a `<meta>` tag instead.
- `robots.txt` only counts at the root of a domain, so on a project site submit
  `https://fpetwo.github.io/rouge-company/sitemap.xml` in Google Search Console if you want search traffic.
- Keep it non-commercial: no ads, affiliate links, paid features or donation buttons. A site that earns
  money needs a full Impressum with name and address (§ 5 DDG).

## Calculator as a single HTML file

`npx tsx scripts/build-artifact.ts out.html` writes the calculator alone as one self-contained file.
