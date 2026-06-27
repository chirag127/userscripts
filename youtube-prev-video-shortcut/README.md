# YouTube — Previous video (P)

Atomic userscript. Press **P** anywhere on a YouTube page to jump to the previous video.

Does one thing only.

## Install

[![Install](https://img.shields.io/badge/install-userscript-blue)](https://github.com/oriz-org/userscripts/raw/main/youtube-prev-video-shortcut/youtube-prev-video-shortcut.user.js)

Requires Tampermonkey, Violentmonkey, or Userscripts (Safari).

## How it works

Clicks `.ytp-prev-button` on keydown. Only fires when YouTube actually has a previous video (playlist/queue). Ignores the key when typing in an input/textarea/contenteditable element.

## License

MIT
