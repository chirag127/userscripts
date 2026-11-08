# altcha-auto-bypass

[⭐ Star this repo ⭐](https://github.com/chirag127/userscripts)

Runs ALTCHA's local proof-of-work without you: clicks the widget checkbox in its shadow root and calls `widget.verify()`. Free, no solver API, no network.

## Install

[Click here to install in ScriptCat](https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/altcha-auto-bypass/altcha-auto-bypass.user.js)

## How it works

Finds `<altcha-widget>`, calls its `verify()` method, clicks the shadow-root checkbox, watches `input[name="altcha"]`. 12 attempts, 2 s apart.

## Limits

ALTCHA is client-side by design, so this is near-deterministic. If the server hands out an image challenge variant, the checkbox still needs a human.

## License

MIT. See [LICENSE](../../LICENSE).
