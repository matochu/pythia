import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { restoreFromBackups } from '../backups.js';

describe('restoreFromBackups', () => {
  let root;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'pythia-backups-'));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('copies backup files back to target paths', () => {
    const rel = 'config/settings.md';
    const backupRel = '.pythia/backups/0.3.3/config/settings.md';
    mkdirSync(join(root, '.pythia/backups/0.3.3/config'), { recursive: true });
    writeFileSync(join(root, backupRel), 'original', 'utf8');
    mkdirSync(join(root, 'config'), { recursive: true });
    writeFileSync(join(root, rel), 'broken', 'utf8');

    const logs = [];
    const count = restoreFromBackups(root, [{ path: rel, backupPath: backupRel }], {
      log: (msg) => logs.push(msg),
    });

    expect(count).toBe(1);
    expect(readFileSync(join(root, rel), 'utf8')).toBe('original');
    expect(logs.some((l) => l.includes('restored:'))).toBe(true);
  });

  it('dry-run logs without writing', () => {
    const rel = 'a.txt';
    const backupRel = '.pythia/backups/1.0.0/a.txt';
    mkdirSync(join(root, '.pythia/backups/1.0.0'), { recursive: true });
    writeFileSync(join(root, backupRel), 'backup', 'utf8');
    writeFileSync(join(root, rel), 'current', 'utf8');

    const logs = [];
    const count = restoreFromBackups(root, [{ path: rel, backupPath: backupRel }], {
      dryRun: true,
      log: (msg) => logs.push(msg),
    });

    expect(count).toBe(1);
    expect(readFileSync(join(root, rel), 'utf8')).toBe('current');
    expect(logs.some((l) => l.includes('[restore]'))).toBe(true);
  });

  it('warns and skips missing backups when warnOnMissing', () => {
    const warns = [];
    const count = restoreFromBackups(
      root,
      [{ path: 'missing.txt', backupPath: '.pythia/backups/x/missing.txt' }],
      { warnOnMissing: true, warn: (msg) => warns.push(msg) },
    );
    expect(count).toBe(0);
    expect(warns.some((w) => w.includes('[SKIP]'))).toBe(true);
  });
});
