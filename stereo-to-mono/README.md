# stereo-to-mono

Userscript that **converts stereo audio to mono** on any page. Works with `<video>` and `<audio>` elements — auto-detects playing media. Toggle on/off via the Tampermonkey menu.

## Install

1. Install a userscript manager: [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), or [ScriptCat](https://scriptcat.org/).
2. Click → **[install](https://github.com/oriz-org/userscripts/raw/main/stereo-to-mono/stereo-to-mono.user.js)**

## How it works

1. Click the Tampermonkey extension icon → **`StereoToMono — Toggle mono`** in the menu.
2. The script finds every `<video>` and `<audio>` element on the page (including dynamically added ones via a `MutationObserver`).
3. It creates a **Web Audio API** pipeline for each: `MediaElementAudioSourceNode` → `GainNode` (channelCount=1, explicit mode) → `destination`. The native element is muted; the mono-mixed audio plays through the AudioContext.
4. Click the menu command again to restore stereo.

## Why

- Some older or mono-only speakers/sound systems play stereo audio at half volume (phase cancellation when L-R is summed incorrectly).
- Some accessibility scenarios call for mono output (single-earbud listening, hearing loss in one ear).
- No browser extensions or external tools needed — pure userscript.

## Caveats

- `MediaElementAudioSourceNode` can only be created **once per element**. If the graph setup fails, the element is skipped gracefully.
- The `AudioContext` is created lazily on the first `video`/`audio` element found. May not capture the very start of a pre-loaded stream.
- Not tested on embedded players (YouTube embeds, SoundCloud widgets) — those use iframes and are outside the script's scope.
