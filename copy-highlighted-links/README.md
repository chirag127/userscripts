# copy-highlighted-links

[⭐ Star this Repo ⭐](https://github.com/oriz-org/userscripts)

Select any text on a page that contains links → trigger the Tampermonkey menu → every URL in the selection is copied to your clipboard, one per line.

> Userscript replacement for the open-source [Copy Highlighted Links](https://github.com/CraftedIntuition/copy-highlighted-links) Chrome extension by CraftedIntuition (CWS ID `bicbefnmikccjbindlnjbollkinbnhhp`). Same core behavior, plus plain-text URL detection (matches `http://`, `https://`, and bare `www.*` strings inside the selected text).

## Install

[Click here to install in Tampermonkey / Violentmonkey / ScriptCat](https://github.com/oriz-org/userscripts/raw/main/copy-highlighted-links/copy-highlighted-links.user.js)

Auto-updates on every push via the `@updateURL` metadata.

## Usage

1. Select (highlight) any text on a webpage that contains links — anchor tags AND/OR plain-text URLs
2. Click the Tampermonkey/Violentmonkey/ScriptCat puzzle-piece icon → **Copy highlighted links**
3. URLs are now on your clipboard, one per line
4. Toast confirms the count (e.g. `Copied 5 links to clipboard`)

If your userscript manager supports per-script hotkeys (Tampermonkey does), assign one to the menu command for one-keystroke copy.

## Honest difference from the original Chrome extension

The original lives in the browser's **right-click context menu** (`contexts: ["selection"]`). Userscripts cannot add native right-click menu items — that's a Chromium security boundary, not a script-engine limitation. So this userscript surfaces through the Tampermonkey extension menu (puzzle-piece icon → script name) instead. Same one-click experience, just a different click target.

**Workarounds for right-click feel:**
- **Tampermonkey hotkey** — Settings → Edit script → Menu command → assign `Alt+C` (or anything). One keystroke, no right-click needed.
- **Tampermonkey's "Show this script's menu in the page context menu"** — Tampermonkey *can* surface its commands in the page's right-click menu on some Chromium versions; toggle in Tampermonkey settings → Extension → Context menu. Mileage varies by browser.

## Features

| | Upstream extension | This userscript |
|---|---|---|
| Copy `<a href>` from selection | ✅ | ✅ |
| Copy plain-text URLs (`https://...`, `www....`) from selection | ❌ | ✅ |
| Skip `javascript:`, `mailto:`, `tel:`, `#hash` anchors | ❌ (copies all) | ✅ |
| Handle multi-range selections | ❌ | ✅ |
| Handle selection entirely *inside* an `<a>` | ⚠️ partial | ✅ |
| Works on `http://` (non-secure) pages | ⚠️ depends on Clipboard API | ✅ (`GM_setClipboard` fallback) |
| Toast feedback | ✅ (chrome.notifications) | ✅ (DOM toast) |
| Cross-browser (Firefox/Safari) | ❌ Chromium-only | ✅ Tampermonkey-supported browsers |

## Compatibility

| Manager | Status |
|---|---|
| Tampermonkey (Chrome/Edge/Firefox/Safari) | ✅ |
| Violentmonkey (Chrome/Firefox) | ✅ |
| ScriptCat (Chrome/Edge) | ✅ |
| Greasemonkey 4+ (Firefox legacy) | ⚠️ — uses `GM_*` not `GM.*`. Replace `GM_setClipboard` with `GM.setClipboard` if needed. |

## Privacy

The script reads `<a href>` elements and rendered text inside your current page's selection. Nothing leaves your machine. No network requests, no telemetry, no analytics.

## License

MIT. See [LICENSE](../LICENSE).
