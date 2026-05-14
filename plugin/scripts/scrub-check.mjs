#!/usr/bin/env node
/**
 * scrub-check.mjs — scan a directory tree for denylisted patterns.
 *
 * Usage:
 *   node scrub-check.mjs --denylist <path> --target <dir> [--allowlist <md-path>]
 *
 * Exit:
 *   0 — no unaddressed matches (either no matches OR every match is allowlisted)
 *   1 — one or more matches not covered by the allowlist
 *   2 — usage / IO error / invalid regex in denylist
 *
 * Denylist entry shape:
 *   { "regex": "<pattern>", "flags": "gi", "category": "...", "rationale": "..." }
 *   - "flags" optional; defaults to "g". Use "gi" for case-insensitive brand patterns.
 *
 * Allowlist format (target-relative paths only):
 *   Markdown file with H3 entries `### <regex-key>` and bulleted file paths
 *   relative to the --target directory. CWD-relative paths are NOT supported
 *   (avoid the dual-resolution duplication trap).
 */

import { readFileSync, readdirSync, lstatSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

function usage(msg, code = 2) {
  if (msg) console.error(`scrub-check: ${msg}`);
  console.error('Usage: scrub-check.mjs --denylist <path> --target <dir> [--allowlist <md-path>]');
  process.exit(code);
}

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, arg, i, src) => {
    if (arg.startsWith('--')) {
      const v = src[i + 1];
      if (v === undefined || v.startsWith('--')) usage(`flag ${arg} requires a value`);
      acc.push([arg.slice(2), v]);
    }
    return acc;
  }, [])
);

if (!args.denylist || !args.target) usage('--denylist and --target required');

let denylist;
try {
  denylist = JSON.parse(readFileSync(resolve(args.denylist), 'utf8'));
} catch (e) {
  usage(`cannot read denylist: ${e.message}`);
}

if (!Array.isArray(denylist.patterns)) usage('denylist.patterns must be an array');

// Compile all regexes up-front so a malformed entry fails fast (exit 2) before
// any partial scan output leaks the impression of a clean tree.
const compiled = [];
for (const entry of denylist.patterns) {
  let flags = entry.flags ?? 'g';
  if (!flags.includes('g')) flags += 'g';
  let re;
  try { re = new RegExp(entry.regex, flags); }
  catch (e) { usage(`invalid regex /${entry.regex}/${flags}: ${e.message}`); }
  compiled.push({ re, regex: entry.regex, category: entry.category });
}

const allowlist = new Map();
if (args.allowlist) {
  try {
    const md = readFileSync(resolve(args.allowlist), 'utf8');
    let currentKey = null;
    for (const line of md.split('\n')) {
      const h3 = line.match(/^###\s+(.+?)\s*$/);
      if (h3) { currentKey = h3[1]; allowlist.set(currentKey, new Set()); continue; }
      const bullet = line.match(/^[-*]\s+(\S+)/);
      if (bullet && currentKey) allowlist.get(currentKey).add(bullet[1]);
    }
  } catch (e) {
    // allowlist optional; missing file is fine
    if (e.code !== 'ENOENT') usage(`cannot read allowlist: ${e.message}`);
  }
}

const TEXT_EXTS = new Set(['.md', '.txt', '.json', '.mjs', '.js', '.ts', '.tsx', '.yaml', '.yml', '.toml', '.html', '.css']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.turbo', '.cache']);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    // lstatSync (not statSync) so symlinks are detected; we skip them to
    // prevent out-of-tree content from being scanned + reported (which would
    // both produce confusing paths AND leak content from outside the target).
    const st = lstatSync(full);
    if (st.isSymbolicLink()) continue;
    if (st.isDirectory()) walk(full, out);
    else if (st.isFile()) {
      const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';
      if (TEXT_EXTS.has(ext) || ext === '') out.push(full);
    }
  }
  return out;
}

const target = resolve(args.target);
let files;
try { files = walk(target); } catch (e) { usage(`cannot walk target: ${e.message}`); }

const findings = [];
for (const file of files) {
  let content;
  try { content = readFileSync(file, 'utf8'); } catch { continue; }
  const rel = relative(target, file);
  for (const { re, regex, category } of compiled) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(content)) !== null) {
      // Guard against zero-width matches (e.g., /x*/g) that otherwise loop forever:
      // exec returns the same match indefinitely if it doesn't advance lastIndex.
      if (m.index === re.lastIndex) { re.lastIndex++; continue; }
      const lineNo = content.slice(0, m.index).split('\n').length;
      const allowed = allowlist.get(regex)?.has(rel) ?? false;
      findings.push({ file: rel, line: lineNo, match: m[0], pattern: regex, category, allowed });
    }
  }
}

const unaddressed = findings.filter((f) => !f.allowed);

if (findings.length === 0) {
  console.log(`scrub-check: OK — no matches in ${relative(process.cwd(), target)}`);
  process.exit(0);
}

console.log(`scrub-check: ${findings.length} matches (${unaddressed.length} unaddressed) in ${relative(process.cwd(), target)}\n`);
for (const f of findings) {
  const tag = f.allowed ? '  [allowed]' : '  [UNADDRESSED]';
  console.log(`${tag} ${f.file}:${f.line} — /${f.pattern}/ → "${f.match}" (${f.category})`);
}

process.exit(unaddressed.length === 0 ? 0 : 1);
