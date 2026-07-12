// ==UserScript==
// @name         YouTube — Next video (N)
// @namespace    https://github.com/chirag127/userscripts
// @version      0.1.3
// @description  Press N to jump to the next video. Atomic — does one thing only.
// @author       chirag127
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @run-at       document-end
// @grant        none
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts/tree/main/scripts/youtube-next-video-shortcut
// @supportURL   https://github.com/chirag127/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/youtube-next-video-shortcut/youtube-next-video-shortcut.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/youtube-next-video-shortcut/youtube-next-video-shortcut.user.js
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
