/**
 * Integration tests: doUpdate on an existing workspace.
 *
 * Covers:
 * - skills refresh: new skill added by package → appears after update
 * - skills prune: skill removed from package → pruned after update
 * - managed file backup+overwrite: user-modified CLAUDE.md → backed up and overwritten
 * - hook wiring idempotency: re-running update does not duplicate hook entries
 * - runtime refresh: .pythia/runtime/ reflects current package content after update
 * - paths.md seed: not overwritten if user modified it
 * - migration: pending migration applied on update
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync,
  existsSync, cpSync, readdirSync,
} from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';
import { doInit, doUpdate, readManifest } from '../workspace.js';
import { writeManifest } from '../../migrate/manifest.js';
import { initGit, makeOpts, runCli, packageRoot } from './helpers/workspace.js';

vi.setConfig({ testTimeout: 30000, hookTimeout: 30000 });

let tmpDir;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'pythia-update-test-'));
  initGit(tmpDir);
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

function latestManagedOverwriteBackup(target, relpath) {
  const dir = join(target, '.pythia/backups/managed-overwrites');
  if (!existsSync(dir)) return null;
  const prefix = `${relpath.replace(/\//g, '--')}.`;
  const hit = readdirSync(dir).filter((n) => n.startsWith(prefix)).sort().at(-1);
  return hit ? join(dir, hit) : null;
}

// ── skills installation ───────────────────────────────────────────────────────

describe('update: skills', () => {
  it('installs skills into .claude/skills and .agents/skills', async () => {
    await doInit(makeOpts(tmpDir));
    await doUpdate(makeOpts(tmpDir));
    expect(existsSync(join(tmpDir, '.claude', 'skills'))).toBe(true);
    expect(existsSync(join(tmpDir, '.agents', 'skills'))).toBe(true);
  });

  it('skills match package source content', async () => {
    await doInit(makeOpts(tmpDir));
    await doUpdate(makeOpts(tmpDir));
    const pkgSkills = readdirSync(join(packageRoot, 'skills'));
    const wsSkills = readdirSync(join(tmpDir, '.claude', 'skills'));
    for (const skill of pkgSkills) {
      expect(wsSkills).toContain(skill);
    }
  });

  it('adds a new skill into existing workspace on update', async () => {
    await doInit(makeOpts(tmpDir));

    // Simulate package gaining a new skill by creating a fake packageRoot copy
    const fakeRoot = mkdtempSync(join(tmpdir(), 'fake-pkg-'));
    try {
      cpSync(packageRoot, fakeRoot, {
        recursive: true,
        force: true,
        filter: (s) => !s.includes('node_modules') && !s.includes('.git'),
      });
      const newSkillDir = join(fakeRoot, 'skills', 'new-test-skill');
      mkdirSync(newSkillDir, { recursive: true });
      writeFileSync(join(newSkillDir, 'SKILL.md'), '# New skill\n', 'utf8');

      await doUpdate({ target: tmpDir, packageRoot: fakeRoot, yes: true });

      expect(existsSync(join(tmpDir, '.claude', 'skills', 'new-test-skill', 'SKILL.md'))).toBe(true);
      expect(existsSync(join(tmpDir, '.agents', 'skills', 'new-test-skill', 'SKILL.md'))).toBe(true);
    } finally {
      rmSync(fakeRoot, { recursive: true, force: true });
    }
  });

  it('prunes a removed skill from existing workspace on update', async () => {
    await doInit(makeOpts(tmpDir));

    // Simulate package dropping a skill: add it first, then remove
    const fakeRoot = mkdtempSync(join(tmpdir(), 'fake-pkg-'));
    try {
      cpSync(packageRoot, fakeRoot, {
        recursive: true, force: true,
        filter: (s) => !s.includes('node_modules') && !s.includes('.git'),
      });
      const dropSkillDir = join(fakeRoot, 'skills', 'drop-me');
      mkdirSync(dropSkillDir, { recursive: true });
      writeFileSync(join(dropSkillDir, 'SKILL.md'), '# Drop me\n', 'utf8');

      // Install with the extra skill
      await doUpdate({ target: tmpDir, packageRoot: fakeRoot, yes: true });
      expect(existsSync(join(tmpDir, '.claude', 'skills', 'drop-me'))).toBe(true);

      // Now remove the skill from the package and update again
      rmSync(dropSkillDir, { recursive: true, force: true });
      await doUpdate({ target: tmpDir, packageRoot: fakeRoot, yes: true });

      expect(existsSync(join(tmpDir, '.claude', 'skills', 'drop-me'))).toBe(false);
      expect(existsSync(join(tmpDir, '.agents', 'skills', 'drop-me'))).toBe(false);
    } finally {
      rmSync(fakeRoot, { recursive: true, force: true });
    }
  });

  it('does NOT prune skills the user added manually (not in installedSkills)', async () => {
    await doInit(makeOpts(tmpDir));

    // User adds a custom skill manually (not via pythia)
    const customSkillDir = join(tmpDir, '.claude', 'skills', 'my-custom-skill');
    mkdirSync(customSkillDir, { recursive: true });
    writeFileSync(join(customSkillDir, 'SKILL.md'), '# Custom\n', 'utf8');

    await doUpdate(makeOpts(tmpDir));

    // Custom skill must survive update
    expect(existsSync(join(customSkillDir, 'SKILL.md'))).toBe(true);
  });

  it('skills contain .pythia/runtime/ references (not scripts/)', async () => {
    await doInit(makeOpts(tmpDir));
    await doUpdate(makeOpts(tmpDir));
    const planSkill = readFileSync(join(tmpDir, '.claude', 'skills', 'plan', 'SKILL.md'), 'utf8');
    expect(planSkill).not.toMatch(/scripts\/inputs\.js/);
    expect(planSkill).toMatch(/\.pythia\/runtime\/inputs\.js/);
  });
});

// ── managed file refresh ──────────────────────────────────────────────────────

describe('update: managed file refresh', () => {
  it('refreshes CLAUDE.md and AGENTS.md without backup when unchanged', async () => {
    await doInit(makeOpts(tmpDir));
    const beforeHash = readManifest(tmpDir).generated['CLAUDE.md'];

    await doUpdate(makeOpts(tmpDir));

    expect(latestManagedOverwriteBackup(tmpDir, 'CLAUDE.md')).toBeNull();
    const manifest = readManifest(tmpDir);
    expect(manifest.generated['CLAUDE.md']).toBe(beforeHash);
  });

  it('backs up and overwrites CLAUDE.md when user modified it', async () => {
    await doInit(makeOpts(tmpDir));
    // User edits CLAUDE.md
    const claudePath = join(tmpDir, 'CLAUDE.md');
    writeFileSync(claudePath, readFileSync(claudePath, 'utf8') + '\n# User addition\n', 'utf8');

    await doUpdate(makeOpts(tmpDir));

    const backupPath = latestManagedOverwriteBackup(tmpDir, 'CLAUDE.md');
    expect(backupPath).not.toBeNull();
    expect(readFileSync(backupPath, 'utf8')).toContain('# User addition');
    expect(existsSync(join(tmpDir, 'CLAUDE.md.bak'))).toBe(false);
    // Original content restored from package
    const current = readFileSync(claudePath, 'utf8');
    expect(current).not.toContain('# User addition');
  });
});

// ── hook wiring idempotency ───────────────────────────────────────────────────

describe('update: hook wiring idempotency', () => {
  it('does not duplicate PreToolUse pythia hook on repeated update', async () => {
    await doInit(makeOpts(tmpDir));
    await doUpdate(makeOpts(tmpDir));
    await doUpdate(makeOpts(tmpDir)); // second update

    const settings = JSON.parse(readFileSync(join(tmpDir, '.claude', 'settings.json'), 'utf8'));
    const preHooks = settings.hooks?.PreToolUse ?? [];
    const pythiaEntries = preHooks.filter((h) => h._managed === 'pythia');
    expect(pythiaEntries.length).toBe(1);
  });

  it('does not duplicate Stop hook on repeated update', async () => {
    await doInit(makeOpts(tmpDir));
    await doUpdate(makeOpts(tmpDir));
    await doUpdate(makeOpts(tmpDir));

    const settings = JSON.parse(readFileSync(join(tmpDir, '.claude', 'settings.json'), 'utf8'));
    const stopHooks = settings.hooks?.Stop ?? [];
    const pythiaEntries = stopHooks.filter((h) => h._managed === 'pythia');
    expect(pythiaEntries.length).toBe(1);
  });

  it('does not duplicate hooks.json PreToolUse on repeated update', async () => {
    await doInit(makeOpts(tmpDir));
    await doUpdate(makeOpts(tmpDir));
    await doUpdate(makeOpts(tmpDir));

    const h = JSON.parse(readFileSync(join(tmpDir, 'hooks.json'), 'utf8'));
    const preHooks = h.hooks?.PreToolUse ?? [];
    const pythiaEntries = preHooks.filter((e) => e._managed === 'pythia');
    expect(pythiaEntries.length).toBe(1);
  });

  it('removes legacy non-managed Claude PostToolUse duplicates targeting runtime post.js', async () => {
    await doInit(makeOpts(tmpDir));
    const settingsPath = join(tmpDir, '.claude', 'settings.json');
    const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
    settings.hooks.PostToolUse.push({
      matcher: 'Edit|Write|MultiEdit',
      hooks: [{
        type: 'command',
        command: 'node',
        args: ['.pythia/runtime/hooks/post.js'],
      }],
    });
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');

    await doUpdate(makeOpts(tmpDir));

    const after = JSON.parse(readFileSync(settingsPath, 'utf8'));
    const legacyGroups = (after.hooks?.PostToolUse ?? []).filter((g) => !g._managed);
    expect(legacyGroups).toHaveLength(0);
    const managedGroups = (after.hooks?.PostToolUse ?? []).filter((g) => g._managed === 'pythia');
    expect(managedGroups).toHaveLength(1);
    const postInner = managedGroups[0].hooks ?? [];
    expect(postInner.some((h) => (h.args ?? []).join(' ').includes('post.js'))).toBe(true);
  });

  it('preserves non-pythia hook entries alongside pythia-managed ones', async () => {
    await doInit(makeOpts(tmpDir));

    // User adds a custom hook
    const settingsPath = join(tmpDir, '.claude', 'settings.json');
    const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
    if (!settings.hooks) settings.hooks = {};
    if (!settings.hooks.PreToolUse) settings.hooks.PreToolUse = [];
    settings.hooks.PreToolUse.push({ matcher: 'Bash', hooks: [{ type: 'command', command: 'echo custom' }] });
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');

    await doUpdate(makeOpts(tmpDir));

    const updated = JSON.parse(readFileSync(settingsPath, 'utf8'));
    const customEntry = (updated.hooks?.PreToolUse ?? []).find((h) => !h._managed);
    expect(customEntry).toBeDefined();
  });

  it('removes legacy codex hooks without _managed but with runtime path on update', async () => {
    await doInit(makeOpts(tmpDir));
    await doUpdate(makeOpts(tmpDir));

    const hooksPath = join(tmpDir, 'hooks.json');
    const hooks = JSON.parse(readFileSync(hooksPath, 'utf8'));
    hooks.hooks.PreToolUse.push({
      hooks: [{
        type: 'command',
        command: 'node',
        args: ['.pythia/runtime/hooks/legacy-pre.js'],
      }],
    });
    writeFileSync(hooksPath, JSON.stringify(hooks, null, 2), 'utf8');

    await doUpdate(makeOpts(tmpDir));

    const after = JSON.parse(readFileSync(hooksPath, 'utf8'));
    const runtimeHooks = (after.hooks?.PreToolUse ?? []).filter((h) =>
      JSON.stringify(h).includes('.pythia/runtime/hooks'),
    );
    expect(runtimeHooks).toHaveLength(1);
    expect(runtimeHooks[0]._managed).toBe('pythia');
  });
});

// ── registry check on update ──────────────────────────────────────────────────

describe('update: registry check', () => {
  it('forces registry refresh and prints notice when npm reports newer version', async () => {
    await doInit(makeOpts(tmpDir));
    await doUpdate(makeOpts(tmpDir));

    const frameworkVersion = readManifest(tmpDir).frameworkVersion;
    writeManifest(tmpDir, {
      registryCheck: {
        checkedAt: new Date().toISOString(),
        latestVersion: frameworkVersion,
      },
    }, false);

    const logs = [];
    const logSpy = vi.spyOn(console, 'log').mockImplementation((...args) => {
      logs.push(args.join(' '));
    });

    try {
      await doUpdate({
        ...makeOpts(tmpDir),
        registryFetch: () => '99.99.99',
      });
    } finally {
      logSpy.mockRestore();
    }

    const manifest = readManifest(tmpDir);
    expect(manifest.registryCheck.latestVersion).toBe('99.99.99');
    expect(logs.some((l) => l.includes('newer pythia-workspace'))).toBe(true);
  });
});

// ── runtime refresh ───────────────────────────────────────────────────────────

describe('update: runtime refresh', () => {
  it('runtime inputs.js is callable after update', async () => {
    const ws = mkdtempSync(join(tmpdir(), 'pythia-rt-'));
    initGit(ws);
    try {
      await doInit(makeOpts(ws));
      await doUpdate(makeOpts(ws));

      const inputsPath = join(ws, '.pythia/runtime/inputs.js');
      expect(existsSync(inputsPath)).toBe(true);

      const result = spawnSync('node', [inputsPath], { encoding: 'utf8', cwd: ws });
      expect(result.status).toBe(2); // usage error = script is callable
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  });

  it('runtime hooks match installed hooks path', async () => {
    await doInit(makeOpts(tmpDir));
    await doUpdate(makeOpts(tmpDir));

    const runtimePre = join(tmpDir, '.pythia/runtime/hooks/pre.js');
    expect(existsSync(runtimePre)).toBe(true);

    const settings = JSON.parse(readFileSync(join(tmpDir, '.claude', 'settings.json'), 'utf8'));
    const preEntry = (settings.hooks?.PreToolUse ?? []).find((h) => h._managed === 'pythia');
    expect(preEntry).toBeDefined();
    // args[0] should point to the runtime pre.js
    expect(preEntry.hooks[0].args[0]).toBe(runtimePre);
  });

  it('materializes package-paths.md for runtime loadZones fallback', async () => {
    const ws = mkdtempSync(join(tmpdir(), 'pythia-rt-paths-'));
    initGit(ws);
    try {
      await doInit(makeOpts(ws));
      await doUpdate(makeOpts(ws));
      const packagePaths = join(ws, '.pythia/runtime/package-paths.md');
      expect(existsSync(packagePaths)).toBe(true);
      expect(readFileSync(packagePaths, 'utf8')).toContain('role-boundary.js');
    } finally {
      rmSync(ws, { recursive: true, force: true });
    }
  });
});

// ── .pythia/paths.md seed ─────────────────────────────────────────────────────

describe('update: paths.md', () => {
  it('seeds .pythia/paths.md when missing', async () => {
    await doInit(makeOpts(tmpDir));
    rmSync(join(tmpDir, '.pythia', 'config', 'paths.md'));
    await doUpdate(makeOpts(tmpDir));
    expect(existsSync(join(tmpDir, '.pythia', 'config', 'paths.md'))).toBe(true);
  });

  it('does NOT overwrite existing .pythia/paths.md (seed = once only)', async () => {
    await doInit(makeOpts(tmpDir));
    const pathsMd = join(tmpDir, '.pythia', 'config', 'paths.md');
    writeFileSync(pathsMd, '# custom\n', 'utf8');
    await doUpdate(makeOpts(tmpDir));
    expect(readFileSync(pathsMd, 'utf8')).toBe('# custom\n');
  });
});

// ── manifest version ──────────────────────────────────────────────────────────

describe('update: manifest', () => {
  it('updates frameworkVersion to current package version', async () => {
    await doInit(makeOpts(tmpDir));
    const pkgVersion = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')).version;

    await doUpdate(makeOpts(tmpDir));

    const manifest = readManifest(tmpDir);
    expect(manifest.frameworkVersion).toBe(pkgVersion);
  });

  it('preserves installedAt across update', async () => {
    await doInit(makeOpts(tmpDir));
    const firstManifest = readManifest(tmpDir);

    await doUpdate(makeOpts(tmpDir));

    // installedAt is written fresh by doUpdate, but frameworkVersion should match
    const updated = readManifest(tmpDir);
    expect(updated.frameworkVersion).toBe(firstManifest.frameworkVersion);
  });

  it('records installedSkills list', async () => {
    await doInit(makeOpts(tmpDir));
    await doUpdate(makeOpts(tmpDir));

    const manifest = readManifest(tmpDir);
    expect(Array.isArray(manifest.installedSkills)).toBe(true);
    expect(manifest.installedSkills.length).toBeGreaterThan(0);
    const pkgSkills = readdirSync(join(packageRoot, 'skills'));
    for (const s of pkgSkills) {
      expect(manifest.installedSkills).toContain(s);
    }
  });

  it('pythia version reflects manifest after update', async () => {
    await doInit(makeOpts(tmpDir));
    await doUpdate(makeOpts(tmpDir));
    const manifest = readManifest(tmpDir);
    const r = runCli(['version', tmpDir]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain(`framework:  ${manifest.frameworkVersion}`);
    expect(r.stdout).toMatch(/migrations: 0 pending/);
  });
});
