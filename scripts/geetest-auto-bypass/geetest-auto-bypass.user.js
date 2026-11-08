// ==UserScript==
// @name         GeeTest Slider Auto-Bypass
// @namespace    https://github.com/chirag127/userscripts
// @version      1.0.0
// @description  Opens GeeTest v3/v4 sliders and drags the handle across the track with humanised pointer steps, retrying on failure. ScriptCat switch, on by default, no solver API.
// @author       chirag127
// @match        *://*/*
// @match        https://*.geetest.com/*
// @run-at       document-start
// @grant        unsafeWindow
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_log
// @grant        CAT_registerMenuInput
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts/tree/main/scripts/geetest-auto-bypass
// @supportURL   https://github.com/chirag127/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/geetest-auto-bypass/geetest-auto-bypass.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/geetest-auto-bypass/geetest-auto-bypass.user.js
// ==/UserScript==

(() => {
  'use strict'

  const W = typeof unsafeWindow === 'undefined' ? window : unsafeWindow
  const inFrame = /(^|\.)geetest\.com$/.test(location.hostname)
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const jitter = (a, b) => a + Math.random() * (b - a)
  const log = (m, l = 'debug') => {
    console.debug('[tsb]', m)
    try {
      GM_log(`[geetest] ${m}`, l)
    } catch {}
  }

  const site = (() => {
    if (!inFrame) return location.hostname
    for (const o of location.ancestorOrigins || []) {
      try {
        const h = new URL(o).hostname
        if (h && !/(^|\.)geetest\.com$/.test(h)) return h
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

  function event(el, type, x, y, extra = {}) {
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
        ...extra,
      })
    )
  }

  const center = (el) => {
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }
  }

  async function drag(handle, distance) {
    const { x, y } = center(handle)
    event(handle, 'pointerover', x, y)
    event(handle, 'pointerdown', x, y, { buttons: 1 })
    await sleep(jitter(80, 160))
    const steps = 24
    let px = x
    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      const ease = 1 - Math.pow(1 - t, 3)
      const nx = x + distance * ease + jitter(-1.5, 1.5)
      const ny = y + jitter(-2, 2)
      event(handle, 'pointermove', nx, ny, { buttons: 1 })
      event(handle, 'mousemove', nx, ny, { buttons: 1 })
      px = nx
      await sleep(jitter(8, 26))
    }
    await sleep(jitter(120, 320))
    event(handle, 'pointerup', px, y, { buttons: 0 })
    event(handle, 'mouseup', px, y, { buttons: 0 })
  }

  const solved = () =>
    !document.querySelector('.geetest_slider_button') ||
    !!document.querySelector('.geetest_success, .geetest_success_radar_tip')

  async function attempt() {
    const open = document.querySelector('.geetest_btn, .geetest_radar_btn')
    if (open && !document.querySelector('.geetest_slider_button')) {
      open.click()
      await sleep(jitter(700, 1400))
    }
    const handle = document.querySelector('.geetest_slider_button')
    if (!handle) return false
    const track = document.querySelector('.geetest_slider, .geetest_track') || handle.parentElement
    const distance = Math.max(40, track.getBoundingClientRect().width - handle.getBoundingClientRect().width - 6)
    log(`drag ${Math.round(distance)}px`)
    await drag(handle, distance)
    await sleep(1200)
    return solved()
  }

  function run() {
    let n = 0
    const tick = async () => {
      if (n >= 5) return
      n++
      if (solved()) return
      await sleep(n === 1 ? jitter(600, 1200) : jitter(1800, 2800))
      try {
        if (await attempt()) log('solved')
      } catch (e) {
        log(`attempt failed: ${e}`, 'warn')
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
      if (inFrame || document.querySelector('.geetest_slider_button, .geetest_btn')) run()
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
        id: `gtb:${key}`,
        inputType: 'boolean',
        inputDefaultValue: value,
        title,
        inputLabel: label,
      })
    }
  }
  switchMenu(`Auto-bypass on ${site}`, `on:${site}`, enabled, 'Drag GeeTest sliders automatically')
})()
