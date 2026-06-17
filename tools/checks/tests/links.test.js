import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const checker = resolve('tools/checks/links.js');
const fixtures = resolve('tools/fixtures/workflow-docs');

function run(...args) {
  const r = spawnSync(process.execPath, [checker, ...args], { encoding: 'utf8' });
  return { code: r.status, stderr: r.stderr };
}

let dir;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'pythia-links-test-'));
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('links.js', () => {
  it('resolves existing relative link → exit 0', () => {
    writeFileSync(join(dir, 'target.md'), '# ok\n', 'utf8');
    const plan = join(dir, 'with-link.plan.md');
    writeFileSync(plan, '[ctx](./target.md)\n', 'utf8');
    expect(run(plan).code).toBe(0);
  });

  it('broken relative link → exit 1 with links.broken', () => {
    const plan = join(dir, 'broken-link.plan.md');
    writeFileSync(plan, '[missing](./no-such-file.md)\n', 'utf8');
    const r = run(plan);
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/\[links\.broken\]/);
    expect(r.stderr).toMatch(/no-such-file\.md/);
  });

  it('anchor-only links are ignored → exit 0', () => {
    expect(run(`${fixtures}/valid/min.valid.plan.md`).code).toBe(0);
  });

  it('no args → exit 2', () => {
    expect(run().code).toBe(2);
  });

  it('missing file → exit 2', () => {
    expect(run('/nonexistent/plan.md').code).toBe(2);
  });
});
