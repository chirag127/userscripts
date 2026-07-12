# per-site-scratchpad

[⭐ Star this Repo ⭐](https://github.com/chirag127/userscripts)

A fixed-position textarea, one per hostname, persisted across page loads. Jot selectors, TODOs, form values, or credentials-in-progress without opening a second tab.

## Install

[Click here to install in Tampermonkey / Violentmonkey / ScriptCat](https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/per-site-scratchpad/per-site-scratchpad.user.js)

Auto-updates on every push via the `@updateURL` metadata.

## Behavior

1. Open the Tampermonkey/Violentmonkey/ScriptCat menu (puzzle-piece icon → `Toggle scratchpad`) — a resizable textarea appears bottom-right
2. Type. Content saves 500ms after your last keystroke via `GM_setValue`
3. `Esc` closes the pad. Visibility state persists per-host, so if you left it open on `github.com` it reopens next visit
4. Notes are keyed by `location.hostname` — `github.com` and `gitlab.com` get independent pads

## Config

No settings UI. One menu entry: `Toggle scratchpad`. Drag the corner to resize.

Storage keys (visible in Tampermonkey → Storage tab):
- `scratchpad:<hostname>` — the note contents
- `scratchpad-open:<hostname>` — whether the pad was visible on last close

## Known limitations

- **Same-hostname only.** `docs.example.com` and `blog.example.com` are separate pads. This is intentional — subdomain-scoped notes are usually what you want.
- **No sync across browsers.** GM storage is per-manager, per-profile. Export via Tampermonkey's backup if you want to migrate.
- **z-index max.** If a host page uses `z-index: 2147483647` on a modal, the pad may fight it. Rare.
- **No rich text.** Plain textarea by design — a scratchpad, not an editor.

## License

MIT. See [LICENSE](../LICENSE).
