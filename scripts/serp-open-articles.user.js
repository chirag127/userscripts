// ==UserScript==
// @name         SERP: open all article results
// @namespace    https://github.com/chirag127/userscripts
// @version      0.1.3
// @description  Add a button to search engine result pages that opens all article-type results in new tabs. Skips videos, social, shopping, maps. Deduplicates by URL. Caps at 10 tabs by default with a confirmation dialog above 5.
// @author       chirag127
// @match        https://www.google.com/search*
// @match        https://www.bing.com/search*
// @match        https://duckduckgo.com/*
// @match        https://search.brave.com/search*
// @match        https://www.startpage.com/do/search*
// @match        https://kagi.com/search*
// @run-at       document-end
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts/blob/main/scripts/serp-open-articles.user.js
// @supportURL   https://github.com/chirag127/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/serp-open-articles.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/serp-open-articles.user.js
// ==/UserScript==

/*
README (folded from serp-open-articles/README.md during flat-restructure 2026-07-12)

# serp-open-articles

Userscript that adds a **"Open all article results (N)"** button to search-engine results pages and, on click, opens every article-type result in a new tab.

## Supported engines

- Google (`www.google.com/search`)
- Bing (`www.bing.com/search`)
- DuckDuckGo (`duckduckgo.com`)
- Brave Search (`search.brave.com/search`)
- Startpage (`www.startpage.com/do/search`)
- Kagi (`kagi.com/search`)

## What it skips

URL-pattern filter, hostname-suffix matched:

- **Video** — youtube.com, youtu.be, vimeo.com, dailymotion.com, twitch.tv
- **Social** — twitter.com, x.com, facebook.com, instagram.com, tiktok.com, linkedin.com, pinterest.com, threads.net
- **Shopping** — amazon.\* , ebay.com, etsy.com, walmart.com, flipkart.com, aliexpress.com
- **Maps / official tools** — `*\/maps`, maps.google.com
- **Image-only** — imgur.com, flickr.com

PDFs pass through (`.pdf` URLs are usually articles).

The script also de-duplicates by host + path so cached/AMP copies of the same article only open once, and it unwraps Google's `/url?q=` and DuckDuckGo's `/l/?uddg=` redirector links before filtering.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) (or Violentmonkey / ScriptCat).
2. Click → **[install](https://github.com/chirag127/userscripts/raw/main/scripts/serp-open-articles.user.js)**

## Use

1. Run a search on any supported engine.
2. A floating button appears top-right: **Open all article results (N)**.
3. Click it.
4. If more than 5 tabs would open, a `confirm()` dialog asks first.

## Settings

| Key | Default | Meaning |
|---|---|---|
| `maxTabs` | `10` | Hard cap on the number of tabs opened per click. |

Change via Tampermonkey's value editor or from devtools:

```js
GM_setValue('maxTabs', 20)
```

The confirm-threshold is hardcoded at 5 in the source — edit `CONFIRM_THRESHOLD` near the top of the script if you want different.

## Known limitations

- **Selectors drift.** Search engines re-skin their result pages every few months. If the count reads `(0)` on a SERP that clearly has results, the selector in `SELECTORS` for that host needs updating. The script falls back to `h2 a[href], h3 a[href]` if the hostname doesn't match any selector key, which works on most engines as a last resort but may also pick up "People also ask" / "Top stories" rows.
- **Brave Search** uses `:has()` — works in modern Chromium and Firefox 121+. Older Firefox may fall through to the second branch of the selector.
- **Popup blocker** can trip when opening many tabs from a single user gesture. The script staggers `window.open` calls with `setTimeout(0)` between each, which usually avoids the block in Chrome / Edge. If it still trips, allow popups for the engine in your browser settings, or use Tampermonkey's `GM_openInTab` (granted automatically).
- **Engine-internal links** (e.g. Google's `/search?q=related:...`) are filtered out by matching the result URL's hostname against the current page's hostname.
- **Infinite scroll / instant-results** — a MutationObserver re-runs the count every 400 ms when the SERP DOM mutates.

## License

MIT.
*/

(() => {
  'use strict'

  // ---- config -------------------------------------------------------------

  const DEFAULT_MAX_TABS = 10
  const CONFIRM_THRESHOLD = 5

  const SKIP_HOSTS = new Set([
    // video
    'youtube.com', 'youtu.be', 'm.youtube.com', 'vimeo.com',
    'dailymotion.com', 'twitch.tv',
    // social
    'twitter.com', 'x.com', 'facebook.com', 'm.facebook.com',
    'instagram.com', 'tiktok.com', 'linkedin.com',
    'pinterest.com', 'pinterest.co.uk', 'threads.net',
    // shopping
    'amazon.com', 'amazon.in', 'amazon.co.uk', 'amazon.de',
    'ebay.com', 'etsy.com', 'walmart.com', 'flipkart.com',
    'aliexpress.com',
    // maps / official tools
    'maps.google.com',
    // image-only
    'imgur.com', 'flickr.com',
  ])

  // Path-prefix skip list (e.g. google.com/maps). Matched as `<host><path>`.
  const SKIP_PATH_PREFIXES = [
    'google.com/maps',
    'bing.com/maps',
    'www.google.com/maps',
    'www.bing.com/maps',
  ]

  // Per-engine result-link selectors. Engines may A/B-test layouts; if you find
  // the button shows zero results on a working SERP, sample the DOM and update
  // these. The keys are matched against `location.hostname` via endsWith.
  const SELECTORS = {
    'google.com':       'div.g a[href]:first-of-type, .yuRUbf a[href]',
    'bing.com':         'li.b_algo h2 a[href]',
    'duckduckgo.com':   'article[data-testid="result"] a[data-testid="result-title-a"]',
    'search.brave.com': 'div.snippet a.h:has(.title), .snippet a[href].h',
    'startpage.com':    'a.result-link[href]',
    'kagi.com':         '.search-result a.title-text[href], ._0_title a[href]',
  }

  // ---- helpers ------------------------------------------------------------

  const getMax = () => {
    try {
      if (typeof GM_getValue === 'function') {
        const v = GM_getValue('maxTabs', DEFAULT_MAX_TABS)
        const n = Number(v)
        if (Number.isFinite(n) && n > 0) return Math.floor(n)
      }
    } catch (_) {}
    return DEFAULT_MAX_TABS
  }

  const openTab = (url) => {
    try {
      if (typeof GM_openInTab === 'function') {
        GM_openInTab(url, { active: false, insert: true, setParent: true })
        return
      }
    } catch (_) {}
    try {
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (e) {
      console.error('[serp-open-articles] failed to open', url, e)
    }
  }

  const normalizeHost = (h) => (h || '').toLowerCase().replace(/^www\./, '')

  const isSkippedUrl = (urlStr) => {
    let u
    try { u = new URL(urlStr, location.href) } catch (_) { return true }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return true
    const host = normalizeHost(u.hostname)
    if (!host) return true
    // exact-or-suffix host match (so `m.youtube.com` matches `youtube.com`)
    for (const skip of SKIP_HOSTS) {
      if (host === skip || host.endsWith('.' + skip)) return true
    }
    const hp = host + u.pathname
    for (const prefix of SKIP_PATH_PREFIXES) {
      if (hp.startsWith(prefix)) return true
    }
    return false
  }

  // Google wraps outbound links in /url?q= redirectors. Unwrap them so the
  // dedupe + host-filter sees the real destination.
  const unwrapGoogleRedirect = (urlStr) => {
    try {
      const u = new URL(urlStr, location.href)
      if (u.hostname.endsWith('google.com') && u.pathname === '/url') {
        const q = u.searchParams.get('q') || u.searchParams.get('url')
        if (q) return q
      }
      // DuckDuckGo's /l/?uddg= redirect.
      if (u.hostname.endsWith('duckduckgo.com') && u.pathname.startsWith('/l/')) {
        const uddg = u.searchParams.get('uddg')
        if (uddg) return decodeURIComponent(uddg)
      }
    } catch (_) {}
    return urlStr
  }

  const dedupeKey = (urlStr) => {
    try {
      const u = new URL(urlStr, location.href)
      return normalizeHost(u.hostname) + u.pathname.replace(/\/+$/, '')
    } catch (_) { return urlStr }
  }

  const pickSelector = () => {
    const host = normalizeHost(location.hostname)
    for (const [key, sel] of Object.entries(SELECTORS)) {
      if (host === key || host.endsWith('.' + key) || host === 'www.' + key) return sel
      // search.brave.com and similar already include subdomain in the key
      if (key.includes('.') && host === key) return sel
    }
    return null
  }

  const collectResults = () => {
    const sel = pickSelector()
    const anchors = sel
      ? Array.from(document.querySelectorAll(sel))
      : // Generic fallback: anchors that are the first link inside an <h2>/<h3>.
        Array.from(document.querySelectorAll('h2 a[href], h3 a[href]'))

    const seen = new Set()
    const seenHosts = new Set() // host+path dedupe (cached vs live copies)
    const out = []
    for (const a of anchors) {
      const raw = a.href
      if (!raw) continue
      const href = unwrapGoogleRedirect(raw)
      if (seen.has(href)) continue
      seen.add(href)
      if (isSkippedUrl(href)) continue
      // Skip the engine's own internal links (e.g. /search?q=...)
      try {
        const u = new URL(href, location.href)
        if (normalizeHost(u.hostname) === normalizeHost(location.hostname)) continue
      } catch (_) { continue }
      const key = dedupeKey(href)
      if (seenHosts.has(key)) continue
      seenHosts.add(key)
      out.push(href)
    }
    return out
  }

  // ---- UI -----------------------------------------------------------------

  const BTN_ID = 'serp-open-articles-btn'

  const openAll = (urls) => {
    const max = getMax()
    const slice = urls.slice(0, max)
    if (slice.length === 0) {
      alert('SERP: open all article results — no results matched the filter.')
      return
    }
    if (slice.length >= CONFIRM_THRESHOLD) {
      if (!confirm(`Open ${slice.length} tab${slice.length === 1 ? '' : 's'}?`)) return
    }
    let i = 0
    const tick = () => {
      if (i >= slice.length) return
      openTab(slice[i++])
      setTimeout(tick, 0)
    }
    tick()
  }

  const renderButton = () => {
    let btn = document.getElementById(BTN_ID)
    const urls = collectResults()
    const label = `Open all article results (${urls.length})`

    if (btn) {
      btn.textContent = label
      btn.dataset.count = String(urls.length)
      btn.disabled = urls.length === 0
      btn.style.opacity = urls.length === 0 ? '0.5' : '1'
      return
    }

    btn = document.createElement('button')
    btn.id = BTN_ID
    btn.type = 'button'
    btn.textContent = label
    btn.dataset.count = String(urls.length)
    // Floating top-right — survives every engine's layout without picking a
    // brittle anchor inside their results column.
    Object.assign(btn.style, {
      position: 'fixed',
      top: '12px',
      right: '12px',
      zIndex: '2147483647',
      padding: '6px 12px',
      font: '13px/1.3 system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      background: 'rgba(255,255,255,0.96)',
      color: '#111',
      border: '1px solid rgba(0,0,0,0.2)',
      borderRadius: '6px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      cursor: 'pointer',
      opacity: urls.length === 0 ? '0.5' : '1',
    })
    btn.addEventListener('mouseenter', () => { btn.style.background = '#f3f4f6' })
    btn.addEventListener('mouseleave', () => { btn.style.background = 'rgba(255,255,255,0.96)' })
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      openAll(collectResults())
    })
    if (urls.length === 0) btn.disabled = true
    document.body.appendChild(btn)
  }

  // ---- bootstrap ----------------------------------------------------------

  const boot = () => {
    if (!document.body) {
      setTimeout(boot, 50)
      return
    }
    renderButton()

    // Re-render when the SERP mutates (infinite-scroll, instant-results, etc.).
    let pending = false
    const obs = new MutationObserver(() => {
      if (pending) return
      pending = true
      setTimeout(() => {
        pending = false
        renderButton()
      }, 400)
    })
    obs.observe(document.body, { childList: true, subtree: true })
  }

  boot()
})()
