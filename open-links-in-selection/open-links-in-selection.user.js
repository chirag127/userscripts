// ==UserScript==
// @name         Open all links in selection
// @namespace    https://github.com/oriz-org/userscripts
// @version      0.1.0
// @description  Tampermonkey menu command — opens every link found in the current text selection in new tabs. Catches both <a href> elements AND plain-text URLs (http://, https://, www.).
// @author       chirag127
// @match        *://*/*
// @run-at       document-end
// @grant        GM_registerMenuCommand
// @license      MIT
// @homepageURL  https://github.com/oriz-org/userscripts/tree/main/open-links-in-selection
// @supportURL   https://github.com/oriz-org/userscripts/issues
// @updateURL    https://github.com/oriz-org/userscripts/raw/main/open-links-in-selection/open-links-in-selection.user.js
// @downloadURL  https://github.com/oriz-org/userscripts/raw/main/open-links-in-selection/open-links-in-selection.user.js
// ==/UserScript==

(() => {
  'use strict'

  const CONFIRM_THRESHOLD = 5

  // Matches http://, https://, and bare www.* URLs. Allows the common URL char set
  // and stops at whitespace, common surrounding punctuation, and quotes/brackets.
  const URL_RE = /\b((?:https?:\/\/|www\.)[^\s<>"'`()\[\]{},]+[^\s<>"'`()\[\]{},.;:!?])/gi

  function collectLinksFromSelection() {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return []

    const found = new Set()

    // 1. Plain-text URLs inside the selection's stringified content.
    const text = sel.toString()
    if (text) {
      for (const m of text.matchAll(URL_RE)) {
        let u = m[1]
        if (u.startsWith('www.')) u = 'https://' + u
        found.add(u)
      }
    }

    // 2. <a href> elements that intersect the selection range.
    // Walk every range (selections can have multiple under some browsers / textarea cases)
    // and collect any anchor whose own range intersects.
    const activeEl = document.activeElement
    const inTextarea =
      activeEl && (activeEl.tagName === 'TEXTAREA' || (activeEl.tagName === 'INPUT' && activeEl.type === 'text'))

    if (!inTextarea) {
      for (let i = 0; i < sel.rangeCount; i++) {
        const range = sel.getRangeAt(i)
        // Find anchors whose own range overlaps this selection range
        const root = range.commonAncestorContainer
        const rootEl = root.nodeType === Node.ELEMENT_NODE ? root : root.parentElement
        if (!rootEl) continue
        const anchors = rootEl.querySelectorAll('a[href]')
        for (const a of anchors) {
          if (!range.intersectsNode(a)) continue
          const href = a.href
          if (!href) continue
          // Skip javascript:, mailto:, tel:, hash-only anchors
          if (/^(javascript:|mailto:|tel:|#)/i.test(href)) continue
          found.add(href)
        }
        // Also: if the selection is INSIDE a single anchor (selectstart inside <a>),
        // its anchor may not be picked up by querySelectorAll on commonAncestorContainer.
        // Check ancestors of both endpoints.
        for (const node of [range.startContainer, range.endContainer]) {
          let el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement
          while (el && el !== document.body) {
            if (el.tagName === 'A' && el.href && !/^(javascript:|mailto:|tel:|#)/i.test(el.href)) {
              found.add(el.href)
              break
            }
            el = el.parentElement
          }
        }
      }
    }

    return [...found]
  }

  function openAll(urls) {
    if (urls.length === 0) {
      alert('Open all links: no links found in selection.')
      return
    }
    if (urls.length >= CONFIRM_THRESHOLD) {
      if (!confirm(`Open ${urls.length} tabs?`)) return
    }
    // Open with a tiny stagger to dodge naive popup blockers.
    let i = 0
    const tick = () => {
      if (i >= urls.length) return
      const url = urls[i++]
      try {
        window.open(url, '_blank', 'noopener,noreferrer')
      } catch (e) {
        console.error('[open-links-in-selection] failed to open', url, e)
      }
      setTimeout(tick, 0)
    }
    tick()
  }

  function run() {
    const urls = collectLinksFromSelection()
    openAll(urls)
  }

  // Register a Tampermonkey menu command.
  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('Open all links in selection', run, { accessKey: 'o' })
  }

  // Fallback for engines without the GM API: expose a global so a user-defined
  // keybind can still call it from devtools.
  // @ts-ignore — userscript global
  window.__openLinksInSelection = run
})()
