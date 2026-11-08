// ==UserScript==
// @name         Cloudflare Turnstile Auto-Bypass
// @namespace    https://github.com/chirag127/userscripts
// @version      1.1.0
// @description  Solves Cloudflare Turnstile without you: clicks the managed checkbox inside the challenge frame with fake-trusted pointer events, taps the Turnstile API for invisible widgets, fires input/change so SPAs see the token, and reloads stuck "Just a moment" interstitials. ScriptCat switches in the popup, on by default.
// @author       chirag127
// @match        *://*/*
// @match        https://challenges.cloudflare.com/*
// @run-at       document-start
// @grant        unsafeWindow
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_log
// @grant        CAT_registerMenuInput
// @grant        CAT_unregisterMenuInput
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts/tree/main/scripts/turnstile-auto-bypass
// @supportURL   https://github.com/chirag127/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/turnstile-auto-bypass/turnstile-auto-bypass.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/turnstile-auto-bypass/turnstile-auto-bypass.user.js
// ==/UserScript==

(() => {
  'use strict'

  const W = typeof unsafeWindow === 'undefined' ? window : unsafeWindow
  const CF = 'challenges.cloudflare.com'
  const inFrame = location.hostname === CF
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const jitter = (min, max) => min + Math.random() * (max - min)
  const log = (msg, level = 'debug') => {
    try {
      GM_log(`[turnstile] ${msg}`, level)
    } catch {}
  }

  // Turnstile renders in a challenges.cloudflare.com frame. The site the user
  // actually cares about is an ancestor origin, so read that for settings.
  const site = (() => {
    if (!inFrame) return location.hostname
    for (const origin of location.ancestorOrigins || []) {
      try {
        const h = new URL(origin).hostname
        if (h && h !== CF) return h
      } catch {}
    }
    try {
      const h = new URL(document.referrer).hostname
      if (h && h !== CF) return h
    } catch {}
    return location.hostname
  })()

  const enabled = GM_getValue(`on:${site}`, true)
  const autoSubmit = GM_getValue(`submit:${site}`, false)
  if (!enabled) return

  const isTop = (() => {
    try {
      return window.top === window
    } catch {
      return false
    }
  })()

  const firefox = typeof cloneInto === 'function'
  const into = (obj, opts) => (firefox ? cloneInto(obj, W, opts) : obj)

  // ---- fake trusted events -------------------------------------------------
  // Turnstile inspects `isTrusted`. Every function listener is wrapped once and
  // only swaps in the fake event while our own dispatch is in flight, so normal
  // page behaviour is untouched.
  let spoofing = false
  const originalListeners = new WeakMap()
  try {
    const add = W.EventTarget.prototype.addEventListener
    const remove = W.EventTarget.prototype.removeEventListener

    W.EventTarget.prototype.addEventListener = new W.Proxy(
      add,
      into(
        {
          apply(target, self, args) {
            const listener = args[1]
            if (typeof listener === 'function') {
              const wrapped = new W.Proxy(
                listener,
                into(
                  {
                    apply(fn, ctx, evArgs) {
                      if (spoofing) {
                        evArgs[0] = new W.Proxy(
                          evArgs[0],
                          into(
                            {
                              get: (ev, prop) =>
                                prop === 'isTrusted' ? true : W.Reflect.get(ev, prop),
                            },
                            { cloneFunctions: true }
                          )
                        )
                      }
                      return W.Reflect.apply(fn, ctx, evArgs)
                    },
                  },
                  { cloneFunctions: true }
                )
              )
              originalListeners.set(wrapped, listener)
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
          apply(target, self, args) {
            const original = originalListeners.get(args[1])
            if (original) args[1] = original
            return W.Reflect.apply(target, self, args)
          },
        },
        { cloneFunctions: true }
      )
    )
  } catch (err) {
    log(`listener hook failed: ${err}`, 'warn')
  }

  const PointerEventCtor = W.PointerEvent || W.MouseEvent

  function pointOf(el) {
    let r = el.getBoundingClientRect()
    if (!r.width || !r.height) r = el.parentElement?.getBoundingClientRect() || r
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  }

  function clickAt(el) {
    const { x, y } = pointOf(el)
    const base = {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: W,
      clientX: x + jitter(-2, 2),
      clientY: y + jitter(-2, 2),
      screenX: x,
      screenY: y,
      button: 0,
      detail: 1,
    }
    const pointer = { ...base, pointerId: 1, pointerType: 'mouse', isPrimary: true }
    spoofing = true
    try {
      el.dispatchEvent(new PointerEventCtor('pointerover', pointer))
      el.dispatchEvent(new W.MouseEvent('mouseover', base))
      el.dispatchEvent(new PointerEventCtor('pointerdown', { ...pointer, buttons: 1 }))
      el.dispatchEvent(new W.MouseEvent('mousedown', { ...base, buttons: 1 }))
      el.dispatchEvent(new PointerEventCtor('pointerup', { ...pointer, buttons: 0 }))
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

  // ---- frame side: click the checkbox -------------------------------------
  // Also runs in same-origin srcdoc/embed widget frames (`!isTop`), which are
  // not on the challenges.cloudflare.com origin but still hold the checkbox.
  const frameWidget = () =>
    inFrame ||
    /turnstile|challenge-platform/.test(location.pathname) ||
    !!document.querySelector('.cf-turnstile, input[name="cf-turnstile-response"]')

  function runFrame() {
    const roots = new Set([document])
    const attempts = new WeakMap()
    const MAX = 6
    let scanning = false
    let deadline = 0

    const track = (root) => {
      if (!root || roots.has(root)) return
      roots.add(root)
      tick()
    }

    // The checkbox is created inside a (often closed) shadow root, so the only
    // way to reach it is to keep the root the page got back from attachShadow.
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
    } catch (err) {
      log(`attachShadow hook failed: ${err}`, 'warn')
    }

    function* boxes() {
      for (const root of roots) {
        for (const el of root.querySelectorAll("input[type='checkbox']")) yield el
      }
    }

    async function attempt(input) {
      const n = attempts.get(input) || 0
      if (n >= MAX) return
      attempts.set(input, n + 1)
      await sleep(n === 0 ? jitter(500, 1200) : jitter(2200, 3800))
      if (!input.isConnected || input.checked) return
      log(`click attempt ${n + 1}`)
      clickAt(input)
      await sleep(jitter(80, 180))
      if (input.checked) return
      const label = input.closest('label') || input.parentElement
      if (label) clickAt(label)
    }

    async function tick() {
      if (scanning || !deadline || Date.now() > deadline) return
      scanning = true
      try {
        for (const input of boxes()) {
          if (!input.checked && (attempts.get(input) || 0) < MAX) await attempt(input)
        }
      } finally {
        scanning = false
      }
    }

    deadline = Date.now() + 60_000
    const loop = setInterval(tick, 1200)
    setTimeout(() => clearInterval(loop), 62_000)
    tick()
  }

  if (inFrame || !isTop) {
    ready(() => {
      if (frameWidget()) runFrame()
    })
    return
  }

  // ---- top side: invisible widgets, tokens, interstitials ------------------
  const RESPONSE = 'input[name="cf-turnstile-response"]'
  const responses = () => [...document.querySelectorAll(RESPONSE)]
  // Turnstile sitekeys start with 0x; hCaptcha reuses data-sitekey with UUIDs.
  const hasWidget = () =>
    responses().length > 0 ||
    !!document.querySelector('.cf-turnstile, iframe[src*="challenges.cloudflare.com"]') ||
    [...document.querySelectorAll('[data-sitekey]')].some((el) =>
      /^0x/i.test(el.getAttribute('data-sitekey') || '')
    )
  const isChallenge = () =>
    !!document.querySelector('#challenge-form, #cf-challenge-running, .cf-browser-verification') ||
    /just a moment|attention required|verifying you are human/i.test(document.title)

  let hud
  function hudText(text) {
    if (!hud) {
      hud = document.createElement('div')
      hud.style.cssText =
        'position:fixed;z-index:2147483647;right:16px;bottom:16px;display:flex;gap:8px;align-items:center;' +
        'padding:8px 12px;border-radius:999px;background:#15171c;color:#f5f6f8;opacity:.95;' +
        'font:12px/1.4 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.35)'
      const dot = document.createElement('span')
      dot.style.cssText = 'width:8px;height:8px;border-radius:50%;background:#f2a01d;flex:none'
      hud.append(dot, document.createElement('span'))
      ;(document.body || document.documentElement).append(hud)
    }
    hud.lastChild.textContent = text
  }
  const hudDone = (text) => {
    if (!hud) return
    hudText(text)
    hud.firstChild.style.background = '#0e9d8e'
    setTimeout(() => hud?.remove(), 4000)
  }

  let reloading = false
  function reloadOnce() {
    if (reloading) return
    const key = `tsb:reload:${site}`
    let state = { n: 0, t: 0 }
    try {
      state = JSON.parse(sessionStorage.getItem(key) || 'null') || state
    } catch {}
    if (Date.now() - state.t > 600_000) state = { n: 0, t: Date.now() }
    if (state.n >= 3) return
    try {
      sessionStorage.setItem(key, JSON.stringify({ n: state.n + 1, t: Date.now() }))
    } catch {}
    reloading = true
    log('reloading stuck interstitial')
    location.reload()
  }

  async function solve() {
    const until = Date.now() + 90_000
    let execs = 0
    let lastExec = 0
    hudText('Turnstile: waiting')

    while (Date.now() < until) {
      const inputs = responses()
      const token = inputs.find((i) => i.value)

      if (token) {
        for (const input of inputs) {
          input.dispatchEvent(new W.Event('input', { bubbles: true }))
          input.dispatchEvent(new W.Event('change', { bubbles: true }))
        }
        hudDone('Turnstile: solved')
        log('token present')
        if (autoSubmit) {
          const form = token.closest('form')
          const button = form?.querySelector(
            'button[type="submit"], input[type="submit"], button:not([type])'
          )
          if (button && !button.disabled) setTimeout(() => button.click(), 250)
        }
        return
      }

      const api = W.turnstile
      if (api && typeof api.execute === 'function' && execs < 8 && Date.now() - lastExec > 3500) {
        lastExec = Date.now()
        execs++
        try {
          const box = document.querySelector('.cf-turnstile, [data-sitekey]')
          box ? api.execute(box) : api.execute()
          log(`execute() #${execs}`)
        } catch {}
      }

      if (isChallenge() && Date.now() > until - 60_000) reloadOnce()

      await sleep(500)
    }

    if (hud) hudDone('Turnstile: still waiting — click it yourself')
  }

  // ScriptCat boolean switch in the popup, one per site.
  function switchMenu(label, key, value, title) {
    const listener = (next) => {
      GM_setValue(key, next === undefined ? !value : !!next)
      location.reload()
    }
    if (typeof CAT_registerMenuInput === 'function') {
      CAT_registerMenuInput(label, listener, {
        id: `tsb:${key}`,
        inputType: 'boolean',
        inputDefaultValue: value,
        title,
        inputLabel: label,
      })
    } else {
      GM_registerMenuCommand(`${label}: ${value ? 'ON' : 'OFF'}`, () => listener(!value))
    }
  }

  switchMenu(`Auto-bypass on ${site}`, `on:${site}`, enabled, 'Tick Turnstile automatically on this site')
  switchMenu(
    `Auto-submit on ${site}`,
    `submit:${site}`,
    autoSubmit,
    'Submit the form once the token arrives'
  )

  let started = false
  const begin = () => {
    if (started || (!hasWidget() && !isChallenge())) return
    started = true
    solve()
  }

  ready(() => {
    begin()
    new MutationObserver(begin).observe(document.documentElement, {
      childList: true,
      subtree: true,
    })
  })
})()
