# fake-filler

[⭐ Star this Repo ⭐](https://github.com/chirag127/userscripts)

**Fake Filler**

## Install

[![Install](https://img.shields.io/badge/install-userscript-blue)](https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/fake-filler/fake-filler.user.js)

Open in Tampermonkey / Violentmonkey / ScriptCat; auto-updates via `@updateURL`.

Fills all fillable form fields on the current page with plausible dummy data.

## Trigger
- Hotkey: **Ctrl+Shift+F**
- Or the Tampermonkey menu entry "Fill forms with fake data".

## What it fills
Text/search/textarea, email, url, tel, number, range, date/time family, color,
password, checkboxes/radios (checked at random), and <select> (random non-empty
option). Fields are matched by input `type`, then by `name`/`id`/`autocomplete`
heuristics (email, name, phone, zip, city, etc.) so values look sensible.

## Notes
- Skips hidden, disabled, readonly, and submit/button/file/image inputs.
- Dispatches `input` + `change` events so React/Vue/Angular pick up the value.
- Purely local; no network, no data leaves the page.

## License
MIT.
