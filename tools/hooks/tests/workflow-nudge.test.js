/**
 * Integration: workflow-nudge.js emits computeWorkflowNudges messages.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { nudge } from '../workflow-nudge.js';

let root;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'pythia-nudge-'));
  mkdirSync(join(root, 'plans'), { recursive: true });
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('workflow-nudge.js', () => {
  it('prints pythia-nudge for new plan', () => {
    const plan = join(root, 'plans', 'x.plan.md');
    writeFileSync(plan, '# plan\n', 'utf8');
    const errors = [];
    const spy = vi.spyOn(console, 'error').mockImplementation((msg) => errors.push(String(msg)));
    try {
      nudge(plan);
    } finally {
      spy.mockRestore();
    }
    expect(errors.some((e) => /pythia-nudge:.*\/review/.test(e))).toBe(true);
  });
});
