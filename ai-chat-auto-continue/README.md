# ai-chat-auto-continue

Userscript that auto-clicks the **Continue** button on AI chat sites when a response is truncated by output-token limits. Long generations finish unattended.

## Supported sites

- ChatGPT (`chatgpt.com`, `chat.openai.com`)
- Claude (`claude.ai`)
- Gemini (`gemini.google.com`)

## How it works

A `MutationObserver` on `document.body` scans for a visible, enabled button whose text matches `/^(continue|continue generating|keep going)$/i`. When found, it clicks after a 500 ms settle delay. A 3 s cooldown between clicks prevents runaway loops if a site re-renders the button rapidly.

Text-based matching (not CSS selectors) survives class-name churn across UI redesigns.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) (or Violentmonkey / ScriptCat).
2. Click → **[install](https://github.com/chirag127/userscripts/raw/main/ai-chat-auto-continue/ai-chat-auto-continue.user.js)**

## Toggle per-site

Open the Tampermonkey menu on any supported site → click **Auto-continue: ON (host) — click to toggle**. The setting is stored per hostname via `GM_setValue` and persists across reloads.

## Known limitations

- **Text-locale dependent.** The regex matches English button labels. If your UI is in another language, edit `CONTINUE_TEXT` in the script.
- **Runs forever.** No stop condition beyond "no Continue button visible." If a site ever shows a permanent Continue button that isn't a truncation prompt, disable per-site via the menu.
- **Cooldown is global.** The 3 s cooldown applies across the whole tab, not per-conversation.

## License

MIT.
