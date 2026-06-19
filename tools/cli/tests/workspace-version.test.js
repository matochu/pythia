/**
 * Integration tests: pythia version subcommand.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { rmSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  freshInstalledWorkspace,
  runCli,
  packageRoot,
} from './helpers/workspace.js';
import { readManifest } from '../workspace.js';
import { writeManifest } from '../../migrate/manifest.js';

let workspaceDir;

beforeAll(async () => {
  workspaceDir = await freshInstalledWorkspace('pythia-ws-version-');
});

afterAll(() => {
  if (workspaceDir) rmSync(workspaceDir, { recursive: true, force: true });
});

describe('pythia version CLI', () => {
  it('--help prints usage', () => {
    const r = runCli(['version', '--help']);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/version/i);
  });

  it('prints six-line summary matching manifest', () => {
    const manifest = readManifest(workspaceDir);
    const r = runCli(['version', workspaceDir]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain(`framework:  ${manifest.frameworkVersion}`);
    expect(r.stdout).toContain(`migrated:   ${manifest.migratedVersion}`);
    expect(r.stdout).toContain(`surfaces:   ${manifest.surfaces.join(', ')}`);
    expect(r.stdout).toMatch(/skills:\s+\d+ installed/);
    expect(r.stdout).toMatch(/migrations: 0 pending/);
    expect(r.stdout).toMatch(/^registry:\s+/m);
  });

  it('framework version matches package.json', () => {
    const pkgVersion = JSON.parse(
      readFileSync(join(packageRoot, 'package.json'), 'utf8')
    ).version;
    const r = runCli(['version', workspaceDir]);
    expect(r.stdout).toContain(`framework:  ${pkgVersion}`);
  });
});

describe('pythia version edge cases', () => {
  it('exits 1 when no manifest', async () => {
    const empty = await freshInstalledWorkspace('pythia-ws-version-empty-');
    try {
      rmSync(join(empty, '.pythia', 'manifest.json'), { force: true });
      const r = runCli(['version', empty]);
      expect(r.status).toBe(1);
      expect(r.stderr).toMatch(/not a pythia workspace/);
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });

  it('shows pending migrations when framework !== migrated', async () => {
    const ws = await freshInstalledWorkspace('pythia-ws-version-pending-');
    try {
      writeManifest(ws, { migratedVersion: '0.0.0' }, false);
      const r = runCli(['version', ws]);
      expect(r.status).toBe(0);
      expect(r.stdout).toMatch(/migrations: 1 pending \(run update\)/);
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  });

  it('does not double-count pending when unresolved mixed state also exists', async () => {
    const ws = await freshInstalledWorkspace('pythia-ws-version-dedup-');
    try {
      const manifest = readManifest(ws);
      writeManifest(ws, { migratedVersion: '0.0.0' }, false);
      const { writeState } = await import('../../migrate/state.js');
      writeState(ws, {
        migrationVersion: '9.9.9',
        frameworkVersion: manifest.frameworkVersion,
        llmRemaining: true,
        changedPaths: ['.pythia/config/paths.md'],
      }, false);
      const r = runCli(['version', ws]);
      expect(r.status).toBe(0);
      expect(r.stdout).toMatch(/migrations: 1 pending \(run update\)/);
      expect(r.stdout).not.toMatch(/migrations: 2 pending/);
    } finally {
      rmSync(join(ws, '.pythia/backups/9.9.9'), { recursive: true, force: true });
      rmSync(ws, { recursive: true, force: true });
    }
  });

  it('prints unknown skill count when installedSkills absent', async () => {
    const ws = await freshInstalledWorkspace('pythia-ws-version-skills-');
    try {
      const manifestPath = join(ws, '.pythia', 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      delete manifest.installedSkills;
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
      const r = runCli(['version', ws]);
      expect(r.status).toBe(0);
      expect(r.stdout).toMatch(/skills:\s+unknown/);
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  });

  it('uses fresh registryCheck from manifest without npm when checkedAt is recent', async () => {
    const ws = await freshInstalledWorkspace('pythia-ws-version-registry-');
    try {
      writeManifest(ws, {
        registryCheck: {
          checkedAt: new Date().toISOString(),
          latestVersion: '99.99.99',
        },
      }, false);
      const r = runCli(['version', ws]);
      expect(r.status).toBe(0);
      expect(r.stdout).toMatch(/registry:\s+99\.99\.99 available/);
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  });
});
