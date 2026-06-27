// ==UserScript==
// @name         YouTube — Nav shortcuts (next + previous)
// @namespace    https://github.com/oriz-org/userscripts
// @version      0.1.0
// @description  Combined: press N to jump to the next video, P to the previous. Both keys are remappable via the Tampermonkey menu.
// @author       chirag127
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @run-at       document-end
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @license      MIT
// @homepageURL  https://github.com/oriz-org/userscripts/tree/main/youtube-nav-shortcuts
// @supportURL   https://github.com/oriz-org/userscripts/issues
// @updateURL    https://github.com/oriz-org/userscripts/raw/main/youtube-nav-shortcuts/youtube-nav-shortcuts.user.js
// @downloadURL  https://github.com/oriz-org/userscripts/raw/main/youtube-nav-shortcuts/youtube-nav-shortcuts.user.js
// ==/UserScript==

(() => {
  'use strict'

  const DEFAULTS = { next: 'n', prev: 'p' }
  const STORAGE_KEYS = { next: 'yt-nav-key-next', prev: 'yt-nav-key-prev' }

  const hasGM = typeof GM_getValue === 'function' && typeof GM_setValue === 'function'

  function loadKey(name) {
    if (!hasGM) return DEFAULTS[name]
    const v = GM_getValue(STORAGE_KEYS[name], DEFAULTS[name])
    return (typeof v === 'string' && v.length === 1) ? v.toLowerCase() : DEFAULTS[name]
  }

  function saveKey(name, value) {
    if (!hasGM) return
    GM_setValue(STORAGE_KEYS[name], value.toLowerCase())
  }

  let keys = { next: loadKey('next'), prev: loadKey('prev') }

  function promptForKey(label, current) {
    // eslint-disable-next-line no-alert
    const input = prompt(`Set the key for "${label}".\nCurrent: ${current}\nType a single letter (a-z) or digit:`, current)
    if (input == null) return null
    const k = input.trim().toLowerCase()
    if (!/^[a-z0-9]$/.test(k)) {
      // eslint-disable-next-line no-alert
      alert(`Invalid key: "${input}". Must be a single letter (a-z) or digit. Keeping current: ${current}.`)
      return null
    }
    return k
  }

  function reconfigure(name, label) {
    const fresh = promptForKey(label, keys[name])
    if (fresh == null) return
    keys[name] = fresh
    saveKey(name, fresh)
    // eslint-disable-next-line no-alert
    alert(`${label} key set to: ${fresh}`)
  }

  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('Set "Next video" key (default N)', () => reconfigure('next', 'Next video'))
    GM_registerMenuCommand('Set "Previous video" key (default P)', () => reconfigure('prev', 'Previous video'))
    GM_registerMenuCommand('Reset both keys to default (N / P)', () => {
      keys = { ...DEFAULTS }
      saveKey('next', DEFAULTS.next)
      saveKey('prev', DEFAULTS.prev)
      // eslint-disable-next-line no-alert
      alert('Reset: next=N, prev=P')
    })
  }

  function isTyping(target) {
    if (!target) return false
    const tag = target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return true
    if (target.isContentEditable) return true
    return false
  }

  function clickButton(selector) {
    const btn = document.querySelector(selector)
    if (!btn) return false
    if (btn.disabled) return false
    if (btn.getAttribute('aria-disabled') === 'true') return false
    btn.click()
    return true
  }

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
    if (isTyping(e.target)) return
    const k = e.key.toLowerCase()
    if (k === keys.next) {
      if (clickButton('.ytp-next-button')) {
        e.preventDefault()
        e.stopPropagation()
      }
    } else if (k === keys.prev) {
      if (clickButton('.ytp-prev-button')) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
  }, true)
})()
