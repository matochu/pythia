#!/usr/bin/env node
/**
 * Manage inputs: frontmatter in workflow docs.
 *
 * Usage:
 *   node .pythia/runtime/inputs.js check <file.md>
 *   node .pythia/runtime/inputs.js update <file.md>
 *   node .pythia/runtime/inputs.js add <file.md> <dep> [<dep>...]
 *   node .pythia/runtime/inputs.js stamp <file.md>
 * Exit: 0 = ok, 1 = error, 2 = usage error
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

function usage() {
  console.error('Usage:\n  node .pythia/runtime/inputs.js check <file.md>\n  node .pythia/runtime/inputs.js update <file.md>\n  node .pythia/runtime/inputs.js add <file.md> <dep> [<dep>...]\n  node .pythia/runtime/inputs.js stamp <file.md>');
}

function die(msg, code = 2) {
  console.error(msg);
  process.exit(code);
}

function hashFile(path) {
  const content = readFileSync(path);
  return createHash('sha256').update(content).digest('hex').slice(0, 8);
}

function repoRoot() {
  const r = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' });
  if (r.status !== 0) die('not inside a Git worktree', 2);
  return r.stdout.trim();
}

function hasFrontmatter(content) {
  return content.startsWith('---\n');
}

function extractFrontmatter(content) {
  if (!hasFrontmatter(content)) return null;
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) return null;
  return content.slice(4, end);
}

function parseInputs(fmContent) {
  if (!fmContent) return null;
  const lines = fmContent.split('\n');
  const start = lines.findIndex((l) => l === 'inputs:');
  if (start === -1) return null;
  const entries = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (!lines[i].startsWith('  - ')) break;
    entries.push(lines[i].slice(4));
  }
  return entries;
}

function validateEntry(entry) {
  return /^[^/\s][^\s]*:[0-9a-f]{8}$/.test(entry) && !entry.startsWith('/');
}

function rewriteInputs(file, entries) {
  const content = readFileSync(file, 'utf8');
  const fmEnd = content.indexOf('\n---\n', 4);
  if (fmEnd === -1) die(`frontmatter close marker not found in ${file}`, 2);

  const fm = content.slice(4, fmEnd);
  const fmLines = fm.split('\n');

  // Remove existing inputs block
  const inputsStart = fmLines.findIndex((l) => l === 'inputs:');
  let filteredLines;
  if (inputsStart === -1) {
    filteredLines = [...fmLines];
  } else {
    filteredLines = fmLines.slice(0, inputsStart);
    let i = inputsStart + 1;
    while (i < fmLines.length && fmLines[i].startsWith('  - ')) i++;
    filteredLines = filteredLines.concat(fmLines.slice(i));
  }

  // Inject new inputs block
  const inputsBlock = ['inputs:', ...entries.map((e) => `  - ${e}`)];
  const newFm = [...inputsBlock, ...filteredLines].join('\n');
  const rest = content.slice(fmEnd);
  writeFileSync(file, `---\n${newFm}${rest}`, 'utf8');
}

// ── commands ──────────────────────────────────────────────────────────────────

function cmdCheck(file) {
  const content = readFileSync(file, 'utf8');
  const fm = extractFrontmatter(content);
  if (!fm) { console.log('no inputs declared'); return 0; }
  const entries = parseInputs(fm);
  if (!entries) { console.log('no inputs declared'); return 0; }

  let failed = 0;
  for (const entry of entries) {
    if (!validateEntry(entry)) { console.log(`! ${entry} — INVALID`); failed = 1; continue; }
    const [path, stored] = [entry.slice(0, entry.lastIndexOf(':')), entry.slice(entry.lastIndexOf(':') + 1)];
    if (!existsSync(path)) { console.log(`! ${path} — MISSING`); failed = 1; continue; }
    const current = hashFile(path);
    if (current === stored) console.log(`✓ ${path} (${stored})`);
    else { console.log(`✗ ${path} — STALE (stored: ${stored}, current: ${current})`); failed = 1; }
  }
  return failed;
}

function cmdUpdate(file) {
  const content = readFileSync(file, 'utf8');
  const fm = extractFrontmatter(content);
  if (!fm) { console.log('no inputs declared'); return 0; }
  const entries = parseInputs(fm);
  if (!entries) { console.log('no inputs declared'); return 0; }

  const updated = [];
  for (const entry of entries) {
    if (!validateEntry(entry)) die(`! ${entry} — INVALID`, 1);
    const path = entry.slice(0, entry.lastIndexOf(':'));
    if (!existsSync(path)) die(`! ${path} — MISSING`, 1);
    updated.push(`${path}:${hashFile(path)}`);
  }
  rewriteInputs(file, updated);
  return 0;
}

function cmdAdd(file, deps) {
  const content = readFileSync(file, 'utf8');
  if (!hasFrontmatter(content)) die(`frontmatter required for add: ${file}`, 2);
  const fm = extractFrontmatter(content);

  const existing = (fm && parseInputs(fm)) ?? [];
  const map = new Map();
  for (const e of existing) {
    const path = e.slice(0, e.lastIndexOf(':'));
    map.set(path, e);
  }
  for (const dep of deps) {
    if (dep.startsWith('/')) die(`dependency path must be repo-relative: ${dep}`, 2);
    if (!existsSync(dep)) die(`dependency file not found: ${dep}`, 2);
    map.set(dep, `${dep}:${hashFile(dep)}`);
  }
  rewriteInputs(file, [...map.values()]);
  return 0;
}

function cmdStamp(file) {
  const content = readFileSync(file, 'utf8');
  if (!hasFrontmatter(content)) die(`frontmatter required for stamp: ${file}`, 2);
  const fm = extractFrontmatter(content);
  const entries = fm && parseInputs(fm);
  if (!entries) { console.log('no inputs declared'); return 0; }

  const updated = [];
  for (const entry of entries) {
    if (validateEntry(entry)) { updated.push(entry); continue; }
    const path = entry;
    if (path.startsWith('/')) die(`dependency path must be repo-relative: ${path}`, 2);
    if (!existsSync(path)) die(`dependency file not found: ${path}`, 2);
    updated.push(`${path}:${hashFile(path)}`);
  }
  rewriteInputs(file, updated);
  return 0;
}

// ── main ──────────────────────────────────────────────────────────────────────

const [cmd, file, ...rest] = process.argv.slice(2);

if (!cmd || !file) { usage(); process.exit(2); }
if (!existsSync(file)) die(`target file not found: ${file}`, 2);

const root = repoRoot();
process.chdir(root);

let code = 0;
switch (cmd) {
  case 'check':  code = cmdCheck(file); break;
  case 'update': code = cmdUpdate(file); break;
  case 'add':    code = cmdAdd(file, rest); break;
  case 'stamp':  code = cmdStamp(file); break;
  default: usage(); process.exit(2);
}
process.exit(code);
