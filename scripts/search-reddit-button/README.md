# search-reddit-button

Userscript that adds a floating **`+ reddit`** / **`− reddit`** button to search-engine results pages. One click toggles `site:reddit.com` onto (or off) the current query and reloads. For when you want real human answers instead of SEO listicles.

## Supported engines

- Google (`www.google.com/search`)
- DuckDuckGo (`duckduckgo.com`)
- Bing (`www.bing.com/search`)

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) (or Violentmonkey / ScriptCat).
2. Click → **[install](https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/search-reddit-button/search-reddit-button.user.js)**

## Use

1. Run any search.
2. Button appears top-right of the page:
   - **`+ reddit`** (orange) — click to add `site:reddit.com` to your query.
   - **`− reddit`** (red) — click to remove it.
3. Also available from the Tampermonkey menu → **Toggle site:reddit.com** for keyboard users who prefer no floating chrome.

## Known limitations

- Reloads the page (search engines don't take kindly to in-place query rewrites).
- Position is fixed top-right at 2.1B z-index — if some SERP overlay clashes, edit the `style` block.
- The button auto-reinjects on DOM mutation, so instant-results engines shouldn't drop it.

## License

MIT.

## Install

[![Install](https://img.shields.io/badge/install-userscript-blue)](https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/search-reddit-button/search-reddit-button.user.js)
