import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parseArtifactMetadata, inferArtifactType } from '../../../lib/metadata/parse.js';
import { FORBIDDEN_KEYS } from '../../../lib/metadata/schema.js';
import {
  defaultArtifactMetadataMigrationScopes,
  isArtifactMetadataScopeFile,
} from '../../../lib/metadata/scope.js';

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

function hasYamlFrontmatter(content) {
  if (!content.startsWith('---\n')) return false;
  return content.indexOf('\n---\n', 4) !== -1;
}

function hasV1BoldBullets(content) {
  const parsed = parseArtifactMetadata(content);
  return parsed.entries.some((e) => e.format === 'v1');
}

function hasForbiddenKeys(content) {
  const parsed = parseArtifactMetadata(content);
  // scan raw metadata lines for Title-case forbidden keys
  const lines = content.split('\n').slice(parsed.startLine, parsed.endLine);
  for (const line of lines) {
    const m = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*.+$/);
    if (m && FORBIDDEN_KEYS.includes(m[1])) return true;
  }
  return parsed.entries.some((e) => FORBIDDEN_KEYS.includes(e.key));
}

function coveredScopesFor(rel, scopes) {
  return scopes.filter((scope) => isArtifactMetadataScopeFile(rel, scope));
}

/**
 * Audit v2 metadata migration state of a workspace.
 * v2Converted = file has no YAML frontmatter, no v1 bold-bullet metadata, no forbidden keys.
 */
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
      const artifact = inferArtifactType(abs);

      const yamlFrontmatter = hasYamlFrontmatter(content);
      const v1BoldBullets = hasV1BoldBullets(content);
      const forbiddenKeys = hasForbiddenKeys(content);
      const v2Converted = !yamlFrontmatter && !v1BoldBullets && !forbiddenKeys;

      files.push({
        rel,
        artifact,
        v2Converted,
        yamlFrontmatter,
        v1BoldBullets,
        forbiddenKeys,
        duplicateMetadata: parsed.duplicate,
      });
      byArtifact[artifact] = (byArtifact[artifact] ?? 0) + 1;

      if (yamlFrontmatter) issues.push(`${rel}: legacy YAML frontmatter still present`);
      if (v1BoldBullets) issues.push(`${rel}: v1 bold-bullet metadata still present`);
      if (forbiddenKeys) issues.push(`${rel}: forbidden v2 metadata keys still present`);
      if (parsed.duplicate) issues.push(`${rel}: duplicate ## Metadata sections still present`);
    }
  }

  return {
    wsRoot,
    covered: files.length,
    v2Converted: files.filter((file) => file.v2Converted).length,
    byArtifact,
    files,
    issues,
    ok: issues.length === 0,
  };
}

export function newlyConvertedFiles(beforeAudit, afterAudit) {
  const before = new Map(beforeAudit.files.map((file) => [file.rel, file]));
  return afterAudit.files
    .filter((file) => file.v2Converted && !before.get(file.rel)?.v2Converted)
    .map((file) => file.rel)
    .sort();
}

export function formatArtifactMetadataAudit(report, { before = null } = {}) {
  const newlyConverted = before ? newlyConvertedFiles(before, report) : [];
  const byArtifact = Object.entries(report.byArtifact)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([artifact, count]) => `  - ${artifact}: ${count}`);

  return [
    '=== artifact metadata migration audit ===',
    `workspace: ${report.wsRoot}`,
    `status: ${report.ok ? 'OK' : 'FAIL'}`,
    `covered artifacts: ${report.covered}`,
    `v2 converted: ${report.v2Converted}`,
    '',
    'by artifact:',
    ...(byArtifact.length ? byArtifact : ['  (none)']),
    '',
    ...(before
      ? [
        `newly converted (${newlyConverted.length}):`,
        ...(newlyConverted.length ? newlyConverted.map((rel) => `  - ${rel}`) : ['  (none)']),
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

Verdict: ready
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
