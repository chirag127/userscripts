// ==UserScript==
// @name         Copy email links
// @namespace    https://github.com/oriz-org/userscripts
// @version      0.1.0
// @description  When you click a mailto: link, copy the email address to your clipboard instead of opening the OS mail client. Toast confirms the copy. Replaces the closed-source "Copy email links" Chrome extension (ocffkcplakjlhbaadfcokiiflaelnaib).
// @author       chirag127
// @match        *://*/*
// @run-at       document-end
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @license      MIT
// @homepageURL  https://github.com/oriz-org/userscripts/tree/main/copy-email-links
// @supportURL   https://github.com/oriz-org/userscripts/issues
// @updateURL    https://github.com/oriz-org/userscripts/raw/main/copy-email-links/copy-email-links.user.js
// @downloadURL  https://github.com/oriz-org/userscripts/raw/main/copy-email-links/copy-email-links.user.js
// ==/UserScript==

(() => {
  'use strict'

  // ---- settings -----------------------------------------------------------
  // Persisted across page loads via GM_getValue/GM_setValue. Toggle from the
  // Tampermonkey/Violentmonkey/ScriptCat menu (puzzle-piece icon → script name).
  const DEFAULTS = {
    showToast: true,      // show the "copied" toast after copying
    colorMode: 'dark',    // 'dark' | 'light'
    stripParams: true,    // strip ?subject=… ?body=… from mailto: so only the bare address lands on the clipboard
  }
  const settings = {
    showToast: GM_getValue('showToast', DEFAULTS.showToast),
    colorMode: GM_getValue('colorMode', DEFAULTS.colorMode),
    stripParams: GM_getValue('stripParams', DEFAULTS.stripParams),
  }

  function persist(key, value) {
    settings[key] = value
    GM_setValue(key, value)
  }

  GM_registerMenuCommand(
    `Toast on copy: ${settings.showToast ? 'ON' : 'OFF'} — click to toggle`,
    () => { persist('showToast', !settings.showToast); location.reload() }
  )
  GM_registerMenuCommand(
    `Theme: ${settings.colorMode} — click to toggle`,
    () => { persist('colorMode', settings.colorMode === 'dark' ? 'light' : 'dark'); location.reload() }
  )
  GM_registerMenuCommand(
    `Strip ?subject/?body: ${settings.stripParams ? 'ON' : 'OFF'} — click to toggle`,
    () => { persist('stripParams', !settings.stripParams); location.reload() }
  )

  // ---- core ---------------------------------------------------------------
  // Resolve a mailto: href to just the address (or full mailto body if disabled).
  // Handles comma-separated multi-recipient and percent-encoded addresses.
  function extractEmail(href) {
    const raw = href.replace(/^mailto:/i, '')
    if (!settings.stripParams) return decodeURIComponent(raw)
    const beforeQuery = raw.split('?')[0]
    return decodeURIComponent(beforeQuery)
  }

  async function copyToClipboard(text) {
    // Primary path: async clipboard API (requires a transient user gesture, which
    // a click handler satisfies — so this works inside the click listener below).
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fallback for pages that block navigator.clipboard (rare, mostly old http://).
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

  // Toast — single shared element, replayed on each copy. Styling kept inline so
  // host-page CSS can't break it; z-index is the max practical value.
  let toastEl = null
  let toastHideTimer = null
  let toastRemoveTimer = null
  function showToast(email) {
    if (!settings.showToast) return
    const isDark = settings.colorMode === 'dark'

    if (!toastEl) {
      toastEl = document.createElement('div')
      Object.assign(toastEl.style, {
        position: 'fixed',
        left: '50%',
        bottom: '-10px',
        transform: 'translateX(-50%)',
        zIndex: '2147483647',
        padding: '12px 20px',
        borderRadius: '8px',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        fontSize: '14px',
        fontWeight: '600',
        opacity: '0',
        transition: 'all 300ms ease-in-out',
        backdropFilter: 'blur(5px)',
        pointerEvents: 'none',
        maxWidth: '90vw',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      })
      document.body.appendChild(toastEl)
    }
    toastEl.style.backgroundColor = isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.7)'
    toastEl.style.color = isDark ? '#fff' : '#000'
    toastEl.style.boxShadow = isDark
      ? '0 4px 14px rgba(0, 0, 0, 0.4)'
      : '0 4px 14px rgba(0, 0, 0, 0.15)'
    toastEl.textContent = `📋 ${email} copied to clipboard`

    // Reset any in-flight hide timers so back-to-back copies just refresh the toast.
    clearTimeout(toastHideTimer)
    clearTimeout(toastRemoveTimer)

    // Show
    requestAnimationFrame(() => {
      toastEl.style.bottom = '20px'
      toastEl.style.opacity = '1'
    })
    // Hide after 2.5s
    toastHideTimer = setTimeout(() => {
      toastEl.style.bottom = '-10px'
      toastEl.style.opacity = '0'
    }, 2500)
  }

  // Capture phase so we beat any host-page click handlers that might call
  // stopPropagation() before the bubble phase reaches us.
  document.addEventListener('click', async (e) => {
    // Honor modifier-click — Cmd/Ctrl/middle-click means the user explicitly
    // wants the default behavior (open in new tab / OS mail handler).
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

    // closest() handles nested <span>/<img> inside the anchor.
    const anchor = e.target instanceof Element ? e.target.closest('a[href^="mailto:" i]') : null
    if (!anchor) return

    const email = extractEmail(anchor.getAttribute('href') || '')
    if (!email) return

    e.preventDefault()
    e.stopPropagation()

    const ok = await copyToClipboard(email)
    if (ok) showToast(email)
    else console.warn('[copy-email-links] clipboard copy failed for', email)
  }, true)
})()
