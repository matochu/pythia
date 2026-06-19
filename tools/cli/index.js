#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import { spawnSync } from 'child_process';
import { doInit, doUpdate, doUninstall, isWorkspace, isExistingWorkspace, readManifest } from './workspace.js';
import { doHealth } from './health.js';
import { refreshRegistryCheck, formatRegistryLine } from './registry-check.js';
import { loadZonesForBootstrap, deriveSurfacesAndSubstitutions, SURFACE_KEY_MAP, DEFAULT_SURFACE_PATHS } from '../lib/paths.js';

function findPackageRoot() {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  // Source path: src/cli/ → 2 levels up
  const fromSrc = resolve(currentDir, '../../');
  if (existsSync(resolve(fromSrc, 'package.json'))) return fromSrc;
  throw new Error('Cannot find package root from ' + currentDir);
}

const packageRoot = findPackageRoot();
const pkgVersion = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8')).version;

const _zones = loadZonesForBootstrap(packageRoot);
const { defaultSurfaces: _defaultSurfaces } = deriveSurfacesAndSubstitutions(_zones);
const _validSurfaces = { ...SURFACE_KEY_MAP };

const program = new Command();

program
  .name('pythia')
  .description('Workspace manager: provisions and refreshes AI agent workspaces')
  .version(pkgVersion);

program
  .command('init')
  .description('First-time provision of a workspace')
  .argument('[target-dir]', 'target directory', process.cwd())
  .option('--dry-run', 'print planned actions without writing anything')
  .option('--yes', 'non-interactive: use defaults')
  .option('--reconfigure', 'rerun interactive prompts even if already configured')
  .option('--surfaces <list>', 'comma-separated surfaces: claude,codex,cursor (default: claude,codex)')
  .option('--git-strategy <strategy>', 'git strategy: shared|pythia|ignore (default: pythia)')
  .action(async (targetDir, opts) => {
    const target = resolve(targetDir);
    let surfaces, gitStrategy;

    if (opts.surfaces) {
      surfaces = parseSurfaces(opts.surfaces);
    }
    if (opts.gitStrategy) {
      gitStrategy = opts.gitStrategy;
    }

    // Interactive prompts when TTY and not --yes and no explicit flags
    const isInteractive = process.stdin.isTTY && !opts.yes && !opts.dryRun;
    if (isInteractive && (!surfaces || !gitStrategy)) {
      const { createInterface } = await import('readline/promises');
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      try {
        if (!surfaces) {
          const ans = await rl.question('Surfaces to install [claude,codex,cursor] (default: claude,codex): ');
          surfaces = ans.trim() ? parseSurfaces(ans.trim()) : [..._defaultSurfaces];
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

    // `shared` requires a git repo already at target; fall back to `ignore` if absent.
    // The `pythia` side effect (git init .pythia/.git) is performed inside doInit itself,
    // so every caller (this command and the CLI's auto-detect path) gets it consistently.
    let effectiveGitStrategy = gitStrategy ?? 'pythia';
    if (!opts.dryRun && effectiveGitStrategy === 'shared') {
      const r = spawnSync('git', ['-C', target, 'rev-parse', '--git-dir'], { encoding: 'utf8' });
      if (r.status !== 0) {
        console.warn(`  [git] shared strategy requires a git repo in target; falling back to ignore`);
        effectiveGitStrategy = 'ignore';
      }
    }

    await doInit({
      target,
      dryRun: !!opts.dryRun,
      packageRoot,
      surfaces,
      gitStrategy: effectiveGitStrategy,
      yes: !!opts.yes,
      reconfigure: !!opts.reconfigure,
    });
  });

program
  .command('update')
  .description('Refresh an existing workspace')
  .argument('[target-dir]', 'target directory', process.cwd())
  .option('--dry-run', 'print planned actions without writing anything')
  .option('--yes', 'non-interactive: use defaults')
  .option('--no-migrate', 'skip migration application')
  .action((targetDir, opts) => {
    doUpdate({
      target: resolve(targetDir),
      dryRun: !!opts.dryRun,
      packageRoot,
      noMigrate: opts.migrate === false,
      yes: !!opts.yes,
    });
  });

program
  .command('uninstall')
  .description('Remove pythia-managed surfaces and runtime from a workspace')
  .argument('[target-dir]', 'target directory', process.cwd())
  .option('--dry-run', 'print planned actions without writing anything')
  .option('--yes', 'non-interactive: skip confirmation')
  .action(async (targetDir, opts) => {
    const code = await doUninstall({
      target: resolve(targetDir),
      dryRun: !!opts.dryRun,
      yes: !!opts.yes,
    });
    if (code !== 0) process.exit(code);
  });

program
  .command('health')
  .description('Check minimal workspace files, runtime, surfaces, and hook wiring')
  .argument('[target-dir]', 'target directory', process.cwd())
  .option('--json', 'machine-readable output')
  .action((targetDir, opts) => {
    const code = doHealth({ target: resolve(targetDir), json: !!opts.json });
    if (code !== 0) process.exit(code);
  });

program
  .command('version')
  .description('Show workspace state; may refresh manifest.registryCheck when npm cache is stale (24h)')
  .argument('[target-dir]', 'target directory', process.cwd())
  .action(async (targetDir) => {
    const target = resolve(targetDir);
    const manifest = readManifest(target);
    if (!manifest) {
      console.error(`not a pythia workspace at ${target}`);
      process.exit(1);
    }

    const { findUnresolvedMixedStates } = await import('../migrate/state.js').catch(() => ({}));
    const unresolved = findUnresolvedMixedStates ? findUnresolvedMixedStates(target) : [];
    const semverGap = manifest.frameworkVersion !== manifest.migratedVersion;
    const pendingCount = Math.max(unresolved.length, semverGap ? 1 : 0);
    const migrationsLine =
      pendingCount === 0 ? '0 pending' : `${pendingCount} pending (run update)`;

    const skillCount =
      manifest.installedSkills == null
        ? 'unknown'
        : `${manifest.installedSkills.length} installed`;

    const registryCheck = refreshRegistryCheck(target, { dryRun: false });

    console.log(`framework:  ${manifest.frameworkVersion ?? 'unknown'}`);
    console.log(`migrated:   ${manifest.migratedVersion ?? 'unknown'}`);
    console.log(`surfaces:   ${(manifest.surfaces ?? []).join(', ')}`);
    console.log(`skills:     ${skillCount}`);
    console.log(`migrations: ${migrationsLine}`);
    console.log(`registry:   ${formatRegistryLine(manifest.frameworkVersion, registryCheck)}`);
  });

function parseSurfaces(str) {
  const parts = str.split(',').map((s) => s.trim().toLowerCase());
  const result = [];
  for (const p of parts) {
    if (!_validSurfaces[p]) throw new Error(`Unknown surface: ${p}. Valid values: ${Object.keys(_validSurfaces).join(', ')}`);
    result.push(_validSurfaces[p]);
  }
  if (result.length === 0) throw new Error('At least one surface must be specified');
  return result;
}

// Auto-detect: no subcommand → init or update based on workspace detection
program.addHelpCommand(false);
program.exitOverride();

const rawArgs = process.argv.slice(2);
const knownCommands = ['init', 'update', 'uninstall', 'version', 'health'];
const firstArg = rawArgs.find((a) => !a.startsWith('-'));

if (!firstArg || !knownCommands.includes(firstArg)) {
  if (rawArgs.includes('--help') || rawArgs.includes('-h')) {
    program.outputHelp();
    process.exit(0);
  }
  if (rawArgs.includes('--version') || rawArgs.includes('-V')) {
    console.log(pkgVersion);
    process.exit(0);
  }

  // First positional non-flag arg is the target dir; default to cwd.
  const targetDir = firstArg ?? process.cwd();
  const dryRun = rawArgs.includes('--dry-run');
  const yes = rawArgs.includes('--yes');

  const target = resolve(targetDir);
  if (isExistingWorkspace(target)) {
    await doUpdate({ target, dryRun, packageRoot, yes });
  } else {
    await doInit({ target, dryRun, packageRoot, yes });
  }
} else {
  try {
    program.parse(process.argv);
  } catch (e) {
    if (e instanceof Error && e.code !== 'commander.helpDisplayed') {
      console.error(e.message);
      process.exit(1);
    }
  }
}
