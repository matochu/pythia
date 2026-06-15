import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync, cpSync } from 'fs';
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
  it('seeds base .pythia structure', () => {
    doInit(makeOpts(tmpDir));
    expect(existsSync(join(tmpDir, '.pythia', 'manifest.json'))).toBe(true);
    expect(existsSync(join(tmpDir, '.pythia', 'config.md'))).toBe(true);
    expect(existsSync(join(tmpDir, '.pythia', 'README.md'))).toBe(true);
    expect(existsSync(join(tmpDir, '.pythia', 'workflows', '.gitkeep'))).toBe(true);
  });

  it('renders AGENTS.md and CLAUDE.md from assets/instructions.md', () => {
    doInit(makeOpts(tmpDir));
    const agents = readFileSync(join(tmpDir, 'AGENTS.md'), 'utf8');
    const claude = readFileSync(join(tmpDir, 'CLAUDE.md'), 'utf8');
    expect(agents).toContain('Codex');
    expect(agents).toContain('.agents/skills');
    expect(claude).toContain('Claude Code');
    expect(claude).toContain('.claude/skills');
    expect(agents).not.toContain('{tool}');
    expect(claude).not.toContain('{tool}');
  });

  it('installs skills into .claude/skills and .agents/skills', () => {
    doInit(makeOpts(tmpDir));
    expect(existsSync(join(tmpDir, '.claude', 'skills'))).toBe(true);
    expect(existsSync(join(tmpDir, '.agents', 'skills'))).toBe(true);
  });

  it('writes manifest.json with generated manifest and migratedVersion', () => {
    doInit(makeOpts(tmpDir));
    const manifest = JSON.parse(readFileSync(join(tmpDir, '.pythia', 'manifest.json'), 'utf8'));
    expect(manifest.frameworkVersion).toBeDefined();
    expect(typeof manifest.frameworkVersion).toBe('string');
    expect(manifest.migratedVersion).toBe(manifest.frameworkVersion);
    expect(manifest.installedAt).toBeDefined();
    expect(manifest.generated['AGENTS.md']).toBeDefined();
    expect(manifest.generated['CLAUDE.md']).toBeDefined();
    expect(manifest.surfaces).toContain('.claude/skills');
    expect(manifest.surfaces).toContain('.agents/skills');
    expect(manifest.gitStrategy).toBe('ignore');
  });

  it('fresh empty init sets migratedVersion to frameworkVersion', () => {
    doInit(makeOpts(tmpDir));
    const manifest = JSON.parse(readFileSync(join(tmpDir, '.pythia', 'manifest.json'), 'utf8'));
    expect(manifest.migratedVersion).toBe(manifest.frameworkVersion);
  });

  it('adopted target (existing protected artifacts) sets migratedVersion to 0.0.0', () => {
    // Seed a protected artifact to simulate an adopted workspace
    mkdirSync(join(tmpDir, '.pythia', 'workflows'), { recursive: true });
    writeFileSync(join(tmpDir, '.pythia', 'workflows', 'some-feature.md'), '# feature', 'utf8');
    doInit(makeOpts(tmpDir));
    const manifest = JSON.parse(readFileSync(join(tmpDir, '.pythia', 'manifest.json'), 'utf8'));
    expect(manifest.migratedVersion).toBe('0.0.0');
  });

  it('auto-detect resolves to update after init', () => {
    doInit(makeOpts(tmpDir));
    expect(isWorkspace(tmpDir)).toBe(true);
  });

  it('dry-run writes nothing', () => {
    doInit(makeOpts(tmpDir, true));
    expect(existsSync(join(tmpDir, '.pythia', 'manifest.json'))).toBe(false);
    expect(existsSync(join(tmpDir, 'AGENTS.md'))).toBe(false);
    expect(existsSync(join(tmpDir, '.claude', 'skills'))).toBe(false);
  });

  it('throws when skills/ is missing', () => {
    const fakeRoot = mkdtempSync(join(tmpdir(), 'fake-pkg-'));
    try {
      cpSync(join(packageRoot, 'assets'), join(fakeRoot, 'assets'), { recursive: true });
      writeFileSync(join(fakeRoot, 'package.json'), JSON.stringify({ version: '0.1.0' }));
      expect(() => doInit({ target: tmpDir, dryRun: false, packageRoot: fakeRoot })).toThrow();
    } finally {
      rmSync(fakeRoot, { recursive: true, force: true });
    }
  });

  it('--surfaces claude installs only .claude/skills, not .agents/skills', () => {
    doInit({ ...makeOpts(tmpDir), surfaces: ['.claude/skills'] });
    expect(existsSync(join(tmpDir, '.claude', 'skills'))).toBe(true);
    expect(existsSync(join(tmpDir, 'CLAUDE.md'))).toBe(true);
    expect(existsSync(join(tmpDir, 'AGENTS.md'))).toBe(false);
  });

  it('--git-strategy pythia persists in manifest.json', () => {
    doInit({ ...makeOpts(tmpDir), gitStrategy: 'pythia' });
    const manifest = JSON.parse(readFileSync(join(tmpDir, '.pythia', 'manifest.json'), 'utf8'));
    expect(manifest.gitStrategy).toBe('pythia');
  });

  it('re-run without --reconfigure preserves existing manifest fields', () => {
    doInit({ ...makeOpts(tmpDir), gitStrategy: 'pythia' });
    doInit({ ...makeOpts(tmpDir) }); // re-run without reconfigure
    const manifest = JSON.parse(readFileSync(join(tmpDir, '.pythia', 'manifest.json'), 'utf8'));
    // gitStrategy from first run should be preserved via field-preservation
    expect(manifest.gitStrategy).toBe('pythia');
  });
});

describe('init: git-strategy side effects via CLI', () => {
  it('--git-strategy pythia initializes .pythia/.git', () => {
    const cliPath = resolve(packageRoot, 'src/cli/index.js');
    const result = spawnSync('node', [cliPath, 'init', '--yes', '--git-strategy', 'pythia', '--target', tmpDir], {
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    expect(existsSync(join(tmpDir, '.pythia', '.git'))).toBe(true);
    const manifest = readManifest(tmpDir);
    expect(manifest.gitStrategy).toBe('pythia');
  });

  it('--git-strategy pythia reuses existing .pythia/.git on re-run', () => {
    const cliPath = resolve(packageRoot, 'src/cli/index.js');
    spawnSync('node', [cliPath, 'init', '--yes', '--git-strategy', 'pythia', '--target', tmpDir], { encoding: 'utf8' });
    const r2 = spawnSync('node', [cliPath, 'init', '--yes', '--git-strategy', 'pythia', '--target', tmpDir], { encoding: 'utf8' });
    expect(r2.status).toBe(0);
    expect(existsSync(join(tmpDir, '.pythia', '.git'))).toBe(true);
  });

  it('--git-strategy shared falls back to ignore when target is not a git repo', () => {
    const cliPath = resolve(packageRoot, 'src/cli/index.js');
    const result = spawnSync('node', [cliPath, 'init', '--yes', '--git-strategy', 'shared', '--target', tmpDir], {
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
  it('prunes a removed skill from surfaces', async () => {
    doInit(makeOpts(tmpDir));
    const fakeSkill = join(tmpDir, '.claude', 'skills', '_fake-deleted-skill');
    mkdirSync(fakeSkill, { recursive: true });
    expect(existsSync(fakeSkill)).toBe(true);
    await doUpdate(makeOpts(tmpDir));
    expect(existsSync(fakeSkill)).toBe(false);
  });

  it('full-refreshes AGENTS.md without .bak when content matches manifest', async () => {
    doInit(makeOpts(tmpDir));
    const before = readFileSync(join(tmpDir, 'AGENTS.md'), 'utf8');
    await doUpdate(makeOpts(tmpDir));
    const after = readFileSync(join(tmpDir, 'AGENTS.md'), 'utf8');
    expect(after).toBe(before);
    expect(existsSync(join(tmpDir, 'AGENTS.md.bak'))).toBe(false);
  });

  it('writes .bak when AGENTS.md has been locally modified', async () => {
    doInit(makeOpts(tmpDir));
    const original = readFileSync(join(tmpDir, 'AGENTS.md'), 'utf8');
    writeFileSync(join(tmpDir, 'AGENTS.md'), original + '\n# Local edit', 'utf8');
    await doUpdate(makeOpts(tmpDir));
    expect(existsSync(join(tmpDir, 'AGENTS.md.bak'))).toBe(true);
    const bak = readFileSync(join(tmpDir, 'AGENTS.md.bak'), 'utf8');
    expect(bak).toContain('# Local edit');
  });

  it('writes .bak for first-adoption of unrecorded pre-existing file', async () => {
    doInit(makeOpts(tmpDir));
    const manifest = JSON.parse(readFileSync(join(tmpDir, '.pythia', 'manifest.json'), 'utf8'));
    delete manifest.generated['AGENTS.md'];
    writeFileSync(join(tmpDir, '.pythia', 'manifest.json'), JSON.stringify(manifest));
    await doUpdate(makeOpts(tmpDir));
    expect(existsSync(join(tmpDir, 'AGENTS.md.bak'))).toBe(true);
  });

  it('does not clobber seed-if-missing files (config.md)', async () => {
    doInit(makeOpts(tmpDir));
    const customConfig = '# My custom config\n\nCustomized content';
    writeFileSync(join(tmpDir, '.pythia', 'config.md'), customConfig, 'utf8');
    await doUpdate(makeOpts(tmpDir));
    const after = readFileSync(join(tmpDir, '.pythia', 'config.md'), 'utf8');
    expect(after).toBe(customConfig);
  });

  it('dry-run writes nothing including no .bak', async () => {
    doInit(makeOpts(tmpDir));
    const original = readFileSync(join(tmpDir, 'AGENTS.md'), 'utf8');
    writeFileSync(join(tmpDir, 'AGENTS.md'), original + '\n# Local', 'utf8');
    const beforeContent = readFileSync(join(tmpDir, 'AGENTS.md'), 'utf8');
    await doUpdate(makeOpts(tmpDir, true));
    expect(existsSync(join(tmpDir, 'AGENTS.md.bak'))).toBe(false);
    expect(readFileSync(join(tmpDir, 'AGENTS.md'), 'utf8')).toBe(beforeContent);
  });

  it('update renames version.json to manifest.json (one-time legacy migration)', async () => {
    mkdirSync(join(tmpDir, '.pythia'), { recursive: true });
    writeFileSync(
      join(tmpDir, '.pythia', 'version.json'),
      JSON.stringify({ frameworkVersion: '0.1.0', installedAt: new Date().toISOString(), surfaces: ['.claude/skills', '.agents/skills'], generated: {} }),
    );
    doInit(makeOpts(tmpDir)); // init to create needed files
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
    doInit({ ...makeOpts(tmpDir), gitStrategy: 'pythia' });
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
    doInit(makeOpts(tmpDir));
    // Replace manifest.json with a legacy-style one missing migratedVersion
    const existing = JSON.parse(readFileSync(join(tmpDir, '.pythia', 'manifest.json'), 'utf8'));
    delete existing.migratedVersion;
    rmSync(join(tmpDir, '.pythia', 'manifest.json'));
    writeFileSync(join(tmpDir, '.pythia', 'version.json'), JSON.stringify(existing));
    await doUpdate(makeOpts(tmpDir));
    const after = JSON.parse(readFileSync(join(tmpDir, '.pythia', 'manifest.json'), 'utf8'));
    // migratedVersion should be preserved from legacy (0.0.0 default) not overwritten
    expect(after.migratedVersion).toBe('0.0.0');
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
