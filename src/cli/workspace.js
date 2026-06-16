import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, cpSync, readdirSync, rmSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
export { readManifest, writeManifest } from '../../scripts/migrate/manifest.js';
import { readManifest, writeManifest } from '../../scripts/migrate/manifest.js';

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

const DEFAULT_SURFACES = ['.claude/skills', '.agents/skills'];

const SUBSTITUTIONS = [
  { file: 'AGENTS.md', tool: 'Codex', skillsPath: '.agents/skills' },
  { file: 'CLAUDE.md', tool: 'Claude Code', skillsPath: '.claude/skills' },
];

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
  seedIfMissing(target, '.pythia/config.md', readFileSync(join(baseDir, 'config.md'), 'utf8'), dryRun);
  seedIfMissing(target, '.pythia/README.md', readFileSync(join(baseDir, 'README.md'), 'utf8'), dryRun);
  seedIfMissing(target, '.pythia/workflows/.gitkeep', '', dryRun);

  // Render and write instruction files based on surfaces
  const surfaceMap = {
    claude: { file: 'CLAUDE.md', tool: 'Claude Code', skillsPath: '.claude/skills', dir: '.claude/skills' },
    codex: { file: 'AGENTS.md', tool: 'Codex', skillsPath: '.agents/skills', dir: '.agents/skills' },
  };

  const manifest = {};
  const activeSurfaces = [];
  for (const sub of SUBSTITUTIONS) {
    const surfaceKey = sub.file === 'CLAUDE.md' ? 'claude' : 'codex';
    const surfaceDef = surfaceMap[surfaceKey];
    if (!surfaces.includes(surfaceDef.dir)) continue;
    const content = renderInstructions(instructionSource, sub.tool, sub.skillsPath);
    const hash = writeManaged(target, sub.file, content, {}, dryRun);
    manifest[sub.file] = dryRun ? sha256(content) : hash;
    activeSurfaces.push(surfaceDef.dir);
  }

  // Install skills to selected surfaces
  installSkills(packageRoot, target, activeSurfaces, dryRun);

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
  const engineSrc = join(packageRoot, 'scripts', 'migrate');
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
    // Write .pythia/.gitignore (runtime + backups are always local)
    const gitignorePath = join(target, '.pythia', '.gitignore');
    const gitignoreContent = 'runtime/\nbackups/\n';
    if (!existsSync(gitignorePath) || !readFileSync(gitignorePath, 'utf8').includes('runtime/')) {
      mkdirSync(dirname(gitignorePath), { recursive: true });
      writeFileSync(gitignorePath, gitignoreContent, 'utf8');
    }
  } else {
    console.log(`  [materialize] .pythia/runtime/ (engine + migrations)`);
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

async function applyMigrations(packageRoot, target, manifest, dryRun, noMigrate) {
  const { inPendingRange, sortVersions } = await import('../../scripts/migrate/semver.js').catch(() => ({}));
  const { findUnresolvedMixedStates, writeState, readState } = await import('../../scripts/migrate/state.js').catch(() => ({}));
  const { parseMigration, migrationHasLlm } = await import('../../scripts/migrate/parse.js').catch(() => ({}));
  const { runOp } = await import('../../scripts/migrate/ops.js').catch(() => ({}));

  if (!inPendingRange || !findUnresolvedMixedStates) return; // engine not available

  const migratedVersion = manifest.migratedVersion ?? '0.0.0';
  const frameworkVersion = manifest.frameworkVersion;
  const migrationsDir = join(target, '.pythia', 'runtime', 'migrations');

  if (!existsSync(migrationsDir)) return;

  const files = readdirSync(migrationsDir).filter((f) => /^\d+\.\d+\.\d+\.md$/.test(f));
  const versions = sortVersions(files.map((f) => f.replace('.md', '')));
  const pending = versions.filter((v) => inPendingRange(v, migratedVersion, frameworkVersion));

  if (pending.length === 0) return;

  if (noMigrate) {
    for (const v of pending) console.log(`[update] pending migration: ${v} (skipped by --no-migrate)`);
    return;
  }

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
    }
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
  const valid = { claude: '.claude/skills', codex: '.agents/skills' };
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
    const { findUnresolvedMixedStates } = await import('../../scripts/migrate/state.js');
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

  // Resolve surfaces (which LLM hosts) + git strategy: manifest → use; missing → ask/default.
  const { surfaces: activeSurfaces, gitStrategy } = await resolveSurfacesAndGit(existing, opts);
  const previousInstalled = existing?.installedSkills ?? [];

  console.log(`[update] target: ${target}`);

  // git-strategy side effect (e.g. ensure local .pythia/.git for pythia strategy)
  ensureGitStrategy(target, gitStrategy, dryRun);

  // Seed base .pythia files for workspaces that never went through init
  // (e.g. an adopted/old .pythia/ updated one-step without a prior `init` run).
  const baseDir = join(assetsDir, 'base');
  seedIfMissing(target, '.pythia/config.md', readFileSync(join(baseDir, 'config.md'), 'utf8'), dryRun);
  seedIfMissing(target, '.pythia/README.md', readFileSync(join(baseDir, 'README.md'), 'utf8'), dryRun);
  seedIfMissing(target, '.pythia/workflows/.gitkeep', '', dryRun);

  // Managed refresh
  const manifest = {};
  for (const sub of SUBSTITUTIONS) {
    const surfaceKey = sub.file === 'CLAUDE.md' ? 'claude' : 'codex';
    const surfaceDir = surfaceKey === 'claude' ? '.claude/skills' : '.agents/skills';
    if (!activeSurfaces.includes(surfaceDir)) continue;
    const content = renderInstructions(instructionSource, sub.tool, sub.skillsPath);
    const hash = writeManaged(target, sub.file, content, existingGenerated, dryRun);
    manifest[sub.file] = hash;
  }

  pruneSkills(packageRoot, target, activeSurfaces, dryRun, previousInstalled);
  installSkills(packageRoot, target, activeSurfaces, dryRun);

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
  const migratedVersion = existing?.migratedVersion ?? (adopted ? '0.0.0' : frameworkVersion);
  const manifestData = {
    frameworkVersion,
    migratedVersion,
    installedAt: new Date().toISOString(),
    surfaces: activeSurfaces,
    gitStrategy,
    installedSkills: packageSkillNames(packageRoot),
    generated: manifest,
  };
  writeManifest(target, manifestData, dryRun);

  // Apply migrations
  const updatedManifest = readManifest(target);
  if (updatedManifest) {
    await applyMigrations(packageRoot, target, updatedManifest, dryRun, noMigrate);
  }

  console.log(`[update] done${dryRun ? ' (dry-run)' : ''}`);
}
