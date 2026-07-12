// ==UserScript==
// @name         YouTube — Reaction shortcuts (like + dislike)
// @namespace    https://github.com/chirag127/userscripts-script
// @version      0.1.3
// @description  Combined: press S to like, D to dislike the current video. Both keys are remappable via the Tampermonkey menu.
// @author       chirag127
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @run-at       document-end
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts-script/blob/main/scripts/youtube-reaction-shortcuts.user.js
// @supportURL   https://github.com/chirag127/userscripts-script/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/youtube-reaction-shortcuts.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/youtube-reaction-shortcuts.user.js
// ==/UserScript==

/*
README (folded from youtube-reaction-shortcuts/README.md during flat-restructure 2026-07-12)

# YouTube — Reaction shortcuts (like + dislike)

Combined userscript. Two keys:

| Key | Action |
|---|---|
| **S** | Like / un-like |
| **D** | Dislike / un-dislike |

Both keys are remappable via the userscript menu.

## Install

[![Install](https://img.shields.io/badge/install-userscript-blue)](https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/youtube-reaction-shortcuts.user.js)

Requires Tampermonkey, Violentmonkey, or Userscripts (Safari).

## Change the keys

Click the Tampermonkey/Violentmonkey icon → open the menu for this userscript:

- `Set "Like" key (default S)`
- `Set "Dislike" key (default D)`
- `Reset both keys to default (S / D)`

A prompt asks for a single letter or digit. Settings persist via `GM_setValue`.

## How it works

Five-selector fallback chain for each button covers modern + legacy YouTube renderers. Capture-phase keydown listener so YouTube's own keybinds don't swallow it. Ignores typing in input/textarea/contenteditable, and ignores when any modifier (Ctrl/Cmd/Alt/Shift) is held.

## Atomic alternatives

If you only want one of the two keys, install the atomic variants instead:

- [`youtube-like-shortcut`](./youtube-like-shortcut.user.js)
- [`youtube-dislike-shortcut`](./youtube-dislike-shortcut.user.js)

## License

MIT
*/

(() => {
  'use strict'

  const DEFAULTS = { like: 's', dislike: 'd' }
  const STORAGE_KEYS = { like: 'yt-reaction-key-like', dislike: 'yt-reaction-key-dislike' }

  const hasGM = typeof GM_getValue === 'function' && typeof GM_setValue === 'function'

  function loadKey(name) {
    if (!hasGM) return DEFAULTS[name]
    const v = GM_getValue(STORAGE_KEYS[name], DEFAULTS[name])
    return (typeof v === 'string' && v.length === 1) ? v.toLowerCase() : DEFAULTS[name]
  }

  function saveKey(name, value) {
    if (!hasGM) return
    GM_setValue(STORAGE_KEYS[name], value.toLowerCase())
  }

  let keys = { like: loadKey('like'), dislike: loadKey('dislike') }

  function promptForKey(label, current) {
    // eslint-disable-next-line no-alert
    const input = prompt(`Set the key for "${label}".\nCurrent: ${current}\nType a single letter (a-z) or digit:`, current)
    if (input == null) return null
    const k = input.trim().toLowerCase()
    if (!/^[a-z0-9]$/.test(k)) {
      // eslint-disable-next-line no-alert
      alert(`Invalid key: "${input}". Must be a single letter (a-z) or digit. Keeping current: ${current}.`)
      return null
    }
    return k
  }

  function reconfigure(name, label) {
    const fresh = promptForKey(label, keys[name])
    if (fresh == null) return
    keys[name] = fresh
    saveKey(name, fresh)
    // eslint-disable-next-line no-alert
    alert(`${label} key set to: ${fresh}`)
  }

  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('Set "Like" key (default S)', () => reconfigure('like', 'Like'))
    GM_registerMenuCommand('Set "Dislike" key (default D)', () => reconfigure('dislike', 'Dislike'))
    GM_registerMenuCommand('Reset both keys to default (S / D)', () => {
      keys = { ...DEFAULTS }
      saveKey('like', DEFAULTS.like)
      saveKey('dislike', DEFAULTS.dislike)
      // eslint-disable-next-line no-alert
      alert('Reset: like=S, dislike=D')
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

  const DISLIKE_SELECTORS = [
    'dislike-button-view-model button',
    'ytd-toggle-button-renderer #segmented-dislike-button button',
    'ytd-segmented-like-dislike-button-renderer #dislike-button button',
    'button[aria-label^="dislike" i]',
    'button[aria-label^="I dislike this" i]',
  ]

  function clickFirst(selectors) {
    for (const sel of selectors) {
      const btn = document.querySelector(sel)
      if (btn) {
        btn.click()
        return true
      }
    }
    return false
  }

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
    if (isTyping(e.target)) return
    const k = e.key.toLowerCase()
    if (k === keys.like) {
      if (clickFirst(LIKE_SELECTORS)) {
        e.preventDefault()
        e.stopPropagation()
      }
    } else if (k === keys.dislike) {
      if (clickFirst(DISLIKE_SELECTORS)) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
  }, true)
})()
