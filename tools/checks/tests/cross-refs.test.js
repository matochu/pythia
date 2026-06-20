import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { renderTrailingRegion } from '../../lib/refs.js';

const crossRefs = resolve('tools/checks/cross-refs.js');
let root;

function initGit(dir) {
  spawnSync('git', ['init', dir], { encoding: 'utf8' });
  spawnSync('git', ['-C', dir, 'config', 'user.email', 'test@test.com'], { encoding: 'utf8' });
  spawnSync('git', ['-C', dir, 'config', 'user.name', 'Test'], { encoding: 'utf8' });
}

function writeDoc(rel, content) {
  const abs = join(root, rel);
  mkdirSync(join(abs, '..'), { recursive: true });
  writeFileSync(abs, content, 'utf8');
  return abs;
}

function runCrossRefs(planPath) {
  return spawnSync(process.execPath, [crossRefs, planPath], { encoding: 'utf8', cwd: root });
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'pythia-cross-refs-'));
  initGit(root);
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('cross-refs.js', () => {
  it('passes when ## Contexts target trailing ## Used by lists the plan', () => {
    const ctx = writeDoc('contexts/a.context.md', `# Context

Body.
${renderTrailingRegion({
  references: [],
  usedBy: [{ kind: 'plan', text: 'x', path: '../plans/x.plan.md' }],
})}`);
    const plan = writeDoc('plans/x.plan.md', `# Plan

## Contexts

- [a](../contexts/a.context.md)
`);
    expect(runCrossRefs(plan).status).toBe(0);
  });

  it('fails when ## Contexts target lacks trailing backlink (no substring false positive)', () => {
    writeDoc('contexts/a.context.md', `# Context

Body.
${renderTrailingRegion({
  references: [],
  usedBy: [{ kind: 'plan', text: 'other', path: '../plans/other-x.plan.md' }],
})}`);
    const plan = writeDoc('plans/x.plan.md', `# Plan

## Contexts

- [a](../contexts/a.context.md)
`);
    const r = runCrossRefs(plan);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/missing_backlink/);
  });
});
