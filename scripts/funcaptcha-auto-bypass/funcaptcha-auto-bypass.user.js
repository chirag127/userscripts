// ==UserScript==
// @name         Arkose FunCaptcha Auto-Start
// @namespace    https://github.com/chirag127/userscripts
// @version      1.0.0
// @description  Clicks through Arkose FunCaptcha's "Begin"/verify screens and fires the token change event. Image-rotation puzzles still need a human. ScriptCat switch, on by default, no solver API.
// @author       chirag127
// @match        *://*/*
// @match        https://*.arkoselabs.com/*
// @run-at       document-start
// @grant        unsafeWindow
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_log
// @grant        CAT_registerMenuInput
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts/tree/main/scripts/funcaptcha-auto-bypass
// @supportURL   https://github.com/chirag127/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/funcaptcha-auto-bypass/funcaptcha-auto-bypass.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/funcaptcha-auto-bypass/funcaptcha-auto-bypass.user.js
// ==/UserScript==

(() => {
  'use strict'

  const W = typeof unsafeWindow === 'undefined' ? window : unsafeWindow
  const inFrame = /(^|\.)arkoselabs\.com$/.test(location.hostname)
  const site = (() => {
    if (!inFrame) return location.hostname
    for (const o of location.ancestorOrigins || []) {
      try {
        const h = new URL(o).hostname
        if (h && !/(^|\.)arkoselabs\.com$/.test(h)) return h
      } catch {}
    }
    return location.hostname
  })()

  const enabled = GM_getValue(`on:${site}`, true)
  if (!enabled) return
  if (!inFrame && window.top !== window) return

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const log = (m, l = 'debug') => {
    console.debug('[tsb]', m)
    try {
      GM_log(`[funcaptcha] ${m}`, l)
    } catch {}
  }

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
    el.dispatchEvent(new W.MouseEvent('mouseup', init))
    el.dispatchEvent(new W.MouseEvent('click', init))
  }

  const startButton = () =>
    document.querySelector('#home, .funcaptcha, #verify, button[data-theme="home"]') ||
    [...document.querySelectorAll('button')].find((b) =>
      /begin|verify|start|continue/i.test(b.textContent || '')
    )

  if (inFrame) {
    let n = 0
    const tick = async () => {
      if (n >= 6) return
      n++
      await sleep(n === 1 ? 800 : 2500)
      const btn = startButton()
      if (!btn) return
      click(btn)
      log(`click ${n}`)
    }
    const loop = setInterval(tick, 2000)
    setTimeout(() => clearInterval(loop), 45_000)
    tick()
    return
  }

  const TOKEN = '#FunCaptcha-Token, input[name="fc-token"], input[name="funcaptcha-token"]'
  let seen = false
  const begin = () => {
    if (seen) return
    const token = document.querySelector(TOKEN)
    if (!token) return
    seen = true
    const check = setInterval(() => {
      if (!token.value) return
      clearInterval(check)
      token.dispatchEvent(new W.Event('input', { bubbles: true }))
      token.dispatchEvent(new W.Event('change', { bubbles: true }))
      log('token present')
    }, 1000)
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
