# YouTube — Dislike (D)

Atomic userscript. Press **D** anywhere on a YouTube video page to dislike (or un-dislike) it.

Does one thing only.

## Install

[![Install](https://img.shields.io/badge/install-userscript-blue)](https://github.com/oriz-org/userscripts/raw/main/youtube-dislike-shortcut/youtube-dislike-shortcut.user.js)

Requires Tampermonkey, Violentmonkey, or Userscripts (Safari).

## How it works

Tries a small fallback chain of selectors for the dislike button. YouTube ships several renderer versions; the script picks whichever is mounted. Ignores the key when typing in an input/textarea/contenteditable element.

Note: YouTube hides public dislike counts, but the dislike button itself still works and is recorded against your account.

## License

MIT
