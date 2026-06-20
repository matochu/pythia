import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import {
  splitHashFragment,
  kindForPath,
  parseTrailingRefs,
  writeTrailingRefs,
  getBodyContent,
  renderTrailingRegion,
} from '../lib/refs.js';
import { deriveDeps, hashFile, migrateWorkflowInputs } from '../lib/inputs-core.js';

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

function runInputs(args) {
  return spawnSync(process.execPath, [resolve('tools/bin/inputs.js'), ...args], {
    encoding: 'utf8',
    cwd: root,
  });
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'pythia-inputs-'));
  initGit(root);
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('splitHashFragment', () => {
  it('recovers path and 5-char hash', () => {
    expect(splitHashFragment('../foo.md#abc12')).toEqual({ path: '../foo.md', hash: 'abc12' });
    expect(splitHashFragment('bar.md')).toEqual({ path: 'bar.md', hash: null });
  });
});

describe('kindForPath', () => {
  it('maps plan/research/doc/code', () => {
    expect(kindForPath('plans/x.plan.md')).toBe('plan');
    expect(kindForPath('ctx/x.context.md')).toBe('research');
    expect(kindForPath('notes/x.md')).toBe('doc');
    expect(kindForPath('tools/bin/inputs.js')).toBe('code');
    expect(kindForPath('notes/x.feat.md')).toBe('doc');
  });
});

describe('trailing region', () => {
  it('round-trips, typed, body unchanged', () => {
    const body = '# Title\n\nSee [dep](./dep.md) inline.\n';
    const region = {
      references: [{ kind: 'doc', text: 'dep', path: './dep.md', hash: 'abc12' }],
      usedBy: [],
    };
    const file = writeDoc('doc.md', body + renderTrailingRegion(region));
    const parsed = parseTrailingRefs(readFileSync(file, 'utf8'));
    expect(parsed.references).toHaveLength(1);
    expect(parsed.references[0].kind).toBe('doc');
    expect(getBodyContent(readFileSync(file, 'utf8'))).toBe(body.trimEnd());
  });

  it('writeTrailingRefs relocates mid-document ## References to EOF (after ## Decision Log)', () => {
    const content = `# Plan

## Decision Log

- item

## References

- [doc] [old](./old.md#11111)

## Retrospective

- note
`;
    const file = writeDoc('plan.md', content);
    writeTrailingRefs(file, {
      references: [{ kind: 'doc', text: 'new', path: './new.md', hash: '22222' }],
      usedBy: [],
    });
    const out = readFileSync(file, 'utf8');
    expect(out.indexOf('## Retrospective')).toBeLessThan(out.indexOf('## References'));
    expect(out.trimEnd().endsWith('(./new.md#22222)')).toBe(true);
  });
});

describe('deriveDeps', () => {
  it('body-only scope excludes existing ## References entries', () => {
    writeDoc('src.md', '# src\n');
    const body = '# Doc\n\nLink [s](./src.md)\n';
    const region = renderTrailingRegion({
      references: [{ kind: 'doc', text: 'ghost', path: './ghost.md', hash: 'aaaaa' }],
      usedBy: [],
    });
    const file = writeDoc('doc.md', body + region);
    const deps = deriveDeps(file, { scope: 'body', root });
    expect(deps).toEqual(['src.md']);
  });

  it('body scope ignores links inside fenced code blocks', () => {
    writeDoc('ghost.md', 'x\n');
    const file = writeDoc('doc.md', `# Doc

\`\`\`md
[ghost](./ghost.md)
\`\`\`
`);
    const deps = deriveDeps(file, { scope: 'body', root });
    expect(deps).not.toContain('ghost.md');
  });

  it('refs scope returns stored {path,hash} pairs', () => {
    const file = writeDoc('doc.md', `# Doc

## References

- [doc] [s](./src.md#abc12)
`);
    const refs = deriveDeps(file, { scope: 'refs', root });
    expect(refs).toEqual([{ path: './src.md', hash: 'abc12' }]);
  });

  it('scope all forwards root to nested body derivation', () => {
    writeDoc('dep.md', 'outside zone\n');
    const zoneRoot = join(root, 'zone');
    const file = writeDoc('zone/inner.md', `# Inner

See [dep](../dep.md).

## References

- [doc] [local](./local.md#aaaaa)
`);
    writeDoc('zone/local.md', 'inside\n');
    const restricted = deriveDeps(file, { scope: 'all', root: zoneRoot });
    expect(restricted).not.toContain('../dep.md');
    expect(restricted.some((p) => p.includes('local'))).toBe(true);
  });
});

describe('sync', () => {
  it('auto-fills typed References from body links only', () => {
    writeDoc('dep.md', 'content\n');
    const file = writeDoc('plan.md', '# Plan\n\nSee [dep](./dep.md).\n');
    expect(runInputs(['sync', file]).status).toBe(0);
    const parsed = parseTrailingRefs(readFileSync(file, 'utf8'));
    expect(parsed.references.some((r) => r.path === 'dep.md')).toBe(true);
    expect(parsed.references[0].hash).toHaveLength(5);
  });

  it('removes standalone duplicate list items from body, leaves inline links', () => {
    writeDoc('dep.md', 'content\n');
    const file = writeDoc('plan.md', `# Plan

- [dep](./dep.md)

Inline [dep](./dep.md) stays.
`);
    runInputs(['sync', file]);
    const body = getBodyContent(readFileSync(file, 'utf8'));
    expect(body).not.toMatch(/^- \[dep\]/m);
    expect(body).toContain('Inline [dep](./dep.md) stays.');
  });

  it('registers reverse Used by repo-wide', () => {
    writeDoc('feat-a/dep.md', 'dep\n');
    const plan = writeDoc('feat-a/plan.md', '# Plan\n\n[dep](./dep.md)\n');
    runInputs(['sync', plan]);
    const depContent = readFileSync(join(root, 'feat-a/dep.md'), 'utf8');
    expect(depContent).toContain('## Used by');
    expect(depContent).toContain('plan.md');
    expect(runInputs(['check', plan]).status).toBe(0);
  });

  it('migrates and strips frontmatter inputs', () => {
    writeDoc('dep.md', 'dep content\n');
    const depHash = hashFile(join(root, 'dep.md'));
    const file = writeDoc('ctx.md', `---
inputs:
  - dep.md:${depHash}
---
# Context

[dep](./dep.md)
`);
    runInputs(['sync', file]);
    const out = readFileSync(file, 'utf8');
    expect(out).not.toContain('inputs:');
    expect(out).toContain('## References');
  });

  it('transfers legacy frontmatter deps without body link', () => {
    writeDoc('legacy-dep.md', 'y\n');
    const file = writeDoc('doc.md', `---
inputs:
  - legacy-dep.md:00000000
---
# Doc

No links here.
`);
    runInputs(['sync', file]);
    const parsed = parseTrailingRefs(readFileSync(file, 'utf8'));
    expect(parsed.references.some((r) => r.path.includes('legacy-dep'))).toBe(true);
    expect(readFileSync(file, 'utf8')).not.toContain('inputs:');
  });

  it('preserves stored ## References without body link', () => {
    writeDoc('orphan.md', 'x\n');
    const hash = hashFile(join(root, 'orphan.md')).slice(0, 5);
    const file = writeDoc('doc.md', `# Doc

Body text only.

## References

- [code] [orphan](./orphan.md#${hash})
`);
    runInputs(['sync', file]);
    const parsed = parseTrailingRefs(readFileSync(file, 'utf8'));
    expect(parsed.references.some((r) => r.path.includes('orphan'))).toBe(true);
  });

  it('preserves trailing ## Used by after plan sync then context sync', () => {
    const ctx = writeDoc('feat/contexts/ctx.context.md', '# Context\n\nBody.\n');
    const plan = writeDoc('feat/plans/x.plan.md', '# Plan\n\n[ctx](../contexts/ctx.context.md)\n');
    runInputs(['sync', plan]);
    const ctxPath = join(root, 'feat/contexts/ctx.context.md');
    let parsed = parseTrailingRefs(readFileSync(ctxPath, 'utf8'));
    expect(parsed?.usedBy?.some((u) => u.path.includes('x.plan'))).toBe(true);

    writeFileSync(ctxPath, `# Context\n\nBody updated.\n\n${renderTrailingRegion(parsed)}`);
    runInputs(['sync', ctxPath]);
    const out = readFileSync(ctxPath, 'utf8');
    parsed = parseTrailingRefs(out);
    expect(parsed?.usedBy?.some((u) => u.path.includes('x.plan'))).toBe(true);
    expect(out.indexOf('Body updated')).toBeLessThan(out.indexOf('## Used by'));
  });

  it('--keep-manual is deprecated alias (same as default sync)', () => {
    writeDoc('linked.md', 'x\n');
    writeDoc('manual.md', 'y\n');
    const file = writeDoc('doc.md', `---
inputs:
  - manual.md:00000000
---
# Doc

[linked](./linked.md)
`);
    const r = runInputs(['sync', file, '--keep-manual']);
    expect(r.status).toBe(0);
    const parsed = parseTrailingRefs(readFileSync(file, 'utf8'));
    const paths = parsed.references.map((x) => x.path);
    expect(paths).toContain('linked.md');
    expect(paths.some((p) => p.endsWith('manual.md'))).toBe(true);
    expect(`${r.stdout}${r.stderr}`).not.toMatch(/manual dep not found as a link/);
  });
});

describe('check', () => {
  it('reads References #hash and flags stale', () => {
    writeDoc('dep.md', 'v1\n');
    const hash = hashFile(join(root, 'dep.md'));
    const file = writeDoc('doc.md', `# Doc

## References

- [doc] [dep](./dep.md#${hash})
`);
    expect(runInputs(['check', file]).status).toBe(0);
    writeFileSync(join(root, 'dep.md'), 'v2\n');
    expect(runInputs(['check', file]).status).toBe(1);
  });

  it('skips docs without ## References (exit 0)', () => {
    const file = writeDoc('plain.md', '# No refs\n');
    expect(runInputs(['check', file]).status).toBe(0);
  });

  it('--all aggregates and exits 1 when any stale', () => {
    writeDoc('.pythia/workflows/feat/dep.md', 'v1\n');
    const hash = hashFile(join(root, '.pythia/workflows/feat/dep.md'));
    writeDoc('.pythia/workflows/feat/doc.md', `# Doc

## References

- [doc] [dep](./dep.md#${hash})
`);
    writeFileSync(join(root, '.pythia/workflows/feat/dep.md'), 'v2\n');
    expect(runInputs(['check', '--all']).status).toBe(1);
  });
});

describe('migrateWorkflowInputs', () => {
  it('skips docs whose only body links are inside fenced code blocks', () => {
    writeDoc('.pythia/workflows/feat/ghost.md', 'ghost\n');
    writeDoc('.pythia/workflows/feat/doc.md', `# Doc

\`\`\`md
[ghost](../ghost.md)
\`\`\`
`);
    const result = migrateWorkflowInputs(root);
    expect(result.status).toBe('skipped');
    expect(readFileSync(join(root, '.pythia/workflows/feat/doc.md'), 'utf8')).not.toContain('## References');
  });
});

describe('rdeps', () => {
  it('finds repo-wide dependents and flags stale', () => {
    writeDoc('.pythia/workflows/feat-a/target.md', 'v1\n');
    const user = writeDoc('.pythia/workflows/feat-b/user.md', `# User

[target](../feat-a/target.md)
`);
    runInputs(['sync', user]);
    writeFileSync(join(root, '.pythia/workflows/feat-a/target.md'), 'v2\n');
    expect(runInputs(['rdeps', join(root, '.pythia/workflows/feat-a/target.md')]).status).toBe(1);
  });
});
