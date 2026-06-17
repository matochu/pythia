import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const checker = resolve('tools/checks/footer-presence.js');

function run(file) {
  const r = spawnSync(process.execPath, [checker, file], { encoding: 'utf8' });
  return { code: r.status, stderr: r.stderr };
}

let dir;
beforeAll(() => { dir = mkdtempSync(join(tmpdir(), 'pythia-footer-')); });
afterAll(() => { rmSync(dir, { recursive: true, force: true }); });

const FULL_FOOTER = `
Some content from a workflow skill.
skill: /implement

## Next Steps
[a] Audit

---
**Active context**: role: Developer · feat: feat-2026-01-x · plan: 1-foo · implementation: I1 · skill: /implement
`;

const MISSING_FOOTER = `
Some content from a workflow skill.
skill: /implement
Active context: role: Developer · skill: /implement
`;

describe('footer-presence.js', () => {
  it('reply with both ## Next Steps and **Active context** passes', () => {
    const f = join(dir, 'full.txt');
    writeFileSync(f, FULL_FOOTER);
    expect(run(f).code).toBe(0);
  });

  it('reply missing both footer elements fails (observed failure mode)', () => {
    const f = join(dir, 'missing.txt');
    writeFileSync(f, MISSING_FOOTER);
    const r = run(f);
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/footer-presence/);
  });

  it('non-workflow turn passes', () => {
    const f = join(dir, 'nontool.txt');
    writeFileSync(f, 'Just a normal message without any workflow signals.');
    expect(run(f).code).toBe(0);
  });
});
