// ==UserScript==
// @name         reCAPTCHA v2 Auto-Bypass
// @namespace    https://github.com/chirag127/userscripts
// @version      1.0.0
// @description  Ticks reCAPTCHA v2 checkboxes and fires grecaptcha.execute() for v3/invisible, with fake-trusted pointer events inside the anchor frame. ScriptCat switches, on by default, no solver API.
// @author       chirag127
// @match        *://*/*
// @match        https://www.google.com/recaptcha/*
// @match        https://recaptcha.net/recaptcha/*
// @run-at       document-start
// @grant        unsafeWindow
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_log
// @grant        CAT_registerMenuInput
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts/tree/main/scripts/recaptcha-auto-bypass
// @supportURL   https://github.com/chirag127/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/recaptcha-auto-bypass/recaptcha-auto-bypass.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/recaptcha-auto-bypass/recaptcha-auto-bypass.user.js
// ==/UserScript==

(() => {
  'use strict'

  const W = typeof unsafeWindow === 'undefined' ? window : unsafeWindow
  const inFrame = /(^|\.)google\.com$|(^|\.)recaptcha\.net$/.test(location.hostname)
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const jitter = (a, b) => a + Math.random() * (b - a)
  const log = (m, l = 'debug') => {
    console.debug('[tsb]', m)
    try {
      GM_log(`[recaptcha] ${m}`, l)
    } catch {}
  }

  const site = (() => {
    if (!inFrame) return location.hostname
    for (const o of location.ancestorOrigins || []) {
      try {
        const h = new URL(o).hostname
        if (h && !/(^|\.)google\.com$|(^|\.)recaptcha\.net$/.test(h)) return h
      } catch {}
    }
    return location.hostname
  })()

  const enabled = GM_getValue(`on:${site}`, true)
  if (!enabled) return
  const autoSubmit = GM_getValue(`submit:${site}`, false)
  const isTop = (() => {
    try {
      return window.top === window
    } catch {
      return false
    }
  })()

  const firefox = typeof cloneInto === 'function'
  const into = (o, opts) => (firefox ? cloneInto(o, W, opts) : o)

  // ---- trusted-looking events ---------------------------------------------
  let spoofing = false
  const originals = new WeakMap()
  try {
    const add = W.EventTarget.prototype.addEventListener
    const remove = W.EventTarget.prototype.removeEventListener
    W.EventTarget.prototype.addEventListener = new W.Proxy(
      add,
      into(
        {
          apply(target, self, args) {
            if (typeof args[1] === 'function') {
              const wrapped = new W.Proxy(
                args[1],
                into(
                  {
                    apply(fn, ctx, ev) {
                      if (spoofing) {
                        ev[0] = new W.Proxy(
                          ev[0],
                          into({ get: (e, p) => (p === 'isTrusted' ? true : W.Reflect.get(e, p)) }, {
                            cloneFunctions: true,
                          })
                        )
                      }
                      return W.Reflect.apply(fn, ctx, ev)
                    },
                  },
                  { cloneFunctions: true }
                )
              )
              originals.set(wrapped, args[1])
              args[1] = wrapped
            }
            return W.Reflect.apply(target, self, args)
          },
        },
        { cloneFunctions: true }
      )
    )
    W.EventTarget.prototype.removeEventListener = new W.Proxy(
      remove,
      into(
        {
          apply(t, s, a) {
            const orig = originals.get(a[1])
            if (orig) a[1] = orig
            return W.Reflect.apply(t, s, a)
          },
        },
        { cloneFunctions: true }
      )
    )
  } catch (e) {
    log(`hook failed: ${e}`, 'warn')
  }

  const PE = W.PointerEvent || W.MouseEvent

  function click(el) {
    const r = el.getBoundingClientRect()
    const x = r.left + r.width / 2 + jitter(-2, 2)
    const y = r.top + r.height / 2 + jitter(-2, 2)
    const base = {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: W,
      clientX: x,
      clientY: y,
      button: 0,
      detail: 1,
    }
    const p = { ...base, pointerId: 1, pointerType: 'mouse', isPrimary: true }
    spoofing = true
    try {
      el.dispatchEvent(new PE('pointerover', p))
      el.dispatchEvent(new W.MouseEvent('mouseover', base))
      el.dispatchEvent(new PE('pointerdown', { ...p, buttons: 1 }))
      el.dispatchEvent(new W.MouseEvent('mousedown', { ...base, buttons: 1 }))
      el.dispatchEvent(new PE('pointerup', { ...p, buttons: 0 }))
      el.dispatchEvent(new W.MouseEvent('mouseup', { ...base, buttons: 0 }))
      el.dispatchEvent(new W.MouseEvent('click', { ...base, buttons: 0 }))
    } finally {
      spoofing = false
    }
  }

  const ready = (fn) =>
    document.readyState === 'loading'
      ? document.addEventListener('DOMContentLoaded', fn, { once: true })
      : fn()

  // ---- anchor frame: tick the box -----------------------------------------
  const CHECKED = '.recaptcha-checkbox-checked, [aria-checked="true"]'

  function runFrame() {
    const box = () => document.querySelector('#recaptcha-anchor')
    const solved = () => {
      const b = box()
      return !b || b.classList.contains('recaptcha-checkbox-checked') || b.getAttribute('aria-checked') === 'true'
    }
    let n = 0
    const tick = async () => {
      if (n >= 8 || solved()) return
      n++
      await sleep(n === 1 ? jitter(400, 900) : jitter(2200, 3600))
      if (solved()) return
      const b = box()
      if (!b) return
      log(`click ${n}`)
      click(b)
      await sleep(jitter(100, 220))
      if (solved()) return
      const label = b.closest('label') || b.parentElement
      if (label) click(label)
    }
    const loop = setInterval(tick, 1500)
    setTimeout(() => clearInterval(loop), 60_000)
    tick()
  }

  if (inFrame || !isTop) {
    ready(() => {
      if (inFrame || document.querySelector('#recaptcha-anchor')) runFrame()
    })
    return
  }

  // ---- page side: v3 / invisible + token ----------------------------------
  const TOKEN = 'textarea[name="g-recaptcha-response"], input[name="g-recaptcha-response"]'
  const tokens = () => [...document.querySelectorAll(TOKEN)]
  const hasWidget = () =>
    tokens().length > 0 ||
    !!document.querySelector('.g-recaptcha, [data-sitekey], iframe[src*="recaptcha"]')

  let hud
  function hudText(t) {
    if (!hud) {
      hud = document.createElement('div')
      hud.style.cssText =
        'position:fixed;z-index:2147483647;right:16px;bottom:16px;display:flex;gap:8px;align-items:center;' +
        'padding:8px 12px;border-radius:999px;background:#15171c;color:#f5f6f8;opacity:.95;font:12px/1.4 system-ui,sans-serif'
      const dot = document.createElement('span')
      dot.style.cssText = 'width:8px;height:8px;border-radius:50%;background:#f2a01d;flex:none'
      hud.append(dot, document.createElement('span'))
      ;(document.body || document.documentElement).append(hud)
    }
    hud.lastChild.textContent = t
  }
  const hudDone = (t) => {
    if (!hud) return
    hudText(t)
    hud.firstChild.style.background = '#0e9d8e'
    setTimeout(() => hud?.remove(), 4000)
  }

  async function solve() {
    const until = Date.now() + 90_000
    let execs = 0
    hudText('reCAPTCHA: waiting')
    while (Date.now() < until) {
      const filled = tokens().find((t) => t.value)
      if (filled) {
        for (const t of tokens()) {
          t.dispatchEvent(new W.Event('input', { bubbles: true }))
          t.dispatchEvent(new W.Event('change', { bubbles: true }))
        }
        hudDone('reCAPTCHA: solved')
        log('token present')
        if (autoSubmit) {
          const btn = filled.closest('form')?.querySelector('button[type="submit"], input[type="submit"]')
          if (btn && !btn.disabled) setTimeout(() => btn.click(), 250)
        }
        return
      }
      const g = W.grecaptcha
      if (g?.execute && execs < 6 && Date.now() % 2 === 0) {
        execs++
        try {
          for (const key of ['', ...(g.getResponse ? [] : [])]) void key
          const el = document.querySelector('.g-recaptcha')
          const key = el?.getAttribute('data-sitekey')
          if (key) g.execute(key)
          else g.execute()
          log(`execute ${execs}`)
        } catch {}
        await sleep(3500)
        continue
      }
      await sleep(500)
    }
    if (hud) hudDone('reCAPTCHA: still waiting — click it yourself')
  }

  const switchMenu = (label, key, value, title) => {
    const listener = (next) => {
      GM_setValue(key, next === undefined ? !value : !!next)
      location.reload()
    }
    if (typeof CAT_registerMenuInput === 'function') {
      CAT_registerMenuInput(label, listener, {
        id: `rcb:${key}`,
        inputType: 'boolean',
        inputDefaultValue: value,
        title,
        inputLabel: label,
      })
    }
  }

  switchMenu(`Auto-bypass on ${site}`, `on:${site}`, enabled, 'Tick reCAPTCHA automatically')
  switchMenu(`Auto-submit on ${site}`, `submit:${site}`, autoSubmit, 'Submit once the token arrives')

  let started = false
  const begin = () => {
    if (started || !hasWidget()) return
    started = true
    solve()
  }
  ready(() => {
    begin()
    new MutationObserver(begin).observe(document.documentElement, { childList: true, subtree: true })
  })
})()
