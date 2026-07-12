// ==UserScript==
// @name         SERP: highlight oriz-recommended sites
// @namespace    https://github.com/chirag127/userscripts-script
// @version      0.1.0
// @description  Adds a small gold star to search-result rows on Google, DuckDuckGo, and Bing when the hostname appears in Chirag's curated 2026 links directory at links.oriz.in. Hover shows why the site is recommended, its tier (free/signup/freemium), and whether it matches our stack.
// @author       chirag127
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts-script/blob/main/scripts/serp-oriz-highlight.user.js
// @supportURL   https://github.com/chirag127/userscripts-script/issues
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/serp-oriz-highlight.user.js
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/serp-oriz-highlight.user.js
// @match        https://www.google.com/search*
// @match        https://www.google.co.in/search*
// @match        https://duckduckgo.com/*
// @match        https://duckduckgo.com/?*
// @match        https://www.bing.com/search*
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM.xmlHttpRequest
// @grant        GM.getValue
// @grant        GM.setValue
// @connect      links.oriz.in
// ==/UserScript==

/*
README (folded from serp-oriz-highlight/README.md during flat-restructure 2026-07-12)

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

MIT — [`chirag127/userscripts-script`](https://github.com/chirag127/userscripts-script) monorepo license.
*/

/* eslint-disable no-undef */
(function () {
  'use strict';

  const DATA_URL = 'https://links.oriz.in/search-index.json';
  const CACHE_KEY = 'oriz_links_cache_v1';
  const CACHE_AGE_KEY = 'oriz_links_cache_ts';
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

  const GOLD = '#ffb700';
  const BLUSH = '#ff8a95';
  const NAVY = '#0a1929';
  const CREAM = '#f5efe0';

  // ─── data ───────────────────────────────────────────────

  /**
   * GM API dual-mode: some engines expose GM_* (Tampermonkey classic),
   * others expose GM.* (Greasemonkey 4+, ViolentMonkey). Wrap both.
   */
  const gmGet = typeof GM_getValue === 'function'
    ? (k, d) => Promise.resolve(GM_getValue(k, d))
    : (k, d) => GM.getValue(k, d);
  const gmSet = typeof GM_setValue === 'function'
    ? (k, v) => Promise.resolve(GM_setValue(k, v))
    : (k, v) => GM.setValue(k, v);
  const gmFetch = typeof GM_xmlhttpRequest === 'function' ? GM_xmlhttpRequest : GM.xmlHttpRequest;

  function fetchList() {
    return new Promise((resolve, reject) => {
      gmFetch({
        method: 'GET',
        url: DATA_URL,
        timeout: 8000,
        onload: (res) => {
          if (res.status !== 200) return reject(new Error(`HTTP ${res.status}`));
          try { resolve(JSON.parse(res.responseText)); }
          catch (e) { reject(e); }
        },
        onerror: reject,
        ontimeout: () => reject(new Error('timeout')),
      });
    });
  }

  async function getList() {
    const [cached, ts] = await Promise.all([
      gmGet(CACHE_KEY, null),
      gmGet(CACHE_AGE_KEY, 0),
    ]);
    const fresh = ts && (Date.now() - Number(ts) < CACHE_TTL_MS);
    if (cached && fresh) return cached;

    try {
      const list = await fetchList();
      await gmSet(CACHE_KEY, list);
      await gmSet(CACHE_AGE_KEY, Date.now());
      return list;
    } catch (err) {
      // Return stale cache rather than nothing.
      if (cached) return cached;
      console.warn('[oriz-highlight] fetch failed, no cache:', err);
      return [];
    }
  }

  // ─── indexing ───────────────────────────────────────────

  function hostFrom(url) {
    try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); }
    catch { return ''; }
  }

  function indexByHost(list) {
    const map = new Map();
    if (!Array.isArray(list)) return map;
    for (const item of list) {
      if (!item?.url) continue;
      const host = hostFrom(item.url);
      if (!host) continue;
      // Keep first entry per host — data may have duplicates across categories.
      if (!map.has(host)) map.set(host, item);
    }
    return map;
  }

  // ─── SERP adapters ──────────────────────────────────────

  const ADAPTERS = [
    {
      match: /^www\.google\./,
      // Google's real result rows carry `data-hveid` on the outer div.
      // Each has a first anchor pointing at the destination URL.
      selector: 'div.g, div[data-hveid]',
      urlFrom: (row) => {
        const a = row.querySelector('a[href^="http"]');
        return a?.href || '';
      },
      titleAnchor: (row) => row.querySelector('h3')?.closest('a') || row.querySelector('a[href^="http"]'),
    },
    {
      match: /^duckduckgo\.com/,
      selector: 'article[data-testid="result"], li[data-layout="organic"]',
      urlFrom: (row) => {
        const a = row.querySelector('a[data-testid="result-title-a"]') || row.querySelector('a[href^="http"]');
        return a?.href || '';
      },
      titleAnchor: (row) =>
        row.querySelector('a[data-testid="result-title-a"]') || row.querySelector('h2 a'),
    },
    {
      match: /^www\.bing\./,
      selector: 'li.b_algo',
      urlFrom: (row) => {
        const a = row.querySelector('h2 a') || row.querySelector('a[href^="http"]');
        return a?.href || '';
      },
      titleAnchor: (row) => row.querySelector('h2 a'),
    },
  ];

  function currentAdapter() {
    const host = location.hostname;
    return ADAPTERS.find((a) => a.match.test(host));
  }

  // ─── UI ─────────────────────────────────────────────────

  const STYLE = `
    .oriz-star {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      margin-left: 6px;
      color: ${GOLD};
      font-size: 12px;
      line-height: 1;
      cursor: help;
      vertical-align: baseline;
    }
    .oriz-star:hover .oriz-tooltip { display: block; }
    .oriz-tooltip {
      display: none;
      position: absolute;
      z-index: 2147483647;
      max-width: 340px;
      margin-top: 18px;
      padding: 12px 14px;
      background: ${NAVY};
      color: ${CREAM};
      border: 1px solid ${GOLD};
      border-radius: 6px;
      font: 13px/1.4 -apple-system, "Inter", sans-serif;
      box-shadow: 0 4px 16px rgba(0,0,0,0.35);
      text-align: left;
      white-space: normal;
    }
    .oriz-tooltip strong { color: ${GOLD}; }
    .oriz-tier {
      display: inline-block;
      padding: 1px 6px;
      margin-right: 6px;
      border-radius: 3px;
      background: ${BLUSH};
      color: ${NAVY};
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .oriz-stack-pick {
      display: inline-block;
      color: ${GOLD};
      font-weight: 700;
      margin-left: 4px;
    }
    .oriz-source {
      display: block;
      margin-top: 6px;
      font-size: 11px;
      color: ${CREAM};
      opacity: 0.65;
    }
    .oriz-source a { color: ${GOLD}; }
  `;

  function injectStyle() {
    if (document.getElementById('oriz-style')) return;
    const el = document.createElement('style');
    el.id = 'oriz-style';
    el.textContent = STYLE;
    document.head.appendChild(el);
  }

  function tooltipHTML(item) {
    const tier = item.tier ? `<span class="oriz-tier">${item.tier}</span>` : '';
    const stack = item.stack_match ? '<span class="oriz-stack-pick">★ stack pick</span>' : '';
    const review = item.review || item.why || '';
    return `
      <strong>${escapeHtml(item.name || '')}</strong>${stack}<br>
      <div style="margin: 4px 0 6px;">${tier}${escapeHtml(review)}</div>
      <span class="oriz-source">
        picked by chirag127 · <a href="https://links.oriz.in/site/${escapeHtml(item.slug || '')}" target="_blank" rel="noopener">links.oriz.in</a>
      </span>
    `;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function addBadge(anchor, item) {
    if (!anchor || anchor.dataset.orizMarked) return;
    anchor.dataset.orizMarked = '1';
    const wrapper = document.createElement('span');
    wrapper.className = 'oriz-star';
    wrapper.title = 'oriz.in recommended — hover for detail';
    wrapper.innerHTML = `★<span class="oriz-tooltip">${tooltipHTML(item)}</span>`;
    // Insert after the anchor's visible text, inline.
    anchor.appendChild(wrapper);
  }

  // ─── main loop ──────────────────────────────────────────

  async function run() {
    const adapter = currentAdapter();
    if (!adapter) return;

    injectStyle();

    const list = await getList();
    if (!list || !list.length) return;
    const byHost = indexByHost(list);

    const scan = () => {
      const rows = document.querySelectorAll(adapter.selector);
      for (const row of rows) {
        if (row.dataset.orizScanned) continue;
        const url = adapter.urlFrom(row);
        if (!url) continue;
        row.dataset.orizScanned = '1';
        const host = hostFrom(url);
        // Match by full host OR by strict suffix (foo.bar.com matches bar.com).
        let match = byHost.get(host);
        if (!match) {
          for (const [candidate, item] of byHost) {
            if (host === candidate || host.endsWith('.' + candidate)) {
              match = item;
              break;
            }
          }
        }
        if (!match) continue;
        const anchor = adapter.titleAnchor(row);
        if (anchor) addBadge(anchor, match);
      }
    };

    scan();
    // DuckDuckGo + Bing load more results as you scroll. Watch for new rows.
    const mo = new MutationObserver(() => {
      // Cheap debounce — just rescan; already-scanned rows are skipped by dataset.
      scan();
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  // Wait a tick for late-rendered SERPs (esp. DuckDuckGo React root).
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(run, 250);
  } else {
    document.addEventListener('DOMContentLoaded', () => setTimeout(run, 250));
  }
})();
