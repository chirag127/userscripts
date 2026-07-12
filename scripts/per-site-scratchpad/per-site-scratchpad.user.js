// ==UserScript==
// @name         Per-domain persistent scratchpad
// @namespace    https://github.com/chirag127/userscripts
// @version      0.1.0
// @description  Fixed-position textarea per hostname. Notes persist across page loads via GM storage. Toggle from menu, Esc to close. Useful for jotting selectors, TODOs, or credentials-in-progress without a second tab.
// @author       chirag127
// @match        *://*/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts/tree/main/scripts/per-site-scratchpad
// @supportURL   https://github.com/chirag127/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/per-site-scratchpad/per-site-scratchpad.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/per-site-scratchpad/per-site-scratchpad.user.js
// ==/UserScript==

(() => {
  'use strict'

  const KEY = 'scratchpad:' + location.hostname
  const OPEN_KEY = 'scratchpad-open:' + location.hostname
  let pad = null
  let saveTimer = null

  function build() {
    if (pad) return pad
    pad = document.createElement('textarea')
    pad.value = GM_getValue(KEY, '')
    pad.spellcheck = false
    Object.assign(pad.style, {
      position: 'fixed',
      right: '16px',
      bottom: '16px',
      width: '320px',
      height: '200px',
      minWidth: '200px',
      minHeight: '80px',
      maxWidth: '90vw',
      maxHeight: '80vh',
      zIndex: '2147483647',
      padding: '10px',
      border: '1px solid #444',
      borderRadius: '6px',
      background: 'rgba(20, 20, 20, 0.92)',
      color: '#eee',
      font: '13px/1.4 ui-monospace, Menlo, Consolas, monospace',
      resize: 'both',
      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
      outline: 'none',
    })
    pad.placeholder = `scratchpad — ${location.hostname}`

    // Debounce writes. 500ms feels instant, avoids hammering GM_setValue on fast typing.
    pad.addEventListener('input', () => {
      clearTimeout(saveTimer)
      saveTimer = setTimeout(() => GM_setValue(KEY, pad.value), 500)
    })

    // Esc closes; blur first so host-page shortcuts don't hijack.
    pad.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); hide() }
    })

    document.body.appendChild(pad)
    return pad
  }

  function show() {
    build().style.display = 'block'
    pad.focus()
    GM_setValue(OPEN_KEY, true)
  }

  function hide() {
    if (pad) pad.style.display = 'none'
    GM_setValue(OPEN_KEY, false)
  }

  function toggle() {
    if (!pad || pad.style.display === 'none') show()
    else hide()
  }

  GM_registerMenuCommand('Toggle scratchpad', toggle)

  // Restore visibility state per-host.
  if (GM_getValue(OPEN_KEY, false)) show()
})()
