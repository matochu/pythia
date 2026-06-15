#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import { doInit, doUpdate, isWorkspace } from './workspace.js';

function findPackageRoot(): string {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  // Compiled path: dist/src/cli/ → 3 levels up
  const fromDist = resolve(currentDir, '../../../');
  if (existsSync(resolve(fromDist, 'package.json'))) return fromDist;
  // Dev path (ts-node): src/cli/ → 2 levels up
  const fromSrc = resolve(currentDir, '../../');
  if (existsSync(resolve(fromSrc, 'package.json'))) return fromSrc;
  throw new Error('Cannot find package root from ' + currentDir);
}

const packageRoot = findPackageRoot();
const pkgVersion: string = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8')).version;

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
  .action((opts: { target: string; dryRun?: boolean }) => {
    doInit({ target: resolve(opts.target), dryRun: !!opts.dryRun, packageRoot });
  });

program
  .command('update')
  .description('Refresh an existing workspace')
  .option('--target <dir>', 'target directory', process.cwd())
  .option('--dry-run', 'print planned actions without writing anything')
  .action((opts: { target: string; dryRun?: boolean }) => {
    doUpdate({ target: resolve(opts.target), dryRun: !!opts.dryRun, packageRoot });
  });

// If no subcommand is given (or an unknown one), run auto-detect
program.addHelpCommand(false);
program.exitOverride();

const rawArgs = process.argv.slice(2);
const firstArg = rawArgs.find((a) => !a.startsWith('-'));

if (!firstArg || (firstArg !== 'init' && firstArg !== 'update')) {
  // Auto mode: parse global options only
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
  } catch (e: unknown) {
    if (e instanceof Error && (e as { code?: string }).code !== 'commander.helpDisplayed') {
      console.error(e.message);
      process.exit(1);
    }
  }
}
