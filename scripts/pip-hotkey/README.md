# pip-hotkey

[⭐ Star this Repo ⭐](https://github.com/chirag127/userscripts)

**Picture-in-Picture Hotkey**

## Install

[![Install](https://img.shields.io/badge/install-userscript-blue)](https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/pip-hotkey/pip-hotkey.user.js)

Open in Tampermonkey / Violentmonkey / ScriptCat; auto-updates via `@updateURL`.

Toggle Picture-in-Picture on the current video.

## Trigger
- Hotkey: **Alt+P**
- Or the Tampermonkey menu entry "Toggle Picture-in-Picture".

## Target selection
Uses the video the mouse is hovering; otherwise the largest currently-playing
video; otherwise the largest video on the page.

## Notes
- Uses the standard `requestPictureInPicture()` / `exitPictureInPicture()` API.
- Skips videos with `disablePictureInPicture`; toasts a hint if PiP is blocked
  (some sites disable it or require a user gesture — the Alt+P keypress counts).
- Ignored while typing in a form field.
- Local only; no network.

## License
MIT.
