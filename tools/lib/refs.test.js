import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { kindForPath, isPythiaSyncMarkdownRelPath, usedByLinksToConsumer, resolveDocLink } from './refs.js';
import { normalizePath } from './repo-root.js';

let tmpDir;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'refs-kind-'));
  mkdirSync(join(tmpDir, '.pythia', 'workflows', 'f', 'contexts'), { recursive: true });
  mkdirSync(join(tmpDir, '.pythia', 'workflows', 'f', 'notes'), { recursive: true });
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('kindForPath', () => {
  it('uses workflow artifact tags', () => {
    expect(kindForPath('feat-x.md')).toBe('feat');
    expect(kindForPath('a.plan.md')).toBe('plan');
    expect(kindForPath('a.ctx.md')).toBe('ctx');
    expect(kindForPath('a.context.md')).toBe('research');
    expect(kindForPath('a.review.md')).toBe('review');
    expect(kindForPath('a.implementation.md')).toBe('impl');
    expect(kindForPath('a.audit.md')).toBe('audit');
    expect(kindForPath('a.retro.md')).toBe('retro');
    expect(kindForPath('.pythia/workflows/f/notes/x.md')).toBe('note');
  });

  it('classifies repo paths outside .pythia as doc or code', () => {
    const mdAbs = join(tmpDir, 'docs', 'guide.md');
    const jsAbs = join(tmpDir, 'lib', 'module.js');
    mkdirSync(join(tmpDir, 'docs'), { recursive: true });
    mkdirSync(join(tmpDir, 'lib'), { recursive: true });
    writeFileSync(mdAbs, '# Guide\n');
    writeFileSync(jsAbs, 'export {};\n');

    expect(kindForPath('docs/guide.md', { targetAbs: mdAbs, root: tmpDir })).toBe('doc');
    expect(kindForPath('lib/module.js', { targetAbs: jsAbs, root: tmpDir })).toBe('code');
  });

  it('reads .context.md frontmatter type for ctx vs research', () => {
    const ctxPath = join(tmpDir, '.pythia/workflows/f/contexts/typed.context.md');
    writeFileSync(ctxPath, `---\ntype: context\n---\n# Model\n`);
    expect(kindForPath('typed.context.md', { targetAbs: ctxPath, root: tmpDir })).toBe('ctx');

    const researchPath = join(tmpDir, '.pythia/workflows/f/contexts/topic-research.context.md');
    writeFileSync(researchPath, `---\ntype: research-context\n---\n# Research\n`);
    expect(kindForPath('topic-research.context.md', { targetAbs: researchPath, root: tmpDir })).toBe('research');
  });
});

describe('usedByLinksToConsumer', () => {
  it('does not match by basename alone when paths differ', () => {
    const planA = join(tmpDir, '.pythia/workflows/feat-a/plans/x.plan.md');
    const planB = join(tmpDir, '.pythia/workflows/feat-b/plans/x.plan.md');
    mkdirSync(dirname(planA), { recursive: true });
    mkdirSync(dirname(planB), { recursive: true });
    writeFileSync(planA, '# A\n');
    writeFileSync(planB, '# B\n');
    const ctx = join(tmpDir, '.pythia/workflows/feat-a/contexts/a.context.md');
    mkdirSync(dirname(ctx), { recursive: true });
    writeFileSync(ctx, '# C\n');

    const usedBy = [{ kind: 'plan', text: 'x', path: '.pythia/workflows/feat-b/plans/x.plan.md' }];
    expect(usedByLinksToConsumer(usedBy, ctx, planA, tmpDir)).toBe(false);
    expect(usedByLinksToConsumer(usedBy, ctx, planB, tmpDir)).toBe(true);
  });
});

describe('resolveDocLink', () => {
  it('prefers project root for bare skills/ path over local shadow', () => {
    mkdirSync(join(tmpDir, 'skills/plan'), { recursive: true });
    writeFileSync(join(tmpDir, 'skills/plan/SKILL.md'), '# canonical\n');
    const plan = join(tmpDir, '.pythia/workflows/f/plans/p.plan.md');
    mkdirSync(dirname(plan), { recursive: true });
    mkdirSync(join(dirname(plan), 'skills/plan'), { recursive: true });
    writeFileSync(join(dirname(plan), 'skills/plan/SKILL.md'), '# shadow\n');
    writeFileSync(plan, '# Plan\n');

    const abs = resolveDocLink(plan, 'skills/plan/SKILL.md', tmpDir);
    expect(normalizePath(abs)).toBe(normalizePath(join(tmpDir, 'skills/plan/SKILL.md')));
  });

  it('still resolves explicit ../ paths doc-relative first', () => {
    const ctx = join(tmpDir, '.pythia/workflows/f/contexts/a.context.md');
    const plan = join(tmpDir, '.pythia/workflows/f/plans/p.plan.md');
    mkdirSync(dirname(ctx), { recursive: true });
    mkdirSync(dirname(plan), { recursive: true });
    writeFileSync(ctx, '# Context\n');
    writeFileSync(plan, '# Plan\n');

    expect(normalizePath(resolveDocLink(plan, '../contexts/a.context.md', tmpDir))).toBe(normalizePath(ctx));
  });
});

describe('isPythiaSyncMarkdownRelPath', () => {
  it('includes .pythia markdown except runtime, config, backups, README', () => {
    expect(isPythiaSyncMarkdownRelPath('.pythia/workflows/a.plan.md')).toBe(true);
    expect(isPythiaSyncMarkdownRelPath('.pythia/workflows/f/notes/x.md')).toBe(true);
    expect(isPythiaSyncMarkdownRelPath('.pythia/config/settings.md')).toBe(false);
    expect(isPythiaSyncMarkdownRelPath('.pythia/config/paths.md')).toBe(false);
    expect(isPythiaSyncMarkdownRelPath('.pythia/README.md')).toBe(false);
    expect(isPythiaSyncMarkdownRelPath('.pythia/backups/0.3.3/x.md')).toBe(false);
    expect(isPythiaSyncMarkdownRelPath('.pythia/runtime/x.md')).toBe(false);
    expect(isPythiaSyncMarkdownRelPath('docs/x.md')).toBe(false);
    expect(isPythiaSyncMarkdownRelPath('.pythia/workflows/x.js')).toBe(false);
  });
});
