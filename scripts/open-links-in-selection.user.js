// ==UserScript==
// @name         Open all links in selection
// @namespace    https://github.com/chirag127/userscripts-script
// @version      0.1.3
// @description  Tampermonkey menu command — opens every link found in the current text selection in new tabs. Catches both <a href> elements AND plain-text URLs (http://, https://, www.).
// @author       chirag127
// @match        *://*/*
// @run-at       document-end
// @grant        GM_registerMenuCommand
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts-script/blob/main/scripts/open-links-in-selection.user.js
// @supportURL   https://github.com/chirag127/userscripts-script/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/open-links-in-selection.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/open-links-in-selection.user.js
// ==/UserScript==

/*
README (folded from open-links-in-selection/README.md during flat-restructure 2026-07-12)

# open-links-in-selection

Userscript that **opens every link found in the current selection** in new tabs.

Triggered via the Tampermonkey / Violentmonkey / ScriptCat extension menu command (click the extension icon → "Open all links in selection"). Catches:

- `<a href>` anchors that intersect the selection (including the case where the selection is inside a single anchor)
- Plain-text URLs in the selected text: `http://...`, `https://...`, bare `www....` (auto-prefixed with `https://`)

Skips: `javascript:`, `mailto:`, `tel:`, and hash-only anchors.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) (or Violentmonkey / ScriptCat).
2. Click → **[install](https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/open-links-in-selection.user.js)**

## Use

1. Select text on any page (or in a textarea / contenteditable).
2. Click the Tampermonkey extension icon → **"Open all links in selection"**.
3. If ≥ 5 links are found, you'll see a confirm dialog first.

## Settings

The confirm-threshold is hardcoded at 5 in the source. Edit `CONFIRM_THRESHOLD` near the top of the script if you want different.

## Caveats

- **Popup blocker**: opening many tabs at once from a single user gesture can trip a browser's popup blocker. The script staggers `window.open` calls with `setTimeout(0)` between each, which usually avoids the block in Chrome / Edge. If it still trips, allow popups for the site in your browser settings.
- **Textareas / contenteditable**: anchors don't exist inside `<textarea>`, so only the plain-text URL regex runs in that case.
- **iframes**: the script runs in the top window. Selections inside a cross-origin iframe are invisible to it.
*/

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
