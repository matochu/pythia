import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'node:child_process';
import { isWorkspace, readManifest } from './workspace.js';
import { loadZones, forEachWorkflowChecker } from '../lib/paths.js';
import { hooksFileHasPythiaManaged } from '../lib/hook-detect.js';
import { verifyPathsMdWorkflowDocs } from '../lib/paths-md-invariants.js';
import { findUnresolvedMixedStates } from '../migrate/state.js';
import { projectRoot, normalizePath } from '../lib/repo-root.js';

/** @typedef {'ok' | 'warn' | 'fail'} HealthLevel */
/** @typedef {{ id: string, level: HealthLevel, message: string }} HealthCheck */

function push(checks, id, level, message) {
  checks.push({ id, level, message });
}

function fileExists(target, relpath) {
  return existsSync(join(target, relpath));
}

const RUNTIME_ESSENTIALS = [
  '.pythia/runtime/lib/paths.js',
  '.pythia/runtime/checks/doc-structure.js',
  '.pythia/runtime/hooks/post.js',
  '.pythia/runtime/package-paths.md',
  '.pythia/runtime/inputs.js',
  '.pythia/runtime/migrate/apply.js',
];

const PROTECTED_SEEDS = [
  '.pythia/config/settings.md',
  '.pythia/config/paths.md',
  '.pythia/README.md',
];

const MANIFEST_FIELDS = ['frameworkVersion', 'migratedVersion', 'surfaces', 'installedSkills', 'generated'];

const SURFACE_HOOK_FILES = {
  '.claude/skills': '.claude/settings.json',
  '.agents/skills': 'hooks.json',
  '.cursor/skills': '.cursor/hooks.json',
};

/**
 * @param {string} target Absolute workspace root
 * @returns {{ ok: boolean, checks: HealthCheck[] }}
 */
export function checkWorkspaceHealth(target) {
  /** @type {HealthCheck[]} */
  const checks = [];

  if (!isWorkspace(target)) {
    push(checks, 'workspace', 'fail', 'not a pythia workspace (.pythia/manifest.json missing or invalid)');
    return { ok: false, checks };
  }
  push(checks, 'workspace', 'ok', 'manifest.json valid');

  const manifest = readManifest(target);
  if (!manifest) {
    push(checks, 'manifest', 'fail', 'manifest.json unreadable');
    return { ok: false, checks };
  }

  for (const field of MANIFEST_FIELDS) {
    if (manifest[field] == null) {
      push(checks, `manifest.${field}`, 'fail', `manifest.json missing ${field}`);
    } else {
      push(checks, `manifest.${field}`, 'ok', `${field} present`);
    }
  }

  for (const relpath of PROTECTED_SEEDS) {
    if (fileExists(target, relpath)) {
      push(checks, relpath, 'ok', 'present');
    } else {
      push(checks, relpath, 'fail', 'missing');
    }
  }

  const pathsMdPath = join(target, '.pythia/config/paths.md');
  if (existsSync(pathsMdPath)) {
    const pathsResult = verifyPathsMdWorkflowDocs(readFileSync(pathsMdPath, 'utf8'));
    if (!pathsResult.ok) {
      push(checks, 'paths.md.workflow-docs', 'warn', pathsResult.reason);
    } else {
      push(checks, 'paths.md.workflow-docs', 'ok', 'Workflow docs invariants satisfied');
    }
  }

  const settingsPath = join(target, '.pythia/config/settings.md');
  if (existsSync(settingsPath)) {
    const settingsBody = readFileSync(settingsPath, 'utf8').trim();
    if (settingsBody.length === 0) {
      push(checks, 'settings.content', 'warn', '.pythia/config/settings.md is empty');
    } else {
      push(checks, 'settings.content', 'ok', 'settings.md has content');
    }
  }

  for (const relpath of RUNTIME_ESSENTIALS) {
    if (fileExists(target, relpath)) {
      push(checks, relpath, 'ok', 'present');
    } else {
      push(checks, relpath, 'fail', 'missing — run update');
    }
  }

  for (const surface of manifest.surfaces ?? []) {
    if (fileExists(target, surface)) {
      push(checks, surface, 'ok', 'skills surface present');
    } else {
      push(checks, surface, 'fail', 'skills surface missing');
    }
  }

  for (const [surface, hookFile] of Object.entries(SURFACE_HOOK_FILES)) {
    if (!(manifest.surfaces ?? []).includes(surface)) continue;
    if (hooksFileHasPythiaManaged(target, hookFile)) {
      push(checks, hookFile, 'ok', 'pythia hooks wired');
    } else {
      push(checks, hookFile, 'fail', 'pythia hooks missing — run update');
    }
  }

  if (manifest.generated?.['CLAUDE.md'] && !fileExists(target, 'CLAUDE.md')) {
    push(checks, 'CLAUDE.md', 'fail', 'managed CLAUDE.md missing');
  } else if (manifest.generated?.['CLAUDE.md']) {
    push(checks, 'CLAUDE.md', 'ok', 'present');
  }

  if (manifest.generated?.['AGENTS.md'] && !fileExists(target, 'AGENTS.md')) {
    push(checks, 'AGENTS.md', 'fail', 'managed AGENTS.md missing');
  } else if (manifest.generated?.['AGENTS.md']) {
    push(checks, 'AGENTS.md', 'ok', 'present');
  }

  const unresolved = findUnresolvedMixedStates(target);
  if (unresolved.length > 0) {
    const versions = unresolved.map((s) => s.migrationVersion).join(', ');
    push(
      checks,
      'migrations.unresolved',
      'fail',
      `${unresolved.length} unresolved mixed migration(s) (${versions}) — complete migrate skill before update`
    );
  } else {
    push(checks, 'migrations.unresolved', 'ok', 'no unresolved mixed migrations');
  }

  if (manifest.frameworkVersion && manifest.migratedVersion
    && manifest.migratedVersion !== manifest.frameworkVersion) {
    push(
      checks,
      'migrations.pending',
      'warn',
      `migratedVersion (${manifest.migratedVersion}) behind frameworkVersion (${manifest.frameworkVersion}) — run update`
    );
  } else if (manifest.frameworkVersion && manifest.migratedVersion) {
    push(checks, 'migrations.pending', 'ok', 'migrations up to date');
  }

  const checksDir = join(target, '.pythia/runtime/checks');
  if (existsSync(checksDir)) {
    try {
      const zones = loadZones(target);
      forEachWorkflowChecker(zones, (base) => {
        const checkPath = join(checksDir, base);
        if (!existsSync(checkPath)) {
          push(checks, `checker.${base}`, 'warn', `paths.md references ${base} but runtime checker missing`);
        }
      });
    } catch {
      push(checks, 'paths.md', 'warn', 'could not parse Workflow docs checkers from paths.md');
    }
  }

  checkInputsRuntime(target, checks);

  const ok = !checks.some((c) => c.level === 'fail');
  return { ok, checks };
}

/** inputs.js path anchor + CLI smoke (project root via manifest, not git). Document freshness is `inputs check --all`, not health. */
function checkInputsRuntime(target, checks) {
  const inputsJs = join(target, '.pythia/runtime/inputs.js');
  if (!existsSync(inputsJs)) {
    push(checks, 'inputs.runtime', 'fail', 'missing .pythia/runtime/inputs.js — run update');
    return;
  }
  push(checks, 'inputs.runtime', 'ok', 'present');

  const probe = join(target, '.pythia/config/paths.md');
  try {
    const resolved = projectRoot(probe);
    if (normalizePath(resolved) !== normalizePath(target)) {
      push(
        checks,
        'inputs.project-root',
        'fail',
        `resolved ${resolved} !== project target ${target}`,
      );
      return;
    }
    push(checks, 'inputs.project-root', 'ok', 'manifest anchor resolves to project target');
  } catch (err) {
    push(checks, 'inputs.project-root', 'fail', err?.message || 'project root resolution failed');
    return;
  }

  const anchor = join(target, '.pythia/config/paths.md');
  if (!existsSync(anchor)) {
    push(checks, 'inputs.cli', 'warn', 'paths.md anchor missing — skipping inputs.js CLI smoke');
    return;
  }

  const r = spawnSync(process.execPath, [inputsJs, 'check', anchor], {
    encoding: 'utf8',
    cwd: target,
  });
  if (r.status !== 0) {
    const detail = (r.stderr || r.stdout || '').trim().split('\n').slice(0, 3).join('; ');
    const fallback =
      r.status === 2
        ? 'inputs.js check failed (usage/io error)'
        : r.status === 1
          ? 'inputs.js check reported stale or missing references on anchor file'
          : `inputs.js check failed (exit ${r.status})`;
    push(checks, 'inputs.cli', 'fail', detail || fallback);
  } else {
    push(checks, 'inputs.cli', 'ok', 'inputs.js CLI executable (manifest anchor file)');
  }
}

function formatHuman(checks) {
  const lines = [];
  for (const c of checks) {
    const tag = c.level.toUpperCase().padEnd(4);
    lines.push(`${tag} ${c.id}: ${c.message}`);
  }
  return lines.join('\n');
}

/**
 * @param {{ target: string, json?: boolean }} opts
 * @returns {number} exit code
 */
export function doHealth({ target, json = false }) {
  const result = checkWorkspaceHealth(target);
  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatHuman(result.checks));
    console.log('');
    console.log(result.ok ? 'health: OK' : 'health: FAIL');
  }
  return result.ok ? 0 : 1;
}

/**
 * Post-update summary: inputs runtime wiring only (not document freshness).
 * @param {string} target project root
 */
export function printUpdateHealthReport(target) {
  const checks = [];
  checkInputsRuntime(target, checks);
  console.log('[update] inputs runtime:');
  for (const c of checks) {
    console.log(`  ${c.level.toUpperCase().padEnd(4)} ${c.id}: ${c.message}`);
  }
  const failed = checks.some((c) => c.level === 'fail');
  console.log(failed ? '[update] inputs runtime: FAIL — run: npx pythia-workspace health' : '[update] inputs runtime: OK');
}
