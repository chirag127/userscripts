# captcha-autopilot

[⭐ Star this repo ⭐](https://github.com/chirag127/userscripts)

One script for the three common checkboxes: **Cloudflare Turnstile**, **reCAPTCHA v2**, **hCaptcha**. Same engine as the three standalone scripts, picked by frame host. Free, no solver API.

## Install

[Click here to install in ScriptCat](https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/captcha-autopilot/captcha-autopilot.user.js)

## Why this exists

If you just want "captchas stop bothering me", install this. If you want per-vendor tuning or smaller surface, install `turnstile-auto-bypass`, `recaptcha-auto-bypass` or `hcaptcha-auto-bypass` instead. Do not run both the combo and a standalone for the same vendor unless you want double clicks.

## How it works

- Frame side: closed-shadow-root hook, spoofed-trusted pointer sequence, 8 retries, stops on success.
- Page side: `turnstile.execute()` / `grecaptcha.execute()` / `hcaptcha.execute()`, token watch, `input` + `change` events.

## Settings (ScriptCat popup)

| Switch | Default |
|---|---|
| `Auto-bypass on <host>` | ON |
| `Auto-submit on <host>` | OFF |

## Verified

- Turnstile force-interactive fixture (`tests/fixtures/turnstile.html`, sitekey `3x…FF`): token appears in ~2 s, and does **not** appear with the script disabled.
- reCAPTCHA v2 demo (`google.com/recaptcha/api2/demo`): token appears automatically.

## License

MIT. See [LICENSE](../../LICENSE).
