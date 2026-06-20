import { mkdirSync, writeFileSync, readdirSync, readFileSync, statSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashFile } from '../../../lib/inputs-core.js';
import { featureWorkflowDir, TEST_FEATURE_ID } from './workflow-paths.js';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const validPlanFixture = join(packageRoot, 'tools/fixtures/workflow-docs/valid/min.valid.plan.md');

/**
 * Realistic pre-0.3.6 corpus: legacy inputs, cross-zone links (package.json, skills),
 * feat doc, context with deps — mirrors production migration blast radius.
 */
export function seedInputsFreshnessMigrationCorpus(ws) {
  writeFileSync(join(ws, 'package.json'), JSON.stringify({ name: 'tmp-workspace', version: '1.0.0' }, null, 2), 'utf8');

  const skillDir = join(ws, 'skills', 'plan');
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(join(skillDir, 'SKILL.md'), '# Plan skill\n\nCanonical skill source.\n', 'utf8');

  const featId = TEST_FEATURE_ID;
  const featDir = featureWorkflowDir(ws, featId);
  const ctxDir = join(featDir, 'contexts');
  const plansDir = join(featDir, 'plans');
  mkdirSync(ctxDir, { recursive: true });
  mkdirSync(plansDir, { recursive: true });

  writeFileSync(join(ctxDir, 'dep.md'), 'dep body v1\n', 'utf8');
  const depHash = hashFile(join(ctxDir, 'dep.md'));

  writeFileSync(
    join(ctxDir, 'legacy.context.md'),
    `---
inputs:
  - .pythia/workflows/features/${featId}/contexts/dep.md:${depHash}
---
# Legacy context

Grounded in [dep](./dep.md).
`,
    'utf8',
  );

  writeFileSync(
    join(featDir, `${featId}.md`),
    `# Feature

See [package.json](../../../../package.json) and [plan skill](../../../../skills/plan/SKILL.md).
`,
    'utf8',
  );

  writeFileSync(
    join(plansDir, '1-cross-links.plan.md'),
    `${readFileSync(validPlanFixture, 'utf8').trimEnd()}

Cross-links: [feature](../${featId}.md), [context](../contexts/legacy.context.md), [package.json](../../../../../package.json), [skill](../../../../../skills/plan/SKILL.md).
`,
    'utf8',
  );

  writeFileSync(
    join(ctxDir, 'fence-only.context.md'),
    `# Fence only

\`\`\`md
[ghost](./dep.md)
\`\`\`
`,
    'utf8',
  );

  return {
    featDir,
    legacyContext: join(ctxDir, 'legacy.context.md'),
    featDoc: join(featDir, `${featId}.md`),
    plan: join(plansDir, '1-cross-links.plan.md'),
    fenceOnly: join(ctxDir, 'fence-only.context.md'),
    packageJson: join(ws, 'package.json'),
    skillMd: join(skillDir, 'SKILL.md'),
  };
}

/** Walk workflow markdown tree for legacy frontmatter inputs blocks. */
export function legacyInputsFiles(workflowsDir) {
  const hits = [];
  function walk(dir) {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else if (name.endsWith('.md')) {
        const c = readFileSync(p, 'utf8');
        if (c.startsWith('---\n') && /^---\n[\s\S]*?\ninputs:\n/m.test(c)) hits.push(p);
      }
    }
  }
  walk(workflowsDir);
  return hits;
}

/** True when file content was corrupted by inputs sync appending markdown regions. */
export function hasTrailingRefsCorruption(content) {
  return content.includes('## References') || content.includes('## Used by');
}
