import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { computeMetadataSync, applyMetadataSync, syncMetadataFile } from '../metadata/sync.js';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeReview({ round = 'R1', verdict = 'NEEDS_REVISION', planVersion = 'v1', rounds = [] } = {}) {
  const extraRounds = rounds.map(
    (r) => `\n## slug ${r.round} — 2026-06-21\n\nReview for: [Plan ${r.planVersion}](../plans/slug.plan.md)\nVerdict: ${r.verdict}\n`,
  ).join('');
  return `# Review: slug

## Metadata

- **Schema**: pythia-artifact-v1
- **Id**: slug-review
- **Title**: Review
- **Artifact**: review
- **Plan**: plans/slug.plan.md
- **Plan-Version**: ${planVersion}
- **Round**: ${round}
- **Verdict**: ${verdict}

## Navigation

## slug R1 — 2026-06-21

Review for: [Plan v1](../plans/slug.plan.md)
Verdict: NEEDS_REVISION
${extraRounds}`;
}

function makePlan({ version = 'v1', round = 'Initial plan — no review yet', rows = [] } = {}) {
  const tableRows = rows.length
    ? rows.map((r) => `| ${r.version} | ${r.round} | 2026-06-21 | ${r.changed ?? 'Steps 1-N'} | ${r.summary ?? 'Updated'} |`).join('\n')
    : `| v1 | Initial plan — no review yet | 2026-06-21 | Steps 1-N | Initial plan |`;
  return `# Plan slug: Plan

## Metadata

- **Schema**: pythia-artifact-v1
- **Id**: slug
- **Title**: Plan
- **Artifact**: plan
- **Status**: Draft
- **Version**: ${version}
- **Branch**: main
- **Round**: ${round}

## Plan revision log

| Version | Round | Date | Changed Steps | Summary |
| ------- | ----- | ---- | ------------- | ------- |
${tableRows}
`;
}

function makeImpl({ round = 'I1', planVersion = 'v1', tableRows = [] } = {}) {
  const rows = tableRows.length
    ? tableRows.map((r) => `| ${r.round} | ${r.pv} | 2026-06-21 | ${r.result ?? 'done'} |`).join('\n')
    : `| I1 | v1 | 2026-06-21 | done |`;
  return `# Implementation Report

## Metadata

- **Schema**: pythia-artifact-v1
- **Id**: slug-impl
- **Title**: Impl
- **Artifact**: implementation-report
- **Plan**: plans/slug.plan.md
- **Plan-Version**: ${planVersion}
- **Review**: reports/slug.review.md
- **Round**: ${round}
- **Result**: implemented

## Plan-Implementation Compatibility

| Implementation Round | Plan Version | Date | Result |
| -------------------- | ------------ | ---- | ------ |
${rows}
`;
}

function makeAudit({ round = 'A1', verdict = 'ready', multiRound = false } = {}) {
  const meta = `# Audit

## Metadata

- **Schema**: pythia-artifact-v1
- **Id**: slug-audit
- **Title**: Audit
- **Artifact**: audit-report
- **Implementation**: reports/slug.implementation.md
- **Round**: ${round}
- **Verdict**: ${verdict}
`;
  if (multiRound) {
    return `${meta}
## Audit Round A1 — 2026-06-21

## Decision A1

- **Verdict**: needs-fixes

## Audit Round A2 — 2026-06-21

## Decision A2

- **Verdict**: ready
`;
  }
  return `${meta}
## Decision

- **Verdict**: ${verdict}
`;
}

// ── plan ─────────────────────────────────────────────────────────────────────

describe('computeMetadataSync: plan', () => {
  it('no-op when metadata already matches latest revision row', () => {
    const content = makePlan({ version: 'v1', round: 'Initial plan — no review yet' });
    expect(computeMetadataSync('slug.plan.md', content)).toBeNull();
  });

  it('updates Version and Round from last revision row', () => {
    const content = makePlan({
      version: 'v1',
      round: 'Initial plan — no review yet',
      rows: [
        { version: 'v1', round: 'Initial plan — no review yet' },
        { version: 'v2', round: 'R1' },
      ],
    });
    const sync = computeMetadataSync('slug.plan.md', content);
    expect(sync?.updates.Version).toBe('v2');
    expect(sync?.updates.Round).toBe('R1');
  });

  it('preserves plan Round markdown link when it points at latest revision round', () => {
    const content = makePlan({
      version: 'v2',
      round: '[reports/slug.review.md → ## slug R1 — 2026-06-21](../reports/slug.review.md#slug-r1--2026-06-21)',
      rows: [
        { version: 'v1', round: 'Initial plan — no review yet' },
        { version: 'v2', round: 'R1' },
      ],
    });
    expect(computeMetadataSync('slug.plan.md', content)).toBeNull();
  });
});

// ── review ───────────────────────────────────────────────────────────────────

describe('computeMetadataSync: review', () => {
  it('no-op when metadata already matches latest round', () => {
    const content = makeReview({ round: 'R1', verdict: 'NEEDS_REVISION', planVersion: 'v1' });
    expect(computeMetadataSync('slug.review.md', content)).toBeNull();
  });

  it('detects stale round when new round added', () => {
    const content = makeReview({
      round: 'R1', verdict: 'NEEDS_REVISION', planVersion: 'v1',
      rounds: [{ round: 'R2', verdict: 'READY', planVersion: 'v3' }],
    });
    const sync = computeMetadataSync('slug.review.md', content);
    expect(sync).not.toBeNull();
    expect(sync.updates.Round).toBe('R2');
    expect(sync.updates.Verdict).toBe('READY');
    expect(sync.updates['Plan-Version']).toBe('v3');
  });

  it('picks highest round number not highest index', () => {
    const content = makeReview({
      round: 'R1', verdict: 'NEEDS_REVISION', planVersion: 'v1',
      rounds: [
        { round: 'R3', verdict: 'READY', planVersion: 'v5' },
        { round: 'R2', verdict: 'NEEDS_REVISION', planVersion: 'v4' },
      ],
    });
    const sync = computeMetadataSync('slug.review.md', content);
    expect(sync?.updates.Round).toBe('R3');
    expect(sync?.updates.Verdict).toBe('READY');
  });

  it('returns null when no metadata section', () => {
    expect(computeMetadataSync('slug.review.md', '# Just a heading\n\nsome text')).toBeNull();
  });

  it('returns null for unknown artifact type', () => {
    const content = makeReview().replace('**Artifact**: review', '**Artifact**: note');
    expect(computeMetadataSync('slug.review.md', content)).toBeNull();
  });
});

// ── applyMetadataSync ────────────────────────────────────────────────────────

describe('applyMetadataSync', () => {
  it('updates existing fields in-place', () => {
    const content = makeReview({ round: 'R1', verdict: 'NEEDS_REVISION', planVersion: 'v1' });
    const updated = applyMetadataSync(content, { Round: 'R2', Verdict: 'READY', 'Plan-Version': 'v3' });
    expect(updated).toContain('- **Round**: R2');
    expect(updated).toContain('- **Verdict**: READY');
    expect(updated).toContain('- **Plan-Version**: v3');
    expect(updated).not.toContain('- **Round**: R1');
    expect(updated).not.toContain('- **Verdict**: NEEDS_REVISION');
  });

  it('is idempotent', () => {
    const content = makeReview({ round: 'R1', verdict: 'NEEDS_REVISION', planVersion: 'v1' });
    const once = applyMetadataSync(content, { Round: 'R2', Verdict: 'READY' });
    const twice = applyMetadataSync(once, { Round: 'R2', Verdict: 'READY' });
    expect(once).toBe(twice);
  });
});

// ── implementation-report ────────────────────────────────────────────────────

describe('computeMetadataSync: implementation-report', () => {
  it('no-op when already current', () => {
    const content = makeImpl({ round: 'I1', planVersion: 'v1' });
    expect(computeMetadataSync('slug.implementation.md', content)).toBeNull();
  });

  it('updates Round and Plan-Version from last table row', () => {
    const content = makeImpl({
      round: 'I1', planVersion: 'v1',
      tableRows: [{ round: 'I1', pv: 'v1' }, { round: 'I2', pv: 'v4' }],
    });
    const sync = computeMetadataSync('slug.implementation.md', content);
    expect(sync?.updates.Round).toBe('I2');
    expect(sync?.updates['Plan-Version']).toBe('v4');
  });

  it('updates Result from last table row', () => {
    const content = makeImpl({
      round: 'I1',
      planVersion: 'v1',
      tableRows: [
        { round: 'I1', pv: 'v1', result: 'done' },
        { round: 'I2', pv: 'v2', result: '3 failed' },
      ],
    }).replace('- **Result**: implemented', '- **Result**: partial');
    const sync = computeMetadataSync('slug.implementation.md', content);
    expect(sync?.updates.Result).toBe('failed');
  });

  it('does not mark implementation failed from error-handling prose in table result', () => {
    const content = makeImpl({
      round: 'I1',
      planVersion: 'v1',
      tableRows: [
        { round: 'I1', pv: 'v1', result: 'Added error handling coverage' },
      ],
    }).replace('- **Result**: implemented', '- **Result**: partial');
    const sync = computeMetadataSync('slug.implementation.md', content);
    expect(sync?.updates.Result).toBe('implemented');
  });
});

// ── audit-report ─────────────────────────────────────────────────────────────

describe('computeMetadataSync: audit-report', () => {
  it('no-op for single-round audit when already current', () => {
    const content = makeAudit({ round: 'A1', verdict: 'ready' });
    expect(computeMetadataSync('slug.audit.md', content)).toBeNull();
  });

  it('syncs verdict from ## Decision for single-round audit', () => {
    const content = makeAudit({ round: 'A1', verdict: 'needs-fixes' });
    const stale = content.replace('**Verdict**: needs-fixes\n\n## Decision', '**Verdict**: ready\n\n## Decision');
    const sync = computeMetadataSync('slug.audit.md', stale);
    expect(sync?.updates.Verdict).toBe('needs-fixes');
  });

  it('picks latest round from multi-round audit', () => {
    const content = makeAudit({ round: 'A1', verdict: 'needs-fixes', multiRound: true });
    const sync = computeMetadataSync('slug.audit.md', content);
    expect(sync?.updates.Round).toBe('A2');
    expect(sync?.updates.Verdict).toBe('ready');
  });
});

// ── syncMetadataFile I/O ──────────────────────────────────────────────────────

describe('syncMetadataFile: file I/O', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), 'pythia-meta-sync-')); });
  afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }); });

  it('writes updated metadata back to file', () => {
    const content = makeReview({
      round: 'R1', verdict: 'NEEDS_REVISION', planVersion: 'v1',
      rounds: [{ round: 'R2', verdict: 'READY', planVersion: 'v3' }],
    });
    const file = join(tmpDir, 'slug.review.md');
    writeFileSync(file, content, 'utf8');

    const result = syncMetadataFile(file);
    expect(result.changed).toBe(true);
    expect(result.fields).toContain('Round');
    expect(result.fields).toContain('Verdict');

    const updated = readFileSync(file, 'utf8');
    expect(updated).toContain('- **Round**: R2');
    expect(updated).toContain('- **Verdict**: READY');
    expect(updated).toContain('- **Plan-Version**: v3');
  });

  it('returns changed: false and leaves file unchanged when already current', () => {
    const content = makeReview({ round: 'R1', verdict: 'NEEDS_REVISION', planVersion: 'v1' });
    const file = join(tmpDir, 'slug.review.md');
    writeFileSync(file, content, 'utf8');

    const result = syncMetadataFile(file);
    expect(result.changed).toBe(false);
    expect(readFileSync(file, 'utf8')).toBe(content);
  });

  it('is idempotent when called twice', () => {
    const content = makeReview({
      round: 'R1', verdict: 'NEEDS_REVISION', planVersion: 'v1',
      rounds: [{ round: 'R2', verdict: 'READY', planVersion: 'v3' }],
    });
    const file = join(tmpDir, 'slug.review.md');
    writeFileSync(file, content, 'utf8');
    syncMetadataFile(file);
    const afterFirst = readFileSync(file, 'utf8');
    syncMetadataFile(file);
    expect(readFileSync(file, 'utf8')).toBe(afterFirst);
  });
});


// ── applyMetadataSync: insert missing field ───────────────────────────────────

describe('applyMetadataSync: insert missing field', () => {
  it('inserts a new field when it does not exist in metadata section', () => {
    const content = `# Review

## Metadata

- **Schema**: pythia-artifact-v1
- **Id**: slug-review
- **Artifact**: review
- **Plan**: plans/slug.plan.md
- **Plan-Version**: v1
- **Round**: R1

## Body
`;
    // Verdict field is missing — applyMetadataSync should insert it
    const updated = applyMetadataSync(content, { Verdict: 'READY' });
    expect(updated).toContain('- **Verdict**: READY');
  });
});

// ── parseReviewRounds: heading variants ──────────────────────────────────────

describe('computeMetadataSync: heading format variants', () => {
  it('handles review round with em dash (—) in heading', () => {
    const content = makeReview({
      round: 'R1', verdict: 'NEEDS_REVISION', planVersion: 'v1',
      rounds: [{ round: 'R2', verdict: 'READY', planVersion: 'v2' }],
    });
    // makeReview already uses em dash (—); ensure it parses
    const sync = computeMetadataSync('slug.review.md', content);
    expect(sync?.updates.Round).toBe('R2');
  });

  it('returns null when round block has no Verdict line', () => {
    const content = `# Review

## Metadata

- **Schema**: pythia-artifact-v1
- **Id**: slug-review
- **Artifact**: review
- **Plan**: plans/slug.plan.md
- **Plan-Version**: v1
- **Round**: R1
- **Verdict**: NEEDS_REVISION

## slug R2 — 2026-06-21

Review for: [Plan v2](../plans/slug.plan.md)
(Verdict line missing — reviewer forgot to add it)
`;
    // No Verdict line → round not counted → no sync update
    expect(computeMetadataSync('slug.review.md', content)).toBeNull();
  });
});
