import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const checker = resolve('tools/checks/plan-numbering.js');

function run(file) {
  const r = spawnSync(process.execPath, [checker, file], { encoding: 'utf8' });
  return { code: r.status, stderr: r.stderr };
}

function minPlan(n, slug) {
  return `---\n---\n# Plan ${n}-${slug}\n## Metadata\n- **Plan-Id**: ${n}-${slug}\n- **Plan-Version**: v1\n- **Status**: Draft\n- **Branch**: main\n- **Last review round**: none\n## Plan revision log\n| Version | Round | Date | Changed Steps | Summary |\n| --- | --- | --- | --- | --- |\n| v1 | — | 2026-01-01 | all | initial |\n## Navigation\n## Context\n## Goal\n## Plan\n### Step 1: x\n- **Change**: x\n- **Where**: x\n- **Validation**: x\n- **Acceptance**: x\n## Acceptance Criteria\n- [ ] done\n`;
}

let dir;
beforeAll(() => { dir = mkdtempSync(join(tmpdir(), 'pythia-test-')); });
afterAll(() => { rmSync(dir, { recursive: true, force: true }); });

describe('plan-numbering.js', () => {
  it('sequential plan 3 after 1 and 2 passes', () => {
    writeFileSync(join(dir, '1-alpha.plan.md'), minPlan(1, 'alpha'));
    writeFileSync(join(dir, '2-beta.plan.md'), minPlan(2, 'beta'));
    const f = join(dir, '3-gamma.plan.md');
    writeFileSync(f, minPlan(3, 'gamma'));
    expect(run(f).code).toBe(0);
  });

  it('gap: plan 5 when max is 2 → fails (this feature observed case)', () => {
    writeFileSync(join(dir, '1-a.plan.md'), minPlan(1, 'a'));
    writeFileSync(join(dir, '2-b.plan.md'), minPlan(2, 'b'));
    const f = join(dir, '5-gap.plan.md');
    writeFileSync(f, minPlan(5, 'gap'));
    const r = run(f);
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/not sequential/);
  });

  it('duplicate number → fails', () => {
    const f = join(dir, '1-dup.plan.md');
    writeFileSync(f, minPlan(1, 'dup'));
    const r = run(f);
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/already used/);
  });

  it('unnumbered plan passes silently', () => {
    const f = join(dir, 'no-number.plan.md');
    writeFileSync(f, minPlan(0, 'no'));
    expect(run(f).code).toBe(0);
  });
});
