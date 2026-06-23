import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync, cpSync, realpathSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, '../../..');
const toolsDir = join(packageRoot, 'tools', 'migrate');
const fixturesDir = join(__dirname, 'fixtures');
const pkgVersion = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')).version;

// Import ops and utilities directly
import { runOp, ensureDir, writeIfMissing, setFrontmatter, renameFrontmatterKey, renameFile, appendToSection, replaceOnce, replaceSection } from '../ops.js';
import { compareSemver, inPendingRange, sortVersions, parseSemver } from '../semver.js';
import { readState, writeState, findUnresolvedMixedStates } from '../state.js';
import { parseMigration, migrationHasLlm } from '../parse.js';
import { doInit, doUpdate, readManifest, writeManifest } from '../../../tools/cli/workspace.js';

let tmpDir;

function makeWorkspaceOpts(target) {
  return { target, dryRun: false, packageRoot };
}

async function seedWorkspace(target, manifest = {}) {
  await doInit(makeWorkspaceOpts(target));
  // Override manifest fields if needed
  if (Object.keys(manifest).length > 0) {
    writeManifest(target, manifest, false);
  }
}

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'pythia-engine-test-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

// ─── semver ───────────────────────────────────────────────────────────────────

describe('semver', () => {
  it('parseSemver works', () => {
    expect(parseSemver('1.2.3')).toEqual({ major: 1, minor: 2, patch: 3, prerelease: null });
    expect(parseSemver('0.3.2-dev')).toEqual({ major: 0, minor: 3, patch: 2, prerelease: 'dev' });
  });
  it('compareSemver: prerelease before release at same patch', () => {
    expect(compareSemver('0.3.2-dev', '0.3.2')).toBeLessThan(0);
    expect(compareSemver('0.3.2', '0.3.2-dev')).toBeGreaterThan(0);
  });
  it('inPendingRange: 0.3.3 pending from 0.3.2-dev baseline', () => {
    expect(inPendingRange('0.3.3', '0.3.2-dev', '0.3.3')).toBe(true);
  });
  it('compareSemver: equal', () => expect(compareSemver('1.0.0', '1.0.0')).toBe(0));
  it('compareSemver: less', () => expect(compareSemver('0.1.0', '0.2.0')).toBeLessThan(0));
  it('compareSemver: greater', () => expect(compareSemver('1.0.0', '0.9.9')).toBeGreaterThan(0));
  it('inPendingRange: (0.0.0, 0.1.0] includes 0.1.0', () => expect(inPendingRange('0.1.0', '0.0.0', '0.1.0')).toBe(true));
  it('inPendingRange: excludes low', () => expect(inPendingRange('0.0.0', '0.0.0', '0.1.0')).toBe(false));
  it('sortVersions', () => expect(sortVersions(['0.2.0', '0.1.0', '0.1.5'])).toEqual(['0.1.0', '0.1.5', '0.2.0']));
  it('throws on invalid semver', () => expect(() => parseSemver('not.semver')).toThrow());
});

// ─── ops ──────────────────────────────────────────────────────────────────────

describe('ops: ensure-dir', () => {
  it('creates dir when absent', async () => {
    await seedWorkspace(tmpDir);
    const backups = [];
    const result = ensureDir(tmpDir, { op: 'ensure-dir', path: '.pythia/workflows/new-dir' }, backups, false);
    expect(result.status).toBe('applied');
    expect(existsSync(join(tmpDir, '.pythia/workflows/new-dir'))).toBe(true);
  });
  it('skips when dir exists (idempotent)', async () => {
    await seedWorkspace(tmpDir);
    mkdirSync(join(tmpDir, '.pythia/workflows/existing'), { recursive: true });
    const result = ensureDir(tmpDir, { op: 'ensure-dir', path: '.pythia/workflows/existing' }, [], false);
    expect(result.status).toBe('skipped');
  });
  it('refuses target outside .pythia/', async () => {
    await seedWorkspace(tmpDir);
    expect(() => ensureDir(tmpDir, { op: 'ensure-dir', path: 'AGENTS.md' }, [], false)).toThrow();
  });
  it('dry-run writes nothing', async () => {
    await seedWorkspace(tmpDir);
    ensureDir(tmpDir, { op: 'ensure-dir', path: '.pythia/workflows/dryrun-dir' }, [], true);
    expect(existsSync(join(tmpDir, '.pythia/workflows/dryrun-dir'))).toBe(false);
  });
});

describe('ops: relaxed zone (whole .pythia/) + containment', () => {
  it('allows ops on .pythia/ outside workflows/ (e.g. config)', async () => {
    await seedWorkspace(tmpDir);
    const result = writeIfMissing(tmpDir, { op: 'write-if-missing', path: '.pythia/seeded-config.md', content: '# cfg' }, [], false);
    expect(result.status).toBe('applied');
    expect(readFileSync(join(tmpDir, '.pythia/seeded-config.md'), 'utf8')).toBe('# cfg');
  });
  it('rejects traversal escape .pythia/../foo', async () => {
    await seedWorkspace(tmpDir);
    expect(() => writeIfMissing(tmpDir, { op: 'write-if-missing', path: '.pythia/../escaped.md', content: 'x' }, [], false)).toThrow(/inside \.pythia/);
  });
  it('rejects absolute path', async () => {
    await seedWorkspace(tmpDir);
    expect(() => writeIfMissing(tmpDir, { op: 'write-if-missing', path: '/etc/evil.md', content: 'x' }, [], false)).toThrow(/inside \.pythia/);
  });
  it('allows sync-legacy-inputs glob at .pythia root', async () => {
    await seedWorkspace(tmpDir);
    const result = runOp(tmpDir, { op: 'sync-legacy-inputs', glob: '.pythia' }, [], false, '9.9.9');
    expect(['skipped', 'applied']).toContain(result.status);
  });
});

describe('ops: write-if-missing', () => {
  it('writes file when absent', async () => {
    await seedWorkspace(tmpDir);
    writeIfMissing(tmpDir, { op: 'write-if-missing', path: '.pythia/workflows/new.md', content: '# hello' }, [], false);
    expect(readFileSync(join(tmpDir, '.pythia/workflows/new.md'), 'utf8')).toBe('# hello');
  });
  it('skips when file exists (idempotent)', async () => {
    await seedWorkspace(tmpDir);
    mkdirSync(join(tmpDir, '.pythia/workflows'), { recursive: true });
    writeFileSync(join(tmpDir, '.pythia/workflows/exists.md'), 'original', 'utf8');
    writeIfMissing(tmpDir, { op: 'write-if-missing', path: '.pythia/workflows/exists.md', content: 'new' }, [], false);
    expect(readFileSync(join(tmpDir, '.pythia/workflows/exists.md'), 'utf8')).toBe('original');
  });
  it('dry-run writes nothing', async () => {
    await seedWorkspace(tmpDir);
    writeIfMissing(tmpDir, { op: 'write-if-missing', path: '.pythia/workflows/dry.md', content: 'x' }, [], true);
    expect(existsSync(join(tmpDir, '.pythia/workflows/dry.md'))).toBe(false);
  });
});

describe('ops: set-frontmatter', () => {
  it('sets frontmatter key', async () => {
    await seedWorkspace(tmpDir);
    mkdirSync(join(tmpDir, '.pythia/workflows'), { recursive: true });
    writeFileSync(join(tmpDir, '.pythia/workflows/file.md'), '---\nstatus: draft\n---\nbody', 'utf8');
    const backups = [];
    setFrontmatter(tmpDir, { op: 'set-frontmatter', path: '.pythia/workflows/file.md', key: 'status', value: 'active' }, backups, false);
    const content = readFileSync(join(tmpDir, '.pythia/workflows/file.md'), 'utf8');
    expect(content).toContain('status: active');
    expect(backups).toHaveLength(1);
  });
  it('skips when already set (idempotent)', async () => {
    await seedWorkspace(tmpDir);
    mkdirSync(join(tmpDir, '.pythia/workflows'), { recursive: true });
    writeFileSync(join(tmpDir, '.pythia/workflows/file.md'), '---\nstatus: active\n---\nbody', 'utf8');
    const backups = [];
    const result = setFrontmatter(tmpDir, { op: 'set-frontmatter', path: '.pythia/workflows/file.md', key: 'status', value: 'active' }, backups, false);
    expect(result.status).toBe('skipped');
    expect(backups).toHaveLength(0);
  });
});

describe('ops: replace-once', () => {
  it('replaces first occurrence', async () => {
    await seedWorkspace(tmpDir);
    mkdirSync(join(tmpDir, '.pythia/workflows'), { recursive: true });
    writeFileSync(join(tmpDir, '.pythia/workflows/file.md'), 'foo bar foo', 'utf8');
    const backups = [];
    replaceOnce(tmpDir, { op: 'replace-once', path: '.pythia/workflows/file.md', find: 'foo', replace: 'baz' }, backups, false);
    expect(readFileSync(join(tmpDir, '.pythia/workflows/file.md'), 'utf8')).toBe('baz bar foo');
    expect(backups).toHaveLength(1);
  });
  it('throws when pattern not found and replacement absent', async () => {
    await seedWorkspace(tmpDir);
    mkdirSync(join(tmpDir, '.pythia/workflows'), { recursive: true });
    writeFileSync(join(tmpDir, '.pythia/workflows/file.md'), 'no match here', 'utf8');
    expect(() =>
      replaceOnce(tmpDir, { op: 'replace-once', path: '.pythia/workflows/file.md', find: 'ORIGINAL', replace: 'NEW' }, [], false)
    ).toThrow(/pattern not found/);
  });
  it('skips when replacement already present', async () => {
    await seedWorkspace(tmpDir);
    mkdirSync(join(tmpDir, '.pythia/workflows'), { recursive: true });
    writeFileSync(join(tmpDir, '.pythia/workflows/file.md'), 'already NEW content', 'utf8');
    const result = replaceOnce(
      tmpDir,
      { op: 'replace-once', path: '.pythia/workflows/file.md', find: 'ORIGINAL', replace: 'NEW' },
      [],
      false
    );
    expect(result.status).toBe('skipped');
  });
});

describe('ops: replace-section', () => {
  const canonicalBlock = `## Workflow docs

- *.plan.md  checker: role-boundary.js, links.js`;

  it('replaces existing section', async () => {
    await seedWorkspace(tmpDir);
    const pathsFile = join(tmpDir, '.pythia/config/paths.md');
    writeFileSync(
      pathsFile,
      '# Registry\n\n## Workflow docs\n\n- legacy line\n\n## Protected\n\n- .pythia/workflows/**\n',
      'utf8'
    );
    const result = replaceSection(
      tmpDir,
      { op: 'replace-section', path: '.pythia/config/paths.md', section: 'Workflow docs', content: canonicalBlock },
      [],
      false
    );
    expect(result.status).toBe('applied');
    const content = readFileSync(pathsFile, 'utf8');
    expect(content).toContain('role-boundary.js');
    expect(content).not.toContain('legacy line');
    expect(content).toContain('## Protected');
  });

  it('inserts missing section at EOF', async () => {
    await seedWorkspace(tmpDir);
    const pathsFile = join(tmpDir, '.pythia/config/paths.md');
    writeFileSync(pathsFile, '# Registry\n\n## Protected\n\n- .pythia/workflows/**\n', 'utf8');
    replaceSection(
      tmpDir,
      { op: 'replace-section', path: '.pythia/config/paths.md', section: 'Workflow docs', content: canonicalBlock },
      [],
      false
    );
    expect(readFileSync(pathsFile, 'utf8')).toContain('## Workflow docs');
  });

  it('skips when section already canonical', async () => {
    await seedWorkspace(tmpDir);
    writeFileSync(join(tmpDir, '.pythia/config/paths.md'), `# Registry\n\n${canonicalBlock}\n`, 'utf8');
    const result = replaceSection(
      tmpDir,
      { op: 'replace-section', path: '.pythia/config/paths.md', section: 'Workflow docs', content: canonicalBlock },
      [],
      false
    );
    expect(result.status).toBe('skipped');
  });
});

describe('ops: rename-file', () => {
  it('renames file', async () => {
    await seedWorkspace(tmpDir);
    mkdirSync(join(tmpDir, '.pythia/workflows'), { recursive: true });
    writeFileSync(join(tmpDir, '.pythia/workflows/old.md'), 'content', 'utf8');
    renameFile(tmpDir, { op: 'rename-file', from: '.pythia/workflows/old.md', to: '.pythia/workflows/new.md' }, [], false);
    expect(existsSync(join(tmpDir, '.pythia/workflows/old.md'))).toBe(false);
    expect(existsSync(join(tmpDir, '.pythia/workflows/new.md'))).toBe(true);
  });
  it('skips when already renamed (idempotent)', async () => {
    await seedWorkspace(tmpDir);
    mkdirSync(join(tmpDir, '.pythia/workflows'), { recursive: true });
    writeFileSync(join(tmpDir, '.pythia/workflows/new.md'), 'content', 'utf8');
    const result = renameFile(tmpDir, { op: 'rename-file', from: '.pythia/workflows/old.md', to: '.pythia/workflows/new.md' }, [], false);
    expect(result.status).toBe('skipped');
  });
});

describe('ops: sync-legacy-inputs', () => {
  it('migrates legacy frontmatter inputs to ## References', async () => {
    await seedWorkspace(tmpDir);
    mkdirSync(join(tmpDir, '.pythia/workflows/feat-test'), { recursive: true });
    writeFileSync(join(tmpDir, '.pythia/workflows/feat-test/dep.md'), 'dep body\n', 'utf8');
    writeFileSync(join(tmpDir, '.pythia/workflows/feat-test/ctx.md'), `---
inputs:
  - .pythia/workflows/feat-test/dep.md:00000000
---
# Context

See [dep](./dep.md).
`, 'utf8');
    const result = runOp(
      tmpDir,
      { op: 'sync-legacy-inputs', glob: '.pythia' },
      [],
      false,
      '9.9.9',
    );
    expect(result.status).toBe('applied');
    const out = readFileSync(join(tmpDir, '.pythia/workflows/feat-test/ctx.md'), 'utf8');
    expect(out).not.toMatch(/^inputs:/m);
    expect(out).toContain('## References');
  });

  it('re-syncs empty ## References shells under .pythia', async () => {
    await seedWorkspace(tmpDir);
    mkdirSync(join(tmpDir, '.pythia/ctx'), { recursive: true });
    writeFileSync(join(tmpDir, '.pythia/ctx/dep.md'), 'dep\n', 'utf8');
    writeFileSync(
      join(tmpDir, '.pythia/ctx/shell.context.md'),
      `# Shell

See [dep](./dep.md).

## References

`,
      'utf8',
    );
    const result = runOp(tmpDir, { op: 'sync-legacy-inputs', glob: '.pythia' }, [], false, '9.9.9');
    expect(result.status).toBe('applied');
    const out = readFileSync(join(tmpDir, '.pythia/ctx/shell.context.md'), 'utf8');
    expect(out).toMatch(/dep\.md#[0-9a-f]{5}/);
    expect(out).not.toMatch(/## References\n\n\n$/);
  });

  it('skips when no workflow docs need migration', async () => {
    await seedWorkspace(tmpDir);
    const result = runOp(
      tmpDir,
      { op: 'sync-legacy-inputs', glob: '.pythia/workflows' },
      [],
      false,
      '9.9.9',
    );
    expect(result.status).toBe('skipped');
  });
});

describe('ops: merge-checker-basenames', () => {
  function writePaths(content) {
    const path = join(tmpDir, '.pythia/config/paths.md');
    writeFileSync(path, content, 'utf8');
    return path;
  }

  const op = {
    op: 'merge-checker-basenames',
    path: '.pythia/config/paths.md',
    section: 'Workflow docs',
    rules: [
      {
        glob: '*.plan.md',
        replace: { 'doc-structure.js': 'structure.js' },
        append: ['artifact-metadata.js'],
      },
    ],
  };

  it('renames structure checker and appends metadata checker', async () => {
    await seedWorkspace(tmpDir);
    const path = writePaths(`# Paths

## Workflow docs

- *.plan.md  checker: links.js, doc-structure.js
`);
    const result = runOp(tmpDir, op, [], false, '9.9.9');
    expect(result.status).toBe('applied');
    const out = readFileSync(path, 'utf8');
    expect(out).toContain('links.js, structure.js, artifact-metadata.js');
    expect(out).not.toContain('doc-structure.js');
  });

  it('preserves custom checkers and is idempotent', async () => {
    await seedWorkspace(tmpDir);
    const path = writePaths(`# Paths

## Workflow docs

- *.plan.md  checker: custom.js, doc-structure.js
`);
    runOp(tmpDir, op, [], false, '9.9.9');
    const second = runOp(tmpDir, op, [], false, '9.9.9');
    expect(second.status).toBe('skipped');
    expect(readFileSync(path, 'utf8')).toContain('custom.js, structure.js, artifact-metadata.js');
  });

  it('adds missing workflow artifact rows without replacing existing rows', async () => {
    await seedWorkspace(tmpDir);
    const path = writePaths(`# Paths

## Workflow docs

- *.plan.md  checker: custom.js, doc-structure.js
`);
    const result = runOp(
      tmpDir,
      {
        ...op,
        rules: [
          {
            glob: '*.plan.md',
            replace: { 'doc-structure.js': 'structure.js' },
            append: ['artifact-metadata.js'],
            checkers: ['links.js', 'structure.js', 'artifact-metadata.js'],
          },
          {
            glob: '*.context.md',
            checkers: ['links.js', 'inputs-fresh.js', 'artifact-metadata.js'],
          },
        ],
      },
      [],
      false,
      '9.9.9',
    );
    expect(result.status).toBe('applied');
    const out = readFileSync(path, 'utf8');
    expect(out).toContain('links.js, structure.js, artifact-metadata.js, custom.js');
    expect(out).toContain('- *.context.md  checker: links.js, inputs-fresh.js, artifact-metadata.js');
  });
});

describe('ops: migrate-artifact-metadata', () => {
  it('migrates workflow plans to universal body metadata and is idempotent', async () => {
    await seedWorkspace(tmpDir);
    const plans = join(tmpDir, '.pythia/workflows/features/feat-2026-05-test/plans');
    mkdirSync(plans, { recursive: true });
    const planPath = join(plans, '1-test.plan.md');
    writeFileSync(planPath, `# Plan 1-test: Test

## Metadata

- **Plan-Id**: 1-test
- **Plan-Version**: v1
- **Status**: Draft
- **Branch**: main
- **Last review round**: none

## Plan revision log

| Version | Round | Date |
| ------- | ----- | ---- |
| v1 | — | 2026-06-21 |
`, 'utf8');

    const op = {
      op: 'migrate-artifact-metadata',
      root: '.pythia/workflows',
      patterns: ['*.plan.md'],
      strict: true,
    };
    const result = runOp(tmpDir, op, [], false, '9.9.9');
    expect(result.status).toBe('applied');
    const out = readFileSync(planPath, 'utf8');
    // v2: list key:value, no Schema/Id/Title/Artifact/Feature
    expect(out).not.toContain('Schema');
    expect(out).not.toContain('Plan-Id');
    expect(out).not.toContain('- **');
    expect(out).toContain('- status: Draft');
    expect(out).toContain('- version: v1');
    expect(runOp(tmpDir, op, [], false, '9.9.9').status).toBe('skipped');
  });

  it('migrates modular metadata scopes outside workflow artifacts', async () => {
    await seedWorkspace(tmpDir);
    const legacyCtx = join(tmpDir, '.pythia/ctx');
    const globalCtx = join(tmpDir, '.pythia/contexts/architecture');
    mkdirSync(legacyCtx, { recursive: true });
    mkdirSync(globalCtx, { recursive: true });
    writeFileSync(join(legacyCtx, 'legacy.ctx.md'), `---
type: ctx
shape: notes
status: ready
tags: context
---
# Legacy Global

Body.
`, 'utf8');
    writeFileSync(join(globalCtx, 'current.context.md'), `---
type: context
shape: notes
status: ready
tags: context
---
# Current Global

Body.
`, 'utf8');

    const result = runOp(
      tmpDir,
      {
        op: 'migrate-artifact-metadata',
        scopes: [
          { name: 'legacy-global-contexts', root: '.pythia/ctx', patterns: ['*.ctx.md'] },
          { name: 'global-contexts', root: '.pythia/contexts', patterns: ['*.context.md'] },
        ],
        strict: true,
      },
      [],
      false,
      '9.9.9',
    );

    expect(result.status).toBe('applied');
    expect(result.changedPaths).toEqual(expect.arrayContaining([
      '.pythia/ctx/legacy.ctx.md',
      '.pythia/contexts/architecture/current.context.md',
    ]));
    // v2: no Schema field, list metadata, no YAML frontmatter
    const legacyOut = readFileSync(join(legacyCtx, 'legacy.ctx.md'), 'utf8');
    const globalOut = readFileSync(join(globalCtx, 'current.context.md'), 'utf8');
    expect(legacyOut).not.toContain('Schema');
    expect(legacyOut).not.toMatch(/^---/m);
    expect(globalOut).not.toContain('Schema');
    expect(globalOut).not.toMatch(/^---/m);
  });
});

// ─── state file ───────────────────────────────────────────────────────────────

describe('state file', () => {
  it('writeState/readState roundtrip', () => {
    const state = {
      migrationVersion: '0.2.0',
      frameworkVersion: '0.2.0',
      changedPaths: ['.pythia/workflows/test.md'],
      appliedSteps: [1],
      llmRemaining: true,
      backups: [{ path: '.pythia/workflows/test.md', backupPath: '.pythia/backups/0.2.0/.pythia/workflows/test.md', sha256: 'abc' }],
    };
    writeState(tmpDir, state, false);
    const read = readState(tmpDir, '0.2.0');
    expect(read).toMatchObject(state);
  });

  it('readState returns null for missing state', () => {
    expect(readState(tmpDir, '9.9.9')).toBeNull();
  });

  it('findUnresolvedMixedStates finds llmRemaining=true states', () => {
    writeState(tmpDir, { migrationVersion: '0.2.0', frameworkVersion: '0.1.0', changedPaths: [], appliedSteps: [], llmRemaining: true, backups: [] }, false);
    const unresolved = findUnresolvedMixedStates(tmpDir);
    expect(unresolved).toHaveLength(1);
    expect(unresolved[0].migrationVersion).toBe('0.2.0');
  });

  it('findUnresolvedMixedStates ignores committed states (llmRemaining=false)', () => {
    writeState(tmpDir, { migrationVersion: '0.1.0', frameworkVersion: '0.1.0', changedPaths: [], appliedSteps: [], llmRemaining: false, backups: [] }, false);
    const unresolved = findUnresolvedMixedStates(tmpDir);
    expect(unresolved).toHaveLength(0);
  });
});

// ─── manifest baseline semantics ──────────────────────────────────────────────

describe('manifest baseline semantics', () => {
  it('fresh empty init: migratedVersion == frameworkVersion', async () => {
    await doInit(makeWorkspaceOpts(tmpDir));
    const m = readManifest(tmpDir);
    expect(m.migratedVersion).toBe(m.frameworkVersion);
  });

  it('adopted: init migrates in-run to frameworkVersion', async () => {
    mkdirSync(join(tmpDir, '.pythia', 'workflows'), { recursive: true });
    writeFileSync(join(tmpDir, '.pythia', 'workflows', 'existing.md'), '# existing');
    await doInit(makeWorkspaceOpts(tmpDir));
    const m = readManifest(tmpDir);
    expect(m.migratedVersion).toBe(m.frameworkVersion);
  });

  it('legacy: version.json without migratedVersion advances to frameworkVersion when no migrations are pending', async () => {
    await doInit(makeWorkspaceOpts(tmpDir));
    const existing = readManifest(tmpDir);
    delete existing.migratedVersion;
    rmSync(join(tmpDir, '.pythia', 'manifest.json'));
    writeFileSync(join(tmpDir, '.pythia', 'version.json'), JSON.stringify(existing));
    // Before update: missing migratedVersion reads as the 0.0.0 default
    expect(readManifest(tmpDir).migratedVersion).toBe('0.0.0');
    await doUpdate(makeWorkspaceOpts(tmpDir));
    const after = readManifest(tmpDir);
    expect(after.migratedVersion).toBe(after.frameworkVersion);
  });

  it('update preserves migratedVersion when already current (no pending migrations)', async () => {
    await doInit(makeWorkspaceOpts(tmpDir));
    writeManifest(tmpDir, { migratedVersion: pkgVersion }, false);
    await doUpdate(makeWorkspaceOpts(tmpDir));
    const m = readManifest(tmpDir);
    expect(m.migratedVersion).toBe(pkgVersion);
  });
});

// ─── update: auto-only migration flow ─────────────────────────────────────────

describe('update: auto-only migration', () => {
  it('applies auto migration, verifies, commits (migratedVersion bumped)', async () => {
    await doInit(makeWorkspaceOpts(tmpDir));
    // Set migratedVersion to 0.0.0 — migration 0.0.1 (< package 0.1.0) will be pending
    writeManifest(tmpDir, { migratedVersion: '0.0.0' }, false);
    // Seed migration runtime manually with version 0.0.1 (in range (0.0.0, 0.1.0])
    const migrDir = join(tmpDir, '.pythia', 'runtime', 'migrations');
    mkdirSync(migrDir, { recursive: true });
    cpSync(join(fixturesDir, 'auto-only-migration.md'), join(migrDir, '0.0.1.md'));

    await doUpdate(makeWorkspaceOpts(tmpDir));

    // Fixture migration 0.0.1 applied and then the successful update marks the workspace current.
    const m = readManifest(tmpDir);
    expect(m.migratedVersion).toBe(m.frameworkVersion);
  });
});

// ─── update: mixed migration flow ─────────────────────────────────────────────

describe('update: mixed migration (auto+llm)', () => {
  it('auto-applies steps, writes llmRemaining=true in state, does NOT commit', async () => {
    await doInit(makeWorkspaceOpts(tmpDir));

    // Seed the runtime migrations dir with the mixed fixture at 0.0.2 (in range (0.0.0, 0.1.0])
    const migrDir = join(tmpDir, '.pythia', 'runtime', 'migrations');
    mkdirSync(migrDir, { recursive: true });
    cpSync(join(fixturesDir, 'mixed-migration.md'), join(migrDir, '0.0.2.md'));

    // Set manifest so 0.0.2 is pending (migratedVersion below it)
    writeManifest(tmpDir, { migratedVersion: '0.0.0' }, false);

    await doUpdate(makeWorkspaceOpts(tmpDir));

    // auto step creates the file with status: draft
    const artifact = join(tmpDir, '.pythia', 'workflows', 'migration-test-artifact.md');
    expect(existsSync(artifact)).toBe(true);
    const content = readFileSync(artifact, 'utf8');
    expect(content).toContain('status: draft');
    expect(content).toContain('PLACEHOLDER');

    // state.json must exist with llmRemaining: true
    const state = readState(tmpDir, '0.0.2');
    expect(state).not.toBeNull();
    expect(state.llmRemaining).toBe(true);

    // The mixed migration 0.0.2 is NOT committed — it stays as an unresolved mixed state.
    expect(findUnresolvedMixedStates(tmpDir).map((s) => s.migrationVersion)).toContain('0.0.2');
  });

  it('update CLI exits 1 when unresolved mixed state exists', async () => {
    await doInit(makeWorkspaceOpts(tmpDir));

    writeState(tmpDir, {
      migrationVersion: '0.2.0',
      frameworkVersion: '0.1.0',
      changedPaths: ['.pythia/workflows/migration-test-artifact.md'],
      appliedSteps: [1],
      llmRemaining: true,
      backups: [],
    }, false);
    writeManifest(tmpDir, { migratedVersion: '0.0.0', frameworkVersion: '0.1.0' }, false);

    const indexJs = resolve(packageRoot, 'tools/cli/index.js');
    const r = spawnSync('node', [indexJs, 'update', tmpDir, '--yes'], {
      encoding: 'utf8',
      cwd: packageRoot,
    });
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/BLOCKED/);
    expect(findUnresolvedMixedStates(tmpDir)).toHaveLength(1);
  });
});

// ─── one-step update of a pre-existing (no-manifest) .pythia ───────────────────

describe('one-step update: old .pythia without manifest', () => {
  it('adopts + materializes + seeds base files in one update', async () => {
    // Simulate an old workspace: .pythia/workflows with content, NO manifest.json.
    mkdirSync(join(tmpDir, '.pythia', 'workflows'), { recursive: true });
    writeFileSync(join(tmpDir, '.pythia', 'workflows', 'old.md'), 'pre-existing artifact', 'utf8');
    expect(existsSync(join(tmpDir, '.pythia', 'manifest.json'))).toBe(false);

    await doUpdate(makeWorkspaceOpts(tmpDir));

    const m = readManifest(tmpDir);
    // doUpdate seeds base files directly (config.md/README.md/workflows/.gitkeep), code-level — not a migration.
    expect(existsSync(join(tmpDir, '.pythia', 'config', 'settings.md'))).toBe(true);
    expect(existsSync(join(tmpDir, '.pythia', 'README.md'))).toBe(true);
    // adopted starts from 0.0.0, then advances to frameworkVersion because no migrations remain pending.
    expect(m.migratedVersion).toBe(m.frameworkVersion);
    // runtime materialized, user artifact preserved
    expect(existsSync(join(tmpDir, '.pythia', 'runtime', 'migrate', 'status.js'))).toBe(true);
    expect(existsSync(join(tmpDir, '.pythia', 'workflows', 'old.md'))).toBe(true);
  });

  it('adopts a workspace with pre-existing content outside workflows/ (e.g. stale config.md, no workflow files)', async () => {
    // Migration zone covers all of .pythia/, not just workflows/ — adoption detection must match.
    mkdirSync(join(tmpDir, '.pythia', 'config'), { recursive: true });
    writeFileSync(join(tmpDir, '.pythia', 'config', 'settings.md'), 'stale pre-existing config', 'utf8');
    expect(existsSync(join(tmpDir, '.pythia', 'manifest.json'))).toBe(false);

    await doUpdate(makeWorkspaceOpts(tmpDir));

    const m = readManifest(tmpDir);
    // pre-existing config.md (outside workflows/) still counts as adopted, then advances after successful update.
    expect(m.migratedVersion).toBe(m.frameworkVersion);
    // seedIfMissing must not clobber the pre-existing file
    expect(readFileSync(join(tmpDir, '.pythia', 'config', 'settings.md'), 'utf8')).toBe('stale pre-existing config');
  });

  it('re-running update is a no-op (idempotent)', async () => {
    spawnSync('git', ['init', tmpDir], { encoding: 'utf8' });
    spawnSync('git', ['-C', tmpDir, 'config', 'user.email', 'test@test.com'], { encoding: 'utf8' });
    spawnSync('git', ['-C', tmpDir, 'config', 'user.name', 'Test'], { encoding: 'utf8' });
    mkdirSync(join(tmpDir, '.pythia', 'workflows'), { recursive: true });
    await doUpdate(makeWorkspaceOpts(tmpDir));
    const after1 = readFileSync(join(tmpDir, '.pythia', 'config', 'settings.md'), 'utf8');
    await doUpdate(makeWorkspaceOpts(tmpDir));
    const after2 = readFileSync(join(tmpDir, '.pythia', 'config', 'settings.md'), 'utf8');
    expect(after2).toBe(after1); // seed not overwritten
    const m = readManifest(tmpDir);
    // pre-existing workflows/ dir (even empty) counts as adopted; successful update marks it current.
    expect(m.migratedVersion).toBe(m.frameworkVersion);
  }, 30_000);

  it('generated .pythia/package.json has no --target and migrate:status works', async () => {
    mkdirSync(join(tmpDir, '.pythia', 'workflows'), { recursive: true });
    await doUpdate(makeWorkspaceOpts(tmpDir));
    const pkg = JSON.parse(readFileSync(join(tmpDir, '.pythia', 'package.json'), 'utf8'));
    for (const script of Object.values(pkg.scripts)) {
      expect(script).not.toContain('--target');
    }
    const result = spawnSync('npm', ['--prefix', join(tmpDir, '.pythia'), 'run', 'migrate:status'], {
      cwd: tmpDir, encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    expect(result.stdout + result.stderr).toContain('No pending migrations');
  });
});

// ─── post-update skill handoff via local materialized runtime ─────────────────

describe('skill handoff: complete llm step via materialized .pythia/runtime', () => {
  it('read state → apply llm step → npm --prefix .pythia run migrate:verify → migrate:commit', async () => {
    // Plant the mixed fixture in an isolated copy of the package root — not the real
    // assets/migrations/ tree — so concurrently-running test files (Vitest runs test
    // files in parallel by default) never observe this fixture migration.
    const fakeRoot = mkdtempSync(join(tmpdir(), 'pythia-fakeroot-'));
    cpSync(packageRoot, fakeRoot, {
      recursive: true,
      filter: (src) => !src.includes('node_modules') && !src.includes('__tests__') && !/(^|\/)\.git(\/|$)/.test(src),
    });
    const fixtPath = join(fakeRoot, 'assets', 'migrations', '0.0.2.md');
    const fakeOpts = (target) => ({ target, dryRun: false, packageRoot: fakeRoot });
    try {
      await doInit(fakeOpts(tmpDir));
      // Plant fixture migration after init so init's 0.0.0 baseline does not consume it early.
      writeFileSync(fixtPath, readFileSync(join(fixturesDir, 'mixed-migration.md'), 'utf8'));
      writeManifest(tmpDir, { migratedVersion: '0.0.0' }, false);

      // doUpdate materializes .pythia/runtime/ and applies auto steps of 0.0.2
      await doUpdate(fakeOpts(tmpDir));

      const artifact = join(tmpDir, '.pythia', 'workflows', 'migration-test-artifact.md');
      expect(existsSync(artifact)).toBe(true);

      const state = readState(tmpDir, '0.0.2');
      expect(state.llmRemaining).toBe(true);
      expect(readManifest(tmpDir).migratedVersion).toBe('0.0.0'); // not yet committed

      // Skill: apply the llm step (fixture Step 2: set status: active, remove PLACEHOLDER)
      writeFileSync(artifact, '---\nstatus: active\n---\n\n# Migration complete.\n', 'utf8');

      // Verify via materialized local runtime (no source package needed)
      const verifyResult = spawnSync(
        'npm', ['--prefix', join(tmpDir, '.pythia'), 'run', 'migrate:verify', '--', '0.0.2'],
        { cwd: tmpDir, encoding: 'utf8' }
      );
      expect(verifyResult.status).toBe(0);
      expect(verifyResult.stdout + verifyResult.stderr).toContain('verify 0.0.2: OK');

      // Commit via materialized local runtime
      const commitResult = spawnSync(
        'npm', ['--prefix', join(tmpDir, '.pythia'), 'run', 'migrate:commit', '--', '0.0.2'],
        { cwd: tmpDir, encoding: 'utf8' }
      );
      expect(commitResult.status).toBe(0);

      expect(readManifest(tmpDir).migratedVersion).toBe('0.0.2');
      expect(findUnresolvedMixedStates(tmpDir)).toHaveLength(0);
    } finally {
      rmSync(fakeRoot, { recursive: true, force: true });
    }
  });
});

// ─── verify: invalid workflow doc fails closed ────────────────────────────────

describe('verify: invalid workflow doc fails closed via materialized runtime', () => {
  it('schema-tagged .plan.md missing required metadata exits 1', async () => {
    await doInit(makeWorkspaceOpts(tmpDir));
    await doUpdate(makeWorkspaceOpts(tmpDir));

    const m = readManifest(tmpDir);
    const fwVersion = m.frameworkVersion;

    const planDir = join(tmpDir, '.pythia', 'workflows', 'features', 'schema', 'plans');
    mkdirSync(planDir, { recursive: true });
    const weakPlan = join(planDir, 'schema-weak.plan.md');
    writeFileSync(weakPlan, `# Plan schema-weak: Schema Weak

## Metadata

- **Schema**: pythia-artifact-v1
- **Id**: schema-weak
- **Title**: Schema Weak
- **Artifact**: plan

## Plan revision log

| Version | Round | Date |
| --- | --- | --- |
| v1 | - | 2026-06-21 |

## Navigation

Plan: [Step 1: x](#step-1-x)

## Context

x

## Goal

x

## Plan

### Step 1: x

- **Change**: x
- **Where**: x
- **Validation**: x
- **Acceptance**: x

## Acceptance Criteria

- [ ] x
`);

    writeState(tmpDir, {
      migrationVersion: '0.0.6',
      frameworkVersion: fwVersion,
      changedPaths: ['.pythia/workflows/features/schema/plans/schema-weak.plan.md'],
      appliedSteps: [],
      llmRemaining: false,
      backups: [],
    }, false);

    const result = spawnSync(
      'npm', ['--prefix', join(tmpDir, '.pythia'), 'run', 'migrate:verify', '--', '0.0.6'],
      { cwd: tmpDir, encoding: 'utf8' }
    );
    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).toContain('[FAIL]');
    // v2: Schema is a forbidden key — verify rejects it regardless of other fields
    expect(result.stdout + result.stderr).toMatch(/forbidden v2 metadata key: Schema/);
  });

  it('v2-shaped .plan.md with all required fields passes migration verify', async () => {
    await doInit(makeWorkspaceOpts(tmpDir));
    await doUpdate(makeWorkspaceOpts(tmpDir));

    const m = readManifest(tmpDir);
    const fwVersion = m.frameworkVersion;

    const planDir = join(tmpDir, '.pythia', 'workflows', 'features', 'schema', 'plans');
    mkdirSync(planDir, { recursive: true });
    const plan = join(planDir, 'schema-legacy-fields.plan.md');
    writeFileSync(plan, `# Plan schema-legacy-fields: Schema Legacy Fields

## Metadata

- status: Draft
- version: v1
- branch: main
- updated: 2026-06-21

## Plan revision log

| Version | Round | Date |
| --- | --- | --- |
| v1 | none | 2026-06-21 |

## Navigation

Plan: [Step 1: x](#step-1-x)

## Context

x

## Goal

x

## Plan

### Step 1: x

- **Change**: x
- **Where**: x
- **Validation**: x
- **Acceptance**: x

## Acceptance Criteria

- [ ] x
`);

    writeState(tmpDir, {
      migrationVersion: '0.0.6',
      frameworkVersion: fwVersion,
      changedPaths: ['.pythia/workflows/features/schema/plans/schema-legacy-fields.plan.md'],
      appliedSteps: [],
      llmRemaining: false,
      backups: [],
    }, false);

    const result = spawnSync(
      'npm', ['--prefix', join(tmpDir, '.pythia'), 'run', 'migrate:verify', '--', '0.0.6'],
      { cwd: tmpDir, encoding: 'utf8' }
    );
    expect(result.status).toBe(0);
    expect(result.stdout + result.stderr).toContain('verify 0.0.6: OK');
  });

  it('marker-bearing malformed .plan.md (has ## Goal but missing required sections) exits 1', async () => {
    await doInit(makeWorkspaceOpts(tmpDir));
    await doUpdate(makeWorkspaceOpts(tmpDir)); // materializes .pythia/runtime/

    const m = readManifest(tmpDir);
    const fwVersion = m.frameworkVersion;

    const planDir = join(tmpDir, '.pythia', 'workflows', 'features', 'f', 'plans');
    mkdirSync(planDir, { recursive: true });
    const weakPlan = join(planDir, 'weak.plan.md');
    // Has ## Goal (would fool the old marker-only check) but missing ## Metadata, ## Context, ## Plan, etc.
    writeFileSync(weakPlan, '# Weak Plan\n\n## Goal\n\nDo something.\n');

    writeState(tmpDir, {
      migrationVersion: '0.0.3',
      frameworkVersion: fwVersion,
      changedPaths: ['.pythia/workflows/features/f/plans/weak.plan.md'],
      appliedSteps: [],
      llmRemaining: false,
      backups: [],
    }, false);

    const result = spawnSync(
      'npm', ['--prefix', join(tmpDir, '.pythia'), 'run', 'migrate:verify', '--', '0.0.3'],
      { cwd: tmpDir, encoding: 'utf8' }
    );
    expect(result.status).toBe(1);
    expect(result.stdout + result.stderr).toContain('[FAIL]');
    expect(result.stdout + result.stderr).toContain('## Metadata');
  });

  it('completely headingless .plan.md exits 1', async () => {
    await doInit(makeWorkspaceOpts(tmpDir));
    await doUpdate(makeWorkspaceOpts(tmpDir));

    const m = readManifest(tmpDir);
    const fwVersion = m.frameworkVersion;

    const planDir = join(tmpDir, '.pythia', 'workflows', 'features', 'g', 'plans');
    mkdirSync(planDir, { recursive: true });
    const badPlan = join(planDir, 'bad.plan.md');
    writeFileSync(badPlan, 'just invalid text without any markdown headings\n');

    writeState(tmpDir, {
      migrationVersion: '0.0.5',
      frameworkVersion: fwVersion,
      changedPaths: ['.pythia/workflows/features/g/plans/bad.plan.md'],
      appliedSteps: [],
      llmRemaining: false,
      backups: [],
    }, false);

    const result = spawnSync(
      'npm', ['--prefix', join(tmpDir, '.pythia'), 'run', 'migrate:verify', '--', '0.0.5'],
      { cwd: tmpDir, encoding: 'utf8' }
    );
    expect(result.status).toBe(1);
  });

  it('generic non-workflow file passes existence-only check', async () => {
    await doInit(makeWorkspaceOpts(tmpDir));
    await doUpdate(makeWorkspaceOpts(tmpDir));

    const m = readManifest(tmpDir);
    const fwVersion = m.frameworkVersion;

    const genericDir = join(tmpDir, '.pythia', 'workflows', 'data');
    mkdirSync(genericDir, { recursive: true });
    writeFileSync(join(genericDir, 'config.json'), '{}');

    writeState(tmpDir, {
      migrationVersion: '0.0.6',
      frameworkVersion: fwVersion,
      changedPaths: ['.pythia/workflows/data/config.json'],
      appliedSteps: [],
      llmRemaining: false,
      backups: [],
    }, false);

    const result = spawnSync(
      'npm', ['--prefix', join(tmpDir, '.pythia'), 'run', 'migrate:verify', '--', '0.0.6'],
      { cwd: tmpDir, encoding: 'utf8' }
    );
    expect(result.status).toBe(0);
  });
});

// ─── release staging ──────────────────────────────────────────────────────────

describe('release staging: npm pack excludes next.md', () => {
  it('next.md excluded, versioned migration included, __tests__/ excluded from pack output', () => {
    // Copy the package to a temp dir so we never write to real assets/migrations/
    const tmpPkg = mkdtempSync(join(tmpdir(), 'pythia-npmpack-'));
    const cacheDir = mkdtempSync(join(tmpdir(), 'npm-pack-cache-'));
    try {
      cpSync(packageRoot, tmpPkg, {
        recursive: true, force: true,
        filter: (s) => !s.includes('node_modules') && !/(^|\/)\.git(\/|$)/.test(s),
      });
      writeFileSync(join(tmpPkg, 'assets', 'migrations', '99.0.0.md'), '# Migration 99.0.0\n', 'utf8');
      const result = spawnSync('npm', ['pack', '--dry-run', '--cache', cacheDir], {
        cwd: tmpPkg,
        encoding: 'utf8',
      });
      expect(result.status).toBe(0);
      const output = result.stdout + result.stderr;
      expect(output).not.toContain('next.md');
      expect(output).toContain('migrations/99.0.0.md');
      expect(output).not.toContain('__tests__');
    } finally {
      rmSync(tmpPkg, { recursive: true, force: true });
      rmSync(cacheDir, { recursive: true, force: true });
    }
  });

  it('release:check-migrations fails when next.md has unreleased steps', () => {
    const tmpPkg = mkdtempSync(join(tmpdir(), 'pythia-relcheck-'));
    try {
      mkdirSync(join(tmpPkg, 'tools', 'release'), { recursive: true });
      mkdirSync(join(tmpPkg, 'assets', 'migrations'), { recursive: true });
      cpSync(join(packageRoot, 'tools/release/check-migrations.js'), join(tmpPkg, 'tools/release/check-migrations.js'));
      writeFileSync(join(tmpPkg, 'package.json'), JSON.stringify({ version: '9.9.9' }));
      writeFileSync(join(tmpPkg, 'assets', 'migrations', 'next.md'),
        '# Migration next\n\n## Step 1\n\nUnreleased step.\n');
      const result = spawnSync('node', ['tools/release/check-migrations.js'], {
        cwd: tmpPkg, encoding: 'utf8',
      });
      expect(result.status).toBe(1);
      expect(result.stdout + result.stderr).toContain('unreleased steps');
    } finally {
      rmSync(tmpPkg, { recursive: true, force: true });
    }
  });

  it('release:check-migrations passes when next.md has no steps', () => {
    const tmpPkg = mkdtempSync(join(tmpdir(), 'pythia-relcheck-'));
    try {
      mkdirSync(join(tmpPkg, 'tools', 'release'), { recursive: true });
      mkdirSync(join(tmpPkg, 'assets', 'migrations'), { recursive: true });
      cpSync(join(packageRoot, 'tools/release/check-migrations.js'), join(tmpPkg, 'tools/release/check-migrations.js'));
      writeFileSync(join(tmpPkg, 'package.json'), JSON.stringify({ version: '9.9.9' }));
      writeFileSync(join(tmpPkg, 'assets', 'migrations', 'next.md'),
        '# Migration next\n\n<!-- no steps -->\n');
      const result = spawnSync('node', ['tools/release/check-migrations.js'], {
        cwd: tmpPkg, encoding: 'utf8',
      });
      expect(result.status).toBe(0);
      expect(result.stdout + result.stderr).toContain('OK');
    } finally {
      rmSync(tmpPkg, { recursive: true, force: true });
    }
  });
});

// ─── migration parser ──────────────────────────────────────────────────────────

describe('migration parser', () => {
  it('parses auto-only migration', () => {
    const content = readFileSync(join(fixturesDir, 'auto-only-migration.md'), 'utf8');
    const steps = parseMigration(content);
    expect(steps).toHaveLength(1);
    expect(steps[0].kind).toBe('auto');
    expect(steps[0].op.op).toBe('ensure-dir');
    expect(migrationHasLlm(steps)).toBe(false);
  });

  it('parses mixed migration with llm step', () => {
    const content = readFileSync(join(fixturesDir, 'mixed-migration.md'), 'utf8');
    const steps = parseMigration(content);
    expect(steps).toHaveLength(2);
    expect(steps[0].kind).toBe('auto');
    expect(steps[1].kind).toBe('llm');
    expect(migrationHasLlm(steps)).toBe(true);
  });

  it('parses JSON auto op blocks', () => {
    const content = `# Migration next

## Step 1

**Target**: \`.pythia/config/paths.md\`
**Kind**: auto
**Check**: test

**Op:**
\`\`\`json
{
  "op": "merge-checker-basenames",
  "path": ".pythia/config/paths.md",
  "section": "Workflow docs",
  "rules": [{ "glob": "*.plan.md", "append": ["artifact-metadata.js"] }]
}
\`\`\`
`;
    const steps = parseMigration(content);
    expect(steps).toHaveLength(1);
    expect(steps[0].op.rules[0].append).toEqual(['artifact-metadata.js']);
  });
});
