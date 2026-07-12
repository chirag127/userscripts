// ==UserScript==
// @name         Read Aloud
// @namespace    https://github.com/chirag127/userscripts-script
// @version      0.1.0
// @description  Read the selected text (or the whole article) aloud using the browser's built-in speech synthesis. Hotkey Alt+R to start/stop, Alt+. to pause/resume. Replaces the "Read Aloud" Chrome extension for basic TTS.
// @author       chirag127
// @match        *://*/*
// @run-at       document-idle
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts-script/blob/main/scripts/read-aloud.user.js
// @supportURL   https://github.com/chirag127/userscripts-script/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/read-aloud.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts-script/main/scripts/read-aloud.user.js
// ==/UserScript==

/*
README (read-aloud)

Text-to-speech for the current page using the Web Speech API
(`speechSynthesis`) — no network, no API key.

## Shortcuts
| Key | Action |
|---|---|
| Alt+R | read selection (or whole article) / stop if speaking |
| Alt+. | pause / resume |

Menu entries mirror these and let you set the rate (0.75 / 1.0 / 1.25 / 1.5x).

## What it reads
- If text is selected, reads the selection.
- Otherwise extracts the main article text: prefers <article>, [role=main],
  <main>, else the largest text block; strips scripts/styles/nav/aside.

## Notes
- Chunks long text on sentence boundaries so it can be stopped promptly and
  avoids the browser's ~32k-char utterance cap.
- Rate persists across sessions (GM storage).
- Voice = the browser default for the page language.

## License
MIT.
*/

(() => {
	const synth = window.speechSynthesis;
	if (!synth) return;

	let rate = GM_getValue ? GM_getValue("rate", 1) : 1;
	let queue = [];
	let speaking = false;

	function selectionText() {
		const s = window.getSelection();
		return s?.toString().trim();
	}

	function articleText() {
		const root =
			document.querySelector("article") ||
			document.querySelector('[role="main"]') ||
			document.querySelector("main") ||
			largestBlock() ||
			document.body;
		// Read innerText from the LIVE node: it reflects rendered layout, collapses
		// whitespace, and skips display:none content (a detached clone returns "").
		// Temporarily hide chrome-ish descendants so they don't get spoken.
		const strip = root.querySelectorAll(
			"script,style,noscript,nav,aside,header,footer,form,button",
		);
		const hidden = [];
		strip.forEach((n) => {
			hidden.push([n, n.style.display]);
			n.style.display = "none";
		});
		const text = (root.innerText || root.textContent || "")
			.replace(/\n{3,}/g, "\n\n")
			.replace(/[ \t]{2,}/g, " ")
			.trim();
		hidden.forEach(([n, d]) => {
			n.style.display = d;
		});
		return text;
	}

	function largestBlock() {
		let best = null,
			bestLen = 0;
		document.querySelectorAll("div,section").forEach((el) => {
			const len = (el.innerText || "").length;
			if (len > bestLen) {
				bestLen = len;
				best = el;
			}
		});
		return best;
	}

	function chunk(text) {
		// Split on sentence enders, then re-pack to <=200 char chunks.
		const parts = text.match(/[^.!?\n]+[.!?]?\s*|\n+/g) || [text];
		const out = [];
		let cur = "";
		const flushBig = (p) => {
			// A single part longer than the cap: hard-split on whitespace so no
			// utterance exceeds ~200 chars (some mobile TTS stalls on long ones).
			let s = p;
			while (s.length > 200) {
				let cut = s.lastIndexOf(" ", 200);
				if (cut <= 0) cut = 200;
				out.push(s.slice(0, cut));
				s = s.slice(cut);
			}
			if (s.trim()) out.push(s);
		};
		for (const p of parts) {
			if (p.length > 200) {
				if (cur) {
					out.push(cur);
					cur = "";
				}
				flushBig(p);
			} else if ((cur + p).length > 200) {
				if (cur) out.push(cur);
				cur = p;
			} else cur += p;
		}
		if (cur.trim()) out.push(cur);
		return out.filter((c) => c.trim());
	}

	function stop() {
		speaking = false;
		queue = [];
		synth.cancel();
		toast("Read Aloud: stopped");
	}

	function speakNext() {
		if (!queue.length) {
			speaking = false;
			return;
		}
		const u = new SpeechSynthesisUtterance(queue.shift());
		u.rate = rate;
		u.lang = document.documentElement.lang || "en";
		u.onend = speakNext;
		u.onerror = () => {
			speaking = false;
		};
		synth.speak(u);
	}

	function start() {
		if (speaking) {
			stop();
			return;
		}
		const text = selectionText() || articleText();
		if (!text) {
			toast("Read Aloud: nothing to read");
			return;
		}
		queue = chunk(text);
		speaking = true;
		toast(
			`Read Aloud: ${queue.length} chunk${queue.length === 1 ? "" : "s"} @ ${rate}x`,
		);
		speakNext();
	}

	function pauseResume() {
		if (!speaking) return;
		if (synth.paused) {
			synth.resume();
			toast("Read Aloud: resumed");
		} else {
			synth.pause();
			toast("Read Aloud: paused");
		}
	}

	function toast(msg) {
		const d = document.createElement("div");
		d.textContent = msg;
		Object.assign(d.style, {
			position: "fixed",
			zIndex: 2147483647,
			bottom: "16px",
			right: "16px",
			background: "#222",
			color: "#fff",
			padding: "8px 12px",
			borderRadius: "6px",
			font: "13px/1.4 system-ui, sans-serif",
			boxShadow: "0 2px 8px rgba(0,0,0,.3)",
		});
		document.body.appendChild(d);
		setTimeout(() => d.remove(), 2000);
	}

	function typing(el) {
		return (
			el &&
			(el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
		);
	}

	document.addEventListener(
		"keydown",
		(e) => {
			if (!e.altKey || e.ctrlKey || e.metaKey) return;
			if (typing(document.activeElement)) return;
			if (e.key === "r" || e.key === "R") {
				e.preventDefault();
				start();
			} else if (e.key === ".") {
				e.preventDefault();
				pauseResume();
			}
		},
		true,
	);

	// Stop speech on navigation away so it doesn't bleed across pages.
	window.addEventListener("beforeunload", () => synth.cancel());
	// SPA navigation (pushState/replaceState/popstate) doesn't fire beforeunload;
	// wrap the history API so client-side route changes also stop playback.
	const stopOnNav = () => {
		if (speaking) stop();
	};
	for (const fn of ["pushState", "replaceState"]) {
		const orig = history[fn];
		history[fn] = function (...args) {
			stopOnNav();
			return orig.apply(this, args);
		};
	}
	window.addEventListener("popstate", stopOnNav);

	if (typeof GM_registerMenuCommand === "function") {
		GM_registerMenuCommand("Read selection / article aloud (Alt+R)", start);
		GM_registerMenuCommand("Pause / resume (Alt+.)", pauseResume);
		GM_registerMenuCommand("Stop", stop);
		[0.75, 1, 1.25, 1.5].forEach((r) => {
			GM_registerMenuCommand(`Set rate ${r}x${rate === r ? " ✓" : ""}`, () => {
				rate = r;
				GM_setValue?.("rate", r);
				toast(`Read Aloud: rate ${r}x`);
			});
		});
	}
})();
