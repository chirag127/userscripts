# auto-reject-cookies

[⭐ Star this Repo ⭐](https://github.com/chirag127/userscripts)

Auto-clicks the "reject all" button on cookie consent banners so you don't have to. Covers the major CMPs (OneTrust, Cookiebot, TrustArc, Osano, Didomi) plus generic `aria-label` and text-content fallbacks for the long tail.

## Install

[Click here to install in Tampermonkey / Violentmonkey / ScriptCat](https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/auto-reject-cookies/auto-reject-cookies.user.js)

Auto-updates on every push via the `@updateURL` metadata.

## Behavior

1. Page loads → at `document-idle` the script scans for a reject-all button
2. Retries every 500ms for 5s to catch banners mounted late (React/Vue/GTM injections)
3. First visible match wins — clicks it and stops

## Settings

Open the Tampermonkey/Violentmonkey/ScriptCat menu (puzzle-piece icon → this script's name):

| Menu entry | What it does |
|---|---|
| `Auto-reject: ON/OFF` | Kill switch — turn off to see banners normally |
| `Log hits to console: ON/OFF` | Print which selector/text matched, for debugging |

## Known limitations

- **Shadow-DOM banners** — `querySelectorAll` doesn't pierce closed shadow roots. Some CMPs (rare) hide their DOM this way.
- **Iframe banners** — cross-origin iframes are out of reach. Same-origin iframes need `@match` per host or an explicit iterate.
- **False positives on `.call`** — TrustArc uses the class `.call` which is vague; if a non-CMP site ships a `.call` button that happens to be visible early, we'd click it. Rare in practice.

## License

MIT. See [LICENSE](../../LICENSE).
