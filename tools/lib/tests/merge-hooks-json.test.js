import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mergeHooksJson } from '../merge-hooks-json.js';

describe('mergeHooksJson', () => {
  let dir;
  let hooksDir;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'merge-hooks-'));
    hooksDir = join(dir, 'hooks');
    mkdirSync(hooksDir, { recursive: true });
    writeFileSync(
      join(hooksDir, 'template.json'),
      JSON.stringify({
        hooks: {
          PreToolUse: [{ command: 'node "{{HOOKS_DIR}}/pre.js"', _managed: 'pythia' }],
          PostToolUse: [{ command: 'node "{{HOOKS_DIR}}/post.js"' }],
        },
      }),
      'utf8',
    );
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('merges template into empty target and substitutes HOOKS_DIR', () => {
    const targetPath = join(dir, 'hooks.json');
    const absHooks = '/ws/.pythia/runtime/hooks';
    const ok = mergeHooksJson({
      targetPath,
      templatePath: join(hooksDir, 'template.json'),
      hooksAbsDir: absHooks,
      dryRun: false,
      logLabel: 'hooks.json',
    });
    expect(ok).toBe(true);
    const doc = JSON.parse(readFileSync(targetPath, 'utf8'));
    expect(doc.hooks.PreToolUse).toHaveLength(1);
    expect(doc.hooks.PreToolUse[0].command).toContain(absHooks);
    expect(doc.hooks.PreToolUse[0]._managed).toBe('pythia');
  });

  it('preserves user hooks and replaces prior pythia-managed entries', () => {
    const targetPath = join(dir, 'hooks.json');
    writeFileSync(
      targetPath,
      JSON.stringify({
        hooks: {
          PreToolUse: [
            { command: 'echo user-hook' },
            { command: 'node /old/.pythia/runtime/hooks/pre.js', _managed: 'pythia' },
          ],
        },
      }),
      'utf8',
    );

    mergeHooksJson({
      targetPath,
      templatePath: join(hooksDir, 'template.json'),
      hooksAbsDir: '/new/hooks',
      dryRun: false,
      logLabel: 'hooks.json',
    });

    const doc = JSON.parse(readFileSync(targetPath, 'utf8'));
    expect(doc.hooks.PreToolUse).toHaveLength(2);
    expect(doc.hooks.PreToolUse.some((h) => h.command === 'echo user-hook')).toBe(true);
    expect(doc.hooks.PreToolUse.filter((h) => h._managed === 'pythia')).toHaveLength(1);
    expect(doc.hooks.PreToolUse.find((h) => h._managed === 'pythia').command).toContain('/new/hooks');
  });

  it('returns false when template is missing', () => {
    const targetPath = join(dir, 'hooks.json');
    const ok = mergeHooksJson({
      targetPath,
      templatePath: join(hooksDir, 'missing.json'),
      hooksAbsDir: '/hooks',
      dryRun: false,
      logLabel: 'hooks.json',
    });
    expect(ok).toBe(false);
  });
});
