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
// @homepageURL  https://github.com/chirag127/userscripts/tree/main/scripts/youtube-hide-shorts
// @supportURL   https://github.com/chirag127/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/youtube-hide-shorts/youtube-hide-shorts.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/youtube-hide-shorts/youtube-hide-shorts.user.js
// ==/UserScript==

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
