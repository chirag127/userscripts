// ==UserScript==
// @name         YouTube — Previous video (P)
// @namespace    https://github.com/chirag127/userscripts-script
// @version      0.1.3
// @description  Press P to jump to the previous video. Atomic — does one thing only.
// @author       chirag127
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @run-at       document-end
// @grant        none
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts-script/blob/main/scripts/youtube-prev-video-shortcut.user.js
// @supportURL   https://github.com/chirag127/userscripts-script/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/youtube-prev-video-shortcut.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/youtube-prev-video-shortcut.user.js
// ==/UserScript==

/*
README (folded from youtube-prev-video-shortcut/README.md during flat-restructure 2026-07-12)

# YouTube — Previous video (P)

Atomic userscript. Press **P** anywhere on a YouTube page to jump to the previous video.

Does one thing only.

## Install

[![Install](https://img.shields.io/badge/install-userscript-blue)](https://github.com/chirag127/userscripts-script/raw/main/scripts/youtube-prev-video-shortcut.user.js)

Requires Tampermonkey, Violentmonkey, or Userscripts (Safari).

## How it works

Clicks `.ytp-prev-button` on keydown. Only fires when YouTube actually has a previous video (playlist/queue). Ignores the key when typing in an input/textarea/contenteditable element.

## License

MIT
*/

(() => {
  'use strict'

  const KEY = 'p'

  function isTyping(target) {
    if (!target) return false
    const tag = target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return true
    if (target.isContentEditable) return true
    return false
  }

  function clickPrev() {
    // Native YouTube prev button on the player chrome.
    // Only visible when there is actually a previous video in the playlist/queue.
    const btn = document.querySelector('.ytp-prev-button')
    if (btn && !btn.disabled && btn.getAttribute('aria-disabled') !== 'true') {
      btn.click()
      return true
    }
    return false
  }

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
    if (e.key.toLowerCase() !== KEY) return
    if (isTyping(e.target)) return
    if (clickPrev()) {
      e.preventDefault()
      e.stopPropagation()
    }
  }, true)
})()
