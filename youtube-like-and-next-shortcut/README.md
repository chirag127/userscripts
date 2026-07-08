# YouTube — Like & next (A)

One key to do two things: **like the current video, then skip to the next**.

Default key: **A**. Remappable.

## Install

[![Install](https://img.shields.io/badge/install-userscript-blue)](https://github.com/chirag127/userscripts/raw/main/youtube-like-and-next-shortcut/youtube-like-and-next-shortcut.user.js)

Requires Tampermonkey, Violentmonkey, or Userscripts (Safari).

## How it works

On keydown:

1. Find the Like button via a 5-selector fallback chain (modern + legacy renderers). If it's already pressed (`aria-pressed="true"`) the script does **not** toggle it off — it just proceeds to step 2.
2. Wait 150 ms so YouTube's mutation lands.
3. Click `.ytp-next-button` on the player chrome.

Works on any video watch page (`/watch?v=…`). The next button uses YouTube's own queue — autoplay related, playlist, mix, etc. — same behaviour as pressing the on-player Next button manually.

Guards: ignores the key when typing in input/textarea/contenteditable; ignores when Ctrl/Cmd/Alt/Shift held.

## Change the key

Click the Tampermonkey/Violentmonkey icon → open this userscript's menu:

- `Set "Like & next" key (default A)` → prompt for a single letter or digit
- `Reset key to default (A)`

Persists via `GM_setValue`.

## Why A?

Home-row, left hand, and doesn't collide with sibling shortcut scripts:

- `youtube-like-shortcut` = **S** (like only)
- `youtube-dislike-shortcut` = **D** (dislike only)
- `youtube-dislike-and-next-shortcut` = **X** (dislike + next)
- `youtube-next-video-shortcut` = **N** (next only)
- `youtube-prev-video-shortcut` = **P** (prev only)
- **This script** = **A** (like + next)

Change it if your muscle memory disagrees — the setter lives in the userscript-manager menu.

## License

MIT
