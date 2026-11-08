// ==UserScript==
// @name         ALTCHA Proof-of-Work Auto-Bypass
// @namespace    https://github.com/chirag127/userscripts
// @version      1.0.0
// @description  Clicks the ALTCHA checkbox inside its shadow root and calls widget.verify() so the local proof-of-work runs without you. ScriptCat switch, on by default, no solver API.
// @author       chirag127
// @match        *://*/*
// @run-at       document-start
// @grant        unsafeWindow
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_log
// @grant        CAT_registerMenuInput
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts/tree/main/scripts/altcha-auto-bypass
// @supportURL   https://github.com/chirag127/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/altcha-auto-bypass/altcha-auto-bypass.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/altcha-auto-bypass/altcha-auto-bypass.user.js
// ==/UserScript==

(() => {
  'use strict'

  const W = typeof unsafeWindow === 'undefined' ? window : unsafeWindow
  const site = location.hostname
  const enabled = GM_getValue(`on:${site}`, true)
  if (!enabled) return
  if (window.top !== window) return

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const log = (m, l = 'debug') => {
    console.debug('[tsb]', m)
    try {
      GM_log(`[altcha] ${m}`, l)
    } catch {}
  }

  const widgets = () => [...document.querySelectorAll('altcha-widget')]
  const tokens = () => [...document.querySelectorAll('input[name="altcha"], input[name="altcha-payload"]')]
  const solved = () => tokens().some((t) => t.value) || !widgets().length

  function click(el) {
    const r = el.getBoundingClientRect()
    const init = {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: W,
      clientX: r.left + r.width / 2,
      clientY: r.top + r.height / 2,
      button: 0,
    }
    el.dispatchEvent(new (W.PointerEvent || W.MouseEvent)('pointerdown', init))
    el.dispatchEvent(new W.MouseEvent('click', init))
  }

  async function tick() {
    if (solved()) return
    for (const widget of widgets()) {
      try {
        if (typeof widget.verify === 'function') widget.verify()
        const box = widget.shadowRoot?.querySelector('input[type="checkbox"], button')
        if (box) click(box)
        log('verify()')
      } catch (e) {
        log(`verify failed: ${e}`, 'warn')
      }
    }
  }

  const switchMenu = (label, key, value, title) => {
    const listener = (next) => {
      GM_setValue(key, next === undefined ? !value : !!next)
      location.reload()
    }
    if (typeof CAT_registerMenuInput === 'function') {
      CAT_registerMenuInput(label, listener, {
        id: `alt:${key}`,
        inputType: 'boolean',
        inputDefaultValue: value,
        title,
        inputLabel: label,
      })
    }
  }
  switchMenu(`Auto-bypass on ${site}`, `on:${site}`, enabled, 'Run ALTCHA proof-of-work automatically')

  let started = false
  const begin = async () => {
    if (started || !widgets().length) return
    started = true
    for (let i = 0; i < 12 && !solved(); i++) {
      await sleep(i === 0 ? 600 : 2000)
      await tick()
    }
    if (solved()) log('solved')
  }

  const ready = (fn) =>
    document.readyState === 'loading'
      ? document.addEventListener('DOMContentLoaded', fn, { once: true })
      : fn()

  ready(() => {
    begin()
    new MutationObserver(begin).observe(document.documentElement, { childList: true, subtree: true })
  })
})()
