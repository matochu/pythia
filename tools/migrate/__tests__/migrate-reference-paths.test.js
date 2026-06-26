import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { migrateReferencePaths } from '../ops.js';
import { seedPythiaProjectRegistration } from '../../cli/tests/helpers/workflow-paths.js';

let root;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'pythia-migrate-refpaths-'));
  seedPythiaProjectRegistration(root);
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

function wf(rel, content) {
  const abs = join(root, rel);
  mkdirSync(join(abs, '..'), { recursive: true });
  writeFileSync(abs, content, 'utf8');
  return abs;
}

describe('migrateReferencePaths', () => {
  it('rewrites bare project-root ref to /-absolute', () => {
    // Create the target file so it can be resolved
    mkdirSync(join(root, 'tools', 'lib'), { recursive: true });
    writeFileSync(join(root, 'tools', 'lib', 'foo.js'), '// foo', 'utf8');

    const doc = wf('.pythia/workflows/features/feat-test/plans/x.plan.md', `# Plan

## References

- [code] [foo](tools/lib/foo.js#abc12)
`);
    migrateReferencePaths(root, { op: 'migrate-reference-paths', root: '.pythia' }, null, false, '0.3.8');
    const out = readFileSync(doc, 'utf8');
    expect(out).toContain('[code] [foo](/tools/lib/foo.js');
    expect(out).not.toContain('(tools/lib/foo.js');
  });

  it('rewrites bare intra-.pythia ref to doc-relative', () => {
    mkdirSync(join(root, '.pythia', 'config'), { recursive: true });
    writeFileSync(join(root, '.pythia', 'config', 'relation.md'), '# Relation Types\n', 'utf8');

    const doc = wf('.pythia/workflows/features/feat-test/plans/x.plan.md', `# Plan

## References

- [doc] [Relation Types](.pythia/config/relation.md#91d7b)
`);
    migrateReferencePaths(root, { op: 'migrate-reference-paths', root: '.pythia' }, null, false, '0.3.8');
    const out = readFileSync(doc, 'utf8');
    // Must be doc-relative (starts with ../)
    expect(out).toMatch(/\[Relation Types\]\(\.\.\//);
    expect(out).not.toContain('(.pythia/config/relation.md');
  });

  it('is idempotent — /-absolute entry is not changed again', () => {
    mkdirSync(join(root, 'tools', 'lib'), { recursive: true });
    writeFileSync(join(root, 'tools', 'lib', 'foo.js'), '// foo', 'utf8');

    const content = `# Plan

## References

- [code] [foo](/tools/lib/foo.js#abc12)
`;
    const doc = wf('.pythia/workflows/features/feat-test/plans/x.plan.md', content);
    const result = migrateReferencePaths(root, { op: 'migrate-reference-paths', root: '.pythia' }, null, false, '0.3.8');
    expect(result.status).toBe('skipped');
    expect(readFileSync(doc, 'utf8')).toBe(content);
  });

  it('skips files with no ## References region', () => {
    const doc = wf('.pythia/workflows/features/feat-test/contexts/x.context.md', '# Context\n\nBody only.\n');
    const result = migrateReferencePaths(root, { op: 'migrate-reference-paths', root: '.pythia' }, null, false, '0.3.8');
    expect(result.status).toBe('skipped');
    expect(readFileSync(doc, 'utf8')).toBe('# Context\n\nBody only.\n');
  });
});
