# copy-email-links

[⭐ Star this Repo ⭐](https://github.com/oriz-org/userscripts)

When you click a `mailto:` link, the email address is copied to your clipboard instead of opening your OS mail client. Toast confirms the copy.

> Userscript replacement for the closed-source [Copy email links](https://chromewebstore.google.com/detail/ocffkcplakjlhbaadfcokiiflaelnaib) Chrome extension (v0.3 by abruno.net). Same behavior, no extension required, works in Tampermonkey / Violentmonkey / ScriptCat across Chrome / Firefox / Edge / Brave / Safari.

## Install

[Click here to install in Tampermonkey / Violentmonkey / ScriptCat](https://github.com/oriz-org/userscripts/raw/main/copy-email-links/copy-email-links.user.js)

Auto-updates on every push via the `@updateURL` metadata.

## Behavior

1. Click any `<a href="mailto:someone@example.com">` link on any page
2. The email address is copied to your clipboard
3. A small toast confirms — e.g. `📋 someone@example.com copied to clipboard`
4. The default mail-client launch is suppressed (no Outlook / Mail.app popup)

`Cmd/Ctrl/Shift/Alt + click` is honored — modifier-click falls through to the browser's default mailto handler, in case you want to actually open your mail client for that one click.

## Settings

Open the Tampermonkey/Violentmonkey/ScriptCat menu (puzzle-piece icon → this script's name) — three toggles:

| Menu entry | What it does |
|---|---|
| `Toast on copy: ON/OFF` | Suppress the on-page toast notification |
| `Theme: dark/light` | Toast color scheme |
| `Strip ?subject/?body: ON/OFF` | Default ON. Some mailto links include `?subject=…&body=…` — when ON, only the bare email lands on the clipboard. Turn OFF to copy the full `mailto:…?subject=…` URL. |

Settings persist via `GM_getValue` / `GM_setValue`. A toggle reloads the page so the new value takes effect immediately on the next click.

## Why a userscript instead of an extension?

The original is a closed-source MV3 Chrome extension that needs `storage` permission and runs on every `http(s)://*` page anyway. A userscript is:
- **Cross-browser** — Tampermonkey runs on Firefox, Safari, mobile Kiwi/Orion, not just Chrome
- **Auditable** — one 130-line file you can read in 2 minutes (this README + the script)
- **Auto-updating** — `@updateURL` re-fetches from this repo on a cron Tampermonkey controls
- **No CWS / AMO review delay** — push to `main`, users get the update on next check

## Compatibility

| Manager | Status |
|---|---|
| Tampermonkey (Chrome/Edge/Firefox/Safari) | ✅ |
| Violentmonkey (Chrome/Firefox) | ✅ |
| ScriptCat (Chrome/Edge) | ✅ |
| Greasemonkey 4+ (Firefox legacy) | ⚠️ — uses `GM_*` not `GM.*`. Replace `GM_getValue/setValue/registerMenuCommand` with `GM.getValue/setValue` and a Firefox-only `menus.create` if needed. |

## Privacy

The script reads `<a href="mailto:…">` hrefs in pages you visit; nothing leaves your machine. No network requests, no telemetry, no analytics. Clipboard write happens via `navigator.clipboard.writeText()` (origin-restricted, requires user gesture — which the click satisfies).

## License

MIT. See [LICENSE](../LICENSE).
