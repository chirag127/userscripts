// ==UserScript==
// @name         AWS WAF Captcha Auto-Bypass
// @namespace    https://github.com/chirag127/userscripts
// @version      1.0.0
// @description  Performs the AWS WAF "press and hold" gesture inside the captcha frame with pointer events, retrying until the token appears. ScriptCat switch, on by default, no solver API.
// @author       chirag127
// @match        *://*/*
// @match        https://*.captcha.awswaf.com/*
// @match        https://captcha.awswaf.com/*
// @run-at       document-start
// @grant        unsafeWindow
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_log
// @grant        CAT_registerMenuInput
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts/tree/main/scripts/awswaf-auto-bypass
// @supportURL   https://github.com/chirag127/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/awswaf-auto-bypass/awswaf-auto-bypass.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/awswaf-auto-bypass/awswaf-auto-bypass.user.js
// ==/UserScript==

(() => {
  'use strict'

  const W = typeof unsafeWindow === 'undefined' ? window : unsafeWindow
  const inFrame = /(^|\.)captcha\.awswaf\.com$/.test(location.hostname)
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const jitter = (a, b) => a + Math.random() * (b - a)
  const log = (m, l = 'debug') => {
    console.debug('[tsb]', m)
    try {
      GM_log(`[awswaf] ${m}`, l)
    } catch {}
  }

  const site = (() => {
    if (!inFrame) return location.hostname
    for (const o of location.ancestorOrigins || []) {
      try {
        const h = new URL(o).hostname
        if (h && !/(^|\.)captcha\.awswaf\.com$/.test(h)) return h
      } catch {}
    }
    return location.hostname
  })()

  const enabled = GM_getValue(`on:${site}`, true)
  if (!enabled) return
  const isTop = (() => {
    try {
      return window.top === window
    } catch {
      return false
    }
  })()

  const PE = W.PointerEvent || W.MouseEvent

  function fire(el, type, x, y, buttons) {
    el.dispatchEvent(
      new PE(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        view: W,
        clientX: x,
        clientY: y,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true,
        button: 0,
        buttons,
      })
    )
  }

  const button = () =>
    [...document.querySelectorAll('button, [role="button"], .aws-waf-captcha-button')].find((el) =>
      /press\s*(and|&)\s*hold/i.test(el.textContent || '')
    ) || document.querySelector('.aws-waf-captcha-button')

  async function hold() {
    const el = button()
    if (!el) return false
    const r = el.getBoundingClientRect()
    const x = r.left + r.width / 2
    const y = r.top + r.height / 2
    log('press and hold')
    fire(el, 'pointerover', x, y, 0)
    fire(el, 'pointerdown', x, y, 1)
    await sleep(jitter(2800, 3600))
    fire(el, 'pointerup', x, y, 0)
    await sleep(900)
    return true
  }

  function run() {
    let n = 0
    const tick = async () => {
      if (n >= 6) return
      n++
      await sleep(n === 1 ? jitter(700, 1300) : jitter(2200, 3200))
      if (document.querySelector('.aws-waf-captcha-header, h1')?.textContent?.match(/puzzle/i)) {
        log('puzzle challenge shown — audio/puzzle needs a human')
      }
      try {
        if (await hold()) log(`hold ${n}`)
      } catch (e) {
        log(`hold failed: ${e}`, 'warn')
      }
    }
    const loop = setInterval(tick, 2500)
    setTimeout(() => clearInterval(loop), 60_000)
    tick()
  }

  const ready = (fn) =>
    document.readyState === 'loading'
      ? document.addEventListener('DOMContentLoaded', fn, { once: true })
      : fn()

  if (inFrame || !isTop) {
    ready(() => {
      if (inFrame || button()) run()
    })
    return
  }

  const switchMenu = (label, key, value, title) => {
    const listener = (next) => {
      GM_setValue(key, next === undefined ? !value : !!next)
      location.reload()
    }
    if (typeof CAT_registerMenuInput === 'function') {
      CAT_registerMenuInput(label, listener, {
        id: `awb:${key}`,
        inputType: 'boolean',
        inputDefaultValue: value,
        title,
        inputLabel: label,
      })
    }
  }
  switchMenu(`Auto-bypass on ${site}`, `on:${site}`, enabled, 'Press and hold AWS WAF automatically')
})()
