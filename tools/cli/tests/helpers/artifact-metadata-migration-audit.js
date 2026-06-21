import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parseArtifactMetadata, getArtifactField, inferArtifactType } from '../../../lib/metadata/parse.js';
import { SCHEMA_VERSION } from '../../../lib/metadata/schema.js';
import {
  defaultArtifactMetadataMigrationScopes,
  isArtifactMetadataScopeFile,
} from '../../../lib/metadata/scope.js';

const OLD_METADATA_KEYS = new Set([
  'Plan-Id',
  'Plan Version',
  'Last Status',
  'Last Review Round',
  'Created',
  'Updated',
  'Subject',
  'Subject-Version',
]);

const LEGACY_FRONTMATTER_KEYS = /^(feature-id|title|status|type|shape|generator|version|tags|inputs):/;

function walkFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    const st = statSync(abs);
    if (st.isDirectory()) {
      if (name === 'runtime' || name === 'backups' || name === '.git') continue;
      walkFiles(abs, acc);
    } else if (name.endsWith('.md')) {
      acc.push(abs);
    }
  }
  return acc;
}

function relFromRoot(root, abs) {
  return relative(root, abs).replace(/\\/g, '/');
}

function frontmatter(content) {
  if (!content.startsWith('---\n')) return null;
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) return null;
  return content.slice(4, end);
}

function coveredScopesFor(rel, scopes) {
  return scopes.filter((scope) => isArtifactMetadataScopeFile(rel, scope));
}

export function auditArtifactMetadataMigration(wsRoot, { scopes = defaultArtifactMetadataMigrationScopes() } = {}) {
  const files = [];
  const issues = [];
  const byArtifact = {};

  for (const scope of scopes) {
    for (const abs of walkFiles(join(wsRoot, scope.root))) {
      const rel = relFromRoot(wsRoot, abs);
      if (files.some((file) => file.rel === rel)) continue;
      const matchedScopes = coveredScopesFor(rel, scopes);
      if (matchedScopes.length === 0) continue;

      const content = readFileSync(abs, 'utf8');
      const parsed = parseArtifactMetadata(content);
      const schema = getArtifactField(parsed, 'Schema');
      const artifact = getArtifactField(parsed, 'Artifact') ?? inferArtifactType(abs);
      const schemaTagged = schema === SCHEMA_VERSION;
      const oldKeys = parsed.entries.filter((entry) => OLD_METADATA_KEYS.has(entry.key)).map((entry) => entry.key);
      const legacyFrontmatter = (frontmatter(content) ?? '')
        .split('\n')
        .filter((line) => LEGACY_FRONTMATTER_KEYS.test(line))
        .map((line) => line.split(':', 1)[0]);

      files.push({ rel, artifact, schemaTagged, oldKeys, legacyFrontmatter, duplicateMetadata: parsed.duplicate });
      byArtifact[artifact] = (byArtifact[artifact] ?? 0) + 1;

      if (!schemaTagged) issues.push(`${rel}: missing Schema ${SCHEMA_VERSION}`);
      if (parsed.duplicate) issues.push(`${rel}: duplicate Metadata sections still present`);
      if (oldKeys.length) issues.push(`${rel}: old metadata keys still present: ${oldKeys.join(', ')}`);
      if (legacyFrontmatter.length) {
        issues.push(`${rel}: legacy frontmatter keys still present: ${legacyFrontmatter.join(', ')}`);
      }
    }
  }

  return {
    wsRoot,
    covered: files.length,
    schemaTagged: files.filter((file) => file.schemaTagged).length,
    byArtifact,
    files,
    issues,
    ok: issues.length === 0,
  };
}

export function newlySchemaTaggedFiles(beforeAudit, afterAudit) {
  const before = new Map(beforeAudit.files.map((file) => [file.rel, file]));
  return afterAudit.files
    .filter((file) => file.schemaTagged && !before.get(file.rel)?.schemaTagged)
    .map((file) => file.rel)
    .sort();
}

export function formatArtifactMetadataAudit(report, { before = null } = {}) {
  const newlyTagged = before ? newlySchemaTaggedFiles(before, report) : [];
  const byArtifact = Object.entries(report.byArtifact)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([artifact, count]) => `  - ${artifact}: ${count}`);

  return [
    '=== artifact metadata migration audit ===',
    `workspace: ${report.wsRoot}`,
    `status: ${report.ok ? 'OK' : 'FAIL'}`,
    `covered artifacts: ${report.covered}`,
    `schema tagged: ${report.schemaTagged}`,
    '',
    'by artifact:',
    ...(byArtifact.length ? byArtifact : ['  (none)']),
    '',
    ...(before
      ? [
        `newly schema tagged (${newlyTagged.length}):`,
        ...(newlyTagged.length ? newlyTagged.map((rel) => `  - ${rel}`) : ['  (none)']),
        '',
      ]
      : []),
    `issues (${report.issues.length}):`,
    ...(report.issues.length ? report.issues.map((issue) => `  - ${issue}`) : ['  (none)']),
  ].join('\n');
}

export function seedLegacyArtifactMetadataCorpus(wsRoot) {
  const feat = 'feat-2026-06-metadata-migration-probe';
  const featDir = join(wsRoot, '.pythia/workflows/features', feat);
  mkdirSync(join(featDir, 'contexts'), { recursive: true });
  mkdirSync(join(featDir, 'plans'), { recursive: true });
  mkdirSync(join(featDir, 'reports'), { recursive: true });
  mkdirSync(join(featDir, 'notes'), { recursive: true });

  writeFileSync(
    join(featDir, `${feat}.md`),
    `---
feature-id: ${feat}
title: Metadata migration probe
status: active
tags: workflow
---
# Metadata migration probe

Legacy feature body.
`,
    'utf8',
  );

  writeFileSync(
    join(featDir, 'contexts/1-legacy.context.md'),
    `---
type: context
shape: notes
status: ready
tags: context
---
# Legacy context

Context body.
`,
    'utf8',
  );

  writeFileSync(
    join(featDir, 'plans/1-legacy.plan.md'),
    `# Plan 1: Legacy plan

## Metadata

- **Plan-Id**: ${feat}/1-legacy
- **Plan-Version**: v3
- **Status**: Ready for implementation
- **Branch**: main
- **Last review round**: R2

## Plan revision log

| Version | Date | Author | Summary |
| --- | --- | --- | --- |
| v1 | 2026-06-01 | Architect | Initial |
| v3 | 2026-06-03 | Architect | Review fixes |
`,
    'utf8',
  );

  writeFileSync(
    join(featDir, 'reports/1-legacy.review.md'),
    `# Review

## Metadata

- **Plan**: plans/1-legacy.plan.md
- **Plan Version**: v3
- **Last Review Round**: R2
- **Last Status**: READY

## Review R2 - 2026-06-04

Verdict: READY
`,
    'utf8',
  );

  writeFileSync(
    join(featDir, 'reports/1-legacy.implementation.md'),
    `# Implementation Report

## Implementation I1 - 2026-06-05

Result: implemented
`,
    'utf8',
  );

  writeFileSync(
    join(featDir, 'reports/1-legacy.audit.md'),
    `# Audit Report

## Audit A1 - 2026-06-06

- **Verdict**: ready
`,
    'utf8',
  );

  writeFileSync(
    join(featDir, 'notes/1-legacy.retro.md'),
    `# Legacy retro

Retro body.
`,
    'utf8',
  );

  mkdirSync(join(wsRoot, '.pythia/ctx'), { recursive: true });
  writeFileSync(join(wsRoot, '.pythia/ctx/source.md'), 'source\n', 'utf8');
  writeFileSync(
    join(wsRoot, '.pythia/ctx/legacy-global.ctx.md'),
    `---
type: ctx
shape: notes
status: ready
tags: context
inputs:
  - .pythia/ctx/source.md:00000000
---
# Legacy global context

See [source](./source.md).
`,
    'utf8',
  );

  mkdirSync(join(wsRoot, '.pythia/contexts/architecture'), { recursive: true });
  writeFileSync(
    join(wsRoot, '.pythia/contexts/architecture/legacy-current.context.md'),
    `---
type: context
shape: notes
status: ready
tags: context
---
# Legacy current global context

Context body.
`,
    'utf8',
  );

  return featDir;
}
