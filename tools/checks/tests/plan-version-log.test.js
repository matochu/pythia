import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const checker = resolve('tools/checks/plan-version-log.js');

function run(file) {
  const r = spawnSync(process.execPath, [checker, file], { encoding: 'utf8' });
  return { code: r.status, stderr: r.stderr };
}

let dir;
beforeAll(() => { dir = mkdtempSync(join(tmpdir(), 'pythia-pvl-')); });
afterAll(() => { rmSync(dir, { recursive: true, force: true }); });

function write(name, version, logVersion) {
  const content = `# Plan\n## Metadata\n- status: draft\n- version: ${version}\n- branch: main\n## Plan revision log\n| Version | Round | Date | Changed Steps | Summary |\n| --- | --- | --- | --- | --- |\n| ${logVersion} | — | 2026-01-01 | all | initial |\n## Navigation\nPlan: [Step 1: x](#step-1)\n## Context\n## Goal\n## Plan\n### Step 1: x\n- **Change**: x\n- **Where**: x\n- **Validation**: x\n- **Acceptance**: x\n## Acceptance Criteria\n- [ ] done\n`;
  const f = join(dir, name);
  writeFileSync(f, content);
  return f;
}

describe('plan-version-log.js', () => {
  it('matching version and log row passes', () => {
    expect(run(write('ok.plan.md', 'v3', 'v3')).code).toBe(0);
  });

  it('version mismatch fails (observed case: edit without bump)', () => {
    const r = run(write('mismatch.plan.md', 'v3', 'v2'));
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/version_mismatch/);
  });

  it('missing Version fails', () => {
    const content = '# Plan\n## Metadata\n- status: draft\n- branch: main\n## Plan revision log\n| Version | Round | Date |\n| --- | --- | --- |\n| v1 | — | 2026-01-01 |\n## Navigation\nPlan: [Step 1: x](#step-1)\n## Context\n## Goal\n## Plan\n### Step 1: x\n- **Change**: x\n- **Where**: x\n- **Validation**: x\n- **Acceptance**: x\n## Acceptance Criteria\n- [ ] done\n';
    const f = join(dir, 'no-version.plan.md');
    writeFileSync(f, content);
    const r = run(f);
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/missing_version/);
  });
});
