#!/usr/bin/env node
// migrate:check <from> <to> [--apply-sync] — post-update migration verification helper.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { readManifest } from './manifest.js';
import { readState } from './state.js';
import { compareSemver, inPendingRange, sortVersions } from './semver.js';
import { cmdCheckAll, cmdSync } from '../lib/references/inputs-core.js';
import { verifyPathsMdWorkflowDocs } from '../lib/paths-md-invariants.js';

function findTargetRoot(start) {
  let dir = resolve(start);
  while (true) {
    if (existsSync(join(dir, '.pythia', 'manifest.json')) || existsSync(join(dir, '.pythia', 'version.json'))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function captureConsole(fn) {
  const lines = [];
  const oldLog = console.log;
  const oldWarn = console.warn;
  try {
    console.log = (...args) => lines.push(args.join(' '));
    console.warn = (...args) => lines.push(args.join(' '));
    const code = fn();
    return { code, stdout: lines.join('\n') };
  } finally {
    console.log = oldLog;
    console.warn = oldWarn;
  }
}

function classifyPath(p) {
  if (p === '.pythia/config/paths.md') return 'paths';
  if (/\.ctx\.md$/.test(p)) return 'ctx';
  const m = p.match(/\.(plan|review|implementation|audit)\.md$/);
  if (m) return m[1];
  if (/\.context\.md$/.test(p)) return 'context';
  if (/(^|\/)feat-[^/]+\.md$/.test(p)) return 'feature';
  if (/\.retro\.md$/.test(p)) return 'retro';
  return 'other';
}

export function collectState(targetRoot, from, to) {
  const migrationsDir = join(targetRoot, '.pythia', 'runtime', 'migrations');
  const migrationVersions = existsSync(migrationsDir)
    ? sortVersions(readdirSync(migrationsDir)
      .filter((f) => /^\d+\.\d+\.\d+\.md$/.test(f))
      .map((f) => f.replace(/\.md$/, '')))
    : [];
  const inRange = migrationVersions.filter((v) => inPendingRange(v, from, to));
  const changed = new Set();
  const states = [];
  const warnings = [];
  const infos = [];

  for (const v of inRange) {
    const state = readState(targetRoot, v);
    if (!state) {
      warnings.push(`no state for ${v}`);
      continue;
    }
    states.push(state);
    for (const p of state.changedPaths ?? []) changed.add(p);
  }

  const known = new Set(migrationVersions);
  for (const v of [from, to]) {
    if (!known.has(v)) infos.push(`no migration file for ${v}`);
  }

  const changedPaths = [...changed].sort();
  const byType = {};
  for (const p of changedPaths) byType[classifyPath(p)] = (byType[classifyPath(p)] ?? 0) + 1;
  return { migrationVersions, inRange, states, changedPaths, byType, warnings, infos };
}

export function runVerify(targetRoot, to) {
  const script = join(targetRoot, '.pythia', 'runtime', 'migrate', 'verify.js');
  if (!existsSync(script)) return { code: 1, stdout: '', stderr: `FAIL: verify script unavailable: ${script}` };
  const result = spawnSync(process.execPath, [script, to], { cwd: targetRoot, encoding: 'utf8' });
  return { code: result.status ?? 1, stdout: result.stdout.trim(), stderr: result.stderr.trim() };
}

export function scanMetadata(targetRoot, changedPaths) {
  const checker = join(targetRoot, '.pythia', 'runtime', 'checks', 'artifact-metadata.js');
  if (!existsSync(checker)) return [{ file: checker, message: 'metadata checker unavailable' }];
  const issues = [];
  for (const rel of changedPaths) {
    if (!rel.endsWith('.md')) continue;
    const abs = join(targetRoot, rel);
    if (!existsSync(abs)) continue;
    if (rel === '.pythia/config/paths.md') {
      const result = verifyPathsMdWorkflowDocs(readFileSync(abs, 'utf8'));
      if (!result.ok) issues.push({ file: rel, message: result.reason ?? 'paths.md invariant failed' });
      continue;
    }
    const result = spawnSync(process.execPath, [checker, '--strict', abs], { cwd: targetRoot, encoding: 'utf8' });
    if ((result.status ?? 1) !== 0) {
      issues.push({ file: rel, message: (result.stderr || result.stdout).trim() });
    }
  }
  return issues;
}

export function scanRefsOwned(targetRoot, changedPaths) {
  const checker = join(targetRoot, '.pythia', 'runtime', 'checks', 'refs-owned.js');
  if (!existsSync(checker)) return [{ file: checker, message: 'refs-owned checker unavailable' }];
  const issues = [];
  for (const rel of changedPaths) {
    if (!rel.endsWith('.md')) continue;
    const abs = join(targetRoot, rel);
    if (!existsSync(abs)) continue;
    const result = spawnSync(process.execPath, [checker, abs], { cwd: targetRoot, encoding: 'utf8' });
    if ((result.status ?? 1) !== 0) {
      issues.push({ file: rel, message: (result.stderr || result.stdout).trim() });
    }
  }
  return issues;
}

export function parseInputsCheck(stdout) {
  const staleFiles = [];
  const invalidLines = [];
  const staleDeps = new Map();
  for (const line of stdout.split('\n')) {
    const fileMatch = line.match(/^✗ (.+) — (\d+) STALE, (\d+) INVALID$/);
    if (fileMatch) {
      staleFiles.push({
        file: fileMatch[1],
        stale: Number(fileMatch[2]),
        invalid: Number(fileMatch[3]),
      });
      continue;
    }
    const staleMatch = line.match(/^✗ (.+) — STALE \(stored: ([^,]+), current: ([^)]+)\)$/);
    if (staleMatch) {
      staleDeps.set(staleMatch[1], (staleDeps.get(staleMatch[1]) ?? 0) + 1);
      continue;
    }
    if (line.startsWith('! ')) invalidLines.push(line);
  }
  return { staleFiles, invalidLines, staleDeps };
}

export function countInvalidRefs(parsed) {
  if (parsed.invalidLines.length > 0) return parsed.invalidLines.length;
  return parsed.staleFiles.reduce((n, item) => n + item.invalid, 0);
}

export function runInputsCheck(targetRoot) {
  const previous = process.cwd();
  process.chdir(targetRoot);
  try {
    const captured = captureConsole(() => cmdCheckAll('.pythia'));
    return { ...captured, parsed: parseInputsCheck(captured.stdout) };
  } finally {
    process.chdir(previous);
  }
}

export function discoverPythiaGitStatus(targetRoot) {
  const pythiaRoot = spawnSync('git', ['-C', join(targetRoot, '.pythia'), 'rev-parse', '--show-toplevel'], {
    encoding: 'utf8',
  });
  if (pythiaRoot.status === 0) {
    const root = pythiaRoot.stdout.trim();
    const status = spawnSync('git', ['-C', root, 'status', '--short'], { encoding: 'utf8' });
    return { owner: root === join(targetRoot, '.pythia') ? '.pythia repo' : root, status: status.stdout.trim() };
  }

  const workspaceRoot = spawnSync('git', ['-C', targetRoot, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' });
  if (workspaceRoot.status === 0) {
    const root = workspaceRoot.stdout.trim();
    const status = spawnSync('git', ['-C', root, 'status', '--short', '--', relative(root, join(targetRoot, '.pythia'))], {
      encoding: 'utf8',
    });
    return { owner: root, status: status.stdout.trim() };
  }
  return { owner: 'none', status: 'WARN: .pythia git root not found; cannot show diff guard' };
}

export async function maybeApplySync(targetRoot, staleFiles) {
  if (!staleFiles.length) return null;
  console.log('\nProposed sync batch:');
  for (const item of staleFiles) {
    console.log(`  npm --prefix .pythia run refs:sync -- ${item.file}`);
  }
  console.log('\nDry-run preview:');
  for (const item of staleFiles) {
    cmdSync(join(targetRoot, item.file), { root: targetRoot, dryRun: true });
  }
  const rl = createInterface({ input, output });
  const answer = await rl.question('\nApprove sync? [y/n] ');
  rl.close();
  if (!/^y(es)?$/i.test(answer.trim())) return { applied: false };
  for (const item of staleFiles) {
    cmdSync(join(targetRoot, item.file), { root: targetRoot });
  }
  return { applied: true, git: discoverPythiaGitStatus(targetRoot) };
}

export function computeStatus({ verifyCode, metadataIssues, refsOwnedIssues, staleCount, invalidCount, stateWarnings }) {
  if (verifyCode !== 0) return 'FAIL';
  if (
    metadataIssues.length
    || refsOwnedIssues.length
    || staleCount
    || invalidCount
    || stateWarnings.length
  ) return 'WARN';
  return 'PASS';
}

export function stripDuplicateVerifyLine(stdout, to) {
  const duplicate = `verify ${to}: OK`;
  return stdout
    .split('\n')
    .filter((line) => line.trim() !== duplicate)
    .join('\n')
    .trim();
}

export function canApplySync({ staleFiles, metadataIssues, refsOwnedIssues }) {
  const batch = buildSyncBatch(staleFiles, refsOwnedIssues);
  return batch.length > 0 && metadataIssues.length === 0 && refsOwnedIssues.every(isSyncableRefsOwnedIssue);
}

export function isSyncableRefsOwnedIssue(issue) {
  // Syncable only when ALL error codes are phantom_reference — not phantom_used_by or relation.unknown,
  // which require manual body-link/relation inspection before sync.
  const codes = issue.message.match(/\[refs-owned\.[^\]]+\]/g) ?? [];
  return codes.length > 0 && codes.every((c) => c === '[refs-owned.phantom_reference]');
}

export function buildSyncBatch(staleFiles, refsOwnedIssues) {
  const byFile = new Map();
  for (const item of staleFiles) byFile.set(item.file, item);
  for (const issue of refsOwnedIssues) {
    if (!isSyncableRefsOwnedIssue(issue)) continue;
    if (!byFile.has(issue.file)) byFile.set(issue.file, { file: issue.file, stale: 0, invalid: 0, refsOwned: true });
  }
  return [...byFile.values()].sort((a, b) => a.file.localeCompare(b.file));
}

export async function main() {
  const args = process.argv.slice(2);
  const applySync = args.includes('--apply-sync');
  const positional = args.filter((a) => !a.startsWith('-'));
  const [from, to] = positional;
  if (!from || !to || compareSemver(from, to) >= 0) {
    console.error('Usage: npm --prefix .pythia run migrate:check -- <from> <to> [--apply-sync]');
    process.exit(2);
  }

  const targetRoot = findTargetRoot(dirname(fileURLToPath(import.meta.url)));
  if (!targetRoot) {
    console.error('Not a pythia workspace');
    process.exit(1);
  }
  const manifest = readManifest(targetRoot);
  if (!manifest) {
    console.error('Not a pythia workspace');
    process.exit(1);
  }

  const state = collectState(targetRoot, from, to);
  const verify = runVerify(targetRoot, to);
  const metadataIssues = state.changedPaths.length ? scanMetadata(targetRoot, state.changedPaths) : [];
  const refsOwnedIssues = state.changedPaths.length ? scanRefsOwned(targetRoot, state.changedPaths) : [];
  const inputs = runInputsCheck(targetRoot);
  const staleFiles = inputs.parsed.staleFiles;
  const invalidCount = countInvalidRefs(inputs.parsed);
  const staleCount = staleFiles.reduce((n, item) => n + item.stale, 0);
  const syncBatch = buildSyncBatch(staleFiles, refsOwnedIssues);

  const status = computeStatus({
    verifyCode: verify.code,
    metadataIssues,
    refsOwnedIssues,
    staleCount,
    invalidCount,
    stateWarnings: state.warnings,
  });

  console.log(`migrate check ${from} -> ${to}`);
  console.log(`status: ${status}`);
  console.log(`manifest: framework ${manifest.frameworkVersion ?? '?'} | migrated ${manifest.migratedVersion ?? '?'}`);
  console.log(`state: ${state.states.length ? `${state.changedPaths.length} changed paths ${JSON.stringify(state.byType)}` : 'no state.json found'}`);
  for (const info of state.infos) console.log(`INFO: ${info}`);
  for (const warning of state.warnings) console.log(`WARN: ${warning}`);
  console.log(`verify ${to}: ${verify.code === 0 ? 'OK' : 'FAIL'}`);
  const verifyOutput = stripDuplicateVerifyLine(verify.stdout, to);
  if (verifyOutput) console.log(verifyOutput);
  if (verify.stderr) console.log(verify.stderr);
  console.log(`metadata scan: ${metadataIssues.length ? `WARN (${metadataIssues.length})` : 'OK'}`);
  for (const issue of metadataIssues.slice(0, 20)) console.log(`  ${issue.file}: ${issue.message.split('\n')[0]}`);
  console.log(`refs-owned scan: ${refsOwnedIssues.length ? `WARN (${refsOwnedIssues.length})` : 'OK'}`);
  for (const issue of refsOwnedIssues.slice(0, 20)) console.log(`  ${issue.file}: ${issue.message.split('\n')[0]}`);
  console.log(`inputs check: ${staleCount || invalidCount ? `WARN — ${staleCount} STALE, ${invalidCount} INVALID` : 'OK'}`);
  for (const [dep, count] of inputs.parsed.staleDeps) console.log(`  stale root: ${dep} (${count})`);
  for (const item of staleFiles) console.log(`  stale artifact: ${item.file}`);

  if (verify.code !== 0) process.exit(1);

  const syncBlocked = syncBatch.length && !canApplySync({ staleFiles, metadataIssues, refsOwnedIssues });
  if (applySync && canApplySync({ staleFiles, metadataIssues, refsOwnedIssues })) {
    const before = { staleCount, invalidCount };
    const applied = await maybeApplySync(targetRoot, syncBatch);
    if (applied?.applied) {
      const after = runInputsCheck(targetRoot);
      const afterStale = after.parsed.staleFiles.reduce((n, item) => n + item.stale, 0);
      const afterInvalid = countInvalidRefs(after.parsed);
      const afterRefsOwned = scanRefsOwned(targetRoot, state.changedPaths);
      console.log(`\nBefore: ${before.staleCount} STALE, ${before.invalidCount} INVALID`);
      console.log(`After:  ${afterStale} STALE, ${afterInvalid} INVALID`);
      console.log(`Refs-owned after sync: ${afterRefsOwned.length ? `WARN (${afterRefsOwned.length})` : 'OK'}`);
      console.log(`Git owner: ${applied.git.owner}`);
      console.log(applied.git.status || 'No git changes reported');
    }
  } else if (syncBatch.length) {
    if (syncBlocked) {
      console.log('\nSync skipped: fix metadata or non-syncable refs-owned warnings before applying inputs sync.');
    } else {
      console.log('\nFollow-up available: rerun with --apply-sync to preview and approve refs:sync for stale or syncable phantom-reference artifacts.');
    }
  }

  process.exit(status === 'FAIL' ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error?.stack || error?.message || String(error));
    process.exit(1);
  });
}
