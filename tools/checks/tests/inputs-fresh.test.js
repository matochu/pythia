import { describe, it, expect, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, cpSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const inputsFreshSrc = resolve('tools/checks/inputs-fresh.js');

import { seedPythiaProjectRegistration } from '../../cli/tests/helpers/workflow-paths.js';

let root;

afterEach(() => {
  if (root) rmSync(root, { recursive: true, force: true });
  root = undefined;
});

function materializeRuntime({ withInputs = true } = {}) {
  const runtimeDir = join(root, '.pythia/runtime');
  mkdirSync(join(runtimeDir, 'checks'), { recursive: true });
  mkdirSync(join(runtimeDir, 'lib'), { recursive: true });
  cpSync(resolve('tools/lib/references'), join(runtimeDir, 'lib/references'), { recursive: true });
  for (const f of ['refs.js', 'md.js', 'inputs-core.js', 'repo-root.js']) {
    cpSync(resolve(`tools/lib/${f}`), join(runtimeDir, 'lib', f));
  }
  if (withInputs) {
    writeFileSync(
      join(runtimeDir, 'inputs.js'),
      "#!/usr/bin/env node\nimport { main } from './lib/inputs-core.js';\nmain();\n",
      'utf8',
    );
  }
  cpSync(inputsFreshSrc, join(runtimeDir, 'checks/inputs-fresh.js'));
}

function runInputsFresh(docPath) {
  const checker = join(root, '.pythia/runtime/checks/inputs-fresh.js');
  return spawnSync(process.execPath, [checker, docPath], {
    encoding: 'utf8',
    cwd: root,
  });
}

function seedPythiaProject(target) {
  seedPythiaProjectRegistration(target);
}

describe('inputs-fresh.js', () => {
  it('error message references .pythia/runtime/inputs.js on stale references', () => {
    root = mkdtempSync(join(tmpdir(), 'pythia-inputs-fresh-'));
    seedPythiaProject(root);

    const dep = join(root, '.pythia/dep.md');
    writeFileSync(dep, 'grounding\n', 'utf8');
    const doc = join(root, '.pythia/x.context.md');
    writeFileSync(
      doc,
      `# Context

## References

- [doc] [dep](./dep.md#00000)
`,
      'utf8',
    );

    materializeRuntime();

    const r = runInputsFresh(doc);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/\.pythia\/runtime\/inputs\.js sync/);
    expect(r.stderr).not.toMatch(/scripts\/inputs\.js/);
  });

  it('exits 0 when inputs.js is missing (hook-safe skip)', () => {
    root = mkdtempSync(join(tmpdir(), 'pythia-inputs-fresh-skip-'));
    const doc = join(root, 'x.context.md');
    writeFileSync(doc, '# Context\n', 'utf8');
    materializeRuntime({ withInputs: false });

    const r = runInputsFresh(doc);
    expect(r.status).toBe(0);
    expect(r.stderr).toBe('');
  });

  it('exits 0 when document declares no references', () => {
    root = mkdtempSync(join(tmpdir(), 'pythia-inputs-fresh-none-'));
    spawnSync('git', ['init', root], { encoding: 'utf8' });
    const doc = join(root, 'plain.md');
    writeFileSync(doc, '# No references\n', 'utf8');

    materializeRuntime();

    const r = runInputsFresh(doc);
    expect(r.status).toBe(0);
    expect(r.stderr).toBe('');
  });
});
