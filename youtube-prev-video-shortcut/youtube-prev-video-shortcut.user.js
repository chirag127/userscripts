// ==UserScript==
// @name         YouTube — Previous video (P)
// @namespace    https://github.com/oriz-org/userscripts
// @version      0.1.0
// @description  Press P to jump to the previous video. Atomic — does one thing only.
// @author       chirag127
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @run-at       document-end
// @grant        none
// @license      MIT
// @homepageURL  https://github.com/oriz-org/userscripts/tree/main/youtube-prev-video-shortcut
// @supportURL   https://github.com/oriz-org/userscripts/issues
// @updateURL    https://github.com/oriz-org/userscripts/raw/main/youtube-prev-video-shortcut/youtube-prev-video-shortcut.user.js
// @downloadURL  https://github.com/oriz-org/userscripts/raw/main/youtube-prev-video-shortcut/youtube-prev-video-shortcut.user.js
// ==/UserScript==

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
