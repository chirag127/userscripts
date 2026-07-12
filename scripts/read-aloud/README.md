# read-aloud

[⭐ Star this Repo ⭐](https://github.com/chirag127/userscripts)

**Read Aloud**

## Install

[![Install](https://img.shields.io/badge/install-userscript-blue)](https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/read-aloud/read-aloud.user.js)

Open in Tampermonkey / Violentmonkey / ScriptCat; auto-updates via `@updateURL`.

Text-to-speech for the current page using the Web Speech API
(`speechSynthesis`) — no network, no API key.

## Shortcuts
| Key | Action |
|---|---|
| Alt+R | read selection (or whole article) / stop if speaking |
| Alt+. | pause / resume |

Menu entries mirror these and let you set the rate (0.75 / 1.0 / 1.25 / 1.5x).

## What it reads
- If text is selected, reads the selection.
- Otherwise extracts the main article text: prefers <article>, [role=main],
  <main>, else the largest text block; strips scripts/styles/nav/aside.

## Notes
- Chunks long text on sentence boundaries so it can be stopped promptly and
  avoids the browser's ~32k-char utterance cap.
- Rate persists across sessions (GM storage).
- Voice = the browser default for the page language.

## License
MIT.
