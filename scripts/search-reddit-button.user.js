// ==UserScript==
// @name         SERP — Toggle site:reddit.com button
// @namespace    https://github.com/chirag127/userscripts-script
// @version      0.1.0
// @description  One-click button to add/remove `site:reddit.com` from the current search query on Google, DuckDuckGo, and Bing. For when you want real answers, not SEO chum.
// @author       chirag127
// @match        https://www.google.com/search*
// @match        https://duckduckgo.com/*
// @match        https://www.bing.com/search*
// @run-at       document-end
// @grant        GM_registerMenuCommand
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts-script/blob/main/scripts/search-reddit-button.user.js
// @supportURL   https://github.com/chirag127/userscripts-script/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/search-reddit-button.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/search-reddit-button.user.js
// ==/UserScript==

/*
README (folded from search-reddit-button/README.md during flat-restructure 2026-07-12)

# search-reddit-button

Userscript that adds a floating **`+ reddit`** / **`− reddit`** button to search-engine results pages. One click toggles `site:reddit.com` onto (or off) the current query and reloads. For when you want real human answers instead of SEO listicles.

## Supported engines

- Google (`www.google.com/search`)
- DuckDuckGo (`duckduckgo.com`)
- Bing (`www.bing.com/search`)

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) (or Violentmonkey / ScriptCat).
2. Click → **[install](https://github.com/chirag127/userscripts-script/raw/main/scripts/search-reddit-button.user.js)**

## Use

1. Run any search.
2. Button appears top-right of the page:
   - **`+ reddit`** (orange) — click to add `site:reddit.com` to your query.
   - **`− reddit`** (red) — click to remove it.
3. Also available from the Tampermonkey menu → **Toggle site:reddit.com** for keyboard users who prefer no floating chrome.

## Known limitations

- Reloads the page (search engines don't take kindly to in-place query rewrites).
- Position is fixed top-right at 2.1B z-index — if some SERP overlay clashes, edit the `style` block.
- The button auto-reinjects on DOM mutation, so instant-results engines shouldn't drop it.

## License

MIT.
*/

(() => {
  'use strict'

  const SITE = 'site:reddit.com'
  const QUERY_PARAM = location.hostname.includes('duckduckgo') ? 'q' : 'q'

  const getQuery = () => new URLSearchParams(location.search).get(QUERY_PARAM) || ''

  const hasSiteFilter = (q) => new RegExp(`(^|\\s)${SITE.replace('.', '\\.')}(\\s|$)`, 'i').test(q)

  const toggle = () => {
    const q = getQuery().trim()
    if (!q) return
    const next = hasSiteFilter(q)
      ? q.replace(new RegExp(`\\s*${SITE.replace('.', '\\.')}\\s*`, 'ig'), ' ').trim()
      : `${q} ${SITE}`
    const url = new URL(location.href)
    url.searchParams.set(QUERY_PARAM, next)
    location.href = url.toString()
  }

  const button = () => {
    const b = document.createElement('button')
    b.type = 'button'
    b.id = 'usr-reddit-toggle'
    b.textContent = hasSiteFilter(getQuery()) ? '− reddit' : '+ reddit'
    b.title = 'Toggle site:reddit.com on this search'
    Object.assign(b.style, {
      position: 'fixed',
      top: '12px',
      right: '12px',
      zIndex: 2147483647,
      padding: '6px 10px',
      background: hasSiteFilter(getQuery()) ? '#c62828' : '#ff4500',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      font: '600 13px system-ui, sans-serif',
      cursor: 'pointer',
      boxShadow: '0 2px 6px rgba(0,0,0,.2)',
    })
    b.addEventListener('click', toggle)
    return b
  }

  const inject = () => {
    if (document.getElementById('usr-reddit-toggle')) return
    if (!getQuery()) return
    document.body.appendChild(button())
  }

  inject()

  // SERP DOM can rerender on instant-results — re-inject if button drops out
  new MutationObserver(() => inject()).observe(document.body, { childList: true, subtree: true })

  // Menu shortcut for keyboard users
  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('Toggle site:reddit.com', toggle)
  }
})()
