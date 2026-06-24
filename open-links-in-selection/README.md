# open-links-in-selection

Userscript that **opens every link found in the current selection** in new tabs.

Triggered via the Tampermonkey / Violentmonkey / ScriptCat extension menu command (click the extension icon → "Open all links in selection"). Catches:

- `<a href>` anchors that intersect the selection (including the case where the selection is inside a single anchor)
- Plain-text URLs in the selected text: `http://...`, `https://...`, bare `www....` (auto-prefixed with `https://`)

Skips: `javascript:`, `mailto:`, `tel:`, and hash-only anchors.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) (or Violentmonkey / ScriptCat).
2. Click → **[install](https://github.com/oriz-org/userscripts/raw/main/open-links-in-selection/open-links-in-selection.user.js)**

## Use

1. Select text on any page (or in a textarea / contenteditable).
2. Click the Tampermonkey extension icon → **"Open all links in selection"**.
3. If ≥ 5 links are found, you'll see a confirm dialog first.

## Settings

The confirm-threshold is hardcoded at 5 in the source. Edit `CONFIRM_THRESHOLD` near the top of the script if you want different.

## Caveats

- **Popup blocker**: opening many tabs at once from a single user gesture can trip a browser's popup blocker. The script staggers `window.open` calls with `setTimeout(0)` between each, which usually avoids the block in Chrome / Edge. If it still trips, allow popups for the site in your browser settings.
- **Textareas / contenteditable**: anchors don't exist inside `<textarea>`, so only the plain-text URL regex runs in that case.
- **iframes**: the script runs in the top window. Selections inside a cross-origin iframe are invisible to it.
