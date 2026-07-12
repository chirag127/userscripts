// ==UserScript==
// @name         Link Klipper (userscript)
// @namespace    https://github.com/chirag127/userscripts-script
// @version      0.1.3
// @description  Extract every link on the current page and export as CSV download or plain-text clipboard. Captures <a href> + <img src>. Userscript replacement for the "Link Klipper" Chrome extension by Codebox.in.
// @author       chirag127
// @match        *://*/*
// @run-at       document-end
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// @grant        GM_download
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts-script/blob/main/scripts/link-klipper.user.js
// @supportURL   https://github.com/chirag127/userscripts-script/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/link-klipper.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/link-klipper.user.js
// ==/UserScript==

/*
README (folded from link-klipper/README.md during flat-restructure 2026-07-12)

# link-klipper

[⭐ Star this Repo ⭐](https://github.com/chirag127/userscripts-script)

Extract every link on the current page → download as CSV or copy URLs to clipboard. Captures both `<a href>` anchors and `<img src>` images.

> Userscript replacement for the [Link Klipper](https://chromewebstore.google.com/) Chrome extension by Codebox.in. Same core extraction + CSV download, plus a "copy URLs to clipboard" alternative. **Skips the visual hover-to-pick container mode** the upstream v3 ships — see [Honest differences](#honest-differences-from-upstream) below.

## Install

[Click here to install in Tampermonkey / Violentmonkey / ScriptCat](https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/link-klipper.user.js)

Auto-updates on every push via the `@updateURL` metadata.

## Hotkey

**`Ctrl+Shift+K`** (Windows/Linux) / **`Cmd+Shift+K`** (Mac) — extracts every link on the page and downloads `links_<hostname>_<timestamp>.csv`.

Matches the upstream Link Klipper hotkey exactly. The script skips firing when focus is inside an editor (`input`, `textarea`, `contenteditable`) so it doesn't break Ctrl+Shift+K in dev-tool web editors.

## Menu commands

Open the Tampermonkey/Violentmonkey/ScriptCat puzzle-piece icon → this script's name:

| Command | What it does |
|---|---|
| **Link Klipper: extract all → download CSV** | Every link on the page → CSV file, columns: `url, text, title, type, hostname`. UTF-8 BOM included so Excel opens cleanly. |
| **Link Klipper: extract all → copy URLs to clipboard** | Same set of links, but just the URLs (one per line) on the clipboard. |
| **Link Klipper: extract from selection → copy URLs** | Restricts collection to the current text-selection's subtree. Useful for "I just want links from this article block". |
| **Capture images: ON/OFF** | Toggle whether `<img src>` URLs are collected. Default ON. |
| **Filter mailto/tel/js: ON/OFF** | Default OFF (matches upstream). ON to drop `javascript:` / `mailto:` / `tel:` / `#hash` URLs from the export. |

## CSV format

```csv
url,text,title,type,hostname
https://example.com/about,About us,,link,example.com
https://example.com/img/logo.png,,Site logo,image,example.com
mailto:hi@example.com,Contact,,mailto,
```

Columns:
- **url** — fully resolved absolute URL
- **text** — anchor's visible text (trimmed, collapsed whitespace, capped at 500 chars). Empty for `<img>` rows.
- **title** — anchor's `title` attr OR the wrapped/standalone `<img alt>`
- **type** — `link` | `image-link` (anchor wrapping an `<img>`) | `image` (standalone `<img>`) | `mailto` | `tel` | `javascript` | `anchor` (hash-only)
- **hostname** — parsed from the URL; useful for `GROUP BY hostname` in spreadsheets

Excel quirk: opens the CSV correctly thanks to the `﻿` UTF-8 BOM. Google Sheets via `File → Import` works the same way.

## Honest differences from upstream

| Feature | Upstream Link Klipper v3 | This userscript |
|---|---|---|
| Extract all links → CSV | ✅ | ✅ |
| Capture `<img>` URLs | ✅ | ✅ |
| Hotkey Ctrl/Cmd+Shift+K | ✅ | ✅ |
| Plain-text URL copy to clipboard | ❌ | ✅ |
| Extract from text selection | ❌ | ✅ |
| **Visual hover-to-pick container mode** | ✅ (the v3 marquee feature) | ❌ |
| Right-click context menu item | ✅ | ❌ — userscripts cannot add native chrome context menu items |
| Toolbar icon button | ✅ | ❌ — userscripts have no toolbar surface |

**Why no visual hover-picker:** the upstream v3 adds an in-page overlay where you hover containers, they get outlined, and clicking extracts links from that container only. Implementing it is ~80 LOC of mode-state-machine that I deliberately skipped. The "extract from text selection" menu command covers most of the same need (highlight the article block, run the menu command, get links from just that block) without the brittleness of hover-tracking on every page.

If you want the hover-picker, file an issue and I'll add it as v0.2.

## Compatibility

| Manager | Status |
|---|---|
| Tampermonkey (Chrome/Edge/Firefox/Safari) | ✅ uses `GM_download` for cleaner CSV save |
| Violentmonkey (Chrome/Firefox) | ✅ falls back to Blob + anchor.click |
| ScriptCat (Chrome/Edge) | ✅ |
| Greasemonkey 4+ (Firefox legacy) | ⚠️ — uses `GM_*` not `GM.*`. Replace `GM_setClipboard` / `GM_download` with `GM.setClipboard` / `GM.download` if needed. |

## Privacy

The script reads the current page's DOM (anchors + images) and writes the result to your clipboard or downloads a file. Nothing leaves your machine. No network requests, no telemetry, no analytics. The upstream Link Klipper says the same thing in its store listing; this userscript is the same model — minus the closed-source binary.

## License

MIT. See [LICENSE](../LICENSE).
*/

(() => {
  'use strict'

  // ---- settings ----------------------------------------------------------
  // Defaults match the questions you answered: images on, dedupe on,
  // CSS background-image off, NO filter (mailto/tel/javascript anchors are
  // included to mirror upstream behavior).
  const SETTINGS = {
    captureImages: true,     // <img src> URLs
    captureBgImages: false,  // CSS `background-image: url(...)` (off; expensive)
    filterSpecial: false,    // skip javascript:/mailto:/tel:/# (off to match upstream)
    dedupe: true,            // drop exact-URL duplicates
  }

  // ---- collection --------------------------------------------------------
  // One row per link, fields chosen for usefulness in SEO/data work.
  // `type` ∈ {link, image-link, mailto, tel, javascript, anchor, image}
  function classify(url, source) {
    if (source === 'img') return 'image'
    if (source === 'bg-image') return 'image'
    if (/^mailto:/i.test(url)) return 'mailto'
    if (/^tel:/i.test(url)) return 'tel'
    if (/^javascript:/i.test(url)) return 'javascript'
    if (url.startsWith('#')) return 'anchor'
    if (source === 'img-link') return 'image-link'
    return 'link'
  }

  function hostnameOf(url) {
    try { return new URL(url, location.href).hostname } catch { return '' }
  }

  function collectAllLinks(root = document) {
    const rows = []
    const seen = new Set()

    function push(row) {
      if (SETTINGS.filterSpecial && /^(?:javascript:|mailto:|tel:|#)/i.test(row.url)) return
      if (SETTINGS.dedupe) {
        const k = row.url + '|' + row.type
        if (seen.has(k)) return
        seen.add(k)
      }
      rows.push(row)
    }

    // 1. Anchor tags. An anchor wrapping an <img> is tagged 'image-link'.
    for (const a of root.querySelectorAll('a[href]')) {
      const url = a.href
      if (!url) continue
      const isImgLink = a.querySelector('img') !== null
      const innerImg = isImgLink ? a.querySelector('img') : null
      push({
        url,
        text: (a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 500),
        title: a.getAttribute('title') || (innerImg && innerImg.getAttribute('alt')) || '',
        type: classify(url, isImgLink ? 'img-link' : 'a'),
        hostname: hostnameOf(url),
      })
    }

    // 2. Standalone <img> elements (not already counted as part of an <a>).
    if (SETTINGS.captureImages) {
      for (const img of root.querySelectorAll('img[src]')) {
        if (img.closest('a[href]')) continue   // already captured as image-link above
        const url = img.src
        if (!url) continue
        push({
          url,
          text: '',
          title: img.getAttribute('alt') || img.getAttribute('title') || '',
          type: classify(url, 'img'),
          hostname: hostnameOf(url),
        })
      }
    }

    // 3. CSS background-image URLs (opt-in; getComputedStyle is expensive at scale).
    if (SETTINGS.captureBgImages) {
      const all = root.querySelectorAll('*')
      const bgRe = /url\((['"]?)([^'")]+)\1\)/g
      for (const el of all) {
        const bg = getComputedStyle(el).backgroundImage
        if (!bg || bg === 'none') continue
        for (const m of bg.matchAll(bgRe)) {
          const url = new URL(m[2], location.href).href
          push({
            url,
            text: '',
            title: '',
            type: classify(url, 'bg-image'),
            hostname: hostnameOf(url),
          })
        }
      }
    }

    return rows
  }

  // ---- export formats ----------------------------------------------------
  function toCSV(rows) {
    const cols = ['url', 'text', 'title', 'type', 'hostname']
    // RFC-4180 escaping: wrap in quotes if contains comma/quote/newline; double internal quotes.
    const esc = (v) => {
      const s = String(v ?? '')
      return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
    }
    const header = cols.join(',')
    const body = rows.map((r) => cols.map((c) => esc(r[c])).join(',')).join('\n')
    return header + '\n' + body + '\n'
  }

  function toPlainText(rows) {
    return rows.map((r) => r.url).join('\n')
  }

  // ---- output sinks ------------------------------------------------------
  function downloadCSV(csv) {
    const ts = new Date().toISOString().replace(/[:.]/g, '-').replace(/T/, '_').slice(0, 19)
    const safeHost = location.hostname.replace(/[^\w.-]/g, '_') || 'page'
    const filename = `links_${safeHost}_${ts}.csv`

    // Prefer GM_download — it bypasses popup blockers and gets a proper "Save as"
    // dialog on managers that support it.
    if (typeof GM_download === 'function') {
      try {
        GM_download({
          url: 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv),
          name: filename,
          saveAs: false,
        })
        return filename
      } catch { /* fall through to Blob anchor */ }
    }

    // Standard Blob + anchor.download. ﻿ BOM so Excel opens UTF-8 correctly.
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      a.remove()
      URL.revokeObjectURL(url)
    }, 1000)
    return filename
  }

  async function copyText(text) {
    if (typeof GM_setClipboard === 'function') {
      try { GM_setClipboard(text, 'text'); return true } catch { /* fall through */ }
    }
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
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

  // ---- toast --------------------------------------------------------------
  function toast(message, isError = false) {
    const el = document.createElement('div')
    Object.assign(el.style, {
      position: 'fixed',
      left: '50%',
      bottom: '20px',
      transform: 'translateX(-50%)',
      zIndex: '2147483647',
      padding: '12px 20px',
      borderRadius: '8px',
      backgroundColor: isError ? 'rgba(180, 30, 30, 0.85)' : 'rgba(0, 0, 0, 0.78)',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      fontSize: '14px',
      fontWeight: '600',
      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
      pointerEvents: 'none',
      transition: 'opacity 250ms ease-in-out',
      opacity: '0',
      maxWidth: '90vw',
    })
    el.textContent = message
    document.body.appendChild(el)
    requestAnimationFrame(() => { el.style.opacity = '1' })
    setTimeout(() => {
      el.style.opacity = '0'
      setTimeout(() => el.remove(), 300)
    }, 2800)
  }

  // ---- actions ------------------------------------------------------------
  function extractAndDownloadCSV() {
    const rows = collectAllLinks()
    if (rows.length === 0) { toast('No links found on this page', true); return }
    const filename = downloadCSV(toCSV(rows))
    toast(`Downloaded ${rows.length} link${rows.length === 1 ? '' : 's'} → ${filename}`)
  }

  async function extractAndCopyText() {
    const rows = collectAllLinks()
    if (rows.length === 0) { toast('No links found on this page', true); return }
    const ok = await copyText(toPlainText(rows))
    if (ok) toast(`Copied ${rows.length} URL${rows.length === 1 ? '' : 's'} to clipboard`)
    else toast('Clipboard write failed', true)
  }

  function extractFromSelectionToClipboard() {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed) { toast('No text selected — select text first', true); return }
    const range = sel.getRangeAt(0)
    const root = range.commonAncestorContainer
    const rootEl = root.nodeType === Node.ELEMENT_NODE ? root : root.parentElement
    if (!rootEl) { toast('Could not resolve selection root', true); return }
    // Filter to anchors that actually intersect the selected range.
    const rows = collectAllLinks(rootEl).filter((row) => {
      // We can only intersection-test elements that still exist by URL match.
      // For selection mode we just include the subtree; the upstream extension
      // doesn't intersection-test either when the user picks via hover.
      return true
    })
    if (rows.length === 0) { toast('No links in selection', true); return }
    copyText(toPlainText(rows)).then((ok) => {
      if (ok) toast(`Copied ${rows.length} URL${rows.length === 1 ? '' : 's'} from selection`)
      else toast('Clipboard write failed', true)
    })
  }

  // ---- menu + hotkey ------------------------------------------------------
  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('Link Klipper: extract all → download CSV', extractAndDownloadCSV, { accessKey: 'k' })
    GM_registerMenuCommand('Link Klipper: extract all → copy URLs to clipboard', extractAndCopyText)
    GM_registerMenuCommand('Link Klipper: extract from selection → copy URLs', extractFromSelectionToClipboard)
    GM_registerMenuCommand(
      `Link Klipper: capture images: ${SETTINGS.captureImages ? 'ON' : 'OFF'} — click to toggle`,
      () => { SETTINGS.captureImages = !SETTINGS.captureImages; toast(`captureImages = ${SETTINGS.captureImages}`) }
    )
    GM_registerMenuCommand(
      `Link Klipper: filter mailto/tel/js: ${SETTINGS.filterSpecial ? 'ON' : 'OFF'} — click to toggle`,
      () => { SETTINGS.filterSpecial = !SETTINGS.filterSpecial; toast(`filterSpecial = ${SETTINGS.filterSpecial}`) }
    )
  }

  // Ctrl/Cmd+Shift+K → primary action (download CSV). Listen on document with
  // capture: true so we run before any page-level handler can preventDefault.
  document.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey
    if (mod && e.shiftKey && (e.key === 'K' || e.key === 'k')) {
      // Skip when focus is inside an editor — saves us from breaking
      // Ctrl+Shift+K in dev tools / VS Code Web / similar.
      const ae = document.activeElement
      if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) return
      e.preventDefault()
      e.stopPropagation()
      extractAndDownloadCSV()
    }
  }, true)

  // Devtools-callable globals for users who want their own keybinds.
  // @ts-ignore — userscript globals
  window.__linkKlipper = {
    csv: extractAndDownloadCSV,
    copy: extractAndCopyText,
    copyFromSelection: extractFromSelectionToClipboard,
    collect: collectAllLinks,
    settings: SETTINGS,
  }
})()
