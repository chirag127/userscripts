# userscripts

Personal userscripts collection by [@chirag127](https://github.com/chirag127), hosted under the [oriz-org](https://github.com/oriz-org) family. Tampermonkey / ScriptCat / Violentmonkey compatible.

## Install

Click the **install** link next to any userscript below. Tampermonkey or ScriptCat will prompt to install + auto-update from this repo.

| Userscript | Site | What it does | Install |
|---|---|---|---|
| **stereo-to-mono** | any page | Convert stereo audio to mono on any `<video>`/`<audio>` element. Toggle via Tampermonkey menu. Auto-detects playing media. | [install](https://github.com/oriz-org/userscripts/raw/main/stereo-to-mono/stereo-to-mono.user.js) |
| **dearrow-show-original** | youtube.com | Append the original YouTube title in parentheses after DeArrow's replacement on the watch page **and on every thumbnail** (home, subs, sidebar, search, channel): `Better Title (original: 10 SHOCKING Things You WON'T BELIEVE!!!)` | [install](https://github.com/oriz-org/userscripts/raw/main/dearrow-show-original/dearrow-show-original.user.js) |
| **youtube-nav-shortcuts** | youtube.com | **Combined**: press **N** for next video, **P** for previous. Both keys remappable via the userscript menu. | [install](https://github.com/oriz-org/userscripts/raw/main/youtube-nav-shortcuts/youtube-nav-shortcuts.user.js) |
| **youtube-reaction-shortcuts** | youtube.com | **Combined**: press **S** to like, **D** to dislike. Both keys remappable via the userscript menu. | [install](https://github.com/oriz-org/userscripts/raw/main/youtube-reaction-shortcuts/youtube-reaction-shortcuts.user.js) |
| **youtube-dislike-and-next-shortcut** | youtube.com | One key to dislike **and** skip to next. Default **X**, remappable. | [install](https://github.com/oriz-org/userscripts/raw/main/youtube-dislike-and-next-shortcut/youtube-dislike-and-next-shortcut.user.js) |
| **youtube-next-video-shortcut** | youtube.com | Press **N** anywhere on a YouTube page to jump to the next video. Atomic. | [install](https://github.com/oriz-org/userscripts/raw/main/youtube-next-video-shortcut/youtube-next-video-shortcut.user.js) |
| **youtube-prev-video-shortcut** | youtube.com | Press **P** anywhere on a YouTube page to jump to the previous video. Atomic. | [install](https://github.com/oriz-org/userscripts/raw/main/youtube-prev-video-shortcut/youtube-prev-video-shortcut.user.js) |
| **youtube-like-shortcut** | youtube.com | Press **S** anywhere on a YouTube video to like / un-like it. Atomic. | [install](https://github.com/oriz-org/userscripts/raw/main/youtube-like-shortcut/youtube-like-shortcut.user.js) |
| **youtube-dislike-shortcut** | youtube.com | Press **D** anywhere on a YouTube video to dislike / un-dislike it. Atomic. | [install](https://github.com/oriz-org/userscripts/raw/main/youtube-dislike-shortcut/youtube-dislike-shortcut.user.js) |
| **open-links-in-selection** | any page | Open every link found in the current selection (anchors + plain-text URLs). Triggered via the Tampermonkey extension menu. Confirms before opening ≥ 5 tabs. | [install](https://github.com/oriz-org/userscripts/raw/main/open-links-in-selection/open-links-in-selection.user.js) |
| **copy-email-links** | any page | Click any `mailto:` link → email address copied to clipboard instead of opening OS mail client. Toast confirms. Replaces the closed-source "Copy email links" Chrome extension. | [install](https://github.com/oriz-org/userscripts/raw/main/copy-email-links/copy-email-links.user.js) |
| **copy-highlighted-links** | any page | Copy URLs of every link in the current selection to the clipboard, one per line. Catches `<a href>` AND plain-text URLs. Replaces the "Copy Highlighted Links" Chrome extension. | [install](https://github.com/oriz-org/userscripts/raw/main/copy-highlighted-links/copy-highlighted-links.user.js) |
| **link-klipper** | any page | Extract every link on the page → download as CSV or copy URLs to clipboard. `Ctrl+Shift+K` hotkey. Captures `<a href>` + `<img src>`. Replaces the "Link Klipper" Chrome extension (no hover-pick mode). | [install](https://github.com/oriz-org/userscripts/raw/main/link-klipper/link-klipper.user.js) |
| **serp-open-articles** | Google / Bing / DuckDuckGo / Brave / Startpage / Kagi | Adds an **Open all article results (N)** button to SERPs that opens every article-type result in a new tab. URL-pattern filter skips videos, social, shopping, maps. Dedupes by host+path. Caps at 10 tabs (configurable) with a confirm dialog above 5. | [install](https://github.com/oriz-org/userscripts/raw/main/serp-open-articles/serp-open-articles.user.js) |

## Layout

```
userscripts/
├── <name>/
│   ├── <name>.user.js   # the userscript (Tampermonkey metadata header at the top)
│   └── README.md        # what it does, screenshots, install URL
├── README.md            # this file (auto-generated index)
└── LICENSE              # MIT
```

One folder per userscript. Each ships as a single `.user.js` file. The metadata block uses `@updateURL` + `@downloadURL` pointing at the GitHub raw URL so Tampermonkey auto-updates on every push.

## Manager compatibility

| Manager | Tested | Notes |
|---|---|---|
| Tampermonkey (Chrome / Firefox / Edge) | ✅ | The default. |
| Violentmonkey (Chrome / Firefox) | ✅ | Same metadata block. |
| ScriptCat | ✅ | Adds `@background`, `@crontab`, `==UserConfig==` extensions if a userscript opts in. |
| Greasemonkey (Firefox-only legacy) | ⚠️ | Some `GM_*` APIs deprecated; modern userscripts use `GM.` namespace. |

## License

MIT.
