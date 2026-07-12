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
// @homepageURL  https://github.com/chirag127/userscripts/blob/main/scripts/ai-chat-auto-continue.user.js
// @supportURL   https://github.com/chirag127/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/ai-chat-auto-continue.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/ai-chat-auto-continue.user.js
// ==/UserScript==

/*
README (folded from ai-chat-auto-continue/README.md during flat-restructure 2026-07-12)

# ai-chat-auto-continue

Userscript that auto-clicks the **Continue** button on AI chat sites when a response is truncated by output-token limits. Long generations finish unattended.

## Supported sites

- ChatGPT (`chatgpt.com`, `chat.openai.com`)
- Claude (`claude.ai`)
- Gemini (`gemini.google.com`)

## How it works

A `MutationObserver` on `document.body` scans for a visible, enabled button whose text matches `/^(continue|continue generating|keep going)$/i`. When found, it clicks after a 500 ms settle delay. A 3 s cooldown between clicks prevents runaway loops if a site re-renders the button rapidly.

Text-based matching (not CSS selectors) survives class-name churn across UI redesigns.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) (or Violentmonkey / ScriptCat).
2. Click → **[install](https://github.com/chirag127/userscripts/raw/main/scripts/ai-chat-auto-continue.user.js)**

## Toggle per-site

Open the Tampermonkey menu on any supported site → click **Auto-continue: ON (host) — click to toggle**. The setting is stored per hostname via `GM_setValue` and persists across reloads.

## Known limitations

- **Text-locale dependent.** The regex matches English button labels. If your UI is in another language, edit `CONTINUE_TEXT` in the script.
- **Runs forever.** No stop condition beyond "no Continue button visible." If a site ever shows a permanent Continue button that isn't a truncation prompt, disable per-site via the menu.
- **Cooldown is global.** The 3 s cooldown applies across the whole tab, not per-conversation.

## License

MIT.
*/

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
