/**
 * Unit tests: workflow lifecycle nudge logic.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, utimesSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  planSlugFromBasename,
  featureDirFromArtifact,
  extractVerdict,
  extractReviewVerdict,
  extractReviewLastStatus,
  highImpactInLastReviewRound,
  normalizeAuditVerdict,
  reviewRoundCount,
  computeWorkflowNudges,
} from '../workflow-state.js';

let root;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'pythia-ws-state-'));
  mkdirSync(join(root, 'plans'), { recursive: true });
  mkdirSync(join(root, 'reports'), { recursive: true });
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function touch(path, content, mtimeMs = Date.now()) {
  writeFileSync(path, content, 'utf8');
  const t = new Date(mtimeMs);
  utimesSync(path, t, t);
}

describe('workflow-state helpers', () => {
  it('planSlugFromBasename strips suffixes', () => {
    expect(planSlugFromBasename('foo.plan.md')).toBe('foo');
    expect(planSlugFromBasename('foo.review.md')).toBe('foo');
  });

  it('featureDirFromArtifact resolves plans/ and reports/', () => {
    const p = join(root, 'plans', 'x.plan.md');
    touch(p, '# plan\n');
    expect(featureDirFromArtifact(p)).toBe(root);
  });

  it('extractVerdict reads review and audit lines', () => {
    expect(extractVerdict('Verdict: READY\n')).toBe('READY');
    expect(extractVerdict('- **Verdict**: needs-fixes\n')).toBe('needs-fixes');
  });

  it('extractReviewVerdict prefers metadata Verdict', () => {
    const md = `## Metadata
- **Schema**: pythia-artifact-v1
- **Artifact**: review
- **Verdict**: READY

## feat R1 — 2026-01-01
Verdict: NEEDS_REVISION
`;
    expect(extractReviewLastStatus(md)).toBe('READY');
    expect(extractReviewVerdict(md)).toBe('READY');
  });

  it('normalizeAuditVerdict normalizes spacing', () => {
    expect(normalizeAuditVerdict('needs fixes')).toBe('needs-fixes');
    expect(normalizeAuditVerdict('ready')).toBe('ready');
  });

  it('reviewRoundCount counts round headers', () => {
    const md = '## foo R1 — 2026-01-01\n\n## bar R2 — 2026-02-01\n';
    expect(reviewRoundCount(md)).toBe(2);
  });
});

describe('computeWorkflowNudges — plan', () => {
  it('nudges review when plan exists without review', () => {
    const plan = join(root, 'plans', 'feat.plan.md');
    touch(plan, '# Plan\n');
    const nudges = computeWorkflowNudges(plan);
    expect(nudges.some((n) => n.includes('/review'))).toBe(true);
  });

  it('nudges review when plan is newer than review', () => {
    const plan = join(root, 'plans', 'feat.plan.md');
    const review = join(root, 'reports', 'feat.review.md');
    touch(review, 'Verdict: READY\n', Date.now() - 10_000);
    touch(plan, '# Plan v2\n', Date.now());
    const nudges = computeWorkflowNudges(plan);
    expect(nudges.some((n) => n.includes('Plan updated'))).toBe(true);
  });
});

describe('computeWorkflowNudges — review', () => {
  it('nudges replan on NEEDS_REVISION with high impact', () => {
    const review = join(root, 'reports', 'feat.review.md');
    touch(
      review,
      '## feat R1 — 2026-01-01\nVerdict: NEEDS_REVISION\nCONCERN-HIGH: x\n',
    );
    const nudges = computeWorkflowNudges(review);
    expect(nudges.some((n) => n.includes('/replan'))).toBe(true);
  });

  it('escalates when NEEDS_REVISION after 2 rounds', () => {
    const review = join(root, 'reports', 'feat.review.md');
    touch(
      review,
      '## feat R1 — 2026-01-01\n\n## feat R2 — 2026-02-01\nVerdict: NEEDS_REVISION\nCONCERN-HIGH\n',
    );
    const nudges = computeWorkflowNudges(review);
    expect(nudges.some((n) => n.includes('escalate'))).toBe(true);
  });

  it('does not use stale CONCERN-HIGH from R1 when last round has no high impact', () => {
    const review = join(root, 'reports', 'feat.review.md');
    touch(
      review,
      `## Metadata
- **Schema**: pythia-artifact-v1
- **Artifact**: review
- **Round**: R2
- **Verdict**: NEEDS_REVISION

## Retrospective
- [process] prior CONCERN-HIGH mentioned in narrative

## feat R1 — 2026-01-01
Verdict: NEEDS_REVISION
**Status**: CONCERN-HIGH

## feat R2 — 2026-02-01
Verdict: NEEDS_REVISION
**Status**: CONCERN-LOW
`,
    );
    const nudges = computeWorkflowNudges(review);
    expect(nudges.some((n) => n.includes('Run /replan (Plan revision log)'))).toBe(false);
    expect(nudges.some((n) => n.includes('NEEDS_REVISION'))).toBe(true);
    expect(highImpactInLastReviewRound(readFileSync(review, 'utf8'))).toBe(0);
  });

  it('nudges implement when READY and no implementation', () => {
    const review = join(root, 'reports', 'feat.review.md');
    touch(review, '## feat R1 — 2026-01-01\nVerdict: READY\n');
    const nudges = computeWorkflowNudges(review);
    expect(nudges.some((n) => n.includes('/implement'))).toBe(true);
  });

  it('nudges re-review when plan newer than review', () => {
    const plan = join(root, 'plans', 'feat.plan.md');
    const review = join(root, 'reports', 'feat.review.md');
    touch(review, 'Verdict: READY\n', Date.now() - 10_000);
    touch(plan, '# newer\n', Date.now());
    const nudges = computeWorkflowNudges(review);
    expect(nudges.some((n) => n.includes('Plan newer than review'))).toBe(true);
  });
});

describe('computeWorkflowNudges — implementation', () => {
  it('nudges audit when implementation newer than audit', () => {
    const impl = join(root, 'reports', 'feat.implementation.md');
    const review = join(root, 'reports', 'feat.review.md');
    touch(review, 'Verdict: READY\n');
    touch(impl, '# Impl\n', Date.now());
    const nudges = computeWorkflowNudges(impl);
    expect(nudges.some((n) => n.includes('/audit'))).toBe(true);
  });

  it('warns when review is not READY', () => {
    const impl = join(root, 'reports', 'feat.implementation.md');
    const review = join(root, 'reports', 'feat.review.md');
    touch(review, 'Verdict: NEEDS_REVISION\n');
    touch(impl, '# Impl\n');
    const nudges = computeWorkflowNudges(impl);
    expect(nudges.some((n) => n.includes('not READY'))).toBe(true);
  });
});

describe('computeWorkflowNudges — audit', () => {
  it('routes needs-fixes to implement', () => {
    const audit = join(root, 'reports', 'feat.audit.md');
    touch(audit, '- **Verdict**: needs-fixes\n');
    const nudges = computeWorkflowNudges(audit);
    expect(nudges.some((n) => n.includes('needs-fixes'))).toBe(true);
    expect(nudges.some((n) => n.includes('/implement'))).toBe(true);
  });

  it('routes plan-fix to replan', () => {
    const audit = join(root, 'reports', 'feat.audit.md');
    touch(audit, '- **Verdict**: plan-fix\n');
    const nudges = computeWorkflowNudges(audit);
    expect(nudges.some((n) => n.includes('/replan'))).toBe(true);
  });

  it('routes re-plan', () => {
    const audit = join(root, 'reports', 'feat.audit.md');
    touch(audit, '- **Verdict**: re-plan\n');
    const nudges = computeWorkflowNudges(audit);
    expect(nudges.some((n) => n.includes('/replan'))).toBe(true);
  });

  it('signals done on ready', () => {
    const audit = join(root, 'reports', 'feat.audit.md');
    touch(audit, '- **Verdict**: ready\n');
    const nudges = computeWorkflowNudges(audit);
    expect(nudges.some((n) => n.includes('loop complete'))).toBe(true);
  });
});
