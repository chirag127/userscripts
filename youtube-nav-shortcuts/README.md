# YouTube — Nav shortcuts (next + previous)

Combined userscript. Two keys:

| Key | Action |
|---|---|
| **N** | Next video |
| **P** | Previous video |

Both keys are remappable via the userscript menu.

## Install

[![Install](https://img.shields.io/badge/install-userscript-blue)](https://github.com/oriz-org/userscripts/raw/main/youtube-nav-shortcuts/youtube-nav-shortcuts.user.js)

Requires Tampermonkey, Violentmonkey, or Userscripts (Safari).

## Change the keys

Click the Tampermonkey/Violentmonkey icon → open the menu for this userscript:

- `Set "Next video" key (default N)`
- `Set "Previous video" key (default P)`
- `Reset both keys to default (N / P)`

A prompt asks for a single letter or digit. Settings persist via `GM_setValue`.

## How it works

Clicks `.ytp-next-button` / `.ytp-prev-button` on keydown. Capture-phase listener so YouTube's own keybinds don't swallow it. Ignores typing in input/textarea/contenteditable, and ignores when any modifier (Ctrl/Cmd/Alt/Shift) is held.

## Atomic alternatives

If you only want one of the two keys, install the atomic variants instead:

- [`youtube-next-video-shortcut`](../youtube-next-video-shortcut/)
- [`youtube-prev-video-shortcut`](../youtube-prev-video-shortcut/)

## License

MIT
