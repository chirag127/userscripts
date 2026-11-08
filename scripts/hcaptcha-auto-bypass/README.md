# hcaptcha-auto-bypass

[⭐ Star this repo ⭐](https://github.com/chirag127/userscripts)

Ticks the hCaptcha checkbox and calls `hcaptcha.execute()` for invisible widgets. Free, no solver API.

## Install

[Click here to install in ScriptCat](https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/hcaptcha-auto-bypass/hcaptcha-auto-bypass.user.js)

## How it works

1. Runs inside `*.hcaptcha.com` frames, clicks `#checkbox` with a spoofed-trusted pointer sequence, retries 8 times.
2. On the page: `hcaptcha.execute()` with the widget id when present, token watch on `h-captcha-response`, `input` + `change` events.

## Settings (ScriptCat popup)

| Switch | Default |
|---|---|
| `Auto-bypass on <host>` | ON |
| `Auto-submit on <host>` | OFF |

## Limits

hCaptcha escalates aggressive sessions to drag/select challenges. The click still registers; finishing the puzzle is manual. Verified on `accounts.hcaptcha.com/demo`: the challenge frame opens from our click, token only lands after the puzzle.

## License

MIT. See [LICENSE](../../LICENSE).
