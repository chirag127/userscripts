# recaptcha-auto-bypass

[⭐ Star this repo ⭐](https://github.com/chirag127/userscripts)

Ticks reCAPTCHA v2 checkboxes and calls `grecaptcha.execute()` for v3 / invisible widgets. Free, no solver API, no keys.

## Install

[Click here to install in ScriptCat](https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/recaptcha-auto-bypass/recaptcha-auto-bypass.user.js)

## How it works

1. Runs inside `google.com/recaptcha/*` and clicks `#recaptcha-anchor` with a full `pointerover → pointerdown → mousedown → pointerup → mouseup → click` sequence. `isTrusted` is patched for the duration so Google's listeners see a trusted-looking event.
2. Retries 8 times with backoff, stops as soon as `aria-checked` / `.recaptcha-checkbox-checked` flips or you click it yourself.
3. On the page: calls `grecaptcha.execute()` up to 6 times, watches `g-recaptcha-response`, and fires `input` + `change` so frameworks notice the token.

## Settings (ScriptCat popup)

| Switch | Default |
|---|---|
| `Auto-bypass on <host>` | ON |
| `Auto-submit on <host>` | OFF |

## Limits

- Image-grid challenges still need a human. This script gets you past the checkbox only.
- v3 scores are decided server-side; `execute()` produces a token, not a better score.

## License

MIT. See [LICENSE](../../LICENSE).
