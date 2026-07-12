// ==UserScript==
// @name         Copy email links
// @namespace    https://github.com/chirag127/userscripts-script
// @version      0.1.3
// @description  When you click a mailto: link, copy the email address to your clipboard instead of opening the OS mail client. Toast confirms the copy. Replaces the closed-source "Copy email links" Chrome extension (ocffkcplakjlhbaadfcokiiflaelnaib).
// @author       chirag127
// @match        *://*/*
// @run-at       document-end
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts-script/blob/main/scripts/copy-email-links.user.js
// @supportURL   https://github.com/chirag127/userscripts-script/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/copy-email-links.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/copy-email-links.user.js
// ==/UserScript==

/*
README (folded from copy-email-links/README.md during flat-restructure 2026-07-12)

# copy-email-links

[⭐ Star this Repo ⭐](https://github.com/chirag127/userscripts-script)

When you click a `mailto:` link, the email address is copied to your clipboard instead of opening your OS mail client. Toast confirms the copy.

> Userscript replacement for the closed-source [Copy email links](https://chromewebstore.google.com/detail/ocffkcplakjlhbaadfcokiiflaelnaib) Chrome extension (v0.3 by abruno.net). Same behavior, no extension required, works in Tampermonkey / Violentmonkey / ScriptCat across Chrome / Firefox / Edge / Brave / Safari.

## Install

[Click here to install in Tampermonkey / Violentmonkey / ScriptCat](https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/copy-email-links.user.js)

Auto-updates on every push via the `@updateURL` metadata.

## Behavior

1. Click any `<a href="mailto:someone@example.com">` link on any page
2. The email address is copied to your clipboard
3. A small toast confirms — e.g. `📋 someone@example.com copied to clipboard`
4. The default mail-client launch is suppressed (no Outlook / Mail.app popup)

`Cmd/Ctrl/Shift/Alt + click` is honored — modifier-click falls through to the browser's default mailto handler, in case you want to actually open your mail client for that one click.

## Settings

Open the Tampermonkey/Violentmonkey/ScriptCat menu (puzzle-piece icon → this script's name) — three toggles:

| Menu entry | What it does |
|---|---|
| `Toast on copy: ON/OFF` | Suppress the on-page toast notification |
| `Theme: dark/light` | Toast color scheme |
| `Strip ?subject/?body: ON/OFF` | Default ON. Some mailto links include `?subject=…&body=…` — when ON, only the bare email lands on the clipboard. Turn OFF to copy the full `mailto:…?subject=…` URL. |

Settings persist via `GM_getValue` / `GM_setValue`. A toggle reloads the page so the new value takes effect immediately on the next click.

## Why a userscript instead of an extension?

The original is a closed-source MV3 Chrome extension that needs `storage` permission and runs on every `http(s)://*` page anyway. A userscript is:
- **Cross-browser** — Tampermonkey runs on Firefox, Safari, mobile Kiwi/Orion, not just Chrome
- **Auditable** — one 130-line file you can read in 2 minutes (this README + the script)
- **Auto-updating** — `@updateURL` re-fetches from this repo on a cron Tampermonkey controls
- **No CWS / AMO review delay** — push to `main`, users get the update on next check

## Compatibility

| Manager | Status |
|---|---|
| Tampermonkey (Chrome/Edge/Firefox/Safari) | ✅ |
| Violentmonkey (Chrome/Firefox) | ✅ |
| ScriptCat (Chrome/Edge) | ✅ |
| Greasemonkey 4+ (Firefox legacy) | ⚠️ — uses `GM_*` not `GM.*`. Replace `GM_getValue/setValue/registerMenuCommand` with `GM.getValue/setValue` and a Firefox-only `menus.create` if needed. |

## Privacy

The script reads `<a href="mailto:…">` hrefs in pages you visit; nothing leaves your machine. No network requests, no telemetry, no analytics. Clipboard write happens via `navigator.clipboard.writeText()` (origin-restricted, requires user gesture — which the click satisfies).

## License

MIT. See [LICENSE](../LICENSE).
*/

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
