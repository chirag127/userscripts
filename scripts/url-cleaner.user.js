// ==UserScript==
// @name         Strip URL tracking params
// @namespace    https://github.com/chirag127/userscripts-script
// @version      0.1.0
// @description  Strip utm_*, fbclid, gclid, mc_eid, msclkid etc. from the address bar on load and from URLs copied to clipboard. No more tracking-tagged links pasted into chats.
// @author       chirag127
// @match        *://*/*
// @run-at       document-start
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts-script/blob/main/scripts/url-cleaner.user.js
// @supportURL   https://github.com/chirag127/userscripts-script/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/url-cleaner.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/url-cleaner.user.js
// ==/UserScript==

/*
README (folded from url-cleaner/README.md during flat-restructure 2026-07-12)

# url-cleaner

[⭐ Star this Repo ⭐](https://github.com/chirag127/userscripts-script)

Strips tracking params (`utm_*`, `fbclid`, `gclid`, `mc_eid`, `msclkid`, `igshid`, `si`, …) from URLs on two fronts:

1. **Address bar** — on page load, cleaned via `history.replaceState` (no reload, no navigation).
2. **Clipboard** — when you copy/cut a URL from any page, the pasted text is the cleaned version.

## Install

[Click here to install in Tampermonkey / Violentmonkey / ScriptCat](https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/url-cleaner.user.js)

Auto-updates on every push via `@updateURL`.

## Params stripped

`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `fbclid`, `gclid`, `mc_eid`, `mc_cid`, `mkt_tok`, `igshid`, `si`, `ref`, `ref_src`, `rss_source`, `_ga`, `ncid`, `cmpid`, `uid`, `affiliate`, `partner_id`, `vero_id`, `zenid`, `yclid`, `dclid`, `msclkid`, `twclid`, `li_fat_id`, `soc_src`, `soc_trk`, `__hstc`, `__hssc`, `__hsfp`, `hsCtaTracking`.

Path, anchor (`#…`), and every other query param are preserved.

## Settings

Tampermonkey menu (puzzle-piece icon → this script's name):

| Menu entry | Default |
|---|---|
| `Clean address bar: ON/OFF` | ON |
| `Clean copied URLs: ON/OFF` | ON |

## Known limitations

- `ref` and `si` are ambiguous — some sites use them as legit routing (YouTube share `?si=…`, forum `?ref=…`). Strip anyway; if a site breaks, toggle `Clean address bar` OFF for that session.
- Only http/https URLs on the clipboard are rewritten — plain text like `check out example.com?utm_source=x` is left alone (not a full URL).
- Runs at `document-start`; SPAs that push tracking params in a later `pushState` won't be re-cleaned. Reload triggers a clean.

## License

MIT. See [LICENSE](../LICENSE).
*/

(() => {
  'use strict'

  // Params to strip. Lowercased; matching is case-insensitive.
  const BAD = new Set([
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'fbclid', 'gclid', 'mc_eid', 'mc_cid', 'mkt_tok',
    'igshid', 'si', 'ref', 'ref_src', 'rss_source',
    '_ga', 'ncid', 'cmpid', 'uid', 'affiliate', 'partner_id',
    'vero_id', 'zenid', 'yclid', 'dclid', 'msclkid', 'twclid',
    'li_fat_id', 'soc_src', 'soc_trk',
    '__hstc', '__hssc', '__hsfp', 'hsctatracking',
  ])

  // ---- settings -----------------------------------------------------------
  const settings = {
    cleanAddressBar: GM_getValue('cleanAddressBar', true),
    cleanClipboard: GM_getValue('cleanClipboard', true),
  }
  const persist = (k, v) => { settings[k] = v; GM_setValue(k, v) }

  GM_registerMenuCommand(
    `Clean address bar: ${settings.cleanAddressBar ? 'ON' : 'OFF'} — click to toggle`,
    () => { persist('cleanAddressBar', !settings.cleanAddressBar); location.reload() }
  )
  GM_registerMenuCommand(
    `Clean copied URLs: ${settings.cleanClipboard ? 'ON' : 'OFF'} — click to toggle`,
    () => { persist('cleanClipboard', !settings.cleanClipboard); location.reload() }
  )

  // ---- core ---------------------------------------------------------------
  // Returns cleaned URL string, or null if nothing changed. Preserves anchor
  // and path. Non-URL strings return null (caller keeps original).
  function cleanUrl(input) {
    let u
    try { u = new URL(input) } catch { return null }
    let changed = false
    // Collect keys first — mutating during iteration on URLSearchParams is unsafe.
    const drop = []
    for (const k of u.searchParams.keys()) {
      if (BAD.has(k.toLowerCase())) drop.push(k)
    }
    for (const k of drop) { u.searchParams.delete(k); changed = true }
    return changed ? u.toString() : null
  }

  // ---- address bar --------------------------------------------------------
  if (settings.cleanAddressBar) {
    const cleaned = cleanUrl(location.href)
    if (cleaned) history.replaceState(history.state, '', cleaned)
  }

  // ---- clipboard patch ----------------------------------------------------
  // Rewrite the copied text if it looks like a URL. Runs on copy/cut in the
  // capture phase so we win over host-page handlers.
  if (settings.cleanClipboard) {
    const handler = (e) => {
      const sel = document.getSelection()?.toString() ?? ''
      if (!sel || !/^https?:\/\//i.test(sel.trim())) return
      const cleaned = cleanUrl(sel.trim())
      if (!cleaned) return
      e.clipboardData?.setData('text/plain', cleaned)
      e.preventDefault()
    }
    document.addEventListener('copy', handler, true)
    document.addEventListener('cut', handler, true)
  }
})()
