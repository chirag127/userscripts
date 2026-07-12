# YouTube — Hide Shorts everywhere

Kills Shorts across YouTube:

- Hides Shorts **shelves** on Home, Subscriptions, and channel pages.
- Hides the **Shorts sidebar entry** (both full and mini guide).
- Hides the **Shorts tab** on channel pages and **Shorts chip** in search filters.
- **Redirects `/shorts/<id>` → `/watch?v=<id>`** so a Short opens in the normal player (with a timeline, playback speed, etc.).

## Install

[![Install](https://img.shields.io/badge/install-userscript-blue)](https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/youtube-hide-shorts/youtube-hide-shorts.user.js)

Requires Tampermonkey, Violentmonkey, or Userscripts (Safari).

## Config

Click the Tampermonkey/Violentmonkey icon → menu for this userscript:

- `Toggle Shorts→Watch redirect` — turn the `/shorts/<id>` → `/watch?v=<id>` redirect on/off. Hiding still applies either way. Reload to apply.

Setting persists via `GM_setValue`.

## How it works

- CSS via `GM_addStyle` hides the Shorts DOM nodes (shelf renderers, reel renderers, guide entries, chips). Uses `:has()` selectors — needs a modern browser (Chromium 105+, Firefox 121+, Safari 15.4+).
- SPA nav (`yt-navigate-finish`, `popstate`) re-runs the redirect check on client-side route changes.
- `@run-at document-start` fires the redirect before the Shorts player mounts, so no flash.

## Known limitations

- Selectors track YouTube's current DOM. If YouTube renames `ytd-reel-shelf-renderer` etc., a Shorts shelf may briefly reappear until the selector is updated.
- The redirect assumes the Shorts video is available to the regular watch player. Age-restricted or region-locked Shorts may show the standard YouTube error page.

## License

MIT.
