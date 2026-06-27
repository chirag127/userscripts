# YouTube — Reaction shortcuts (like + dislike)

Combined userscript. Two keys:

| Key | Action |
|---|---|
| **S** | Like / un-like |
| **D** | Dislike / un-dislike |

Both keys are remappable via the userscript menu.

## Install

[![Install](https://img.shields.io/badge/install-userscript-blue)](https://github.com/oriz-org/userscripts/raw/main/youtube-reaction-shortcuts/youtube-reaction-shortcuts.user.js)

Requires Tampermonkey, Violentmonkey, or Userscripts (Safari).

## Change the keys

Click the Tampermonkey/Violentmonkey icon → open the menu for this userscript:

- `Set "Like" key (default S)`
- `Set "Dislike" key (default D)`
- `Reset both keys to default (S / D)`

A prompt asks for a single letter or digit. Settings persist via `GM_setValue`.

## How it works

Five-selector fallback chain for each button covers modern + legacy YouTube renderers. Capture-phase keydown listener so YouTube's own keybinds don't swallow it. Ignores typing in input/textarea/contenteditable, and ignores when any modifier (Ctrl/Cmd/Alt/Shift) is held.

## Atomic alternatives

If you only want one of the two keys, install the atomic variants instead:

- [`youtube-like-shortcut`](../youtube-like-shortcut/)
- [`youtube-dislike-shortcut`](../youtube-dislike-shortcut/)

## License

MIT
