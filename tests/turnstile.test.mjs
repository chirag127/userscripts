import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'

const SRC = readFileSync(
  new URL('../scripts/turnstile-auto-bypass/turnstile-auto-bypass.user.js', import.meta.url),
  'utf8'
)

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

async function until(fn, timeout = 6000) {
  const end = Date.now() + timeout
  while (Date.now() < end) {
    const v = fn()
    if (v) return v
    await wait(50)
  }
  return null
}

function boot(html, url, store = {}) {
  const dom = new JSDOM(html, { url, runScripts: 'outside-only', pretendToBeVisual: true })
  const w = dom.window
  w.unsafeWindow = w
  w.GM_getValue = (k, d) => (k in store ? store[k] : d)
  w.GM_setValue = (k, v) => {
    store[k] = v
  }
  w.GM_log = () => {}
  w.CAT_registerMenuInput = () => {}
  w.eval(SRC)
  return new Promise((resolve) => {
    if (w.document.readyState === 'loading') {
      w.document.addEventListener('DOMContentLoaded', () => resolve(w), { once: true })
    } else {
      resolve(w)
    }
  })
}

const FRAME_URL = 'https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/b/turnstile/1'

test('clicks a checkbox inside a closed shadow root with a trusted-looking event', async () => {
  const w = await boot('<div id="host"></div>', FRAME_URL)
  const host = w.document.getElementById('host')
  const root = host.attachShadow({ mode: 'closed' })
  root.innerHTML = '<label class="cb-lb"><input type="checkbox"></label>'
  const input = root.querySelector('input')

  let trusted = false
  let clicks = 0
  input.addEventListener('click', (e) => {
    clicks++
    if (e.isTrusted) trusted = true
  })

  const done = await until(() => input.checked, 6000)
  assert.ok(done, 'checkbox should end up checked')
  assert.ok(clicks > 0, 'click must land on the input')
  assert.equal(trusted, true, 'isTrusted must be spoofed for the duration of the click')
})

test('stops after the checkbox is checked and does not toggle it back', async () => {
  const w = await boot('<div id="host"></div>', FRAME_URL)
  const root = w.document.getElementById('host').attachShadow({ mode: 'closed' })
  root.innerHTML = '<label><input type="checkbox"></label>'
  const input = root.querySelector('input')
  await until(() => input.checked, 6000)
  assert.equal(input.checked, true)
  await wait(2600)
  assert.equal(input.checked, true)
})

test('page side fires change and auto-submits when a token arrives', async () => {
  const store = { 'submit:example.com': true }
  const w = await boot(
    '<form><div class="cf-turnstile" data-sitekey="0x4AAA"></div>' +
      '<input type="hidden" name="cf-turnstile-response">' +
      '<button type="submit">go</button></form>',
    'https://example.com/',
    store
  )
  const input = w.document.querySelector('[name="cf-turnstile-response"]')
  let changed = false
  input.addEventListener('change', () => {
    changed = true
  })
  let submitted = false
  w.document.querySelector('button').addEventListener('click', () => {
    submitted = true
  })
  input.value = 'tok123'
  assert.ok(await until(() => changed, 4000), 'change event expected')
  assert.ok(await until(() => submitted, 4000), 'auto-submit expected')
})

test('does nothing when disabled for the host', async () => {
  const w = await boot(
    '<div class="cf-turnstile" data-sitekey="0x4AAA"></div>',
    'https://example.com/',
    { 'on:example.com': false }
  )
  await wait(1500)
  const hud = [...w.document.querySelectorAll('div')].find((d) => d.style.zIndex === '2147483647')
  assert.equal(hud, undefined)
})

test('ignores hCaptcha UUID sitekeys on a page without turnstile', async () => {
  const w = await boot('<div data-sitekey="10000000-ffff-ffff-ffff-000000000001"></div>', 'https://example.com/')
  await wait(1500)
  const hud = [...w.document.querySelectorAll('div')].find((d) => d.style.zIndex === '2147483647')
  assert.equal(hud, undefined)
})
