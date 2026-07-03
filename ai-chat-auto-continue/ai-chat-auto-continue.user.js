// ==UserScript==
// @name         AI chat — Auto-continue truncated responses
// @namespace    https://github.com/chirag127/userscripts
// @version      0.1.0
// @description  Auto-clicks the "Continue" button on ChatGPT / Claude / Gemini when a response is cut off by output-token limits, so long generations complete unattended.
// @author       chirag127
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @match        https://claude.ai/*
// @match        https://gemini.google.com/*
// @run-at       document-idle
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts/tree/main/ai-chat-auto-continue
// @supportURL   https://github.com/chirag127/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts/main/ai-chat-auto-continue/ai-chat-auto-continue.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts/main/ai-chat-auto-continue/ai-chat-auto-continue.user.js
// ==/UserScript==

(() => {
  'use strict'

  // ---- config -------------------------------------------------------------

  const CLICK_DELAY_MS = 500
  const COOLDOWN_MS = 3000
  const host = location.hostname

  // Per-site: predicate that finds a visible "Continue" button, or null.
  // Text-based matching survives class-name churn better than CSS selectors.
  const CONTINUE_TEXT = /^(continue|continue generating|keep going)$/i

  const findContinueButton = () => {
    const buttons = document.querySelectorAll('button, [role="button"]')
    for (const b of buttons) {
      const text = (b.innerText || b.textContent || '').trim()
      if (!CONTINUE_TEXT.test(text)) continue
      if (b.disabled || b.getAttribute('aria-disabled') === 'true') continue
      const rect = b.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) continue
      return b
    }
    return null
  }

  // ---- state --------------------------------------------------------------

  const enabledKey = `enabled:${host}`
  let enabled = GM_getValue(enabledKey, true)
  let lastClickAt = 0
  let pending = null

  const tryClick = () => {
    if (!enabled) return
    const now = Date.now()
    if (now - lastClickAt < COOLDOWN_MS) return
    const btn = findContinueButton()
    if (!btn) return
    lastClickAt = now
    btn.click()
  }

  const schedule = () => {
    if (pending) return
    pending = setTimeout(() => {
      pending = null
      tryClick()
    }, CLICK_DELAY_MS)
  }

  // ---- observer -----------------------------------------------------------

  const obs = new MutationObserver(schedule)
  obs.observe(document.body, { childList: true, subtree: true })

  // ---- menu ---------------------------------------------------------------

  const renderMenu = () => {
    GM_registerMenuCommand(
      `Auto-continue: ${enabled ? 'ON' : 'OFF'} (${host}) — click to toggle`,
      () => {
        enabled = !enabled
        GM_setValue(enabledKey, enabled)
        location.reload()
      }
    )
  }
  renderMenu()
})()
