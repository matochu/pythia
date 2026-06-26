import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { projectRoot, pythiaWorkspaceDir, repoRoot, normalizePath } from './repo-root.js';
import { cmdSync, hashFile, repoRoot as inputsRepoRoot } from './references/inputs-core.js';
import { parseTrailingRefs } from './references/refs.js';
import { seedPythiaProjectRegistration } from '../cli/tests/helpers/workflow-paths.js';

let project;

beforeEach(() => {
  project = mkdtempSync(join(tmpdir(), 'pythia-project-root-'));
});

afterEach(() => {
  rmSync(project, { recursive: true, force: true });
});

describe('projectRoot / pythiaWorkspaceDir', () => {
  it('resolves project root from workflow doc via manifest (no project git)', () => {
    seedPythiaProjectRegistration(project);
    mkdirSync(join(project, '.pythia/workflows/f/plans'), { recursive: true });
    spawnSync('git', ['init', join(project, '.pythia')], { encoding: 'utf8' });
    const plan = join(project, '.pythia/workflows/f/plans/p.plan.md');
    writeFileSync(plan, '# Plan\n');

    expect(normalizePath(projectRoot(plan))).toBe(normalizePath(project));
    expect(normalizePath(pythiaWorkspaceDir(plan))).toBe(normalizePath(join(project, '.pythia')));
    expect(normalizePath(repoRoot(plan))).toBe(normalizePath(project));
  });

  it('throws when no .pythia registration exists', () => {
    const orphan = join(project, 'orphan.md');
    writeFileSync(orphan, '# Orphan\n');
    expect(() => projectRoot(orphan)).toThrow(/manifest\.json/);
  });

  it('inputs-core repoRoot throws when process.exit is mocked', () => {
    const orphan = join(project, 'orphan.md');
    writeFileSync(orphan, '# Orphan\n');
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
    try {
      expect(() => inputsRepoRoot(orphan)).toThrow(/manifest\.json/);
    } finally {
      exitSpy.mockRestore();
    }
  });
});

describe('inputs sync — project root without project git', () => {
  it('syncs .pythia workflow doc when only .pythia/.git exists', () => {
    seedPythiaProjectRegistration(project);
    mkdirSync(join(project, '.pythia/workflows/f/plans'), { recursive: true });
    mkdirSync(join(project, 'skills/plan'), { recursive: true });
    writeFileSync(join(project, 'skills/plan/SKILL.md'), '# Plan skill\n', 'utf8');
    spawnSync('git', ['init', join(project, '.pythia')], { encoding: 'utf8' });

    const plan = join(project, '.pythia/workflows/f/plans/p.plan.md');
    writeFileSync(plan, '# Plan\n\nSee [skill](../../../../skills/plan/SKILL.md).\n');

    expect(cmdSync(plan)).toBe(0);
    const parsed = parseTrailingRefs(readFileSync(plan, 'utf8'));
    expect(parsed?.references?.[0]?.path).toBe('/skills/plan/SKILL.md');
    expect(parsed?.references?.[0]?.hash).toBe(hashFile(join(project, 'skills/plan/SKILL.md')));
  });
});
