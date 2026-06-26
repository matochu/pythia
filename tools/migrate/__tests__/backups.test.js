import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { restoreFromPreUpdateBackup } from '../backups.js';

describe('restoreFromPreUpdateBackup', () => {
  let root;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'pythia-backups-'));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  /** Build a pre-update snapshot dir mirroring the workspace layout. */
  function makeSnapshot(relBackupDir, files) {
    for (const [rel, content] of Object.entries(files)) {
      const abs = join(root, relBackupDir, rel);
      mkdirSync(join(abs, '..'), { recursive: true });
      writeFileSync(abs, content, 'utf8');
    }
  }

  it('restores .pythia data + surfaces from the snapshot over current files', () => {
    const backupRel = '.pythia/backups/pre-update-stamp';
    makeSnapshot(backupRel, {
      '.pythia/config/settings.md': 'original',
      '.claude/skills/foo/SKILL.md': 'old-skill',
      'CLAUDE.md': 'old-instructions',
    });
    // Current (post-migration) state is different / broken
    mkdirSync(join(root, '.pythia/config'), { recursive: true });
    writeFileSync(join(root, '.pythia/config/settings.md'), 'broken', 'utf8');
    mkdirSync(join(root, '.claude/skills/foo'), { recursive: true });
    writeFileSync(join(root, '.claude/skills/foo/SKILL.md'), 'new-skill', 'utf8');
    writeFileSync(join(root, 'CLAUDE.md'), 'new-instructions', 'utf8');

    const logs = [];
    const count = restoreFromPreUpdateBackup(root, backupRel, { log: (m) => logs.push(m) });

    expect(count).toBe(3); // .pythia, .claude, CLAUDE.md
    expect(readFileSync(join(root, '.pythia/config/settings.md'), 'utf8')).toBe('original');
    expect(readFileSync(join(root, '.claude/skills/foo/SKILL.md'), 'utf8')).toBe('old-skill');
    expect(readFileSync(join(root, 'CLAUDE.md'), 'utf8')).toBe('old-instructions');
    expect(logs.some((l) => l.includes('restored:'))).toBe(true);
  });

  it('leaves files not present in the snapshot untouched (e.g. runtime)', () => {
    const backupRel = '.pythia/backups/pre-update-stamp';
    makeSnapshot(backupRel, { '.pythia/config/settings.md': 'original' });
    // runtime exists currently, not in snapshot → must remain
    mkdirSync(join(root, '.pythia/runtime'), { recursive: true });
    writeFileSync(join(root, '.pythia/runtime/inputs.js'), 'runtime-code', 'utf8');

    restoreFromPreUpdateBackup(root, backupRel);

    expect(existsSync(join(root, '.pythia/runtime/inputs.js'))).toBe(true);
    expect(readFileSync(join(root, '.pythia/config/settings.md'), 'utf8')).toBe('original');
  });

  it('dry-run logs without writing', () => {
    const backupRel = '.pythia/backups/pre-update-stamp';
    makeSnapshot(backupRel, { 'CLAUDE.md': 'backup' });
    writeFileSync(join(root, 'CLAUDE.md'), 'current', 'utf8');

    const logs = [];
    const count = restoreFromPreUpdateBackup(root, backupRel, { dryRun: true, log: (m) => logs.push(m) });

    expect(count).toBe(1);
    expect(readFileSync(join(root, 'CLAUDE.md'), 'utf8')).toBe('current');
    expect(logs.some((l) => l.includes('[restore]'))).toBe(true);
  });

  it('throws when the backup dir does not exist', () => {
    expect(() => restoreFromPreUpdateBackup(root, '.pythia/backups/missing')).toThrow(/not found/);
  });
});
