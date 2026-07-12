// ==UserScript==
// @name         Reopen recent URLs (cross-tab history)
// @namespace    https://github.com/chirag127/userscripts
// @version      0.1.0
// @description  Keep a rolling ring-buffer of the last 30 URLs you closed across all tabs. Menu command opens an overlay listing them; click any to reopen in a new tab. Survives tab-close and browser restart via GM_setValue.
// @author       chirag127
// @match        *://*/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_openInTab
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts/tree/main/scripts/reopen-recent-urls
// @supportURL   https://github.com/chirag127/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/reopen-recent-urls/reopen-recent-urls.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/reopen-recent-urls/reopen-recent-urls.user.js
// ==/UserScript==

(() => {
  'use strict'

  const KEY = 'recent-urls'
  const MAX = 30

  function load() {
    const v = GM_getValue(KEY, [])
    return Array.isArray(v) ? v : []
  }

  function save(list) {
    GM_setValue(KEY, list.slice(0, MAX))
  }

  // Push current page onto the ring buffer, dedupe by URL (most-recent wins).
  function record() {
    const url = location.href
    if (!url || url.startsWith('about:') || url.startsWith('chrome:')) return
    const list = load().filter(e => e.url !== url)
    list.unshift({ url, title: document.title || url, timestamp: Date.now() })
    save(list)
  }

  // beforeunload fires on tab close, navigation, refresh — captures the URL the
  // user is leaving. pagehide covers Safari/bfcache cases where beforeunload skips.
  window.addEventListener('beforeunload', record)
  window.addEventListener('pagehide', record)

  // ---- overlay ------------------------------------------------------------
  let overlay = null

  function closeOverlay() {
    if (overlay) { overlay.remove(); overlay = null }
  }

  function fmtAge(ts) {
    const s = Math.floor((Date.now() - ts) / 1000)
    if (s < 60) return `${s}s ago`
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    return `${Math.floor(s / 86400)}d ago`
  }

  function showOverlay() {
    closeOverlay()
    const list = load()
    overlay = document.createElement('div')
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', zIndex: '2147483647',
      background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    })
    overlay.addEventListener('click', e => { if (e.target === overlay) closeOverlay() })

    const panel = document.createElement('div')
    Object.assign(panel.style, {
      background: '#1e1e1e', color: '#eee', borderRadius: '8px',
      padding: '16px', maxWidth: '720px', width: '90vw',
      maxHeight: '80vh', overflow: 'auto',
      boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
    })
    panel.innerHTML = `<div style="font-size:14px;font-weight:600;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">
      <span>Recent URLs (${list.length})</span>
      <span style="font-size:12px;opacity:0.6">Esc / click outside to close</span>
    </div>`

    if (!list.length) {
      const empty = document.createElement('div')
      empty.textContent = 'No URLs recorded yet. Close some tabs and try again.'
      empty.style.cssText = 'opacity:0.6;padding:20px;text-align:center'
      panel.appendChild(empty)
    } else {
      list.forEach(e => {
        const row = document.createElement('a')
        row.href = e.url
        row.style.cssText = 'display:block;padding:8px 10px;border-radius:4px;text-decoration:none;color:#eee;cursor:pointer;border-bottom:1px solid #333'
        row.innerHTML = `<div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></div>
          <div style="font-size:11px;opacity:0.55;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px"></div>`
        row.firstElementChild.textContent = e.title
        row.lastElementChild.textContent = `${fmtAge(e.timestamp)} — ${e.url}`
        row.addEventListener('mouseenter', () => { row.style.background = '#2a2a2a' })
        row.addEventListener('mouseleave', () => { row.style.background = '' })
        row.addEventListener('click', ev => {
          ev.preventDefault()
          GM_openInTab(e.url, { active: true, insert: true })
          closeOverlay()
        })
        panel.appendChild(row)
      })
    }

    overlay.appendChild(panel)
    document.body.appendChild(overlay)
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay) closeOverlay()
  })

  GM_registerMenuCommand('Show recent URLs', showOverlay)
  GM_registerMenuCommand('Clear recent URLs', () => {
    save([])
    if (overlay) showOverlay()
  })
})()
