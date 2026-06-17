import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const checker = resolve('tools/checks/doc-structure.js');
const fixtures = resolve('tools/fixtures/workflow-docs');

function run(...args) {
  const r = spawnSync(process.execPath, [checker, ...args], { encoding: 'utf8' });
  return { code: r.status, stderr: r.stderr, stdout: r.stdout };
}

describe('doc-structure.js — valid fixtures', () => {
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

describe('doc-structure.js — invalid fixtures', () => {
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

describe('doc-structure.js — usage errors', () => {
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
