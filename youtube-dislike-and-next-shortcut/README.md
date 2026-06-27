# YouTube — Dislike & next (X)

One key to do two things: **dislike the current video, then skip to the next**.

Default key: **X**. Remappable.

## Install

[![Install](https://img.shields.io/badge/install-userscript-blue)](https://github.com/oriz-org/userscripts/raw/main/youtube-dislike-and-next-shortcut/youtube-dislike-and-next-shortcut.user.js)

Requires Tampermonkey, Violentmonkey, or Userscripts (Safari).

## How it works

On keydown:

1. Find the Dislike button via a 5-selector fallback chain (modern + legacy renderers). If it's already pressed (`aria-pressed="true"`) the script does **not** toggle it off — it just proceeds to step 2.
2. Wait 150 ms so YouTube's mutation lands.
3. Click `.ytp-next-button` on the player chrome.

Works on any video watch page (`/watch?v=…`). The next button uses YouTube's own queue — autoplay related, playlist, mix, etc. — same behaviour as pressing the on-player Next button manually.

Guards: ignores the key when typing in input/textarea/contenteditable; ignores when Ctrl/Cmd/Alt/Shift held.

## Change the key

Click the Tampermonkey/Violentmonkey icon → open this userscript's menu:

- `Set "Dislike & next" key (default X)` → prompt for a single letter or digit
- `Reset key to default (X)`

Persists via `GM_setValue`.

## Why X?

It's not a YouTube native shortcut, it's on the home row of the left hand, and it isn't used by any of the sibling shortcut scripts (`youtube-like-shortcut` = S, `youtube-dislike-shortcut` = D, `youtube-next-video-shortcut` = N, `youtube-prev-video-shortcut` = P). Change it if your muscle memory disagrees.

## License

MIT
