# url-cleaner

[⭐ Star this Repo ⭐](https://github.com/chirag127/userscripts)

Strips tracking params (`utm_*`, `fbclid`, `gclid`, `mc_eid`, `msclkid`, `igshid`, `si`, …) from URLs on two fronts:

1. **Address bar** — on page load, cleaned via `history.replaceState` (no reload, no navigation).
2. **Clipboard** — when you copy/cut a URL from any page, the pasted text is the cleaned version.

## Install

[Click here to install in Tampermonkey / Violentmonkey / ScriptCat](https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/url-cleaner/url-cleaner.user.js)

Auto-updates on every push via `@updateURL`.

## Params stripped

`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `fbclid`, `gclid`, `mc_eid`, `mc_cid`, `mkt_tok`, `igshid`, `si`, `ref`, `ref_src`, `rss_source`, `_ga`, `ncid`, `cmpid`, `uid`, `affiliate`, `partner_id`, `vero_id`, `zenid`, `yclid`, `dclid`, `msclkid`, `twclid`, `li_fat_id`, `soc_src`, `soc_trk`, `__hstc`, `__hssc`, `__hsfp`, `hsCtaTracking`.

Path, anchor (`#…`), and every other query param are preserved.

## Settings

Tampermonkey menu (puzzle-piece icon → this script's name):

| Menu entry | Default |
|---|---|
| `Clean address bar: ON/OFF` | ON |
| `Clean copied URLs: ON/OFF` | ON |

## Known limitations

- `ref` and `si` are ambiguous — some sites use them as legit routing (YouTube share `?si=…`, forum `?ref=…`). Strip anyway; if a site breaks, toggle `Clean address bar` OFF for that session.
- Only http/https URLs on the clipboard are rewritten — plain text like `check out example.com?utm_source=x` is left alone (not a full URL).
- Runs at `document-start`; SPAs that push tracking params in a later `pushState` won't be re-cleaned. Reload triggers a clean.

## License

MIT. See [LICENSE](../../LICENSE).
