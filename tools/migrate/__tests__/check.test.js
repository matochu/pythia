import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  buildSyncBatch,
  canApplySync,
  collectState,
  computeStatus,
  countInvalidRefs,
  parseInputsCheck,
  runVerify,
  stripDuplicateVerifyLine,
} from '../check.js';

let tmpDir;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'pythia-check-test-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

function writeMigration(version) {
  const dir = join(tmpDir, '.pythia', 'runtime', 'migrations');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${version}.md`), `# ${version}\n`, 'utf8');
}

function writeState(version, changedPaths) {
  const dir = join(tmpDir, '.pythia', 'backups', version);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'state.json'), JSON.stringify({ migrationVersion: version, changedPaths }, null, 2), 'utf8');
}

describe('migrate check helper', () => {
  it('parses inputs check stale files, stale roots, and invalid lines', () => {
    const parsed = parseInputsCheck([
      '✗ .pythia/workflows/a.plan.md — 2 STALE, 1 INVALID',
      '✗ ../../../../config/paths.md — STALE (stored: old, current: new)',
      '! .pythia/workflows/a.plan.md: missing ref target',
    ].join('\n'));

    expect(parsed.staleFiles).toEqual([{ file: '.pythia/workflows/a.plan.md', stale: 2, invalid: 1 }]);
    expect([...parsed.staleDeps.entries()]).toEqual([['../../../../config/paths.md', 1]]);
    expect(parsed.invalidLines).toHaveLength(1);
    expect(countInvalidRefs(parsed)).toBe(1);
    expect(countInvalidRefs({ ...parsed, invalidLines: [] })).toBe(1);
  });

  it('collects only migrations in range and deduplicates changed paths', () => {
    writeMigration('0.3.7');
    writeMigration('0.3.8');
    writeMigration('0.3.9');
    writeState('0.3.8', [
      '.pythia/config/paths.md',
      '.pythia/workflows/features/f/plans/1.plan.md',
      '.pythia/workflows/features/f/plans/1.plan.md',
    ]);

    const state = collectState(tmpDir, '0.3.7', '0.3.8');

    expect(state.inRange).toEqual(['0.3.8']);
    expect(state.changedPaths).toEqual([
      '.pythia/config/paths.md',
      '.pythia/workflows/features/f/plans/1.plan.md',
    ]);
    expect(state.byType).toEqual({ paths: 1, plan: 1 });
    expect(state.warnings).toEqual([]);
  });

  it('reports missing state as warning only for migration files in range', () => {
    writeMigration('0.3.8');

    const state = collectState(tmpDir, '0.3.7', '0.3.8');

    expect(state.warnings).toEqual(['no state for 0.3.8']);
    expect(state.infos).toEqual(['no migration file for 0.3.7']);
  });

  it('computes FAIL only for verify failure and WARN for follow-up findings', () => {
    const base = {
      verifyCode: 0,
      metadataIssues: [],
      refsOwnedIssues: [],
      staleCount: 0,
      invalidCount: 0,
      stateWarnings: [],
    };

    expect(computeStatus(base)).toBe('PASS');
    expect(computeStatus({ ...base, verifyCode: 1 })).toBe('FAIL');
    expect(computeStatus({ ...base, metadataIssues: [{ file: 'x', message: 'bad' }] })).toBe('WARN');
    expect(computeStatus({ ...base, refsOwnedIssues: [{ file: 'x', message: 'phantom' }] })).toBe('WARN');
    expect(computeStatus({ ...base, staleCount: 1 })).toBe('WARN');
    expect(computeStatus({ ...base, invalidCount: 1 })).toBe('WARN');
    expect(computeStatus({ ...base, stateWarnings: ['no state'] })).toBe('WARN');
  });

  it('strips duplicate verify OK line from verify.js stdout', () => {
    expect(stripDuplicateVerifyLine('verify 0.3.8: OK\n', '0.3.8')).toBe('');
    expect(stripDuplicateVerifyLine('verify 0.3.8: OK\ndetail', '0.3.8')).toBe('detail');
  });

  it('treats missing verify script as a fail-level check', () => {
    const result = runVerify(tmpDir, '0.3.8');

    expect(result.code).toBe(1);
    expect(result.stderr).toContain('verify script unavailable');
  });

  it('allows apply-sync for stale refs and syncable phantom references only', () => {
    const staleFiles = [{ file: '.pythia/workflows/a.plan.md', stale: 1, invalid: 0 }];
    const phantomReference = {
      file: '.pythia/workflows/b.context.md',
      message: '[refs-owned.phantom_reference] ## References entry is not cited in body',
    };
    const phantomUsedBy = {
      file: '.pythia/workflows/c.context.md',
      message: '[refs-owned.phantom_used_by] ## Used by entry is not backed by a consumer',
    };

    expect(canApplySync({ staleFiles, metadataIssues: [], refsOwnedIssues: [] })).toBe(true);
    expect(canApplySync({ staleFiles: [], metadataIssues: [], refsOwnedIssues: [phantomReference] })).toBe(true);
    expect(canApplySync({ staleFiles, metadataIssues: [{ file: 'x', message: 'bad' }], refsOwnedIssues: [] })).toBe(false);
    expect(canApplySync({ staleFiles, metadataIssues: [], refsOwnedIssues: [phantomUsedBy] })).toBe(false);

    expect(buildSyncBatch(staleFiles, [phantomReference])).toEqual([
      staleFiles[0],
      { file: phantomReference.file, stale: 0, invalid: 0, refsOwned: true },
    ]);
  });
});
