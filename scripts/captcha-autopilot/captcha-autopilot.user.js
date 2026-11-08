// ==UserScript==
// @name         Captcha Autopilot (Turnstile + reCAPTCHA + hCaptcha)
// @namespace    https://github.com/chirag127/userscripts
// @version      1.0.0
// @description  One script for the three common checkboxes: Cloudflare Turnstile, reCAPTCHA v2 and hCaptcha. Ticks them with fake-trusted pointer events in their frames, calls execute() for invisible widgets, fires token change events. ScriptCat switches, on by default.
// @author       chirag127
// @match        *://*/*
// @match        https://challenges.cloudflare.com/*
// @match        https://www.google.com/recaptcha/*
// @match        https://recaptcha.net/recaptcha/*
// @match        https://newassets.hcaptcha.com/*
// @match        https://hcaptcha.com/*
// @run-at       document-start
// @grant        unsafeWindow
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_log
// @grant        CAT_registerMenuInput
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts/tree/main/scripts/captcha-autopilot
// @supportURL   https://github.com/chirag127/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/captcha-autopilot/captcha-autopilot.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/captcha-autopilot/captcha-autopilot.user.js
// ==/UserScript==

(() => {
  'use strict'

  const W = typeof unsafeWindow === 'undefined' ? window : unsafeWindow
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const jitter = (a, b) => a + Math.random() * (b - a)
  const log = (m, l = 'debug') => {
    console.debug('[tsb]', m)
    try {
      GM_log(`[autopilot] ${m}`, l)
    } catch {}
  }

  const HOST = location.hostname
  const VENDOR = /(^|\.)cloudflare\.com$/.test(HOST)
    ? 'turnstile'
    : /(^|\.)google\.com$|(^|\.)recaptcha\.net$/.test(HOST)
      ? 'recaptcha'
      : /(^|\.)hcaptcha\.com$/.test(HOST)
        ? 'hcaptcha'
        : null

  const VENDOR_HOST = {
    turnstile: /(^|\.)cloudflare\.com$/,
    recaptcha: /(^|\.)google\.com$|(^|\.)recaptcha\.net$/,
    hcaptcha: /(^|\.)hcaptcha\.com$/,
  }

  const site = (() => {
    if (!VENDOR) return HOST
    for (const o of location.ancestorOrigins || []) {
      try {
        const h = new URL(o).hostname
        if (h && !VENDOR_HOST[VENDOR].test(h)) return h
      } catch {}
    }
    return HOST
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

  // ---- frame side ----------------------------------------------------------
  const roots = new Set([document])
  const track = (root) => {
    if (root && !roots.has(root)) roots.add(root)
  }

  const FRAME = {
    turnstile: {
      find: () => {
        for (const root of roots) {
          const hit = root.querySelector?.("input[type='checkbox']")
          if (hit) return hit
        }
        return null
      },
      solved: (b) => !b || b.checked,
    },
    recaptcha: {
      find: () => document.querySelector('#recaptcha-anchor'),
      solved: (b) =>
        !b ||
        b.classList.contains('recaptcha-checkbox-checked') ||
        b.getAttribute('aria-checked') === 'true',
    },
    hcaptcha: {
      find: () => document.querySelector('#checkbox, [role="checkbox"]'),
      solved: (b) =>
        !b || b.getAttribute('aria-checked') === 'true' || b.classList.contains('checked'),
    },
  }

  function runFrame() {
    const engine = FRAME[VENDOR] || FRAME.turnstile
    try {
      const attach = W.Element.prototype.attachShadow
      W.Element.prototype.attachShadow = new W.Proxy(
        attach,
        into(
          {
            apply(target, self, args) {
              const root = W.Reflect.apply(target, self, args)
              track(root)
              return root
            },
          },
          { cloneFunctions: true }
        )
      )
    } catch {}
    let n = 0
    const tick = async () => {
      const box = engine.find()
      if (n >= 8 || engine.solved(box)) return
      n++
      await sleep(n === 1 ? jitter(400, 1000) : jitter(2200, 3600))
      const live = engine.find()
      if (!live || engine.solved(live)) return
      log(`${VENDOR} click ${n}`)
      click(live)
      await sleep(jitter(100, 220))
      if (engine.solved(live)) return
      const label = live.closest('label') || live.parentElement
      if (label) click(label)
    }
    const loop = setInterval(tick, 1500)
    setTimeout(() => clearInterval(loop), 60_000)
    tick()
  }

  if (VENDOR || !isTop) {
    ready(() => {
      if (VENDOR || document.querySelector('#recaptcha-anchor, #checkbox, input[type="checkbox"]')) runFrame()
    })
    return
  }

  // ---- page side -----------------------------------------------------------
  const VENDORS = {
    turnstile: {
      token: 'input[name="cf-turnstile-response"]',
      widget: '.cf-turnstile, iframe[src*="challenges.cloudflare.com"]',
      exec: () => {
        const api = W.turnstile
        if (!api?.execute) return false
        const el = document.querySelector('.cf-turnstile')
        el ? api.execute(el) : api.execute()
        return true
      },
    },
    recaptcha: {
      token: 'textarea[name="g-recaptcha-response"], input[name="g-recaptcha-response"]',
      widget: '.g-recaptcha, iframe[src*="recaptcha"]',
      exec: () => {
        const api = W.grecaptcha
        if (!api?.execute) return false
        const key = document.querySelector('.g-recaptcha')?.getAttribute('data-sitekey')
        key ? api.execute(key) : api.execute()
        return true
      },
    },
    hcaptcha: {
      token: 'textarea[name="h-captcha-response"], input[name="h-captcha-response"]',
      widget: '.h-captcha, iframe[src*="hcaptcha"]',
      exec: () => {
        const api = W.hcaptcha
        if (!api?.execute) return false
        const id = document.querySelector('.h-captcha')?.getAttribute('data-hcaptcha-widget-id')
        id ? api.execute(id) : api.execute()
        return true
      },
    },
  }

  const activeNow = () =>
    Object.entries(VENDORS).filter(
      ([, v]) => document.querySelector(v.token) || document.querySelector(v.widget)
    )

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
    const active = activeNow()
    if (!active.length) return
    const names = active.map(([n]) => n).join(', ')
    const until = Date.now() + 90_000
    hudText(`${names}: waiting`)
    let execs = 0
    while (Date.now() < until) {
      for (const [name, v] of active) {
        const filled = [...document.querySelectorAll(v.token)].find((t) => t.value)
        if (!filled) continue
        for (const t of document.querySelectorAll(v.token)) {
          t.dispatchEvent(new W.Event('input', { bubbles: true }))
          t.dispatchEvent(new W.Event('change', { bubbles: true }))
        }
        hudDone(`${name}: solved`)
        log(`${name} token present`)
        if (autoSubmit) {
          const btn = filled.closest('form')?.querySelector('button[type="submit"], input[type="submit"]')
          if (btn && !btn.disabled) setTimeout(() => btn.click(), 250)
        }
        return
      }
      if (execs < 8) {
        let fired = false
        for (const [, v] of active) {
          try {
            if (v.exec()) fired = true
          } catch {}
        }
        if (fired) {
          execs++
          log(`execute ${execs}`)
          await sleep(3500)
          continue
        }
      }
      await sleep(500)
    }
    if (hud) hudDone('Captcha: still waiting — click it yourself')
  }

  const switchMenu = (label, key, value, title) => {
    const listener = (next) => {
      GM_setValue(key, next === undefined ? !value : !!next)
      location.reload()
    }
    if (typeof CAT_registerMenuInput === 'function') {
      CAT_registerMenuInput(label, listener, {
        id: `cap:${key}`,
        inputType: 'boolean',
        inputDefaultValue: value,
        title,
        inputLabel: label,
      })
    }
  }
  switchMenu(`Auto-bypass on ${site}`, `on:${site}`, enabled, 'Tick captchas automatically')
  switchMenu(`Auto-submit on ${site}`, `submit:${site}`, autoSubmit, 'Submit once the token arrives')

  let started = false
  const begin = () => {
    if (started || !activeNow().length) return
    started = true
    solve()
  }

  ready(() => {
    begin()
    new MutationObserver(begin).observe(document.documentElement, { childList: true, subtree: true })
  })
})()
