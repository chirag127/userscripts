// ==UserScript==
// @name         Fake Filler
// @namespace    https://github.com/chirag127/userscripts
// @version      0.1.0
// @description  Fill every form input/textarea/select on the page with realistic dummy data via a hotkey (Ctrl+Shift+F) or the userscript menu. Replaces the "Fake Filler" Chrome extension for quick form testing.
// @author       chirag127
// @match        *://*/*
// @run-at       document-idle
// @grant        GM_registerMenuCommand
// @license      MIT
// @homepageURL  https://github.com/chirag127/userscripts/blob/main/scripts/fake-filler.user.js
// @supportURL   https://github.com/chirag127/userscripts/issues
// @updateURL    https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/fake-filler.user.js
// @downloadURL  https://raw.githubusercontent.com/chirag127/userscripts/main/scripts/fake-filler.user.js
// ==/UserScript==

/*
README (fake-filler)

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
*/

(() => {
	const rand = (n) => Math.floor(Math.random() * n);
	const pick = (arr) => arr[rand(arr.length)];
	const pad = (n, w) => String(n).padStart(w, "0");

	const FIRST = [
		"Alex",
		"Sam",
		"Jordan",
		"Taylor",
		"Morgan",
		"Riley",
		"Casey",
		"Jamie",
	];
	const LAST = [
		"Smith",
		"Jones",
		"Lee",
		"Patel",
		"Garcia",
		"Khan",
		"Nguyen",
		"Brown",
	];
	const WORDS = [
		"lorem",
		"ipsum",
		"dolor",
		"sit",
		"amet",
		"consectetur",
		"adipiscing",
		"elit",
		"sed",
		"do",
	];
	const DOMAINS = ["example.com", "test.dev", "sample.org", "mail.test"];

	const words = (n) => Array.from({ length: n }, () => pick(WORDS)).join(" ");
	const sentence = (n) => {
		const s = words(n);
		return `${s.charAt(0).toUpperCase() + s.slice(1)}.`;
	};
	const fullName = () => `${pick(FIRST)} ${pick(LAST)}`;
	const email = () =>
		`${pick(FIRST).toLowerCase()}.${pick(LAST).toLowerCase()}${rand(99)}@${pick(DOMAINS)}`;
	const phone = () => `+1${pad(rand(1e10), 10)}`;
	const zip = () => pad(rand(1e5), 5);

	const hint = (el) =>
		`${el.name || ""} ${el.id || ""} ${el.getAttribute("autocomplete") || ""} ${el.placeholder || ""} ${el.getAttribute("aria-label") || ""}`.toLowerCase();

	function textValue(el) {
		const h = hint(el);
		if (/e-?mail/.test(h)) return email();
		if (/phone|mobile|tel/.test(h)) return phone();
		if (/zip|postal/.test(h)) return zip();
		if (/first.*name|given/.test(h)) return pick(FIRST);
		if (/last.*name|surname|family/.test(h)) return pick(LAST);
		if (/\bname\b|full.?name/.test(h)) return fullName();
		if (/city|town/.test(h))
			return pick(["Springfield", "Riverton", "Franklin", "Clinton"]);
		if (/address|street/.test(h)) return `${rand(9999)} ${pick(WORDS)} St`;
		if (/company|org/.test(h))
			return `${pick(LAST)} ${pick(["LLC", "Inc", "Co"])}`;
		if (/user.?name|handle|nick/.test(h))
			return `${pick(FIRST).toLowerCase()}${rand(999)}`;
		if (/subject|title/.test(h)) return sentence(4);
		if (/message|comment|body|about|bio|desc/.test(h)) return sentence(12);
		if (/url|website|site/.test(h)) return `https://${pick(DOMAINS)}`;
		return sentence(3);
	}

	function setValue(el, value) {
		const proto =
			el instanceof HTMLTextAreaElement
				? HTMLTextAreaElement.prototype
				: el instanceof HTMLSelectElement
					? HTMLSelectElement.prototype
					: HTMLInputElement.prototype;
		const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
		if (setter) setter.call(el, value);
		else el.value = value;
		el.dispatchEvent(new Event("input", { bubbles: true }));
		el.dispatchEvent(new Event("change", { bubbles: true }));
	}

	function fillOne(el) {
		if (el.disabled || el.readOnly || el.offsetParent === null) return false;
		const tag = el.tagName;
		if (tag === "SELECT") {
			const opts = [...el.options].filter((o) => o.value !== "" && !o.disabled);
			if (!opts.length) return false;
			setValue(el, pick(opts).value);
			return true;
		}
		if (tag === "TEXTAREA") {
			setValue(el, sentence(14));
			return true;
		}
		const type = (el.type || "text").toLowerCase();
		switch (type) {
			case "hidden":
			case "submit":
			case "button":
			case "reset":
			case "file":
			case "image":
				return false;
			case "checkbox":
				if (Math.random() < 0.5) {
					el.checked = true;
					el.dispatchEvent(new Event("change", { bubbles: true }));
				}
				return true;
			case "radio":
				// Group-aware: pick exactly one radio per name-group. Handled once
				// per group in fillAll(); a lone/nameless radio just gets checked.
				return true;
			case "email":
				setValue(el, email());
				return true;
			case "tel":
				setValue(el, phone());
				return true;
			case "url":
				setValue(el, `https://${pick(DOMAINS)}`);
				return true;
			case "number":
			case "range": {
				const min = Number(el.min || 0),
					max = Number(el.max || 100);
				setValue(el, String(min + rand(Math.max(1, max - min + 1))));
				return true;
			}
			case "date":
				setValue(
					el,
					`20${pad(rand(24), 2)}-${pad(1 + rand(12), 2)}-${pad(1 + rand(28), 2)}`,
				);
				return true;
			case "month":
				setValue(el, `20${pad(rand(24), 2)}-${pad(1 + rand(12), 2)}`);
				return true;
			case "week":
				setValue(el, `20${pad(rand(24), 2)}-W${pad(1 + rand(52), 2)}`);
				return true;
			case "time":
				setValue(el, `${pad(rand(24), 2)}:${pad(rand(60), 2)}`);
				return true;
			case "datetime-local":
				setValue(
					el,
					`20${pad(rand(24), 2)}-${pad(1 + rand(12), 2)}-${pad(1 + rand(28), 2)}T${pad(rand(24), 2)}:${pad(rand(60), 2)}`,
				);
				return true;
			case "color":
				setValue(el, `#${pad(rand(0x1000000).toString(16), 6)}`);
				return true;
			case "password":
				setValue(el, `Aa1!${pick(WORDS)}${rand(999)}`);
				return true;
			default:
				setValue(el, textValue(el));
				return true;
		}
	}

	function fillAll() {
		const els = document.querySelectorAll("input, textarea, select");
		let n = 0;
		els.forEach((el) => {
			try {
				if (fillOne(el)) n++;
			} catch {
				/* skip */
			}
		});
		// Radio groups: check exactly one radio per name-group (mutual exclusivity).
		const groups = new Map();
		document.querySelectorAll('input[type="radio"]').forEach((r) => {
			if (r.disabled || r.offsetParent === null) return;
			const key = r.name || `__lone_${n}_${Math.random()}`;
			if (!groups.has(key)) groups.set(key, []);
			groups.get(key).push(r);
		});
		groups.forEach((radios) => {
			const chosen = pick(radios);
			chosen.checked = true;
			chosen.dispatchEvent(new Event("change", { bubbles: true }));
			n++;
		});
		toast(`Fake Filler: filled ${n} field${n === 1 ? "" : "s"}`);
	}

	function typing(el) {
		return (
			el &&
			(el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
		);
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

	document.addEventListener("keydown", (e) => {
		if (e.ctrlKey && e.shiftKey && (e.key === "F" || e.key === "f")) {
			if (typing(document.activeElement)) return;
			e.preventDefault();
			fillAll();
		}
	});

	if (typeof GM_registerMenuCommand === "function") {
		GM_registerMenuCommand("Fill forms with fake data", fillAll);
	}
})();
