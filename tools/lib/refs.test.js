import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { kindForPath, isPythiaSyncMarkdownRelPath, usedByLinksToConsumer, resolveDocLink, parseTrailingRefs, isExternalBibliographyHref, normalizeBibliographyPath, defaultRefText, splitBodyAndRegion, extractBibliographyFromTrail } from './references/refs.js';
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
    expect(kindForPath('feat-2026-05-bmad-adaptations.retro.md')).toBe('retro');
    expect(kindForPath('.pythia/workflows/f/notes/x.md')).toBe('note');
  });

  it('classifies skills/*/SKILL.md as skill (not doc)', () => {
    expect(kindForPath('skills/workflow/SKILL.md')).toBe('skill');
    expect(kindForPath('.claude/skills/plan/SKILL.md')).toBe('skill');
    expect(kindForPath('.agents/skills/research/SKILL.md')).toBe('skill');
  });

  it('defaultRefText uses skill folder name and artifact stems', () => {
    expect(defaultRefText('skills/workflow/SKILL.md')).toBe('workflow');
    expect(defaultRefText('feat-2026-05-bmad-adaptations.retro.md')).toBe('feat-2026-05-bmad-adaptations');
    expect(defaultRefText('1-cross-links.plan.md')).toBe('1-cross-links');
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

  it('maps external https hrefs to url, not code', () => {
    expect(kindForPath('https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f')).toBe('url');
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

describe('splitBodyAndRegion', () => {
  it('uses last ## References as trailing freshness footer', () => {
    const content = `# Doc

## References

Manual mid-body bibliography.

- [a](./a.md)

## Analysis

More prose.

## References

- [doc] [b](./b.md#abc12)
`;
    const { bodyLines, references } = splitBodyAndRegion(content);
    const body = bodyLines.join('\n');
    expect(body).toContain('Manual mid-body bibliography');
    expect(body).toContain('## Analysis');
    expect(references).toHaveLength(1);
    expect(references[0].path).toBe('./b.md');
  });
});

describe('isPythiaSyncMarkdownRelPath', () => {
  it('includes .pythia markdown except runtime, config, backups, README', () => {
    expect(isPythiaSyncMarkdownRelPath('.pythia/workflows/a.plan.md')).toBe(true);
    expect(isPythiaSyncMarkdownRelPath('.pythia/workflows/f/notes/x.md')).toBe(true);
    expect(isPythiaSyncMarkdownRelPath('.pythia/config/settings.md')).toBe(false);
    expect(isPythiaSyncMarkdownRelPath('.pythia/config/paths.md')).toBe(false);
    expect(isPythiaSyncMarkdownRelPath('.pythia/README.md')).toBe(false);
    expect(isPythiaSyncMarkdownRelPath('.pythia/workflows/ideas/README.md')).toBe(false);
    expect(isPythiaSyncMarkdownRelPath('.pythia/backups/0.3.3/x.md')).toBe(false);
    expect(isPythiaSyncMarkdownRelPath('.pythia/runtime/x.md')).toBe(false);
    expect(isPythiaSyncMarkdownRelPath('docs/x.md')).toBe(false);
    expect(isPythiaSyncMarkdownRelPath('.pythia/workflows/x.js')).toBe(false);
  });
});

describe('parseTrailingRefs bibliography', () => {
  it('parses plain `- [label](path)` lines and region trail prose', () => {
    const content = `# Task

## References

Links to related docs.

- [Workflows](../workflows/report.md)
- [Jira](https://example.atlassian.net/browse/INT-291)

---
**Last Updated**: 2025-07-01
`;
    const parsed = parseTrailingRefs(content);
    expect(parsed?.references).toHaveLength(2);
    expect(parsed?.references?.[0]?.path).toBe('../workflows/report.md');
    expect(parsed?.references?.[1]?.path).toBe('https://example.atlassian.net/browse/INT-291');
    expect(parsed?.regionTrail).toContain('Links to related docs.');
    expect(parsed?.regionTrail.some((l) => l.includes('Last Updated'))).toBe(true);
  });

  it('normalizes mdc: href prefix', () => {
    expect(normalizeBibliographyPath('mdc:skills/plan/SKILL.md')).toBe('skills/plan/SKILL.md');
  });

  it('detects external bibliography hrefs', () => {
    expect(isExternalBibliographyHref('https://jira.example/browse/X')).toBe(true);
    expect(isExternalBibliographyHref('../rules/foo.md')).toBe(false);
  });

  it('parses `- Label: [title](path)` and `- Label: https://` bibliography lines', () => {
    const content = `# Context

## References

- Feature research: [Comparison Criteria](../workflows/f/contexts/criteria.context.md)
- Anthropic, "Building Effective AI Agents": https://www.anthropic.com/research/building-effective-agents
`;
    const parsed = parseTrailingRefs(content);
    expect(parsed?.references).toHaveLength(2);
    expect(parsed?.references?.[0]?.text).toBe('Comparison Criteria');
    expect(parsed?.references?.[1]?.text).toContain('Anthropic');
    expect(parsed?.references?.[1]?.kind).toBe('url');
    expect(parsed?.references?.[1]?.path).toContain('anthropic.com');
  });

  it('parses plain link with em dash trailing prose', () => {
    const { external } = extractBibliographyFromTrail([
      '- [llmwiki](https://github.com/lucasastorian/llmwiki) — open source wiki',
    ]);
    expect(external).toHaveLength(1);
    expect(external[0].text).toBe('llmwiki');
    expect(external[0].path).toContain('github.com/lucasastorian/llmwiki');
    expect(external[0].kind).toBe('url');
  });

  it('parses period-before-URL bibliography lines', () => {
    const { external } = extractBibliographyFromTrail([
      '- BMAD-METHOD repo. https://github.com/bmad-code-org/BMAD-METHOD',
    ]);
    expect(external).toHaveLength(1);
    expect(external[0].text).toBe('BMAD-METHOD repo');
    expect(external[0].path).toContain('github.com/bmad-code-org/BMAD-METHOD');
  });

  it('parses academic quoted-title URL lines', () => {
    const { external } = extractBibliographyFromTrail([
      '- buildmode.dev. "BMad Method in Action: Your Complete Implementation Guide (Part 2)." https://buildmode.dev/blog/mastering-bmad-method-2025/',
    ]);
    expect(external).toHaveLength(1);
    expect(external[0].text).toBe('BMad Method in Action: Your Complete Implementation Guide (Part 2).');
  });

  it('parses period-before-link bibliography lines', () => {
    const { internal } = extractBibliographyFromTrail([
      '- Pythia comparison framework. [criteria.context.md](llm-agent-systems-comparison-criteria.context.md)',
    ]);
    expect(internal).toHaveLength(1);
    expect(internal[0].text).toBe('criteria.context.md');
    expect(internal[0].path).toBe('llm-agent-systems-comparison-criteria.context.md');
  });
});
