import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync, cpSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';
import { doInit, doUpdate, isWorkspace, sha256 } from '../workspace.js';
import type { WorkspaceOptions } from '../workspace.js';

// Package root: src/cli/tests/ → 3 levels up
const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, '../../../');

function makeOpts(target: string, dryRun = false): WorkspaceOptions {
  return { target, dryRun, packageRoot };
}

let tmpDir: string;

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

  it('returns false when version.json is corrupt', () => {
    mkdirSync(join(tmpDir, '.pythia'), { recursive: true });
    writeFileSync(join(tmpDir, '.pythia', 'version.json'), 'not-json');
    expect(isWorkspace(tmpDir)).toBe(false);
  });

  it('returns true when version.json is valid', () => {
    mkdirSync(join(tmpDir, '.pythia'), { recursive: true });
    writeFileSync(join(tmpDir, '.pythia', 'version.json'), JSON.stringify({ frameworkVersion: '0.1.0', generated: {} }));
    expect(isWorkspace(tmpDir)).toBe(true);
  });
});

describe('init', () => {
  it('seeds base .pythia structure', () => {
    doInit(makeOpts(tmpDir));
    expect(existsSync(join(tmpDir, '.pythia', 'version.json'))).toBe(true);
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
    // Both come from the same source — no per-output content logic
    expect(agents).not.toContain('{tool}');
    expect(claude).not.toContain('{tool}');
  });

  it('installs skills into .claude/skills and .agents/skills', () => {
    doInit(makeOpts(tmpDir));
    expect(existsSync(join(tmpDir, '.claude', 'skills'))).toBe(true);
    expect(existsSync(join(tmpDir, '.agents', 'skills'))).toBe(true);
    // At least one skill dir should exist
    const claudeSkills = existsSync(join(tmpDir, '.claude', 'skills'));
    expect(claudeSkills).toBe(true);
  });

  it('writes version stamp with generated manifest', () => {
    doInit(makeOpts(tmpDir));
    const versionJson = JSON.parse(readFileSync(join(tmpDir, '.pythia', 'version.json'), 'utf8'));
    expect(versionJson.frameworkVersion).toBeDefined();
    expect(typeof versionJson.frameworkVersion).toBe('string');
    expect(versionJson.installedAt).toBeDefined();
    expect(versionJson.generated['AGENTS.md']).toBeDefined();
    expect(versionJson.generated['CLAUDE.md']).toBeDefined();
    expect(versionJson.surfaces).toContain('.claude/skills');
    expect(versionJson.surfaces).toContain('.agents/skills');
  });

  it('auto-detect resolves to update after init', () => {
    doInit(makeOpts(tmpDir));
    expect(isWorkspace(tmpDir)).toBe(true);
  });

  it('dry-run writes nothing', () => {
    doInit(makeOpts(tmpDir, true));
    expect(existsSync(join(tmpDir, '.pythia', 'version.json'))).toBe(false);
    expect(existsSync(join(tmpDir, 'AGENTS.md'))).toBe(false);
    expect(existsSync(join(tmpDir, '.claude', 'skills'))).toBe(false);
  });

  it('throws when skills/ is missing', () => {
    // Use a fake packageRoot without skills/
    const fakeRoot = mkdtempSync(join(tmpdir(), 'fake-pkg-'));
    try {
      // Copy assets/ but not skills/
      cpSync(join(packageRoot, 'assets'), join(fakeRoot, 'assets'), { recursive: true });
      writeFileSync(join(fakeRoot, 'package.json'), JSON.stringify({ version: '0.1.0' }));
      expect(() => doInit({ target: tmpDir, dryRun: false, packageRoot: fakeRoot })).toThrow();
    } finally {
      rmSync(fakeRoot, { recursive: true, force: true });
    }
  });
});

describe('update', () => {
  it('prunes a removed skill from surfaces', () => {
    doInit(makeOpts(tmpDir));
    // Plant a fake skill in .claude/skills that doesn't exist in canonical skills/
    const fakeSkill = join(tmpDir, '.claude', 'skills', '_fake-deleted-skill');
    mkdirSync(fakeSkill, { recursive: true });
    expect(existsSync(fakeSkill)).toBe(true);
    doUpdate(makeOpts(tmpDir));
    expect(existsSync(fakeSkill)).toBe(false);
  });

  it('full-refreshes AGENTS.md without .bak when content matches manifest', () => {
    doInit(makeOpts(tmpDir));
    const before = readFileSync(join(tmpDir, 'AGENTS.md'), 'utf8');
    doUpdate(makeOpts(tmpDir));
    const after = readFileSync(join(tmpDir, 'AGENTS.md'), 'utf8');
    expect(after).toBe(before);
    expect(existsSync(join(tmpDir, 'AGENTS.md.bak'))).toBe(false);
  });

  it('writes .bak when AGENTS.md has been locally modified', () => {
    doInit(makeOpts(tmpDir));
    const original = readFileSync(join(tmpDir, 'AGENTS.md'), 'utf8');
    writeFileSync(join(tmpDir, 'AGENTS.md'), original + '\n# Local edit', 'utf8');
    doUpdate(makeOpts(tmpDir));
    expect(existsSync(join(tmpDir, 'AGENTS.md.bak'))).toBe(true);
    const bak = readFileSync(join(tmpDir, 'AGENTS.md.bak'), 'utf8');
    expect(bak).toContain('# Local edit');
  });

  it('writes .bak for first-adoption of unrecorded pre-existing file', () => {
    doInit(makeOpts(tmpDir));
    // Overwrite version.json without recording the new hash (simulate first-adoption)
    const ver = JSON.parse(readFileSync(join(tmpDir, '.pythia', 'version.json'), 'utf8'));
    delete ver.generated['AGENTS.md'];
    writeFileSync(join(tmpDir, '.pythia', 'version.json'), JSON.stringify(ver));
    doUpdate(makeOpts(tmpDir));
    expect(existsSync(join(tmpDir, 'AGENTS.md.bak'))).toBe(true);
  });

  it('does not clobber seed-if-missing files (config.md)', () => {
    doInit(makeOpts(tmpDir));
    const customConfig = '# My custom config\n\nCustomized content';
    writeFileSync(join(tmpDir, '.pythia', 'config.md'), customConfig, 'utf8');
    doUpdate(makeOpts(tmpDir));
    const after = readFileSync(join(tmpDir, '.pythia', 'config.md'), 'utf8');
    expect(after).toBe(customConfig);
  });

  it('dry-run writes nothing including no .bak', () => {
    doInit(makeOpts(tmpDir));
    const original = readFileSync(join(tmpDir, 'AGENTS.md'), 'utf8');
    writeFileSync(join(tmpDir, 'AGENTS.md'), original + '\n# Local', 'utf8');
    const beforeSize = readFileSync(join(tmpDir, 'AGENTS.md'), 'utf8');
    doUpdate(makeOpts(tmpDir, true));
    expect(existsSync(join(tmpDir, 'AGENTS.md.bak'))).toBe(false);
    expect(readFileSync(join(tmpDir, 'AGENTS.md'), 'utf8')).toBe(beforeSize);
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
