/**
 * Integration: post.js routes edits to checkers and workflow nudges.
 */
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, cpSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const hookDir = resolve(fileURLToPath(import.meta.url), '..');
const postJs = join(hookDir, '..', 'post.js');
const packageRoot = resolve(hookDir, '../../..');
const validPlan = join(packageRoot, 'tools/fixtures/workflow-docs/valid/min.valid.plan.md');
const invalidPlan = join(packageRoot, 'tools/fixtures/workflow-docs/invalid/bad-round.plan.md');

function runPost(filePath) {
  const event = {
    tool_name: 'Edit',
    tool_input: { file_path: filePath },
    cwd: packageRoot,
  };
  return spawnSync(process.execPath, [postJs], {
    input: JSON.stringify(event),
    encoding: 'utf8',
    cwd: packageRoot,
  });
}

describe('post.js', () => {
  it('emits plan nudge for production .pythia/workflows/features/.../plans/ path', () => {
    const root = mkdtempSync(join(tmpdir(), 'pythia-post-prod-'));
    try {
      const featureDir = join(
        root,
        '.pythia',
        'workflows',
        'features',
        'feat-2026-test',
      );
      const plans = join(featureDir, 'plans');
      mkdirSync(plans, { recursive: true });
      const planPath = join(plans, '1-min-valid.plan.md');
      cpSync(validPlan, planPath);
      writeFileSync(planPath, readFileSync(planPath) + '\n', 'utf8');

      const r = runPost(planPath);
      expect(r.status).toBe(0);
      expect(r.stderr).toMatch(/pythia-nudge:.*\/review/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('exits 0 and emits plan nudge on .plan.md edit', () => {
    const root = mkdtempSync(join(tmpdir(), 'pythia-post-'));
    try {
      const plans = join(root, 'plans');
      mkdirSync(plans, { recursive: true });
      const planPath = join(plans, 'min-valid.plan.md');
      cpSync(validPlan, planPath);
      writeFileSync(planPath, readFileSync(planPath) + '\n', 'utf8');

      const r = runPost(planPath);
      expect(r.status).toBe(0);
      expect(r.stderr).toMatch(/pythia-nudge:.*\/review/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('warns via doc-structure on invalid plan edit but still exits 0', () => {
    const root = mkdtempSync(join(tmpdir(), 'pythia-post-invalid-plan-'));
    try {
      const plans = join(root, 'plans');
      mkdirSync(plans, { recursive: true });
      const planPath = join(plans, 'bad-round.plan.md');
      cpSync(invalidPlan, planPath);

      const r = runPost(planPath);
      expect(r.status).toBe(0);
      expect(r.stderr).toMatch(/revision_log\.round_tokens/);
      expect(r.stderr).toMatch(/pythia-nudge/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('runs doc-structure checker on review edit (warn or pass)', () => {
    const root = mkdtempSync(join(tmpdir(), 'pythia-post-review-'));
    try {
      const reports = join(root, 'reports');
      mkdirSync(reports, { recursive: true });
      const reviewPath = join(reports, 'x.review.md');
      cpSync(
        join(packageRoot, 'tools/fixtures/workflow-docs/valid/min.valid.review.md'),
        reviewPath,
      );

      const r = runPost(reviewPath);
      expect(r.status).toBe(0);
      // READY fixture without implementation → implement nudge
      expect(r.stderr).toMatch(/pythia-nudge/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('ignores non-workflow paths without nudge', () => {
    const root = mkdtempSync(join(tmpdir(), 'pythia-post-other-'));
    try {
      const f = join(root, 'readme.md');
      writeFileSync(f, '# hi\n', 'utf8');
      const r = runPost(f);
      expect(r.status).toBe(0);
      expect(r.stderr).not.toMatch(/pythia-nudge/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
