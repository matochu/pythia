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
import { seedInputsFreshnessMigrationCorpus } from '../cli/tests/helpers/inputs-migration-corpus.js';
import { TEST_FEATURE_ID, seedPythiaProjectRegistration } from '../cli/tests/helpers/workflow-paths.js';

let root;
const WF = `.pythia/workflows/features/${TEST_FEATURE_ID}`;

function wf(rel) {
  return `${WF}/${rel}`;
}

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
  seedPythiaProjectRegistration(root);
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
  it('maps plan/research/note/doc/code and workflow artifact kinds', () => {
    expect(kindForPath('plans/x.plan.md')).toBe('plan');
    expect(kindForPath('.pythia/workflows/f/contexts/x.context.md')).toBe('research');
    expect(kindForPath('.pythia/workflows/f/notes/x.md')).toBe('note');
    expect(kindForPath('feat-slug.md')).toBe('feat');
    expect(kindForPath('docs/guide.md')).toBe('doc');
    expect(kindForPath('lib/module.js')).toBe('code');
    expect(
      kindForPath('docs/guide.md', {
        targetAbs: join(root, 'docs/guide.md'),
        root,
      }),
    ).toBe('doc');
    expect(kindForPath('reports/x.review.md')).toBe('review');
    expect(kindForPath('reports/x.implementation.md')).toBe('impl');
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
    writeDoc(wf('dep.md'), 'content\n');
    const file = writeDoc(wf('plans/plan.plan.md'), '# Plan\n\nSee [dep](../dep.md).\n');
    expect(runInputs(['sync', file]).status).toBe(0);
    const parsed = parseTrailingRefs(readFileSync(file, 'utf8'));
    expect(parsed.references.some((r) => r.path.includes('dep.md'))).toBe(true);
    expect(parsed.references[0].hash).toHaveLength(5);
  });

  it('removes standalone duplicate list items from body, leaves inline links', () => {
    writeDoc(wf('dep.md'), 'content\n');
    const file = writeDoc(wf('plans/plan.plan.md'), `# Plan

- [dep](../dep.md)

Inline [dep](../dep.md) stays.
`);
    runInputs(['sync', file]);
    const body = getBodyContent(readFileSync(file, 'utf8'));
    expect(body).not.toMatch(/^- \[dep\]/m);
    expect(body).toContain('Inline [dep](../dep.md) stays.');
  });

  it('registers reverse Used by repo-wide', () => {
    writeDoc(wf('dep.md'), 'dep\n');
    const plan = writeDoc(wf('plans/plan.plan.md'), '# Plan\n\n[dep](../dep.md)\n');
    runInputs(['sync', plan]);
    const depContent = readFileSync(join(root, wf('dep.md')), 'utf8');
    expect(depContent).toContain('## Used by');
    expect(depContent).toContain('plan.plan.md');
    expect(runInputs(['check', plan]).status).toBe(0);
  });

  it('migrates and strips frontmatter inputs', () => {
    writeDoc(wf('dep.md'), 'dep content\n');
    const depHash = hashFile(join(root, wf('dep.md')));
    const file = writeDoc(wf('contexts/ctx.context.md'), `---
inputs:
  - dep.md:${depHash}
---
# Context

[dep](../dep.md)
`);
    runInputs(['sync', file]);
    const out = readFileSync(file, 'utf8');
    expect(out).not.toContain('inputs:');
    expect(out).toContain('## References');
  });

  it('transfers legacy frontmatter deps without body link', () => {
    writeDoc(wf('legacy-dep.md'), 'y\n');
    const file = writeDoc(wf('doc.md'), `---
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
    writeDoc(wf('orphan.md'), 'x\n');
    const hash = hashFile(join(root, wf('orphan.md'))).slice(0, 5);
    const file = writeDoc(wf('doc.md'), `# Doc

Body text only.

## References

- [code] [orphan](./orphan.md#${hash})
`);
    runInputs(['sync', file]);
    const parsed = parseTrailingRefs(readFileSync(file, 'utf8'));
    expect(parsed.references.some((r) => r.path.includes('orphan'))).toBe(true);
  });

  it('preserves trailing ## Used by after plan sync then context sync', () => {
    const ctx = writeDoc(wf('contexts/ctx.context.md'), '# Context\n\nBody.\n');
    const plan = writeDoc(wf('plans/x.plan.md'), '# Plan\n\n[ctx](../contexts/ctx.context.md)\n');
    runInputs(['sync', plan]);
    const ctxPath = join(root, wf('contexts/ctx.context.md'));
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
    writeDoc(wf('linked.md'), 'x\n');
    writeDoc(wf('manual.md'), 'y\n');
    const file = writeDoc(wf('doc.md'), `---
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
    expect(paths.some((p) => p.endsWith('linked.md'))).toBe(true);
    expect(paths.some((p) => p.endsWith('manual.md'))).toBe(true);
    expect(`${r.stdout}${r.stderr}`).not.toMatch(/manual dep not found as a link/);
  });

  it('skips sync outside .pythia markdown scope', () => {
    const file = writeDoc('package.json', '{"name":"x"}\n');
    const r = runInputs(['sync', file]);
    expect(r.status).toBe(2);
    expect(readFileSync(file, 'utf8')).not.toContain('## References');
  });

  it('does not append References to non-workflow link targets', () => {
    writeDoc('package.json', '{"name":"x"}\n');
    const plan = writeDoc(wf('plans/plan.plan.md'), '# Plan\n\nSee [pkg](../../../../../package.json).\n');
    expect(runInputs(['sync', plan]).status).toBe(0);
    expect(readFileSync(join(root, 'package.json'), 'utf8')).not.toContain('## References');
    const parsed = parseTrailingRefs(readFileSync(plan, 'utf8'));
    expect(parsed?.references?.some((r) => r.path.includes('package.json'))).toBe(true);
  });

  it('omits empty References region when there are no deps', () => {
    const file = writeDoc(wf('empty.md'), '# Empty\n\nNo links.\n');
    runInputs(['sync', file]);
    expect(readFileSync(file, 'utf8')).not.toContain('## References');
  });

  it('syncs markdown under .pythia/ctx (not only workflows)', () => {
    writeDoc('.pythia/ctx/linked.md', 'linked\n');
    const file = writeDoc('.pythia/ctx/note.md', '# Note\n\n[linked](./linked.md)\n');
    expect(runInputs(['sync', file]).status).toBe(0);
    expect(readFileSync(file, 'utf8')).toContain('## References');
  });

  it('skips .pythia/runtime markdown', () => {
    const file = writeDoc('.pythia/runtime/note.md', '# Runtime\n');
    expect(runInputs(['sync', file]).status).toBe(2);
  });

  it('preserves stored References entry when sync target is temporarily missing but still cited in body', () => {
    const plan = writeDoc(wf('plans/plan.plan.md'), `# Plan

Still cites [gone](./gone.md).

## References

- [note] [gone](./gone.md#abc12)
`);
    const r = runInputs(['sync', plan]);
    expect(r.status).toBe(0);
    const out = readFileSync(plan, 'utf8');
    expect(out).toMatch(/\[note\] \[gone\]\(\.\/gone\.md#abc12\)/);
  });

  it('preserves missing ref when body doc-relative path differs from repo-root References path', () => {
    const ctxRel = `${WF}/contexts/x.context.md`;
    const plan = writeDoc(wf('plans/plan.plan.md'), `# Plan

Uses [ctx](../contexts/x.context.md).

## References

- [ctx] [x](${ctxRel}#abc12)
`);
    const r = runInputs(['sync', plan]);
    expect(r.status).toBe(0);
    const out = readFileSync(plan, 'utf8');
    expect(out).toContain(`${ctxRel}#abc12`);
  });

  it('drops stored References entry when target is missing and no longer cited in body', () => {
    const plan = writeDoc(wf('plans/plan.plan.md'), `# Plan

No body link to gone.

## References

- [note] [gone](./gone.md#abc12)
`);
    const r = runInputs(['sync', plan]);
    expect(r.status).toBe(0);
    const out = readFileSync(plan, 'utf8');
    expect(out).not.toMatch(/gone\.md/);
  });
});

describe('check', () => {
  it('reads References #hash and flags stale', () => {
    writeDoc(wf('dep.md'), 'v1\n');
    const hash = hashFile(join(root, wf('dep.md')));
    const file = writeDoc(wf('doc.md'), `# Doc

## References

- [doc] [dep](./dep.md#${hash})
`);
    expect(runInputs(['check', file]).status).toBe(0);
    writeFileSync(join(root, wf('dep.md')), 'v2\n');
    expect(runInputs(['check', file]).status).toBe(1);
  });

  it('skips docs without ## References (exit 0)', () => {
    const file = writeDoc(wf('plain.md'), '# No refs\n');
    expect(runInputs(['check', file]).status).toBe(0);
  });

  it('--all aggregates and exits 1 when any stale', () => {
    writeDoc(wf('dep.md'), 'v1\n');
    const hash = hashFile(join(root, wf('dep.md')));
    writeDoc(wf('doc.md'), `# Doc

## References

- [doc] [dep](./dep.md#${hash})
`);
    writeFileSync(join(root, wf('dep.md')), 'v2\n');
    expect(runInputs(['check', '--all']).status).toBe(1);
  });

  it('--all scans .pythia/ctx markdown outside workflows', () => {
    writeDoc('.pythia/ctx/dep.md', 'v1\n');
    const hash = hashFile(join(root, '.pythia/ctx/dep.md'));
    writeDoc('.pythia/ctx/user.md', `# User

## References

- [note] [dep](./dep.md#${hash})
`);
    writeFileSync(join(root, '.pythia/ctx/dep.md'), 'v2\n');
    expect(runInputs(['check', '--all']).status).toBe(1);
  });
});

describe('migrateWorkflowInputs', () => {
  it('skips docs whose only body links are inside fenced code blocks', () => {
    writeDoc(wf('ghost.md'), 'ghost\n');
    writeDoc(wf('doc.md'), `# Doc

\`\`\`md
[ghost](../ghost.md)
\`\`\`
`);
    const result = migrateWorkflowInputs(root);
    expect(result.status).toBe('skipped');
    expect(readFileSync(join(root, wf('doc.md')), 'utf8')).not.toContain('## References');
  });
});

describe('inputs migration corpus (unit)', () => {
  it('legacy context migrates with non-empty References and [note] dep kind', () => {
    const paths = seedInputsFreshnessMigrationCorpus(root);
    runInputs(['sync', paths.legacyContext]);
    const out = readFileSync(paths.legacyContext, 'utf8');
    expect(out).toMatch(/\[note\].*dep\.md#/);
    expect(out).not.toMatch(/## References\n\n\n## Used by/s);
  });

  it('plan references feat doc as [feat]', () => {
    const paths = seedInputsFreshnessMigrationCorpus(root);
    runInputs(['sync', paths.plan]);
    const out = readFileSync(paths.plan, 'utf8');
    expect(out).toMatch(new RegExp(`\\[feat\\].*${TEST_FEATURE_ID}\\.md#`));
  });

  it('does not corrupt package.json when plan links to it', () => {
    const paths = seedInputsFreshnessMigrationCorpus(root);
    const before = readFileSync(paths.packageJson, 'utf8');
    runInputs(['sync', paths.plan]);
    expect(readFileSync(paths.packageJson, 'utf8')).toBe(before);
  });
});

describe('rdeps', () => {
  it('finds repo-wide dependents and flags stale', () => {
    writeDoc('.pythia/workflows/features/feat-a/target.md', 'v1\n');
    const user = writeDoc('.pythia/workflows/features/feat-b/user.md', `# User

[target](../feat-a/target.md)
`);
    runInputs(['sync', user]);
    writeFileSync(join(root, '.pythia/workflows/features/feat-a/target.md'), 'v2\n');
    expect(runInputs(['rdeps', join(root, '.pythia/workflows/features/feat-a/target.md')]).status).toBe(1);
  });
});
