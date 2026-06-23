/**
 * Round-trip lifecycle: init → version → uninstall → version fails.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { rmSync } from 'fs';
import { freshInstalledWorkspace, runCli } from './helpers/workspace.js';
import { doUninstall, isWorkspace } from '../workspace.js';
import { writeManifest } from '../../migrate/manifest.js';

vi.setConfig({ testTimeout: 30000, hookTimeout: 30000 });

const workspaces = [];

afterEach(() => {
  while (workspaces.length) {
    const ws = workspaces.pop();
    rmSync(ws, { recursive: true, force: true });
  }
});

describe('workspace lifecycle round-trip', () => {
  it('full E2E: init → update → version → uninstall → version fails', async () => {
    const ws = await freshInstalledWorkspace('pythia-ws-lifecycle-');
    workspaces.push(ws);

    expect(runCli(['update', ws, '--yes']).status).toBe(0);

    writeManifest(ws, {
      registryCheck: {
        checkedAt: new Date().toISOString(),
        latestVersion: '88.88.88',
      },
    }, false);

    const vr = runCli(['version', ws]);
    expect(vr.status).toBe(0);
    expect(vr.stdout.trim().split('\n')).toHaveLength(6);
    expect(vr.stdout).toMatch(/^registry:\s+/m);
    expect(vr.stdout).toMatch(/88\.88\.88 available/);

    expect(await doUninstall({ target: ws, yes: true })).toBe(0);
    expect(isWorkspace(ws)).toBe(false);
    expect(runCli(['version', ws]).status).toBe(1);
  });

  it('uninstall --yes via CLI removes workspace', async () => {
    const ws = await freshInstalledWorkspace('pythia-ws-lifecycle-cli-');
    workspaces.push(ws);

    const r = runCli(['uninstall', ws, '--yes']);
    expect(r.status).toBe(0);
    expect(isWorkspace(ws)).toBe(false);
  });

  it('uninstall on empty dir prints message and exits 0', async () => {
    const ws = await freshInstalledWorkspace('pythia-ws-lifecycle-empty-');
    workspaces.push(ws);
    await doUninstall({ target: ws, yes: true });

    const r = runCli(['uninstall', ws, '--yes']);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/not a pythia workspace/);
  });
});
