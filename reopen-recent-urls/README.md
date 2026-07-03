# reopen-recent-urls

[⭐ Star this Repo ⭐](https://github.com/chirag127/userscripts)

Keeps a rolling ring-buffer of the last 30 URLs you closed across all tabs. Open the menu to see the list; click any entry to reopen it in a new tab. Survives browser restart via `GM_setValue`.

## Install

[Click here to install in Tampermonkey / Violentmonkey / ScriptCat](https://raw.githubusercontent.com/chirag127/userscripts/main/reopen-recent-urls/reopen-recent-urls.user.js)

Auto-updates on every push via the `@updateURL` metadata.

## Behavior

1. Every page you leave (tab close, navigation, refresh) is pushed onto a shared ring-buffer
2. Buffer holds the 30 most-recent URLs, deduped by URL (most-recent wins)
3. Open Tampermonkey/Violentmonkey/ScriptCat menu → `Show recent URLs`
4. Overlay lists title + relative age + URL — click to reopen in a new tab
5. `Esc` or click outside the panel to close

## Menu commands

| Entry | What it does |
|---|---|
| `Show recent URLs` | Opens the overlay |
| `Clear recent URLs` | Wipes the buffer |

## Known limitations

- Storage is per-userscript-manager, not synced across devices
- `beforeunload` doesn't always fire in Safari — `pagehide` covers most cases but a hard-kill of the browser process may lose the last entry
- `about:` / `chrome:` URLs are skipped (userscripts can't run there anyway)
- Buffer is global across all sites (matches `*://*/*`) — that's the point

## License

MIT. See [LICENSE](../LICENSE).
