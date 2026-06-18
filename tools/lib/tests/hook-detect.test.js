import { describe, it, expect } from 'vitest';
import { isPythiaManagedHook, isPythiaManagedHookEntry, hooksFileHasPythiaManaged } from '../hook-detect.js';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('isPythiaManagedHook', () => {
  it('matches _managed marker', () => {
    expect(isPythiaManagedHook({ _managed: 'pythia', command: 'echo' })).toBe(true);
  });

  it('matches runtime hooks path in args only', () => {
    expect(isPythiaManagedHook({
      type: 'command',
      command: 'node',
      args: ['.pythia/runtime/hooks/post.js'],
    })).toBe(true);
  });

  it('does not match unrelated user hook args', () => {
    expect(isPythiaManagedHook({
      type: 'command',
      command: 'echo',
      args: ['pythia-managed-legacy-marker-in-args'],
    })).toBe(false);
  });
});

describe('hooksFileHasPythiaManaged', () => {
  let dir;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'hook-detect-'));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('detects flat codex/cursor entry', () => {
    writeFileSync(join(dir, 'hooks.json'), JSON.stringify({
      hooks: {
        PreToolUse: [{ command: 'node .pythia/runtime/hooks/pre.js', _managed: 'pythia' }],
      },
    }), 'utf8');
    expect(hooksFileHasPythiaManaged(dir, 'hooks.json')).toBe(true);
  });
});

describe('isPythiaManagedHookEntry', () => {
  it('detects nested Claude hooks array', () => {
    expect(isPythiaManagedHookEntry({
      hooks: [{ type: 'command', command: 'node', args: ['.pythia/runtime/hooks/pre.js'] }],
    })).toBe(true);
  });
});
