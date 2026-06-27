# dearrow-show-original

Userscript that **appends the original YouTube title** in parentheses after DeArrow's replacement, so you see both at once:

```
Better Title (original: 10 SHOCKING Things You WON'T BELIEVE!!!)
```

Works on:

- The **watch page** H1 title
- **Every thumbnail** on home, subscriptions, sidebar (Up Next), search results, channel pages, shelves — anywhere YouTube renders a video card.

## Install

1. Install a userscript manager: [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), or [ScriptCat](https://scriptcat.org/).
2. Click → **[install](https://github.com/oriz-org/userscripts/raw/main/dearrow-show-original/dearrow-show-original.user.js)**
3. Make sure the [DeArrow extension](https://chrome.google.com/webstore/detail/dearrow-better-titles-and/enamippconapkdmgfgjchkhakpfinmaj) is also installed — this userscript piggybacks on it.

## How it works

Two layers, both DOM-only, zero network calls.

**Watch page (H1):** Snapshot the title element as soon as the page loads, watch with a `MutationObserver`, append ` (original: <snapshot>)` whenever DeArrow swaps the text. Falls back to `document.title` for tiebreaking.

**Thumbnail cards:** A global `MutationObserver` rooted at `document.body` (started at `document-start`) sees every title node the moment it's added or its text changes. On the first text we observe, we stash it as the candidate "original" via a `data-dearrow-original` attribute. When DeArrow replaces, we re-append the stored value as the suffix. If DeArrow gets there first the stored value already equals the displayed text and we no-op — no garbled output either way.

Title selectors covered:

- `#video-title` (rich-grid, compact-video, search, shelf cards)
- `a#video-title-link` (sidebar variants)
- `h3 a.yt-simple-endpoint` (legacy fallback)
- `span.yt-core-attributed-string[role="text"]` (mobile / newer redesign)

Infinite scroll, SPA navigations, and lazy-loaded sections (Shorts shelf, Trending) are all handled because the observer is page-global.

## Why not just use the DeArrow extension fork?

This userscript is **lower install friction** for sharing. The DeArrow extension fork (`chirag127/dearrow-plus-bs-ext`) adds a settings toggle and lives inside DeArrow's TypeScript codebase — overkill if you just want the visual augmentation.

## Caveats

- If DeArrow replaces a thumbnail title **before** the userscript's observer fires, the stashed "original" is itself the DeArrow text. The script detects this (current text matches stored value) and no-ops, so you see the DeArrow title alone — no broken `(original: <dearrow>)` suffix.
- Tested on `www.youtube.com` and `m.youtube.com`. Shorts use a different DOM tree (`span.yt-core-attributed-string`) and may decorate inconsistently.

