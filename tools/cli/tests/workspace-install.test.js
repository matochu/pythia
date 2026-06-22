/**
 * Integration tests: fresh workspace install → runtime scripts work.
 *
 * Strategy: call doInit + doUpdate on a real tmpdir, then verify that
 * .pythia/runtime/{inputs.js,checks/structure.js} exist and behave
 * correctly when invoked via `node`.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';
import { doInit, doUpdate } from '../workspace.js';
import { initGit, makeOpts, runCli, packageRoot } from './helpers/workspace.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

let workspaceDir;

function sourceMetadataContract() {
  const doc = readFileSync(resolve(packageRoot, 'skills/workflow/references/artifact-metadata.md'), 'utf8');
  const match = doc.match(/```json artifact-metadata-contract\n([\s\S]*?)\n```/);
  if (!match) throw new Error('Missing artifact-metadata-contract JSON block');
  return JSON.parse(match[1]);
}

// Shared workspace: init once, then update once — mirrors real install flow.
beforeAll(async () => {
  workspaceDir = mkdtempSync(join(tmpdir(), 'pythia-ws-install-'));
  initGit(workspaceDir);
  await doInit({ target: workspaceDir, packageRoot, yes: true });
  await doUpdate({ target: workspaceDir, packageRoot, yes: true });
}, 30000);

afterAll(() => {
  if (workspaceDir) rmSync(workspaceDir, { recursive: true, force: true });
}, 30000);

// ── runtime presence ──────────────────────────────────────────────────────────

describe('runtime materialized after install', () => {
  it('has .pythia/runtime/inputs.js', () => {
    expect(existsSync(join(workspaceDir, '.pythia/runtime/inputs.js'))).toBe(true);
  });

  it('has .pythia/runtime/checks/structure.js', () => {
    expect(existsSync(join(workspaceDir, '.pythia/runtime/checks/structure.js'))).toBe(true);
  });

  it('has .pythia/runtime/checks/artifact-metadata.js', () => {
    expect(existsSync(join(workspaceDir, '.pythia/runtime/checks/artifact-metadata.js'))).toBe(true);
  });

  it('has .pythia/runtime/metadata-contract.json (baked at install time)', () => {
    expect(existsSync(join(workspaceDir, '.pythia/runtime/metadata-contract.json'))).toBe(true);
  });

  it('baked metadata-contract.json is valid JSON with schemaVersion', () => {
    const raw = readFileSync(join(workspaceDir, '.pythia/runtime/metadata-contract.json'), 'utf8');
    const parsed = JSON.parse(raw);
    expect(parsed.schemaVersion).toBe('pythia-artifact-v1');
    expect(parsed.artifacts).toBeDefined();
    expect(parsed.universalFields).toBeDefined();
  });

  it('baked metadata-contract.json matches the source reference contract', () => {
    const raw = readFileSync(join(workspaceDir, '.pythia/runtime/metadata-contract.json'), 'utf8');
    expect(JSON.parse(raw)).toEqual(sourceMetadataContract());
  });

  it('has .pythia/runtime/lib/paths.js', () => {
    expect(existsSync(join(workspaceDir, '.pythia/runtime/lib/paths.js'))).toBe(true);
  });

  it('has .pythia/runtime/lib/metadata/parse.js', () => {
    expect(existsSync(join(workspaceDir, '.pythia/runtime/lib/metadata/parse.js'))).toBe(true);
  });

  it('has .pythia/runtime/lib/references modules and compatibility wrappers', () => {
    expect(existsSync(join(workspaceDir, '.pythia/runtime/lib/references/inputs-core.js'))).toBe(true);
    expect(existsSync(join(workspaceDir, '.pythia/runtime/lib/references/refs.js'))).toBe(true);
    expect(existsSync(join(workspaceDir, '.pythia/runtime/lib/inputs-core.js'))).toBe(true);
    expect(existsSync(join(workspaceDir, '.pythia/runtime/lib/refs.js'))).toBe(true);
  });

  it('has .pythia/runtime/hooks/pre.js', () => {
    expect(existsSync(join(workspaceDir, '.pythia/runtime/hooks/pre.js'))).toBe(true);
  });

  it('does not ship session-start or update-check-worker hooks', () => {
    expect(existsSync(join(workspaceDir, '.pythia/runtime/hooks/session-start.js'))).toBe(false);
    expect(existsSync(join(workspaceDir, '.pythia/runtime/hooks/update-check-worker.js'))).toBe(false);
  });

  it('has .pythia/runtime/migrate/apply.js', () => {
    expect(existsSync(join(workspaceDir, '.pythia/runtime/migrate/apply.js'))).toBe(true);
  });

  it('has .pythia/.gitignore excluding runtime/', () => {
    const gi = join(workspaceDir, '.pythia/.gitignore');
    expect(existsSync(gi)).toBe(true);
    expect(readFileSync(gi, 'utf8')).toMatch(/runtime\//);
  });
});

// ── inputs.js via runtime path ────────────────────────────────────────────────

describe('.pythia/runtime/inputs.js', () => {
  const inputsScript = (ws) => join(ws, '.pythia/runtime/inputs.js');

  it('exits 2 with usage when no args', () => {
    const r = spawnSync('node', [inputsScript(workspaceDir)], { encoding: 'utf8' });
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/Usage/);
  });

  it('check: reports no inputs for file without frontmatter', () => {
    const f = join(workspaceDir, 'no-fm.md');
    writeFileSync(f, '# Hello\n', 'utf8');
    const r = spawnSync('node', [inputsScript(workspaceDir), 'check', f], {
      encoding: 'utf8',
      cwd: workspaceDir,
    });
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/no inputs declared|SKIP \(no ## References\)/);
  });

  it('add: records a dependency and stamps its hash', () => {
    // create target doc with frontmatter
    const doc = join(workspaceDir, 'test-doc.md');
    writeFileSync(doc, '---\nname: test\n---\n# Doc\n', 'utf8');
    // create a dependency file
    const dep = join(workspaceDir, 'dep.md');
    writeFileSync(dep, '# Dep\n', 'utf8');

    const r = spawnSync('node', [inputsScript(workspaceDir), 'add', 'test-doc.md', 'dep.md'], {
      encoding: 'utf8',
      cwd: workspaceDir,
    });
    expect(r.status).toBe(0);

    const updated = readFileSync(doc, 'utf8');
    expect(updated).toMatch(/inputs:/);
    expect(updated).toMatch(/dep\.md:[0-9a-f]{8}/);
  });

  it('add: exits non-zero and prints raw error when dep not found', () => {
    const doc = join(workspaceDir, 'test-doc2.md');
    writeFileSync(doc, '---\nname: test2\n---\n# Doc\n', 'utf8');

    const r = spawnSync('node', [inputsScript(workspaceDir), 'add', 'test-doc2.md', 'nonexistent.md'], {
      encoding: 'utf8',
      cwd: workspaceDir,
    });
    expect(r.status).not.toBe(0);
    expect(r.stderr).toMatch(/nonexistent\.md/);
  });

  it('update: refreshes stale hash after dep changes', () => {
    const doc = join(workspaceDir, 'stamped.md');
    const dep = join(workspaceDir, 'changing-dep.md');
    writeFileSync(dep, '# v1\n', 'utf8');
    writeFileSync(doc, '---\nname: stamped\n---\n# Doc\n', 'utf8');

    // add dep first
    spawnSync('node', [inputsScript(workspaceDir), 'add', 'stamped.md', 'changing-dep.md'], {
      encoding: 'utf8', cwd: workspaceDir,
    });

    // change dep content
    writeFileSync(dep, '# v2\n', 'utf8');

    // check should show STALE
    const checkStale = spawnSync('node', [inputsScript(workspaceDir), 'check', 'stamped.md'], {
      encoding: 'utf8', cwd: workspaceDir,
    });
    expect(checkStale.status).toBe(1);
    expect(checkStale.stdout).toMatch(/STALE/);

    // update should re-stamp
    const r = spawnSync('node', [inputsScript(workspaceDir), 'update', 'stamped.md'], {
      encoding: 'utf8', cwd: workspaceDir,
    });
    expect(r.status).toBe(0);

    // check should now pass
    const checkFresh = spawnSync('node', [inputsScript(workspaceDir), 'check', 'stamped.md'], {
      encoding: 'utf8', cwd: workspaceDir,
    });
    expect(checkFresh.status).toBe(0);
    expect(checkFresh.stdout).not.toMatch(/STALE/);
  });

  it('update: exits non-zero and prints raw error when dep file is missing', () => {
    const doc = join(workspaceDir, 'broken-inputs.md');
    // Manually write frontmatter with a missing dep
    writeFileSync(doc, '---\nname: broken\ninputs:\n  - ghost.md:abcd1234\n---\n# Doc\n', 'utf8');

    const r = spawnSync('node', [inputsScript(workspaceDir), 'update', 'broken-inputs.md'], {
      encoding: 'utf8', cwd: workspaceDir,
    });
    expect(r.status).not.toBe(0);
    expect(r.stderr).toMatch(/ghost\.md/);
  });
});

// ── structure checker via runtime path ────────────────────────────────────

describe('.pythia/runtime/checks/structure.js', () => {
  const checker = (ws) => join(ws, '.pythia/runtime/checks/structure.js');

  it('exits 0 for a valid plan file', () => {
    // Minimal valid plan copied from fixtures
    const src = resolve(packageRoot, 'tools/fixtures/workflow-docs/valid/min.valid.plan.md');
    const dest = join(workspaceDir, 'test.plan.md');
    writeFileSync(dest, readFileSync(src, 'utf8'), 'utf8');

    const r = spawnSync('node', [checker(workspaceDir), dest], { encoding: 'utf8' });
    expect(r.status).toBe(0);
  });

  it('exits 1 for an invalid plan file', () => {
    const src = resolve(packageRoot, 'tools/fixtures/workflow-docs/invalid/bad-round.plan.md');
    const dest = join(workspaceDir, 'bad.plan.md');
    writeFileSync(dest, readFileSync(src, 'utf8'), 'utf8');

    const r = spawnSync('node', [checker(workspaceDir), dest], { encoding: 'utf8' });
    expect(r.status).toBe(1);
  });

  it('exits 2 for a missing file', () => {
    const r = spawnSync('node', [checker(workspaceDir), '/tmp/no-such-file.plan.md'], { encoding: 'utf8' });
    expect(r.status).toBe(2);
  });
});

// ── artifact-metadata checker via runtime path ────────────────────────────────

describe('.pythia/runtime/checks/artifact-metadata.js', () => {
  const checker = (ws) => join(ws, '.pythia/runtime/checks/artifact-metadata.js');

  it('exits 0 for a valid schema-tagged artifact', () => {
    const src = resolve(packageRoot, 'tools/fixtures/artifact-metadata/valid/example.plan.md');
    const dest = join(workspaceDir, 'valid.plan.md');
    writeFileSync(dest, readFileSync(src, 'utf8'), 'utf8');
    const r = spawnSync('node', [checker(workspaceDir), dest], { encoding: 'utf8', cwd: workspaceDir });
    expect(r.status).toBe(0);
  });

  it('exits 0 (advisory) for pre-schema plan without Schema field', () => {
    const dest = join(workspaceDir, 'legacy.plan.md');
    writeFileSync(dest, '# Plan\n\n## Metadata\n\n- **Status**: Draft\n\n## Goal\n\nGoal.\n', 'utf8');
    const r = spawnSync('node', [checker(workspaceDir), dest], { encoding: 'utf8', cwd: workspaceDir });
    expect(r.status).toBe(0);
  });

  it('exits 1 for invalid fixture from tools/fixtures', () => {
    const src = resolve(packageRoot, 'tools/fixtures/artifact-metadata/invalid/old-fields.plan.md');
    const dest = join(workspaceDir, 'invalid.plan.md');
    writeFileSync(dest, readFileSync(src, 'utf8'), 'utf8');
    const r = spawnSync('node', [checker(workspaceDir), dest], { encoding: 'utf8', cwd: workspaceDir });
    expect(r.status).toBe(1);
  });

  it('loads baked contract without project root in cwd (isolated cwd)', () => {
    const src = resolve(packageRoot, 'tools/fixtures/artifact-metadata/valid/example.plan.md');
    const dest = join(workspaceDir, 'isolated.plan.md');
    writeFileSync(dest, readFileSync(src, 'utf8'), 'utf8');
    // Run from /tmp — no skills/ in sight; must use baked metadata-contract.json
    const r = spawnSync('node', [checker(workspaceDir), dest], { encoding: 'utf8', cwd: '/tmp' });
    expect(r.status).toBe(0);
  });
});

// ── hook wiring ───────────────────────────────────────────────────────────────

describe('hook wiring after install', () => {
  it('writes .claude/settings.json with pythia-managed hooks', () => {
    const settingsPath = join(workspaceDir, '.claude/settings.json');
    expect(existsSync(settingsPath)).toBe(true);
    const s = JSON.parse(readFileSync(settingsPath, 'utf8'));
    const preHooks = s.hooks?.PreToolUse ?? [];
    const pythiaHook = preHooks.find((h) => h._managed === 'pythia');
    expect(pythiaHook).toBeDefined();
    // Claude hooks use separate command + args; the path is in args[0]
    const hookCmd = pythiaHook.hooks[0];
    const fullCmd = [hookCmd.command, ...(hookCmd.args ?? [])].join(' ');
    expect(fullCmd).toContain('.pythia/runtime/hooks/pre.js');
  });

  it('writes hooks.json with pythia-managed codex hooks', () => {
    const hooksPath = join(workspaceDir, 'hooks.json');
    expect(existsSync(hooksPath)).toBe(true);
    const h = JSON.parse(readFileSync(hooksPath, 'utf8'));
    const preHooks = h.hooks?.PreToolUse ?? [];
    const pythiaHook = preHooks.find((e) => e._managed === 'pythia');
    expect(pythiaHook).toBeDefined();
    const hookCmd = pythiaHook.hooks[0];
    const fullCmd = [hookCmd.command, ...(hookCmd.args ?? [])].join(' ');
    expect(fullCmd).toContain('.pythia/runtime/hooks/pre.js');
  });

  it('does not install SessionStart hook', () => {
    const settingsPath = join(workspaceDir, '.claude/settings.json');
    const s = JSON.parse(readFileSync(settingsPath, 'utf8'));
    expect(s.hooks?.SessionStart ?? []).toHaveLength(0);
  });

  it('update strips legacy SessionStart hook entries', async () => {
    const settingsPath = join(workspaceDir, '.claude/settings.json');
    const s = JSON.parse(readFileSync(settingsPath, 'utf8'));
    s.hooks = s.hooks ?? {};
    s.hooks.SessionStart = [
      { _managed: 'pythia', hooks: [{ type: 'command', command: 'node', args: ['legacy-session-start.js'] }] },
    ];
    writeFileSync(settingsPath, JSON.stringify(s, null, 2), 'utf8');
    await doUpdate({ target: workspaceDir, packageRoot, yes: true });
    const after = JSON.parse(readFileSync(settingsPath, 'utf8'));
    expect(after.hooks?.SessionStart ?? []).toHaveLength(0);
  });

  it('pythia version reports installed state after init+update', () => {
    const manifest = JSON.parse(readFileSync(join(workspaceDir, '.pythia/manifest.json'), 'utf8'));
    const r = runCli(['version', workspaceDir]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain(`framework:  ${manifest.frameworkVersion}`);
  });
});
