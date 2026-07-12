# expand-shortlinks

[⭐ Star this Repo ⭐](https://github.com/chirag127/userscripts)

Hover any `bit.ly` / `t.co` / `tinyurl.com` / etc. link and a tooltip shows where it actually points — before you click. No more blind trust in shorteners.

## Install

[Click here to install in Tampermonkey / Violentmonkey / ScriptCat](https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/expand-shortlinks/expand-shortlinks.user.js)

Auto-updates via the `@updateURL` metadata.

## Behavior

1. Mouse over a link whose host is a known shortener
2. After a 250 ms dwell, a small dark tooltip appears near the link
3. It says `Resolving…` while the redirect chain is followed, then shows the final URL
4. Result is cached for 7 days per shortlink (via `GM_setValue`) so re-hovers are instant

Redirects are followed up to 10 hops via `GM_xmlhttpRequest` with `redirect: 'manual'`, reading the `Location:` header at each step.

## Hosts covered

`bit.ly`, `t.co`, `goo.gl`, `tinyurl.com`, `ow.ly`, `is.gd`, `buff.ly`, `dlvr.it`, `fb.me`, `youtu.be`, `amzn.to`, `tiny.cc`, `shorturl.at`, `rebrand.ly`, `rb.gy`, `cutt.ly`.

Edit `SHORT_HOSTS` in the script to add more.

## Settings

Tampermonkey/Violentmonkey/ScriptCat menu (puzzle-piece → this script name):

| Entry | Effect |
|---|---|
| `Expand on hover: ON/OFF` | Master toggle; reloads the page |

## Known limitations

- Some shorteners (e.g. `t.co`) require a real `User-Agent` or reject HEAD; those may fall back to showing `(no redirect)`. Cache lets you retry cheaply.
- `@connect *` grants the script network access to any host — required so redirect chains crossing arbitrary domains resolve. Review before installing if that's a concern.
- No tooltip on touch devices (no hover event).

## License

MIT. See [LICENSE](../LICENSE).
