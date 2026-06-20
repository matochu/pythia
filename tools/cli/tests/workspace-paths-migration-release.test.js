/**
 * Release migration: staging next.md → versioned assets/migrations/<release>.md,
 * update on tmp .pythia (legacy paths.md, modern config/ layout). Versions derived from package.json.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync, rmSync, existsSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { doInit, doUpdate, readManifest } from '../workspace.js';
import { initGit, packageRoot } from './helpers/workspace.js';
import { hasHooksHardeningPaths, hasInputsFreshnessPostCommands } from './helpers/paths-md.js';
import {
  resolveReleaseMigrationVersions,
  hasStagingNextMigration,
  materializeReleasePackage,
  preparePythiaPreRelease,
} from './helpers/release-migration.js';
import { parseZones, zone } from '../../lib/paths.js';

const { priorVersion: PRIOR_VERSION, releaseVersion: RELEASE_VERSION } =
  resolveReleaseMigrationVersions();

const workspaces = [];
let fakePackageRoot;

afterEach(() => {
  while (workspaces.length) {
    rmSync(workspaces.pop(), { recursive: true, force: true });
  }
  if (fakePackageRoot) {
    rmSync(fakePackageRoot, { recursive: true, force: true });
    fakePackageRoot = undefined;
  }
});

function opts(target) {
  return { target, packageRoot: fakePackageRoot, yes: true };
}

async function workspacePreRelease(pathsVariant = 'old') {
  fakePackageRoot = materializeReleasePackage(RELEASE_VERSION);
  const dir = mkdtempSync(join(tmpdir(), 'pythia-ws-release-mig-'));
  workspaces.push(dir);
  initGit(dir);
  await doInit(opts(dir));
  preparePythiaPreRelease(dir, { priorVersion: PRIOR_VERSION, pathsVariant });
  return dir;
}

const describeRelease = hasStagingNextMigration() ? describe : describe.skip;

describeRelease(`release migration ${PRIOR_VERSION} → ${RELEASE_VERSION} (staging next.md)`, () => {
  it('update applies staging next.md on legacy paths.md (config/ layout already current)', async () => {
    const ws = await workspacePreRelease();
    const migrMaterialized = join(ws, '.pythia/runtime/migrations', `${RELEASE_VERSION}.md`);
    const before = readFileSync(join(ws, '.pythia/config/paths.md'), 'utf8');

    expect(hasHooksHardeningPaths(before)).toBe(false);
    expect(readManifest(ws).migratedVersion).toBe(PRIOR_VERSION);

    await doUpdate(opts(ws));

    expect(existsSync(migrMaterialized)).toBe(true);
    const after = readFileSync(join(ws, '.pythia/config/paths.md'), 'utf8');
    expect(hasHooksHardeningPaths(after)).toBe(true);
    expect(after).toContain('role-boundary.js');
    expect(after).toContain('*.context.md');
    expect(after).not.toContain('tools/checks/doc-structure.js');

    const docs = zone(parseZones(after), 'Workflow docs');
    expect(docs).toHaveLength(7);
    expect(docs.find((d) => d.path === '*.plan.md')?.checker).toContain('plan-version-log.js');

    const manifest = readManifest(ws);
    expect(manifest.migratedVersion).toBe(RELEASE_VERSION);
    expect(manifest.frameworkVersion).toBe(RELEASE_VERSION);
    expect(hasInputsFreshnessPostCommands(after)).toBe(true);
  });

  it('update migrates legacy workflow inputs: via sync-legacy-inputs (tmp workspace)', async () => {
    const ws = await workspacePreRelease();
    const featDir = join(ws, '.pythia/workflows/features/feat-mig-test');
    const ctxDir = join(featDir, 'contexts');
    mkdirSync(ctxDir, { recursive: true });
    writeFileSync(join(featDir, 'contexts/dep.md'), 'dep body\n', 'utf8');
    writeFileSync(
      join(featDir, 'contexts/legacy.context.md'),
      `---
inputs:
  - .pythia/workflows/features/feat-mig-test/contexts/dep.md:00000000
---
# Legacy context

See [dep](./dep.md).
`,
      'utf8',
    );

    await doUpdate(opts(ws));

    const migrated = readFileSync(join(featDir, 'contexts/legacy.context.md'), 'utf8');
    expect(migrated).not.toMatch(/^inputs:/m);
    expect(migrated).not.toMatch(/^---\s*\n---/m);
    expect(migrated).toContain('## References');
    expect(migrated).toMatch(/dep\.md#[0-9a-f]{5}/);

    const inputsJs = join(ws, '.pythia/runtime/inputs.js');
    expect(existsSync(inputsJs)).toBe(true);
    const check = spawnSync(
      process.execPath,
      [inputsJs, 'check', join(featDir, 'contexts/legacy.context.md')],
      { encoding: 'utf8', cwd: ws },
    );
    expect(check.status).toBe(0);
    expect(check.stdout).not.toMatch(/STALE/);
  });

  it('update materialized runtime sync works on workflow doc in tmp workspace', async () => {
    const ws = await workspacePreRelease();
    await doUpdate(opts(ws));

    const planDir = join(ws, '.pythia/workflows/features/feat-sync/plans');
    mkdirSync(planDir, { recursive: true });
    writeFileSync(join(planDir, 'dep.md'), 'dep\n', 'utf8');
    const planPath = join(planDir, '1-test.plan.md');
    writeFileSync(planPath, '# Plan\n\n[dep](./dep.md)\n', 'utf8');

    const sync = spawnSync(process.execPath, [join(ws, '.pythia/runtime/inputs.js'), 'sync', planPath], {
      encoding: 'utf8',
      cwd: ws,
    });
    expect(sync.status).toBe(0);
    expect(readFileSync(planPath, 'utf8')).toContain('## References');
    const check = spawnSync(process.execPath, [join(ws, '.pythia/runtime/inputs.js'), 'check', planPath], {
      encoding: 'utf8',
      cwd: ws,
    });
    expect(check.status).toBe(0);
  });

  it('second update is idempotent after release migration', async () => {
    const ws = await workspacePreRelease();
    await doUpdate(opts(ws));
    const afterFirst = readFileSync(join(ws, '.pythia/config/paths.md'), 'utf8');
    await doUpdate(opts(ws));
    expect(readFileSync(join(ws, '.pythia/config/paths.md'), 'utf8')).toBe(afterFirst);
    expect(readManifest(ws).migratedVersion).toBe(RELEASE_VERSION);
  });

  it('materializes package-paths.md and runtime hooks after update', async () => {
    const ws = await workspacePreRelease();
    await doUpdate(opts(ws));
    expect(existsSync(join(ws, '.pythia/runtime/package-paths.md'))).toBe(true);
    expect(existsSync(join(ws, '.pythia/runtime/hooks/post.js'))).toBe(true);
    expect(readFileSync(join(ws, '.pythia/runtime/package-paths.md'), 'utf8')).toContain(
      'role-boundary.js',
    );
  });

  it('upgrades basename-only Workflow docs via replace-section', async () => {
    const ws = await workspacePreRelease('old-basename');
    await doUpdate(opts(ws));
    const after = readFileSync(join(ws, '.pythia/config/paths.md'), 'utf8');
    expect(hasHooksHardeningPaths(after)).toBe(true);
    expect(after).toContain('role-boundary.js');
    expect(after).not.toContain('tools/checks/doc-structure.js');
  });
});

describe('release migration version resolver', () => {
  it('derives prior from package.json and release as next patch', () => {
    const pkg = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
    const { priorVersion, releaseVersion } = resolveReleaseMigrationVersions();
    expect(priorVersion).toMatch(/^\d+\.\d+\.\d+$/);
    expect(releaseVersion).toMatch(/^\d+\.\d+\.\d+$/);
    if (!pkg.version.includes('-')) {
      expect(priorVersion).toBe(pkg.version);
    }
    const [pm, pn, pp] = priorVersion.split('.').map(Number);
    expect(releaseVersion).toBe(`${pm}.${pn}.${pp + 1}`);
  });
});
