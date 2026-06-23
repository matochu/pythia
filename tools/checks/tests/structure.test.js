import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const checker = resolve('tools/checks/structure.js');
const fixtures = resolve('tools/fixtures/workflow-docs');

function run(...args) {
  const r = spawnSync(process.execPath, [checker, ...args], { encoding: 'utf8' });
  return { code: r.status, stderr: r.stderr, stdout: r.stdout };
}

describe('structure.js — valid fixtures', () => {
  it('min.valid.plan.md exits 0', () => {
    expect(run(`${fixtures}/valid/min.valid.plan.md`).code).toBe(0);
  });
  it('a-round.valid.plan.md exits 0', () => {
    expect(run(`${fixtures}/valid/a-round.valid.plan.md`).code).toBe(0);
  });
  it('min.valid.review.md exits 0', () => {
    expect(run(`${fixtures}/valid/min.valid.review.md`).code).toBe(0);
  });
  it('min.valid.implementation.md exits 0', () => {
    expect(run(`${fixtures}/valid/min.valid.implementation.md`).code).toBe(0);
  });
  it('min.ready.audit.md exits 0', () => {
    expect(run(`${fixtures}/valid/min.ready.audit.md`).code).toBe(0);
  });
  it('min.needs-fixes.audit.md exits 0', () => {
    expect(run(`${fixtures}/valid/min.needs-fixes.audit.md`).code).toBe(0);
  });
});

describe('structure.js — invalid fixtures', () => {
  it('bad-round.plan.md exits 1', () => {
    const r = run(`${fixtures}/invalid/bad-round.plan.md`);
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/revision_log\.round_tokens/);
  });
  it('bad-verdict.review.md exits 1', () => {
    const r = run(`${fixtures}/invalid/bad-verdict.review.md`);
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/verdict/);
  });
  it('missing-round.implementation.md exits 1', () => {
    const r = run(`${fixtures}/invalid/missing-round.implementation.md`);
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/round|retro/i);
  });
  it('ready-no-commit.audit.md exits 1', () => {
    const r = run(`${fixtures}/invalid/ready-no-commit.audit.md`);
    expect(r.code).toBe(1);
  });
});

describe('structure.js — H1 prefix enforcement', () => {
  it('implementation valid fixture has # Report: and passes H1 check', () => {
    const r = run(`${fixtures}/valid/min.valid.implementation.md`);
    expect(r.code).toBe(0);
  });
});

describe('structure.js — migration integration: migrated audit passes structure', () => {
  it('canonical-layout audit (Plan: in body) passes structure after migration', async () => {
    // Reproduces the canonical audit-format.md layout where Plan:/Implementation: are in the body.
    const { writeFileSync, unlinkSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const { convertArtifactMetadata } = await import('../../lib/metadata/migration.js');
    const slug = 'test-plan';
    const before = [
      `# Audit: ${slug}`,
      '',
      `Plan: [plans/${slug}.plan.md](../plans/${slug}.plan.md)`,
      `Implementation: [reports/${slug}.implementation.md](./${slug}.implementation.md)`,
      '',
      '## Conformance',
      '',
      '- Status: done',
      '- Details: ok.',
      '',
      '## Acceptance Criteria Check',
      '',
      '- [x] C1 — met',
      '',
      '## Implementation quality check',
      '',
      '- Status: pass',
      '- Details: ok.',
      '',
      '## Risk Re-evaluation',
      '',
      'None.',
      '',
      '## Decision',
      '',
      '- **Verdict**: ready',
      '- **Reasoning**: ok.',
      '- **Next Steps**: ship.',
      '',
      '## Suggested git commit (application repository)',
      '',
      '```text',
      'feat: apply plan',
      '```',
    ].join('\n');
    const fakePath = `.pythia/workflows/features/feat/reports/${slug}.audit.md`;
    const { content: migrated } = convertArtifactMetadata(fakePath, before);
    const tmp = join(tmpdir(), `${slug}.audit.md`);
    writeFileSync(tmp, migrated);
    const r = run(tmp);
    unlinkSync(tmp);
    expect(r.stderr).not.toMatch(/plan metadata/);
    expect(r.stderr).not.toMatch(/implementation metadata/);
    expect(r.code).toBe(0);
  });
});

describe('structure.js — usage errors', () => {
  it('no args exits 2', () => {
    expect(run().code).toBe(2);
  });
  it('missing file exits 2', () => {
    expect(run('/nonexistent/foo.plan.md').code).toBe(2);
  });
  it('unknown --type exits 2', () => {
    expect(run(`${fixtures}/valid/min.valid.plan.md`, '--type', 'unknown').code).toBe(2);
  });
  it('unknown suffix without --type exits 2', () => {
    expect(run(`${fixtures}/valid/min.valid.plan.md`, '--type', 'foobar').code).toBe(2);
  });
});
