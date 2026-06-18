import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync, cpSync, readdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';
import { doInit, doUpdate, isWorkspace, sha256, readManifest } from '../workspace.js';

// Package root: src/cli/tests/ → 3 levels up
const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, '../../../');

function makeOpts(target, dryRun = false) {
  return { target, dryRun, packageRoot };
}

let tmpDir;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'pythia-test-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('isWorkspace', () => {
  it('returns false for empty dir', () => {
    expect(isWorkspace(tmpDir)).toBe(false);
  });

  it('returns false when manifest.json is corrupt', () => {
    mkdirSync(join(tmpDir, '.pythia'), { recursive: true });
    writeFileSync(join(tmpDir, '.pythia', 'manifest.json'), 'not-json');
    expect(isWorkspace(tmpDir)).toBe(false);
  });

  it('returns true when manifest.json is valid', () => {
    mkdirSync(join(tmpDir, '.pythia'), { recursive: true });
    writeFileSync(
      join(tmpDir, '.pythia', 'manifest.json'),
      JSON.stringify({ frameworkVersion: '0.1.0', migratedVersion: '0.1.0', generated: {} }),
    );
    expect(isWorkspace(tmpDir)).toBe(true);
  });

  it('returns true for legacy version.json (dual-detect)', () => {
    mkdirSync(join(tmpDir, '.pythia'), { recursive: true });
    writeFileSync(
      join(tmpDir, '.pythia', 'version.json'),
      JSON.stringify({ frameworkVersion: '0.1.0', generated: {} }),
    );
    expect(isWorkspace(tmpDir)).toBe(true);
  });
});

describe('init', () => {
  it('seeds base .pythia structure', async () => {
    await doInit(makeOpts(tmpDir));
    expect(existsSync(join(tmpDir, '.pythia', 'manifest.json'))).toBe(true);
    expect(existsSync(join(tmpDir, '.pythia', 'config', 'settings.md'))).toBe(true);
    expect(existsSync(join(tmpDir, '.pythia', 'README.md'))).toBe(true);
    expect(existsSync(join(tmpDir, '.pythia', 'workflows', '.gitkeep'))).toBe(true);
  });

  it('renders universal AGENTS.md and Claude-branded CLAUDE.md', async () => {
    await doInit(makeOpts(tmpDir));
    const agents = readFileSync(join(tmpDir, 'AGENTS.md'), 'utf8');
    const claude = readFileSync(join(tmpDir, 'CLAUDE.md'), 'utf8');
    expect(agents).not.toMatch(/Codex|\(Codex\)/);
    expect(agents).toContain('agent instructions');
    expect(agents).toContain('.agents/skills');
    expect(claude).toContain('Claude Code');
    expect(claude).toContain('.claude/skills');
    expect(agents).not.toContain('{tool}');
    expect(claude).not.toContain('{tool}');
  });

  it('installs skills into .claude/skills and .agents/skills', async () => {
    await doInit(makeOpts(tmpDir));
    expect(existsSync(join(tmpDir, '.claude', 'skills'))).toBe(true);
    expect(existsSync(join(tmpDir, '.agents', 'skills'))).toBe(true);
  });

  it('writes manifest.json with generated manifest and migratedVersion', async () => {
    await doInit(makeOpts(tmpDir));
    const manifest = JSON.parse(readFileSync(join(tmpDir, '.pythia', 'manifest.json'), 'utf8'));
    expect(manifest.frameworkVersion).toBeDefined();
    expect(typeof manifest.frameworkVersion).toBe('string');
    expect(manifest.migratedVersion).toBe(manifest.frameworkVersion);
    expect(manifest.installedAt).toBeDefined();
    expect(manifest.generated['AGENTS.md']).toBeDefined();
    expect(manifest.generated['CLAUDE.md']).toBeDefined();
    expect(manifest.surfaces).toContain('.claude/skills');
    expect(manifest.surfaces).toContain('.agents/skills');
    expect(manifest.gitStrategy).toBe('pythia');
  });

  it('fresh empty init sets migratedVersion to frameworkVersion', async () => {
    await doInit(makeOpts(tmpDir));
    const manifest = JSON.parse(readFileSync(join(tmpDir, '.pythia', 'manifest.json'), 'utf8'));
    expect(manifest.migratedVersion).toBe(manifest.frameworkVersion);
  });

  it('fresh init applies pending versioned migrations from 0.0.0 baseline', async () => {
    const logs = [];
    const origLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    try {
      await doInit(makeOpts(tmpDir));
    } finally {
      console.log = origLog;
    }
    const fw = readManifest(tmpDir).frameworkVersion;
    expect(logs.some((l) => new RegExp(`applying migration ${fw.replace(/\./g, '\\.')}`).test(l))).toBe(true);
  });

  it('--surfaces cursor installs .cursor/skills and merges hooks.json', async () => {
    await doInit({
      ...makeOpts(tmpDir),
      surfaces: ['.claude/skills', '.agents/skills', '.cursor/skills'],
    });
    expect(existsSync(join(tmpDir, '.cursor', 'skills'))).toBe(true);
    const hooks = JSON.parse(readFileSync(join(tmpDir, '.cursor', 'hooks.json'), 'utf8'));
    expect(hooks.hooks.afterFileEdit.some((h) => h._managed === 'pythia')).toBe(true);
    const manifest = JSON.parse(readFileSync(join(tmpDir, '.pythia', 'manifest.json'), 'utf8'));
    expect(manifest.surfaces).toContain('.cursor/skills');
  });

  it('adopted target init migrates in-run to frameworkVersion', async () => {
    // Seed a protected artifact to simulate an adopted workspace
    mkdirSync(join(tmpDir, '.pythia', 'workflows'), { recursive: true });
    writeFileSync(join(tmpDir, '.pythia', 'workflows', 'some-feature.md'), '# feature', 'utf8');
    await doInit(makeOpts(tmpDir));
    const manifest = JSON.parse(readFileSync(join(tmpDir, '.pythia', 'manifest.json'), 'utf8'));
    expect(manifest.migratedVersion).toBe(manifest.frameworkVersion);
  });

  it('auto-detect resolves to update after init', async () => {
    await doInit(makeOpts(tmpDir));
    expect(isWorkspace(tmpDir)).toBe(true);
  });

  it('dry-run writes nothing', async () => {
    await doInit(makeOpts(tmpDir, true));
    expect(existsSync(join(tmpDir, '.pythia', 'manifest.json'))).toBe(false);
    expect(existsSync(join(tmpDir, 'AGENTS.md'))).toBe(false);
    expect(existsSync(join(tmpDir, '.claude', 'skills'))).toBe(false);
  });

  it('throws when skills/ is missing', async () => {
    const fakeRoot = mkdtempSync(join(tmpdir(), 'fake-pkg-'));
    try {
      cpSync(join(packageRoot, 'assets'), join(fakeRoot, 'assets'), { recursive: true });
      writeFileSync(join(fakeRoot, 'package.json'), JSON.stringify({ version: '0.1.0' }));
      await expect(doInit({ target: tmpDir, dryRun: false, packageRoot: fakeRoot })).rejects.toThrow();
    } finally {
      rmSync(fakeRoot, { recursive: true, force: true });
    }
  });

  it('--surfaces claude installs only .claude/skills, not .agents/skills', async () => {
    await doInit({ ...makeOpts(tmpDir), surfaces: ['.claude/skills'] });
    expect(existsSync(join(tmpDir, '.claude', 'skills'))).toBe(true);
    expect(existsSync(join(tmpDir, 'CLAUDE.md'))).toBe(true);
    expect(existsSync(join(tmpDir, 'AGENTS.md'))).toBe(false);
  });

  it('--git-strategy pythia persists in manifest.json', async () => {
    await doInit({ ...makeOpts(tmpDir), gitStrategy: 'pythia' });
    const manifest = JSON.parse(readFileSync(join(tmpDir, '.pythia', 'manifest.json'), 'utf8'));
    expect(manifest.gitStrategy).toBe('pythia');
  });

  it('re-run without --reconfigure preserves existing manifest fields', async () => {
    await doInit({ ...makeOpts(tmpDir), gitStrategy: 'pythia' });
    await doInit({ ...makeOpts(tmpDir) }); // re-run without reconfigure
    const manifest = JSON.parse(readFileSync(join(tmpDir, '.pythia', 'manifest.json'), 'utf8'));
    // gitStrategy from first run should be preserved via field-preservation
    expect(manifest.gitStrategy).toBe('pythia');
  });
});

describe('init: git-strategy side effects via CLI', () => {
  it('--git-strategy pythia initializes .pythia/.git', () => {
    const cliPath = resolve(packageRoot, 'tools/cli/index.js');
    const result = spawnSync('node', [cliPath, 'init', tmpDir, '--yes', '--git-strategy', 'pythia'], {
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    expect(existsSync(join(tmpDir, '.pythia', '.git'))).toBe(true);
    const manifest = readManifest(tmpDir);
    expect(manifest.gitStrategy).toBe('pythia');
  });

  it('--git-strategy pythia on a brand-new target does not stamp migratedVersion as adopted', () => {
    // CLI runs `git init .pythia/.git` before doInit; the resulting .git dir must not itself
    // be treated as pre-existing content (would wrongly mark a fresh init as "adopted" → 0.0.0).
    const cliPath = resolve(packageRoot, 'tools/cli/index.js');
    const result = spawnSync('node', [cliPath, 'init', tmpDir, '--yes', '--git-strategy', 'pythia'], {
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    const manifest = readManifest(tmpDir);
    expect(manifest.migratedVersion).not.toBe('0.0.0');
  });

  it('--git-strategy pythia reuses existing .pythia/.git on re-run', () => {
    const cliPath = resolve(packageRoot, 'tools/cli/index.js');
    spawnSync('node', [cliPath, 'init', tmpDir, '--yes', '--git-strategy', 'pythia'], { encoding: 'utf8' });
    const r2 = spawnSync('node', [cliPath, 'init', tmpDir, '--yes', '--git-strategy', 'pythia'], { encoding: 'utf8' });
    expect(r2.status).toBe(0);
    expect(existsSync(join(tmpDir, '.pythia', '.git'))).toBe(true);
  });

  it('--git-strategy shared falls back to ignore when target is not a git repo', () => {
    const cliPath = resolve(packageRoot, 'tools/cli/index.js');
    const result = spawnSync('node', [cliPath, 'init', tmpDir, '--yes', '--git-strategy', 'shared'], {
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    // Should warn and fall back to ignore
    expect(result.stdout + result.stderr).toContain('falling back to ignore');
    const manifest = readManifest(tmpDir);
    expect(manifest.gitStrategy).toBe('ignore');
  });
});

describe('update', () => {
  it('prunes only pythia-installed skills removed from package; keeps user skills', async () => {
    await doInit(makeOpts(tmpDir));

    // A user's own custom skill (never installed by pythia) must survive update.
    const userSkill = join(tmpDir, '.claude', 'skills', '_my-custom-skill');
    mkdirSync(userSkill, { recursive: true });

    // Simulate a skill pythia installed before but that is gone from the current package:
    // record it in manifest.installedSkills and place it in the surface.
    const removedSkill = join(tmpDir, '.claude', 'skills', '_was-shipped-now-removed');
    mkdirSync(removedSkill, { recursive: true });
    const manifestPath = join(tmpDir, '.pythia', 'manifest.json');
    const m = JSON.parse(readFileSync(manifestPath, 'utf8'));
    m.installedSkills = [...(m.installedSkills ?? []), '_was-shipped-now-removed'];
    writeFileSync(manifestPath, JSON.stringify(m, null, 2));

    await doUpdate(makeOpts(tmpDir));

    expect(existsSync(userSkill)).toBe(true); // user skill preserved
    expect(existsSync(removedSkill)).toBe(false); // previously-installed, now-removed → pruned
  });

  it('full-refreshes AGENTS.md without .bak when content matches manifest', async () => {
    await doInit(makeOpts(tmpDir));
    const before = readFileSync(join(tmpDir, 'AGENTS.md'), 'utf8');
    await doUpdate(makeOpts(tmpDir));
    const after = readFileSync(join(tmpDir, 'AGENTS.md'), 'utf8');
    expect(after).toBe(before);
    expect(existsSync(join(tmpDir, 'AGENTS.md.bak'))).toBe(false);
  });

  it('writes .bak when AGENTS.md has been locally modified', async () => {
    await doInit(makeOpts(tmpDir));
    const original = readFileSync(join(tmpDir, 'AGENTS.md'), 'utf8');
    writeFileSync(join(tmpDir, 'AGENTS.md'), original + '\n# Local edit', 'utf8');
    await doUpdate(makeOpts(tmpDir));
    expect(existsSync(join(tmpDir, 'AGENTS.md.bak'))).toBe(true);
    const bak = readFileSync(join(tmpDir, 'AGENTS.md.bak'), 'utf8');
    expect(bak).toContain('# Local edit');
  });

  it('writes .bak for first-adoption of unrecorded pre-existing file', async () => {
    await doInit(makeOpts(tmpDir));
    const manifest = JSON.parse(readFileSync(join(tmpDir, '.pythia', 'manifest.json'), 'utf8'));
    delete manifest.generated['AGENTS.md'];
    writeFileSync(join(tmpDir, '.pythia', 'manifest.json'), JSON.stringify(manifest));
    await doUpdate(makeOpts(tmpDir));
    expect(existsSync(join(tmpDir, 'AGENTS.md.bak'))).toBe(true);
  });

  it('does not clobber seed-if-missing files (config.md)', async () => {
    await doInit(makeOpts(tmpDir));
    const customConfig = '# My custom config\n\nCustomized content';
    writeFileSync(join(tmpDir, '.pythia', 'config', 'settings.md'), customConfig, 'utf8');
    await doUpdate(makeOpts(tmpDir));
    const after = readFileSync(join(tmpDir, '.pythia', 'config', 'settings.md'), 'utf8');
    expect(after).toBe(customConfig);
  });

  it('dry-run writes nothing including no .bak', async () => {
    await doInit(makeOpts(tmpDir));
    const original = readFileSync(join(tmpDir, 'AGENTS.md'), 'utf8');
    writeFileSync(join(tmpDir, 'AGENTS.md'), original + '\n# Local', 'utf8');
    const beforeContent = readFileSync(join(tmpDir, 'AGENTS.md'), 'utf8');
    await doUpdate(makeOpts(tmpDir, true));
    expect(existsSync(join(tmpDir, 'AGENTS.md.bak'))).toBe(false);
    expect(readFileSync(join(tmpDir, 'AGENTS.md'), 'utf8')).toBe(beforeContent);
  });

  it('one-step update seeds base files for an old .pythia that never ran init', async () => {
    // Old workspace: only workflows/ with content, no manifest.json, no config.md/README.md.
    mkdirSync(join(tmpDir, '.pythia', 'workflows'), { recursive: true });
    writeFileSync(join(tmpDir, '.pythia', 'workflows', 'old.md'), 'pre-existing', 'utf8');

    await doUpdate(makeOpts(tmpDir));

    expect(existsSync(join(tmpDir, '.pythia', 'config', 'settings.md'))).toBe(true);
    expect(existsSync(join(tmpDir, '.pythia', 'README.md'))).toBe(true);
    expect(existsSync(join(tmpDir, '.pythia', 'workflows', '.gitkeep'))).toBe(true);
    expect(existsSync(join(tmpDir, '.pythia', 'workflows', 'old.md'))).toBe(true); // preserved
    const manifest = readManifest(tmpDir);
    expect(manifest.migratedVersion).toBe(manifest.frameworkVersion);

    // idempotent: re-running doesn't touch the seeded config
    const before = readFileSync(join(tmpDir, '.pythia', 'config', 'settings.md'), 'utf8');
    await doUpdate(makeOpts(tmpDir));
    expect(readFileSync(join(tmpDir, '.pythia', 'config', 'settings.md'), 'utf8')).toBe(before);
  });

  it('creates a pre-update backup before mutating adopted .pythia without committed local git history', async () => {
    mkdirSync(join(tmpDir, '.pythia', 'workflows'), { recursive: true });
    writeFileSync(join(tmpDir, '.pythia', 'workflows', 'old.md'), 'pre-existing', 'utf8');

    await doUpdate(makeOpts(tmpDir));

    const backupRoot = join(tmpDir, '.pythia', 'backups');
    const backupDir = readdirSync(backupRoot).find((entry) => entry.startsWith('pre-update-'));
    expect(backupDir).toBeDefined();
    expect(readFileSync(join(backupRoot, backupDir, '.pythia', 'workflows', 'old.md'), 'utf8')).toBe('pre-existing');
    expect(existsSync(join(backupRoot, backupDir, '.pythia', 'config', 'settings.md'))).toBe(false);
  });

  it('does not create fallback pre-update backup when .pythia git already has committed history', async () => {
    mkdirSync(join(tmpDir, '.pythia', 'workflows'), { recursive: true });
    writeFileSync(join(tmpDir, '.pythia', 'workflows', 'old.md'), 'pre-existing', 'utf8');
    spawnSync('git', ['init', join(tmpDir, '.pythia')], { encoding: 'utf8' });
    spawnSync('git', ['-C', join(tmpDir, '.pythia'), 'add', '.'], { encoding: 'utf8' });
    spawnSync('git', ['-C', join(tmpDir, '.pythia'), '-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'baseline'], { encoding: 'utf8' });

    await doUpdate(makeOpts(tmpDir));

    const backupRoot = join(tmpDir, '.pythia', 'backups');
    const preUpdateBackups = existsSync(backupRoot)
      ? readdirSync(backupRoot).filter((entry) => entry.startsWith('pre-update-'))
      : [];
    expect(preUpdateBackups).toHaveLength(0);
  });

  it('update renames version.json to manifest.json (one-time legacy migration)', async () => {
    mkdirSync(join(tmpDir, '.pythia'), { recursive: true });
    writeFileSync(
      join(tmpDir, '.pythia', 'version.json'),
      JSON.stringify({ frameworkVersion: '0.1.0', installedAt: new Date().toISOString(), surfaces: ['.claude/skills', '.agents/skills'], generated: {} }),
    );
    await doInit(makeOpts(tmpDir)); // init to create needed files
    // Simulate legacy: remove manifest.json, put back version.json
    rmSync(join(tmpDir, '.pythia', 'manifest.json'), { force: true });
    writeFileSync(
      join(tmpDir, '.pythia', 'version.json'),
      JSON.stringify({ frameworkVersion: '0.1.0', installedAt: new Date().toISOString(), surfaces: ['.claude/skills', '.agents/skills'], generated: {} }),
    );
    await doUpdate(makeOpts(tmpDir));
    expect(existsSync(join(tmpDir, '.pythia', 'manifest.json'))).toBe(true);
    expect(existsSync(join(tmpDir, '.pythia', 'version.json'))).toBe(false);
  });

  it('update preserves migratedVersion and gitStrategy', async () => {
    await doInit({ ...makeOpts(tmpDir), gitStrategy: 'pythia' });
    const before = JSON.parse(readFileSync(join(tmpDir, '.pythia', 'manifest.json'), 'utf8'));
    expect(before.gitStrategy).toBe('pythia');
    await doUpdate(makeOpts(tmpDir));
    const after = JSON.parse(readFileSync(join(tmpDir, '.pythia', 'manifest.json'), 'utf8'));
    expect(after.gitStrategy).toBe('pythia');
    expect(after.migratedVersion).toBe(before.migratedVersion);
  });

  it('update reads legacy version.json missing migratedVersion → defaults to 0.0.0', async () => {
    mkdirSync(join(tmpDir, '.pythia'), { recursive: true });
    // Simulate legacy manifest without migratedVersion (also need instruction files to exist)
    await doInit(makeOpts(tmpDir));
    // Replace manifest.json with a legacy-style one missing migratedVersion
    const existing = JSON.parse(readFileSync(join(tmpDir, '.pythia', 'manifest.json'), 'utf8'));
    delete existing.migratedVersion;
    rmSync(join(tmpDir, '.pythia', 'manifest.json'));
    writeFileSync(join(tmpDir, '.pythia', 'version.json'), JSON.stringify(existing));
    await doUpdate(makeOpts(tmpDir));
    const after = JSON.parse(readFileSync(join(tmpDir, '.pythia', 'manifest.json'), 'utf8'));
    // No pending migration files means successful update advances the workspace to the package version.
    expect(after.migratedVersion).toBe(after.frameworkVersion);
  });
});

describe('sha256', () => {
  it('produces consistent hashes', () => {
    const h1 = sha256('hello world');
    const h2 = sha256('hello world');
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64);
  });

  it('produces different hashes for different inputs', () => {
    expect(sha256('a')).not.toBe(sha256('b'));
  });
});
