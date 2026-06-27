// ==UserScript==
// @name         YouTube — Like (S)
// @namespace    https://github.com/oriz-org/userscripts
// @version      0.1.0
// @description  Press S to like the current video. Atomic — does one thing only.
// @author       chirag127
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @run-at       document-end
// @grant        none
// @license      MIT
// @homepageURL  https://github.com/oriz-org/userscripts/tree/main/youtube-like-shortcut
// @supportURL   https://github.com/oriz-org/userscripts/issues
// @updateURL    https://github.com/oriz-org/userscripts/raw/main/youtube-like-shortcut/youtube-like-shortcut.user.js
// @downloadURL  https://github.com/oriz-org/userscripts/raw/main/youtube-like-shortcut/youtube-like-shortcut.user.js
// ==/UserScript==

(() => {
  'use strict'

  const KEY = 's'

  function isTyping(target) {
    if (!target) return false
    const tag = target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return true
    if (target.isContentEditable) return true
    return false
  }

  function clickLike() {
    // YouTube ships several variants of the like button across desktop/mobile/redesigns.
    // Try the most stable selectors in order of preference.
    const selectors = [
      'like-button-view-model button',
      'ytd-toggle-button-renderer #segmented-like-button button',
      'ytd-segmented-like-dislike-button-renderer #like-button button',
      'button[aria-label^="like" i]',
      'button[aria-label^="I like this" i]',
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
    if (clickLike()) {
      e.preventDefault()
      e.stopPropagation()
    }
  }, true)
})()
