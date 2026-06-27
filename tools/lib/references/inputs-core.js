#!/usr/bin/env node
/**
 * Manage workflow doc freshness via ## References / ## Used by blocks.
 *
 * Usage:
 *   node tools/bin/inputs.js check <file.md>
 *   node tools/bin/inputs.js check --all [glob]
 *   node tools/bin/inputs.js sync <file.md> [--verbose] [--dry-run]
 *   node tools/bin/inputs.js rdeps <file.md>
 * Exit: 0 = ok, 1 = stale/error, 2 = usage error
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { relative, resolve, join, sep, dirname, basename } from 'node:path';
import { extractRelativeLinks, resolveLink, markdownTitleFromContent, extractBacktickPaths } from '../md.js';
import { parseLinkFragment } from './fragment.js';
import { loadRelations } from './relation-types.js';
import { projectRoot as findProjectRoot, normalizePath } from '../repo-root.js';
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
  isExternalBibliographyHref,
  normalizeBibliographyPath,
  defaultRefText,
  repoOrDocRelativePath,
  usedByLinksToConsumer,
  extractBibliographyFromTrail,
  EXTERNAL_REF_KIND,
} from './refs.js';

const HASH_LEN = 5;
const LEGACY_HASH_LEN = 8;

function usage() {
  console.error(`Usage:
  node tools/bin/inputs.js check <file.md>
  node tools/bin/inputs.js check --all [glob]
  node tools/bin/inputs.js sync <file.md> [--verbose] [--dry-run]
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
    throw err;
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

function stripFrontmatterInputs(file, { dryRun = false } = {}) {
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
    if (!dryRun) writeFileSync(file, body, 'utf8');
    return body;
  }
  const updated = `---\n${newFm}${rest}`;
  if (!dryRun) writeFileSync(file, updated, 'utf8');
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

/** True when a standalone body list link looks like a bare filename stub (plan auto-dedupe). */
function isBareFilenameListLink(text, href) {
  const { path } = splitHashFragment(href);
  const base = path.split('/').pop() ?? '';
  const stem = base.replace(/\.md$/, '');
  return text === base || text === stem;
}

/**
 * Keep in-body bibliography lists (Pre-Search Summary, ## Contexts, etc.).
 * Strip only bare `- [dep](./dep.md)` stubs under H1 when the same dep is in References.
 */
function shouldPreserveBodyListCitation(text, href, prevSubstantiveLine) {
  if (prevSubstantiveLine?.startsWith('- ')) return true;
  if (prevSubstantiveLine && !prevSubstantiveLine.startsWith('- ')) {
    const isH1Only = prevSubstantiveLine.startsWith('#') && !prevSubstantiveLine.startsWith('## ');
    if (!isH1Only) return true;
  }
  return !isBareFilenameListLink(text, href);
}

function removeBodyDuplicateListItems(file, bodyContent, refPaths, root) {
  const refKeys = new Set(refPaths.map((p) => canonicalDepKey(file, p, root)));
  const lines = bodyContent.split('\n');
  let inFence = false;
  const out = [];
  let prevSubstantiveLine = '';

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
      const depKey = canonicalDepKey(file, path, root);
      if (refKeys.has(depKey)) {
        if (shouldPreserveBodyListCitation(m[1], m[2], prevSubstantiveLine)) {
          out.push(line);
        }
        if (line.trim()) prevSubstantiveLine = line;
        continue;
      }
    }
    if (line.trim()) prevSubstantiveLine = line;
    out.push(line);
  }

  return out.join('\n');
}

function addUsedByBacklink(targetFile, sourceFile, { relType, dryRun = false, dryRunChanges = null } = {}) {
  if (!existsSync(targetFile)) return false;
  const root = repoRoot(targetFile);
  if (!isPythiaSyncMarkdownFile(targetFile, root)) return false;
  const content = readFileSync(targetFile, 'utf8');
  const rel = repoOrDocRelativePath(targetFile, sourceFile, root);
  const kind = kindForPath(rel, { targetAbs: sourceFile, root });
  const text = consumerDisplayName(sourceFile, root);
  const reverseRelType = relType ? (loadRelations(root).reverseOf[relType] ?? relType) : undefined;

  const parsed = parseTrailingRefs(content);
  const usedBy = parsed?.usedBy ?? [];
  const regionTrail = parsed?.regionTrail ?? [];
  const existingIdx = usedBy.findIndex((u) =>
    usedByLinksToConsumer([u], targetFile, sourceFile, root),
  );
  if (existingIdx >= 0) {
    const existing = usedBy[existingIdx];
    const textNeedsUpdate = isAutoPlaceholderRefText(existing.text, existing.path);
    const relTypeChanged = existing.relType !== reverseRelType;
    if (!textNeedsUpdate && !relTypeChanged) {
      if (dryRun) recordDryRunBacklinkNoop(dryRunChanges, workflowRelPath(targetFile, root));
      return false;
    }
    usedBy[existingIdx] = {
      ...existing,
      ...(textNeedsUpdate ? { text } : {}),
      relType: reverseRelType,
    };
    if (dryRun) recordDryRunBacklinkWrite(dryRunChanges, workflowRelPath(targetFile, root));
    else writeTrailingRefs(targetFile, { references: parsed?.references ?? [], usedBy, regionTrail });
    return true;
  }

  usedBy.push({ kind, relType: reverseRelType, text, path: rel });
  const refs = parsed?.references ?? [];
  if (dryRun) recordDryRunBacklinkWrite(dryRunChanges, workflowRelPath(targetFile, root));
  else writeTrailingRefs(targetFile, { references: refs, usedBy, regionTrail });
  return true;
}

function dryRunBacklinkRecord(dryRunChanges, rel) {
  if (!dryRunChanges) return null;
  let record = dryRunChanges.get(rel);
  if (!record) {
    record = { removals: 0, noopExisting: 0, writes: 0 };
    dryRunChanges.set(rel, record);
  }
  return record;
}

function recordDryRunBacklinkRemoval(dryRunChanges, rel, count) {
  const record = dryRunBacklinkRecord(dryRunChanges, rel);
  if (record) record.removals += count;
}

function recordDryRunBacklinkNoop(dryRunChanges, rel) {
  const record = dryRunBacklinkRecord(dryRunChanges, rel);
  if (record) record.noopExisting += 1;
}

function recordDryRunBacklinkWrite(dryRunChanges, rel) {
  const record = dryRunBacklinkRecord(dryRunChanges, rel);
  if (record) record.writes += 1;
}

function dryRunBacklinkChangedFiles(dryRunChanges) {
  if (!dryRunChanges) return [];
  return [...dryRunChanges.entries()]
    .filter(([, record]) => record.writes > 0 || record.removals > record.noopExisting)
    .map(([rel]) => rel);
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

/** H2 sections whose list links are human bibliography, not freshness deps. */
export const BODY_BIBLIOGRAPHY_SECTIONS = new Set([]);

function extractBodySyncLinks(content, { skipFenced = true } = {}) {
  const body = getBodyContent(content);
  const lines = body.split('\n');
  let inBibliographySection = false;
  let inFence = false;
  const links = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (skipFenced && line.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const h2 = line.match(/^## (.+)$/);
    if (h2) {
      inBibliographySection = BODY_BIBLIOGRAPHY_SECTIONS.has(h2[1].trim());
      continue;
    }
    if (inBibliographySection) continue;

    const re = /\[([^\]]*)\]\(([^)]+)\)/g;
    let m;
    while ((m = re.exec(line)) !== null) {
      const rawHref = m[2].trim();
      if (/^mailto:/.test(rawHref)) continue;

      const hashIdx = rawHref.indexOf('#');
      const hrefPath = hashIdx === -1 ? rawHref : rawHref.slice(0, hashIdx).trim();
      const fragment = hashIdx === -1 ? '' : rawHref.slice(hashIdx + 1);
      const { anchor, relType } = parseLinkFragment(fragment);

      if (/^https?:\/\//.test(rawHref)) {
        // External links: only capture when they carry a #@label fragment
        if (relType) {
          links.push({ text: m[1], href: hrefPath, line: i + 1, anchor, relType, external: true });
        }
        continue;
      }

      if (!hrefPath) continue;
      links.push({ text: m[1], href: hrefPath, line: i + 1, anchor, relType: relType || '' });
    }
  }
  return links;
}

export function isWorkflowConsumerFile(file, root) {
  let rel;
  try {
    rel = workflowRelPath(file, root ?? repoRoot(file));
  } catch {
    return false;
  }
  if (!isPythiaSyncMarkdownRelPath(rel)) return false;
  if (/\.(plan|context|review|implementation|audit)\.md$/i.test(rel)) return true;
  // Feature artifacts, tasks, ideas, and other workflow zone docs under .pythia/workflows/
  return rel.startsWith('.pythia/workflows/');
}

/** Plan/context/review/feat docs: hash-tracked freshness. Tasks/ideas: bibliography-tolerant check. */
function isStrictFreshnessConsumer(file) {
  const norm = file.replace(/\\/g, '/');
  if (/\.(plan|context|review|implementation|audit)\.md$/i.test(norm)) return true;
  const base = norm.split('/').pop() ?? '';
  return /^feat-.+\.md$/i.test(base);
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
  for (const link of extractBodySyncLinks(content)) {
    keys.add(canonicalDepKey(file, link.href, root));
  }
  return keys;
}

function buildBodyLinkLabels(file, content, root, oldRefs) {
  const labels = new Map();
  for (const link of extractBodySyncLinks(content)) {
    const key = canonicalDepKey(file, link.href, root);
    const text = link.text?.trim();
    if (text && !isAutoPlaceholderRefText(text, link.href) && !labels.has(key)) {
      labels.set(key, text);
    }
  }
  for (const item of extractBibliographyFromTrail(oldRefs?.regionTrail).internal) {
    const key = canonicalDepKey(file, item.path, root);
    const text = item.text?.trim();
    if (text && !isAutoPlaceholderRefText(text, item.path) && !labels.has(key)) {
      labels.set(key, text);
    }
  }
  for (const ref of oldRefs?.references ?? []) {
    const key = canonicalDepKey(file, ref.path, root);
    const text = ref.text?.trim();
    if (text && !isAutoPlaceholderRefText(text, ref.path) && !labels.has(key)) {
      labels.set(key, text);
    }
  }
  return labels;
}

/** Map from canonicalDepKey → relType for internal body links that carry #@label. */
function buildBodyRelTypeMap(file, content, root) {
  const map = new Map();
  for (const link of extractBodySyncLinks(content)) {
    if (!link.relType || link.external) continue;
    const key = canonicalDepKey(file, link.href, root);
    if (!map.has(key)) map.set(key, link.relType);
  }
  return map;
}

/** External typed links from body: [text](https://...#@label). */
function collectExternalTypedDeps(content) {
  const deps = [];
  for (const link of extractBodySyncLinks(content)) {
    if (!link.external || !link.relType) continue;
    deps.push({ text: link.text, path: link.href, relType: link.relType });
  }
  return deps;
}

function isAutoPlaceholderRefText(text, depPath) {
  if (!text) return true;
  const normalizedText = text.replace(/^\.\//, '').trim();
  const pathPart = depPath.split('#')[0].trim();
  const base = pathPart.split('/').pop() ?? '';
  const stem = base.replace(/\.md$/, '');
  if (normalizedText === base || normalizedText === stem || text === 'SKILL') return true;
  if (base.endsWith('.context.md') && normalizedText === base.slice(0, -'.context.md'.length)) return true;
  if (base.endsWith('.ctx.md') && normalizedText === base.slice(0, -'.ctx.md'.length)) return true;
  if (base.endsWith('.plan.md') && normalizedText === base.slice(0, -'.plan.md'.length)) return true;
  if (base.endsWith('.implementation.md') && normalizedText === base.slice(0, -'.implementation.md'.length)) {
    return true;
  }
  if (base.endsWith('.audit.md') && normalizedText === base.slice(0, -'.audit.md'.length)) return true;
  if (base.endsWith('.review.md') && normalizedText === base.slice(0, -'.review.md'.length)) return true;
  // Path-as-label placeholders: `plans/foo.plan.md`, `reports/bar.implementation.md`
  if (base && (normalizedText === base || normalizedText.endsWith(`/${base}`))) return true;
  if (/^[\w./-]+\.md$/i.test(normalizedText) && base && normalizedText.endsWith(base)) return true;
  return false;
}

function consumerDisplayName(sourceFile, root) {
  if (!existsSync(sourceFile)) return defaultRefText(basename(sourceFile));
  try {
    const title = markdownTitleFromContent(readFileSync(sourceFile, 'utf8'));
    if (title) return title;
  } catch {
    // fall through
  }
  return defaultRefText(relative(resolve(root), resolve(sourceFile)).replace(/\\/g, '/'));
}


/**
 * Build a shared index of ## References for all sync-zone .pythia files.
 * Map: normalizedAbsPath → parseTrailingRefs result.
 * Pass to cmdSync/buildUsedByFromScan to avoid re-reading files in batch contexts.
 */
export function buildRdepsIndex(root) {
  const allMd = collectMarkdownFiles(resolve(root, '.pythia')).filter((abs) =>
    isPythiaSyncMarkdownRelPath(relative(root, abs).replace(/\\/g, '/')),
  );
  const index = new Map();
  for (const doc of allMd) {
    const parsed = parseTrailingRefs(readFileSync(doc, 'utf8'));
    if (parsed) index.set(normalizePath(doc), parsed);
  }
  return index;
}

/**
 * Rebuild the ## Used by list for targetFile from a full rdeps scan of .pythia
 * instead of blindly preserving old cache entries.
 * Phantom entries (hand-written by LLM or stale from deleted consumers) are dropped.
 * Text labels from oldUsedBy are preserved for entries that match by resolved path.
 *
 * @param {Map|null} rdepsIndex - pre-built index from buildRdepsIndex(); if null, built inline.
 *   Pass a shared index in batch contexts (migrateWorkflowInputs) to avoid O(N²) reads.
 */
function buildUsedByFromScan(targetFile, oldUsedBy, root, rdepsIndex = null) {
  const targetAbs = normalizePath(targetFile);

  // Resolve scan entries: use shared index when provided, else build inline (single-file sync)
  let scanEntries;
  if (rdepsIndex) {
    scanEntries = rdepsIndex;
  } else {
    scanEntries = buildRdepsIndex(root);
  }

  // Build a map from normalized consumer abs path → old entry (for label preservation)
  const oldByAbs = new Map();
  for (const u of (oldUsedBy ?? [])) {
    const abs = resolveDocLink(targetFile, u.path, root);
    if (abs) oldByAbs.set(normalizePath(abs), u);
  }

  const result = [];
  for (const [docAbs, docParsed] of scanEntries) {
    if (docAbs === targetAbs) continue;
    const backlinkRef = docParsed.references.find((r) => {
      const abs = resolveDocLink(docAbs, r.path, root);
      return abs && normalizePath(abs) === targetAbs;
    });
    if (!backlinkRef) continue;

    const rel = repoOrDocRelativePath(targetFile, docAbs, root);
    const kind = kindForPath(rel, { targetAbs: docAbs, root });
    const old = oldByAbs.get(docAbs);
    const text = (old && !isAutoPlaceholderRefText(old.text, old.path))
      ? old.text
      : consumerDisplayName(docAbs, root);
    // Carry reverse relType from the forward reference entry
    const forwardRelType = backlinkRef.relType;
    const reverseRelType = forwardRelType
      ? (loadRelations(root).reverseOf[forwardRelType] ?? forwardRelType)
      : undefined;
    result.push({ kind, relType: reverseRelType, text, path: rel });
  }
  return result;
}

function titleForDep(file, dep, root) {
  const abs = resolveDocLink(file, dep, root);
  if (!abs || !existsSync(abs)) return null;
  try {
    if (!abs.endsWith('.md')) return null;
    return markdownTitleFromContent(readFileSync(abs, 'utf8'));
  } catch {
    return null;
  }
}

function refDisplayText(file, dep, root, { oldRef, bodyLinkLabels }) {
  const depKey = canonicalDepKey(file, dep, root);
  const fromBody = bodyLinkLabels.get(depKey);
  if (fromBody && !isAutoPlaceholderRefText(fromBody, dep)) return fromBody;
  if (oldRef?.text && !isAutoPlaceholderRefText(oldRef.text, oldRef.path ?? dep)) {
    return oldRef.text;
  }
  const fromTitle = titleForDep(file, dep, root);
  if (fromTitle) return fromTitle;
  return defaultRefText(dep);
}

function isDepCitedInBody(file, dep, bodyDepKeys, root) {
  return bodyDepKeys.has(canonicalDepKey(file, dep, root));
}

function isTemplateOrPlaceholderPath(hrefOrPath) {
  const raw = hrefOrPath.split('#')[0].trim();
  return /\{[^}]+\}/.test(raw);
}

function looksLikeFileHref(href) {
  const raw = normalizeBibliographyPath(href.split('#')[0].trim());
  if (!raw || isExternalBibliographyHref(raw)) return false;
  if (isTemplateOrPlaceholderPath(raw)) return false;
  // /-absolute project paths are valid file hrefs
  if (raw.startsWith('/')) return true;
  if (
    raw.startsWith('.pythia/')
    || raw.startsWith('skills/')
    || raw.startsWith('.claude/')
    || raw.startsWith('tools/')
    || raw.startsWith('assets/')
    || raw.startsWith('commands/')
    || raw.startsWith('templates/')
  ) {
    return true;
  }
  if (raw.includes('/')) return true;
  return /\.[a-z0-9]{1,12}$/i.test(raw);
}

function tryAddSyncDep(map, file, depPath, root) {
  addSyncDepCandidate(map, file, depPath, root, { includeMissing: false });
}

function addSyncDepCandidate(map, file, depPath, root, { includeMissing = false } = {}) {
  const raw = normalizeBibliographyPath(depPath.split('#')[0].trim());
  if (!raw || isExternalBibliographyHref(raw)) return;
  if (isTemplateOrPlaceholderPath(raw)) return;

  const key = canonicalDepKey(file, raw, root);
  if (map.has(key)) return;

  let abs = resolveDocLink(file, raw, root);
  if (!abs && existsSync(resolve(root, raw))) {
    abs = resolve(root, raw);
  }
  if (abs && existsSync(abs)) {
    if (samePath(abs, file)) return;
    if (!isUnderRoot(abs, root)) return;
    try {
      if (statSync(abs).isDirectory()) return;
    } catch {
      return;
    }
    map.set(key, repoOrDocRelativePath(file, abs, root));
    return;
  }
  if (includeMissing) {
    map.set(key, raw);
  }
}

function isPythiaSyncDepPath(file, depPath, root) {
  const raw = normalizeBibliographyPath(depPath.split('#')[0].trim());
  if (!raw || isExternalBibliographyHref(raw)) return false;
  const abs = resolveDocLink(file, raw, root) ?? (existsSync(resolve(root, raw)) ? resolve(root, raw) : null);
  if (abs) {
    const rel = relative(resolve(root), resolve(abs)).replace(/\\/g, '/');
    return isPythiaSyncMarkdownRelPath(rel);
  }
  return isPythiaSyncMarkdownRelPath(raw.replace(/^\.\//, ''));
}

function collectSyncDeps(file, root, { oldRefs, manualEntries }) {
  const map = new Map();
  const content = readFileSync(file, 'utf8');
  const includeMissingBody = isWorkflowConsumerFile(file, root);

  for (const link of extractBodySyncLinks(content)) {
    if (!looksLikeFileHref(link.href)) continue;
    addSyncDepCandidate(map, file, link.href, root, { includeMissing: includeMissingBody });
  }

  // Backtick-quoted .md paths: resolve doc-relative then root-relative; add when file exists
  const body = getBodyContent(content);
  for (const candidate of extractBacktickPaths(body)) {
    const docRel = resolve(dirname(file), candidate);
    const rootRel = resolve(root, candidate);
    const abs = existsSync(docRel) ? docRel : existsSync(rootRel) ? rootRel : null;
    if (!abs) continue;
    addSyncDepCandidate(map, file, candidate, root, { includeMissing: false });
  }
  for (const ref of oldRefs?.references ?? []) {
    if (isWorkflowConsumerFile(file, root) && isPythiaSyncDepPath(file, ref.path, root)) continue;
    addSyncDepCandidate(map, file, ref.path, root, { includeMissing: true });
  }
  for (const entry of manualEntries ?? []) {
    const pathPart = entry.includes(':') ? entry.slice(0, entry.lastIndexOf(':')) : entry;
    addSyncDepCandidate(map, file, pathPart, root, { includeMissing: includeMissingBody });
  }
  for (const item of extractBibliographyFromTrail(oldRefs?.regionTrail).internal) {
    addSyncDepCandidate(map, file, item.path, root, { includeMissing: true });
  }

  return [...map.values()].sort();
}

function removeUsedByBacklinksForSource(sourceFile, root, { dryRun = false, dryRunChanges = null } = {}) {
  const allMd = collectMarkdownFiles(resolve(root, '.pythia')).filter((abs) =>
    isPythiaSyncMarkdownRelPath(relative(root, abs).replace(/\\/g, '/')),
  );
  for (const targetFile of allMd) {
    if (samePath(targetFile, sourceFile)) continue;
    const content = readFileSync(targetFile, 'utf8');
    const parsed = parseTrailingRefs(content);
    if (!parsed?.usedBy?.length) continue;
    const usedBy = parsed.usedBy.filter(
      (u) => !usedByLinksToConsumer([u], targetFile, sourceFile, root),
    );
    if (usedBy.length === parsed.usedBy.length) continue;
    if (dryRun) recordDryRunBacklinkRemoval(dryRunChanges, workflowRelPath(targetFile, root), parsed.usedBy.length - usedBy.length);
    else {
      writeTrailingRefs(targetFile, {
        references: parsed.references,
        usedBy,
        regionTrail: parsed.regionTrail ?? [],
      });
    }
  }
}

function findOldRef(oldRefs, file, dep, root) {
  const depKey = canonicalDepKey(file, dep, root);
  return (oldRefs?.references ?? []).find(
    (r) => canonicalDepKey(file, r.path, root) === depKey,
  );
}

function findManualHash(manualEntries, file, dep, root) {
  const depKey = canonicalDepKey(file, dep, root);
  for (const entry of manualEntries ?? []) {
    if (!entry.includes(':')) continue;
    const pathPart = entry.slice(0, entry.lastIndexOf(':'));
    if (canonicalDepKey(file, pathPart, root) === depKey) {
      return entry.slice(entry.lastIndexOf(':') + 1);
    }
  }
  return null;
}

function shouldPreserveMissingWorkflowRef(file, dep, root, { oldRefs: _oldRefs, bodyDepKeys, manualEntries }) {
  if (!isWorkflowConsumerFile(file, root)) return false;
  if (findManualHash(manualEntries, file, dep, root)) return true;
  return isDepCitedInBody(file, dep, bodyDepKeys, root);
}

export function cmdSync(file, { keepManual: _keepManual = false, root: rootOverride, verbose = false, rdepsIndex = null, dryRun = false } = {}) {
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
    (oldRefs?.references ?? []).map((r) => [canonicalDepKey(file, r.path, root), r.hash]),
  );
  const trailBibliography = extractBibliographyFromTrail(oldRefs?.regionTrail);
  const preservedRegionTrail = trailBibliography.remainder;

  const allDeps = collectSyncDeps(file, root, { oldRefs, manualEntries });
  const bodyDepKeys = buildBodyDepKeys(file, content, root);
  const bodyLinkLabels = buildBodyLinkLabels(file, content, root, oldRefs);
  const bodyRelTypes = buildBodyRelTypeMap(file, content, root);
  const externalTypedDeps = collectExternalTypedDeps(content);

  let bodyContent = removeBodyDuplicateListItems(file, getBodyContent(content), allDeps, root);
  bodyContent = bodyContent.replace(/\n+$/, '');

  const dryRunBacklinks = new Map();
  removeUsedByBacklinksForSource(file, root, { dryRun, dryRunChanges: dryRunBacklinks });

  for (const dep of allDeps) {
    const targetAbs = resolveDocLink(file, dep, root);
    if (targetAbs) {
      const depRelType = bodyRelTypes.get(canonicalDepKey(file, dep, root));
      addUsedByBacklink(targetAbs, file, { relType: depRelType, dryRun, dryRunChanges: dryRunBacklinks });
    }
  }

  const references = [];
  let changed = 0;
  const changedPaths = [];

  for (const dep of allDeps) {
    const abs = resolveDocLink(file, dep, root);
    const kindTarget = abs ?? resolveDocLink(file, dep, root);
    const kind = kindForPath(dep, { targetAbs: kindTarget ?? undefined, root });
    const oldRef = findOldRef(oldRefs, file, dep, root);
    const text = refDisplayText(file, dep, root, { oldRef, bodyLinkLabels });
    const relType = bodyRelTypes.get(canonicalDepKey(file, dep, root)) || undefined;
    if (!abs || !existsSync(abs)) {
      const storedPath = oldRef?.path ?? dep;
      if (isExternalBibliographyHref(storedPath)) {
        references.push({ kind: EXTERNAL_REF_KIND, relType, text, path: storedPath, hash: null });
        continue;
      }
      if (shouldPreserveMissingWorkflowRef(file, dep, root, { oldRefs, bodyDepKeys, manualEntries })) {
        references.push({
          kind,
          relType,
          text,
          path: storedPath,
          hash: oldRef?.hash ?? oldHashByPath.get(canonicalDepKey(file, dep, root)) ?? findManualHash(manualEntries, file, dep, root) ?? null,
        });
        continue;
      }
      if (verbose) console.warn(`sync: dropped missing target ${dep}`);
      continue;
    }
    let hash = hashFile(abs);
    const oldHash = oldHashByPath.get(canonicalDepKey(file, dep, root));
    if (oldHash && oldHash !== hash) {
      changed++;
      changedPaths.push(dep);
    } else if (!oldHash) {
      changed++;
      changedPaths.push(dep);
    }
    references.push({ kind, relType, text, path: dep, hash });
  }

  const emittedKeys = new Set(references.map((r) => canonicalDepKey(file, r.path, root)));
  for (const ref of oldRefs?.references ?? []) {
    const key = canonicalDepKey(file, ref.path, root);
    if (emittedKeys.has(key)) continue;
    if (isTemplateOrPlaceholderPath(ref.path)) continue;
    if (!isExternalBibliographyHref(ref.path)) continue;
    references.push({ ...ref, kind: EXTERNAL_REF_KIND });
    emittedKeys.add(key);
  }
  for (const ext of trailBibliography.external) {
    const key = canonicalDepKey(file, ext.path, root);
    if (emittedKeys.has(key)) continue;
    references.push({ kind: EXTERNAL_REF_KIND, text: ext.text, path: ext.path, hash: null });
    emittedKeys.add(key);
  }
  // External typed deps from body (#@label on https links)
  for (const ext of externalTypedDeps) {
    const key = canonicalDepKey(file, ext.path, root);
    if (emittedKeys.has(key)) continue;
    references.push({ kind: EXTERNAL_REF_KIND, relType: ext.relType, text: ext.text, path: ext.path, hash: null });
    emittedKeys.add(key);
  }

  const refreshedUsedBy = buildUsedByFromScan(file, oldRefs?.usedBy ?? [], root, rdepsIndex);

  const regionStr = renderTrailingRegion({
    references,
    usedBy: refreshedUsedBy,
    regionTrail: preservedRegionTrail,
  });
  const out = regionStr
    ? (bodyContent ? `${bodyContent}\n\n${regionStr}` : regionStr)
    : bodyContent;
  if (dryRun) {
    const targetChanged = out !== content;
    const frontmatterWillStrip = Boolean(manualEntries?.length);
    const rel = workflowRelPath(file, root);
    const changedBacklinks = dryRunBacklinkChangedFiles(dryRunBacklinks);
    if (!targetChanged && !frontmatterWillStrip && changedBacklinks.length === 0) {
      console.log(`[dry-run] ${rel} — no changes`);
    } else {
      console.log(`[dry-run] ${rel}`);
      console.log(`  ## References: ${references.length} entries${changed ? ` (${changed} changed/new)` : ''}`);
      if (frontmatterWillStrip) console.log('  frontmatter: inputs: block would be stripped');
      for (const backlink of changedBacklinks.sort()) {
        console.log(`  ## Used by: ${backlink} would change`);
      }
    }
  } else {
    writeFileSync(file, out, 'utf8');
  }

  if (manualEntries?.length) {
    stripFrontmatterInputs(file, { dryRun });
  }

  if (verbose) {
    console.log(
      `sync: ${references.length} deps, ${changed} changed since last sync${changedPaths.length ? `: ${changedPaths.join(', ')}` : ''}`,
    );
  }
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
    if (isExternalBibliographyHref(ref.path)) {
      if (verbose) console.log(`~ ${ref.path} — EXTERNAL`);
      continue;
    }
    const abs = resolveDocLink(file, ref.path, root);
    if (!abs || !existsSync(abs)) {
      if (!ref.hash || !isStrictFreshnessConsumer(file)) {
        if (verbose) console.log(`~ ${ref.path} — MISSING (bibliography)`);
        continue;
      }
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
  const verbose = args.includes('--verbose');
  const dryRun = args.includes('--dry-run');
  let code = 0;

  switch (cmd) {
    case 'check': code = cmdCheck(file); break;
    case 'sync': code = cmdSync(file, { keepManual, verbose, dryRun }); break;
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
export function migrateWorkflowInputs(targetRoot, { dryRun = false, globRoot = '.pythia', verbose = false } = {}) {
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
    // Build rdeps index once per pass (files may change between passes).
    // Shared across all cmdSync calls in this pass → O(N) reads per pass, not O(N²).
    const rdepsIndex = dryRun ? null : buildRdepsIndex(targetRoot);
    let passChanged = 0;
    for (const abs of files) {
      const content = readFileSync(abs, 'utf8');
      const fm = extractFrontmatter(content);
      const legacyInputs = fm ? parseInputs(fm) : null;
      const hasLegacy = Boolean(legacyInputs?.length);
      const parsed = parseTrailingRefs(content);
      const emptyShell =
        parsed
        && parsed.references.length === 0
        && parsed.usedBy.length === 0
        && !(parsed.regionTrail?.length)
        && content.includes('## References');
      const bodyLinks = extractRelativeLinks(getBodyContent(content), { skipFenced: true });
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
      cmdSync(abs, { root: targetRoot, verbose, rdepsIndex });
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
