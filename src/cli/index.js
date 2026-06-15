#!/usr/bin/env node
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import { spawnSync } from 'child_process';
import { doInit, doUpdate, isWorkspace } from './workspace.js';

function findPackageRoot() {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  // Source path: src/cli/ → 2 levels up
  const fromSrc = resolve(currentDir, '../../');
  if (existsSync(resolve(fromSrc, 'package.json'))) return fromSrc;
  throw new Error('Cannot find package root from ' + currentDir);
}

const packageRoot = findPackageRoot();
const pkgVersion = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8')).version;

const program = new Command();

program
  .name('pythia')
  .description('Workspace manager: provisions and refreshes AI agent workspaces')
  .version(pkgVersion);

program
  .command('init')
  .description('First-time provision of a workspace')
  .option('--target <dir>', 'target directory', process.cwd())
  .option('--dry-run', 'print planned actions without writing anything')
  .option('--yes', 'non-interactive: use defaults')
  .option('--reconfigure', 'rerun interactive prompts even if already configured')
  .option('--surfaces <list>', 'comma-separated surfaces: claude,codex (default: both)')
  .option('--git-strategy <strategy>', 'git strategy: shared|pythia|ignore (default: ignore)')
  .action(async (opts) => {
    const target = resolve(opts.target);
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
          const ans = await rl.question('Surfaces to install [claude,codex] (default: both): ');
          surfaces = ans.trim() ? parseSurfaces(ans.trim()) : ['.claude/skills', '.agents/skills'];
        }
        if (!gitStrategy) {
          const ans = await rl.question('Git strategy [shared|pythia|ignore] (default: ignore): ');
          const valid = ['shared', 'pythia', 'ignore'];
          gitStrategy = ans.trim() && valid.includes(ans.trim()) ? ans.trim() : 'ignore';
        }
      } finally {
        rl.close();
      }
    }

    // git-strategy side effects (before init so they're in place when manifest writes)
    let effectiveGitStrategy = gitStrategy ?? 'ignore';
    if (!opts.dryRun) {
      if (effectiveGitStrategy === 'pythia') {
        const pythiaGitDir = join(target, '.pythia', '.git');
        if (!existsSync(pythiaGitDir)) {
          mkdirSync(join(target, '.pythia'), { recursive: true });
          const r = spawnSync('git', ['init', join(target, '.pythia')], { encoding: 'utf8' });
          if (r.status === 0) console.log(`  [git] initialized .pythia/.git`);
        }
      } else if (effectiveGitStrategy === 'shared') {
        const r = spawnSync('git', ['-C', target, 'rev-parse', '--git-dir'], { encoding: 'utf8' });
        if (r.status !== 0) {
          console.warn(`  [git] shared strategy requires a git repo in target; falling back to ignore`);
          effectiveGitStrategy = 'ignore';
          gitStrategy = 'ignore';
        }
      }
    }

    doInit({
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
  .option('--target <dir>', 'target directory', process.cwd())
  .option('--dry-run', 'print planned actions without writing anything')
  .option('--no-migrate', 'skip migration application')
  .action((opts) => {
    doUpdate({
      target: resolve(opts.target),
      dryRun: !!opts.dryRun,
      packageRoot,
      noMigrate: opts.migrate === false,
    });
  });

function parseSurfaces(str) {
  const valid = { claude: '.claude/skills', codex: '.agents/skills' };
  const parts = str.split(',').map((s) => s.trim().toLowerCase());
  const result = [];
  for (const p of parts) {
    if (!valid[p]) throw new Error(`Unknown surface: ${p}. Valid values: claude, codex`);
    result.push(valid[p]);
  }
  if (result.length === 0) throw new Error('At least one surface must be specified');
  return result;
}

// Auto-detect: no subcommand → init or update based on workspace detection
program.addHelpCommand(false);
program.exitOverride();

const rawArgs = process.argv.slice(2);
const knownCommands = ['init', 'update'];
const firstArg = rawArgs.find((a) => !a.startsWith('-'));

if (!firstArg || !knownCommands.includes(firstArg)) {
  const targetIdx = rawArgs.indexOf('--target');
  const targetDir = targetIdx !== -1 ? rawArgs[targetIdx + 1] : process.cwd();
  const dryRun = rawArgs.includes('--dry-run');

  if (rawArgs.includes('--help') || rawArgs.includes('-h')) {
    program.outputHelp();
    process.exit(0);
  }
  if (rawArgs.includes('--version') || rawArgs.includes('-V')) {
    console.log(pkgVersion);
    process.exit(0);
  }

  const target = resolve(targetDir);
  if (isWorkspace(target)) {
    doUpdate({ target, dryRun, packageRoot });
  } else {
    doInit({ target, dryRun, packageRoot });
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
