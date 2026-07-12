// ==UserScript==
// @name         YouTube — Dislike (D)
// @namespace    https://github.com/chirag127/userscripts
// @version      0.1.3
// @description  Press D to dislike the current video. Atomic — does one thing only.
// @author       chirag127
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @run-at       document-end
// @grant        none
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts/blob/main/scripts/youtube-dislike-shortcut.user.js
// @supportURL   https://github.com/chirag127/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/youtube-dislike-shortcut.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/youtube-dislike-shortcut.user.js
// ==/UserScript==

/*
README (folded from youtube-dislike-shortcut/README.md during flat-restructure 2026-07-12)

# YouTube — Dislike (D)

Atomic userscript. Press **D** anywhere on a YouTube video page to dislike (or un-dislike) it.

Does one thing only.

## Install

[![Install](https://img.shields.io/badge/install-userscript-blue)](https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/youtube-dislike-shortcut.user.js)

Requires Tampermonkey, Violentmonkey, or Userscripts (Safari).

## How it works

Tries a small fallback chain of selectors for the dislike button. YouTube ships several renderer versions; the script picks whichever is mounted. Ignores the key when typing in an input/textarea/contenteditable element.

Note: YouTube hides public dislike counts, but the dislike button itself still works and is recorded against your account.

## License

MIT
*/

(() => {
  'use strict'

  const KEY = 'd'

  function isTyping(target) {
    if (!target) return false
    const tag = target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return true
    if (target.isContentEditable) return true
    return false
  }

  function clickDislike() {
    const selectors = [
      'dislike-button-view-model button',
      'ytd-toggle-button-renderer #segmented-dislike-button button',
      'ytd-segmented-like-dislike-button-renderer #dislike-button button',
      'button[aria-label^="dislike" i]',
      'button[aria-label^="I dislike this" i]',
    ]
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
    if (e.key.toLowerCase() !== KEY) return
    if (isTyping(e.target)) return
    if (clickDislike()) {
      e.preventDefault()
      e.stopPropagation()
    }
  }, true)
})()
