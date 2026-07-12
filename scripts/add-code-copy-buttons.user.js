// ==UserScript==
// @name         Add copy buttons to <pre><code> blocks
// @namespace    https://github.com/chirag127/userscripts-script
// @version      0.1.0
// @description  Inject a small "copy" button on every code block so you can grab the snippet without hand-selecting. One click copies innerText; button flashes "copied" for 1s.
// @author       chirag127
// @match        *://*/*
// @run-at       document-idle
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts-script/blob/main/scripts/add-code-copy-buttons.user.js
// @supportURL   https://github.com/chirag127/userscripts-script/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/add-code-copy-buttons.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/add-code-copy-buttons.user.js
// ==/UserScript==

/*
README (folded from add-code-copy-buttons/README.md during flat-restructure 2026-07-12)

# add-code-copy-buttons

[⭐ Star this Repo ⭐](https://github.com/chirag127/userscripts-script)

Injects a small "copy" button on every `<pre><code>` block so you can grab a snippet without hand-selecting. One click copies the code; the button flashes "copied" for a second.

## Install

[Click here to install in Tampermonkey / Violentmonkey / ScriptCat](https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/add-code-copy-buttons.user.js)

Auto-updates on every push via the `@updateURL` metadata.

## Behavior

1. On page load (`document-idle`), scans for `pre code`, `pre.prettyprint`, and `div.highlight pre`
2. Injects a top-right "copy" button on each block (idempotent — marked via `data-ccb-injected`)
3. Click copies `innerText` to the clipboard via `GM_setClipboard`
4. A `MutationObserver` catches late-rendered blocks on SPA docs sites, GitHub file view, Discourse, etc.

## Settings

Open the Tampermonkey/Violentmonkey/ScriptCat menu (puzzle-piece icon → this script's name):

| Menu entry | What it does |
|---|---|
| `Copy buttons: ON/OFF` | Master toggle. When OFF, the script exits before injecting anything. |

## Known limitations

- Only targets three common selectors — sites with exotic markup (e.g. `<div class="codehilite">` without a `<pre>`) are skipped. Add your own selector to `SELECTOR` if needed.
- If a host page already positions its `<pre>` non-`static`, the button rides that positioning; if the host uses `overflow: hidden` on a very short block, the button may clip.
- No syntax-aware trimming — copies whatever `innerText` returns, including line numbers if the host page renders them inside the `<code>`.

## License

MIT. See [LICENSE](../LICENSE).
*/

(() => {
  'use strict'

  const MARK = 'data-ccb-injected'
  const SELECTOR = 'pre code, pre.prettyprint, div.highlight pre'

  const enabled = GM_getValue('enabled', true)
  GM_registerMenuCommand(
    `Copy buttons: ${enabled ? 'ON' : 'OFF'} — click to toggle`,
    () => { GM_setValue('enabled', !enabled); location.reload() }
  )
  if (!enabled) return

  // Resolve the visual container to position the button against. For `pre code`
  // we want the <pre>, not the inner <code>, so absolute positioning covers the
  // whole block. For `div.highlight pre` the <pre> itself is fine.
  function hostOf(el) {
    if (el.tagName === 'CODE' && el.parentElement && el.parentElement.tagName === 'PRE') return el.parentElement
    return el
  }

  function makeButton(codeEl) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.textContent = 'copy'
    Object.assign(btn.style, {
      position: 'absolute',
      top: '6px',
      right: '6px',
      zIndex: '2147483646',
      padding: '2px 8px',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      fontSize: '11px',
      lineHeight: '1.4',
      color: '#fff',
      background: 'rgba(0, 0, 0, 0.55)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '4px',
      cursor: 'pointer',
      opacity: '0.7',
    })
    btn.addEventListener('mouseenter', () => { btn.style.opacity = '1' })
    btn.addEventListener('mouseleave', () => { btn.style.opacity = '0.7' })
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      GM_setClipboard(codeEl.innerText)
      const prev = btn.textContent
      btn.textContent = 'copied'
      setTimeout(() => { btn.textContent = prev }, 1000)
    })
    return btn
  }

  function inject(el) {
    const host = hostOf(el)
    if (host.hasAttribute(MARK)) return
    host.setAttribute(MARK, '1')
    // Only override position if the host is static — don't fight a host page
    // that already positions its <pre> relatively/absolutely.
    const pos = getComputedStyle(host).position
    if (pos === 'static') host.style.position = 'relative'
    host.appendChild(makeButton(el))
  }

  function scan(root) {
    root.querySelectorAll(SELECTOR).forEach(inject)
  }

  scan(document)

  // Handle SPA route changes + late-rendered code blocks (docs sites, Discourse,
  // GitHub file view, etc.). Debounced via microtask coalescing.
  let pending = false
  const mo = new MutationObserver(() => {
    if (pending) return
    pending = true
    queueMicrotask(() => { pending = false; scan(document) })
  })
  mo.observe(document.body, { childList: true, subtree: true })
})()
