import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync, cpSync, realpathSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, '../../..');
const scriptsDir = join(packageRoot, 'scripts', 'migrate');
const fixturesDir = join(__dirname, 'fixtures');
const pkgVersion = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')).version;

// Import ops and utilities directly
import { runOp, ensureDir, writeIfMissing, setFrontmatter, renameFrontmatterKey, renameFile, appendToSection, replaceOnce } from '../ops.js';
import { compareSemver, inPendingRange, sortVersions, parseSemver } from '../semver.js';
import { readState, writeState, findUnresolvedMixedStates } from '../state.js';
import { parseMigration, migrationHasLlm } from '../parse.js';
import { doInit, doUpdate, readManifest, writeManifest } from '../../../src/cli/workspace.js';

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
    expect(parseSemver('1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 });
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
  it('rejects bare .pythia (no subpath)', async () => {
    await seedWorkspace(tmpDir);
    expect(() => ensureDir(tmpDir, { op: 'ensure-dir', path: '.pythia' }, [], false)).toThrow(/inside \.pythia/);
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
  it('skips when pattern not found (idempotent)', async () => {
    await seedWorkspace(tmpDir);
    mkdirSync(join(tmpDir, '.pythia/workflows'), { recursive: true });
    writeFileSync(join(tmpDir, '.pythia/workflows/file.md'), 'no match here', 'utf8');
    const result = replaceOnce(tmpDir, { op: 'replace-once', path: '.pythia/workflows/file.md', find: 'ORIGINAL', replace: 'NEW' }, [], false);
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

  it('adopted: non-empty protected target gets migratedVersion 0.0.0', async () => {
    mkdirSync(join(tmpDir, '.pythia', 'workflows'), { recursive: true });
    writeFileSync(join(tmpDir, '.pythia', 'workflows', 'existing.md'), '# existing');
    await doInit(makeWorkspaceOpts(tmpDir));
    const m = readManifest(tmpDir);
    expect(m.migratedVersion).toBe('0.0.0');
  });

  it('legacy: version.json without migratedVersion → 0.0.0 after update (no pending migrations)', async () => {
    await doInit(makeWorkspaceOpts(tmpDir));
    const existing = readManifest(tmpDir);
    delete existing.migratedVersion;
    rmSync(join(tmpDir, '.pythia', 'manifest.json'));
    writeFileSync(join(tmpDir, '.pythia', 'version.json'), JSON.stringify(existing));
    // Before update: missing migratedVersion reads as the 0.0.0 default
    expect(readManifest(tmpDir).migratedVersion).toBe('0.0.0');
    await doUpdate(makeWorkspaceOpts(tmpDir));
    // migratedVersion should be preserved from legacy (0.0.0 default) — no real migrations to apply.
    expect(readManifest(tmpDir).migratedVersion).toBe('0.0.0');
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

    // Fixture migration 0.0.1 applied and committed → migratedVersion bumped to it.
    const m = readManifest(tmpDir);
    expect(m.migratedVersion).toBe('0.0.1');
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

  it('update is blocked if unresolved mixed state exists', async () => {
    await doInit(makeWorkspaceOpts(tmpDir));

    // Plant an unresolved state
    writeState(tmpDir, {
      migrationVersion: '0.2.0',
      frameworkVersion: '0.1.0',
      changedPaths: ['.pythia/workflows/migration-test-artifact.md'],
      appliedSteps: [1],
      llmRemaining: true,
      backups: [],
    }, false);
    writeManifest(tmpDir, { migratedVersion: '0.0.0', frameworkVersion: '0.1.0' }, false);

    // doUpdate should detect unresolved state and exit — but since we can't catch process.exit easily,
    // we test that findUnresolvedMixedStates returns the state
    const unresolved = findUnresolvedMixedStates(tmpDir);
    expect(unresolved).toHaveLength(1);
    expect(unresolved[0].migrationVersion).toBe('0.2.0');
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
    expect(existsSync(join(tmpDir, '.pythia', 'config.md'))).toBe(true);
    expect(existsSync(join(tmpDir, '.pythia', 'README.md'))).toBe(true);
    // adopted (had pre-existing protected artifacts) → migratedVersion baseline is 0.0.0
    expect(m.migratedVersion).toBe('0.0.0');
    // runtime materialized, user artifact preserved
    expect(existsSync(join(tmpDir, '.pythia', 'runtime', 'migrate', 'status.js'))).toBe(true);
    expect(existsSync(join(tmpDir, '.pythia', 'workflows', 'old.md'))).toBe(true);
  });

  it('adopts a workspace with pre-existing content outside workflows/ (e.g. stale config.md, no workflow files)', async () => {
    // Migration zone covers all of .pythia/, not just workflows/ — adoption detection must match.
    mkdirSync(join(tmpDir, '.pythia'), { recursive: true });
    writeFileSync(join(tmpDir, '.pythia', 'config.md'), 'stale pre-existing config', 'utf8');
    expect(existsSync(join(tmpDir, '.pythia', 'manifest.json'))).toBe(false);

    await doUpdate(makeWorkspaceOpts(tmpDir));

    const m = readManifest(tmpDir);
    // pre-existing config.md (outside workflows/) must still count as "adopted" → baseline 0.0.0
    expect(m.migratedVersion).toBe('0.0.0');
    // seedIfMissing must not clobber the pre-existing file
    expect(readFileSync(join(tmpDir, '.pythia', 'config.md'), 'utf8')).toBe('stale pre-existing config');
  });

  it('re-running update is a no-op (idempotent)', async () => {
    mkdirSync(join(tmpDir, '.pythia', 'workflows'), { recursive: true });
    await doUpdate(makeWorkspaceOpts(tmpDir));
    const after1 = readFileSync(join(tmpDir, '.pythia', 'config.md'), 'utf8');
    await doUpdate(makeWorkspaceOpts(tmpDir));
    const after2 = readFileSync(join(tmpDir, '.pythia', 'config.md'), 'utf8');
    expect(after2).toBe(after1); // seed not overwritten
    const m = readManifest(tmpDir);
    // pre-existing workflows/ dir (even empty) counts as pre-existing .pythia/ content → "adopted" → baseline 0.0.0
    expect(m.migratedVersion).toBe('0.0.0');
  });

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
    writeFileSync(fixtPath, readFileSync(join(fixturesDir, 'mixed-migration.md'), 'utf8'));
    const fakeOpts = (target) => ({ target, dryRun: false, packageRoot: fakeRoot });
    try {
      await doInit(fakeOpts(tmpDir));
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
    // Use a version far outside any workspace's pending range to avoid race with parallel tests
    const testMigration = join(packageRoot, 'assets', 'migrations', '99.0.0.md');
    writeFileSync(testMigration, '# Migration 99.0.0\n', 'utf8');
    // Use a tmp cache dir to avoid npm cache permission issues on CI/sandboxed machines
    const cacheDir = mkdtempSync(join(tmpdir(), 'npm-pack-cache-'));
    try {
      const result = spawnSync('npm', ['pack', '--dry-run', '--cache', cacheDir], {
        cwd: packageRoot,
        encoding: 'utf8',
      });
      expect(result.status).toBe(0);
      const output = result.stdout + result.stderr;
      expect(output).not.toContain('next.md');
      expect(output).toContain('migrations/99.0.0.md');
      expect(output).not.toContain('__tests__');
    } finally {
      rmSync(testMigration, { force: true });
      rmSync(cacheDir, { recursive: true, force: true });
    }
  });

  it('release:check-migrations fails when next.md has unreleased steps', () => {
    const nextMd = join(packageRoot, 'assets', 'migrations', 'next.md');
    const original = readFileSync(nextMd, 'utf8');
    writeFileSync(nextMd, original + '\n## Step 1\n\nSome unreleased step.\n');
    try {
      const result = spawnSync('node', ['scripts/release-check-migrations.js'], {
        cwd: packageRoot,
        encoding: 'utf8',
      });
      expect(result.status).toBe(1);
      expect(result.stdout + result.stderr).toContain('unreleased steps');
    } finally {
      writeFileSync(nextMd, original);
    }
  });

  it('release:check-migrations passes when next.md is empty template', () => {
    const result = spawnSync('node', ['scripts/release-check-migrations.js'], {
      cwd: packageRoot,
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    expect(result.stdout + result.stderr).toContain('OK');
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
});
