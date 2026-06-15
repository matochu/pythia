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

export function sha256(content) {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

function hasProtectedArtifacts(target) {
  const workflowsDir = join(target, '.pythia', 'workflows');
  if (!existsSync(workflowsDir)) return false;
  const entries = readdirSync(workflowsDir);
  return entries.some((e) => e !== '.gitkeep');
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

function pruneSkills(packageRoot, target, surfaces, dryRun) {
  const skillsSource = join(packageRoot, 'skills');
  if (!existsSync(skillsSource)) return;
  const sourceSkills = new Set(readdirSync(skillsSource));
  for (const surface of surfaces) {
    const dest = join(target, surface);
    if (!existsSync(dest)) continue;
    for (const entry of readdirSync(dest)) {
      if (!sourceSkills.has(entry)) {
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

const DEFAULT_SURFACES = ['.claude/skills', '.agents/skills'];

const SUBSTITUTIONS = [
  { file: 'AGENTS.md', tool: 'Codex', skillsPath: '.agents/skills' },
  { file: 'CLAUDE.md', tool: 'Claude Code', skillsPath: '.claude/skills' },
];

export function doInit(opts) {
  const { target, dryRun, packageRoot, reconfigure = false, yes = false } = opts;

  // On re-run without --reconfigure, preserve existing surfaces/gitStrategy
  const existingManifestData = readManifest(target);
  const surfaces = opts.surfaces ?? ((!reconfigure && existingManifestData?.surfaces) || DEFAULT_SURFACES);
  const gitStrategy = opts.gitStrategy ?? ((!reconfigure && existingManifestData?.gitStrategy) || 'ignore');
  const assetsDir = join(packageRoot, 'assets');
  if (!existsSync(assetsDir)) throw new Error(`assets/ not found at ${assetsDir}`);
  if (!existsSync(join(packageRoot, 'skills'))) throw new Error(`skills/ not found at ${join(packageRoot, 'skills')}`);

  const instructionSource = readFileSync(join(assetsDir, 'instructions.md'), 'utf8');
  const frameworkVersion = readPackageVersion(packageRoot);

  // Determine if this is a fresh empty init or an adopted workspace
  const adopted = hasProtectedArtifacts(target);
  const migratedVersion = adopted ? '0.0.0' : frameworkVersion;

  console.log(`[init] target: ${target}${adopted ? ' (adopted)' : ''}`);

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
      'migrate:status': 'node runtime/migrate/status.js --target ..',
      'migrate:apply': 'node runtime/migrate/apply.js --target ..',
      'migrate:verify': 'node runtime/migrate/verify.js --target ..',
      'migrate:commit': 'node runtime/migrate/commit.js --target ..',
      'migrate:restore': 'node runtime/migrate/restore.js --target ..',
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
          const verifyResult = spawnSync('node', [verifyScript, '--target', target, v], { encoding: 'utf8' });
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
  const existingSurfaces = existing?.surfaces ?? DEFAULT_SURFACES;

  console.log(`[update] target: ${target}`);

  // Managed refresh
  const manifest = {};
  for (const sub of SUBSTITUTIONS) {
    const surfaceKey = sub.file === 'CLAUDE.md' ? 'claude' : 'codex';
    const surfaceDir = surfaceKey === 'claude' ? '.claude/skills' : '.agents/skills';
    if (!existingSurfaces.includes(surfaceDir)) continue;
    const content = renderInstructions(instructionSource, sub.tool, sub.skillsPath);
    const hash = writeManaged(target, sub.file, content, existingGenerated, dryRun);
    manifest[sub.file] = hash;
  }

  pruneSkills(packageRoot, target, existingSurfaces, dryRun);
  installSkills(packageRoot, target, existingSurfaces, dryRun);

  // Materialize .pythia/runtime/ pinned to frameworkVersion
  materializeRuntime(packageRoot, target, dryRun);

  // Derive project name for .pythia/package.json
  const pkgJson = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
  const projectName = pkgJson.name ?? 'project';
  writePythiaPackageJson(target, projectName, frameworkVersion, dryRun);

  // Write manifest.json preserving long-lived fields
  const manifestData = {
    frameworkVersion,
    installedAt: new Date().toISOString(),
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
