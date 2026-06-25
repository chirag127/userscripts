# serp-open-articles

Userscript that adds a **"Open all article results (N)"** button to search-engine results pages and, on click, opens every article-type result in a new tab.

## Supported engines

- Google (`www.google.com/search`)
- Bing (`www.bing.com/search`)
- DuckDuckGo (`duckduckgo.com`)
- Brave Search (`search.brave.com/search`)
- Startpage (`www.startpage.com/do/search`)
- Kagi (`kagi.com/search`)

## What it skips

URL-pattern filter, hostname-suffix matched:

- **Video** — youtube.com, youtu.be, vimeo.com, dailymotion.com, twitch.tv
- **Social** — twitter.com, x.com, facebook.com, instagram.com, tiktok.com, linkedin.com, pinterest.com, threads.net
- **Shopping** — amazon.\* , ebay.com, etsy.com, walmart.com, flipkart.com, aliexpress.com
- **Maps / official tools** — `*/maps`, maps.google.com
- **Image-only** — imgur.com, flickr.com

PDFs pass through (`.pdf` URLs are usually articles).

The script also de-duplicates by host + path so cached/AMP copies of the same article only open once, and it unwraps Google's `/url?q=` and DuckDuckGo's `/l/?uddg=` redirector links before filtering.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) (or Violentmonkey / ScriptCat).
2. Click → **[install](https://github.com/oriz-org/userscripts/raw/main/serp-open-articles/serp-open-articles.user.js)**

## Use

1. Run a search on any supported engine.
2. A floating button appears top-right: **Open all article results (N)**.
3. Click it.
4. If more than 5 tabs would open, a `confirm()` dialog asks first.

## Settings

| Key | Default | Meaning |
|---|---|---|
| `maxTabs` | `10` | Hard cap on the number of tabs opened per click. |

Change via Tampermonkey's value editor or from devtools:

```js
GM_setValue('maxTabs', 20)
```

The confirm-threshold is hardcoded at 5 in the source — edit `CONFIRM_THRESHOLD` near the top of the script if you want different.

## Known limitations

- **Selectors drift.** Search engines re-skin their result pages every few months. If the count reads `(0)` on a SERP that clearly has results, the selector in `SELECTORS` for that host needs updating. The script falls back to `h2 a[href], h3 a[href]` if the hostname doesn't match any selector key, which works on most engines as a last resort but may also pick up "People also ask" / "Top stories" rows.
- **Brave Search** uses `:has()` — works in modern Chromium and Firefox 121+. Older Firefox may fall through to the second branch of the selector.
- **Popup blocker** can trip when opening many tabs from a single user gesture. The script staggers `window.open` calls with `setTimeout(0)` between each, which usually avoids the block in Chrome / Edge. If it still trips, allow popups for the engine in your browser settings, or use Tampermonkey's `GM_openInTab` (granted automatically).
- **Engine-internal links** (e.g. Google's `/search?q=related:...`) are filtered out by matching the result URL's hostname against the current page's hostname.
- **Infinite scroll / instant-results** — a MutationObserver re-runs the count every 400 ms when the SERP DOM mutates.

## License

MIT.
