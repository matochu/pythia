import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const checker = resolve('tools/checks/role-boundary.js');

function run(file) {
  const r = spawnSync(process.execPath, [checker, file], { encoding: 'utf8' });
  return { code: r.status, stderr: r.stderr };
}

describe('role-boundary.js', () => {
  it('*.review.md exits 1 with warning', () => {
    const r = run('some/path/3-foo.review.md');
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/Reviewer/);
    expect(r.stderr).toMatch(/\/review/);
  });

  it('*.implementation.md exits 1 with warning', () => {
    const r = run('reports/3-foo.implementation.md');
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/Developer/);
  });

  it('*.audit.md exits 1 with Architect warning', () => {
    const r = run('reports/3-foo.audit.md');
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/Architect/);
  });

  it('regular .md file exits 0', () => {
    expect(run('some/path/README.md').code).toBe(0);
  });

  it('plan file exits 0', () => {
    expect(run('plans/3-foo.plan.md').code).toBe(0);
  });
});
