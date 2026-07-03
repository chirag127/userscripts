// ==UserScript==
// @name         Add copy buttons to <pre><code> blocks
// @namespace    https://github.com/chirag127/userscripts
// @version      0.1.0
// @description  Inject a small "copy" button on every code block so you can grab the snippet without hand-selecting. One click copies innerText; button flashes "copied" for 1s.
// @author       chirag127
// @match        *://*/*
// @run-at       document-idle
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts/tree/main/add-code-copy-buttons
// @supportURL   https://github.com/chirag127/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts/main/add-code-copy-buttons/add-code-copy-buttons.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts/main/add-code-copy-buttons/add-code-copy-buttons.user.js
// ==/UserScript==

(() => {
  'use strict'

  const MARK = 'data-ccb-injected'
  const SELECTOR = 'pre code, pre.prettyprint, div.highlight pre'

  const enabled = GM_getValue('enabled', true)
  GM_registerMenuCommand(
    `Copy buttons: ${enabled ? 'ON' : 'OFF'} — click to toggle`,
    () => { GM_setValue('enabled', !enabled); location.reload() }
  )
  if (!enabled) return

  // Resolve the visual container to position the button against. For `pre code`
  // we want the <pre>, not the inner <code>, so absolute positioning covers the
  // whole block. For `div.highlight pre` the <pre> itself is fine.
  function hostOf(el) {
    if (el.tagName === 'CODE' && el.parentElement && el.parentElement.tagName === 'PRE') return el.parentElement
    return el
  }

  function makeButton(codeEl) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.textContent = 'copy'
    Object.assign(btn.style, {
      position: 'absolute',
      top: '6px',
      right: '6px',
      zIndex: '2147483646',
      padding: '2px 8px',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      fontSize: '11px',
      lineHeight: '1.4',
      color: '#fff',
      background: 'rgba(0, 0, 0, 0.55)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '4px',
      cursor: 'pointer',
      opacity: '0.7',
    })
    btn.addEventListener('mouseenter', () => { btn.style.opacity = '1' })
    btn.addEventListener('mouseleave', () => { btn.style.opacity = '0.7' })
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      GM_setClipboard(codeEl.innerText)
      const prev = btn.textContent
      btn.textContent = 'copied'
      setTimeout(() => { btn.textContent = prev }, 1000)
    })
    return btn
  }

  function inject(el) {
    const host = hostOf(el)
    if (host.hasAttribute(MARK)) return
    host.setAttribute(MARK, '1')
    // Only override position if the host is static — don't fight a host page
    // that already positions its <pre> relatively/absolutely.
    const pos = getComputedStyle(host).position
    if (pos === 'static') host.style.position = 'relative'
    host.appendChild(makeButton(el))
  }

  function scan(root) {
    root.querySelectorAll(SELECTOR).forEach(inject)
  }

  scan(document)

  // Handle SPA route changes + late-rendered code blocks (docs sites, Discourse,
  // GitHub file view, etc.). Debounced via microtask coalescing.
  let pending = false
  const mo = new MutationObserver(() => {
    if (pending) return
    pending = true
    queueMicrotask(() => { pending = false; scan(document) })
  })
  mo.observe(document.body, { childList: true, subtree: true })
})()
