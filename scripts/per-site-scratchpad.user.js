// ==UserScript==
// @name         Per-domain persistent scratchpad
// @namespace    https://github.com/chirag127/userscripts-script
// @version      0.1.0
// @description  Fixed-position textarea per hostname. Notes persist across page loads via GM storage. Toggle from menu, Esc to close. Useful for jotting selectors, TODOs, or credentials-in-progress without a second tab.
// @author       chirag127
// @match        *://*/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts-script/blob/main/scripts/per-site-scratchpad.user.js
// @supportURL   https://github.com/chirag127/userscripts-script/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/per-site-scratchpad.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/per-site-scratchpad.user.js
// ==/UserScript==

/*
README (folded from per-site-scratchpad/README.md during flat-restructure 2026-07-12)

# per-site-scratchpad

[⭐ Star this Repo ⭐](https://github.com/chirag127/userscripts-script)

A fixed-position textarea, one per hostname, persisted across page loads. Jot selectors, TODOs, form values, or credentials-in-progress without opening a second tab.

## Install

[Click here to install in Tampermonkey / Violentmonkey / ScriptCat](https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/per-site-scratchpad.user.js)

Auto-updates on every push via the `@updateURL` metadata.

## Behavior

1. Open the Tampermonkey/Violentmonkey/ScriptCat menu (puzzle-piece icon → `Toggle scratchpad`) — a resizable textarea appears bottom-right
2. Type. Content saves 500ms after your last keystroke via `GM_setValue`
3. `Esc` closes the pad. Visibility state persists per-host, so if you left it open on `github.com` it reopens next visit
4. Notes are keyed by `location.hostname` — `github.com` and `gitlab.com` get independent pads

## Config

No settings UI. One menu entry: `Toggle scratchpad`. Drag the corner to resize.

Storage keys (visible in Tampermonkey → Storage tab):
- `scratchpad:<hostname>` — the note contents
- `scratchpad-open:<hostname>` — whether the pad was visible on last close

## Known limitations

- **Same-hostname only.** `docs.example.com` and `blog.example.com` are separate pads. This is intentional — subdomain-scoped notes are usually what you want.
- **No sync across browsers.** GM storage is per-manager, per-profile. Export via Tampermonkey's backup if you want to migrate.
- **z-index max.** If a host page uses `z-index: 2147483647` on a modal, the pad may fight it. Rare.
- **No rich text.** Plain textarea by design — a scratchpad, not an editor.

## License

MIT. See [LICENSE](../LICENSE).
*/

(() => {
  'use strict'

  const KEY = 'scratchpad:' + location.hostname
  const OPEN_KEY = 'scratchpad-open:' + location.hostname
  let pad = null
  let saveTimer = null

  function build() {
    if (pad) return pad
    pad = document.createElement('textarea')
    pad.value = GM_getValue(KEY, '')
    pad.spellcheck = false
    Object.assign(pad.style, {
      position: 'fixed',
      right: '16px',
      bottom: '16px',
      width: '320px',
      height: '200px',
      minWidth: '200px',
      minHeight: '80px',
      maxWidth: '90vw',
      maxHeight: '80vh',
      zIndex: '2147483647',
      padding: '10px',
      border: '1px solid #444',
      borderRadius: '6px',
      background: 'rgba(20, 20, 20, 0.92)',
      color: '#eee',
      font: '13px/1.4 ui-monospace, Menlo, Consolas, monospace',
      resize: 'both',
      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
      outline: 'none',
    })
    pad.placeholder = `scratchpad — ${location.hostname}`

    // Debounce writes. 500ms feels instant, avoids hammering GM_setValue on fast typing.
    pad.addEventListener('input', () => {
      clearTimeout(saveTimer)
      saveTimer = setTimeout(() => GM_setValue(KEY, pad.value), 500)
    })

    // Esc closes; blur first so host-page shortcuts don't hijack.
    pad.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); hide() }
    })

    document.body.appendChild(pad)
    return pad
  }

  function show() {
    build().style.display = 'block'
    pad.focus()
    GM_setValue(OPEN_KEY, true)
  }

  function hide() {
    if (pad) pad.style.display = 'none'
    GM_setValue(OPEN_KEY, false)
  }

  function toggle() {
    if (!pad || pad.style.display === 'none') show()
    else hide()
  }

  GM_registerMenuCommand('Toggle scratchpad', toggle)

  // Restore visibility state per-host.
  if (GM_getValue(OPEN_KEY, false)) show()
})()
