// ==UserScript==
// @name         Restore right-click + selection + hotkeys
// @namespace    https://github.com/chirag127/userscripts
// @version      0.1.0
// @description  Neutralises pages that block right-click, text selection, copy/cut, drag, and keyboard shortcuts. Stops the hijack at document-start before the host page's handlers register.
// @author       chirag127
// @match        *://*/*
// @run-at       document-start
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts/tree/main/anti-hijack-guard
// @supportURL   https://github.com/chirag127/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts/main/anti-hijack-guard/anti-hijack-guard.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts/main/anti-hijack-guard/anti-hijack-guard.user.js
// ==/UserScript==

(() => {
  'use strict'

  // Per-host disable. Key is `disabled:<host>`; true = script no-ops on this host.
  const host = location.hostname
  const key = `disabled:${host}`
  const disabled = GM_getValue(key, false)

  GM_registerMenuCommand(
    `Anti-hijack: ${disabled ? 'OFF' : 'ON'} on ${host} — click to toggle`,
    () => { GM_setValue(key, !disabled); location.reload() }
  )

  if (disabled) return

  // Events the hijack pages hook to suppress user actions. Listen in the capture
  // phase and stopImmediatePropagation so sibling capture-phase listeners on the
  // same target never fire.
  const events = ['contextmenu', 'selectstart', 'copy', 'cut', 'dragstart', 'mousedown', 'mouseup', 'keydown']
  const kill = (e) => e.stopImmediatePropagation()
  for (const evt of events) window.addEventListener(evt, kill, true)

  // Some pages assign `document.oncontextmenu = () => false` (or similar for
  // onselectstart / oncopy). Redefine the setters to no-op so late assignments
  // can't re-enable the block.
  const noopProps = ['oncontextmenu', 'onselectstart', 'oncopy', 'oncut', 'ondragstart', 'onmousedown', 'onkeydown']
  for (const prop of noopProps) {
    try {
      Object.defineProperty(document, prop, { configurable: true, get: () => null, set: () => {} })
      Object.defineProperty(window, prop, { configurable: true, get: () => null, set: () => {} })
    } catch { /* some hosts freeze these — the capture-phase listener still wins */ }
  }
})()
