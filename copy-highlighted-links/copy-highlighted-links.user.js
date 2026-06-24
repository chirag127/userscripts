// ==UserScript==
// @name         Copy highlighted links
// @namespace    https://github.com/oriz-org/userscripts
// @version      0.1.0
// @description  Copy URLs of every link found in the current text selection to the clipboard (one per line). Tampermonkey menu command — same behavior as the "Copy Highlighted Links" Chrome extension by CraftedIntuition, plus plain-text URL detection.
// @author       chirag127
// @match        *://*/*
// @run-at       document-end
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// @license      MIT
// @homepageURL  https://github.com/oriz-org/userscripts/tree/main/copy-highlighted-links
// @supportURL   https://github.com/oriz-org/userscripts/issues
// @updateURL    https://github.com/oriz-org/userscripts/raw/main/copy-highlighted-links/copy-highlighted-links.user.js
// @downloadURL  https://github.com/oriz-org/userscripts/raw/main/copy-highlighted-links/copy-highlighted-links.user.js
// ==/UserScript==

(() => {
  'use strict'

  // Matches http://, https://, and bare www.* URLs. Allows the common URL char set
  // and stops at whitespace, common surrounding punctuation, and quotes/brackets.
  // (Same regex as `open-links-in-selection` for behavior parity.)
  const URL_RE = /\b((?:https?:\/\/|www\.)[^\s<>"'`()\[\]{},]+[^\s<>"'`()\[\]{},.;:!?])/gi

  // Identical collection logic to `open-links-in-selection.user.js`.
  // Deliberately duplicated rather than sharing a module — userscript managers
  // don't have a reliable cross-script import story, and copy-paste is auditable.
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
    const activeEl = document.activeElement
    const inTextarea =
      activeEl && (activeEl.tagName === 'TEXTAREA' || (activeEl.tagName === 'INPUT' && activeEl.type === 'text'))

    if (!inTextarea) {
      for (let i = 0; i < sel.rangeCount; i++) {
        const range = sel.getRangeAt(i)
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
        // Also walk ancestors of both endpoints — selection started/ended INSIDE
        // a single <a> won't appear in commonAncestorContainer's descendants.
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

  async function writeClipboard(text) {
    // Prefer GM_setClipboard when available — bypasses navigator.clipboard
    // gesture requirement and works on http:// pages too.
    if (typeof GM_setClipboard === 'function') {
      try { GM_setClipboard(text, 'text'); return true } catch { /* fall through */ }
    }
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // execCommand fallback for old http:// pages where Clipboard API is blocked.
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      let ok = false
      try { ok = document.execCommand('copy') } catch { /* ignore */ }
      ta.remove()
      return ok
    }
  }

  // Tiny toast — minimal styling, max-z, gone after 2.5s.
  function toast(message) {
    const el = document.createElement('div')
    Object.assign(el.style, {
      position: 'fixed',
      left: '50%',
      bottom: '20px',
      transform: 'translateX(-50%)',
      zIndex: '2147483647',
      padding: '12px 20px',
      borderRadius: '8px',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      fontSize: '14px',
      fontWeight: '600',
      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
      pointerEvents: 'none',
      transition: 'opacity 250ms ease-in-out',
      opacity: '0',
    })
    el.textContent = message
    document.body.appendChild(el)
    requestAnimationFrame(() => { el.style.opacity = '1' })
    setTimeout(() => {
      el.style.opacity = '0'
      setTimeout(() => el.remove(), 300)
    }, 2500)
  }

  async function run() {
    const urls = collectLinksFromSelection()
    if (urls.length === 0) {
      toast('No links found in selection')
      return
    }
    const payload = urls.join('\n')
    const ok = await writeClipboard(payload)
    if (ok) {
      toast(`Copied ${urls.length} link${urls.length === 1 ? '' : 's'} to clipboard`)
    } else {
      toast('Clipboard copy failed (page may block clipboard access)')
      console.warn('[copy-highlighted-links] failed to write clipboard; URLs:', urls)
    }
  }

  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('Copy highlighted links', run, { accessKey: 'c' })
  }

  // Devtools-friendly global for keybind bindings via Tampermonkey's UI.
  // @ts-ignore — userscript global
  window.__copyHighlightedLinks = run
})()
