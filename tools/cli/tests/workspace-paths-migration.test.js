/**
 * Versioned migration fixture upgrades legacy Workflow docs checker entries in paths.md.
 * Uses isolated tmp workspaces + stable fixtures under tools/cli/tests/fixtures/
 * (not assets/migrations/next.md, which is staging-only and changes during development).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync, writeFileSync, rmSync, cpSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { doInit, doUpdate, readManifest } from '../workspace.js';
import { initGit, packageRoot } from './helpers/workspace.js';
import { pathsMdContent, hasHooksHardeningPaths } from './helpers/paths-md.js';
import { parseZones, zone } from '../../lib/paths.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIG_FIXTURE = join(__dirname, 'fixtures/paths-workflow-docs-migration.md');
const TEST_FW_VERSION = '99.0.0';
const TEST_BASE_VERSION = '98.0.0';

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

function makeFakePackageRoot() {
  fakePackageRoot = mkdtempSync(join(tmpdir(), 'pythia-fake-pkg-mig-'));
  cpSync(packageRoot, fakePackageRoot, {
    recursive: true,
    force: true,
    filter: (src) => !src.includes('node_modules') && !/(^|\/)\.git(\/|$)/.test(src),
  });
  const pkgPath = join(fakePackageRoot, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  pkg.version = TEST_FW_VERSION;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
  writeFileSync(
    join(fakePackageRoot, 'assets/base/config/paths.md'),
    pathsMdContent('new'),
    'utf8',
  );
  mkdirSync(join(fakePackageRoot, 'assets/migrations'), { recursive: true });
  cpSync(MIG_FIXTURE, join(fakePackageRoot, 'assets/migrations', `${TEST_FW_VERSION}.md`));
  return fakePackageRoot;
}

function makeOptsForFake(target) {
  return { target, packageRoot: fakePackageRoot, yes: true };
}

async function workspaceWithOldPathsMd() {
  makeFakePackageRoot();
  const dir = mkdtempSync(join(tmpdir(), 'pythia-paths-mig-'));
  workspaces.push(dir);
  initGit(dir);
  await doInit(makeOptsForFake(dir));
  writeFileSync(join(dir, '.pythia/config/paths.md'), pathsMdContent('old'), 'utf8');
  const manifestPath = join(dir, '.pythia/manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  manifest.migratedVersion = TEST_BASE_VERSION;
  manifest.frameworkVersion = TEST_FW_VERSION;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  return dir;
}

describe('paths.md workflow docs migration (fixture)', () => {
  it('update applies versioned migration to upgrade legacy paths.md', async () => {
    const ws = await workspaceWithOldPathsMd();
    const before = readFileSync(join(ws, '.pythia/config/paths.md'), 'utf8');
    expect(hasHooksHardeningPaths(before)).toBe(false);

    await doUpdate(makeOptsForFake(ws));

    const after = readFileSync(join(ws, '.pythia/config/paths.md'), 'utf8');
    expect(hasHooksHardeningPaths(after)).toBe(true);
    const docs = zone(parseZones(after), 'Workflow docs');
    expect(docs.map((d) => d.path)).toContain('*.context.md');
    expect(docs.find((d) => d.path === '*.review.md')?.checker).toContain('role-boundary.js');
    expect(readManifest(ws).migratedVersion).toBe(TEST_FW_VERSION);
  });

  it('migration is idempotent on second update', async () => {
    const ws = await workspaceWithOldPathsMd();
    await doUpdate(makeOptsForFake(ws));
    const afterFirst = readFileSync(join(ws, '.pythia/config/paths.md'), 'utf8');
    await doUpdate(makeOptsForFake(ws));
    expect(readFileSync(join(ws, '.pythia/config/paths.md'), 'utf8')).toBe(afterFirst);
  });

  it('fresh init seeds hardened paths.md from package assets without migration replace', async () => {
    makeFakePackageRoot();
    const dir = mkdtempSync(join(tmpdir(), 'pythia-paths-fresh-'));
    workspaces.push(dir);
    initGit(dir);
    await doInit(makeOptsForFake(dir));
    await doUpdate(makeOptsForFake(dir));
    const content = readFileSync(join(dir, '.pythia/config/paths.md'), 'utf8');
    expect(hasHooksHardeningPaths(content)).toBe(true);
    expect(readManifest(dir).migratedVersion).toBe(TEST_FW_VERSION);
  });

  it('upgrades basename-only Workflow docs via replace-section', async () => {
    const ws = await workspaceWithOldPathsMd();
    writeFileSync(join(ws, '.pythia/config/paths.md'), pathsMdContent('old-basename'), 'utf8');

    await doUpdate(makeOptsForFake(ws));

    const after = readFileSync(join(ws, '.pythia/config/paths.md'), 'utf8');
    expect(hasHooksHardeningPaths(after)).toBe(true);
    expect(after).toContain('role-boundary.js');
    expect(after).not.toContain('tools/checks/doc-structure.js');
  });

  it('upgrades VS Code-formatted legacy Workflow docs via replace-section', async () => {
    const ws = await workspaceWithOldPathsMd();
    const vscodeLegacy = readFileSync(
      join(__dirname, 'fixtures/paths-md-vscode-formatted.md'),
      'utf8',
    );
    writeFileSync(join(ws, '.pythia/config/paths.md'), vscodeLegacy, 'utf8');

    await doUpdate(makeOptsForFake(ws));

    const after = readFileSync(join(ws, '.pythia/config/paths.md'), 'utf8');
    expect(hasHooksHardeningPaths(after)).toBe(true);
    expect(after).toContain('role-boundary.js');
    expect(after).toContain('checker:');
    expect(after).toMatch(/- \*\.plan\.md  checker:/);
    expect(after).toMatch(/- feat-\*\.md  checker:/);
    expect(after).not.toContain('\\*.plan.md');
    expect(after).not.toContain('tools/checks/doc-structure.js');
  });
});
