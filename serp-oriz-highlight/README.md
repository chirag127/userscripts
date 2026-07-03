# SERP: highlight oriz-recommended sites

Adds a small gold star next to search results when the site appears in [links.oriz.in](https://links.oriz.in) — the curated 2026 dev-sites directory. Hover the star for why we picked it, its tier, and whether it matches our stack.

## Install

- [Greasyfork](#) — TBD after first publish
- [OpenUserJS](#) — TBD after first publish
- Direct raw: click [`serp-oriz-highlight.user.js`](./serp-oriz-highlight.user.js) with Tampermonkey / Violentmonkey / ScriptCat installed

## Supported search engines

| Engine | URL pattern | Adapter |
|---|---|---|
| Google | `google.com/search*` + `google.co.in` | `div.g`, `div[data-hveid]` |
| DuckDuckGo | `duckduckgo.com/*` | `article[data-testid=result]` |
| Bing | `bing.com/search*` | `li.b_algo` |

Adding another engine is one entry in the `ADAPTERS` array — see the source. PRs welcome.

## Data source

Fetches [`https://links.oriz.in/search-index.json`](https://links.oriz.in/search-index.json) once per 24h, caches in `GM_setValue`. On fetch failure, falls back to stale cache. Zero fetches on every SERP after first load.

The JSON is a flat list produced by the [`chirag127/links-site`](https://github.com/chirag127/links-site) Astro build. Includes: `name`, `url`, `tier`, `review`, `why`, `stack_match`, `slug`, `category`.

## Design

- Palette matches `links.oriz.in` — navy `#0a1929` tooltip on gold `#ffb700` accent, blush `#ff8a95` tier chip
- Star is 14px, non-intrusive, appended to the result-title anchor
- Tooltip is z-index max, positioned below the anchor
- No React, no dependencies, no build step — pure userscript

## Privacy

- One HTTP GET per 24h to `links.oriz.in`
- Zero analytics, zero telemetry, zero third-party
- `@connect links.oriz.in` in the metadata block (Tampermonkey enforces)

## Cross-refs

- Companion site: [links.oriz.in](https://links.oriz.in)
- Repo: [`chirag127/links-site`](https://github.com/chirag127/links-site)
- Rules: [`develop-userscripts` skill](https://knowledge.oriz.in/rules/development/userscript-author-handle.html), [`userscript-prototype-via-tweeks` pattern](https://knowledge.oriz.in/decisions/apps/userscript-prototype-via-tweeks.html)

## License

MIT — [`chirag127/userscripts`](https://github.com/chirag127/userscripts) monorepo license.
