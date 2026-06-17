import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const hook = resolve('tools/hooks/pre.js');

function run(event) {
  const r = spawnSync(process.execPath, [hook], {
    input: JSON.stringify(event),
    encoding: 'utf8',
  });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}

describe('pre.js — shell-redirect DENY', () => {
  it('shell redirect into .pythia/workflows path → exit 1 + deny output', () => {
    const event = {
      tool_name: 'Bash',
      tool_input: { command: 'echo "content" > .pythia/workflows/features/test.plan.md' },
    };
    const r = run(event);
    expect(r.code).toBe(1);
    expect(r.stdout).toMatch(/deny/);
  });

  it('normal bash command (no redirect) → exit 0', () => {
    const event = {
      tool_name: 'Bash',
      tool_input: { command: 'echo hello' },
    };
    expect(run(event).code).toBe(0);
  });
});

describe('pre.js — apply_patch event (Codex)', () => {
  it('apply_patch to a non-protected path → exit 0', () => {
    const patch = `--- a/src/cli/workspace.js\n+++ b/src/cli/workspace.js\n@@ -1,1 +1,1 @@\n-old\n+new\n`;
    const event = {
      tool_name: 'apply_patch',
      tool_input: { patch },
    };
    expect(run(event).code).toBe(0);
  });
});

describe('pre.js — generated cache separator guard', () => {
  // Zone entry: ".claude/skills" must NOT match "skills/plan" or "other/skills"
  // but MUST match ".claude/skills/plan/SKILL.md" and "path/to/.claude/skills"

  it('Edit to .claude/skills/plan/SKILL.md → warns (generated cache exact prefix)', () => {
    const event = {
      tool_name: 'Edit',
      tool_input: { file_path: '.claude/skills/plan/SKILL.md' },
    };
    const r = run(event);
    expect(r.stderr).toMatch(/generated cache/i);
  });

  it('Edit to skills/plan/SKILL.md → no generated-cache warn (source dir, not cache)', () => {
    const event = {
      tool_name: 'Edit',
      tool_input: { file_path: 'skills/plan/SKILL.md' },
    };
    const r = run(event);
    expect(r.stderr).not.toMatch(/generated cache/i);
  });

  it('Edit to some/nested/.claude/skills/foo → warns (suffix match)', () => {
    const event = {
      tool_name: 'Edit',
      tool_input: { file_path: 'some/nested/.claude/skills/foo.md' },
    };
    const r = run(event);
    expect(r.stderr).toMatch(/generated cache/i);
  });

  it('Edit to .agents/skills/plan/SKILL.md → warns (generated cache)', () => {
    const event = {
      tool_name: 'Edit',
      tool_input: { file_path: '.agents/skills/plan/SKILL.md' },
    };
    const r = run(event);
    expect(r.stderr).toMatch(/generated cache/i);
  });

  it('Edit to my-agents/skills/plan → no warn (not a generated cache zone path)', () => {
    const event = {
      tool_name: 'Edit',
      tool_input: { file_path: 'my-agents/skills/plan/SKILL.md' },
    };
    const r = run(event);
    expect(r.stderr).not.toMatch(/generated cache/i);
  });
});

describe('pre.js — role-boundary warn (not DENY)', () => {
  it('Edit to *.review.md → exit 0 (warn only, not DENY)', () => {
    const event = {
      tool_name: 'Edit',
      tool_input: { file_path: 'reports/3-foo.review.md' },
    };
    const r = run(event);
    // Must not deny (exit 0 from hook perspective since DENY would be exit 1 + deny JSON)
    // The hook should warn but exit 0 (role-boundary is warn-only)
    expect(r.code).toBe(0);
  });
});
