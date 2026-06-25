import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { computeMetadataSync, applyMetadataSync, syncMetadataFile } from '../metadata/sync.js';
import { normalizeMetadataBlock, parseArtifactMetadata } from '../metadata/parse.js';
import { cmdSync } from '../references/inputs-core.js';
import { seedPythiaProjectRegistration } from '../../cli/tests/helpers/workflow-paths.js';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeReview({ round = 'R1', verdict = 'needs-revision', planVersion = 'v1', rounds = [] } = {}) {
  const extraRounds = rounds.map(
    (r) => `\n## slug ${r.round} — 2026-06-21\n\nReview for: [Plan ${r.planVersion}](../plans/slug.plan.md)\nVerdict: ${r.verdict}\n`,
  ).join('');
  return `# Review: slug

## Metadata

- plan: plans/slug.plan.md
- plan_version: ${planVersion}
- round: ${round}
- verdict: ${verdict}

## Navigation

## slug R1 — 2026-06-21

Review for: [Plan v1](../plans/slug.plan.md)
Verdict: needs-revision
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

- plan: plans/slug.plan.md
- plan_version: ${planVersion}
- round: ${round}
- result: implemented

## Plan-Implementation Compatibility

| Implementation Round | Plan Version | Date | Result |
| -------------------- | ------------ | ---- | ------ |
${rows}
`;
}

function makeAudit({ round = 'A1', verdict = 'ready', multiRound = false } = {}) {
  const meta = `# Audit

## Metadata

- implementation: reports/slug.implementation.md
- round: ${round}
- verdict: ${verdict}
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

  it('updates Version from last revision row (v2: no Round sync for plans)', () => {
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
    // v2: plan metadata Round is NOT synced (round lives in revision log body only)
    expect(sync?.updates.round).toBeUndefined();
  });

  it('no-op when plan version already matches latest revision row', () => {
    const content = makePlan({
      version: 'v2',
      round: 'R1',
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
    const content = makeReview({ round: 'R1', verdict: 'needs-revision', planVersion: 'v1' });
    expect(computeMetadataSync('slug.review.md', content)).toBeNull();
  });

  it('detects stale round when new round added', () => {
    const content = makeReview({
      round: 'R1', verdict: 'needs-revision', planVersion: 'v1',
      rounds: [{ round: 'R2', verdict: 'ready', planVersion: 'v3' }],
    });
    const sync = computeMetadataSync('slug.review.md', content);
    expect(sync).not.toBeNull();
    expect(sync.updates.round).toBe('R2');
    expect(sync.updates.verdict).toBe('ready');
    expect(sync.updates['plan_version']).toBe('v3');
  });

  it('picks highest round number not highest index', () => {
    const content = makeReview({
      round: 'R1', verdict: 'needs-revision', planVersion: 'v1',
      rounds: [
        { round: 'R3', verdict: 'ready', planVersion: 'v5' },
        { round: 'R2', verdict: 'needs-revision', planVersion: 'v4' },
      ],
    });
    const sync = computeMetadataSync('slug.review.md', content);
    expect(sync?.updates.round).toBe('R3');
    expect(sync?.updates.verdict).toBe('ready');
  });

  it('returns null when no metadata section', () => {
    expect(computeMetadataSync('slug.review.md', '# Just a heading\n\nsome text')).toBeNull();
  });

  it('uses path-inferred kind regardless of metadata Artifact field', () => {
    // v2: kind inferred from .review.md suffix, not from Artifact metadata field
    const content = makeReview().replace('**Artifact**: review', '**Artifact**: note');
    // File is slug.review.md → kind is review → review sync runs
    // makeReview() has R1 round and NEEDS_REVISION verdict which already matches metadata → null
    expect(computeMetadataSync('slug.review.md', content)).toBeNull();
  });
});

// ── applyMetadataSync ────────────────────────────────────────────────────────

describe('applyMetadataSync', () => {
  it('updates existing fields in-place', () => {
    const content = makeReview({ round: 'R1', verdict: 'needs-revision', planVersion: 'v1' });
    const updated = applyMetadataSync(content, { round: 'R2', verdict: 'ready', plan_version: 'v3' });
    expect(updated).toContain('- round: R2');
    expect(updated).toContain('- verdict: ready');
    expect(updated).toContain('- plan_version: v3');
    expect(updated).not.toContain('- round: R1');
    expect(updated).not.toContain('- verdict: needs-revision');
  });

  it('is idempotent', () => {
    const content = makeReview({ round: 'R1', verdict: 'needs-revision', planVersion: 'v1' });
    const once = applyMetadataSync(content, { round: 'R2', verdict: 'ready' });
    const twice = applyMetadataSync(once, { round: 'R2', verdict: 'ready' });
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
    expect(sync?.updates.round).toBe('I2');
    expect(sync?.updates['plan_version']).toBe('v4');
  });

  it('does not derive result from table — result field is manual-only', () => {
    const content = makeImpl({
      round: 'I1',
      planVersion: 'v1',
      tableRows: [
        { round: 'I1', pv: 'v1', result: 'done' },
        { round: 'I2', pv: 'v2', result: '3 failed' },
      ],
    }).replace('- **Result**: implemented', '- result: partial');
    const sync = computeMetadataSync('slug.implementation.md', content);
    expect(sync?.updates.result).toBeUndefined();
  });

  it('does not auto-set result from table text — result is always written manually', () => {
    const content = makeImpl({
      round: 'I1',
      planVersion: 'v1',
      tableRows: [
        { round: 'I1', pv: 'v1', result: 'Added error handling coverage' },
      ],
    }).replace('- **Result**: implemented', '- result: partial');
    const sync = computeMetadataSync('slug.implementation.md', content);
    expect(sync?.updates.result).toBeUndefined();
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
    // Corrupt the metadata verdict to be stale; body (## Decision) still says needs-fixes
    const stale = content.replace('- verdict: needs-fixes', '- verdict: ready');
    const sync = computeMetadataSync('slug.audit.md', stale);
    expect(sync?.updates.verdict).toBe('needs-fixes');
  });

  it('picks latest round from multi-round audit', () => {
    const content = makeAudit({ round: 'A1', verdict: 'needs-fixes', multiRound: true });
    const sync = computeMetadataSync('slug.audit.md', content);
    expect(sync?.updates.round).toBe('A2');
    expect(sync?.updates.verdict).toBe('ready');
  });
});

// ── syncMetadataFile I/O ──────────────────────────────────────────────────────

describe('syncMetadataFile: file I/O', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), 'pythia-meta-sync-')); });
  afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }); });

  it('writes updated metadata back to file', () => {
    const content = makeReview({
      round: 'R1', verdict: 'needs-revision', planVersion: 'v1',
      rounds: [{ round: 'R2', verdict: 'ready', planVersion: 'v3' }],
    });
    const file = join(tmpDir, 'slug.review.md');
    writeFileSync(file, content, 'utf8');

    const result = syncMetadataFile(file);
    expect(result.changed).toBe(true);
    expect(result.fields).toContain('round');
    expect(result.fields).toContain('verdict');

    const updated = readFileSync(file, 'utf8');
    expect(updated).toContain('- round: R2');
    expect(updated).toContain('- verdict: ready');
    expect(updated).toContain('- plan_version: v3');
  });

  it('returns changed: false and leaves file unchanged when already current', () => {
    const content = makeReview({ round: 'R1', verdict: 'needs-revision', planVersion: 'v1' });
    const file = join(tmpDir, 'slug.review.md');
    writeFileSync(file, content, 'utf8');

    const result = syncMetadataFile(file);
    expect(result.changed).toBe(false);
    expect(readFileSync(file, 'utf8')).toBe(content);
  });

  it('is idempotent when called twice', () => {
    const content = makeReview({
      round: 'R1', verdict: 'needs-revision', planVersion: 'v1',
      rounds: [{ round: 'R2', verdict: 'ready', planVersion: 'v3' }],
    });
    const file = join(tmpDir, 'slug.review.md');
    writeFileSync(file, content, 'utf8');
    syncMetadataFile(file);
    const afterFirst = readFileSync(file, 'utf8');
    syncMetadataFile(file);
    expect(readFileSync(file, 'utf8')).toBe(afterFirst);
  });
});


// ── applyMetadataSync: only updates existing fields ──────────────────────────

describe('applyMetadataSync: existing-field-only updates', () => {
  it('does not insert a new field when it does not exist in metadata', () => {
    const content = `# Review

## Metadata

- round: R1
- plan_version: v1

## Body
`;
    // verdict is missing — applyMetadataSync must NOT add it
    const updated = applyMetadataSync(content, { verdict: 'ready' });
    expect(updated).not.toContain('verdict:');
    expect(updated).toBe(content);
  });

  it('updates an existing v2 field in-place', () => {
    const content = `# Review

## Metadata

- round: R1
- verdict: needs-revision

## Body
`;
    const updated = applyMetadataSync(content, { verdict: 'ready' });
    expect(updated).toContain('- verdict: ready');
    expect(updated).not.toContain('needs-revision');
  });
});

// ── parseReviewRounds: heading variants ──────────────────────────────────────

describe('computeMetadataSync: heading format variants', () => {
  it('handles review round with em dash (—) in heading', () => {
    const content = makeReview({
      round: 'R1', verdict: 'needs-revision', planVersion: 'v1',
      rounds: [{ round: 'R2', verdict: 'ready', planVersion: 'v2' }],
    });
    // makeReview already uses em dash (—); ensure it parses
    const sync = computeMetadataSync('slug.review.md', content);
    expect(sync?.updates.round).toBe('R2');
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

// ── cmdSync typed-relation integration ───────────────────────────────────────

describe('cmdSync: typed relation integration', () => {
  let tmpRoot;
  beforeEach(() => {
    tmpRoot = mkdtempSync(join(tmpdir(), 'pythia-typed-sync-'));
    seedPythiaProjectRegistration(tmpRoot);
  });
  afterEach(() => rmSync(tmpRoot, { recursive: true, force: true }));

  function wf(rel, content) {
    const abs = join(tmpRoot, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content, 'utf8');
    return abs;
  }

  it('typed body link renders [kind:based-on] tag in References', () => {
    wf('.pythia/workflows/features/feat-test/contexts/target.context.md', '# Target\n\nBody.\n');
    const consumer = wf(
      '.pythia/workflows/features/feat-test/contexts/consumer.context.md',
      '# Consumer\n\nSee [Target](target.context.md#@based-on).\n',
    );
    cmdSync(consumer, { root: tmpRoot });
    const after = readFileSync(consumer, 'utf8');
    expect(after).toMatch(/## References/);
    // kind varies by platform (symlink resolution) — check relType tag is present
    expect(after).toMatch(/based-on/);
    expect(after).toContain('target.context.md');
  });

  it('typed sync is idempotent — second run produces no change', () => {
    wf('.pythia/workflows/features/feat-test/contexts/target.context.md', '# Target\n\nBody.\n');
    const consumer = wf(
      '.pythia/workflows/features/feat-test/contexts/consumer.context.md',
      '# Consumer\n\nSee [Target](target.context.md#@based-on).\n',
    );
    cmdSync(consumer, { root: tmpRoot });
    const after1 = readFileSync(consumer, 'utf8');
    cmdSync(consumer, { root: tmpRoot });
    expect(readFileSync(consumer, 'utf8')).toBe(after1);
  });

  it('typed forward link writes reverse basis-for entry in target ## Used by', () => {
    const target = wf(
      '.pythia/workflows/features/feat-test/contexts/target.context.md',
      '# Target\n\nBody.\n',
    );
    const consumer = wf(
      '.pythia/workflows/features/feat-test/contexts/consumer.context.md',
      '# Consumer\n\nSee [Target](target.context.md#@based-on).\n',
    );
    cmdSync(consumer, { root: tmpRoot });
    const targetContent = readFileSync(target, 'utf8');
    expect(targetContent).toMatch(/## Used by/);
    expect(targetContent).toMatch(/basis-for/);
    expect(targetContent).toContain('consumer.context.md');
  });

  it('backtick path resolving to existing file appears in References on sync', () => {
    wf('.pythia/workflows/features/feat-test/contexts/other.context.md', '# Other\n\nBody.\n');
    const doc = wf(
      '.pythia/workflows/features/feat-test/contexts/doc.context.md',
      '# Doc\n\nSee `other.context.md`.\n',
    );
    cmdSync(doc, { root: tmpRoot });
    const after = readFileSync(doc, 'utf8');
    expect(after).toMatch(/## References/);
    expect(after).toContain('other.context.md');
  });

  it('links in any h2 section now sync — bibliography skip-list is empty', () => {
    wf('.pythia/workflows/features/feat-test/contexts/src.context.md', '# Src\n\nBody.\n');
    const doc = wf(
      '.pythia/workflows/features/feat-test/contexts/doc.context.md',
      '# Doc\n\n## Links\n\n- [Src](src.context.md)\n',
    );
    cmdSync(doc, { root: tmpRoot });
    const after = readFileSync(doc, 'utf8');
    expect(after).toMatch(/## References/);
    expect(after).toContain('src.context.md');
  });
});

describe('normalizeMetadataBlock — kind precedence', () => {
  it('explicit kind: brainstorm is not overwritten by Artifact: research-context', () => {
    const content = `# My Context\n\n## Metadata\n\n- **Artifact**: research-context\n- kind: brainstorm\n\nBody.\n`;
    const parsed = parseArtifactMetadata(content);
    const fields = normalizeMetadataBlock({ kind: 'context', parsed });
    const kindField = fields.find(([k]) => k === 'kind');
    expect(kindField?.[1]).toBe('brainstorm');
  });

  it('Artifact: research-context sets kind: research when no explicit kind', () => {
    const content = `# My Context\n\n## Metadata\n\n- **Artifact**: research-context\n\nBody.\n`;
    const parsed = parseArtifactMetadata(content);
    const fields = normalizeMetadataBlock({ kind: 'context', parsed });
    const kindField = fields.find(([k]) => k === 'kind');
    expect(kindField?.[1]).toBe('research');
  });

  it('explicit kind: research is preserved over Shape: survey', () => {
    const content = `# My Context\n\n## Metadata\n\n- **Shape**: survey\n- kind: brainstorm\n\nBody.\n`;
    const parsed = parseArtifactMetadata(content);
    const fields = normalizeMetadataBlock({ kind: 'context', parsed });
    const kindField = fields.find(([k]) => k === 'kind');
    expect(kindField?.[1]).toBe('brainstorm');
  });
});
