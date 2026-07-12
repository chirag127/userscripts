// ==UserScript==
// @name         Restore right-click + selection + hotkeys
// @namespace    https://github.com/chirag127/userscripts-script
// @version      0.1.0
// @description  Neutralises pages that block right-click, text selection, copy/cut, drag, and keyboard shortcuts. Stops the hijack at document-start before the host page's handlers register.
// @author       chirag127
// @match        *://*/*
// @run-at       document-start
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts-script/blob/main/scripts/anti-hijack-guard.user.js
// @supportURL   https://github.com/chirag127/userscripts-script/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/anti-hijack-guard.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/anti-hijack-guard.user.js
// ==/UserScript==

/*
README (folded from anti-hijack-guard/README.md during flat-restructure 2026-07-12)

# anti-hijack-guard

[⭐ Star this Repo ⭐](https://github.com/chirag127/userscripts-script)

Restores right-click, text selection, copy/cut, drag, and keyboard shortcuts on pages that block them.

## Install

[Click here to install in Tampermonkey / Violentmonkey / ScriptCat](https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/anti-hijack-guard.user.js)

Auto-updates on every push via `@updateURL`.

## Behavior

Runs at `document-start` — before the host page's handlers register. For each of `contextmenu`, `selectstart`, `copy`, `cut`, `dragstart`, `mousedown`, `mouseup`, `keydown`, a capture-phase listener calls `stopImmediatePropagation()` so no page handler ever sees the event. Also neutralises late `document.oncontextmenu = …` assignments by redefining the property setters to no-ops.

## Settings

Open the Tampermonkey/Violentmonkey/ScriptCat menu (puzzle-piece icon → this script's name):

| Menu entry | What it does |
|---|---|
| `Anti-hijack: ON/OFF on <host> — click to toggle` | Disables the script on the current host only. Setting persists via `GM_setValue` and is per-hostname. Reloads the page. |

## Known limitations

- **CSS `user-select: none`** — this script does not touch CSS. If a site uses CSS to block selection, add a per-site style override in your Stylus/Stylish extension.
- **Cross-origin iframes** — `@match *://*\/*` runs in every frame, but if the host page's frame policy prevents userscript injection into an iframe, that iframe stays hijacked.
- **Pages that use `pointer-events: none` on overlays** — not a hijack; those pages need a different fix.

## License

MIT. See [LICENSE](../LICENSE).
*/

(() => {
  'use strict'

  // Per-host disable. Key is `disabled:<host>`; true = script no-ops on this host.
  const host = location.hostname
  const key = `disabled:${host}`
  const disabled = GM_getValue(key, false)

  GM_registerMenuCommand(
    `Anti-hijack: ${disabled ? 'OFF' : 'ON'} on ${host} — click to toggle`,
    () => { GM_setValue(key, !disabled); location.reload() }
  )

  if (disabled) return

  // Events the hijack pages hook to suppress user actions. Listen in the capture
  // phase and stopImmediatePropagation so sibling capture-phase listeners on the
  // same target never fire.
  const events = ['contextmenu', 'selectstart', 'copy', 'cut', 'dragstart', 'mousedown', 'mouseup', 'keydown']
  const kill = (e) => e.stopImmediatePropagation()
  for (const evt of events) window.addEventListener(evt, kill, true)

  // Some pages assign `document.oncontextmenu = () => false` (or similar for
  // onselectstart / oncopy). Redefine the setters to no-op so late assignments
  // can't re-enable the block.
  const noopProps = ['oncontextmenu', 'onselectstart', 'oncopy', 'oncut', 'ondragstart', 'onmousedown', 'onkeydown']
  for (const prop of noopProps) {
    try {
      Object.defineProperty(document, prop, { configurable: true, get: () => null, set: () => {} })
      Object.defineProperty(window, prop, { configurable: true, get: () => null, set: () => {} })
    } catch { /* some hosts freeze these — the capture-phase listener still wins */ }
  }
})()
