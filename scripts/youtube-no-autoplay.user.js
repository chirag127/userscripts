// ==UserScript==
// @name         YouTube — No autoplay + no end cards
// @namespace    https://github.com/chirag127/userscripts
// @version      0.1.0
// @description  Kills autoplay, hides end-card overlays, and auto-dismisses the "Video paused. Continue watching?" modal. Stops YouTube from stealing your next hour.
// @author       chirag127
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @run-at       document-end
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts/blob/main/scripts/youtube-no-autoplay.user.js
// @supportURL   https://github.com/chirag127/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/youtube-no-autoplay.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/youtube-no-autoplay.user.js
// ==/UserScript==

/*
README (folded from youtube-no-autoplay/README.md during flat-restructure 2026-07-12)

# YouTube — No autoplay + no end cards

Stops YouTube from queuing the next video on you. Three things in one script:

| Feature | What it does |
|---|---|
| **Kill autoplay** | Turns off the in-player autoplay toggle on every navigation |
| **Hide end cards** | CSS hides `.ytp-ce-element` and `.ytp-endscreen-content` overlays in the last ~20s of every video |
| **Auto-dismiss "Continue watching?"** | Clicks Yes on the `yt-confirm-dialog-renderer` idle-check modal so playback resumes silently |

## Install

[![Install](https://img.shields.io/badge/install-userscript-blue)](https://github.com/chirag127/userscripts/raw/main/scripts/youtube-no-autoplay.user.js)

Requires Tampermonkey, Violentmonkey, or Userscripts (Safari).

## Config

Click the Tampermonkey/Violentmonkey icon → open the menu for this userscript:

- `Toggle: hide end cards`
- `Toggle: kill autoplay`
- `Toggle: auto-dismiss "Continue watching?"`

Each toggle persists via `GM_setValue`. **Reload the tab** to apply.

## Known limitations

- End-card CSS matches YouTube's current class names — if YouTube rewrites the player, the selectors need updating.
- Autoplay kill runs on `yt-navigate-finish` with two retries (500 ms + 2 s). On a very slow load the toggle may still flip on for the first video of the session.
- The AYSW dismissal button matches on label text `Yes` / `Continue` / `Keep watching` — locale-dependent. Non-English UIs need the labels added.

## License

MIT
*/

(() => {
  'use strict'

  const KEYS = {
    hideEndCards: 'yt-nap-hide-endcards',
    killAutoplay: 'yt-nap-kill-autoplay',
    dismissAysw: 'yt-nap-dismiss-aysw'
  }
  const hasGM = typeof GM_getValue === 'function' && typeof GM_setValue === 'function'
  const get = (k, d) => hasGM ? GM_getValue(k, d) : d
  const set = (k, v) => { if (hasGM) GM_setValue(k, v) }

  let cfg = {
    hideEndCards: get(KEYS.hideEndCards, true),
    killAutoplay: get(KEYS.killAutoplay, true),
    dismissAysw: get(KEYS.dismissAysw, true)
  }

  if (cfg.hideEndCards && typeof GM_addStyle === 'function') {
    GM_addStyle('.ytp-ce-element,.ytp-endscreen-content{display:none!important}')
  }

  function toggle(key, label) {
    cfg[key] = !cfg[key]
    set(KEYS[key], cfg[key])
    // eslint-disable-next-line no-alert
    alert(`${label}: ${cfg[key] ? 'on' : 'off'}. Reload the tab to apply.`)
  }

  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('Toggle: hide end cards', () => toggle('hideEndCards', 'Hide end cards'))
    GM_registerMenuCommand('Toggle: kill autoplay', () => toggle('killAutoplay', 'Kill autoplay'))
    GM_registerMenuCommand('Toggle: auto-dismiss "Continue watching?"', () => toggle('dismissAysw', 'Auto-dismiss AYSW'))
  }

  // Turn off the in-player autoplay toggle on every SPA nav.
  function killAutoplay() {
    if (!cfg.killAutoplay) return
    const btn = document.querySelector('.ytp-autonav-toggle-button')
    if (!btn) return
    if (btn.getAttribute('aria-checked') === 'true') btn.click()
  }

  document.addEventListener('yt-navigate-finish', () => {
    // Toggle button mounts after the player; wait a beat.
    setTimeout(killAutoplay, 500)
    setTimeout(killAutoplay, 2000)
  })
  setTimeout(killAutoplay, 1500) // first load

  // Auto-dismiss "Video paused. Continue watching?" via mutation observer.
  function tryDismissAysw() {
    if (!cfg.dismissAysw) return
    const dialogs = document.querySelectorAll('yt-confirm-dialog-renderer')
    for (const d of dialogs) {
      if (d.offsetParent === null) continue // hidden
      const btns = d.querySelectorAll('button, tp-yt-paper-button, yt-button-renderer button')
      for (const b of btns) {
        const label = (b.textContent || '').trim().toLowerCase()
        if (label === 'yes' || label === 'continue' || label === 'keep watching') {
          b.click()
          return
        }
      }
    }
  }

  const mo = new MutationObserver(() => tryDismissAysw())
  mo.observe(document.documentElement, { childList: true, subtree: true })
})()
