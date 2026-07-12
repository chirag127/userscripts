# add-code-copy-buttons

[⭐ Star this Repo ⭐](https://github.com/chirag127/userscripts)

Injects a small "copy" button on every `<pre><code>` block so you can grab a snippet without hand-selecting. One click copies the code; the button flashes "copied" for a second.

## Install

[Click here to install in Tampermonkey / Violentmonkey / ScriptCat](https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/add-code-copy-buttons/add-code-copy-buttons.user.js)

Auto-updates on every push via the `@updateURL` metadata.

## Behavior

1. On page load (`document-idle`), scans for `pre code`, `pre.prettyprint`, and `div.highlight pre`
2. Injects a top-right "copy" button on each block (idempotent — marked via `data-ccb-injected`)
3. Click copies `innerText` to the clipboard via `GM_setClipboard`
4. A `MutationObserver` catches late-rendered blocks on SPA docs sites, GitHub file view, Discourse, etc.

## Settings

Open the Tampermonkey/Violentmonkey/ScriptCat menu (puzzle-piece icon → this script's name):

| Menu entry | What it does |
|---|---|
| `Copy buttons: ON/OFF` | Master toggle. When OFF, the script exits before injecting anything. |

## Known limitations

- Only targets three common selectors — sites with exotic markup (e.g. `<div class="codehilite">` without a `<pre>`) are skipped. Add your own selector to `SELECTOR` if needed.
- If a host page already positions its `<pre>` non-`static`, the button rides that positioning; if the host uses `overflow: hidden` on a very short block, the button may clip.
- No syntax-aware trimming — copies whatever `innerText` returns, including line numbers if the host page renders them inside the `<code>`.

## License

MIT. See [LICENSE](../LICENSE).
