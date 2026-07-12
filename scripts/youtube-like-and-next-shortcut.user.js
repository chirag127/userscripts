// ==UserScript==
// @name         YouTube — Like & next (A)
// @namespace    https://github.com/chirag127/userscripts-script
// @version      0.1.0
// @description  Press A to like the current video AND immediately skip to the next one. Key is remappable via the Tampermonkey menu.
// @author       chirag127
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @run-at       document-end
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts-script/blob/main/scripts/youtube-like-and-next-shortcut.user.js
// @supportURL   https://github.com/chirag127/userscripts-script/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/youtube-like-and-next-shortcut.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/youtube-like-and-next-shortcut.user.js
// ==/UserScript==

/*
README (folded from youtube-like-and-next-shortcut/README.md during flat-restructure 2026-07-12)

# YouTube — Like & next (A)

One key to do two things: **like the current video, then skip to the next**.

Default key: **A**. Remappable.

## Install

[![Install](https://img.shields.io/badge/install-userscript-blue)](https://github.com/chirag127/userscripts-script/raw/main/scripts/youtube-like-and-next-shortcut.user.js)

Requires Tampermonkey, Violentmonkey, or Userscripts (Safari).

## How it works

On keydown:

1. Find the Like button via a 5-selector fallback chain (modern + legacy renderers). If it's already pressed (`aria-pressed="true"`) the script does **not** toggle it off — it just proceeds to step 2.
2. Wait 150 ms so YouTube's mutation lands.
3. Click `.ytp-next-button` on the player chrome.

Works on any video watch page (`/watch?v=…`). The next button uses YouTube's own queue — autoplay related, playlist, mix, etc. — same behaviour as pressing the on-player Next button manually.

Guards: ignores the key when typing in input/textarea/contenteditable; ignores when Ctrl/Cmd/Alt/Shift held.

## Change the key

Click the Tampermonkey/Violentmonkey icon → open this userscript's menu:

- `Set "Like & next" key (default A)` → prompt for a single letter or digit
- `Reset key to default (A)`

Persists via `GM_setValue`.

## Why A?

Home-row, left hand, and doesn't collide with sibling shortcut scripts:

- `youtube-like-shortcut` = **S** (like only)
- `youtube-dislike-shortcut` = **D** (dislike only)
- `youtube-dislike-and-next-shortcut` = **X** (dislike + next)
- `youtube-next-video-shortcut` = **N** (next only)
- `youtube-prev-video-shortcut` = **P** (prev only)
- **This script** = **A** (like + next)

Change it if your muscle memory disagrees — the setter lives in the userscript-manager menu.

## License

MIT
*/

(() => {
  'use strict'

  const DEFAULT_KEY = 'a'
  const STORAGE_KEY = 'yt-like-and-next-key'
  // Delay between clicking Like and clicking Next. YouTube's like mutation
  // needs a tick to land on the page state; jumping next instantly sometimes
  // loses the like.
  const DELAY_MS = 150

  const hasGM = typeof GM_getValue === 'function' && typeof GM_setValue === 'function'

  function loadKey() {
    if (!hasGM) return DEFAULT_KEY
    const v = GM_getValue(STORAGE_KEY, DEFAULT_KEY)
    return (typeof v === 'string' && v.length === 1) ? v.toLowerCase() : DEFAULT_KEY
  }

  function saveKey(value) {
    if (!hasGM) return
    GM_setValue(STORAGE_KEY, value.toLowerCase())
  }

  let key = loadKey()

  function promptForKey(current) {
    // eslint-disable-next-line no-alert
    const input = prompt(`Set the "Like & next" key.\nCurrent: ${current}\nType a single letter (a-z) or digit:`, current)
    if (input == null) return null
    const k = input.trim().toLowerCase()
    if (!/^[a-z0-9]$/.test(k)) {
      // eslint-disable-next-line no-alert
      alert(`Invalid key: "${input}". Must be a single letter (a-z) or digit. Keeping current: ${current}.`)
      return null
    }
    return k
  }

  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('Set "Like & next" key (default A)', () => {
      const fresh = promptForKey(key)
      if (fresh == null) return
      key = fresh
      saveKey(fresh)
      // eslint-disable-next-line no-alert
      alert(`"Like & next" key set to: ${fresh}`)
    })
    GM_registerMenuCommand('Reset key to default (A)', () => {
      key = DEFAULT_KEY
      saveKey(DEFAULT_KEY)
      // eslint-disable-next-line no-alert
      alert('Reset: Like & next = A')
    })
  }

  function isTyping(target) {
    if (!target) return false
    const tag = target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return true
    if (target.isContentEditable) return true
    return false
  }

  const LIKE_SELECTORS = [
    'like-button-view-model button',
    'ytd-toggle-button-renderer #segmented-like-button button',
    'ytd-segmented-like-dislike-button-renderer #like-button button',
    'button[aria-label^="like" i]',
    'button[aria-label^="I like this" i]',
  ]

  function clickLike() {
    for (const sel of LIKE_SELECTORS) {
      const btn = document.querySelector(sel)
      if (btn) {
        // Skip if already pressed — don't toggle OFF an existing like.
        // Modern button exposes state via aria-pressed.
        const pressed = btn.getAttribute('aria-pressed')
        if (pressed === 'true') {
          // Already liked — don't undo. Treat as success for the chain.
          return true
        }
        btn.click()
        return true
      }
    }
    return false
  }

  function clickNext() {
    const btn = document.querySelector('.ytp-next-button')
    if (btn && !btn.disabled && btn.getAttribute('aria-disabled') !== 'true') {
      btn.click()
      return true
    }
    return false
  }

  function likeAndAdvance() {
    const liked = clickLike()
    // Chain after a short delay so YouTube's mutation reflects the like
    // before we navigate away. If the like button isn't found, still try
    // to advance — the user pressed the key, give them the navigation.
    setTimeout(() => {
      const advanced = clickNext()
      if (!liked && !advanced) {
        // Both failed — surface so the user knows nothing happened.
        console.warn('[yt-like-and-next] no like or next button found on this page')
      }
    }, DELAY_MS)
  }

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
    if (isTyping(e.target)) return
    if (e.key.toLowerCase() !== key) return
    e.preventDefault()
    e.stopPropagation()
    likeAndAdvance()
  }, true)
})()
