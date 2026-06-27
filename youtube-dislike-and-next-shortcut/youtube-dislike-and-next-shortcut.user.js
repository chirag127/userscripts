// ==UserScript==
// @name         YouTube — Dislike & next (X)
// @namespace    https://github.com/oriz-org/userscripts
// @version      0.1.0
// @description  Press X to dislike the current video AND immediately skip to the next one. Key is remappable via the Tampermonkey menu.
// @author       chirag127
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @run-at       document-end
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @license      MIT
// @homepageURL  https://github.com/oriz-org/userscripts/tree/main/youtube-dislike-and-next-shortcut
// @supportURL   https://github.com/oriz-org/userscripts/issues
// @updateURL    https://github.com/oriz-org/userscripts/raw/main/youtube-dislike-and-next-shortcut/youtube-dislike-and-next-shortcut.user.js
// @downloadURL  https://github.com/oriz-org/userscripts/raw/main/youtube-dislike-and-next-shortcut/youtube-dislike-and-next-shortcut.user.js
// ==/UserScript==

(() => {
  'use strict'

  const DEFAULT_KEY = 'x'
  const STORAGE_KEY = 'yt-dislike-and-next-key'
  // Delay between clicking Dislike and clicking Next. YouTube's dislike
  // mutation needs a tick to land on the page state; jumping next instantly
  // sometimes loses the dislike.
  const DELAY_MS = 150

  const hasGM = typeof GM_getValue === 'function' && typeof GM_setValue === 'function'

  function loadKey() {
    if (!hasGM) return DEFAULT_KEY
    const v = GM_getValue(STORAGE_KEY, DEFAULT_KEY)
    return (typeof v === 'string' && v.length === 1) ? v.toLowerCase() : DEFAULT_KEY
  }

  function saveKey(value) {
    if (!hasGM) return
    GM_setValue(STORAGE_KEY, value.toLowerCase())
  }

  let key = loadKey()

  function promptForKey(current) {
    // eslint-disable-next-line no-alert
    const input = prompt(`Set the "Dislike & next" key.\nCurrent: ${current}\nType a single letter (a-z) or digit:`, current)
    if (input == null) return null
    const k = input.trim().toLowerCase()
    if (!/^[a-z0-9]$/.test(k)) {
      // eslint-disable-next-line no-alert
      alert(`Invalid key: "${input}". Must be a single letter (a-z) or digit. Keeping current: ${current}.`)
      return null
    }
    return k
  }

  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('Set "Dislike & next" key (default X)', () => {
      const fresh = promptForKey(key)
      if (fresh == null) return
      key = fresh
      saveKey(fresh)
      // eslint-disable-next-line no-alert
      alert(`"Dislike & next" key set to: ${fresh}`)
    })
    GM_registerMenuCommand('Reset key to default (X)', () => {
      key = DEFAULT_KEY
      saveKey(DEFAULT_KEY)
      // eslint-disable-next-line no-alert
      alert('Reset: Dislike & next = X')
    })
  }

  function isTyping(target) {
    if (!target) return false
    const tag = target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return true
    if (target.isContentEditable) return true
    return false
  }

  const DISLIKE_SELECTORS = [
    'dislike-button-view-model button',
    'ytd-toggle-button-renderer #segmented-dislike-button button',
    'ytd-segmented-like-dislike-button-renderer #dislike-button button',
    'button[aria-label^="dislike" i]',
    'button[aria-label^="I dislike this" i]',
  ]

  function clickDislike() {
    for (const sel of DISLIKE_SELECTORS) {
      const btn = document.querySelector(sel)
      if (btn) {
        // Skip if it's already pressed — we don't want to TOGGLE OFF a dislike.
        // YouTube exposes that state via aria-pressed on the modern button,
        // and via the parent toggle's class on legacy renderers.
        const pressed = btn.getAttribute('aria-pressed')
        if (pressed === 'true') {
          // Already disliked — don't undo it. Treat as success for the chain.
          return true
        }
        btn.click()
        return true
      }
    }
    return false
  }

  function clickNext() {
    const btn = document.querySelector('.ytp-next-button')
    if (btn && !btn.disabled && btn.getAttribute('aria-disabled') !== 'true') {
      btn.click()
      return true
    }
    return false
  }

  function disabledAndAdvance() {
    const disliked = clickDislike()
    // Chain after a short delay so YouTube's mutation reflects the dislike
    // before we navigate away. If the dislike button isn't found, we still
    // try to advance — the user pressed the key, give them the navigation.
    setTimeout(() => {
      const advanced = clickNext()
      if (!disliked && !advanced) {
        // Both failed — surface so the user knows nothing happened.
        console.warn('[yt-dislike-and-next] no dislike or next button found on this page')
      }
    }, DELAY_MS)
  }

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
    if (isTyping(e.target)) return
    if (e.key.toLowerCase() !== key) return
    e.preventDefault()
    e.stopPropagation()
    disabledAndAdvance()
  }, true)
})()
