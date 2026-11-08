# geetest-auto-bypass

[⭐ Star this repo ⭐](https://github.com/chirag127/userscripts)

Opens GeeTest sliders and drags the handle across the track with eased pointer steps. Free, no solver API, no gap detection.

## Install

[Click here to install in ScriptCat](https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/geetest-auto-bypass/geetest-auto-bypass.user.js)

## How it works

1. Clicks the GeeTest start button if the slider is not open.
2. Drags `.geetest_slider_button` to the end of the track in 24 eased steps with jitter, then releases.
3. Retries 5 times.

## Limits

Blind drag to the far edge. Works on sliders whose gap sits at the end (many v3 installs). GeeTest v4 usually randomises the gap, so success is partial — a human still finishes some puzzles. No canvas diffing yet.

## License

MIT. See [LICENSE](../../LICENSE).
