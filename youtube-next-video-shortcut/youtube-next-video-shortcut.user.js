// ==UserScript==
// @name         YouTube — Next video (N)
// @namespace    https://github.com/oriz-org/userscripts
// @version      0.1.0
// @description  Press N to jump to the next video. Atomic — does one thing only.
// @author       chirag127
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @run-at       document-end
// @grant        none
// @license      MIT
// @homepageURL  https://github.com/oriz-org/userscripts/tree/main/youtube-next-video-shortcut
// @supportURL   https://github.com/oriz-org/userscripts/issues
// @updateURL    https://github.com/oriz-org/userscripts/raw/main/youtube-next-video-shortcut/youtube-next-video-shortcut.user.js
// @downloadURL  https://github.com/oriz-org/userscripts/raw/main/youtube-next-video-shortcut/youtube-next-video-shortcut.user.js
// ==/UserScript==

(() => {
  'use strict'

  const KEY = 'n'

  function isTyping(target) {
    if (!target) return false
    const tag = target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return true
    if (target.isContentEditable) return true
    return false
  }

  function clickNext() {
    // Native YouTube next button on the player chrome.
    const btn = document.querySelector('.ytp-next-button')
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
    if (clickNext()) {
      e.preventDefault()
      e.stopPropagation()
    }
  }, true)
})()
