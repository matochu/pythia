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
} from '../lib/references/refs.js';
import { deriveDeps, hashFile, isWorkflowConsumerFile, migrateWorkflowInputs } from '../lib/references/inputs-core.js';
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

describe('isWorkflowConsumerFile', () => {
  it('recognizes .pythia/workflows paths and artifact suffixes under .pythia', () => {
    expect(isWorkflowConsumerFile(writeDoc(wf('plans/p.plan.md'), '# Plan\n'), root)).toBe(true);
    expect(isWorkflowConsumerFile(writeDoc('.pythia/workflows/tasks/task.md', '# Task\n'), root)).toBe(true);
    expect(isWorkflowConsumerFile(writeDoc(wf('contexts/x.context.md'), '# Context\n'), root)).toBe(true);
  });

  it('rejects /workflows/ paths outside .pythia (no false positives)', () => {
    expect(isWorkflowConsumerFile(writeDoc('docs/workflows/guide.md', '# Guide\n'), root)).toBe(false);
    expect(isWorkflowConsumerFile(writeDoc('src/workflows/planning/file.md', '# File\n'), root)).toBe(false);
  });

  it('rejects workflow artifact suffixes outside .pythia sync zone', () => {
    expect(isWorkflowConsumerFile(writeDoc('docs/foo.plan.md', '# Plan\n'), root)).toBe(false);
    expect(isWorkflowConsumerFile(writeDoc('src/reports/x.audit.md', '# Audit\n'), root)).toBe(false);
  });

  it('rejects non-sync-eligible .pythia markdown', () => {
    expect(isWorkflowConsumerFile(writeDoc('.pythia/config/settings.md', '# Settings\n'), root)).toBe(false);
    expect(isWorkflowConsumerFile(writeDoc('.pythia/runtime/note.md', '# Runtime\n'), root)).toBe(false);
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

  it('drops stored sync-zone ## References without body link', () => {
    writeDoc(wf('orphan.md'), 'x\n');
    const hash = hashFile(join(root, wf('orphan.md'))).slice(0, 5);
    const file = writeDoc(wf('doc.md'), `# Doc

Body text only.

## References

- [code] [orphan](./orphan.md#${hash})
`);
    runInputs(['sync', file]);
    const parsed = parseTrailingRefs(readFileSync(file, 'utf8'));
    expect(parsed?.references?.some((r) => r.path.includes('orphan'))).not.toBe(true);
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

  it('removes stale Used by after consumer stops referencing target without trailing refs', () => {
    const ctxPath = writeDoc(wf('contexts/ctx.context.md'), '# Context\n\nBody.\n');
    const plan = writeDoc(wf('plans/x.plan.md'), '# Plan\n\n[ctx](../contexts/ctx.context.md)\n');
    runInputs(['sync', plan]);
    let parsed = parseTrailingRefs(readFileSync(ctxPath, 'utf8'));
    expect(parsed?.usedBy?.some((u) => u.path.includes('x.plan'))).toBe(true);

    writeFileSync(plan, '# Plan\n\nNo links now.\n', 'utf8');
    runInputs(['sync', plan]);
    parsed = parseTrailingRefs(readFileSync(ctxPath, 'utf8'));
    expect(parsed?.usedBy?.some((u) => u.path.includes('x.plan'))).not.toBe(true);
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

  it('does not sync README.md index files under .pythia/workflows', () => {
    writeDoc('.pythia/workflows/ideas/ideas-backlog.md', '# Backlog\n');
    const readme = writeDoc('.pythia/workflows/ideas/README.md', `# Ideas

See [backlog](./ideas-backlog.md).
`);
    expect(runInputs(['sync', readme]).status).toBe(2);
    expect(readFileSync(readme, 'utf8')).not.toMatch(/\[note\]/);
    expect(readFileSync(readme, 'utf8')).not.toContain('## Used by');
  });

  it('does not append Used by to project-root README when a plan links to it', () => {
    writeFileSync(join(root, 'README.md'), '# Project README\n', 'utf8');
    const plan = writeDoc(wf('plans/p.plan.md'), '# Plan\n\nSee [readme](../../../../README.md).\n');
    expect(runInputs(['sync', plan]).status).toBe(0);
    expect(readFileSync(join(root, 'README.md'), 'utf8')).not.toContain('## Used by');
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
    expect(out).toMatch(/\[note\] \[gone\]\(.*gone\.md#abc12\)/);
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

  it('dedupes doc-relative and repo-root missing deps and keeps stored hash', () => {
    const ctxRel = `${WF}/contexts/x.context.md`;
    const plan = writeDoc(wf('plans/plan.plan.md'), `# Plan

Uses [ctx](../contexts/x.context.md).

## References

- [ctx] [x](${ctxRel}#abc12)
- [ctx] [x](../contexts/x.context.md)
`);
    const r = runInputs(['sync', plan]);
    expect(r.status).toBe(0);
    const parsed = parseTrailingRefs(readFileSync(plan, 'utf8'));
    expect(parsed?.references).toHaveLength(1);
    expect(parsed?.references?.[0]?.hash).toBe('abc12');
    expect(parsed?.references?.[0]?.path).toBe(ctxRel);
  });

  it('drops bibliography-only internal stored ref when target is missing and not cited in body', () => {
    const plan = writeDoc(wf('plans/plan.plan.md'), `# Plan

No body link to gone.

## References

- [note] [gone](./gone.md#abc12)
`);
    const r = runInputs(['sync', plan]);
    expect(r.status).toBe(0);
    const out = readFileSync(plan, 'utf8');
    expect(out).not.toMatch(/gone\.md#abc12/);
  });

  it('preserves plain bibliography task doc on sync (missing targets + external URLs)', () => {
    const task = writeDoc('.pythia/workflows/tasks/task-2025-sample.md', `# Task

Summary only — links live in References.

## References

Links to related docs.

- [Workflows Status](../workflows/report.md)
- [Commands](../commands/methodology.md)
- [Jira Ticket](https://example.atlassian.net/browse/INT-291)

---
**Last Updated**: 2025-07-01
`);
    expect(runInputs(['sync', task]).status).toBe(0);
    const out = readFileSync(task, 'utf8');
    expect(out).toContain('## References');
    expect(out).not.toContain('../workflows/report.md');
    expect(out).not.toContain('../commands/methodology.md');
    expect(out).toContain('https://example.atlassian.net/browse/INT-291');
    expect(out).toContain('Links to related docs.');
    expect(out).toContain('**Last Updated**: 2025-07-01');
  });

  it('task knowledge-sharing: typed refs only for resolvable paths; missing dropped', () => {
    writeDoc('navigation/documentation-map.md', '# Documentation Map\n');
    writeDoc('rules/llm-confluence-guidelines.md', '# Confluence Guidelines for LLM\n');
    const fixture = readFileSync(
      resolve('tools/fixtures/workflow-docs/task-knowledge-sharing-pre-sync.md'),
      'utf8',
    );
    const task = writeDoc('.pythia/workflows/tasks/task-knowledge-sharing.md', fixture);
    const r = runInputs(['sync', task, '--verbose']);
    expect(r.status).toBe(0);
    expect(`${r.stdout}${r.stderr}`).not.toMatch(/confluence-structure/i);
    const out = readFileSync(task, 'utf8');
    const parsed = parseTrailingRefs(out);
    expect(parsed?.references?.some((ref) => ref.path.includes('documentation-map.md') && ref.hash)).toBe(true);
    expect(parsed?.references?.some((ref) => ref.path.includes('llm-confluence-guidelines.md') && ref.hash)).toBe(true);
    expect(parsed?.references?.some((ref) => ref.path.includes('confluence-structure'))).toBe(false);
    expect(out).toContain('## Related Documents');
    expect(out).toContain('documentation-standards.md');
    expect(out).not.toMatch(/## References[\s\S]*documentation-standards\.md#?/);
  });

  it('preserves stored hash for missing target on task doc under .pythia/workflows/tasks', () => {
    const task = writeDoc('.pythia/workflows/tasks/task-stale-ref.md', `# Task

Body cites [gone](../navigation/gone.md).

## References

- [doc] [gone](../navigation/gone.md#abc12)
`);
    expect(runInputs(['sync', task]).status).toBe(0);
    const out = readFileSync(task, 'utf8');
    expect(out).toMatch(/navigation\/gone\.md#abc12/);
  });

  it('Related Documents bibliography does not become typed References footer', () => {
    writeDoc('navigation/documentation-standards.md', '# Documentation Standards\n');
    const task = writeDoc('.pythia/workflows/tasks/task-wiped-footer.md', `# Task

## Related Documents

- [Documentation Standards](../navigation/documentation-standards.md)
`);
    expect(runInputs(['sync', task]).status).toBe(0);
    const out = readFileSync(task, 'utf8');
    expect(out).toContain('[Documentation Standards](../navigation/documentation-standards.md)');
    expect(out).not.toContain('## References');
  });

  it('preserves legacy frontmatter hash for missing script target on sync', () => {
    const ctx = writeDoc(wf('contexts/deep.context.md'), `---
inputs:
  - scripts/inputs.sh:ca69a910
---
# Context

No body links.
`);
    expect(runInputs(['sync', ctx]).status).toBe(0);
    const out = readFileSync(ctx, 'utf8');
    expect(out).toMatch(/scripts\/inputs\.sh#ca69a910/);
    expect(out).not.toContain('inputs:');
  });

  it('sync is quiet by default; --verbose prints per-file summary', () => {
    writeDoc(wf('contexts/ctx.context.md'), '# Context\n');
    const plan = writeDoc(wf('plans/p.plan.md'), '# Plan\n\nSee [ctx](../contexts/ctx.context.md).\n');
    const quiet = runInputs(['sync', plan]);
    expect(quiet.status).toBe(0);
    expect(`${quiet.stdout}${quiet.stderr}`).not.toMatch(/^sync:/m);

    writeFileSync(plan, readFileSync(plan, 'utf8').replace('# Plan', '# Plan updated'));
    const loud = runInputs(['sync', plan, '--verbose']);
    expect(loud.status).toBe(0);
    expect(`${loud.stdout}${loud.stderr}`).toMatch(/^sync: \d+ deps/m);
  });

  it('uses body link text instead of filename stem in References', () => {
    writeDoc(wf('contexts/ctx.context.md'), '# Context\n');
    const plan = writeDoc(wf('plans/p.plan.md'), '# Plan\n\nSee [Workflow Restructure](../contexts/ctx.context.md).\n');
    runInputs(['sync', plan]);
    const parsed = parseTrailingRefs(readFileSync(plan, 'utf8'));
    expect(parsed?.references?.some((r) => r.text === 'Workflow Restructure')).toBe(true);
  });

  it('audit report: path-as-link-text in body preserved; References use target H1', () => {
    writeDoc(
      wf('plans/1-inputs-dep-tracking.plan.md'),
      '# Plan 1-inputs-dep-tracking: Inputs Dependency Tracking for Markdown Files\n',
    );
    writeDoc(
      wf('reports/1-inputs-dep-tracking.implementation.md'),
      '# Implementation Report: 1-inputs-dep-tracking\n',
    );
    const audit = writeDoc(wf('reports/1-inputs-dep-tracking.audit.md'), `# Architect Audit: 1-inputs-dep-tracking

Plan: [plans/1-inputs-dep-tracking.plan.md](../plans/1-inputs-dep-tracking.plan.md)
Implementation: [reports/1-inputs-dep-tracking.implementation.md](./1-inputs-dep-tracking.implementation.md)

## Conformance

Partial conformance notes.
`);
    runInputs(['sync', audit]);
    const out = readFileSync(audit, 'utf8');
    expect(out).toMatch(
      /\[plan\] \[Plan 1-inputs-dep-tracking: Inputs Dependency Tracking for Markdown Files\]/,
    );
    expect(out).toMatch(/\[impl\] \[Implementation Report: 1-inputs-dep-tracking\]/);
    const body = getBodyContent(out);
    expect(body).toContain('[plans/1-inputs-dep-tracking.plan.md](../plans/1-inputs-dep-tracking.plan.md)');
    expect(body).toContain('[reports/1-inputs-dep-tracking.implementation.md](./1-inputs-dep-tracking.implementation.md)');
    expect(body).not.toContain('[Plan 1-inputs-dep-tracking: Inputs Dependency Tracking for Markdown Files](../plans/');
  });

  it('does not rewrite filename placeholder labels in body on sync', () => {
    writeDoc(
      wf('contexts/lifecycle-process-inventory-and-config-brainstorm.context.md'),
      '# Lifecycle Process Inventory and Config Brainstorm\n',
    );
    const plan = writeDoc(wf('plans/p.plan.md'), `# Plan

- [lifecycle-process-inventory-and-config-brainstorm.context.md](../contexts/lifecycle-process-inventory-and-config-brainstorm.context.md) — consulted for process inventory.
`);
    runInputs(['sync', plan]);
    const body = getBodyContent(readFileSync(plan, 'utf8'));
    expect(body).toContain('[lifecycle-process-inventory-and-config-brainstorm.context.md](../contexts/lifecycle-process-inventory-and-config-brainstorm.context.md)');
    const parsed = parseTrailingRefs(readFileSync(plan, 'utf8'));
    expect(parsed?.references?.some((r) => r.text === 'Lifecycle Process Inventory and Config Brainstorm')).toBe(true);
  });

  it('legacy frontmatter migration uses target H1 titles, not path stems', () => {
    writeDoc(
      wf('plans/1-inputs-dep-tracking.plan.md'),
      '# Plan 1-inputs-dep-tracking: Inputs Dependency Tracking for Markdown Files\n',
    );
    writeDoc(
      wf('reports/1-inputs-dep-tracking.implementation.md'),
      '# Implementation Report: 1-inputs-dep-tracking\n',
    );
    const planHash = hashFile(join(root, wf('plans/1-inputs-dep-tracking.plan.md')));
    const implHash = hashFile(join(root, wf('reports/1-inputs-dep-tracking.implementation.md')));
    const audit = writeDoc(wf('reports/1-inputs-dep-tracking.audit.md'), `---
inputs:
  - ${WF}/plans/1-inputs-dep-tracking.plan.md:${planHash}
  - ${WF}/reports/1-inputs-dep-tracking.implementation.md:${implHash}
---
# Architect Audit: 1-inputs-dep-tracking

No body links.
`);
    runInputs(['sync', audit]);
    const parsed = parseTrailingRefs(readFileSync(audit, 'utf8'));
    expect(parsed?.references?.some((r) => r.text.includes('Plan 1-inputs-dep-tracking: Inputs Dependency Tracking'))).toBe(true);
    expect(parsed?.references?.some((r) => r.text === 'Implementation Report: 1-inputs-dep-tracking')).toBe(true);
    expect(parsed?.references?.every((r) => !/^plans\//.test(r.text) && !/^reports\//.test(r.text))).toBe(true);
  });

  it('preserves external URLs from period and academic bibliography on sync', () => {
    const ctx = writeDoc(wf('contexts/bmad-method-deep-dive.context.md'), `# BMAD-METHOD Deep-Dive

## References

- BMAD-METHOD repo. https://github.com/bmad-code-org/BMAD-METHOD
- buildmode.dev. "BMad Method in Action." https://buildmode.dev/blog/mastering-bmad-method-2025/
- [llmwiki](https://github.com/lucasastorian/llmwiki) — open source wiki
`);
    runInputs(['sync', ctx]);
    const out = readFileSync(ctx, 'utf8');
    expect(out).toMatch(/\[url\] \[BMAD-METHOD repo\]\(https:\/\/github\.com\/bmad-code-org\/BMAD-METHOD\)/);
    expect(out).toMatch(/\[url\] \[BMad Method in Action\.\]\(https:\/\/buildmode\.dev\//);
    expect(out).toMatch(/\[url\] \[llmwiki\]\(https:\/\/github\.com\/lucasastorian\/llmwiki\)/);
  });

  it('dedupes external URL when cited in body and bibliography trail', () => {
    const url = 'https://github.com/lucasastorian/llmwiki';
    const ctx = writeDoc(wf('contexts/ext-dedup.context.md'), `# Context

See [llmwiki](${url}).

## References

- llmwiki. ${url}
`);
    runInputs(['sync', ctx]);
    const parsed = parseTrailingRefs(readFileSync(ctx, 'utf8'));
    const urlRefs = (parsed?.references ?? []).filter((r) => r.path.includes('lucasastorian/llmwiki'));
    expect(urlRefs).toHaveLength(1);
  });

  it('dedupes external URL when typed ref hash differs from bibliography trail', () => {
    const url = 'https://github.com/lucasastorian/llmwiki';
    const ctx = writeDoc(wf('contexts/ext-hash-dedup.context.md'), `# Context

## References

- [url] [llmwiki](${url}#abc12)
- llmwiki. ${url}
`);
    runInputs(['sync', ctx]);
    const parsed = parseTrailingRefs(readFileSync(ctx, 'utf8'));
    const urlRefs = (parsed?.references ?? []).filter((r) => r.path.includes('lucasastorian/llmwiki'));
    expect(urlRefs).toHaveLength(1);
  });

  it('References use target title when body link label is filename placeholder', () => {
    writeDoc(
      wf('contexts/skill-architecture-and-language-settings.context.md'),
      '---\ntitle: Skill Architecture and Language Settings Research\n---\n\n# Skill Architecture and Language Settings Research\n',
    );
    writeDoc(
      wf('contexts/skill-config-overrides-research.context.md'),
      '# Skill Config Overrides Research\n',
    );
    const research = writeDoc(wf('contexts/mattpocock.context.md'), `# Research

## Pre-Search Summary

Prior work:

- [skill-architecture-and-language-settings.context.md](./skill-architecture-and-language-settings.context.md)
- [skill-config-overrides-research.context.md](./skill-config-overrides-research.context.md)
`);
    runInputs(['sync', research]);
    const body = getBodyContent(readFileSync(research, 'utf8'));
    expect(body).toContain('[skill-architecture-and-language-settings.context.md](./skill-architecture-and-language-settings.context.md)');
    expect(body).toContain('[skill-config-overrides-research.context.md](./skill-config-overrides-research.context.md)');
    const parsed = parseTrailingRefs(readFileSync(research, 'utf8'));
    expect(parsed?.references?.some((r) => r.text === 'Skill Architecture and Language Settings Research')).toBe(true);
    expect(parsed?.references?.some((r) => r.text === 'Skill Config Overrides Research')).toBe(true);
  });

  it('classifies skills with folder label, not SKILL filename', () => {
    mkdirSync(join(root, 'skills/workflow'), { recursive: true });
    writeFileSync(join(root, 'skills/workflow/SKILL.md'), '# Workflow\n');
    const plan = writeDoc(wf('plans/p.plan.md'), '# Plan\n\nSee [workflow](../../../../../skills/workflow/SKILL.md).\n');
    runInputs(['sync', plan]);
    const out = readFileSync(plan, 'utf8');
    expect(out).toMatch(/\[skill\] \[workflow\]\(skills\/workflow\/SKILL\.md#/);
  });

  it('drops mistagged stored sync-zone refs without body links on sync', () => {
    const retroRel = `${WF}/notes/feat-test.retro.md`;
    writeDoc(retroRel, '# Retro\n');
    const plan = writeDoc(wf('plans/p.plan.md'), `# Plan

## References

- [feat] [feat-test](${retroRel}#abc12)
`);
    runInputs(['sync', plan]);
    const out = readFileSync(plan, 'utf8');
    expect(out).not.toMatch(/feat-test\.retro\.md/);
  });

  it('preserves plan ## Contexts bibliography when same deps appear in References', () => {
    writeDoc(wf('contexts/a.context.md'), '# Context\n');
    const ctxHash = hashFile(join(root, wf('contexts/a.context.md')));
    const plan = writeDoc(wf('plans/p.plan.md'), `# Plan

## Contexts

- [Workflow Restructure](../contexts/a.context.md)

## References

- [ctx] [a](../contexts/a.context.md#${ctxHash})
`);
    runInputs(['sync', plan]);
    const body = getBodyContent(readFileSync(plan, 'utf8'));
    expect(body).toContain('[Workflow Restructure](../contexts/a.context.md)');
  });

  it('preserves research Pre-Search Summary link lists (mattpocock fixture)', () => {
    const featId = 'feat-2026-05-skill-workflow-architecture-improvements';
    const featDir = `.pythia/workflows/features/${featId}`;
    const ctxDir = `${featDir}/contexts`;
    writeDoc(`${ctxDir}/skill-architecture-and-language-settings.context.md`, '---\ntitle: Skill Architecture and Language Settings Research\n---\n\n# Skill Architecture and Language Settings Research\n');
    writeDoc(`${ctxDir}/skill-config-overrides-research.context.md`, '# Skill Config Overrides Research\n');
    const fixture = readFileSync(
      resolve('tools/fixtures/workflow-docs/mattpocock-pre-sync.context.md'),
      'utf8',
    );
    const target = writeDoc(`${ctxDir}/mattpocock-skills-project-research.context.md`, fixture);
    expect(runInputs(['sync', target]).status).toBe(0);
    const body = getBodyContent(readFileSync(target, 'utf8'));
    expect(body).toContain('## Pre-Search Summary');
    expect(body).toContain('[skill-architecture-and-language-settings.context.md](./skill-architecture-and-language-settings.context.md)');
    expect(body).toContain('[skill-config-overrides-research.context.md](./skill-config-overrides-research.context.md)');
  });

  it('syncs legacy frontmatter-only plan into ## References', () => {
    writeDoc(wf('feat-test.md'), '# Feature\n');
    writeDoc(wf('contexts/a.context.md'), '# Context\n');
    writeDoc(wf('reports/r.review.md'), '# Review\n');
    const featHash = hashFile(join(root, wf('feat-test.md')));
    const ctxHash = hashFile(join(root, wf('contexts/a.context.md')));
    const reviewHash = hashFile(join(root, wf('reports/r.review.md')));
    const plan = writeDoc(wf('plans/5-sample.plan.md'), `---
inputs:
  - ${WF}/feat-test.md:${featHash}
  - ${WF}/contexts/a.context.md:${ctxHash}
  - ${WF}/reports/r.review.md:${reviewHash}
---
# Plan

No body dependency links.
`);
    expect(runInputs(['sync', plan]).status).toBe(0);
    const out = readFileSync(plan, 'utf8');
    expect(out).toContain('## References');
    expect(out).not.toMatch(/^inputs:/m);
    expect(out).toMatch(/feat-test\.md#/);
    expect(out).toMatch(/a\.context\.md#/);
    expect(out).toMatch(/r\.review\.md#/);
  });

  it('ctx bibliography: prose links become typed refs; external URLs kept', () => {
    writeDoc('.pythia/ctx/pythia-workflow-mental-model.ctx.md', '# Pythia Workflow Mental Model\n');
    writeDoc(
      '.pythia/workflows/features/feat-2026-04-llm-wiki-integration/contexts/llm-agent-systems-comparison-criteria.context.md',
      '# LLM Agent Systems — Comparison Criteria & Existing Taxonomies\n',
    );
    const ctx = writeDoc('.pythia/ctx/llm-agent-and-sdd-comparison-criteria.ctx.md', `# LLM Agent and SDD System Comparison Criteria

Read with [Pythia Workflow Mental Model](pythia-workflow-mental-model.ctx.md).

## References

- Feature-local source research: [LLM Agent Systems — Comparison Criteria & Existing Taxonomies](../workflows/features/feat-2026-04-llm-wiki-integration/contexts/llm-agent-systems-comparison-criteria.context.md)
- Pythia workflow mental model: [Pythia Workflow Mental Model](pythia-workflow-mental-model.ctx.md)
- Anthropic, "Building Effective AI Agents": https://www.anthropic.com/research/building-effective-agents
`);
    expect(runInputs(['sync', ctx]).status).toBe(0);
    const out = readFileSync(ctx, 'utf8');
    expect(out).toMatch(/\[url\] \[Anthropic.*\]\(https:\/\/www\.anthropic\.com\/research\/building-effective-agents\)/);
    expect(out).toMatch(/\[.*\] \[LLM Agent Systems — Comparison Criteria & Existing Taxonomies\]/);
    expect(out).toMatch(/\[.*\] \[Pythia Workflow Mental Model\]/);
    expect(out).toMatch(/pythia-workflow-mental-model\.ctx\.md#/);
  });

  it('reclassifies mistagged external refs (code → url) on sync', () => {
    const ctx = writeDoc('.pythia/ctx/external-refs.ctx.md', `# Context

## References

- [code] [Karpathy's LLM Wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
- [Karpathy gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
`);
    expect(runInputs(['sync', ctx]).status).toBe(0);
    const out = readFileSync(ctx, 'utf8');
    expect(out).toMatch(/\[url\] \[Karpathy's LLM Wiki gist\]\(https:\/\/gist\.github\.com\/karpathy\//);
    expect(out).not.toMatch(/\[code\].*gist\.github\.com/);
  });

  it('addUsedByBacklink preserves bibliography URLs on target', () => {
    writeDoc('.pythia/ctx/target.ctx.md', `# Target Context

## References

- Anthropic, "Agents": https://www.anthropic.com/research/building-effective-agents
`);
    writeDoc(
      wf('contexts/consumer.context.md'),
      '# BMAD-METHOD Deep-Dive\n\nSee [comparison criteria](../../../../ctx/target.ctx.md).\n',
    );
    const consumer = join(root, wf('contexts/consumer.context.md'));
    const target = join(root, '.pythia/ctx/target.ctx.md');
    runInputs(['sync', consumer]);
    const out = readFileSync(target, 'utf8');
    expect(out).toContain('https://www.anthropic.com/research/building-effective-agents');
    expect(out).toMatch(/\[BMAD-METHOD Deep-Dive\]/);
  });

  it('sync drops phantom Used by entries not backed by real rdeps scan', () => {
    // Old behavior: sync would refresh placeholder labels from cache.
    // New behavior: sync rebuilds Used by from rdeps scan — entries with no real backlink are dropped.
    writeDoc('.pythia/ctx/target.ctx.md', `# Target Context

## References

## Used by

- [research] [bmad-method-deep-dive](.pythia/workflows/f/contexts/bmad-method-deep-dive.context.md)
`);
    writeDoc(
      '.pythia/workflows/f/contexts/bmad-method-deep-dive.context.md',
      '# BMAD-METHOD Deep-Dive\n\nBody.\n',
      // Note: this consumer does NOT have target.ctx.md in its ## References → phantom entry
    );
    const target = join(root, '.pythia/ctx/target.ctx.md');
    expect(runInputs(['sync', target]).status).toBe(0);
    const out = readFileSync(target, 'utf8');
    // Phantom entry removed — neither old nor new label appears
    expect(out).not.toMatch(/bmad-method-deep-dive/);
  });

  it('migrateWorkflowInputs does not wipe plain bibliography-only task docs', () => {
    writeDoc('.pythia/workflows/tasks/task-migrate-plain.md', `# Task

## References

- [Rules](../rules/foo.md)
- [External](https://example.com/doc)
`);
    const result = migrateWorkflowInputs(root);
    expect(result.changedPaths).toContain('.pythia/workflows/tasks/task-migrate-plain.md');
    const out = readFileSync(join(root, '.pythia/workflows/tasks/task-migrate-plain.md'), 'utf8');
    expect(out).not.toContain('../rules/foo.md');
    expect(out).toContain('https://example.com/doc');
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

  it('task doc with missing hashed ref exits 0 (bibliography-tolerant)', () => {
    const task = writeDoc('.pythia/workflows/tasks/task-check.md', `# Task

## References

- [doc] [gone](../navigation/gone.md#abc12)
`);
    expect(runInputs(['check', task]).status).toBe(0);
  });

  it('context doc with missing hashed ref exits 1 (strict freshness)', () => {
    const ctx = writeDoc(wf('contexts/strict.context.md'), `# Context

## References

- [code] [inputs.sh](scripts/inputs.sh#ca69a)
`);
    expect(runInputs(['check', ctx]).status).toBe(1);
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

describe('sync: phantom Used by removal', () => {
  it('removes phantom Used by entries that have no real ## References backlink on sync', () => {
    const ctx = writeDoc(wf('contexts/ctx.context.md'), `# Context

Body.

## Used by

- [plan] [Ghost Plan](../plans/ghost.plan.md)
`);
    // ghost.plan.md does not exist and has no ## References pointing back
    runInputs(['sync', ctx]);
    const out = readFileSync(ctx, 'utf8');
    const parsed = parseTrailingRefs(out);
    // phantom entry must be gone after sync
    expect(parsed?.usedBy?.some((u) => u.path.includes('ghost'))).toBe(false);
  });

  it('keeps legitimate Used by entry added by real consumer sync', () => {
    const ctx = writeDoc(wf('contexts/ctx.context.md'), '# Context\n\nBody.\n');
    const plan = writeDoc(wf('plans/real.plan.md'), '# Plan\n\n[ctx](../contexts/ctx.context.md)\n');
    // Sync plan first → adds Used by backlink to ctx
    runInputs(['sync', plan]);
    const parsed1 = parseTrailingRefs(readFileSync(ctx, 'utf8'));
    expect(parsed1?.usedBy?.some((u) => u.path.includes('real.plan'))).toBe(true);

    // Now sync ctx itself — the legitimate Used by must survive
    runInputs(['sync', ctx]);
    const parsed2 = parseTrailingRefs(readFileSync(ctx, 'utf8'));
    expect(parsed2?.usedBy?.some((u) => u.path.includes('real.plan'))).toBe(true);
  });

  it('removes stale Used by entry after consumer stops referencing the file', () => {
    const ctx = writeDoc(wf('contexts/ctx.context.md'), '# Context\n\nBody.\n');
    const plan = writeDoc(wf('plans/real.plan.md'), '# Plan\n\n[ctx](../contexts/ctx.context.md)\n');
    runInputs(['sync', plan]);
    // Verify backlink exists
    expect(parseTrailingRefs(readFileSync(ctx, 'utf8'))?.usedBy?.length).toBeGreaterThan(0);

    // Consumer removes the link and re-syncs
    writeFileSync(plan, '# Plan\n\nNo links now.\n');
    runInputs(['sync', plan]);

    // Sync ctx — stale Used by must be gone
    runInputs(['sync', ctx]);
    const parsed = parseTrailingRefs(readFileSync(ctx, 'utf8'));
    expect(parsed?.usedBy?.some((u) => u.path.includes('real.plan'))).toBeFalsy();
  });
});
