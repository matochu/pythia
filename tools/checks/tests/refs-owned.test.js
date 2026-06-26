import { describe, it, expect, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { seedPythiaProjectRegistration } from '../../cli/tests/helpers/workflow-paths.js';

const refsOwnedSrc = resolve('tools/checks/refs-owned.js');
const inputsSrc = resolve('tools/bin/inputs.js');

let root;

afterEach(() => {
  if (root) rmSync(root, { recursive: true, force: true });
  root = undefined;
});

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

function runChecker(docPath) {
  return spawnSync(process.execPath, [refsOwnedSrc, docPath], {
    encoding: 'utf8',
    cwd: root,
  });
}

function setup() {
  root = mkdtempSync(join(tmpdir(), 'pythia-refs-owned-'));
  seedPythiaProjectRegistration(root);
  initGit(root);
}

describe('refs-owned.js', () => {
  it('exits 0 for file with no trailing refs region', () => {
    setup();
    const doc = writeDoc('.pythia/workflows/features/feat-test/x.context.md', '# Context\n\nBody only.\n');
    const r = runChecker(doc);
    expect(r.status).toBe(0);
  });

  it('exits 0 when Used by is backed by real consumer ## References', () => {
    setup();
    // context file is the target
    const ctx = writeDoc(
      '.pythia/workflows/features/feat-test/contexts/ctx.context.md',
      `# Context

Body.

## References

## Used by

- [plan] [Plan A](../plans/plan-a.plan.md)
`,
    );
    // consumer plan references the context
    writeDoc(
      '.pythia/workflows/features/feat-test/plans/plan-a.plan.md',
      `# Plan A

See [Context](../contexts/ctx.context.md).

## References

- [context] [Context](../contexts/ctx.context.md#abc123)
`,
    );
    const r = runChecker(ctx);
    expect(r.status).toBe(0);
  });

  it('fails with phantom_used_by when consumer has no matching ## References entry', () => {
    setup();
    const ctx = writeDoc(
      '.pythia/workflows/features/feat-test/contexts/ctx.context.md',
      `# Context

## References

## Used by

- [plan] [Plan A](../plans/plan-a.plan.md)
`,
    );
    // consumer exists but has no ## References pointing back
    writeDoc(
      '.pythia/workflows/features/feat-test/plans/plan-a.plan.md',
      `# Plan A

No references here.
`,
    );
    const r = runChecker(ctx);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/refs-owned\.phantom_used_by/);
    expect(r.stderr).toMatch(/Plan A/);
  });

  it('fails with phantom_used_by when consumer file does not exist', () => {
    setup();
    const ctx = writeDoc(
      '.pythia/workflows/features/feat-test/contexts/ctx.context.md',
      `# Context

## References

## Used by

- [plan] [Plan Ghost](../plans/ghost.plan.md)
`,
    );
    const r = runChecker(ctx);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/refs-owned\.phantom_used_by/);
    expect(r.stderr).toMatch(/ghost\.plan\.md/);
  });

  it('fails with phantom_reference when ## References entry not in body', () => {
    setup();
    // plan has a ## References entry for a sync-zone file not cited in body
    const plan = writeDoc(
      '.pythia/workflows/features/feat-test/plans/plan-a.plan.md',
      `# Plan A

No body link to context.

## References

- [context] [Context](../contexts/ctx.context.md#abc123)
`,
    );
    // The context file exists in sync zone
    writeDoc(
      '.pythia/workflows/features/feat-test/contexts/ctx.context.md',
      '# Context\n\nBody.\n',
    );
    const r = runChecker(plan);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/refs-owned\.phantom_reference/);
    expect(r.stderr).toMatch(/ctx\.context\.md/);
  });

  it('exits 0 when body link matches ## References entry', () => {
    setup();
    const plan = writeDoc(
      '.pythia/workflows/features/feat-test/plans/plan-a.plan.md',
      `# Plan A

See [Context](../contexts/ctx.context.md) for details.

## References

- [context] [Context](../contexts/ctx.context.md#abc123)
`,
    );
    writeDoc(
      '.pythia/workflows/features/feat-test/contexts/ctx.context.md',
      '# Context\n\nBody.\n',
    );
    const r = runChecker(plan);
    // Only check phantom_reference — Used by checks are separate
    expect(r.stderr).not.toMatch(/refs-owned\.phantom_reference/);
  });


  it('fails with relation.unknown when References entry has unknown label', () => {
    setup();
    // Target exists; body cites it so it is not phantom; label is bogus
    writeDoc(
      '.pythia/workflows/features/feat-test/contexts/target.context.md',
      '# Target\n\nBody.\n',
    );
    const doc = writeDoc(
      '.pythia/workflows/features/feat-test/contexts/doc.context.md',
      `# Doc

See [Target](../contexts/target.context.md#@bogus).

## References

- [research:bogus] [Target](../contexts/target.context.md#abc123)
`,
    );
    const r = runChecker(doc);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/relation\.unknown/);
    expect(r.stderr).toContain('bogus');
  });

  it('passes when References entry has configured relation label', () => {
    setup();
    writeDoc(
      '.pythia/workflows/features/feat-test/contexts/target.context.md',
      '# Target\n\nBody.\n',
    );
    const doc = writeDoc(
      '.pythia/workflows/features/feat-test/contexts/doc.context.md',
      `# Doc

See [Target](../contexts/target.context.md#@based-on).

## References

- [research:based-on] [Target](../contexts/target.context.md#abc123)
`,
    );
    const r = runChecker(doc);
    expect(r.status).toBe(0);
  });

  it('links in any h2 section count as body citations — bibliography skip-list is empty', () => {
    setup();
    writeDoc(
      '.pythia/workflows/features/feat-test/contexts/src.context.md',
      '# Src\n\nBody.\n',
    );
    const doc = writeDoc(
      '.pythia/workflows/features/feat-test/contexts/doc.context.md',
      `# Doc

## Links

- [Src](src.context.md)

## References

- [research] [Src](src.context.md#abc123)
`,
    );
    const r = runChecker(doc);
    expect(r.stderr).not.toMatch(/phantom_reference/);
  });

  it('reverse relation labels in ## Used by (basis-for, sourced-by) pass validation', () => {
    setup();
    // Consumer references target with #@based-on; sync writes basis-for into target ## Used by
    writeDoc(
      '.pythia/workflows/features/feat-test/contexts/consumer.context.md',
      `# Consumer

See [Target](../contexts/target.context.md).

## References

- [research:based-on] [Target](../contexts/target.context.md#abc123)
`,
    );
    const target = writeDoc(
      '.pythia/workflows/features/feat-test/contexts/target.context.md',
      `# Target

Body.

## References

## Used by

- [research:basis-for] [Consumer](consumer.context.md)
`,
    );
    const r = runChecker(target);
    expect(r.status).toBe(0);
    expect(r.stderr).not.toMatch(/relation\.unknown/);
  });

  it('E2E: inputs sync typed link → refs-owned passes on target', () => {
    setup();
    writeDoc(
      '.pythia/workflows/features/feat-e2e/contexts/target.context.md',
      '# Target\n\nBody.\n',
    );
    const consumer = writeDoc(
      '.pythia/workflows/features/feat-e2e/contexts/consumer.context.md',
      '# Consumer\n\nSee [Target](target.context.md#@based-on).\n',
    );
    const syncResult = spawnSync(process.execPath, [inputsSrc, 'sync', consumer], {
      encoding: 'utf8',
      cwd: root,
    });
    expect(syncResult.status).toBe(0);

    const target = join(root, '.pythia/workflows/features/feat-e2e/contexts/target.context.md');
    const r = runChecker(target);
    expect(r.status).toBe(0);
    expect(r.stderr).toBe('');
  });

  it('exits 0 for non-sync-zone file', () => {
    setup();
    // File outside .pythia is not a sync-zone file
    const doc = writeDoc('README.md', '# Root README\n');
    const r = runChecker(doc);
    expect(r.status).toBe(0);
  });

  it('exits 2 when file does not exist', () => {
    setup();
    const r = runChecker('/nonexistent/path/file.md');
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/not found/i);
  });
});
