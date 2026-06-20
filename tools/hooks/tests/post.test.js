/**
 * Integration: post.js routes edits to checkers and workflow nudges.
 * Uses isolated tmp git workspaces — not the pythia dev repo paths.md.
 */
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, cpSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { matchGlob } from '../post.js';
import { pathsMdContent } from '../../cli/tests/helpers/paths-md.js';
import { freshInstalledWorkspace } from '../../cli/tests/helpers/workspace.js';

const hookDir = resolve(fileURLToPath(import.meta.url), '..');
const postJs = join(hookDir, '..', 'post.js');
const packageRoot = resolve(hookDir, '../../..');
const validPlan = join(packageRoot, 'tools/fixtures/workflow-docs/valid/min.valid.plan.md');
const invalidPlan = join(packageRoot, 'tools/fixtures/workflow-docs/invalid/bad-round.plan.md');

function initGit(dir) {
  spawnSync('git', ['init', dir], { encoding: 'utf8' });
  spawnSync('git', ['-C', dir, 'config', 'user.email', 'test@test.com'], { encoding: 'utf8' });
  spawnSync('git', ['-C', dir, 'config', 'user.name', 'Test'], { encoding: 'utf8' });
}

/** Tmp git repo; optional paths.md variant: new | old | absent */
function makeHookRoot(prefix, pathsVariant = 'new') {
  const root = mkdtempSync(join(tmpdir(), prefix));
  initGit(root);
  if (pathsVariant !== 'absent') {
    mkdirSync(join(root, '.pythia', 'config'), { recursive: true });
    writeFileSync(join(root, '.pythia', 'config', 'paths.md'), pathsMdContent(pathsVariant), 'utf8');
  }
  return root;
}

function runPost(filePath, cwd, postScript = postJs) {
  const event = {
    tool_name: 'Edit',
    tool_input: { file_path: filePath },
    cwd,
  };
  return spawnSync(process.execPath, [postScript], {
    input: JSON.stringify(event),
    encoding: 'utf8',
    cwd: packageRoot,
  });
}

describe('post.js', () => {
  it('emits plan nudge for production .pythia/workflows/features/.../plans/ path', () => {
    const root = makeHookRoot('pythia-post-prod-');
    try {
      const featureDir = join(root, '.pythia', 'workflows', 'features', 'feat-2026-test');
      const plans = join(featureDir, 'plans');
      mkdirSync(plans, { recursive: true });
      const planPath = join(plans, '1-min-valid.plan.md');
      cpSync(validPlan, planPath);
      writeFileSync(planPath, readFileSync(planPath) + '\n', 'utf8');

      const r = runPost(planPath, root);
      expect(r.status).toBe(0);
      expect(r.stderr).toMatch(/pythia-nudge:.*\/review/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('exits 0 and emits plan nudge on .plan.md edit', () => {
    const root = makeHookRoot('pythia-post-');
    try {
      const plans = join(root, 'plans');
      mkdirSync(plans, { recursive: true });
      const planPath = join(plans, 'min-valid.plan.md');
      cpSync(validPlan, planPath);
      writeFileSync(planPath, readFileSync(planPath) + '\n', 'utf8');

      const r = runPost(planPath, root);
      expect(r.status).toBe(0);
      expect(r.stderr).toMatch(/pythia-nudge:.*\/review/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('resolves relative file_path against event cwd when hook process cwd differs', () => {
    const root = makeHookRoot('pythia-post-rel-');
    try {
      const plans = join(root, 'plans');
      mkdirSync(plans, { recursive: true });
      const planPath = join(plans, 'min-valid.plan.md');
      cpSync(validPlan, planPath);
      writeFileSync(planPath, readFileSync(planPath) + '\n', 'utf8');

      const event = {
        tool_name: 'Edit',
        tool_input: { file_path: 'plans/min-valid.plan.md' },
        cwd: root,
      };
      const r = spawnSync(process.execPath, [postJs], {
        input: JSON.stringify(event),
        encoding: 'utf8',
        cwd: packageRoot,
      });
      expect(r.status).toBe(0);
      expect(r.stderr).toMatch(/pythia-nudge/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('warns via doc-structure on invalid plan edit but still exits 0', () => {
    const root = makeHookRoot('pythia-post-invalid-plan-');
    try {
      const plans = join(root, 'plans');
      mkdirSync(plans, { recursive: true });
      const planPath = join(plans, 'bad-round.plan.md');
      cpSync(invalidPlan, planPath);

      const r = runPost(planPath, root);
      expect(r.status).toBe(0);
      expect(r.stderr).toMatch(/revision_log\.round_tokens/);
      expect(r.stderr).toMatch(/pythia-nudge/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('runs doc-structure checker on review edit (warn or pass)', () => {
    const root = makeHookRoot('pythia-post-review-');
    try {
      const reports = join(root, 'reports');
      mkdirSync(reports, { recursive: true });
      const reviewPath = join(reports, 'x.review.md');
      cpSync(
        join(packageRoot, 'tools/fixtures/workflow-docs/valid/min.valid.review.md'),
        reviewPath,
      );

      const r = runPost(reviewPath, root);
      expect(r.status).toBe(0);
      expect(r.stderr).toMatch(/pythia-nudge/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('ignores non-workflow paths without nudge', () => {
    const root = makeHookRoot('pythia-post-other-');
    try {
      const f = join(root, 'readme.md');
      writeFileSync(f, '# hi\n', 'utf8');
      const r = runPost(f, root);
      expect(r.status).toBe(0);
      expect(r.stderr).not.toMatch(/pythia-nudge/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('matchGlob', () => {
  it('matches suffix patterns (*.plan.md)', () => {
    expect(matchGlob('foo.plan.md', '*.plan.md')).toBe(true);
    expect(matchGlob('readme.md', '*.plan.md')).toBe(false);
  });

  it('matches prefix+suffix patterns (feat-*.md)', () => {
    expect(matchGlob('feat-2026-test.md', 'feat-*.md')).toBe(true);
    expect(matchGlob('feature.md', 'feat-*.md')).toBe(false);
  });

  it('matches exact names', () => {
    expect(matchGlob('SKILL.md', 'SKILL.md')).toBe(true);
    expect(matchGlob('other.md', 'SKILL.md')).toBe(false);
  });
});

describe('post.js workflow checker routing', () => {
  it('warns via links.js on .context.md with broken link', () => {
    const root = makeHookRoot('pythia-post-context-');
    try {
      const contexts = join(root, 'contexts');
      mkdirSync(contexts, { recursive: true });
      const path = join(contexts, 'x.context.md');
      writeFileSync(path, '# Context\n\nSee [missing](./no-such.md)\n', 'utf8');
      const r = runPost(path, root);
      expect(r.status).toBe(0);
      expect(r.stderr).toMatch(/\[links\.broken\]/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('warns via links.js on feat-*.md with broken link', () => {
    const root = makeHookRoot('pythia-post-feat-');
    try {
      const features = join(root, 'features');
      mkdirSync(features, { recursive: true });
      const path = join(features, 'feat-2026-test.md');
      writeFileSync(path, '# Feature\n\n[broken](./missing.md)\n', 'utf8');
      const r = runPost(path, root);
      expect(r.status).toBe(0);
      expect(r.stderr).toMatch(/\[links\.broken\]/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('warns via links.js on .retro.md with broken link', () => {
    const root = makeHookRoot('pythia-post-retro-');
    try {
      const path = join(root, 'feat.retro.md');
      writeFileSync(path, '# Retro\n\n[broken](./missing.md)\n', 'utf8');
      const r = runPost(path, root);
      expect(r.status).toBe(0);
      expect(r.stderr).toMatch(/\[links\.broken\]/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('warns via role-boundary.js on .review.md edit', () => {
    const root = makeHookRoot('pythia-post-role-');
    try {
      const reports = join(root, 'reports');
      mkdirSync(reports, { recursive: true });
      const reviewPath = join(reports, 'x.review.md');
      cpSync(
        join(packageRoot, 'tools/fixtures/workflow-docs/valid/min.valid.review.md'),
        reviewPath,
      );
      const r = runPost(reviewPath, root);
      expect(r.status).toBe(0);
      expect(r.stderr).toMatch(/role-boundary:/);
      expect(r.stderr).toMatch(/Reviewer/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('legacy paths.md runs doc-structure only (no role-boundary)', () => {
    const root = makeHookRoot('pythia-post-legacy-', 'old');
    try {
      const plans = join(root, 'plans');
      mkdirSync(plans, { recursive: true });
      const planPath = join(plans, 'bad-round.plan.md');
      cpSync(invalidPlan, planPath);
      const r = runPost(planPath, root);
      expect(r.status).toBe(0);
      expect(r.stderr).toMatch(/revision_log\.round_tokens/);
      expect(r.stderr).not.toMatch(/role-boundary:/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('routes via package-asset paths.md when workspace paths.md is absent', () => {
    const root = makeHookRoot('pythia-post-fallback-', 'absent');
    try {
      const plans = join(root, 'plans');
      mkdirSync(plans, { recursive: true });
      const planPath = join(plans, 'bad-round.plan.md');
      cpSync(invalidPlan, planPath);
      const r = runPost(planPath, root);
      expect(r.status).toBe(0);
      expect(r.stderr).toMatch(/revision_log\.round_tokens/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('routes via materialized package-paths.md when workspace paths.md is absent', async () => {
    const root = await freshInstalledWorkspace('pythia-post-mat-');
    try {
      const packagePaths = join(root, '.pythia', 'runtime', 'package-paths.md');
      expect(existsSync(packagePaths)).toBe(true);
      unlinkSync(join(root, '.pythia', 'config', 'paths.md'));

      const runtimePost = join(root, '.pythia', 'runtime', 'hooks', 'post.js');
      const plans = join(root, 'plans');
      mkdirSync(plans, { recursive: true });
      const planPath = join(plans, 'bad-round.plan.md');
      cpSync(invalidPlan, planPath);

      const r = runPost(planPath, root, runtimePost);
      expect(r.status).toBe(0);
      expect(r.stderr).toMatch(/revision_log\.round_tokens/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('runs plan checkers for *.plan.md outside .pythia/workflows/', () => {
    const root = makeHookRoot('pythia-post-outside-wf-');
    try {
      const planPath = join(root, 'docs', 'example.plan.md');
      mkdirSync(dirname(planPath), { recursive: true });
      cpSync(invalidPlan, planPath);
      const r = runPost(planPath, root);
      expect(r.status).toBe(0);
      expect(r.stderr).toMatch(/revision_log\.round_tokens/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('Post-commands dispatch appends edited file path as final argv', () => {
    const root = makeHookRoot('pythia-post-cmd-');
    try {
      const stubDir = join(root, '.pythia/runtime');
      mkdirSync(stubDir, { recursive: true });
      const argvLog = join(root, 'argv.log');
      const stubScript = join(stubDir, 'inputs.js');
      writeFileSync(
        stubScript,
        `import { appendFileSync } from 'node:fs';\nappendFileSync(${JSON.stringify(argvLog)}, process.argv.slice(2).join('|') + '\\n');\n`,
        'utf8',
      );

      const pathsMd = join(root, '.pythia/config/paths.md');
      writeFileSync(
        pathsMd,
        `${readFileSync(pathsMd, 'utf8')}\n## Post-commands\n\n- *.plan.md  command: .pythia/runtime/inputs.js sync\n`,
        'utf8',
      );

      const plans = join(root, 'plans');
      mkdirSync(plans, { recursive: true });
      const planPath = join(plans, 'min-valid.plan.md');
      cpSync(validPlan, planPath);

      const r = runPost(planPath, root);
      expect(r.status).toBe(0);
      const logged = readFileSync(argvLog, 'utf8').trim().split('|');
      expect(logged[0]).toBe('sync');
      expect(logged[logged.length - 1]).toBe(planPath);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
