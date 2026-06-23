/**
 * Integration tests: uninstall removes managed surfaces, preserves workflows.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import {
  mkdirSync,
  writeFileSync,
  existsSync,
  readFileSync,
  rmSync,
} from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { doInit, doUninstall, isWorkspace } from '../workspace.js';
import {
  freshInstalledWorkspace,
  runCli,
  indexJs,
  makeOpts,
} from './helpers/workspace.js';

vi.setConfig({ testTimeout: 30000, hookTimeout: 30000 });

let sharedWs;
let mutatingWs;

// One install cycle, one uninstall — all read-only assertions share this workspace.
beforeAll(async () => {
  sharedWs = await freshInstalledWorkspace('pythia-ws-uninstall-shared-');
  await doUninstall({ target: sharedWs, yes: true });
});

afterAll(() => {
  if (sharedWs) rmSync(sharedWs, { recursive: true, force: true });
});

beforeEach(async () => {
  mutatingWs = await freshInstalledWorkspace('pythia-ws-uninstall-mut-');
});

afterEach(() => {
  if (mutatingWs) rmSync(mutatingWs, { recursive: true, force: true });
});

describe('doUninstall comprehensive (shared workspace)', () => {
  it('isWorkspace returns false', () => {
    expect(isWorkspace(sharedWs)).toBe(false);
  });

  it('removes CLAUDE.md and AGENTS.md', () => {
    expect(existsSync(join(sharedWs, 'CLAUDE.md'))).toBe(false);
    expect(existsSync(join(sharedWs, 'AGENTS.md'))).toBe(false);
  });

  it('removes .pythia/runtime/', () => {
    expect(existsSync(join(sharedWs, '.pythia/runtime'))).toBe(false);
  });

  it('removes .pythia/manifest.json', () => {
    expect(existsSync(join(sharedWs, '.pythia/manifest.json'))).toBe(false);
  });

  it('removes pythia-managed entries from .claude/settings.json', () => {
    const s = JSON.parse(readFileSync(join(sharedWs, '.claude/settings.json'), 'utf8'));
    for (const entries of Object.values(s.hooks ?? {})) {
      for (const h of entries) {
        expect(h._managed).not.toBe('pythia');
        expect(JSON.stringify(h)).not.toContain('pythia-managed');
      }
    }
    expect(s.hooks?.SessionStart ?? []).toHaveLength(0);
  });

  it('removes pythia-managed entries from hooks.json', () => {
    const h = JSON.parse(readFileSync(join(sharedWs, 'hooks.json'), 'utf8'));
    for (const entries of Object.values(h.hooks ?? {})) {
      for (const entry of entries) {
        expect(entry._managed).not.toBe('pythia');
      }
    }
  });
});

describe('doUninstall cursor surface', () => {
  let cursorWs;

  beforeEach(async () => {
    cursorWs = await freshInstalledWorkspace('pythia-ws-uninstall-cursor-');
    await doInit(makeOpts(cursorWs, {
      surfaces: ['.claude/skills', '.agents/skills', '.cursor/skills'],
    }));
  });

  afterEach(() => {
    if (cursorWs) rmSync(cursorWs, { recursive: true, force: true });
  });

  it('removes pythia-managed entries from .cursor/hooks.json', async () => {
    expect(existsSync(join(cursorWs, '.cursor', 'hooks.json'))).toBe(true);
    await doUninstall({ target: cursorWs, yes: true });
    const h = JSON.parse(readFileSync(join(cursorWs, '.cursor', 'hooks.json'), 'utf8'));
    for (const entries of Object.values(h.hooks ?? {})) {
      for (const entry of entries) {
        expect(entry._managed).not.toBe('pythia');
        expect(String(entry.command ?? '')).not.toContain('.pythia/runtime/hooks');
      }
    }
  });

  it('removes pythia-installed skills from .cursor/skills', async () => {
    const manifest = JSON.parse(readFileSync(join(cursorWs, '.pythia/manifest.json'), 'utf8'));
    const skill = manifest.installedSkills[0];
    await doUninstall({ target: cursorWs, yes: true });
    expect(existsSync(join(cursorWs, '.cursor/skills', skill))).toBe(false);
  });
});

describe('doUninstall preservation and skills', () => {
  it('preserves .pythia/workflows/', async () => {
    const workflowsDir = join(mutatingWs, '.pythia/workflows');
    mkdirSync(workflowsDir, { recursive: true });
    writeFileSync(join(workflowsDir, 'keep.md'), '# keep\n', 'utf8');
    await doUninstall({ target: mutatingWs, yes: true });
    expect(existsSync(join(workflowsDir, 'keep.md'))).toBe(true);
  });

  it('removes pythia-installed skills from all surfaces', async () => {
    const manifest = JSON.parse(readFileSync(join(mutatingWs, '.pythia/manifest.json'), 'utf8'));
    const skill = manifest.installedSkills[0];
    await doUninstall({ target: mutatingWs, yes: true });
    expect(existsSync(join(mutatingWs, '.claude/skills', skill))).toBe(false);
    expect(existsSync(join(mutatingWs, '.agents/skills', skill))).toBe(false);
  });

  it('removes .codex/rules/default.rules when pythia-shipped', async () => {
    const rulesPath = join(mutatingWs, '.codex/rules/default.rules');
    expect(existsSync(rulesPath)).toBe(true);
    await doUninstall({ target: mutatingWs, yes: true });
    expect(existsSync(rulesPath)).toBe(false);
  });

  it('preserves user-modified .codex/rules/default.rules', async () => {
    const rulesPath = join(mutatingWs, '.codex/rules/default.rules');
    writeFileSync(rulesPath, '# User custom rules\n', 'utf8');
    await doUninstall({ target: mutatingWs, yes: true });
    expect(existsSync(rulesPath)).toBe(true);
    expect(readFileSync(rulesPath, 'utf8')).toBe('# User custom rules\n');
  });

  it('preserves user-added skills not in installedSkills', async () => {
    const userSkill = join(mutatingWs, '.claude/skills/my-custom-skill');
    mkdirSync(userSkill, { recursive: true });
    writeFileSync(join(userSkill, 'SKILL.md'), '# Custom\n', 'utf8');
    await doUninstall({ target: mutatingWs, yes: true });
    expect(existsSync(join(userSkill, 'SKILL.md'))).toBe(true);
  });

  it('preserves non-pythia hook entries in settings.json', async () => {
    const settingsPath = join(mutatingWs, '.claude/settings.json');
    const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
    settings.hooks.PreToolUse.push({
      hooks: [{ type: 'command', command: 'echo', args: ['user-hook-marker'] }],
    });
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    await doUninstall({ target: mutatingWs, yes: true });
    const after = JSON.parse(readFileSync(settingsPath, 'utf8'));
    const kept = (after.hooks?.PreToolUse ?? []).some((h) =>
      JSON.stringify(h).includes('user-hook-marker')
    );
    expect(kept).toBe(true);
  });
});

describe('doUninstall legacy paths', () => {
  it('removes version.json alongside manifest.json', async () => {
    writeFileSync(
      join(mutatingWs, '.pythia/version.json'),
      JSON.stringify({ frameworkVersion: '0.1.0' }),
      'utf8'
    );
    await doUninstall({ target: mutatingWs, yes: true });
    expect(existsSync(join(mutatingWs, '.pythia/version.json'))).toBe(false);
    expect(isWorkspace(mutatingWs)).toBe(false);
  });

  it('removes legacy pythia hook entries targeting runtime hooks from .claude/settings.json', async () => {
    const settingsPath = join(mutatingWs, '.claude/settings.json');
    const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
    settings.hooks.PreToolUse.push({
      hooks: [{
        type: 'command',
        command: 'node',
        args: ['.pythia/runtime/hooks/legacy-pre.js'],
      }],
    });
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    await doUninstall({ target: mutatingWs, yes: true });
    const after = JSON.parse(readFileSync(settingsPath, 'utf8'));
    const legacy = (after.hooks?.PreToolUse ?? []).find((h) =>
      JSON.stringify(h).includes('.pythia/runtime/hooks')
    );
    expect(legacy).toBeUndefined();
  });

  it('removes legacy pythia hook entries targeting runtime hooks from hooks.json', async () => {
    const hooksPath = join(mutatingWs, 'hooks.json');
    const hooks = JSON.parse(readFileSync(hooksPath, 'utf8'));
    hooks.hooks.PreToolUse.push({
      hooks: [{
        type: 'command',
        command: 'node',
        args: ['.pythia/runtime/hooks/legacy-pre.js'],
      }],
    });
    writeFileSync(hooksPath, JSON.stringify(hooks, null, 2), 'utf8');
    await doUninstall({ target: mutatingWs, yes: true });
    const after = JSON.parse(readFileSync(hooksPath, 'utf8'));
    const legacy = (after.hooks?.PreToolUse ?? []).find((h) =>
      JSON.stringify(h).includes('.pythia/runtime/hooks')
    );
    expect(legacy).toBeUndefined();
  });

  it('does not remove user hooks that only mention pythia-managed in unrelated args', async () => {
    const settingsPath = join(mutatingWs, '.claude/settings.json');
    const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
    settings.hooks.PreToolUse.push({
      hooks: [{ type: 'command', command: 'echo', args: ['pythia-managed-legacy-marker-in-args'] }],
    });
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    await doUninstall({ target: mutatingWs, yes: true });
    const after = JSON.parse(readFileSync(settingsPath, 'utf8'));
    const kept = (after.hooks?.PreToolUse ?? []).some((h) =>
      JSON.stringify(h).includes('pythia-managed-legacy-marker-in-args')
    );
    expect(kept).toBe(true);
  });
});

describe('doUninstall idempotency and dry-run', () => {
  it('second uninstall is a no-op', async () => {
    await doUninstall({ target: mutatingWs, yes: true });
    const code = await doUninstall({ target: mutatingWs, yes: true });
    expect(code).toBe(0);
  });

  it('dry-run prints actions without writing', async () => {
    const manifestBefore = readFileSync(join(mutatingWs, '.pythia/manifest.json'), 'utf8');
    const code = await doUninstall({ target: mutatingWs, yes: true, dryRun: true });
    expect(code).toBe(0);
    expect(readFileSync(join(mutatingWs, '.pythia/manifest.json'), 'utf8')).toBe(manifestBefore);
    expect(isWorkspace(mutatingWs)).toBe(true);
  });
});

describe('pythia uninstall CLI', () => {
  it('--help prints usage', () => {
    const r = runCli(['uninstall', '--help']);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/uninstall/i);
  });

  it('--dry-run via CLI prints would remove without deleting', () => {
    const r = runCli(['uninstall', mutatingWs, '--yes', '--dry-run']);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/\[uninstall\].*dry-run/);
    expect(r.stdout).toMatch(/would remove/);
    expect(isWorkspace(mutatingWs)).toBe(true);
  });

  it('non-interactive without --yes refuses to uninstall', () => {
    const r = spawnSync('node', [indexJs, 'uninstall', mutatingWs], {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/requires --yes/);
    expect(isWorkspace(mutatingWs)).toBe(true);
  });
});
