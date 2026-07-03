# YouTube — Copy Title + Channel + URL as markdown

Press **Ctrl+Shift+Y** on any YouTube watch page. Copies a markdown link to the clipboard:

```
[Video title — Channel name](https://www.youtube.com/watch?v=VIDEO_ID&t=SECONDS)
```

The `t=` parameter is the current playhead position, so pasted links jump to where you were. A small toast confirms the copy for 1.5 seconds.

## Install

[![Install](https://img.shields.io/badge/install-userscript-blue)](https://github.com/chirag127/userscripts/raw/main/youtube-copy-context/youtube-copy-context.user.js)

Requires Tampermonkey, Violentmonkey, or Userscripts (Safari).

## Change the shortcut

Open the userscript menu for this script:

- `Set copy shortcut (default Ctrl+Shift+Y)` — prompts for a combo like `ctrl+shift+y`, `alt+c`, `ctrl+m`.
- `Reset shortcut to Ctrl+Shift+Y`.

Modifiers accepted: `ctrl` (also matches Cmd on macOS), `shift`, `alt`. Key must be a single letter or digit. Settings persist via `GM_setValue`.

## Known limitations

- Only fires on `youtube.com/watch` and `m.youtube.com/watch` — not on Shorts or channel pages.
- Falls back to `document.title` (minus the trailing " - YouTube") if the DOM title node hasn't hydrated yet on very slow loads.
- If the channel element is missing, the link shows `Unknown channel`.

## License

MIT
