#!/usr/bin/env node
/**
 * Manage workflow doc freshness via ## References / ## Used by blocks.
 *
 * Usage:
 *   node tools/bin/inputs.js check <file.md>
 *   node tools/bin/inputs.js check --all [glob]
 *   node tools/bin/inputs.js sync <file.md>
 *   node tools/bin/inputs.js rdeps <file.md>
 * Exit: 0 = ok, 1 = stale/error, 2 = usage error
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { relative, resolve, join, sep, dirname } from 'node:path';
import { extractRelativeLinks, resolveLink } from './md.js';
import { projectRoot as findProjectRoot, normalizePath } from './repo-root.js';
import {
  parseTrailingRefs,
  writeTrailingRefs,
  kindForPath,
  splitHashFragment,
  getBodyContent,
  docRelativePath,
  resolveDocLink,
  renderTrailingRegion,
  isPythiaSyncMarkdownRelPath,
  repoOrDocRelativePath,
  usedByLinksToConsumer,
} from './refs.js';

const HASH_LEN = 5;
const LEGACY_HASH_LEN = 8;

function usage() {
  console.error(`Usage:
  node tools/bin/inputs.js check <file.md>
  node tools/bin/inputs.js check --all [glob]
  node tools/bin/inputs.js sync <file.md>
  node tools/bin/inputs.js rdeps <file.md>`);
}

export function die(msg, code = 2) {
  console.error(msg);
  process.exit(code);
}

export function hashFile(path, len = HASH_LEN) {
  const raw = readFileSync(path, 'utf8');
  const content = path.endsWith('.md') ? getBodyContent(raw) : raw;
  return createHash('sha256').update(content).digest('hex').slice(0, len);
}

export function repoRoot(startPath = process.cwd()) {
  try {
    return findProjectRoot(startPath);
  } catch (err) {
    die(err?.message || 'not inside a pythia project', 2);
  }
}

function samePath(a, b) {
  return normalizePath(a) === normalizePath(b);
}

function isUnderRoot(absPath, root) {
  const rel = relative(normalizePath(root), normalizePath(absPath));
  return rel !== '..' && !rel.startsWith(`..${sep}`) && !rel.startsWith('..');
}

function workflowRelPath(file, root) {
  return relative(normalizePath(root), normalizePath(resolve(file))).replace(/\\/g, '/');
}

function isPythiaSyncMarkdownFile(file, root) {
  return isPythiaSyncMarkdownRelPath(workflowRelPath(file, root));
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

function stripFrontmatterInputs(file) {
  const content = readFileSync(file, 'utf8');
  if (!hasFrontmatter(content)) return content;
  const fmEnd = content.indexOf('\n---\n', 4);
  if (fmEnd === -1) return content;

  const fm = content.slice(4, fmEnd);
  const fmLines = fm.split('\n');
  const inputsStart = fmLines.findIndex((l) => l === 'inputs:');
  if (inputsStart === -1) return content;

  const filtered = fmLines.slice(0, inputsStart);
  let i = inputsStart + 1;
  while (i < fmLines.length && fmLines[i].startsWith('  - ')) i++;
  filtered.push(...fmLines.slice(i));
  const newFm = filtered.join('\n');
  const trimmed = newFm.trim();
  const rest = content.slice(fmEnd);
  if (!trimmed) {
    const body = rest.startsWith('\n---\n') ? rest.slice(5) : rest.replace(/^\n/, '');
    writeFileSync(file, body, 'utf8');
    return body;
  }
  const updated = `---\n${newFm}${rest}`;
  writeFileSync(file, updated, 'utf8');
  return updated;
}

function rewriteInputs(file, entries) {
  const content = readFileSync(file, 'utf8');
  const fmEnd = content.indexOf('\n---\n', 4);
  if (fmEnd === -1) die(`frontmatter close marker not found in ${file}`, 2);

  const fm = content.slice(4, fmEnd);
  const fmLines = fm.split('\n');
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

  const inputsBlock = ['inputs:', ...entries.map((e) => `  - ${e}`)];
  const newFm = [...inputsBlock, ...filteredLines].join('\n');
  const rest = content.slice(fmEnd);
  writeFileSync(file, `---\n${newFm}${rest}`, 'utf8');
}

/**
 * @param {string} file
 * @param {{ scope?: 'body'|'refs'|'all' }} opts
 */
export function deriveDeps(file, opts = {}) {
  const scope = opts.scope ?? 'body';
  const content = readFileSync(file, 'utf8');
  const root = opts.root ?? repoRoot(file);

  if (scope === 'refs' || scope === 'all') {
    const parsed = parseTrailingRefs(content);
    if (!parsed) return scope === 'refs' ? [] : deriveDeps(file, { scope: 'body', root });
    const refs = parsed.references.map((r) => ({ path: r.path, hash: r.hash }));
    if (scope === 'refs') return refs;
    const bodyDeps = deriveDeps(file, { scope: 'body', root });
    return [...new Set([...bodyDeps, ...refs.map((r) => r.path)])];
  }

  const body = getBodyContent(content);
  const links = extractRelativeLinks(body, { skipFenced: true });
  const seen = new Set();
  const deps = [];

  for (const link of links) {
    const abs = resolveLink(file, link.href);
    if (!existsSync(abs)) continue;
    try {
      if (statSync(abs).isDirectory()) continue;
    } catch {
      continue;
    }
    if (!isUnderRoot(abs, root)) continue;
    if (samePath(abs, file)) continue;
    const rel = docRelativePath(file, abs);
    if (seen.has(rel)) continue;
    seen.add(rel);
    deps.push(rel);
  }

  return deps.sort();
}

function removeBodyDuplicateListItems(file, bodyContent, refPaths, root) {
  const refKeys = new Set(refPaths.map(depMapKey));
  const lines = bodyContent.split('\n');
  let inFence = false;
  const out = [];

  for (const line of lines) {
    if (line.startsWith('```')) {
      inFence = !inFence;
      out.push(line);
      continue;
    }
    if (inFence) {
      out.push(line);
      continue;
    }
    const m = line.match(/^\s*-\s+\[([^\]]*)\]\(([^)]+)\)\s*$/);
    if (m) {
      const { path } = splitHashFragment(m[2]);
      const abs = resolveDocLink(file, path, root);
      if (abs) {
        const canonical = repoOrDocRelativePath(file, abs, root);
        if (refKeys.has(depMapKey(canonical))) continue;
        const docRel = docRelativePath(file, abs);
        if (refKeys.has(depMapKey(docRel))) continue;
      }
    }
    out.push(line);
  }

  return out.join('\n');
}

function addUsedByBacklink(targetFile, sourceFile, sourceBaseName) {
  if (!existsSync(targetFile)) return;
  const root = repoRoot(targetFile);
  if (!isPythiaSyncMarkdownFile(targetFile, root)) return;
  const content = readFileSync(targetFile, 'utf8');
  const rel = repoOrDocRelativePath(targetFile, sourceFile, root);
  const kind = kindForPath(rel, { targetAbs: sourceFile, root });
  const text = sourceBaseName.replace(/\.(plan|context|implementation|review|audit)\.md$/, '').replace(/\.md$/, '');

  const parsed = parseTrailingRefs(content);
  const usedBy = parsed?.usedBy ?? [];
  if (usedByLinksToConsumer(usedBy, targetFile, sourceFile, root)) return;

  usedBy.push({ kind, text, path: rel });
  const refs = parsed?.references ?? [];
  writeTrailingRefs(targetFile, { references: refs, usedBy });
}

function removeUsedByBacklink(targetFile, sourceFile) {
  if (!existsSync(targetFile)) return;
  const root = repoRoot(targetFile);
  if (!isPythiaSyncMarkdownFile(targetFile, root)) return;
  const content = readFileSync(targetFile, 'utf8');
  const parsed = parseTrailingRefs(content);
  if (!parsed) return;

  const usedBy = parsed.usedBy.filter(
    (u) => !usedByLinksToConsumer([u], targetFile, sourceFile, root),
  );
  writeTrailingRefs(targetFile, { references: parsed.references, usedBy });
}

const PYTHIA_SYNC_SKIP_DIRS = new Set(['runtime', 'backups', '.git', 'node_modules']);

function collectMarkdownFiles(dir, acc = [], { skipDirs = PYTHIA_SYNC_SKIP_DIRS } = {}) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (skipDirs.has(name)) continue;
      collectMarkdownFiles(p, acc, { skipDirs });
    } else if (name.endsWith('.md')) {
      acc.push(p);
    }
  }
  return acc;
}

function depMapKey(relPath) {
  return relPath.replace(/^\.\//, '');
}

/** Normalize body href or stored dep to a comparable repo-root-relative key. */
function canonicalDepKey(file, hrefOrDep, root) {
  const raw = hrefOrDep.split('#')[0].trim();
  if (!raw) return '';
  const abs = resolveDocLink(file, raw, root);
  if (abs) {
    return depMapKey(repoOrDocRelativePath(file, abs, root));
  }
  return depMapKey(raw);
}

function buildBodyDepKeys(file, content, root) {
  const keys = new Set();
  for (const link of extractRelativeLinks(getBodyContent(content), { skipFenced: true })) {
    keys.add(canonicalDepKey(file, link.href, root));
  }
  return keys;
}

function isDepCitedInBody(file, dep, bodyDepKeys, root) {
  return bodyDepKeys.has(canonicalDepKey(file, dep, root));
}

function tryAddSyncDep(map, file, depPath, root) {
  const raw = depPath.split('#')[0].trim();
  if (!raw || /^https?:\/\//.test(raw)) return;

  let abs = resolveDocLink(file, raw, root);
  if (abs && !existsSync(abs)) abs = null;
  if (!abs && !raw.startsWith('/') && existsSync(resolve(root, raw))) {
    abs = resolve(root, raw);
  }
  if (abs) {
    try {
      if (statSync(abs).isDirectory()) return;
    } catch {
      return;
    }
    if (samePath(abs, file)) return;
    if (!isUnderRoot(abs, root)) return;
    const rel = repoOrDocRelativePath(file, abs, root);
    map.set(depMapKey(rel), rel);
    return;
  }

  if (raw.startsWith('/')) return;
  map.set(depMapKey(raw), raw);
}

function collectSyncDeps(file, root, { oldRefs, manualEntries }) {
  const map = new Map();

  for (const dep of deriveDeps(file, { scope: 'body', root })) {
    tryAddSyncDep(map, file, dep, root);
  }
  for (const ref of oldRefs?.references ?? []) {
    tryAddSyncDep(map, file, ref.path, root);
  }
  for (const entry of manualEntries ?? []) {
    const pathPart = entry.includes(':') ? entry.slice(0, entry.lastIndexOf(':')) : entry;
    tryAddSyncDep(map, file, pathPart, root);
  }

  return [...map.values()].sort();
}

export function cmdSync(file, { keepManual: _keepManual = false, root: rootOverride } = {}) {
  const root = rootOverride ?? repoRoot(file);
  if (!isPythiaSyncMarkdownFile(file, root)) {
    console.error(`sync: skipped — not .pythia markdown (runtime excluded): ${workflowRelPath(file, root)}`);
    return 2;
  }

  let content = readFileSync(file, 'utf8');
  const fm = extractFrontmatter(content);
  const manualEntries = fm ? parseInputs(fm) : null;

  const oldRefs = parseTrailingRefs(content);
  const oldHashByPath = new Map(
    (oldRefs?.references ?? []).map((r) => [depMapKey(r.path), r.hash]),
  );
  const preservedUsedBy = oldRefs?.usedBy ?? [];

  const allDeps = collectSyncDeps(file, root, { oldRefs, manualEntries });
  const bodyDepKeys = buildBodyDepKeys(file, content, root);

  let bodyContent = removeBodyDuplicateListItems(file, getBodyContent(content), allDeps, root);
  bodyContent = bodyContent.replace(/\n+$/, '');

  const sourceBase = file.split('/').pop();
  const newDepKeys = new Set(allDeps.map(depMapKey));

  const oldDepKeys = new Set((oldRefs?.references ?? []).map((r) => depMapKey(r.path)));
  for (const oldKey of oldDepKeys) {
    if (!newDepKeys.has(oldKey)) {
      const oldDep = (oldRefs?.references ?? []).find((r) => depMapKey(r.path) === oldKey)?.path;
      if (oldDep) {
        const targetAbs = resolveDocLink(file, oldDep, root);
        if (targetAbs) removeUsedByBacklink(targetAbs, file);
      }
    }
  }

  for (const dep of allDeps) {
    const targetAbs = resolveDocLink(file, dep, root);
    if (targetAbs) addUsedByBacklink(targetAbs, file, sourceBase);
  }

  const references = [];
  let changed = 0;
  const changedPaths = [];

  for (const dep of allDeps) {
    const abs = resolveDocLink(file, dep, root);
    const text = dep.split('/').pop().replace(/\.md$/, '');
    const kindTarget = abs ?? resolveDocLink(file, dep, root);
    const kind = kindForPath(dep, { targetAbs: kindTarget ?? undefined, root });
    if (!abs || !existsSync(abs)) {
      console.warn(`sync: missing target ${dep}`);
      const oldRef = (oldRefs?.references ?? []).find((r) => depMapKey(r.path) === depMapKey(dep));
      if (isDepCitedInBody(file, dep, bodyDepKeys, root)) {
        references.push({
          kind,
          text,
          path: dep,
          hash: oldRef?.hash ?? null,
        });
      }
      continue;
    }
    let hash = hashFile(abs);
    const oldHash = oldHashByPath.get(depMapKey(dep));
    if (oldHash && oldHash !== hash) {
      changed++;
      changedPaths.push(dep);
    } else if (!oldHash) {
      changed++;
      changedPaths.push(dep);
    }
    references.push({ kind, text, path: dep, hash });
  }

  const regionStr = renderTrailingRegion({ references, usedBy: preservedUsedBy });
  const out = regionStr
    ? (bodyContent ? `${bodyContent}\n\n${regionStr}` : regionStr)
    : bodyContent;
  writeFileSync(file, out, 'utf8');

  if (manualEntries?.length) {
    stripFrontmatterInputs(file);
  }

  console.log(
    `sync: ${references.length} deps, ${changed} changed since last sync${changedPaths.length ? `: ${changedPaths.join(', ')}` : ''}`,
  );
  return 0;
}

function checkLegacyFrontmatter(file, fm, { verbose = false } = {}) {
  const entries = parseInputs(fm);
  if (!entries?.length) {
    if (verbose) console.log('no inputs declared');
    return { status: 'skip', stale: 0, invalid: 0 };
  }
  let stale = 0;
  let invalid = 0;
  for (const entry of entries) {
    if (!validateEntry(entry)) {
      console.log(`! ${entry} — INVALID`);
      invalid++;
      continue;
    }
    const path = entry.slice(0, entry.lastIndexOf(':'));
    const stored = entry.slice(entry.lastIndexOf(':') + 1);
    if (!existsSync(path)) {
      console.log(`! ${path} — MISSING`);
      invalid++;
      continue;
    }
    const current = hashFile(path, LEGACY_HASH_LEN);
    if (current === stored) console.log(`✓ ${path} (${stored})`);
    else {
      console.log(`✗ ${path} — STALE (stored: ${stored}, current: ${current})`);
      stale++;
    }
  }
  return { status: stale || invalid ? 'fail' : 'ok', stale, invalid };
}

function checkOneFile(file, { verbose = false, root: rootOverride } = {}) {
  const root = rootOverride ?? repoRoot(file);
  const content = readFileSync(file, 'utf8');
  const parsed = parseTrailingRefs(content);

  if (!parsed) {
    const fm = extractFrontmatter(content);
    if (fm && parseInputs(fm)) {
      return checkLegacyFrontmatter(file, fm, { verbose });
    }
    if (verbose) console.log(`SKIP (no ## References) ${file}`);
    return { status: 'skip', stale: 0, invalid: 0 };
  }

  let stale = 0;
  let invalid = 0;

  for (const ref of parsed.references) {
    const abs = resolveDocLink(file, ref.path, root);
    if (!abs || !existsSync(abs)) {
      console.log(`! ${ref.path} — MISSING`);
      invalid++;
      continue;
    }
    if (!ref.hash) {
      console.log(`! ${ref.path} — MISSING hash`);
      invalid++;
      continue;
    }
    const current = hashFile(abs);
    if (current === ref.hash) {
      console.log(`✓ ${ref.path} (${ref.hash})`);
    } else {
      console.log(`✗ ${ref.path} — STALE (stored: ${ref.hash}, current: ${current})`);
      stale++;
    }
  }

  return { status: stale || invalid ? 'fail' : 'ok', stale, invalid };
}

export function cmdCheck(file, { all = false, glob = '.pythia' } = {}) {
  if (all) return cmdCheckAll(glob);

  const result = checkOneFile(file, { verbose: true });
  if (result.status === 'skip') return 0;
  if (result.invalid > 0 || result.stale > 0) return 1;
  const content = readFileSync(file, 'utf8');
  if (result.status === 'ok' && !parseTrailingRefs(content) && !extractFrontmatter(content)) {
    console.log('no inputs declared');
  }
  return 0;
}

export function cmdCheckAll(globPath = '.pythia') {
  const root = repoRoot();
  const searchRoot = resolve(root, globPath);
  const files = collectMarkdownFiles(searchRoot).filter((abs) =>
    isPythiaSyncMarkdownRelPath(relative(root, abs).replace(/\\/g, '/')),
  );
  let totalStale = 0;
  let staleFiles = 0;

  for (const f of files) {
    const rel = relative(root, f);
    const result = checkOneFile(f);
    if (result.status === 'fail') {
      console.log(`✗ ${rel} — ${result.stale} STALE, ${result.invalid} INVALID`);
      totalStale += result.stale + result.invalid;
      staleFiles++;
    }
  }

  if (staleFiles === 0) {
    console.log('all fresh');
    return 0;
  }
  console.log(`${staleFiles} stale artifacts found`);
  return 1;
}

export function cmdRdeps(file) {
  if (!existsSync(file)) die(`target file not found: ${file}`, 2);
  const root = repoRoot(file);
  const targetAbs = normalizePath(file);
  const currentHash = hashFile(file);
  const dependents = new Map();

  const cached = parseTrailingRefs(readFileSync(file, 'utf8'));
  if (cached?.usedBy) {
    for (const u of cached.usedBy) {
      const docPath = resolveDocLink(file, u.path, root);
      if (!docPath || !existsSync(docPath)) continue;
      const rel = relative(root, docPath);
      dependents.set(rel, { path: rel, source: 'cache' });
    }
  }

  const allMd = collectMarkdownFiles(resolve(root, '.pythia')).filter((abs) =>
    isPythiaSyncMarkdownRelPath(relative(root, abs).replace(/\\/g, '/')),
  );
  for (const doc of allMd) {
    const parsed = parseTrailingRefs(readFileSync(doc, 'utf8'));
    if (!parsed) continue;
    for (const ref of parsed.references) {
      const abs = resolveDocLink(doc, ref.path, root);
      if (abs && samePath(abs, targetAbs)) {
        dependents.set(relative(root, doc), {
          path: relative(root, doc),
          storedHash: ref.hash,
          source: 'scan',
        });
      }
    }
  }

  if (dependents.size === 0) {
    console.log('no dependents');
    return 0;
  }

  let staleCount = 0;
  for (const [, info] of dependents) {
    const docPath = normalizePath(resolve(root, info.path));
    if (!existsSync(docPath)) continue;
    const parsed = parseTrailingRefs(readFileSync(docPath, 'utf8'));
    const ref = parsed?.references.find((r) => {
      const abs = resolveDocLink(docPath, r.path, root);
      return abs && samePath(abs, targetAbs);
    });
    const stored = ref?.hash ?? info.storedHash;
    if (stored === currentHash) {
      console.log(`✓ ${info.path} — FRESH`);
    } else {
      console.log(`✗ ${info.path} — STALE (stored #${stored ?? '?'}, current #${currentHash})`);
      staleCount++;
    }
  }

  if (staleCount) {
    console.log(`${staleCount} stale dependent${ staleCount === 1 ? '' : 's' } repo-wide`);
    return 1;
  }
  return 0;
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
    updated.push(`${path}:${hashFile(path, LEGACY_HASH_LEN)}`);
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
    map.set(dep, `${dep}:${hashFile(dep, LEGACY_HASH_LEN)}`);
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
    updated.push(`${path}:${hashFile(path, LEGACY_HASH_LEN)}`);
  }
  rewriteInputs(file, updated);
  return 0;
}

function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (cmd === 'check' && args[1] === '--all') {
    const root = repoRoot();
    process.chdir(root);
    process.exit(cmdCheckAll(args[2] ?? '.pythia'));
  }

  const file = args[1];
  if (!cmd || (cmd !== 'check' && !file)) { usage(); process.exit(2); }
  if (file && !existsSync(file)) die(`target file not found: ${file}`, 2);

  const root = file ? repoRoot(file) : repoRoot();
  process.chdir(root);

  const keepManual = args.includes('--keep-manual');
  let code = 0;

  switch (cmd) {
    case 'check': code = cmdCheck(file); break;
    case 'sync': code = cmdSync(file, { keepManual }); break;
    case 'rdeps': code = cmdRdeps(file); break;
    case 'update': code = cmdUpdate(file); break;
    case 'add': code = cmdAdd(file, args.slice(2)); break;
    case 'stamp': code = cmdStamp(file); break;
    default: usage(); process.exit(2);
  }
  process.exit(code);
}

/**
 * Workspace migration: legacy frontmatter `inputs:` → ## References via sync.
 * Idempotent — skips docs that already have ## References and no legacy inputs.
 */
export function migrateWorkflowInputs(targetRoot, { dryRun = false, globRoot = '.pythia' } = {}) {
  const pythiaDir = resolve(targetRoot, globRoot);
  if (!existsSync(pythiaDir)) {
    return { status: 'skipped', reason: 'pythia dir missing', changedPaths: [] };
  }

  const files = collectMarkdownFiles(pythiaDir).filter((abs) =>
    isPythiaSyncMarkdownRelPath(relative(targetRoot, abs).replace(/\\/g, '/')),
  );
  const changedPaths = [];
  let touched = 0;
  const maxPasses = 5;

  for (let pass = 0; pass < maxPasses; pass++) {
    let passChanged = 0;
    for (const abs of files) {
      const content = readFileSync(abs, 'utf8');
      const fm = extractFrontmatter(content);
      const legacyInputs = fm ? parseInputs(fm) : null;
      const hasLegacy = Boolean(legacyInputs?.length);
      const parsed = parseTrailingRefs(content);
      const bodyLinks = extractRelativeLinks(getBodyContent(content), { skipFenced: true });
      const emptyShell =
        parsed
        && parsed.references.length === 0
        && parsed.usedBy.length === 0
        && content.includes('## References');
      const hasRefs = Boolean(parsed?.references?.length);
      const hasBodyLinks = bodyLinks.length > 0;

      if (!hasLegacy && !emptyShell && !hasBodyLinks && !hasRefs) continue;

      const rel = relative(targetRoot, abs);
      if (dryRun) {
        if (!changedPaths.includes(rel)) {
          changedPaths.push(rel);
          touched++;
        }
        continue;
      }

      const before = readFileSync(abs, 'utf8');
      cmdSync(abs, { root: targetRoot });
      const after = readFileSync(abs, 'utf8');
      if (before !== after) {
        passChanged++;
        if (!changedPaths.includes(rel)) {
          changedPaths.push(rel);
          touched++;
        }
      }
    }
    if (!dryRun && passChanged === 0) break;
  }

  if (touched === 0) {
    return { status: 'skipped', reason: 'no workflow docs need inputs migration', changedPaths: [] };
  }
  return { status: 'applied', changedPaths };
}

export { main };
