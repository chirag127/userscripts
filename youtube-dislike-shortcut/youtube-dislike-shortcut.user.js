// ==UserScript==
// @name         YouTube — Dislike (D)
// @namespace    https://github.com/oriz-org/userscripts
// @version      0.1.0
// @description  Press D to dislike the current video. Atomic — does one thing only.
// @author       chirag127
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @run-at       document-end
// @grant        none
// @license      MIT
// @homepageURL  https://github.com/oriz-org/userscripts/tree/main/youtube-dislike-shortcut
// @supportURL   https://github.com/oriz-org/userscripts/issues
// @updateURL    https://github.com/oriz-org/userscripts/raw/main/youtube-dislike-shortcut/youtube-dislike-shortcut.user.js
// @downloadURL  https://github.com/oriz-org/userscripts/raw/main/youtube-dislike-shortcut/youtube-dislike-shortcut.user.js
// ==/UserScript==

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
