# awswaf-auto-bypass

[⭐ Star this repo ⭐](https://github.com/chirag127/userscripts)

Performs the AWS WAF "press and hold" gesture for you. Free, no solver API.

## Install

[Click here to install in ScriptCat](https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/awswaf-auto-bypass/awswaf-auto-bypass.user.js)

## How it works

Finds the press-and-hold button inside `*.captcha.awswaf.com`, fires `pointerdown`, holds 2.8–3.6 s, releases, retries 6 times.

## Limits

If AWS escalates to the picture puzzle, the hold only opens it. Puzzle solving is manual.

## License

MIT. See [LICENSE](../../LICENSE).
