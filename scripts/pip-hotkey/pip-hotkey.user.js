// ==UserScript==
// @name         Picture-in-Picture Hotkey
// @namespace    https://github.com/chirag127/userscripts
// @version      0.1.0
// @description  Toggle Picture-in-Picture on the largest/active <video> with a hotkey (Alt+P) or the userscript menu. Replaces Google's "Picture-in-Picture Extension".
// @author       chirag127
// @match        *://*/*
// @run-at       document-idle
// @grant        GM_registerMenuCommand
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts/tree/main/scripts/pip-hotkey
// @supportURL   https://github.com/chirag127/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/pip-hotkey/pip-hotkey.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/pip-hotkey/pip-hotkey.user.js
// ==/UserScript==

(() => {
	let hovered = null;

	const videos = () => [...document.querySelectorAll("video")];

	function target() {
		if (hovered && document.contains(hovered)) return hovered;
		const playing = videos().filter((v) => !v.paused && v.readyState > 0);
		const pool = playing.length ? playing : videos();
		if (!pool.length) return null;
		return pool.sort(
			(a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight,
		)[0];
	}

	async function toggle() {
		try {
			if (document.pictureInPictureElement) {
				await document.exitPictureInPicture();
				return;
			}
			const v = target();
			if (!v) {
				toast("PiP: no video found");
				return;
			}
			if (v.disablePictureInPicture) {
				toast("PiP disabled for this video");
				return;
			}
			if (v.readyState === 0) {
				toast("PiP: video not ready");
				return;
			}
			await v.requestPictureInPicture();
		} catch (err) {
			toast(`PiP failed: ${err.message || err.name}`);
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
			if (
				e.altKey &&
				!e.ctrlKey &&
				!e.metaKey &&
				(e.key === "p" || e.key === "P")
			) {
				if (typing(document.activeElement)) return;
				e.preventDefault();
				toggle();
			}
		},
		true,
	);

	document.addEventListener(
		"mouseover",
		(e) => {
			if (e.target && e.target.tagName === "VIDEO") hovered = e.target;
		},
		true,
	);

	if (typeof GM_registerMenuCommand === "function") {
		GM_registerMenuCommand("Toggle Picture-in-Picture", toggle);
	}
})();
