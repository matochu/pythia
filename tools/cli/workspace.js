import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, cpSync, readdirSync, rmSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { loadZonesForBootstrap, deriveSurfacesAndSubstitutions, loadZones, zone, SURFACE_KEY_MAP, DEFAULT_SURFACE_PATHS } from '../lib/paths.js';
import {
  refreshRegistryCheck,
  printRegistryUpdateNotice,
} from './registry-check.js';
import { isPythiaManagedHook, isPythiaManagedHookEntry } from '../lib/hook-detect.js';
export { readManifest, writeManifest } from '../migrate/manifest.js';
import { readManifest, writeManifest } from '../migrate/manifest.js';

export function isWorkspace(target) {
  try {
    const manifestPath = join(target, '.pythia', 'manifest.json');
    const versionPath = join(target, '.pythia', 'version.json');
    if (existsSync(manifestPath)) {
      JSON.parse(readFileSync(manifestPath, 'utf8'));
      return true;
    }
    if (existsSync(versionPath)) {
      JSON.parse(readFileSync(versionPath, 'utf8'));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// A directory is an existing workspace if `.pythia/` exists with any real content
// (managed manifest/version JSON, or any file/dir other than `.DS_Store`).
// Used for auto-detect routing: existing → update, empty/absent → init.
export function isExistingWorkspace(target) {
  const pythiaDir = join(target, '.pythia');
  if (!existsSync(pythiaDir)) return false;
  if (isWorkspace(target)) return true;
  try {
    return readdirSync(pythiaDir).some((e) => e !== '.DS_Store');
  } catch {
    return false;
  }
}

export function sha256(content) {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

// "Adopted" means .pythia/ already had content before init/update touched it —
// migration zone covers all of .pythia/, so any pre-existing entry counts, not just workflows/.
// Excludes `.git` and `.DS_Store`: the CLI's own git-strategy side effect (`git init .pythia/.git`)
// runs before this check on the init path, so `.git` must not itself count as "pre-existing".
function hasProtectedArtifacts(target) {
  const pythiaDir = join(target, '.pythia');
  if (!existsSync(pythiaDir)) return false;
  const entries = readdirSync(pythiaDir);
  return entries.some((e) => e !== '.DS_Store' && e !== '.git');
}


function readPackageVersion(packageRoot) {
  const pkgPath = join(packageRoot, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  if (!pkg.version) throw new Error('package.json has no version field');
  return pkg.version;
}

function renderInstructions(source, tool, skillsPath, file = '') {
  if (file === 'AGENTS.md') {
    return source
      .replace(/^# Project Instructions \(\{tool\}\)/m, '# Project Instructions')
      .replace(/Single source of \{tool\} instructions/g, 'Single source of agent instructions')
      .replace(/\{skillsPath\}/g, skillsPath);
  }
  return source.replace(/\{tool\}/g, tool).replace(/\{skillsPath\}/g, skillsPath);
}

function seedIfMissing(target, relpath, content, dryRun) {
  const dest = join(target, relpath);
  if (existsSync(dest)) return;
  if (dryRun) {
    console.log(`  [seed] ${relpath}`);
    return;
  }
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, content, 'utf8');
  console.log(`  seeded: ${relpath}`);
}

function writeManaged(target, relpath, content, existingManifest, dryRun) {
  const dest = join(target, relpath);
  const newHash = sha256(content);
  const recordedHash = existingManifest[relpath];

  if (existsSync(dest)) {
    const currentContent = readFileSync(dest, 'utf8');
    const currentHash = sha256(currentContent);
    const isModified = !recordedHash || currentHash !== recordedHash;

    if (isModified) {
      if (dryRun) {
        console.log(`  [backup+overwrite] ${relpath} (local modifications detected)`);
      } else {
        writeFileSync(dest + '.bak', currentContent, 'utf8');
        writeFileSync(dest, content, 'utf8');
        console.log(`  backed up and refreshed: ${relpath}`);
      }
    } else {
      if (dryRun) {
        console.log(`  [refresh] ${relpath}`);
      } else {
        writeFileSync(dest, content, 'utf8');
        console.log(`  refreshed: ${relpath}`);
      }
    }
  } else {
    if (dryRun) {
      console.log(`  [write] ${relpath}`);
    } else {
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, content, 'utf8');
      console.log(`  wrote: ${relpath}`);
    }
  }

  return newHash;
}

function installSkills(packageRoot, target, surfaces, dryRun) {
  const skillsSource = join(packageRoot, 'skills');
  if (!existsSync(skillsSource)) {
    throw new Error(`skills/ not found at ${skillsSource}`);
  }
  for (const surface of surfaces) {
    const dest = join(target, surface);
    if (dryRun) {
      console.log(`  [install skills] ${surface}`);
    } else {
      mkdirSync(dest, { recursive: true });
      cpSync(skillsSource, dest, { recursive: true, force: true });
      console.log(`  installed skills → ${surface}`);
    }
  }
}

// Prune ONLY skills pythia previously installed and that are now gone from the package.
// `previousInstalled` is the manifest's installedSkills list. Skills pythia never installed
// (user's own custom skills in a surface) are never touched.
function pruneSkills(packageRoot, target, surfaces, dryRun, previousInstalled = []) {
  const skillsSource = join(packageRoot, 'skills');
  if (!existsSync(skillsSource)) return;
  const sourceSkills = new Set(readdirSync(skillsSource));
  const prev = new Set(previousInstalled);
  for (const surface of surfaces) {
    const dest = join(target, surface);
    if (!existsSync(dest)) continue;
    for (const entry of readdirSync(dest)) {
      // Only prune if we installed it before AND it no longer ships in the package.
      if (prev.has(entry) && !sourceSkills.has(entry)) {
        const entryPath = join(dest, entry);
        if (dryRun) {
          console.log(`  [prune] ${surface}/${entry}`);
        } else {
          rmSync(entryPath, { recursive: true, force: true });
          console.log(`  pruned: ${surface}/${entry}`);
        }
      }
    }
  }
}

// Names of skills shipped in the package (the set pythia owns/installs).
function packageSkillNames(packageRoot) {
  const skillsSource = join(packageRoot, 'skills');
  if (!existsSync(skillsSource)) return [];
  return readdirSync(skillsSource);
}

const _packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../');
const _registryZones = loadZonesForBootstrap(_packageRoot);
const { defaultSurfaces: DEFAULT_SURFACES, substitutions: SUBSTITUTIONS } = deriveSurfacesAndSubstitutions(_registryZones);

export async function doInit(opts) {
  const { target, dryRun, packageRoot, reconfigure = false, yes = false } = opts;

  const existingManifestData = readManifest(target);
  const { surfaces, gitStrategy } = await resolveSurfacesAndGit(
    reconfigure ? null : existingManifestData,
    { ...opts, yes }
  );

  const adopted = hasProtectedArtifacts(target);
  const frameworkVersion = readPackageVersion(packageRoot);
  let migrationBaseline;
  if (existingManifestData?.migratedVersion) {
    migrationBaseline = existingManifestData.migratedVersion;
  } else {
    // Fresh and adopted first init both start at 0.0.0 so versioned migrations run;
    // applyMigrations commits to frameworkVersion when all pending steps complete.
    migrationBaseline = '0.0.0';
  }

  console.log(`[init] target: ${target}${adopted ? ' (adopted)' : ''}`);

  await finalizeWorkspaceLifecycle({
    target,
    packageRoot,
    dryRun,
    surfaces,
    gitStrategy,
    existingManifest: existingManifestData,
    migrationBaseline,
    adopted,
    noMigrate: false,
    registryFetch: opts.registryFetch,
    label: 'init',
  });

  console.log(`[init] done — workspace ready${dryRun ? ' (dry-run)' : ''}`);
}

function materializeHookRuntime(packageRoot, target, dryRun) {
  const libSourceDir = join(packageRoot, 'tools', 'lib');
  const checksSourceDir = join(packageRoot, 'tools', 'checks');
  const hooksSourceDir = join(packageRoot, 'tools', 'hooks');
  if (!existsSync(hooksSourceDir)) return null;

  if (dryRun) {
    console.log('  [materialize] hook runtime → .pythia/runtime/{lib,checks,hooks,package-paths.md}');
    return null;
  }

  const runtimeDir = join(target, '.pythia', 'runtime');
  for (const [src, dst] of [
    [libSourceDir, join(runtimeDir, 'lib')],
    [checksSourceDir, join(runtimeDir, 'checks')],
    [hooksSourceDir, join(runtimeDir, 'hooks')],
  ]) {
    if (existsSync(src)) {
      mkdirSync(dst, { recursive: true });
      cpSync(src, dst, {
        recursive: true,
        force: true,
        filter: (s) => !s.includes('/tests/') && !s.includes('/__tests__/'),
      });
    }
  }
  const inputsSrc = join(packageRoot, 'tools', 'bin', 'inputs.js');
  if (existsSync(inputsSrc)) {
    mkdirSync(runtimeDir, { recursive: true });
    cpSync(inputsSrc, join(runtimeDir, 'inputs.js'), { force: true });
  }
  const packagePathsSrc = join(packageRoot, 'assets', 'base', 'config', 'paths.md');
  if (existsSync(packagePathsSrc)) {
    mkdirSync(runtimeDir, { recursive: true });
    cpSync(packagePathsSrc, join(runtimeDir, 'package-paths.md'), { force: true });
  }
  ensurePythiaGitignore(target, dryRun);
  return resolve(join(runtimeDir, 'hooks'));
}

function materializeMigrateRuntime(packageRoot, target, dryRun) {
  const engineSrc = join(packageRoot, 'tools', 'migrate');
  const migrationsSrc = join(packageRoot, 'assets', 'migrations');
  const runtimeDir = join(target, '.pythia', 'runtime');
  const engineDst = join(runtimeDir, 'migrate');
  const migrationsDst = join(runtimeDir, 'migrations');

  if (!existsSync(engineSrc)) return;

  if (!dryRun) {
    mkdirSync(engineDst, { recursive: true });
    cpSync(engineSrc, engineDst, { recursive: true, force: true, filter: (src) => !src.includes('__tests__') });
    if (existsSync(migrationsSrc)) {
      mkdirSync(migrationsDst, { recursive: true });
      for (const f of readdirSync(migrationsSrc)) {
        if (/^\d+\.\d+\.\d+\.md$/.test(f)) {
          cpSync(join(migrationsSrc, f), join(migrationsDst, f), { force: true });
        }
      }
    }
  } else {
    console.log('  [materialize] migrate runtime → .pythia/runtime/{migrate,migrations}');
  }
}

/** @deprecated use materializeMigrateRuntime */
function materializeRuntime(packageRoot, target, dryRun) {
  materializeMigrateRuntime(packageRoot, target, dryRun);
}

function ensurePythiaGitignore(target, dryRun) {
  if (dryRun) return;
  const gitignorePath = join(target, '.pythia', '.gitignore');
  const required = 'runtime/\nbackups/\n';
  if (!existsSync(gitignorePath) || !readFileSync(gitignorePath, 'utf8').includes('runtime/')) {
    mkdirSync(dirname(gitignorePath), { recursive: true });
    writeFileSync(gitignorePath, required, 'utf8');
  }
}

function installHooks(packageRoot, target, surfaces, dryRun, hooksAbsDir) {
  const hooksSourceDir = join(packageRoot, 'tools', 'hooks');
  if (!existsSync(hooksSourceDir)) return;

  const hooksDir = hooksAbsDir ?? join(target, '.pythia', 'runtime', 'hooks');
  if (!hooksAbsDir && !dryRun && !existsSync(hooksDir)) {
    throw new Error('installHooks: hook runtime not materialized — call materializeHookRuntime first');
  }

  if (dryRun) {
    console.log('  [hooks] wire Claude/Codex/Cursor host configs');
    return;
  }

  const hooksAbsPath = resolve(hooksDir);

  if (surfaces.some((s) => s.includes('claude'))) {
    mergeClaudeHooks(packageRoot, target, hooksAbsPath, dryRun);
    stripRetiredPythiaHookEvents(join(target, '.claude', 'settings.json'), dryRun);
    stripLegacyClaudePostToolUse(join(target, '.claude', 'settings.json'), hooksAbsPath, dryRun);
  }

  if (surfaces.some((s) => s.includes('agents'))) {
    installCodexHooks(packageRoot, target, hooksAbsPath, dryRun);
  }

  if (surfaces.some((s) => s.includes('cursor'))) {
    installCursorHooks(packageRoot, target, hooksAbsPath, dryRun);
  }

  refreshManagedCodexRules(packageRoot, target, dryRun);
}

function refreshManagedCodexRules(packageRoot, target, dryRun) {
  const rulesTemplate = join(packageRoot, 'tools', 'hooks', 'wiring', 'codex-rules', 'default.rules');
  if (!existsSync(rulesTemplate)) return;
  const rulesTarget = join(target, '.codex', 'rules', 'default.rules');
  const managedHeader = '# Pythia workspace guardrails\n';
  if (existsSync(rulesTarget)) {
    const current = readFileSync(rulesTarget, 'utf8');
    if (!current.startsWith(managedHeader)) return;
  }
  if (dryRun) {
    console.log('  [refresh] .codex/rules/default.rules');
    return;
  }
  mkdirSync(dirname(rulesTarget), { recursive: true });
  cpSync(rulesTemplate, rulesTarget, { force: true });
  console.log('  refreshed: .codex/rules/default.rules');
}

function stripLegacyClaudePostToolUse(settingsPath, hooksAbsDir, dryRun) {
  if (!existsSync(settingsPath)) return;
  let settings;
  try {
    settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
  } catch {
    return;
  }
  if (!settings.hooks?.PostToolUse) return;

  const managedCommands = new Set(
    ['pre.js', 'post.js', 'stop.js', 'cursor-post.js'].map((f) => resolve(join(hooksAbsDir, f)))
  );

  let removed = 0;
  for (const group of settings.hooks.PostToolUse) {
    if (!group.hooks) continue;
    const groupManaged = group._managed === 'pythia' || group._managed === 'pythia-managed';
    const before = group.hooks.length;
    group.hooks = group.hooks.filter((h) => {
      if (h._managed === 'pythia' || h._managed === 'pythia-managed') return true;
      const cmdParts = [];
      if (h.command) cmdParts.push(String(h.command));
      if (Array.isArray(h.args)) cmdParts.push(...h.args.map(String));
      const targetsManagedScript =
        cmdParts.some((part) => managedCommands.has(resolve(part)))
        || cmdParts.some((p) => p.includes('.pythia/runtime/hooks'));
      if (!targetsManagedScript) return true;
      // Keep inner hooks in the group mergeClaudeHooks just wrote; strip legacy duplicates elsewhere.
      if (groupManaged) return true;
      return false;
    });
    removed += before - group.hooks.length;
  }
  settings.hooks.PostToolUse = settings.hooks.PostToolUse.filter((g) => g.hooks?.length > 0);

  if (removed > 0 && !dryRun) {
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    console.log(`  removed ${removed} legacy Claude PostToolUse duplicate(s)`);
  }
}

function installCursorHooks(packageRoot, target, hooksAbsDir, dryRun) {
  const templatePath = join(packageRoot, 'tools', 'hooks', 'wiring', 'cursor-hooks.json');
  if (!existsSync(templatePath)) return;
  const template = readFileSync(templatePath, 'utf8').replace(/{{HOOKS_DIR}}/g, hooksAbsDir);
  const incoming = JSON.parse(template);

  const hooksJsonPath = join(target, '.cursor', 'hooks.json');
  let existing = { version: 1, hooks: {} };
  if (existsSync(hooksJsonPath)) {
    try {
      existing = JSON.parse(readFileSync(hooksJsonPath, 'utf8'));
    } catch {
      /* malformed */
    }
  }
  if (!existing.hooks) existing.hooks = {};

  for (const [event, entries] of Object.entries(incoming.hooks ?? {})) {
    if (!existing.hooks[event]) existing.hooks[event] = [];
    existing.hooks[event] = existing.hooks[event].filter((h) => !isPythiaManagedHookEntry(h));
    for (const entry of entries) {
      existing.hooks[event].push({ ...entry, _managed: 'pythia' });
    }
  }

  if (!dryRun) {
    mkdirSync(dirname(hooksJsonPath), { recursive: true });
    writeFileSync(hooksJsonPath, JSON.stringify(existing, null, 2), 'utf8');
    console.log('  merged hooks → .cursor/hooks.json');
  }
}

function warnMissingCheckers(target, label = 'update') {
  const checksDir = join(target, '.pythia', 'runtime', 'checks');
  if (!existsSync(checksDir)) return;
  const zones = loadZones(target);
  const workflowDocs = zone(zones, 'Workflow docs');
  for (const entry of workflowDocs) {
    if (!entry.checker) continue;
    for (const checkerName of entry.checker.split(',').map((s) => s.trim()).filter(Boolean)) {
      const base = checkerName.includes('/') ? checkerName.split('/').pop() : checkerName;
      const checkPath = join(checksDir, base);
      if (!existsSync(checkPath)) {
        console.warn(`[${label}] paths.md references checker ${base} but it is missing from .pythia/runtime/checks/`);
      }
    }
  }
}

function mergeClaudeHooks(packageRoot, target, hooksAbsDir, dryRun) {
  const settingsPath = join(target, '.claude', 'settings.json');
  const templatePath = join(packageRoot, 'tools', 'hooks', 'wiring', 'claude-settings.json');
  if (!existsSync(templatePath)) return;
  const wiring = JSON.parse(readFileSync(templatePath, 'utf8').replace(/{{HOOKS_DIR}}/g, hooksAbsDir));
  _mergeClaudeHooks(settingsPath, wiring.hooks, dryRun);
}

function _mergeClaudeHooks(settingsPath, newHooks, dryRun) {
  let settings = {};
  if (existsSync(settingsPath)) {
    try { settings = JSON.parse(readFileSync(settingsPath, 'utf8')); } catch { /* malformed */ }
  }

  if (!settings.hooks) settings.hooks = {};

  for (const [event, entries] of Object.entries(newHooks)) {
    if (!settings.hooks[event]) settings.hooks[event] = [];
    // Remove previously managed entries (marker check)
    settings.hooks[event] = settings.hooks[event].filter((h) => !isPythiaManagedHookEntry(h));
    // Add new managed entries with marker
    for (const entry of entries) {
      settings.hooks[event].push({ ...entry, _managed: 'pythia' });
    }
  }

  if (!dryRun) {
    mkdirSync(dirname(settingsPath), { recursive: true });
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    console.log('  merged hooks → .claude/settings.json');
  }
}

/** Remove pythia-managed hook events retired from the wiring template (e.g. SessionStart). */
function stripRetiredPythiaHookEvents(settingsPath, dryRun) {
  if (!existsSync(settingsPath)) return;
  let settings;
  try {
    settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
  } catch {
    return;
  }
  if (!settings.hooks) return;

  const retiredEvents = ['SessionStart'];
  let changed = false;
  for (const event of retiredEvents) {
    if (!settings.hooks[event]) continue;
    const before = settings.hooks[event].length;
    settings.hooks[event] = settings.hooks[event].filter((h) => !isPythiaManagedHookEntry(h));
    if (settings.hooks[event].length !== before) changed = true;
    if (settings.hooks[event].length === 0) delete settings.hooks[event];
  }

  if (changed && !dryRun) {
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    console.log('  removed retired pythia hooks from .claude/settings.json');
  }
}

function installCodexHooks(packageRoot, target, hooksAbsDir, dryRun) {
  const templatePath = join(packageRoot, 'tools', 'hooks', 'wiring', 'codex-hooks.json');
  if (!existsSync(templatePath)) return;
  const template = readFileSync(templatePath, 'utf8').replace(/{{HOOKS_DIR}}/g, hooksAbsDir);
  const incoming = JSON.parse(template);

  const hooksJsonPath = join(target, 'hooks.json');
  let existing = {};
  if (existsSync(hooksJsonPath)) {
    try { existing = JSON.parse(readFileSync(hooksJsonPath, 'utf8')); } catch { /* malformed */ }
  }

  if (!existing.hooks) existing.hooks = {};

  for (const [event, entries] of Object.entries(incoming.hooks)) {
    if (!existing.hooks[event]) existing.hooks[event] = [];
    // Remove previously managed entries (marker or .pythia/runtime/hooks path — same as Claude)
    existing.hooks[event] = existing.hooks[event].filter((h) => !isPythiaManagedHookEntry(h));
    for (const entry of entries) {
      existing.hooks[event].push({ ...entry, _managed: 'pythia' });
    }
  }

  if (!dryRun) {
    writeFileSync(hooksJsonPath, JSON.stringify(existing, null, 2), 'utf8');
    console.log('  merged hooks → hooks.json');
  }
}

function writePythiaPackageJson(target, projectName, frameworkVersion, dryRun) {
  const pkgPath = join(target, '.pythia', 'package.json');
  const pkg = {
    name: `${projectName}-pythia`,
    version: frameworkVersion,
    type: 'module',
    scripts: {
      'migrate:status': 'node runtime/migrate/status.js',
      'migrate:apply': 'node runtime/migrate/apply.js',
      'migrate:verify': 'node runtime/migrate/verify.js',
      'migrate:commit': 'node runtime/migrate/commit.js',
      'migrate:restore': 'node runtime/migrate/restore.js',
    },
  };
  if (!dryRun) {
    mkdirSync(dirname(pkgPath), { recursive: true });
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
  } else {
    console.log(`  [write] .pythia/package.json (frameworkVersion=${frameworkVersion})`);
  }
}

function pythiaGitHasCommits(target) {
  const pythiaDir = join(target, '.pythia');
  if (!existsSync(join(pythiaDir, '.git'))) return false;
  const r = spawnSync('git', ['-C', pythiaDir, 'rev-parse', '--verify', 'HEAD'], { encoding: 'utf8' });
  return r.status === 0;
}

function createPreUpdateBackup(target, dryRun, reason) {
  const pythiaDir = join(target, '.pythia');
  if (!existsSync(pythiaDir)) return null;

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const relBackupDir = join('.pythia', 'backups', `pre-update-${stamp}`);
  const backupDir = join(target, relBackupDir);

  if (dryRun) {
    console.log(`  [backup] ${relBackupDir} (${reason})`);
    return relBackupDir;
  }

  const snapshotDir = join(backupDir, '.pythia');
  mkdirSync(snapshotDir, { recursive: true });
  for (const entry of readdirSync(pythiaDir)) {
    if (entry === '.git' || entry === 'runtime' || entry === 'backups') continue;
    cpSync(join(pythiaDir, entry), join(snapshotDir, entry), { recursive: true });
  }

  const gitignorePath = join(target, '.pythia', 'backups', '.gitignore');
  if (!existsSync(gitignorePath)) writeFileSync(gitignorePath, '*\n', 'utf8');

  console.log(`  backed up pre-update .pythia → ${relBackupDir}`);
  return relBackupDir;
}

async function finalizeWorkspaceLifecycle(opts) {
  const {
    target,
    packageRoot,
    dryRun,
    surfaces,
    gitStrategy,
    existingManifest = null,
    migrationBaseline,
    noMigrate = false,
    registryFetch,
    label = 'update',
    previousInstalled = [],
    existingGenerated = {},
  } = opts;

  const assetsDir = join(packageRoot, 'assets');
  if (!existsSync(assetsDir)) throw new Error(`assets/ not found at ${assetsDir}`);
  if (!existsSync(join(packageRoot, 'skills'))) {
    throw new Error(`skills/ not found at ${join(packageRoot, 'skills')}`);
  }

  const instructionSource = readFileSync(join(assetsDir, 'instructions.md'), 'utf8');
  const frameworkVersion = readPackageVersion(packageRoot);

  ensureGitStrategy(target, gitStrategy, dryRun);

  const baseDir = join(assetsDir, 'base');
  seedIfMissing(target, '.pythia/config/settings.md', readFileSync(join(baseDir, 'config/settings.md'), 'utf8'), dryRun);
  seedIfMissing(target, '.pythia/README.md', readFileSync(join(baseDir, 'README.md'), 'utf8'), dryRun);
  seedIfMissing(target, '.pythia/config/paths.md', readFileSync(join(baseDir, 'config/paths.md'), 'utf8'), dryRun);
  seedIfMissing(target, '.pythia/workflows/.gitkeep', '', dryRun);

  const manifest = {};
  const activeSurfaces = [];
  for (const sub of SUBSTITUTIONS) {
    if (!surfaces.includes(sub.skillsPath)) continue;
    const content = renderInstructions(instructionSource, sub.tool, sub.skillsPath, sub.file);
    const hash = writeManaged(target, sub.file, content, existingGenerated, dryRun);
    manifest[sub.file] = dryRun ? sha256(content) : hash;
    activeSurfaces.push(sub.skillsPath);
  }
  // Skill-only surfaces (e.g. Cursor) have no instruction substitution but still need install/hooks.
  for (const s of surfaces) {
    if (!activeSurfaces.includes(s)) activeSurfaces.push(s);
  }

  if (label === 'update') {
    pruneSkills(packageRoot, target, activeSurfaces, dryRun, previousInstalled);
  }
  installSkills(packageRoot, target, activeSurfaces, dryRun);

  if (label === 'init' && !dryRun) console.log('[init] materializing runtime…');

  const hooksAbsDir = materializeHookRuntime(packageRoot, target, dryRun);
  installHooks(packageRoot, target, activeSurfaces, dryRun, hooksAbsDir);
  materializeMigrateRuntime(packageRoot, target, dryRun);

  const pkgJson = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
  writePythiaPackageJson(target, pkgJson.name ?? 'project', frameworkVersion, dryRun);

  const manifestData = {
    frameworkVersion,
    migratedVersion: migrationBaseline,
    installedAt: existingManifest?.installedAt ?? new Date().toISOString(),
    surfaces: activeSurfaces,
    gitStrategy,
    installedSkills: packageSkillNames(packageRoot),
    generated: manifest,
  };
  if (existingManifest?.registryCheck) manifestData.registryCheck = existingManifest.registryCheck;
  writeManifest(target, manifestData, dryRun);

  await applyMigrations(
    packageRoot,
    target,
    { ...manifestData, migratedVersion: migrationBaseline },
    dryRun,
    noMigrate,
    label
  );

  if (!dryRun && (label === 'update' || label === 'init')) {
    warnMissingCheckers(target, label);
  }
  if (!dryRun && label === 'update') {
    const registryCheck = refreshRegistryCheck(target, {
      dryRun: false,
      force: true,
      fetchLatest: registryFetch,
    });
    printRegistryUpdateNotice(target, frameworkVersion, registryCheck);
  }
}

async function applyMigrations(packageRoot, target, manifest, dryRun, noMigrate, label = 'update') {
  const { inPendingRange, sortVersions } = await import('../migrate/semver.js').catch(() => ({}));
  const { findUnresolvedMixedStates, writeState, readState } = await import('../migrate/state.js').catch(() => ({}));
  const { parseMigration, migrationHasLlm } = await import('../migrate/parse.js').catch(() => ({}));
  const { runOp } = await import('../migrate/ops.js').catch(() => ({}));

  const { commitMigrationVersion } = await import('../migrate/commit.js').catch(() => ({}));

  if (!inPendingRange || !findUnresolvedMixedStates) return;

  const migratedVersion = manifest.migratedVersion ?? '0.0.0';
  const frameworkVersion = manifest.frameworkVersion;
  const migrationsDir = join(target, '.pythia', 'runtime', 'migrations');

  if (!existsSync(migrationsDir)) return;

  const files = readdirSync(migrationsDir).filter((f) => /^\d+\.\d+\.\d+\.md$/.test(f));
  const versions = sortVersions(files.map((f) => f.replace('.md', '')));
  const pending = versions.filter((v) => inPendingRange(v, migratedVersion, frameworkVersion));

  if (pending.length === 0) {
    if (!dryRun && migratedVersion !== frameworkVersion) {
      writeManifest(target, { migratedVersion: frameworkVersion }, dryRun);
    }
    return;
  }

  if (noMigrate) {
    for (const v of pending) console.log(`[update] pending migration: ${v} (skipped by --no-migrate)`);
    return;
  }

  let completedAllPending = true;

  for (const v of pending) {
    const migPath = join(migrationsDir, `${v}.md`);
    const migContent = readFileSync(migPath, 'utf8');
    const steps = parseMigration(migContent);
    const autoSteps = steps.filter((s) => s.kind === 'auto');
    const llmRemaining = migrationHasLlm(steps);

    console.log(`[${label}] applying migration ${v}${llmRemaining ? ' (mixed: auto part only)' : ''}...`);

    const backups = [];
    const changedPaths = [];
    const appliedSteps = [];
    let failed = false;

    for (const step of autoSteps) {
      try {
        const result = runOp(target, step.op, backups, dryRun, v);
        if (result.changedPath) changedPaths.push(result.changedPath);
        appliedSteps.push(step.stepNum);
        console.log(`  step ${step.stepNum}: ${result.status}`);
      } catch (err) {
        console.error(`  step ${step.stepNum} FAILED: ${err.message}`);
        failed = true;
        break;
      }
    }

    const state = {
      migrationVersion: v,
      frameworkVersion,
      changedPaths,
      appliedSteps,
      llmRemaining,
      backups,
    };

    if (!dryRun) writeState(target, state, dryRun);

    if (failed) {
      // Restore from backups
      console.error(`[${label}] migration ${v} failed — restoring...`);
      if (!dryRun) {
        for (const entry of backups) {
          const backupAbs = join(target, entry.backupPath);
          const targetAbs = join(target, entry.path);
          if (existsSync(backupAbs)) {
            mkdirSync(dirname(targetAbs), { recursive: true });
            cpSync(backupAbs, targetAbs, { force: true });
            console.log(`  restored: ${entry.path}`);
          }
        }
      }
      throw new Error(`Migration ${v} failed — restored from backup. No version bump.`);
    }

    if (!llmRemaining) {
      const verifyScript = join(target, '.pythia', 'runtime', 'migrate', 'verify.js');
      if (!dryRun) {
        if (existsSync(verifyScript)) {
          const verifyResult = spawnSync('node', [verifyScript, v], { encoding: 'utf8' });
          if (verifyResult.stdout) process.stdout.write(verifyResult.stdout);
          if (verifyResult.stderr) process.stderr.write(verifyResult.stderr);
          if (verifyResult.status !== 0) {
            console.error(`[${label}] migration ${v} verify failed — restoring...`);
            for (const entry of backups) {
              const backupAbs = join(target, entry.backupPath);
              const targetAbs = join(target, entry.path);
              if (existsSync(backupAbs)) {
                mkdirSync(dirname(targetAbs), { recursive: true });
                cpSync(backupAbs, targetAbs, { force: true });
              }
            }
            throw new Error(`Migration ${v} verify failed. Restored. No version bump.`);
          }
        } else {
          for (const p of changedPaths) {
            if (!existsSync(join(target, p))) {
              throw new Error(`Migration ${v} verify: ${p} does not exist`);
            }
          }
        }
        if (commitMigrationVersion) {
          commitMigrationVersion(target, v, { dryRun: false });
        } else {
          writeManifest(target, { migratedVersion: v }, dryRun);
          writeState(target, { ...state, llmRemaining: false }, dryRun);
        }
      }
      console.log(
        `[${label}] migration ${v}: ${dryRun ? 'would commit' : 'committed'} (migratedVersion → ${v})`
      );
    } else {
      console.log(
        `[${label}] migration ${v}: auto steps applied; deep migration pending — run the migrate skill to complete`
      );
      completedAllPending = false;
      break;
    }
  }

  if (completedAllPending && !dryRun) {
    writeManifest(target, { migratedVersion: frameworkVersion }, dryRun);
  }
}

// Resolve which surfaces (LLM hosts) and git strategy to use, for both init and update,
// regardless of caller (explicit subcommand or the CLI's auto-detect path):
//   1. explicit CLI flag (opts.surfaces / opts.gitStrategy) → use it
//   2. else existing manifest value → use it
//   3. else interactive TTY (no --yes/--dry-run) → prompt, showing the default as the suggested answer
//   4. else (non-interactive: --yes, --dry-run, or no TTY) → apply the documented default
// There is no path where a default applies without one of (1)-(4) — defaulting always
// requires either an explicit flag, a preserved manifest value, an interactive answer,
// or an explicit non-interactive acceptance (--yes / piped invocation).
async function resolveSurfacesAndGit(existing, opts) {
  let surfaces = opts.surfaces ?? existing?.surfaces;
  let gitStrategy = opts.gitStrategy ?? existing?.gitStrategy;
  if (surfaces && gitStrategy) return { surfaces, gitStrategy };

  const interactive = process.stdin.isTTY && !opts.yes && !opts.dryRun;
  if (interactive) {
    const { createInterface } = await import('readline/promises');
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
      if (!surfaces) {
        const ans = await rl.question('Surfaces to install [claude,codex,cursor] (default: claude,codex): ');
        surfaces = ans.trim() ? parseSurfacesList(ans.trim()) : [...DEFAULT_SURFACES];
      }
      if (!gitStrategy) {
        const ans = await rl.question('Git strategy [shared|pythia|ignore] (default: pythia): ');
        const valid = ['shared', 'pythia', 'ignore'];
        gitStrategy = ans.trim() && valid.includes(ans.trim()) ? ans.trim() : 'pythia';
      }
    } finally {
      rl.close();
    }
  }
  // Non-interactive (or unanswered) defaults
  if (!surfaces) surfaces = [...DEFAULT_SURFACES];
  if (!gitStrategy) gitStrategy = 'pythia';
  return validateGitStrategy(opts.target, surfaces, gitStrategy);
}

// `shared` requires a git repo already at target; fall back to `ignore` if absent.
function validateGitStrategy(target, surfaces, gitStrategy) {
  if (gitStrategy === 'shared') {
    const r = spawnSync('git', ['-C', target, 'rev-parse', '--git-dir'], { encoding: 'utf8' });
    if (r.status !== 0) {
      console.warn(`  [git] shared strategy requires a git repo in target; falling back to ignore`);
      gitStrategy = 'ignore';
    }
  }
  return { surfaces, gitStrategy };
}

function parseSurfacesList(str) {
  const out = [];
  for (const p of str.split(',').map((s) => s.trim().toLowerCase())) {
    if (SURFACE_KEY_MAP[p]) out.push(SURFACE_KEY_MAP[p]);
  }
  return out.length ? out : [...DEFAULT_SURFACES];
}

// Apply git-strategy side effect: pythia → ensure local .pythia/.git exists.
function ensureGitStrategy(target, gitStrategy, dryRun) {
  if (dryRun || gitStrategy !== 'pythia') return;
  const pythiaGitDir = join(target, '.pythia', '.git');
  if (existsSync(pythiaGitDir)) return;
  mkdirSync(join(target, '.pythia'), { recursive: true });
  const r = spawnSync('git', ['init', join(target, '.pythia')], { encoding: 'utf8' });
  if (r.status === 0) console.log(`  [git] initialized .pythia/.git`);
}

export async function doUpdate(opts) {
  const { target, dryRun, packageRoot, noMigrate = false } = opts;

  try {
    const { findUnresolvedMixedStates } = await import('../migrate/state.js');
    const unresolved = findUnresolvedMixedStates(target);
    if (unresolved.length > 0) {
      for (const s of unresolved) {
        console.error(`[update] BLOCKED: migration ${s.migrationVersion} has unresolved llm steps.`);
        console.error(`  Run the migrate skill to commit or restore version ${s.migrationVersion} before updating.`);
        console.error(`  Command: npm --prefix .pythia run migrate:restore -- ${s.migrationVersion}`);
        console.error(`         or: npm --prefix .pythia run migrate:commit -- ${s.migrationVersion}`);
      }
      if (!dryRun) process.exit(1);
      return;
    }
  } catch {
    /* state module not available yet */
  }

  const existing = readManifest(target);
  const existingGenerated = existing?.generated ?? {};
  const adopted = hasProtectedArtifacts(target);
  const frameworkVersion = readPackageVersion(packageRoot);
  const migrationBaseline = existing?.migratedVersion ?? '0.0.0';
  const { surfaces: activeSurfaces, gitStrategy } = await resolveSurfacesAndGit(existing, opts);
  const previousInstalled = existing?.installedSkills ?? [];

  console.log(`[update] target: ${target}`);

  if (adopted && !pythiaGitHasCommits(target)) {
    createPreUpdateBackup(target, dryRun, 'adopted workspace without committed .pythia git history');
  }

  await finalizeWorkspaceLifecycle({
    target,
    packageRoot,
    dryRun,
    surfaces: activeSurfaces,
    gitStrategy,
    existingManifest: existing,
    migrationBaseline,
    noMigrate,
    registryFetch: opts.registryFetch,
    label: 'update',
    previousInstalled,
    existingGenerated,
  });

  console.log(`[update] done${dryRun ? ' (dry-run)' : ''}`);
}

function removePythiaHooksFromSettings(settingsPath, dryRun, label) {
  if (!existsSync(settingsPath)) return 0;
  let settings;
  try {
    settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
  } catch {
    return 0;
  }
  if (!settings.hooks) return 0;

  let removed = 0;
  for (const event of Object.keys(settings.hooks)) {
    const before = settings.hooks[event].length;
    settings.hooks[event] = settings.hooks[event].filter((h) => !isPythiaManagedHookEntry(h));
    removed += before - settings.hooks[event].length;
  }

  if (removed > 0) {
    if (dryRun) {
      console.log(`  [uninstall] would remove pythia hooks from ${label} (${removed} entries)`);
    } else {
      writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
      console.log(`  removed pythia hooks from ${label}`);
    }
  }
  return removed;
}

/**
 * Remove pythia-managed surfaces, runtime, hooks, and manifest from a workspace.
 * Preserves .pythia/workflows/ and user-added skills not in installedSkills.
 * @returns {number} exit code (0 success, 1 partial failure)
 */
export async function doUninstall({ target, dryRun = false, yes = false }) {
  if (!isWorkspace(target)) {
    console.log('not a pythia workspace');
    return 0;
  }

  if (!yes && !dryRun) {
    if (!process.stdin.isTTY) {
      console.error('[uninstall] error: non-interactive uninstall requires --yes (or use --dry-run to preview)');
      return 1;
    }
    const { createInterface } = await import('readline/promises');
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    let answer;
    try {
      answer = await rl.question(
        'This will remove managed surfaces and runtime. .pythia/workflows/ will be preserved. Continue? [y/N] '
      );
    } finally {
      rl.close();
    }
    const normalized = (answer ?? '').trim().toLowerCase();
    if (normalized !== 'y' && normalized !== 'yes') return 0;
  }

  const manifest = readManifest(target);
  if (!manifest) {
    console.error('[uninstall] error: manifest missing or unparseable — nothing removed');
    return 1;
  }

  console.log(`[uninstall] target: ${target}${dryRun ? ' (dry-run)' : ''}`);

  const generated = manifest.generated ?? {};
  const surfaces = manifest.surfaces ?? [];
  const installedSkills = manifest.installedSkills ?? [];
  let hadErrors = false;

  for (const relpath of Object.keys(generated)) {
    const dest = join(target, relpath);
    if (dryRun) {
      console.log(`  [uninstall] would remove: ${relpath}`);
    } else {
      try {
        if (existsSync(dest)) {
          rmSync(dest, { force: true });
          console.log(`  removed: ${relpath}`);
        }
      } catch (err) {
        console.warn(`  [uninstall] warning: could not remove ${relpath}: ${err.message}`);
        hadErrors = true;
      }
    }
  }

  for (const surface of surfaces) {
    for (const skill of installedSkills) {
      const skillPath = join(target, surface, skill);
      if (!existsSync(skillPath)) continue;
      if (dryRun) {
        console.log(`  [uninstall] would remove: ${surface}/${skill}`);
      } else {
        try {
          rmSync(skillPath, { recursive: true, force: true });
          console.log(`  removed: ${surface}/${skill}`);
        } catch (err) {
          console.warn(`  [uninstall] warning: could not remove ${surface}/${skill}: ${err.message}`);
          hadErrors = true;
        }
      }
    }
  }

  const runtimeDir = join(target, '.pythia', 'runtime');
  if (dryRun) {
    console.log('  [uninstall] would remove: .pythia/runtime/');
  } else if (existsSync(runtimeDir)) {
    try {
      rmSync(runtimeDir, { recursive: true, force: true });
      console.log('  removed: .pythia/runtime/');
    } catch (err) {
      console.warn(`  [uninstall] warning: could not remove .pythia/runtime/: ${err.message}`);
      hadErrors = true;
    }
  }

  removePythiaHooksFromSettings(join(target, '.claude', 'settings.json'), dryRun, '.claude/settings.json');
  removePythiaHooksFromSettings(join(target, 'hooks.json'), dryRun, 'hooks.json');
  removePythiaHooksFromSettings(join(target, '.cursor', 'hooks.json'), dryRun, '.cursor/hooks.json');

  const codexRulesPath = join(target, '.codex', 'rules', 'default.rules');
  if (existsSync(codexRulesPath)) {
    try {
      const content = readFileSync(codexRulesPath, 'utf8');
      if (content.startsWith('# Pythia workspace guardrails\n')) {
        if (dryRun) {
          console.log('  [uninstall] would remove: .codex/rules/default.rules');
        } else {
          rmSync(codexRulesPath, { force: true });
          console.log('  removed: .codex/rules/default.rules');
        }
      }
    } catch (err) {
      console.warn(`  [uninstall] warning: could not remove .codex/rules/default.rules: ${err.message}`);
      hadErrors = true;
    }
  }

  for (const rel of ['.pythia/manifest.json', '.pythia/version.json']) {
    const dest = join(target, rel);
    if (dryRun) {
      console.log(`  [uninstall] would remove: ${rel}`);
    } else if (existsSync(dest)) {
      try {
        rmSync(dest, { force: true });
        console.log(`  removed: ${rel}`);
      } catch (err) {
        console.warn(`  [uninstall] warning: could not remove ${rel}: ${err.message}`);
        hadErrors = true;
      }
    }
  }

  console.log('[uninstall] done. .pythia/workflows/ preserved.');
  return hadErrors ? 1 : 0;
}
