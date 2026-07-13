# anti-hijack-guard

[⭐ Star this Repo ⭐](https://github.com/chirag127/userscripts)

Restores right-click, text selection, copy/cut, drag, and keyboard shortcuts on pages that block them.

## Install

[Click here to install in Tampermonkey / Violentmonkey / ScriptCat](https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/anti-hijack-guard/anti-hijack-guard.user.js)

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
- **Cross-origin iframes** — `@match *://*/*` runs in every frame, but if the host page's frame policy prevents userscript injection into an iframe, that iframe stays hijacked.
- **Pages that use `pointer-events: none` on overlays** — not a hijack; those pages need a different fix.

## License

MIT. See [LICENSE](../../LICENSE).
