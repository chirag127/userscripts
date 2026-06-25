# link-klipper

[⭐ Star this Repo ⭐](https://github.com/oriz-org/userscripts)

Extract every link on the current page → download as CSV or copy URLs to clipboard. Captures both `<a href>` anchors and `<img src>` images.

> Userscript replacement for the [Link Klipper](https://chromewebstore.google.com/) Chrome extension by Codebox.in. Same core extraction + CSV download, plus a "copy URLs to clipboard" alternative. **Skips the visual hover-to-pick container mode** the upstream v3 ships — see [Honest differences](#honest-differences-from-upstream) below.

## Install

[Click here to install in Tampermonkey / Violentmonkey / ScriptCat](https://github.com/oriz-org/userscripts/raw/main/link-klipper/link-klipper.user.js)

Auto-updates on every push via the `@updateURL` metadata.

## Hotkey

**`Ctrl+Shift+K`** (Windows/Linux) / **`Cmd+Shift+K`** (Mac) — extracts every link on the page and downloads `links_<hostname>_<timestamp>.csv`.

Matches the upstream Link Klipper hotkey exactly. The script skips firing when focus is inside an editor (`input`, `textarea`, `contenteditable`) so it doesn't break Ctrl+Shift+K in dev-tool web editors.

## Menu commands

Open the Tampermonkey/Violentmonkey/ScriptCat puzzle-piece icon → this script's name:

| Command | What it does |
|---|---|
| **Link Klipper: extract all → download CSV** | Every link on the page → CSV file, columns: `url, text, title, type, hostname`. UTF-8 BOM included so Excel opens cleanly. |
| **Link Klipper: extract all → copy URLs to clipboard** | Same set of links, but just the URLs (one per line) on the clipboard. |
| **Link Klipper: extract from selection → copy URLs** | Restricts collection to the current text-selection's subtree. Useful for "I just want links from this article block". |
| **Capture images: ON/OFF** | Toggle whether `<img src>` URLs are collected. Default ON. |
| **Filter mailto/tel/js: ON/OFF** | Default OFF (matches upstream). ON to drop `javascript:` / `mailto:` / `tel:` / `#hash` URLs from the export. |

## CSV format

```csv
url,text,title,type,hostname
https://example.com/about,About us,,link,example.com
https://example.com/img/logo.png,,Site logo,image,example.com
mailto:hi@example.com,Contact,,mailto,
```

Columns:
- **url** — fully resolved absolute URL
- **text** — anchor's visible text (trimmed, collapsed whitespace, capped at 500 chars). Empty for `<img>` rows.
- **title** — anchor's `title` attr OR the wrapped/standalone `<img alt>`
- **type** — `link` | `image-link` (anchor wrapping an `<img>`) | `image` (standalone `<img>`) | `mailto` | `tel` | `javascript` | `anchor` (hash-only)
- **hostname** — parsed from the URL; useful for `GROUP BY hostname` in spreadsheets

Excel quirk: opens the CSV correctly thanks to the `﻿` UTF-8 BOM. Google Sheets via `File → Import` works the same way.

## Honest differences from upstream

| Feature | Upstream Link Klipper v3 | This userscript |
|---|---|---|
| Extract all links → CSV | ✅ | ✅ |
| Capture `<img>` URLs | ✅ | ✅ |
| Hotkey Ctrl/Cmd+Shift+K | ✅ | ✅ |
| Plain-text URL copy to clipboard | ❌ | ✅ |
| Extract from text selection | ❌ | ✅ |
| **Visual hover-to-pick container mode** | ✅ (the v3 marquee feature) | ❌ |
| Right-click context menu item | ✅ | ❌ — userscripts cannot add native chrome context menu items |
| Toolbar icon button | ✅ | ❌ — userscripts have no toolbar surface |

**Why no visual hover-picker:** the upstream v3 adds an in-page overlay where you hover containers, they get outlined, and clicking extracts links from that container only. Implementing it is ~80 LOC of mode-state-machine that I deliberately skipped. The "extract from text selection" menu command covers most of the same need (highlight the article block, run the menu command, get links from just that block) without the brittleness of hover-tracking on every page.

If you want the hover-picker, file an issue and I'll add it as v0.2.

## Compatibility

| Manager | Status |
|---|---|
| Tampermonkey (Chrome/Edge/Firefox/Safari) | ✅ uses `GM_download` for cleaner CSV save |
| Violentmonkey (Chrome/Firefox) | ✅ falls back to Blob + anchor.click |
| ScriptCat (Chrome/Edge) | ✅ |
| Greasemonkey 4+ (Firefox legacy) | ⚠️ — uses `GM_*` not `GM.*`. Replace `GM_setClipboard` / `GM_download` with `GM.setClipboard` / `GM.download` if needed. |

## Privacy

The script reads the current page's DOM (anchors + images) and writes the result to your clipboard or downloads a file. Nothing leaves your machine. No network requests, no telemetry, no analytics. The upstream Link Klipper says the same thing in its store listing; this userscript is the same model — minus the closed-source binary.

## License

MIT. See [LICENSE](../LICENSE).
