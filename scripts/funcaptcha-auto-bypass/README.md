# funcaptcha-auto-bypass

[⭐ Star this repo ⭐](https://github.com/chirag127/userscripts)

Clicks through Arkose FunCaptcha's start/verify screens and fires the token change event. Free, no solver API.

## Install

[Click here to install in ScriptCat](https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/funcaptcha-auto-bypass/funcaptcha-auto-bypass.user.js)

## How it works

Inside `*.arkoselabs.com` it clicks `#home` / "Begin" / "Verify" up to 6 times. On the page it watches `#FunCaptcha-Token` and dispatches `input` + `change` when a token arrives.

## Limits

Rotation / image puzzles need a human. This gets you to the puzzle and picks up the token.

## License

MIT. See [LICENSE](../../LICENSE).
