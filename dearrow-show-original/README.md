# dearrow-show-original

Userscript that **appends the original YouTube title** in parentheses after DeArrow's replacement, so you see both at once:

```
Better Title (original: 10 SHOCKING Things You WON'T BELIEVE!!!)
```

## Install

1. Install a userscript manager: [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), or [ScriptCat](https://scriptcat.org/).
2. Click → **[install](https://github.com/chirag127/userscripts/raw/main/dearrow-show-original/dearrow-show-original.user.js)**
3. Make sure the [DeArrow extension](https://chrome.google.com/webstore/detail/dearrow-better-titles-and/enamippconapkdmgfgjchkhakpfinmaj) is also installed — this userscript piggybacks on it.

## How it works

On every YouTube video page:

1. Snapshot the title element as soon as the page loads (this is the original YouTube title, before DeArrow has had a chance to swap it).
2. Watch the title element with a `MutationObserver`.
3. When DeArrow replaces the text, append ` (original: <snapshot>)`.

Zero new API calls — the original is read from the DOM that's already there.

## Why not just use the DeArrow extension fork?

This userscript is **lower install friction** for sharing. The DeArrow extension fork (`chirag127/dearrow-plus-bs-ext`) adds a settings toggle and lives inside DeArrow's TypeScript codebase — overkill if you just want the visual augmentation.

## Caveats

- If DeArrow replaces the title **before** the userscript can snapshot it (rare — userscripts at `@run-at document-start` usually win), the "original" we capture may itself be the DeArrow-replaced title. The script falls back to `document.title` (which DeArrow updates later) as a tiebreaker.
- Tested on `www.youtube.com` and `m.youtube.com`. Not tested on YouTube Music, embeds, or Shorts (Shorts use a different DOM tree).
