// ==UserScript==
// @name         Force old.reddit.com
// @namespace    https://github.com/chirag127/userscripts-script
// @version      0.1.0
// @description  Redirect new Reddit (www/sh/bare) to old.reddit.com. Old UI loads faster, no infinite-scroll, saner comment threading.
// @author       chirag127
// @match        https://www.reddit.com/*
// @match        https://sh.reddit.com/*
// @match        https://reddit.com/*
// @run-at       document-start
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts-script/blob/main/scripts/reddit-force-old.user.js
// @supportURL   https://github.com/chirag127/userscripts-script/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/reddit-force-old.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/reddit-force-old.user.js
// ==/UserScript==

/*
README (folded from reddit-force-old/README.md during flat-restructure 2026-07-12)

# reddit-force-old

Userscript that redirects new Reddit (`www.reddit.com`, `sh.reddit.com`, bare `reddit.com`) to `old.reddit.com`. Old UI is faster, no infinite scroll, comment threading is saner.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) (or Violentmonkey / ScriptCat).
2. Click → **[install](https://github.com/chirag127/userscripts-script/raw/main/scripts/reddit-force-old.user.js)**

## How it works

Runs at `document-start`. If the current hostname is one of the three new-Reddit hosts, calls `location.replace()` to the `old.reddit.com` equivalent, preserving path, query, and hash. No DOM parsing, no wait for load — the switch happens before any new-Reddit JS runs.

## Config

Menu command via Tampermonkey icon: **Toggle force-old**. Flips a `GM_setValue` flag and reloads. Use it when you need to visit new Reddit temporarily (e.g. a feature old Reddit doesn't render — chat, some polls).

State persists per-browser via `GM_setValue`.

## Known limitations

- **`old.reddit.com` is Reddit-hosted** and can be sunsetted at any time. This script is a workaround, not a permanent fix.
- **Some subreddits** force the new redesign for logged-in users regardless of `old.` host. Those still redirect back — no client-side workaround.
- **`np.reddit.com`, `i.reddit.com`, `amp.reddit.com`** are not matched. Add manually to `@match` if wanted.

## License

MIT.
*/

(() => {
  'use strict'

  const HOSTS = new Set(['www.reddit.com', 'sh.reddit.com', 'reddit.com'])

  if (GM_getValue('enabled', true) && HOSTS.has(location.hostname)) {
    location.replace('https://old.reddit.com' + location.pathname + location.search + location.hash)
    return
  }

  GM_registerMenuCommand('Toggle force-old (currently: ' + (GM_getValue('enabled', true) ? 'ON' : 'OFF') + ')', () => {
    GM_setValue('enabled', !GM_getValue('enabled', true))
    location.reload()
  })
})()
