#!/usr/bin/env node
/**
 * Checker: refs-owned — verify that ## References and ## Used by in sync-zone
 * .pythia/**\/*.md files contain only entries that inputs.js sync would emit.
 *
 * Fail codes:
 *   refs-owned.phantom_used_by    — ## Used by entry not backed by rdeps scan
 *   refs-owned.phantom_reference  — ## References entry for a sync-zone file not cited in body
 *
 * Usage: node .pythia/runtime/checks/refs-owned.js <file.md>
 * Exit: 0 = ok (or file not in sync zone), 1 = phantom entries found, 2 = usage/io error
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';
import { parseTrailingRefs, isPythiaSyncMarkdownRelPath, resolveDocLink } from '../lib/references/refs.js';
import { BODY_BIBLIOGRAPHY_SECTIONS } from '../lib/references/inputs-core.js';
import { extractBacktickPaths } from '../lib/md.js';
import { isKnownRelation } from '../lib/references/relation-types.js';
import { normalizePath, repoRoot } from '../lib/repo-root.js';

const [file] = process.argv.slice(2);
if (!file) {
  console.error('Usage: node .pythia/runtime/checks/refs-owned.js <file.md>');
  process.exit(2);
}
if (!existsSync(file)) {
  console.error(`${file}:0: [io.missing_file] File not found`);
  process.exit(2);
}

const absFile = normalizePath(resolve(file));

let root;
try {
  root = repoRoot(absFile);
} catch {
  console.error(`${file}:0: [refs-owned.error] Could not determine repo root`);
  process.exit(2);
}

const relFile = relative(root, absFile).replace(/\\/g, '/');

// Only run for sync-zone files
if (!isPythiaSyncMarkdownRelPath(relFile)) {
  process.exit(0);
}

const content = readFileSync(absFile, 'utf8');
const parsed = parseTrailingRefs(content);

if (!parsed) {
  process.exit(0);
}

const { references = [], usedBy = [] } = parsed;
const errors = [];

// ── 1. phantom_used_by ──────────────────────────────────────────────────────
for (const u of usedBy) {
  const consumerAbs = resolveFileLink(absFile, u.path);
  if (!consumerAbs || !existsSync(consumerAbs)) {
    errors.push(
      `${file}:0: [refs-owned.phantom_used_by] ## Used by "${u.text}" (${u.path}) — referenced file does not exist`,
    );
    continue;
  }
  const consumerParsed = parseTrailingRefs(readFileSync(consumerAbs, 'utf8'));
  const backlinked = (consumerParsed?.references ?? []).some((r) => {
    const rAbs = resolveFileLink(consumerAbs, r.path);
    return rAbs && normalizePath(rAbs) === normalizePath(absFile);
  });
  if (!backlinked) {
    errors.push(
      `${file}:0: [refs-owned.phantom_used_by] ## Used by "${u.text}" (${u.path}) — consumer has no matching ## References entry (phantom)`,
    );
  }
}

// ── 2. relation label validation ─────────────────────────────────────────────
for (const ref of references) {
  if (!ref.relType) continue;
  if (!isKnownRelation(ref.relType, root)) {
    errors.push(
      `${file}:0: [refs-owned.relation.unknown] Unknown relation label '${ref.relType}' in ## References "${ref.text}" (${ref.path}) — not in configured vocabulary`,
    );
  }
}
for (const u of usedBy) {
  if (!u.relType) continue;
  if (!isKnownRelation(u.relType, root)) {
    errors.push(
      `${file}:0: [refs-owned.relation.unknown] Unknown relation label '${u.relType}' in ## Used by "${u.text}" (${u.path}) — not in configured vocabulary`,
    );
  }
}

// ── 3. phantom_reference ────────────────────────────────────────────────────
const bodyTargets = buildBodyTargets(content, absFile, root);

for (const ref of references) {
  if (isExternalHref(ref.path)) continue;
  const refAbs = resolveFileLink(absFile, ref.path);
  if (!refAbs) continue;
  const refRel = relative(root, refAbs).replace(/\\/g, '/');
  if (!isPythiaSyncMarkdownRelPath(refRel)) continue;
  if (!bodyTargets.has(normalizePath(refAbs))) {
    errors.push(
      `${file}:0: [refs-owned.phantom_reference] ## References "${ref.text}" (${ref.path}) — sync-zone file not cited in document body (phantom)`,
    );
  }
}

if (errors.length > 0) {
  for (const e of errors) console.error(e);
  process.exit(1);
}
process.exit(0);

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveFileLink(fromFile, href) {
  const path = href.split('#')[0];
  if (!path || /^https?:\/\//.test(path)) return null;
  try {
    const resolved = resolveDocLink(fromFile, href, root);
    if (resolved) return normalizePath(resolved);
    return normalizePath(resolve(fromFile, '..', path));
  } catch {
    return null;
  }
}

function isExternalHref(href) {
  return /^https?:\/\//.test(href) || href.startsWith('//');
}

// Shared from inputs-core.js — single source of truth; checker and sync always agree.

function buildBodyTargets(content, fromFile, root) {
  const targets = new Set();
  const lines = content.split('\n');
  let inTrailingRegion = false;
  let inBibliographySection = false;
  let inFenced = false;
  const bodyLines = [];
  for (const line of lines) {
    if (/^```/.test(line)) { inFenced = !inFenced; continue; }
    if (inFenced) continue;
    if (/^## References\s*$/.test(line) || /^## Used by\s*$/.test(line)) {
      inTrailingRegion = true;
    }
    if (inTrailingRegion) continue;
    bodyLines.push(line);
    const h2 = line.match(/^## (.+)$/);
    if (h2) {
      inBibliographySection = BODY_BIBLIOGRAPHY_SECTIONS.has(h2[1].trim());
      continue;
    }
    if (inBibliographySection) continue;
    const re = /\[(?:[^\]]*)\]\(([^)]+)\)/g;
    let m;
    while ((m = re.exec(line)) !== null) {
      const abs = resolveFileLink(fromFile, m[1]);
      if (abs) targets.add(normalizePath(abs));
    }
  }
  // Backtick-path parity with collectSyncDeps
  for (const candidate of extractBacktickPaths(bodyLines.join('\n'))) {
    const docRel = resolve(dirname(fromFile), candidate);
    const rootRel = resolve(root, candidate);
    const abs = existsSync(docRel) ? docRel : existsSync(rootRel) ? rootRel : null;
    if (abs) targets.add(normalizePath(abs));
  }
  return targets;
}
