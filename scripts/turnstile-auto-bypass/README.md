# turnstile-auto-bypass

[⭐ Star this repo ⭐](https://github.com/chirag127/userscripts)

Ticks Cloudflare Turnstile for you. Managed checkboxes, invisible widgets, and full-page "Just a moment" interstitials — no solver API, no keys, no external service.

## Install

[Click here to install in Tampermonkey / Violentmonkey / ScriptCat](https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/turnstile-auto-bypass/turnstile-auto-bypass.user.js)

Auto-updates on every push via `@updateURL`.

## How it works

Turnstile's checkbox lives in a cross-origin iframe on `challenges.cloudflare.com`, so a script on the page can never click it. This script runs in that frame too:

1. **Frame side** — hooks `attachShadow` before Turnstile builds the widget (the checkbox is created inside a closed shadow root), then dispatches a realistic `pointerover → pointerdown → mousedown → pointerup → mouseup → click` sequence with jittered coordinates. `isTrusted` is patched on the way through so Cloudflare's listeners see a trusted-looking event. Retries up to 6 times with backoff, and stops the moment the box is checked or you click it yourself.
2. **Page side** — for invisible / interaction-only widgets it calls `turnstile.execute()`, watches `input[name="cf-turnstile-response"]`, and fires `input` + `change` on the token field so React/Vue forms notice it.
3. **Stuck interstitials** — if a "Just a moment" page has not moved after 30 s it reloads once, max 3 times per 10 minutes per host (tracked in `sessionStorage`).

A small status pill appears bottom-right while it works. Nothing is submitted unless you turn auto-submit on.

## Settings

Tampermonkey menu (puzzle-piece icon → this script):

| Menu entry | Default |
|---|---|
| `Turnstile auto-bypass: ON/OFF on <host>` | ON |
| `Auto-submit after solve: ON/OFF on <host>` | OFF |

Settings are per host, stored with `GM_setValue`. Toggling reloads the tab.

## Limits

- Cloudflare decides the verdict server-side. On a bad IP/reputation the widget can still escalate to an image challenge, which this script does not solve.
- A page that embeds a Turnstile widget inside a nested iframe of its own is only handled when that frame is same-origin or on a challenge-platform URL.
- No token harvesting across tabs; each page solves its own widget.
- Does not touch reCAPTCHA or hCaptcha (`data-sitekey` is shared, so it checks for `0x…` Turnstile keys only).

## Credits

Technique builds on [AutoFlare](https://gist.github.com/Meterel/1941f0c156f5f86aafdbddf5f19da42e) by Meterel (shadow-root hook + trusted-event spoofing). Upstream references are vendored as submodules in [`refs/`](../../refs).

## License

MIT. See [LICENSE](../../LICENSE).
