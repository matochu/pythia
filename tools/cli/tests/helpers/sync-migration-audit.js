import { readFileSync, readdirSync, statSync, cpSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative, resolve, dirname, sep } from 'node:path';
import { extractRelativeLinks } from '../../../lib/md.js';
import { getBodyContent, parseTrailingRefs, isPythiaSyncMarkdownRelPath, resolveDocLink, repoOrDocRelativePath } from '../../../lib/refs.js';

const VALID_KINDS = new Set(['feat', 'review', 'impl', 'audit', 'retro', 'research', 'ctx', 'plan', 'note', 'doc', 'code', 'skill', 'url']);

const SYNC_TYPED_REF = /^- \[(feat|review|impl|audit|retro|research|ctx|plan|note|doc|code|skill|url)\] \[[^\]]*\]\([^)]+\)/m;

const SKIP_DIRS = new Set(['runtime', 'backups', '.git', 'node_modules']);

/** Test/fixture paths may embed example ## References blocks — not sync corruption. */
function isAuditCorruptionExcludedRelPath(rel) {
  return rel.includes('/tests/')
    || rel.includes('/__tests__/')
    || rel.includes('/fixtures/')
    || rel.endsWith('.test.js')
    || rel.endsWith('.test.ts');
}

function bodyLinks(content) {
  return extractRelativeLinks(getBodyContent(content), { skipFenced: true }).map((l) => l.href.split('#')[0].trim());
}

function hasAccidentalSyncTrail(content) {
  const idx = content.lastIndexOf('## References');
  if (idx === -1) return false;
  const tail = content.slice(idx);
  if (SYNC_TYPED_REF.test(tail)) return true;
  const usedIdx = tail.indexOf('## Used by');
  return usedIdx !== -1 && SYNC_TYPED_REF.test(tail.slice(usedIdx));
}

function absCitedTarget(wsRoot, fromRelFile, href) {
  const clean = href.split('#')[0].trim();
  const absFile = join(wsRoot, fromRelFile);
  if (
    clean.startsWith('.pythia/')
    || clean.startsWith('skills/')
    || clean.startsWith('.claude/')
    || clean.startsWith('tools/')
    || clean.startsWith('assets/')
  ) {
    return join(wsRoot, clean);
  }
  return resolveDocLink(absFile, clean, wsRoot) ?? resolve(dirname(absFile), clean);
}

function normalizeCitedPath(wsRoot, fromRelFile, href) {
  const clean = href.split('#')[0].trim();
  if (/^https?:\/\//.test(clean)) return clean;
  for (const marker of [
    '.pythia/workflows/',
    '.pythia/',
    '.claude/skills/',
    '.claude/',
    '.agents/skills/',
    '.agents/',
    'skills/',
    'tools/',
    'assets/',
  ]) {
    const idx = clean.lastIndexOf(marker);
    if (idx !== -1) return clean.slice(idx);
  }
  const absFile = join(wsRoot, fromRelFile);
  const absTarget = absCitedTarget(wsRoot, fromRelFile, clean);
  if (absTarget) {
    const wsAbs = resolve(wsRoot);
    const targetAbs = resolve(absTarget);
    if (targetAbs === wsAbs || targetAbs.startsWith(`${wsAbs}${sep}`)) {
      const fromRoot = relative(wsAbs, targetAbs).replace(/\\/g, '/');
      if (!fromRoot.startsWith('..')) return fromRoot;
    }
  }
  return repoOrDocRelativePath(absFile, absTarget, wsRoot);
}

function citedPathsForFile(wsRoot, fromRelFile, content) {
  const set = new Set();
  for (const l of bodyLinks(content)) {
    set.add(normalizeCitedPath(wsRoot, fromRelFile, l));
  }
  const parsed = parseTrailingRefs(content);
  for (const r of parsed?.references ?? []) {
    set.add(normalizeCitedPath(wsRoot, fromRelFile, r.path));
  }
  return set;
}

function hasFrontmatterInputs(content) {
  if (!content.startsWith('---\n')) return false;
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) return false;
  return content.slice(4, end).split('\n').some((l) => l === 'inputs:');
}

function walkFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      walkFiles(p, acc);
    } else {
      acc.push(p);
    }
  }
  return acc;
}

function relFromRoot(root, abs) {
  return relative(root, abs).replace(/\\/g, '/');
}

/** Copy live `.pythia/` from a source repo into a tmp workspace (excludes backups + nested .git). */
export function copyRealPythiaTree(sourceRoot, targetDir) {
  const src = join(sourceRoot, '.pythia');
  if (!existsSync(src)) throw new Error(`missing source .pythia: ${src}`);
  cpSync(src, join(targetDir, '.pythia'), {
    recursive: true,
    force: true,
    filter: (path) => {
      const rel = relative(sourceRoot, path).replace(/\\/g, '/');
      if (!rel.startsWith('.pythia/')) return true;
      const rest = rel.slice('.pythia/'.length);
      if (rest === '.git' || rest.startsWith('.git/')) return false;
      if (rest === 'backups' || rest.startsWith('backups/')) return false;
      return true;
    },
  });
}

/** Copy repo-root paths commonly linked from `.pythia` workflow docs. */
export function copyLinkedRepoRoot(sourceRoot, targetDir) {
  const entries = [
    'package.json',
    'config.json',
    '.npmignore',
    'skills',
    'tools',
    'assets',
    'scripts',
    'docs',
    'navigation',
    'rules',
    'AGENTS.md',
    'CLAUDE.md',
    'README.md',
    'RELEASING.md',
  ];
  for (const entry of entries) {
    const src = join(sourceRoot, entry);
    if (!existsSync(src)) continue;
    cpSync(src, join(targetDir, entry), { recursive: true, force: true });
  }
  for (const nested of ['.github/workflows', '.claude']) {
    const src = join(sourceRoot, nested);
    if (!existsSync(src)) continue;
    cpSync(src, join(targetDir, nested), { recursive: true, force: true });
  }
  ensureLinkedAgentStubs(targetDir);
  ensureLinkedScriptStubs(targetDir);
}

/** Minimal agent stubs for workflow docs that reference `.claude/agents/*.md`. */
function ensureLinkedAgentStubs(targetDir) {
  const agentsDir = join(targetDir, '.claude/agents');
  mkdirSync(agentsDir, { recursive: true });
  for (const name of ['architect.md', 'developer.md']) {
    writeFileSync(
      join(agentsDir, name),
      `---\nname: ${name.replace(/\.md$/, '')}\n---\n\n# ${name.replace(/\.md$/, '')}\n`,
      'utf8',
    );
  }
}

/** Legacy script paths cited from pre-migration context docs. */
function ensureLinkedScriptStubs(targetDir) {
  const scriptsDir = join(targetDir, 'scripts');
  mkdirSync(scriptsDir, { recursive: true });
  for (const name of ['inputs.sh', 'validate-workflow-doc.sh']) {
    const dest = join(scriptsDir, name);
    if (existsSync(dest)) continue;
    writeFileSync(dest, `#!/usr/bin/env bash\n# stub for migration audit\n`, 'utf8');
  }
}

/** Empty ## References shell with no entries, no trail prose, and no Used by. */
export function hasEmptyReferencesShell(content) {
  const parsed = parseTrailingRefs(content);
  if (!parsed) return false;
  if (parsed.references.length > 0) return false;
  if (parsed.usedBy.length > 0) return false;
  if (parsed.regionTrail?.length) return false;
  return content.includes('## References');
}

export function snapshotSyncCitedPaths(wsRoot) {
  const snap = new Map();
  const pythiaDir = join(wsRoot, '.pythia');
  for (const abs of walkFiles(pythiaDir)) {
    const rel = relFromRoot(wsRoot, abs);
    if (!isPythiaSyncMarkdownRelPath(rel)) continue;
    snap.set(rel, [...citedPathsForFile(wsRoot, rel, readFileSync(abs, 'utf8'))].sort());
  }
  return snap;
}

export function snapshotEmptyReferenceShells(wsRoot) {
  const set = new Set();
  const pythiaDir = join(wsRoot, '.pythia');
  for (const abs of walkFiles(pythiaDir)) {
    const rel = relFromRoot(wsRoot, abs);
    if (!isPythiaSyncMarkdownRelPath(rel)) continue;
    if (hasEmptyReferencesShell(readFileSync(abs, 'utf8'))) set.add(rel);
  }
  return set;
}

/**
 * Full post-update audit. Returns structured report + printable summary.
 * @param {string} wsRoot
 * @param {Map<string, string[]>} [beforeLinks] from snapshotSyncCitedPaths
 * @param {Set<string>} [beforeEmptyShells] from snapshotEmptyReferenceShells
 */
export function auditSyncWorkspace(wsRoot, beforeLinks = null, beforeEmptyShells = null) {
  const corruptionOutsidePythia = [];
  const corruptionInRuntime = [];
  const emptyReferencesShells = [];
  const legacyInputsRemaining = [];
  const invalidReferenceKinds = [];
  const bodyLinksLost = [];

  for (const abs of walkFiles(wsRoot)) {
    const rel = relFromRoot(wsRoot, abs);
    if (!rel.endsWith('.md') && !rel.endsWith('.js') && !rel.endsWith('.json') && !rel.endsWith('.yml')) continue;
    const content = readFileSync(abs, 'utf8');
    if (!hasAccidentalSyncTrail(content)) continue;
    if (isAuditCorruptionExcludedRelPath(rel)) continue;

    if (!rel.startsWith('.pythia/')) {
      corruptionOutsidePythia.push(rel);
    } else if (rel.startsWith('.pythia/runtime/')) {
      corruptionInRuntime.push(rel);
    }
  }

  const pythiaDir = join(wsRoot, '.pythia');
  for (const abs of walkFiles(pythiaDir)) {
    const rel = relFromRoot(wsRoot, abs);
    if (!isPythiaSyncMarkdownRelPath(rel)) continue;
    const content = readFileSync(abs, 'utf8');

    if (hasFrontmatterInputs(content)) legacyInputsRemaining.push(rel);
    if (hasEmptyReferencesShell(content)) {
      if (!beforeEmptyShells?.has(rel)) emptyReferencesShells.push(rel);
    }

    const parsed = parseTrailingRefs(content);
    if (parsed) {
      for (const r of parsed.references) {
        if (!VALID_KINDS.has(r.kind)) invalidReferenceKinds.push(`${rel}: ref kind "${r.kind}" → ${r.path}`);
      }
      for (const u of parsed.usedBy) {
        if (!VALID_KINDS.has(u.kind)) invalidReferenceKinds.push(`${rel}: used-by kind "${u.kind}" → ${u.path}`);
      }
    }

    if (beforeLinks?.has(rel)) {
      const before = new Set(beforeLinks.get(rel));
      const after = citedPathsForFile(wsRoot, rel, content);
      const missing = [...before].filter((l) => !after.has(l));
      if (missing.length) bodyLinksLost.push({ file: rel, missing });
    }
  }

  return {
    wsRoot,
    corruptionOutsidePythia,
    corruptionInRuntime,
    emptyReferencesShells,
    legacyInputsRemaining,
    invalidReferenceKinds,
    bodyLinksLost,
    ok:
      corruptionOutsidePythia.length === 0
      && corruptionInRuntime.length === 0
      && emptyReferencesShells.length === 0
      && legacyInputsRemaining.length === 0
      && invalidReferenceKinds.length === 0
      && bodyLinksLost.length === 0,
  };
}

export function formatAuditReport(report) {
  const lines = [
    `=== sync migration audit ===`,
    `workspace: ${report.wsRoot}`,
    `status: ${report.ok ? 'OK' : 'FAIL'}`,
    '',
    `corruption outside .pythia (${report.corruptionOutsidePythia.length}):`,
    ...(report.corruptionOutsidePythia.length ? report.corruptionOutsidePythia.map((p) => `  - ${p}`) : ['  (none)']),
    '',
    `corruption in .pythia/runtime (${report.corruptionInRuntime.length}):`,
    ...(report.corruptionInRuntime.length ? report.corruptionInRuntime.map((p) => `  - ${p}`) : ['  (none)']),
    '',
    `empty ## References shells (${report.emptyReferencesShells.length}):`,
    ...(report.emptyReferencesShells.length ? report.emptyReferencesShells.map((p) => `  - ${p}`) : ['  (none)']),
    '',
    `legacy frontmatter inputs remaining (${report.legacyInputsRemaining.length}):`,
    ...(report.legacyInputsRemaining.length ? report.legacyInputsRemaining.map((p) => `  - ${p}`) : ['  (none)']),
    '',
    `invalid reference kinds (${report.invalidReferenceKinds.length}):`,
    ...(report.invalidReferenceKinds.length ? report.invalidReferenceKinds.map((p) => `  - ${p}`) : ['  (none)']),
    '',
    `cited paths lost (${report.bodyLinksLost.length}):`,
    ...(report.bodyLinksLost.length
      ? report.bodyLinksLost.map(({ file, missing }) => `  - ${file}: ${missing.join(', ')}`)
      : ['  (none)']),
    '',
    ...(report.migrationSamples?.length
      ? [
        `migration samples (${report.migrationSamples.length}) → ${report.migrationSamplesDir}:`,
        ...report.migrationSamples.map((s) => `  - ${s.rel}`),
        '',
      ]
      : []),
  ];
  return lines.join('\n');
}

/** Classify migrated markdown for diverse sample selection (no hardcoded workflow paths). */
function migrationSampleBucket(rel, content) {
  const base = rel.split('/').pop();
  const parsed = parseTrailingRefs(content);
  const refKinds = new Set((parsed?.references ?? []).map((r) => r.kind));

  if (base.endsWith('.plan.md')) return 'plan';
  if (base.endsWith('.ctx.md')) return 'global-ctx';
  if (/^feat-/.test(base)) return 'feat';
  if (base.endsWith('.retro.md')) return 'retro';
  if (base.endsWith('.implementation.md')) return 'impl';
  if (base.endsWith('.context.md')) {
    if (refKinds.has('research')) return 'context-with-research-refs';
    if (refKinds.has('ctx')) return 'context-with-ctx-refs';
    return 'context';
  }
  if (refKinds.has('note')) return 'note-refs';
  if (refKinds.has('feat')) return 'feat-refs';
  return 'other';
}

/** Pick sync-eligible files with typed References — one per artifact/ref pattern. */
export function pickMigrationSampleCandidates(wsRoot, maxFiles = 12) {
  const byBucket = new Map();
  const fallback = [];

  for (const abs of walkFiles(join(wsRoot, '.pythia'))) {
    const rel = relFromRoot(wsRoot, abs);
    if (!isPythiaSyncMarkdownRelPath(rel)) continue;
    const content = readFileSync(abs, 'utf8');
    const parsed = parseTrailingRefs(content);
    if (!parsed?.references?.length) continue;

    fallback.push(rel);
    const bucket = migrationSampleBucket(rel, content);
    if (!byBucket.has(bucket)) byBucket.set(bucket, rel);
  }

  const priority = [
    'plan',
    'context-with-research-refs',
    'context-with-ctx-refs',
    'context',
    'feat',
    'global-ctx',
    'note-refs',
    'feat-refs',
    'retro',
    'impl',
    'other',
  ];
  const picks = [];
  for (const bucket of priority) {
    if (byBucket.has(bucket)) picks.push(byBucket.get(bucket));
  }
  for (const rel of fallback.sort()) {
    if (picks.length >= maxFiles) break;
    if (!picks.includes(rel)) picks.push(rel);
  }
  return picks.slice(0, maxFiles);
}

/** Write post-migration markdown samples for manual inspection (dynamic selection). */
export function writeMigrationSamples(wsRoot, report, maxFiles = 12) {
  const outDir = join(wsRoot, 'migration-samples');
  mkdirSync(outDir, { recursive: true });
  const samples = [];

  for (const rel of pickMigrationSampleCandidates(wsRoot, maxFiles)) {
    const src = join(wsRoot, rel);
    const flat = rel.replace(/\//g, '__');
    cpSync(src, join(outDir, flat), { force: true });
    const content = readFileSync(src, 'utf8');
    const parsed = parseTrailingRefs(content);
    const kinds = (parsed?.references ?? []).map((r) => `${r.kind}:${r.path.split('/').pop()}`);
    samples.push({ rel, kinds: kinds.slice(0, 6) });
  }

  writeFileSync(
    join(outDir, 'INDEX.txt'),
    samples.map((s) => `${s.rel}\n  refs: ${s.kinds.join(', ') || '(none)'}`).join('\n\n') + '\n',
    'utf8',
  );
  return { outDir, samples };
}

/** Write audit report next to tmp workspace for manual inspection. */
export function writeAuditReport(report, filename = 'sync-migration-audit.txt') {
  const out = join(report.wsRoot, filename);
  writeFileSync(out, formatAuditReport(report), 'utf8');
  return out;
}
