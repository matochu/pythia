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
import { hasHooksHardeningPaths } from './helpers/paths-md.js';
import {
  resolveReleaseMigrationVersions,
  hasStagingNextMigration,
  materializeReleasePackage,
  preparePythiaPreRelease,
} from './helpers/release-migration.js';
import {
  featureWorkflowDir,
  TEST_FEATURE_ID_MIG,
  TEST_FEATURE_ID_SYNC,
} from './helpers/workflow-paths.js';
import {
  auditArtifactMetadataMigration,
  formatArtifactMetadataAudit,
  newlyConvertedFiles,
  seedLegacyArtifactMetadataCorpus,
} from './helpers/artifact-metadata-migration-audit.js';
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
  });

  it('update migrates legacy workflow inputs: via sync-legacy-inputs (tmp workspace)', async () => {
    const ws = await workspacePreRelease();
    const featDir = featureWorkflowDir(ws, TEST_FEATURE_ID_MIG);
    const ctxDir = join(featDir, 'contexts');
    mkdirSync(ctxDir, { recursive: true });
    writeFileSync(join(featDir, 'contexts/dep.md'), 'dep body\n', 'utf8');
    writeFileSync(
      join(featDir, 'contexts/legacy.context.md'),
      `---
inputs:
  - .pythia/workflows/features/${TEST_FEATURE_ID_MIG}/contexts/dep.md:00000000
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

    const planDir = join(featureWorkflowDir(ws, TEST_FEATURE_ID_SYNC), 'plans');
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
  }, 60_000);

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

  it('update on seeded legacy corpus migrates artifact metadata and reports touched files', async () => {
    fakePackageRoot = materializeReleasePackage(RELEASE_VERSION);
    const dir = mkdtempSync(join(tmpdir(), 'pythia-ws-metadata-seed-'));
    workspaces.push(dir);
    initGit(dir);
    await doInit({ target: dir, packageRoot: fakePackageRoot, yes: true });
    preparePythiaPreRelease(dir, { priorVersion: PRIOR_VERSION, pathsVariant: 'old' });
    seedLegacyArtifactMetadataCorpus(dir);

    const before = auditArtifactMetadataMigration(dir);
    await doUpdate({ target: dir, packageRoot: fakePackageRoot, yes: true });
    const after = auditArtifactMetadataMigration(dir);
    const newlyConverted = newlyConvertedFiles(before, after);

    console.log(formatArtifactMetadataAudit(after, { before }));

    expect(after.issues, formatArtifactMetadataAudit(after, { before })).toEqual([]);
    expect(after.covered).toBeGreaterThan(0);
    expect(after.v2Converted).toBe(after.covered);
    // Files that had YAML frontmatter or v1 bold-bullets before migration — these are newly converted.
    // Files already plain (no YAML, no bold) are v2Converted=true in 'before' so don't appear here.
    expect(newlyConverted).toEqual(
      expect.arrayContaining([
        '.pythia/workflows/features/feat-2026-06-metadata-migration-probe/feat-2026-06-metadata-migration-probe.md',
        '.pythia/workflows/features/feat-2026-06-metadata-migration-probe/contexts/1-legacy.context.md',
        '.pythia/workflows/features/feat-2026-06-metadata-migration-probe/plans/1-legacy.plan.md',
        '.pythia/workflows/features/feat-2026-06-metadata-migration-probe/reports/1-legacy.review.md',
        '.pythia/ctx/legacy-global.ctx.md',
        '.pythia/contexts/architecture/legacy-current.context.md',
      ]),
    );
    expect(after.byArtifact.plan).toBeGreaterThan(0);
    expect(after.byArtifact.review).toBeGreaterThan(0);
    expect(after.byArtifact['implementation-report']).toBeGreaterThan(0);
    expect(after.byArtifact['audit-report']).toBeGreaterThan(0);
    expect(readManifest(dir).migratedVersion).toBe(RELEASE_VERSION);
  }, 120_000);
});

describe('release migration version resolver', () => {
  it('derives prior and release versions — prior < release, release >= package version', () => {
    const pkg = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
    const base = pkg.version.replace(/-.*$/, '');
    const { priorVersion, releaseVersion } = resolveReleaseMigrationVersions();
    expect(priorVersion).toMatch(/^\d+\.\d+\.\d+$/);
    expect(releaseVersion).toMatch(/^\d+\.\d+\.\d+$/);
    // releaseVersion is always >= package base version
    const [rm, rn, rp] = releaseVersion.split('.').map(Number);
    const [bm, bn, bp] = base.split('.').map(Number);
    const releaseGteBase = rm > bm || (rm === bm && rn > bn) || (rm === bm && rn === bn && rp >= bp);
    expect(releaseGteBase).toBe(true);
    // priorVersion is always strictly less than releaseVersion
    const [pm, pn, pp] = priorVersion.split('.').map(Number);
    const priorLtRelease = pm < rm || (pm === rm && pn < rn) || (pm === rm && pn === rn && pp < rp);
    expect(priorLtRelease).toBe(true);
  });
});
