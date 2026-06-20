/**
 * Integration tests: pythia health subcommand.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { rmSync, unlinkSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';
import {
  freshInstalledWorkspace,
  runCli,
  indexJs,
} from './helpers/workspace.js';
import { checkWorkspaceHealth, doHealth } from '../health.js';
import { writeState } from '../../migrate/state.js';

let workspaceDir;

beforeAll(async () => {
  workspaceDir = await freshInstalledWorkspace('pythia-ws-health-');
});

afterAll(() => {
  if (workspaceDir) rmSync(workspaceDir, { recursive: true, force: true });
});

describe('checkWorkspaceHealth', () => {
  it('reports OK for fully installed workspace', () => {
    const result = checkWorkspaceHealth(workspaceDir);
    expect(result.ok).toBe(true);
    expect(result.checks.some((c) => c.level === 'fail')).toBe(false);
    expect(result.checks.find((c) => c.id === 'workspace')?.level).toBe('ok');
    expect(result.checks.find((c) => c.id === '.pythia/runtime/hooks/post.js')?.level).toBe('ok');
    expect(result.checks.find((c) => c.id === 'inputs.project-root')?.level).toBe('ok');
    expect(result.checks.find((c) => c.id === 'inputs.cli')?.level).toBe('ok');
  });

  it('fails when manifest missing', () => {
    const result = checkWorkspaceHealth('/nonexistent/path');
    expect(result.ok).toBe(false);
    expect(result.checks[0].level).toBe('fail');
  });

  it('fails inputs.cli when anchor check exits 1 (stale references)', async () => {
    const dir = await freshInstalledWorkspace('pythia-ws-health-stale-');
    try {
      const anchor = join(dir, '.pythia/config/paths.md');
      const content = `${readFileSync(anchor, 'utf8').trim()}

## References

- [doc] [readme](../README.md#00000)
`;
      writeFileSync(anchor, content, 'utf8');
      const result = checkWorkspaceHealth(dir);
      expect(result.checks.find((c) => c.id === 'inputs.cli')?.level).toBe('fail');
      expect(result.ok).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('pythia health CLI', () => {
  it('--help prints usage', () => {
    const r = runCli(['health', '--help']);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/health/i);
  });

  it('exits 0 and prints health: OK on healthy workspace', () => {
    const r = runCli(['health', workspaceDir]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('health: OK');
    expect(r.stdout).toMatch(/OK\s+workspace:/);
    expect(r.stdout).toMatch(/OK\s+\.pythia\/config\/settings\.md:/);
  });

  it('defaults to cwd when target-dir omitted', () => {
    const r = spawnSync('node', [indexJs, 'health'], { cwd: workspaceDir, encoding: 'utf8' });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('health: OK');
  });

  it('fails when unresolved mixed migration state exists', () => {
    writeState(workspaceDir, {
      migrationVersion: '9.9.9',
      frameworkVersion: '9.9.9',
      llmRemaining: true,
      changedPaths: ['.pythia/config/paths.md'],
    }, false);
    try {
      const result = checkWorkspaceHealth(workspaceDir);
      expect(result.ok).toBe(false);
      expect(result.checks.find((c) => c.id === 'migrations.unresolved')?.level).toBe('fail');
    } finally {
      rmSync(join(workspaceDir, '.pythia/backups/9.9.9'), { recursive: true, force: true });
    }
  });

  it('--json emits structured result', () => {
    const r = runCli(['health', workspaceDir, '--json']);
    expect(r.status).toBe(0);
    const parsed = JSON.parse(r.stdout);
    expect(parsed.ok).toBe(true);
    expect(Array.isArray(parsed.checks)).toBe(true);
  });

  it('exits 1 when runtime hook is missing', () => {
    const hookPath = join(workspaceDir, '.pythia/runtime/hooks/post.js');
    if (!existsSync(hookPath)) return;
    unlinkSync(hookPath);
    try {
      expect(doHealth({ target: workspaceDir })).toBe(1);
      const r = runCli(['health', workspaceDir]);
      expect(r.status).toBe(1);
      expect(r.stdout).toContain('health: FAIL');
      expect(r.stdout).toMatch(/FAIL.*post\.js/);
    } finally {
      // restore via update on next test run is not needed — isolated tmpdir discarded in afterAll
    }
  });
});
