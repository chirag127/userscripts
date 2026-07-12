// ==UserScript==
// @name         YouTube — Hide Shorts everywhere
// @namespace    https://github.com/chirag127/userscripts
// @version      0.1.0
// @description  Hides Shorts shelves + sidebar entry, and redirects /shorts/<id> to /watch?v=<id> so Shorts play as regular videos.
// @author       chirag127
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts/blob/main/scripts/youtube-hide-shorts.user.js
// @supportURL   https://github.com/chirag127/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/youtube-hide-shorts.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/youtube-hide-shorts.user.js
// ==/UserScript==

/*
README (folded from youtube-hide-shorts/README.md during flat-restructure 2026-07-12)

# YouTube — Hide Shorts everywhere

Kills Shorts across YouTube:

- Hides Shorts **shelves** on Home, Subscriptions, and channel pages.
- Hides the **Shorts sidebar entry** (both full and mini guide).
- Hides the **Shorts tab** on channel pages and **Shorts chip** in search filters.
- **Redirects `/shorts/<id>` → `/watch?v=<id>`** so a Short opens in the normal player (with a timeline, playback speed, etc.).

## Install

[![Install](https://img.shields.io/badge/install-userscript-blue)](https://github.com/chirag127/userscripts/raw/main/scripts/youtube-hide-shorts.user.js)

Requires Tampermonkey, Violentmonkey, or Userscripts (Safari).

## Config

Click the Tampermonkey/Violentmonkey icon → menu for this userscript:

- `Toggle Shorts→Watch redirect` — turn the `/shorts/<id>` → `/watch?v=<id>` redirect on/off. Hiding still applies either way. Reload to apply.

Setting persists via `GM_setValue`.

## How it works

- CSS via `GM_addStyle` hides the Shorts DOM nodes (shelf renderers, reel renderers, guide entries, chips). Uses `:has()` selectors — needs a modern browser (Chromium 105+, Firefox 121+, Safari 15.4+).
- SPA nav (`yt-navigate-finish`, `popstate`) re-runs the redirect check on client-side route changes.
- `@run-at document-start` fires the redirect before the Shorts player mounts, so no flash.

## Known limitations

- Selectors track YouTube's current DOM. If YouTube renames `ytd-reel-shelf-renderer` etc., a Shorts shelf may briefly reappear until the selector is updated.
- The redirect assumes the Shorts video is available to the regular watch player. Age-restricted or region-locked Shorts may show the standard YouTube error page.

## License

MIT.
*/

(() => {
  'use strict'

  const KEY_REDIRECT = 'yt-hide-shorts-redirect'
  const hasGM = typeof GM_getValue === 'function' && typeof GM_setValue === 'function'
  const getRedirect = () => hasGM ? GM_getValue(KEY_REDIRECT, true) !== false : true

  // Redirect Shorts watch pages to the regular player. document-start = fires before Shorts UI mounts.
  function maybeRedirect() {
    if (!getRedirect()) return
    const m = location.pathname.match(/^\/shorts\/([^/?#]+)/)
    if (m) location.replace('/watch?v=' + m[1] + location.search.replace(/^\?/, location.search ? '&' : ''))
  }
  maybeRedirect()

  // SPA nav: YouTube swaps URLs without full reload.
  window.addEventListener('yt-navigate-finish', maybeRedirect)
  window.addEventListener('popstate', maybeRedirect)

  // Hide Shorts shelves, reels, sidebar entry, and pinned tabs.
  if (typeof GM_addStyle === 'function') {
    GM_addStyle(`
      ytd-rich-shelf-renderer[is-shorts],
      ytd-reel-shelf-renderer,
      ytd-reel-item-renderer,
      ytd-shorts,
      ytd-guide-entry-renderer:has(a[title="Shorts"]),
      ytd-mini-guide-entry-renderer[aria-label="Shorts"],
      ytd-guide-entry-renderer:has(a[href="/shorts"]),
      a[title="Shorts"],
      [tab-title="Shorts"],
      yt-chip-cloud-chip-renderer[chip-style][title="Shorts"] {
        display: none !important;
      }
    `)
  }

  if (typeof GM_registerMenuCommand === 'function' && hasGM) {
    GM_registerMenuCommand('Toggle Shorts→Watch redirect (currently: ' + (getRedirect() ? 'on' : 'off') + ')', () => {
      GM_setValue(KEY_REDIRECT, !getRedirect())
      // eslint-disable-next-line no-alert
      alert('Redirect ' + (getRedirect() ? 'enabled' : 'disabled') + '. Reload to apply.')
    })
  }
})()
