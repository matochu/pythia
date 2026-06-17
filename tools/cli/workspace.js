import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, cpSync, readdirSync, rmSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { loadZones, deriveSurfacesAndSubstitutions } from '../lib/paths.js';
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

function renderInstructions(source, tool, skillsPath) {
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
const _registryZones = loadZones(_packageRoot);
const { surfaces: DEFAULT_SURFACES, substitutions: SUBSTITUTIONS } = deriveSurfacesAndSubstitutions(_registryZones);

export async function doInit(opts) {
  const { target, dryRun, packageRoot, reconfigure = false, yes = false } = opts;

  // On re-run without --reconfigure, preserve existing surfaces/gitStrategy; --reconfigure
  // forces a fresh resolution (explicit flag → interactive prompt → non-interactive default).
  const existingManifestData = readManifest(target);
  const { surfaces, gitStrategy } = await resolveSurfacesAndGit(
    reconfigure ? null : existingManifestData,
    { ...opts, yes }
  );
  const assetsDir = join(packageRoot, 'assets');
  if (!existsSync(assetsDir)) throw new Error(`assets/ not found at ${assetsDir}`);
  if (!existsSync(join(packageRoot, 'skills'))) throw new Error(`skills/ not found at ${join(packageRoot, 'skills')}`);

  const instructionSource = readFileSync(join(assetsDir, 'instructions.md'), 'utf8');
  const frameworkVersion = readPackageVersion(packageRoot);

  // Determine if this is a fresh empty init or an adopted workspace — must run
  // before any writes (ensureGitStrategy, seeding) touch .pythia/.
  const adopted = hasProtectedArtifacts(target);
  const migratedVersion = adopted ? '0.0.0' : frameworkVersion;

  console.log(`[init] target: ${target}${adopted ? ' (adopted)' : ''}`);

  // git-strategy side effect — centralized here so every caller (explicit `init`
  // command and the CLI's auto-detect path, which calls doInit directly) gets it.
  ensureGitStrategy(target, gitStrategy, dryRun);

  // Seed base .pythia files
  const baseDir = join(assetsDir, 'base');
  seedIfMissing(target, '.pythia/config/settings.md', readFileSync(join(baseDir, 'config/settings.md'), 'utf8'), dryRun);
  seedIfMissing(target, '.pythia/README.md', readFileSync(join(baseDir, 'README.md'), 'utf8'), dryRun);
  seedIfMissing(target, '.pythia/config/paths.md', readFileSync(join(baseDir, 'config/paths.md'), 'utf8'), dryRun);
  seedIfMissing(target, '.pythia/workflows/.gitkeep', '', dryRun);

  // Render and write instruction files based on surfaces
  const manifest = {};
  const activeSurfaces = [];
  for (const sub of SUBSTITUTIONS) {
    if (!surfaces.includes(sub.skillsPath)) continue;
    const content = renderInstructions(instructionSource, sub.tool, sub.skillsPath);
    const hash = writeManaged(target, sub.file, content, {}, dryRun);
    manifest[sub.file] = dryRun ? sha256(content) : hash;
    activeSurfaces.push(sub.skillsPath);
  }

  // Install skills to selected surfaces
  installSkills(packageRoot, target, activeSurfaces, dryRun);

  // Install hooks (tools/{lib,checks,hooks} into .pythia/runtime; wiring into settings.json/hooks.json)
  installHooks(packageRoot, target, activeSurfaces, dryRun);

  // Write manifest.json
  const manifestData = {
    frameworkVersion,
    migratedVersion,
    installedAt: existingManifestData?.installedAt ?? new Date().toISOString(),
    surfaces: activeSurfaces,
    gitStrategy,
    installedSkills: packageSkillNames(packageRoot),
    generated: manifest,
  };
  writeManifest(target, manifestData, dryRun);

  if (adopted) {
    console.log(`[init] adopted workspace — migratedVersion set to 0.0.0; run update to apply migrations`);
  }
  console.log(`[init] done${dryRun ? ' (dry-run)' : ''}`);
}

function materializeRuntime(packageRoot, target, dryRun) {
  const engineSrc = join(packageRoot, 'tools', 'migrate');
  const migrationsSrc = join(packageRoot, 'assets', 'migrations');
  const runtimeDir = join(target, '.pythia', 'runtime');
  const engineDst = join(runtimeDir, 'migrate');
  const migrationsDst = join(runtimeDir, 'migrations');

  if (!existsSync(engineSrc)) return; // no engine yet (early dev)

  if (!dryRun) {
    // Copy engine scripts
    {
      mkdirSync(engineDst, { recursive: true });
      cpSync(engineSrc, engineDst, { recursive: true, force: true, filter: (src) => !src.includes('__tests__') });
    }
    // Copy versioned migration files (exclude next.md)
    if (existsSync(migrationsSrc)) {
      mkdirSync(migrationsDst, { recursive: true });
      for (const f of readdirSync(migrationsSrc)) {
        if (/^\d+\.\d+\.\d+\.md$/.test(f)) {
          cpSync(join(migrationsSrc, f), join(migrationsDst, f), { force: true });
        }
      }
    }
    // .pythia/.gitignore is written by installHooks (which runs before materializeRuntime)
  } else {
    console.log(`  [materialize] .pythia/runtime/ (engine + migrations)`);
  }
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

function installHooks(packageRoot, target, surfaces, dryRun) {
  const hooksRuntimeDir = join(target, '.pythia', 'runtime', 'hooks');
  const hooksSourceDir = join(packageRoot, 'tools', 'hooks');
  const libSourceDir = join(packageRoot, 'tools', 'lib');
  const checksSourceDir = join(packageRoot, 'tools', 'checks');
  if (!existsSync(hooksSourceDir)) return;

  if (dryRun) {
    console.log('  [hooks] install tools/{lib,checks,hooks} → .pythia/runtime/');
    return;
  }

  // Always materialize runtime: copy lib/checks/hooks/inputs.js into .pythia/runtime/
  const runtimeDir = join(target, '.pythia', 'runtime');
  for (const [src, dst] of [
    [libSourceDir, join(runtimeDir, 'lib')],
    [checksSourceDir, join(runtimeDir, 'checks')],
    [hooksSourceDir, join(runtimeDir, 'hooks')],
  ]) {
    if (existsSync(src)) {
      mkdirSync(dst, { recursive: true });
      cpSync(src, dst, { recursive: true, force: true, filter: (s) => !s.includes('/tests/') && !s.includes('/__tests__/') });
    }
  }
  const inputsSrc = join(packageRoot, 'tools', 'bin', 'inputs.js');
  if (existsSync(inputsSrc)) {
    mkdirSync(runtimeDir, { recursive: true });
    cpSync(inputsSrc, join(runtimeDir, 'inputs.js'), { force: true });
  }
  const hooksDir = join(runtimeDir, 'hooks');
  ensurePythiaGitignore(target, dryRun);

  const hooksAbsDir = resolve(hooksDir);

  // Install Claude hooks into .claude/settings.json (idempotent, marker-based merge)
  if (surfaces.some((s) => s.includes('claude'))) {
    mergeClaudeHooks(packageRoot, target, hooksAbsDir, dryRun);
  }

  // Install Codex hooks.json (idempotent, marker-based merge)
  if (surfaces.some((s) => s.includes('agents'))) {
    installCodexHooks(packageRoot, target, hooksAbsDir, dryRun);
  }

  // Install .codex/rules/default.rules
  const rulesTemplate = join(packageRoot, 'tools', 'hooks', 'wiring', 'codex-rules', 'default.rules');
  if (existsSync(rulesTemplate)) {
    const codexRulesDir = join(target, '.codex', 'rules');
    mkdirSync(codexRulesDir, { recursive: true });
    const rulesTarget = join(codexRulesDir, 'default.rules');
    if (!existsSync(rulesTarget)) {
      cpSync(rulesTemplate, rulesTarget);
      console.log('  installed: .codex/rules/default.rules');
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
    settings.hooks[event] = settings.hooks[event].filter((h) => {
      const json = JSON.stringify(h);
      return !json.includes('pythia-managed') && !(h._managed === 'pythia');
    });
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
    // Remove previously managed entries
    existing.hooks[event] = existing.hooks[event].filter((h) => h._managed !== 'pythia');
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

async function applyMigrations(packageRoot, target, manifest, dryRun, noMigrate) {
  const { inPendingRange, sortVersions } = await import('../migrate/semver.js').catch(() => ({}));
  const { findUnresolvedMixedStates, writeState, readState } = await import('../migrate/state.js').catch(() => ({}));
  const { parseMigration, migrationHasLlm } = await import('../migrate/parse.js').catch(() => ({}));
  const { runOp } = await import('../migrate/ops.js').catch(() => ({}));

  if (!inPendingRange || !findUnresolvedMixedStates) return; // engine not available

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

    console.log(`[update] applying migration ${v}${llmRemaining ? ' (mixed: auto part only)' : ''}...`);

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
      console.error(`[update] migration ${v} failed — restoring...`);
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
      // Fully auto: verify via materialized engine, then commit
      if (!dryRun) {
        const verifyScript = join(target, '.pythia', 'runtime', 'migrate', 'verify.js');
        if (existsSync(verifyScript)) {
          const verifyResult = spawnSync('node', [verifyScript, v], { encoding: 'utf8' });
          if (verifyResult.stdout) process.stdout.write(verifyResult.stdout);
          if (verifyResult.stderr) process.stderr.write(verifyResult.stderr);
          if (verifyResult.status !== 0) {
            console.error(`[update] migration ${v} verify failed — restoring...`);
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
          // Runtime not yet materialized (early dev): fallback existence check
          for (const p of changedPaths) {
            if (!existsSync(join(target, p))) {
              throw new Error(`Migration ${v} verify: ${p} does not exist`);
            }
          }
        }
        writeManifest(target, { migratedVersion: v }, dryRun);
        writeState(target, { ...state, llmRemaining: false }, dryRun);
      }
      console.log(`[update] migration ${v}: committed (migratedVersion → ${v})`);
    } else {
      // Mixed: announce, do NOT verify or restore
      console.log(`[update] migration ${v}: auto steps applied; deep migration pending — run the migrate skill to complete`);
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
        const ans = await rl.question('Surfaces to install [claude,codex] (default: both): ');
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
  // Build key→path map from registry (e.g. { claude: '.claude/skills', codex: '.agents/skills' })
  const valid = Object.fromEntries(
    DEFAULT_SURFACES.map((p) => {
      const key = p.includes('claude') ? 'claude' : p.includes('agents') ? 'codex' : p.split('/').pop();
      return [key, p];
    })
  );
  const out = [];
  for (const p of str.split(',').map((s) => s.trim().toLowerCase())) {
    if (valid[p]) out.push(valid[p]);
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
  const assetsDir = join(packageRoot, 'assets');
  if (!existsSync(assetsDir)) throw new Error(`assets/ not found at ${assetsDir}`);
  if (!existsSync(join(packageRoot, 'skills'))) throw new Error(`skills/ not found at ${join(packageRoot, 'skills')}`);

  const instructionSource = readFileSync(join(assetsDir, 'instructions.md'), 'utf8');
  const frameworkVersion = readPackageVersion(packageRoot);

  // Check for unresolved mixed state BEFORE managed refresh
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
  } catch { /* state module not available yet */ }

  const existing = readManifest(target);
  const existingGenerated = existing?.generated ?? {};

  // Capture adoption state BEFORE any writes below (ensureGitStrategy, seeding) touch .pythia/.
  const adopted = hasProtectedArtifacts(target);
  const migrationBaseline = existing?.migratedVersion ?? (adopted ? '0.0.0' : frameworkVersion);
  const migrationPlanManifest = {
    ...(existing ?? {}),
    frameworkVersion,
    migratedVersion: migrationBaseline,
  };

  // Resolve surfaces (which LLM hosts) + git strategy: manifest → use; missing → ask/default.
  const { surfaces: activeSurfaces, gitStrategy } = await resolveSurfacesAndGit(existing, opts);
  const previousInstalled = existing?.installedSkills ?? [];

  console.log(`[update] target: ${target}`);

  if (adopted && !pythiaGitHasCommits(target)) {
    createPreUpdateBackup(target, dryRun, 'adopted workspace without committed .pythia git history');
  }

  // git-strategy side effect (e.g. ensure local .pythia/.git for pythia strategy)
  ensureGitStrategy(target, gitStrategy, dryRun);

  // Seed base .pythia files for workspaces that never went through init
  // (e.g. an adopted/old .pythia/ updated one-step without a prior `init` run).
  const baseDir = join(assetsDir, 'base');
  seedIfMissing(target, '.pythia/config/settings.md', readFileSync(join(baseDir, 'config/settings.md'), 'utf8'), dryRun);
  seedIfMissing(target, '.pythia/README.md', readFileSync(join(baseDir, 'README.md'), 'utf8'), dryRun);
  seedIfMissing(target, '.pythia/config/paths.md', readFileSync(join(baseDir, 'config/paths.md'), 'utf8'), dryRun);
  seedIfMissing(target, '.pythia/workflows/.gitkeep', '', dryRun);

  // Managed refresh
  const manifest = {};
  for (const sub of SUBSTITUTIONS) {
    if (!activeSurfaces.includes(sub.skillsPath)) continue;
    const content = renderInstructions(instructionSource, sub.tool, sub.skillsPath);
    const hash = writeManaged(target, sub.file, content, existingGenerated, dryRun);
    manifest[sub.file] = hash;
  }

  pruneSkills(packageRoot, target, activeSurfaces, dryRun, previousInstalled);
  installSkills(packageRoot, target, activeSurfaces, dryRun);

  // Install hooks (tools/{lib,checks,hooks} into .pythia/runtime; wiring into settings.json/hooks.json)
  installHooks(packageRoot, target, activeSurfaces, dryRun);

  // Materialize .pythia/runtime/ pinned to frameworkVersion
  materializeRuntime(packageRoot, target, dryRun);

  // Derive project name for .pythia/package.json
  const pkgJson = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
  const projectName = pkgJson.name ?? 'project';
  writePythiaPackageJson(target, projectName, frameworkVersion, dryRun);

  // Write manifest.json preserving long-lived fields.
  // migratedVersion baseline: preserve if already set; otherwise establish one now —
  // an old .pythia without a manifest (adopted, with pre-existing content) starts
  // at 0.0.0 so future migrations apply to it; a workspace with no pre-existing
  // content at all is already current (mirrors doInit's adoption logic).
  const manifestData = {
    frameworkVersion,
    migratedVersion: migrationBaseline,
    installedAt: new Date().toISOString(),
    surfaces: activeSurfaces,
    gitStrategy,
    installedSkills: packageSkillNames(packageRoot),
    generated: manifest,
  };
  writeManifest(target, manifestData, dryRun);

  // Apply migrations from the pre-update committed baseline toward this package version.
  await applyMigrations(packageRoot, target, migrationPlanManifest, dryRun, noMigrate);

  console.log(`[update] done${dryRun ? ' (dry-run)' : ''}`);
}
