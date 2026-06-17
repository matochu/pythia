import { describe, it, expect, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, cpSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const inputsFreshSrc = resolve('tools/checks/inputs-fresh.js');
const inputsSrc = resolve('tools/bin/inputs.js');

let root;

afterEach(() => {
  if (root) rmSync(root, { recursive: true, force: true });
  root = undefined;
});

function runInputsFresh(docPath) {
  const checker = join(root, '.pythia/runtime/checks/inputs-fresh.js');
  return spawnSync(process.execPath, [checker, docPath], {
    encoding: 'utf8',
    cwd: root,
  });
}

describe('inputs-fresh.js', () => {
  it('error message references .pythia/runtime/inputs.js on stale inputs', () => {
    root = mkdtempSync(join(tmpdir(), 'pythia-inputs-fresh-'));
    spawnSync('git', ['init', root], { encoding: 'utf8' });
    spawnSync('git', ['-C', root, 'config', 'user.email', 'test@test.com'], { encoding: 'utf8' });
    spawnSync('git', ['-C', root, 'config', 'user.name', 'Test'], { encoding: 'utf8' });

    const dep = join(root, 'dep.md');
    writeFileSync(dep, 'grounding\n', 'utf8');
    const doc = join(root, 'x.context.md');
    writeFileSync(
      doc,
      `---
inputs:
  - dep.md:00000000
---
# Context
`,
      'utf8',
    );

    const runtimeDir = join(root, '.pythia/runtime');
    mkdirSync(join(runtimeDir, 'checks'), { recursive: true });
    cpSync(inputsSrc, join(runtimeDir, 'inputs.js'));
    cpSync(inputsFreshSrc, join(runtimeDir, 'checks/inputs-fresh.js'));

    const r = runInputsFresh(doc);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/\.pythia\/runtime\/inputs\.js/);
    expect(r.stderr).not.toMatch(/scripts\/inputs\.js/);
  });

  it('exits 0 when inputs.js is missing (hook-safe skip)', () => {
    root = mkdtempSync(join(tmpdir(), 'pythia-inputs-fresh-skip-'));
    const doc = join(root, 'x.context.md');
    writeFileSync(doc, '# Context\n', 'utf8');
    mkdirSync(join(root, '.pythia/runtime/checks'), { recursive: true });
    cpSync(inputsFreshSrc, join(root, '.pythia/runtime/checks/inputs-fresh.js'));

    const r = runInputsFresh(doc);
    expect(r.status).toBe(0);
    expect(r.stderr).toBe('');
  });

  it('exits 0 when document declares no inputs', () => {
    root = mkdtempSync(join(tmpdir(), 'pythia-inputs-fresh-none-'));
    const doc = join(root, 'plain.md');
    writeFileSync(doc, '# No frontmatter inputs\n', 'utf8');

    const runtimeDir = join(root, '.pythia/runtime');
    mkdirSync(join(runtimeDir, 'checks'), { recursive: true });
    cpSync(inputsSrc, join(runtimeDir, 'inputs.js'));
    cpSync(inputsFreshSrc, join(runtimeDir, 'checks/inputs-fresh.js'));

    const r = runInputsFresh(doc);
    expect(r.status).toBe(0);
    expect(r.stderr).toBe('');
  });
});
