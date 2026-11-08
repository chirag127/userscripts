# Captcha bypass survey (free, open source)

What exists, what it costs, what we took. Only free/no-key projects are listed; paid solver APIs are out of scope.

## Turnstile

| Project | Stack | Technique | Used |
|---|---|---|---|
| [Meterel/AutoFlare](https://gist.github.com/Meterel/1941f0c156f5f86aafdbddf5f19da42e) | userscript | Hooks `attachShadow`, fires a `PointerEvent("click")` on the checkbox inside the closed shadow root, proxies `isTrusted` | **Base of `turnstile-auto-bypass`** |
| [Iruko233/Turnstile-Slip](https://github.com/Iruko233/Turnstile-Slip) (fork: [`fork/Turnstile-Slip`](../../fork/Turnstile-Slip)) | Node + Chrome, MIT-ish | Puppeteer, humanised `mouse.click` on the widget box, polls `cf_clearance`, fast mode | click timing, retry cadence |
| [Theyka/Turnstile-Solver](https://github.com/Theyka/Turnstile-Solver) (fork: [`fork/Turnstile-Solver`](../../fork/Turnstile-Solver)) | Python + patchright | Multi-threaded browser, API wrapper | backoff shape |
| [CircuitSavage/cloudflare-turnstile-reversed](https://github.com/CircuitSavage/cloudflare-turnstile-reversed) | Python | Challenge-bundle RE, capture toolkit | request-flow reference |
| [SolveGate/playwright-turnstile](https://github.com/SolveGate/playwright-turnstile) | TypeScript | Widget/sitekey discovery, token injection helpers | selectors |

Takeaway: a userscript can only win inside the frame. Page-side JS cannot click a cross-origin iframe, so every working in-page approach clicks from `challenges.cloudflare.com` (AutoFlare) — that is our design. Headless solvers win by trusted CDP input instead.

## reCAPTCHA

- No maintained free userscript does v2 reliably; GreasyFork entries are mostly site-specific auto-submitters.
- Working mechanism inside `google.com/recaptcha/api2/anchor` is a click on `#recaptcha-anchor`; token lands in `g-recaptcha-response`.
- Image grids: unsolved free without CV. `hcaptcha-challenger`(Python, ONNX) and `reCAPTCHA-solver` projects are the usual bases if we add vision later.

## hCaptcha

- Same frame strategy, element is `#checkbox` (a `div[role=checkbox]`), success is `aria-checked="true"`.
- Our live test escalated to the drag challenge on the first click: expected on automated profiles. Token needs the puzzle.

## GeeTest / AWS WAF / Arkose

- GeeTest: slider must be dragged. Free code (`geetest-solver`, `browser-use` helpers) all do canvas gap diff — worth adding later; blind drag only lands end-gap sliders.
- AWS WAF: only two interaction types, press-and-hold and picture puzzle. Hold is one pointerdown + 3 s + pointerup.
- Arkose: "Begin"/verify screens are plain buttons; rotation puzzles unsolved free.

## Proof-of-work (ALTCHA, Cap)

Client-side by design — `verify()` + click is enough. No bypass industry exists because none is needed.

## Free extensions worth knowing

| Extension | Note |
|---|---|
| ScriptCat | this repo's runtime; `CAT_registerMenuInput` switches |
| NopeCHA | freemium, free daily quota, browser extension — best fallback when a puzzle must be solved |
| Buster | free reCAPTCHA audio helper, old but still works |
| Privacy Pass / Cloudflare | not a bypass, reduces challenges for signed-in users |

## What we deliberately do not do

- No paid API calls (2Captcha, CapSolver, CapMonster).
- No token harvesting across tabs — each page solves its own widget.
- No vision model for image puzzles yet.
