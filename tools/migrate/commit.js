#!/usr/bin/env node
// migrate:commit <version> — bump migratedVersion, prune backups.
import { join, resolve, dirname } from 'path';
import { existsSync, readdirSync, rmSync, realpathSync } from 'fs';
import { fileURLToPath } from 'url';
import { readState, writeState } from './state.js';
import { readManifest, writeManifest } from './manifest.js';
import { compareSemver } from './semver.js';

/** Prune versioned migration backup dirs, keeping the newest N semver dirs. */
export function pruneMigrationBackups(targetRoot, retention = 3, dryRun = false) {
  const backupsDir = join(targetRoot, '.pythia', 'backups');
  if (!existsSync(backupsDir)) return;
  const dirs = readdirSync(backupsDir)
    .filter((d) => /^\d+\.\d+\.\d+$/.test(d))
    .sort(compareSemver);
  const toDelete = dirs.slice(0, Math.max(0, dirs.length - retention));
  for (const d of toDelete) {
    const p = join(backupsDir, d);
    if (dryRun) {
      console.log(`  [prune] .pythia/backups/${d}`);
    } else {
      rmSync(p, { recursive: true, force: true });
      console.log(`  pruned: .pythia/backups/${d}`);
    }
  }
}

/**
 * Shared commit path: bump migratedVersion, mark state committed, prune backups.
 * Used by migrate:commit CLI and applyMigrations in workspace.js.
 */
export function commitMigrationVersion(targetRoot, version, { dryRun = false, retention = 3 } = {}) {
  const state = readState(targetRoot, version);
  if (!state) throw new Error(`No state.json found for version ${version}`);

  const manifest = readManifest(targetRoot);
  if (!manifest) throw new Error('Not a pythia workspace');

  if (state.frameworkVersion !== manifest.frameworkVersion) {
    throw new Error(
      `State frameworkVersion (${state.frameworkVersion}) != workspace (${manifest.frameworkVersion})`
    );
  }

  if (!dryRun) {
    writeManifest(targetRoot, { migratedVersion: version }, dryRun);
    console.log(`  migratedVersion → ${version}`);
    const currentState = readState(targetRoot, version);
    if (currentState) writeState(targetRoot, { ...currentState, llmRemaining: false }, false);
  }

  pruneMigrationBackups(targetRoot, retention, dryRun);
}

function isMainModule() {
  const entry = process.argv[1];
  if (!entry) return false;
  return resolve(entry) === resolve(fileURLToPath(import.meta.url));
}

if (isMainModule()) {
  const targetRoot = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../..'));
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const version = args.find((a) => !a.startsWith('-') && /^\d+\.\d+\.\d+$/.test(a));
  const retentionIdx = args.indexOf('--retention');
  const retention = retentionIdx !== -1 ? parseInt(args[retentionIdx + 1], 10) : 3;

  if (!version) {
    console.error('Usage: migrate:commit [--dry-run] [--retention <n>] <version>');
    process.exit(1);
  }

  try {
    commitMigrationVersion(targetRoot, version, { dryRun, retention });
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  console.log(`commit ${version}: done`);
}
