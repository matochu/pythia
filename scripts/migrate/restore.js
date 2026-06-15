#!/usr/bin/env node
// migrate:restore <version> — roll back from backup manifest, no bump.
import { join, resolve } from 'path';
import { existsSync, copyFileSync, mkdirSync, dirname, realpathSync } from 'fs';
import { readState } from './state.js';
import { readManifest } from './manifest.js';

const args = process.argv.slice(2);
const targetIdx = args.indexOf('--target');
const targetRoot = realpathSync(resolve(targetIdx !== -1 ? args[targetIdx + 1] : process.cwd()));
const dryRun = args.includes('--dry-run');
const version = args.find((a) => !a.startsWith('-') && /^\d+\.\d+\.\d+$/.test(a));

if (!version) {
  console.error('Usage: migrate:restore [--target <dir>] [--dry-run] <version>');
  process.exit(1);
}

const state = readState(targetRoot, version);
if (!state) {
  console.error(`No state.json found for version ${version}`);
  process.exit(1);
}

const manifest = readManifest(targetRoot);
if (!manifest) {
  console.error('Not a pythia workspace');
  process.exit(1);
}

if (state.frameworkVersion !== manifest.frameworkVersion) {
  console.error(`State frameworkVersion (${state.frameworkVersion}) != workspace (${manifest.frameworkVersion})`);
  process.exit(1);
}

const { backups = [] } = state;
if (backups.length === 0) {
  console.log(`restore ${version}: no backups to restore`);
  process.exit(0);
}

for (const entry of backups) {
  const backupAbs = join(targetRoot, entry.backupPath);
  const targetAbs = join(targetRoot, entry.path);
  if (!existsSync(backupAbs)) {
    console.warn(`  [SKIP] no backup found for ${entry.path}`);
    continue;
  }
  if (dryRun) {
    console.log(`  [restore] ${entry.path} ← ${entry.backupPath}`);
  } else {
    mkdirSync(dirname(targetAbs), { recursive: true });
    copyFileSync(backupAbs, targetAbs);
    console.log(`  restored: ${entry.path}`);
  }
}

console.log(`restore ${version}: done (no migratedVersion bump)`);
