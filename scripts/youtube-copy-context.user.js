// ==UserScript==
// @name         YouTube — Copy Title + Channel + URL as markdown
// @namespace    https://github.com/chirag127/userscripts-script
// @version      0.1.0
// @description  Ctrl+Shift+Y copies the current video as a markdown link with title, channel, and a timestamped URL. Shortcut remappable via menu.
// @author       chirag127
// @match        https://www.youtube.com/watch*
// @match        https://m.youtube.com/watch*
// @run-at       document-end
// @grant        GM_setClipboard
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts-script/blob/main/scripts/youtube-copy-context.user.js
// @supportURL   https://github.com/chirag127/userscripts-script/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/youtube-copy-context.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/youtube-copy-context.user.js
// ==/UserScript==

/*
README (folded from youtube-copy-context/README.md during flat-restructure 2026-07-12)

# YouTube — Copy Title + Channel + URL as markdown

Press **Ctrl+Shift+Y** on any YouTube watch page. Copies a markdown link to the clipboard:

```
[Video title — Channel name](https://www.youtube.com/watch?v=VIDEO_ID&t=SECONDS)
```

The `t=` parameter is the current playhead position, so pasted links jump to where you were. A small toast confirms the copy for 1.5 seconds.

## Install

[![Install](https://img.shields.io/badge/install-userscript-blue)](https://github.com/chirag127/userscripts-script/raw/main/scripts/youtube-copy-context.user.js)

Requires Tampermonkey, Violentmonkey, or Userscripts (Safari).

## Change the shortcut

Open the userscript menu for this script:

- `Set copy shortcut (default Ctrl+Shift+Y)` — prompts for a combo like `ctrl+shift+y`, `alt+c`, `ctrl+m`.
- `Reset shortcut to Ctrl+Shift+Y`.

Modifiers accepted: `ctrl` (also matches Cmd on macOS), `shift`, `alt`. Key must be a single letter or digit. Settings persist via `GM_setValue`.

## Known limitations

- Only fires on `youtube.com/watch` and `m.youtube.com/watch` — not on Shorts or channel pages.
- Falls back to `document.title` (minus the trailing " - YouTube") if the DOM title node hasn't hydrated yet on very slow loads.
- If the channel element is missing, the link shows `Unknown channel`.

## License

MIT
*/

(() => {
  'use strict'

  const DEFAULTS = { key: 'y', ctrl: true, shift: true, alt: false }
  const STORAGE_KEY = 'yt-copy-context-combo'

  const hasGM = typeof GM_getValue === 'function' && typeof GM_setValue === 'function'

  function loadCombo() {
    if (!hasGM) return { ...DEFAULTS }
    const v = GM_getValue(STORAGE_KEY, null)
    if (!v || typeof v !== 'object') return { ...DEFAULTS }
    return {
      key: (typeof v.key === 'string' && v.key.length === 1) ? v.key.toLowerCase() : DEFAULTS.key,
      ctrl: !!v.ctrl, shift: !!v.shift, alt: !!v.alt
    }
  }

  function saveCombo(c) { if (hasGM) GM_setValue(STORAGE_KEY, c) }

  let combo = loadCombo()

  function comboLabel(c) {
    const parts = []
    if (c.ctrl) parts.push('Ctrl')
    if (c.alt) parts.push('Alt')
    if (c.shift) parts.push('Shift')
    parts.push(c.key.toUpperCase())
    return parts.join('+')
  }

  function reconfigure() {
    // eslint-disable-next-line no-alert
    const input = prompt(
      `Set the shortcut. Format: modifiers+key (e.g. "ctrl+shift+y", "alt+c").\nCurrent: ${comboLabel(combo)}`,
      comboLabel(combo).toLowerCase()
    )
    if (input == null) return
    const parts = input.trim().toLowerCase().split('+').map(s => s.trim()).filter(Boolean)
    const key = parts.pop()
    if (!key || !/^[a-z0-9]$/.test(key)) {
      // eslint-disable-next-line no-alert
      alert(`Invalid key: "${input}". Must end in a single letter/digit.`)
      return
    }
    const fresh = {
      key,
      ctrl: parts.includes('ctrl') || parts.includes('control'),
      shift: parts.includes('shift'),
      alt: parts.includes('alt')
    }
    combo = fresh
    saveCombo(fresh)
    // eslint-disable-next-line no-alert
    alert(`Shortcut set to: ${comboLabel(fresh)}`)
  }

  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('Set copy shortcut (default Ctrl+Shift+Y)', reconfigure)
    GM_registerMenuCommand('Reset shortcut to Ctrl+Shift+Y', () => {
      combo = { ...DEFAULTS }
      saveCombo(combo)
      // eslint-disable-next-line no-alert
      alert('Reset: Ctrl+Shift+Y')
    })
  }

  function getTitle() {
    const meta = document.querySelector('meta[name="title"]')
    if (meta && meta.content) return meta.content.trim()
    const h1 = document.querySelector('h1.ytd-watch-metadata yt-formatted-string, h1.title')
    if (h1 && h1.textContent) return h1.textContent.trim()
    return (document.title || '').replace(/\s*-\s*YouTube\s*$/, '').trim()
  }

  function getChannel() {
    const a = document.querySelector('ytd-channel-name a, #owner #channel-name a, a.yt-simple-endpoint.ytd-video-owner-renderer')
    if (a && a.textContent) return a.textContent.trim()
    const link = document.querySelector('link[itemprop="name"]')
    if (link && link.content) return link.content.trim()
    return ''
  }

  function getVid() {
    const u = new URL(location.href)
    return u.searchParams.get('v') || ''
  }

  function toast(msg) {
    const el = document.createElement('div')
    el.textContent = msg
    Object.assign(el.style, {
      position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.85)', color: '#fff', padding: '8px 14px',
      borderRadius: '6px', font: '14px system-ui, sans-serif', zIndex: 2147483647,
      pointerEvents: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
    })
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 1500)
  }

  function copyContext() {
    const vid = getVid()
    if (!vid) { toast('No video id'); return }
    const title = getTitle() || 'YouTube video'
    const channel = getChannel() || 'Unknown channel'
    const video = document.querySelector('video')
    const t = video && isFinite(video.currentTime) ? Math.floor(video.currentTime) : 0
    const url = `${location.origin}${location.pathname}?v=${vid}&t=${t}`
    const md = `[${title} — ${channel}](${url})`
    if (typeof GM_setClipboard === 'function') GM_setClipboard(md, 'text')
    else navigator.clipboard.writeText(md).catch(() => {})
    toast('Copied markdown link')
  }

  function isTyping(target) {
    if (!target) return false
    const tag = target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return true
    if (target.isContentEditable) return true
    return false
  }

  document.addEventListener('keydown', (e) => {
    if (isTyping(e.target)) return
    if (!!e.ctrlKey !== combo.ctrl && !!e.metaKey !== combo.ctrl) return
    if (!!e.shiftKey !== combo.shift) return
    if (!!e.altKey !== combo.alt) return
    if (e.key.toLowerCase() !== combo.key) return
    e.preventDefault()
    e.stopPropagation()
    copyContext()
  }, true)
})()
