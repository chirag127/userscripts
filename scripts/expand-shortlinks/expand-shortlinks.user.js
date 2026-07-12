// ==UserScript==
// @name         Preview shortlinks on hover
// @namespace    https://github.com/chirag127/userscripts
// @version      0.1.0
// @description  Hover a bit.ly / t.co / tinyurl / etc. link and see the resolved destination in a tooltip before clicking. Avoids opening blind shorteners that may point to malware or trackers.
// @author       chirag127
// @match        *://*/*
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @connect      *
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts/tree/main/scripts/expand-shortlinks
// @supportURL   https://github.com/chirag127/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/expand-shortlinks/expand-shortlinks.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/expand-shortlinks/expand-shortlinks.user.js
// ==/UserScript==

(() => {
  'use strict'

  const SHORT_HOSTS = new Set([
    'bit.ly', 't.co', 'goo.gl', 'tinyurl.com', 'ow.ly', 'is.gd', 'buff.ly',
    'dlvr.it', 'fb.me', 'youtu.be', 'amzn.to', 'tiny.cc', 'shorturl.at',
    'rebrand.ly', 'rb.gy', 'cutt.ly',
  ])
  const CACHE_PREFIX = 'esl:'
  const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000  // 7d
  const MAX_HOPS = 10
  const HOVER_DELAY_MS = 250

  const enabled = () => GM_getValue('enabled', true)
  GM_registerMenuCommand(
    `Expand on hover: ${enabled() ? 'ON' : 'OFF'} — click to toggle`,
    () => { GM_setValue('enabled', !enabled()); location.reload() }
  )

  function isShort(href) {
    try { return SHORT_HOSTS.has(new URL(href, location.href).hostname.toLowerCase()) }
    catch { return false }
  }

  // Follow Location: chain via HEAD; some shorteners reject HEAD → fall back to GET.
  function resolve(url, hops = 0) {
    return new Promise((done) => {
      if (hops >= MAX_HOPS) return done(url)
      GM_xmlhttpRequest({
        method: hops === 0 ? 'HEAD' : 'HEAD',
        url,
        redirect: 'manual',
        onload: (r) => {
          const loc = /location:\s*(.+)/i.exec(r.responseHeaders || '')
          if (loc && loc[1]) {
            const next = new URL(loc[1].trim(), url).href
            if (next !== url) return resolve(next, hops + 1).then(done)
          }
          done(url)
        },
        onerror: () => done(url),
        ontimeout: () => done(url),
        timeout: 8000,
      })
    })
  }

  async function resolveCached(url) {
    const key = CACHE_PREFIX + url
    const hit = GM_getValue(key, null)
    if (hit && Date.now() - hit.t < CACHE_TTL_MS) return hit.v
    const final = await resolve(url)
    GM_setValue(key, { t: Date.now(), v: final })
    return final
  }

  // Single reusable tooltip, positioned near the hovered anchor.
  let tipEl = null
  function tip() {
    if (tipEl) return tipEl
    tipEl = document.createElement('div')
    Object.assign(tipEl.style, {
      position: 'fixed', zIndex: '2147483647', padding: '6px 10px',
      background: 'rgba(0,0,0,0.85)', color: '#fff', borderRadius: '6px',
      font: '12px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif',
      maxWidth: '480px', wordBreak: 'break-all', pointerEvents: 'none',
      boxShadow: '0 4px 14px rgba(0,0,0,0.35)', display: 'none',
    })
    document.body.appendChild(tipEl)
    return tipEl
  }
  function showTip(anchor, text) {
    const t = tip()
    t.textContent = text
    const r = anchor.getBoundingClientRect()
    const top = r.bottom + 6 < innerHeight - 40 ? r.bottom + 6 : r.top - 28
    t.style.left = Math.max(4, Math.min(r.left, innerWidth - 490)) + 'px'
    t.style.top = top + 'px'
    t.style.display = 'block'
  }
  function hideTip() { if (tipEl) tipEl.style.display = 'none' }

  let hoverTimer = null
  let activeAnchor = null

  document.addEventListener('mouseover', (e) => {
    if (!enabled()) return
    const a = e.target instanceof Element ? e.target.closest('a[href]') : null
    if (!a || a === activeAnchor) return
    const href = a.href
    if (!isShort(href)) return
    activeAnchor = a
    clearTimeout(hoverTimer)
    hoverTimer = setTimeout(async () => {
      showTip(a, 'Resolving…')
      const final = await resolveCached(href)
      if (activeAnchor === a) showTip(a, final === href ? '(no redirect)' : final)
    }, HOVER_DELAY_MS)
  }, true)

  document.addEventListener('mouseout', (e) => {
    if (!activeAnchor) return
    if (e.target === activeAnchor || (e.target instanceof Element && e.target.closest('a') === activeAnchor)) {
      clearTimeout(hoverTimer)
      activeAnchor = null
      hideTip()
    }
  }, true)
})()
