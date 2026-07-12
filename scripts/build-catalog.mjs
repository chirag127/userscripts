#!/usr/bin/env node
// Build the userscripts install catalog into dist/.
//   - parse ==UserScript== metadata + per-script README.md
//   - emit dist/index.html (searchable card grid)
//   - emit dist/s/<name>.html per-script pages (README rendered client-side via marked)
//   - copy each .user.js into dist/scripts/<name>/ so the site is self-contained
// Stdlib only — CI runs it with zero install. Design: "Grease & Circuit".
import {
	copyFileSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseMetadata } from "./validate-userscripts.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPTS = join(ROOT, "scripts");
const DIST = join(ROOT, "dist");
const RAW = "https://raw.githubusercontent.com/chirag127/userscripts/main";
const REPO = "https://github.com/chirag127/userscripts";

const esc = (s = "") =>
	String(s).replace(
		/[&<>"']/g,
		(c) =>
			({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
				c
			],
	);
const attr = (s) => esc(s).replaceAll("`", "&#96;");

// ---- collect ---------------------------------------------------------------
function collect() {
	const items = [];
	for (const dir of readdirSync(SCRIPTS)) {
		const abs = join(SCRIPTS, dir);
		if (!statSync(abs).isDirectory()) continue;
		const jsName = readdirSync(abs).find((f) => f.endsWith(".user.js"));
		if (!jsName) continue;
		const src = readFileSync(join(abs, jsName), "utf8");
		const meta = parseMetadata(src) || {};
		const first = (k) => meta[k]?.[0] || "";
		let readme = "";
		try {
			readme = readFileSync(join(abs, "README.md"), "utf8");
		} catch {}
		items.push({
			slug: dir,
			jsName,
			name: first("@name") || dir,
			version: first("@version"),
			description: first("@description"),
			license: first("@license") || "MIT",
			matches: meta["@match"] || meta["@include"] || [],
			grants: (meta["@grant"] || []).filter((g) => g !== "none"),
			runAt: first("@run-at"),
			installUrl: first("@downloadURL") || `${RAW}/scripts/${dir}/${jsName}`,
			folderUrl: `${REPO}/tree/main/scripts/${dir}`,
			loc: src.split("\n").length,
			readme,
		});
	}
	return items.sort((a, b) => a.name.localeCompare(b.name));
}

// ---- shared head/style -----------------------------------------------------
const FAVICON = `<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%2315171c'/%3E%3Crect x='7' y='7' width='18' height='18' rx='4' fill='%23f2a01d'/%3E%3Ccircle cx='16' cy='16' r='4' fill='%237c5cff'/%3E%3C/svg%3E">`;
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;450;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">`;

const STYLE = `
:root{
  --ink:#15171c; --paper:#f5f6f8; --card:#ffffff; --line:#e2e5ea;
  --marigold:#f2a01d; --marigold-ink:#7a4d00; --violet:#7c5cff; --teal:#0e9d8e; --slate:#5b6472;
  --shadow:0 1px 0 #fff inset,0 2px 8px rgba(21,23,28,.06),0 12px 30px rgba(21,23,28,.05);
  --disp:'Space Grotesk',system-ui,sans-serif; --body:'Inter',system-ui,sans-serif; --mono:'JetBrains Mono',ui-monospace,monospace;
  --r:14px;
}
[data-theme=dark]{
  --ink:#eef0f4; --paper:#101217; --card:#171a21; --line:#262a33;
  --marigold:#ffb43d; --marigold-ink:#1a1204; --violet:#a892ff; --teal:#3fd6c4; --slate:#98a1b2;
  --shadow:0 1px 0 rgba(255,255,255,.03) inset,0 2px 10px rgba(0,0,0,.4),0 16px 40px rgba(0,0,0,.35);
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--body);line-height:1.55;
  background-image:radial-gradient(circle at 1px 1px,var(--line) 1px,transparent 0);background-size:22px 22px;}
a{color:inherit}
.wrap{max-width:1180px;margin:0 auto;padding:0 20px}

/* manager bar */
.bar{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--paper) 88%,transparent);
  backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.bar-in{display:flex;align-items:center;gap:14px;padding:12px 0;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:10px;font-family:var(--disp);font-weight:700;font-size:1.05rem;letter-spacing:-.01em;text-decoration:none;white-space:nowrap}
.chip-dot{width:12px;height:12px;border-radius:50%;background:var(--marigold);box-shadow:0 0 0 3px color-mix(in srgb,var(--marigold) 30%,transparent)}
.search{flex:1;min-width:200px;display:flex;align-items:center;gap:8px;background:var(--card);border:1px solid var(--line);
  border-radius:999px;padding:8px 14px;box-shadow:var(--shadow)}
.search:focus-within{border-color:var(--violet);box-shadow:0 0 0 3px color-mix(in srgb,var(--violet) 25%,transparent)}
.search input{border:0;background:transparent;color:inherit;font:inherit;font-family:var(--mono);font-size:.9rem;width:100%;outline:none}
.search svg{flex:none;opacity:.55}
.count{font-family:var(--mono);font-size:.78rem;color:var(--slate);white-space:nowrap}
.count b{color:var(--marigold)}
.tbtn{flex:none;width:38px;height:38px;border-radius:10px;border:1px solid var(--line);background:var(--card);
  color:inherit;cursor:pointer;display:grid;place-items:center;box-shadow:var(--shadow)}
.tbtn:hover{border-color:var(--violet)}

/* hero */
.hero{padding:52px 0 26px}
.kicker{font-family:var(--mono);font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;color:var(--teal);font-weight:700}
.hero h1{font-family:var(--disp);font-weight:700;letter-spacing:-.02em;font-size:clamp(2rem,5vw,3.3rem);line-height:1.04;margin:.35em 0 .3em}
.hero h1 .amp{color:var(--marigold)}
.hero p{max-width:60ch;color:var(--slate);font-size:1.05rem;margin:0}
.how{margin-top:20px;display:flex;gap:8px;flex-wrap:wrap;font-family:var(--mono);font-size:.8rem}
.how span{background:var(--card);border:1px solid var(--line);border-radius:999px;padding:6px 12px;color:var(--slate)}
.how b{color:var(--ink)}

/* filter pills */
.pills{display:flex;gap:8px;flex-wrap:wrap;padding:6px 0 26px}
.pill{font-family:var(--mono);font-size:.78rem;border:1px solid var(--line);background:var(--card);color:var(--slate);
  border-radius:999px;padding:6px 13px;cursor:pointer}
.pill[aria-pressed=true]{background:var(--ink);color:var(--paper);border-color:var(--ink)}

/* grid + cartridge cards */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:18px;padding-bottom:40px}
.card{position:relative;background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:18px 18px 16px;
  box-shadow:var(--shadow);display:flex;flex-direction:column;gap:12px;transition:transform .16s ease,border-color .16s ease}
.card:hover{transform:translateY(-3px);border-color:color-mix(in srgb,var(--marigold) 55%,var(--line))}
.card::before{content:"";position:absolute;left:18px;right:18px;top:0;height:3px;border-radius:0 0 3px 3px;
  background:linear-gradient(90deg,var(--marigold),var(--violet));opacity:.9}
.card-top{display:flex;align-items:flex-start;gap:10px}
.pwr{width:11px;height:11px;margin-top:6px;border-radius:50%;background:var(--teal);box-shadow:0 0 0 3px color-mix(in srgb,var(--teal) 28%,transparent);flex:none}
.card h3{font-family:var(--disp);font-weight:600;font-size:1.06rem;line-height:1.25;margin:0;letter-spacing:-.01em}
.card h3 a{text-decoration:none}
.card h3 a:hover{color:var(--violet)}
.ver{margin-left:auto;font-family:var(--mono);font-size:.72rem;font-weight:700;color:var(--marigold-ink);
  background:color-mix(in srgb,var(--marigold) 22%,transparent);border:1px solid color-mix(in srgb,var(--marigold) 45%,transparent);
  border-radius:6px;padding:3px 7px;white-space:nowrap}
.desc{color:var(--slate);font-size:.92rem;margin:0;flex:1}
.sockets{display:flex;gap:6px;flex-wrap:wrap}
.socket{font-family:var(--mono);font-size:.7rem;color:var(--teal);background:color-mix(in srgb,var(--teal) 12%,transparent);
  border:1px solid color-mix(in srgb,var(--teal) 30%,transparent);border-radius:6px;padding:3px 7px}
.socket.grant{color:var(--violet);background:color-mix(in srgb,var(--violet) 12%,transparent);border-color:color-mix(in srgb,var(--violet) 30%,transparent)}
.acts{display:flex;align-items:center;gap:10px;margin-top:2px}
.install{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;
  font-family:var(--disp);font-weight:700;font-size:.92rem;color:var(--marigold-ink);background:var(--marigold);
  border:1px solid color-mix(in srgb,var(--marigold) 70%,#000);border-radius:10px;padding:10px 14px;
  box-shadow:0 2px 0 color-mix(in srgb,var(--marigold) 60%,#000);transition:transform .1s ease}
.install:hover{transform:translateY(-1px)}
.install:active{transform:translatey(1px);box-shadow:0 1px 0 color-mix(in srgb,var(--marigold) 60%,#000)}
.docs{font-family:var(--mono);font-size:.78rem;color:var(--slate);text-decoration:none;padding:6px 4px}
.docs:hover{color:var(--violet)}
.empty{display:none;padding:60px 0;text-align:center;color:var(--slate);font-family:var(--mono)}

/* footer */
footer{border-top:1px solid var(--line);margin-top:20px;padding:28px 0 44px;color:var(--slate);font-size:.85rem}
footer a{color:var(--violet);text-decoration:none}
footer .mono{font-family:var(--mono)}

/* per-script page */
.back{display:inline-flex;gap:6px;align-items:center;font-family:var(--mono);font-size:.82rem;color:var(--slate);text-decoration:none;margin:26px 0 10px}
.back:hover{color:var(--violet)}
.detail{background:var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--shadow);padding:26px;margin-bottom:40px}
.detail h1{font-family:var(--disp);letter-spacing:-.02em;margin:.1em 0 .3em;font-size:clamp(1.5rem,4vw,2.2rem)}
.detail .meta-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:18px}
.readme{border-top:1px solid var(--line);margin-top:22px;padding-top:8px}
.readme h1,.readme h2,.readme h3{font-family:var(--disp);letter-spacing:-.01em}
.readme code{font-family:var(--mono);font-size:.86em;background:color-mix(in srgb,var(--slate) 14%,transparent);padding:.12em .4em;border-radius:5px}
.readme pre{background:var(--ink);color:var(--paper);padding:14px 16px;border-radius:10px;overflow:auto}
.readme pre code{background:none;color:inherit}
.readme table{border-collapse:collapse;width:100%}
.readme th,.readme td{border:1px solid var(--line);padding:7px 10px;text-align:left}
.readme a{color:var(--violet)}

@media (max-width:560px){.grid{grid-template-columns:1fr}.hero{padding:34px 0 18px}}
@media (prefers-reduced-motion:reduce){*{transition:none!important;scroll-behavior:auto!important}}
:focus-visible{outline:3px solid var(--violet);outline-offset:2px;border-radius:6px}
`;

const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('us-theme');if(!t)t=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

const ICON_SEARCH = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>`;
const ICON_MOON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`;
const ICON_DL = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16"/></svg>`;

function themeToggleScript() {
	return `document.getElementById('tbtn').addEventListener('click',function(){var d=document.documentElement,n=d.getAttribute('data-theme')==='dark'?'light':'dark';d.setAttribute('data-theme',n);try{localStorage.setItem('us-theme',n)}catch(e){}});`;
}

function bar(active) {
	return `<header class="bar"><div class="wrap bar-in">
  <a class="brand" href="./index.html"><span class="chip-dot"></span>userscripts<span style="color:var(--slate);font-weight:500">/manager</span></a>
  ${
		active === "catalog"
			? `<label class="search">${ICON_SEARCH}<input id="q" type="search" placeholder="filter scripts — name, site, or what it does" aria-label="Filter userscripts" autocomplete="off"></label>
  <span class="count" id="count"></span>`
			: `<span style="flex:1"></span>`
	}
  <button class="tbtn" id="tbtn" aria-label="Toggle dark mode" title="Toggle theme">${ICON_MOON}</button>
</div></header>`;
}

// ---- index page ------------------------------------------------------------
function cardHtml(it) {
	const sockets = it.matches
		.slice(0, 3)
		.map(
			(m) =>
				`<span class="socket" title="${attr(m)}">${esc(siteLabelOne(m))}</span>`,
		)
		.join("");
	const more =
		it.matches.length > 3
			? `<span class="socket">+${it.matches.length - 3}</span>`
			: "";
	const grant = it.grants.length
		? `<span class="socket grant" title="${attr(it.grants.join(" "))}">${it.grants.length} GM API${it.grants.length > 1 ? "s" : ""}</span>`
		: "";
	return `<article class="card" data-hay="${attr(`${it.name} ${it.description} ${it.matches.join(" ")} ${it.slug}`.toLowerCase())}" data-scope="${it.matches.some((m) => /\*:\/\/\*/.test(m)) ? "any" : "site"}">
  <div class="card-top"><span class="pwr" aria-hidden="true"></span>
    <h3><a href="./s/${it.slug}.html">${esc(it.name)}</a></h3>
    <span class="ver">v${esc(it.version)}</span></div>
  <p class="desc">${esc(it.description)}</p>
  <div class="sockets">${sockets}${more}${grant}</div>
  <div class="acts">
    <a class="install" href="${attr(it.installUrl)}">${ICON_DL} Install</a>
    <a class="docs" href="./s/${it.slug}.html">docs →</a>
  </div>
</article>`;
}

function siteLabelOne(m) {
	try {
		if (/^\*:\/\/\*\//.test(m)) return "any page";
		const h = m.replace(/^\*:\/\//, "https://");
		const u = new URL(h.includes("://") ? h : `https://${h}`);
		return u.hostname.replace(/^\*\./, "").replace(/^www\./, "") || "any page";
	} catch {
		return "any page";
	}
}

function indexHtml(items) {
	const anyCount = items.filter((i) =>
		i.matches.some((m) => /\*:\/\/\*/.test(m)),
	).length;
	return `<!doctype html><html lang="en" data-theme="light"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>userscripts — install catalog</title>
<meta name="description" content="A searchable install catalog of ${items.length} Tampermonkey / Violentmonkey / ScriptCat userscripts by chirag127. One-click install, auto-update.">
<meta property="og:title" content="userscripts — install catalog">
<meta property="og:description" content="${items.length} one-click-install userscripts. Tampermonkey / Violentmonkey / ScriptCat.">
<meta name="theme-color" content="#f2a01d">
${FAVICON}${FONTS}<style>${STYLE}</style><script>${THEME_SCRIPT}</script></head><body>
${bar("catalog")}
<main class="wrap">
  <section class="hero">
    <span class="kicker">Greasemonkey-era power, one click away</span>
    <h1>Install-ready userscripts <span class="amp">&amp;</span> nothing else.</h1>
    <p>${items.length} small, single-purpose scripts for Tampermonkey, Violentmonkey and ScriptCat. Pop the cartridge, click <b>Install</b>, done — every script auto-updates straight from the repo.</p>
    <div class="how"><span><b>1.</b> Install a manager</span><span><b>2.</b> Click <b style="color:var(--marigold)">Install</b></span><span><b>3.</b> Confirm in the manager</span></div>
  </section>
  <nav class="pills" aria-label="Filter by scope">
    <button class="pill" data-filter="all" aria-pressed="true">All · ${items.length}</button>
    <button class="pill" data-filter="any" aria-pressed="false">Any page · ${anyCount}</button>
    <button class="pill" data-filter="site" aria-pressed="false">Site-specific · ${items.length - anyCount}</button>
  </nav>
  <section class="grid" id="grid">
${items.map(cardHtml).join("\n")}
  </section>
  <p class="empty" id="empty">No script matches — try another word.</p>
</main>
<footer class="wrap">
  <p>All scripts MIT-licensed · <a href="${REPO}">source on GitHub</a> · install links pull the latest version live from the repo, so there's no service worker and nothing to un-cache.</p>
  <p class="mono">chirag127 / userscripts</p>
</footer>
<script>
${themeToggleScript()}
(function(){
  var q=document.getElementById('q'),grid=document.getElementById('grid'),empty=document.getElementById('empty'),count=document.getElementById('count');
  var cards=[].slice.call(grid.children),pills=[].slice.call(document.querySelectorAll('.pill')),scope='all';
  function apply(){
    var term=(q.value||'').trim().toLowerCase(),shown=0;
    cards.forEach(function(c){
      var okScope=scope==='all'||c.getAttribute('data-scope')===scope;
      var okTerm=!term||c.getAttribute('data-hay').indexOf(term)>-1;
      var show=okScope&&okTerm;c.style.display=show?'':'none';if(show)shown++;
    });
    empty.style.display=shown?'none':'block';
    count.innerHTML='<b>'+shown+'</b> / '+cards.length;
  }
  q.addEventListener('input',apply);
  pills.forEach(function(p){p.addEventListener('click',function(){pills.forEach(function(x){x.setAttribute('aria-pressed','false')});p.setAttribute('aria-pressed','true');scope=p.getAttribute('data-filter');apply();});});
  addEventListener('keydown',function(e){if(e.key==='/'&&document.activeElement!==q){e.preventDefault();q.focus();}});
  apply();
})();
</script>
</body></html>`;
}

// ---- per-script page -------------------------------------------------------
function detailHtml(it) {
	const sockets = it.matches
		.map(
			(m) =>
				`<span class="socket" title="${attr(m)}">${esc(siteLabelOne(m))}</span>`,
		)
		.join("");
	const grant = it.grants.length
		? `<span class="socket grant">${esc(it.grants.join(", "))}</span>`
		: "";
	return `<!doctype html><html lang="en" data-theme="light"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(it.name)} — userscripts</title>
<meta name="description" content="${attr(it.description)}">
<meta name="theme-color" content="#f2a01d">
${FAVICON}${FONTS}<style>${STYLE}</style><script>${THEME_SCRIPT}</script></head><body>
${bar("detail")}
<main class="wrap">
  <a class="back" href="../index.html">← all scripts</a>
  <article class="detail">
    <span class="kicker">userscript · v${esc(it.version)} · ${esc(it.license)}</span>
    <h1>${esc(it.name)}</h1>
    <div class="meta-row">${sockets}${grant}${it.runAt ? `<span class="socket grant">@${esc(it.runAt)}</span>` : ""}</div>
    <div class="acts" style="max-width:420px">
      <a class="install" href="${attr(it.installUrl)}">${ICON_DL} Install this script</a>
      <a class="docs" href="${attr(it.folderUrl)}">on GitHub →</a>
    </div>
    <div class="readme" id="readme"><p style="color:var(--slate)">${esc(it.description)}</p></div>
  </article>
</main>
<footer class="wrap"><p>MIT · <a href="${attr(it.folderUrl)}">source</a> · <a href="../index.html">back to catalog</a></p></footer>
<script id="md" type="text/markdown">${it.readme.replace(/<\/script>/gi, "<\\/script>")}</script>
<script src="https://cdn.jsdelivr.net/npm/marked@15/marked.min.js"></script>
<script>
${themeToggleScript()}
(function(){
  var md=document.getElementById('md').textContent;
  if(md&&window.marked){document.getElementById('readme').innerHTML=marked.parse(md);}
})();
</script>
</body></html>`;
}

// ---- write -----------------------------------------------------------------
function build() {
	rmSync(DIST, { recursive: true, force: true });
	mkdirSync(join(DIST, "s"), { recursive: true });
	const items = collect();
	writeFileSync(join(DIST, "index.html"), indexHtml(items));
	for (const it of items) {
		writeFileSync(join(DIST, "s", `${it.slug}.html`), detailHtml(it));
		const outDir = join(DIST, "scripts", it.slug);
		mkdirSync(outDir, { recursive: true });
		copyFileSync(join(SCRIPTS, it.slug, it.jsName), join(outDir, it.jsName));
	}
	writeFileSync(join(DIST, "_redirects"), "/*    /index.html   404\n");
	console.log(
		`Built dist/ — ${items.length} scripts, ${items.length + 1} pages.`,
	);
}

build();
