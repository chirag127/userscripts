# video-speed-controller

[⭐ Star this Repo ⭐](https://github.com/chirag127/userscripts)

**Video Speed Controller**

## Install

[![Install](https://img.shields.io/badge/install-userscript-blue)](https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/video-speed-controller/video-speed-controller.user.js)

Open in Tampermonkey / Violentmonkey / ScriptCat; auto-updates via `@updateURL`.

Keyboard control for HTML5 media playback rate + seeking, with a small overlay
badge on each video showing the current speed.

## Shortcuts (default, remappable via menu)
| Key | Action |
|---|---|
| S | slow down 0.25x |
| D | speed up 0.25x |
| R | reset to 1.0x |
| Z | rewind 5s |
| X | advance 5s |

Keys are ignored while typing in an input/textarea/contenteditable.

## Overlay
A tiny "1.00x" badge sits top-left of each video; click it to cycle
1 -> 1.5 -> 2 -> 2.5 -> 1. Hidden via the menu if you prefer keys only.

## Notes
- Applies to the video the mouse is over, else the largest playing video.
- Persists last chosen speed per session (GM storage).
- Local only; no network.

## License
MIT.
