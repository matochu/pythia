import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { renderTrailingRegion } from '../../lib/refs.js';
import { seedPythiaProjectRegistration } from '../../cli/tests/helpers/workflow-paths.js';

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
  seedPythiaProjectRegistration(root);
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

  it('passes when ## References round-trip uses repo-root-relative paths', () => {
    const planRel = '.pythia/workflows/f/plans/x.plan.md';
    const ctxRel = '.pythia/workflows/f/contexts/a.context.md';
    writeDoc(ctxRel, `# Context

Body.
${renderTrailingRegion({
  references: [],
  usedBy: [{ kind: 'plan', text: 'x', path: planRel }],
})}`);
    const plan = writeDoc(planRel, `# Plan

${renderTrailingRegion({
  references: [{ kind: 'ctx', text: 'a', path: ctxRel, hash: 'abc12' }],
  usedBy: [],
})}`);
    expect(runCrossRefs(plan).status).toBe(0);
  });

  it('fails when repo-root ## References target lacks backlink', () => {
    const planRel = '.pythia/workflows/f/plans/x.plan.md';
    const ctxRel = '.pythia/workflows/f/contexts/a.context.md';
    writeDoc(ctxRel, `# Context

Body.
${renderTrailingRegion({
  references: [],
  usedBy: [{ kind: 'plan', text: 'other', path: '.pythia/workflows/f/plans/other.plan.md' }],
})}`);
    const plan = writeDoc(planRel, `# Plan

${renderTrailingRegion({
  references: [{ kind: 'ctx', text: 'a', path: ctxRel, hash: 'abc12' }],
  usedBy: [],
})}`);
    const r = runCrossRefs(plan);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/missing_used_by_ref/);
  });

  it('fails when ## References target file is missing', () => {
    const planRel = '.pythia/workflows/f/plans/x.plan.md';
    const plan = writeDoc(planRel, `# Plan

${renderTrailingRegion({
  references: [{ kind: 'ctx', text: 'ghost', path: '.pythia/workflows/f/contexts/ghost.context.md', hash: 'abc12' }],
  usedBy: [],
})}`);
    const r = runCrossRefs(plan);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/missing_ref_target/);
  });
});
