#!/usr/bin/env node
// Validate every scripts/<name>/<name>.user.js has a well-formed ==UserScript==
// metadata block with the required keys. Stdlib only — runs in CI with no install.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPTS = join(ROOT, "scripts");
const REQUIRED = ["@name", "@version", "@match", "@license", "@downloadURL"];

// Parse the ==UserScript== block into { key: [values...] }. Returns null if absent.
export function parseMetadata(src) {
	const m = src.match(/\/\/\s*==UserScript==([\s\S]*?)\/\/\s*==\/UserScript==/);
	if (!m) return null;
	const meta = {};
	for (const line of m[1].split("\n")) {
		const kv = line.match(/^\s*\/\/\s*(@\S+)\s+(.*\S)\s*$/);
		if (kv) (meta[kv[1]] ??= []).push(kv[2].trim());
	}
	return meta;
}

function userScriptFiles() {
	const out = [];
	for (const dir of readdirSync(SCRIPTS)) {
		const abs = join(SCRIPTS, dir);
		if (!statSync(abs).isDirectory()) continue;
		for (const f of readdirSync(abs)) {
			if (f.endsWith(".user.js")) out.push(join(abs, f));
		}
	}
	return out.sort();
}

function main() {
	const files = userScriptFiles();
	const errors = [];
	for (const file of files) {
		const rel = file.slice(ROOT.length + 1).replaceAll("\\", "/");
		const meta = parseMetadata(readFileSync(file, "utf8"));
		if (!meta) {
			errors.push(`${rel}: no ==UserScript== block`);
			continue;
		}
		for (const key of REQUIRED) {
			if (!meta[key]?.length) errors.push(`${rel}: missing ${key}`);
		}
		const ver = meta["@version"]?.[0];
		if (ver && !/^\d+\.\d+/.test(ver))
			errors.push(`${rel}: @version "${ver}" not numeric`);
		const dl = meta["@downloadURL"]?.[0];
		if (dl && !/^https:\/\//.test(dl))
			errors.push(`${rel}: @downloadURL must be https`);
	}
	if (errors.length) {
		console.error(`FAIL — ${errors.length} problem(s):`);
		for (const e of errors) console.error(`  ${e}`);
		process.exit(1);
	}
	console.log(
		`OK — ${files.length} userscripts, all required metadata present.`,
	);
}

if (
	import.meta.url === `file://${process.argv[1]}` ||
	process.argv[1]?.endsWith("validate-userscripts.mjs")
) {
	main();
}
