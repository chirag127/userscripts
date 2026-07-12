# YouTube — No autoplay + no end cards

Stops YouTube from queuing the next video on you. Three things in one script:

| Feature | What it does |
|---|---|
| **Kill autoplay** | Turns off the in-player autoplay toggle on every navigation |
| **Hide end cards** | CSS hides `.ytp-ce-element` and `.ytp-endscreen-content` overlays in the last ~20s of every video |
| **Auto-dismiss "Continue watching?"** | Clicks Yes on the `yt-confirm-dialog-renderer` idle-check modal so playback resumes silently |

## Install

[![Install](https://img.shields.io/badge/install-userscript-blue)](https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/youtube-no-autoplay/youtube-no-autoplay.user.js)

Requires Tampermonkey, Violentmonkey, or Userscripts (Safari).

## Config

Click the Tampermonkey/Violentmonkey icon → open the menu for this userscript:

- `Toggle: hide end cards`
- `Toggle: kill autoplay`
- `Toggle: auto-dismiss "Continue watching?"`

Each toggle persists via `GM_setValue`. **Reload the tab** to apply.

## Known limitations

- End-card CSS matches YouTube's current class names — if YouTube rewrites the player, the selectors need updating.
- Autoplay kill runs on `yt-navigate-finish` with two retries (500 ms + 2 s). On a very slow load the toggle may still flip on for the first video of the session.
- The AYSW dismissal button matches on label text `Yes` / `Continue` / `Keep watching` — locale-dependent. Non-English UIs need the labels added.

## License

MIT
