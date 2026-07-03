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
// @homepageURL  https://github.com/chirag127/userscripts/tree/main/auto-reject-cookies
// @supportURL   https://github.com/chirag127/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts/main/auto-reject-cookies/auto-reject-cookies.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts/main/auto-reject-cookies/auto-reject-cookies.user.js
// ==/UserScript==

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
