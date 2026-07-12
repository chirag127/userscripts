// ==UserScript==
// @name         Video Speed Controller
// @namespace    https://github.com/chirag127/userscripts
// @version      0.1.0
// @description  Control playback speed of any HTML5 <video>/<audio> with keyboard shortcuts (S slower, D faster, R reset, Z rewind 5s, X advance 5s) plus a draggable on-video speed overlay. Replaces the "Video Speed Controller" Chrome extension.
// @author       chirag127
// @match        *://*/*
// @run-at       document-idle
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts/blob/main/scripts/video-speed-controller.user.js
// @supportURL   https://github.com/chirag127/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/video-speed-controller.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/video-speed-controller.user.js
// ==/UserScript==

/*
README (video-speed-controller)

Keyboard control for HTML5 media playback rate + seeking, with a small overlay
badge on each video showing the current speed.

## Shortcuts (default, remappable via menu)
| Key | Action |
|---|---|
| S | slow down 0.25x |
| D | speed up 0.25x |
| R | reset to 1.0x |
| Z | rewind 5s |
| X | advance 5s |

Keys are ignored while typing in an input/textarea/contenteditable.

## Overlay
A tiny "1.00x" badge sits top-left of each video; click it to cycle
1 -> 1.5 -> 2 -> 2.5 -> 1. Hidden via the menu if you prefer keys only.

## Notes
- Applies to the video the mouse is over, else the largest playing video.
- Persists last chosen speed per session (GM storage).
- Local only; no network.

## License
MIT.
*/

(() => {
	const STEP = 0.25;
	const SEEK = 5;
	const keys = {
		slower: GM_getValue?.("k_slower", "s") || "s",
		faster: GM_getValue?.("k_faster", "d") || "d",
		reset: GM_getValue?.("k_reset", "r") || "r",
		rewind: GM_getValue?.("k_rewind", "z") || "z",
		advance: GM_getValue?.("k_advance", "x") || "x",
	};
	let showOverlay = GM_getValue ? GM_getValue("overlay", true) : true;
	let lastRate = GM_getValue ? GM_getValue("rate", 1) : 1;
	let hovered = null;

	const media = () => [...document.querySelectorAll("video, audio")];

	function target() {
		if (hovered && document.contains(hovered)) return hovered;
		const vids = media().filter((v) => !v.paused && v.readyState > 0);
		if (!vids.length) return media()[0] || null;
		return vids.sort(
			(a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight,
		)[0];
	}

	function setRate(v, rate) {
		if (!v) return;
		rate = Math.max(0.1, Math.min(16, Math.round(rate * 100) / 100));
		v.playbackRate = rate;
		lastRate = rate;
		GM_setValue?.("rate", rate);
		updateBadge(v);
	}

	function badgeFor(v) {
		if (!showOverlay) return null;
		let b = v._vscBadge;
		if (!b) {
			b = document.createElement("div");
			Object.assign(b.style, {
				position: "absolute",
				zIndex: 2147483647,
				top: "8px",
				left: "8px",
				background: "rgba(0,0,0,.7)",
				color: "#fff",
				padding: "2px 6px",
				borderRadius: "4px",
				font: "12px/1.2 monospace",
				cursor: "pointer",
				userSelect: "none",
				pointerEvents: "auto",
			});
			b.title = "Click to cycle speed";
			b.addEventListener("click", (e) => {
				e.stopPropagation();
				e.preventDefault();
				const cycle = [1, 1.5, 2, 2.5];
				const next =
					cycle[(cycle.indexOf(v.playbackRate) + 1) % cycle.length] || 1;
				setRate(v, next);
			});
			v._vscBadge = b;
			const host = v.parentElement || document.body;
			if (getComputedStyle(host).position === "static")
				host.style.position = "relative";
			host.appendChild(b);
		}
		return b;
	}

	function updateBadge(v) {
		const b = badgeFor(v);
		if (b) b.textContent = `${v.playbackRate.toFixed(2)}x`;
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
			if (e.ctrlKey || e.metaKey || e.altKey) return;
			if (typing(document.activeElement)) return;
			const v = target();
			if (!v) return;
			const k = e.key.toLowerCase();
			let handled = true;
			if (k === keys.slower) setRate(v, v.playbackRate - STEP);
			else if (k === keys.faster) setRate(v, v.playbackRate + STEP);
			else if (k === keys.reset) setRate(v, 1);
			else if (k === keys.rewind)
				v.currentTime = Math.max(0, v.currentTime - SEEK);
			else if (k === keys.advance)
				v.currentTime = Math.min(v.duration || Infinity, v.currentTime + SEEK);
			else handled = false;
			if (handled) {
				e.preventDefault();
				e.stopPropagation();
			}
		},
		true,
	);

	document.addEventListener(
		"mouseover",
		(e) => {
			const t = e.target;
			if (t && (t.tagName === "VIDEO" || t.tagName === "AUDIO")) hovered = t;
		},
		true,
	);

	// Apply last rate + attach badges to media as it appears.
	const apply = () =>
		media().forEach((v) => {
			if (v.playbackRate !== lastRate && lastRate !== 1)
				v.playbackRate = lastRate;
			updateBadge(v);
		});
	// Debounce so a burst of DOM mutations (infinite-scroll feeds) coalesces into
	// one apply() per frame instead of forcing layout on every mutation.
	let applyScheduled = false;
	const scheduleApply = () => {
		if (applyScheduled) return;
		applyScheduled = true;
		requestAnimationFrame(() => {
			applyScheduled = false;
			apply();
		});
	};
	new MutationObserver(scheduleApply).observe(document.documentElement, {
		childList: true,
		subtree: true,
	});
	apply();

	if (typeof GM_registerMenuCommand === "function") {
		GM_registerMenuCommand(
			`Overlay badge: ${showOverlay ? "ON" : "OFF"} (toggle)`,
			() => {
				showOverlay = !showOverlay;
				GM_setValue?.("overlay", showOverlay);
				if (!showOverlay)
					media().forEach((v) => {
						v._vscBadge?.remove();
						v._vscBadge = null;
					});
				else apply();
			},
		);
	}
})();
