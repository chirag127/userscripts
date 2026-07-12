// ==UserScript==
// @name         Auto-reject cookie banners
// @namespace    https://github.com/chirag127/userscripts
// @version      0.1.0
// @description  Auto-click the "reject all" button on cookie consent banners (OneTrust, Cookiebot, TrustArc, Osano, Didomi + generic fallbacks). Why: opt-out is the sane default; manual clicks per site are noise.
// @author       chirag127
// @match        *://*/*
// @run-at       document-idle
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts/blob/main/scripts/auto-reject-cookies.user.js
// @supportURL   https://github.com/chirag127/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/auto-reject-cookies.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/auto-reject-cookies.user.js
// ==/UserScript==

/*
README (folded from auto-reject-cookies/README.md during flat-restructure 2026-07-12)

# auto-reject-cookies

[⭐ Star this Repo ⭐](https://github.com/chirag127/userscripts)

Auto-clicks the "reject all" button on cookie consent banners so you don't have to. Covers the major CMPs (OneTrust, Cookiebot, TrustArc, Osano, Didomi) plus generic `aria-label` and text-content fallbacks for the long tail.

## Install

[Click here to install in Tampermonkey / Violentmonkey / ScriptCat](https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/auto-reject-cookies.user.js)

Auto-updates on every push via the `@updateURL` metadata.

## Behavior

1. Page loads → at `document-idle` the script scans for a reject-all button
2. Retries every 500ms for 5s to catch banners mounted late (React/Vue/GTM injections)
3. First visible match wins — clicks it and stops

## Settings

Open the Tampermonkey/Violentmonkey/ScriptCat menu (puzzle-piece icon → this script's name):

| Menu entry | What it does |
|---|---|
| `Auto-reject: ON/OFF` | Kill switch — turn off to see banners normally |
| `Log hits to console: ON/OFF` | Print which selector/text matched, for debugging |

## Known limitations

- **Shadow-DOM banners** — `querySelectorAll` doesn't pierce closed shadow roots. Some CMPs (rare) hide their DOM this way.
- **Iframe banners** — cross-origin iframes are out of reach. Same-origin iframes need `@match` per host or an explicit iterate.
- **False positives on `.call`** — TrustArc uses the class `.call` which is vague; if a non-CMP site ships a `.call` button that happens to be visible early, we'd click it. Rare in practice.

## License

MIT. See [LICENSE](../LICENSE).
*/

(() => {
  'use strict'

  // ---- settings -----------------------------------------------------------
  const settings = {
    enabled: GM_getValue('enabled', true),
    logHits: GM_getValue('logHits', false),
  }

  function persist(key, value) {
    settings[key] = value
    GM_setValue(key, value)
  }

  GM_registerMenuCommand(
    `Auto-reject: ${settings.enabled ? 'ON' : 'OFF'} — click to toggle`,
    () => { persist('enabled', !settings.enabled); location.reload() }
  )
  GM_registerMenuCommand(
    `Log hits to console: ${settings.logHits ? 'ON' : 'OFF'} — click to toggle`,
    () => { persist('logHits', !settings.logHits); location.reload() }
  )

  if (!settings.enabled) return

  // ---- selectors ----------------------------------------------------------
  // Vendor-specific first (fewest false positives), then generic fallbacks.
  const SELECTORS = [
    '#onetrust-reject-all-handler',
    'button[id*="reject" i]',
    '#CybotCookiebotDialogBodyButtonDecline',
    '.call',                            // TrustArc "Cookie Preferences" reject
    '.osano-cm-denyAll',
    '.didomi-continue-without-agreeing',
    '[aria-label*="reject" i]',
    '[aria-label*="decline" i]',
  ]

  // Text-content fallback — only checked if selector pass finds nothing.
  const TEXT_PATTERNS = [
    /^\s*reject all\s*$/i,
    /^\s*decline all\s*$/i,
    /^\s*only necessary\s*$/i,
    /^\s*reject non-essential\s*$/i,
  ]

  function log(...args) {
    if (settings.logHits) console.log('[auto-reject-cookies]', ...args)
  }

  function isVisible(el) {
    if (!el || !el.isConnected) return false
    const r = el.getBoundingClientRect()
    if (r.width < 2 || r.height < 2) return false
    const cs = getComputedStyle(el)
    return cs.visibility !== 'hidden' && cs.display !== 'none' && cs.pointerEvents !== 'none'
  }

  function tryClick() {
    for (const sel of SELECTORS) {
      const el = document.querySelector(sel)
      if (el && isVisible(el)) {
        el.click()
        log('clicked selector', sel)
        return true
      }
    }
    // Text-content fallback across buttons + role=button elements.
    const candidates = document.querySelectorAll('button, [role="button"], a')
    for (const el of candidates) {
      if (!isVisible(el)) continue
      const text = (el.textContent || '').trim()
      if (!text || text.length > 40) continue
      if (TEXT_PATTERNS.some(re => re.test(text))) {
        el.click()
        log('clicked text', text)
        return true
      }
    }
    return false
  }

  // Retry every 500ms for 5s — banners often mount after document-idle
  // (React/Vue mounts, GTM tag manager injections, iframe embeds).
  let attempts = 0
  const MAX_ATTEMPTS = 10
  const iv = setInterval(() => {
    attempts++
    if (tryClick() || attempts >= MAX_ATTEMPTS) clearInterval(iv)
  }, 500)
  tryClick()
})()
