# YouTube — Like (S)

Atomic userscript. Press **S** anywhere on a YouTube video page to like (or un-like) it.

Does one thing only.

## Install

[![Install](https://img.shields.io/badge/install-userscript-blue)](https://github.com/oriz-org/userscripts/raw/main/youtube-like-shortcut/youtube-like-shortcut.user.js)

Requires Tampermonkey, Violentmonkey, or Userscripts (Safari).

## How it works

Tries a small fallback chain of selectors for the like button (`like-button-view-model button`, then legacy variants). YouTube ships several renderer versions; the script picks whichever is mounted. Ignores the key when typing in an input/textarea/contenteditable element.

## License

MIT
