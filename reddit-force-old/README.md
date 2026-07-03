# reddit-force-old

Userscript that redirects new Reddit (`www.reddit.com`, `sh.reddit.com`, bare `reddit.com`) to `old.reddit.com`. Old UI is faster, no infinite scroll, comment threading is saner.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) (or Violentmonkey / ScriptCat).
2. Click → **[install](https://github.com/chirag127/userscripts/raw/main/reddit-force-old/reddit-force-old.user.js)**

## How it works

Runs at `document-start`. If the current hostname is one of the three new-Reddit hosts, calls `location.replace()` to the `old.reddit.com` equivalent, preserving path, query, and hash. No DOM parsing, no wait for load — the switch happens before any new-Reddit JS runs.

## Config

Menu command via Tampermonkey icon: **Toggle force-old**. Flips a `GM_setValue` flag and reloads. Use it when you need to visit new Reddit temporarily (e.g. a feature old Reddit doesn't render — chat, some polls).

State persists per-browser via `GM_setValue`.

## Known limitations

- **`old.reddit.com` is Reddit-hosted** and can be sunsetted at any time. This script is a workaround, not a permanent fix.
- **Some subreddits** force the new redesign for logged-in users regardless of `old.` host. Those still redirect back — no client-side workaround.
- **`np.reddit.com`, `i.reddit.com`, `amp.reddit.com`** are not matched. Add manually to `@match` if wanted.

## License

MIT.
