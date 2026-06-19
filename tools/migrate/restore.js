#!/usr/bin/env node
// migrate:restore <version> — roll back from backup manifest, no bump.
import { join, resolve, dirname } from 'path';
import { existsSync, realpathSync } from 'fs';
import { fileURLToPath } from 'url';
import { readState } from './state.js';
import { readManifest } from './manifest.js';
import { restoreFromBackups } from './backups.js';

// Target derived from this script's materialized location: .pythia/runtime/migrate/restore.js
const targetRoot = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../..'));
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const version = args.find((a) => !a.startsWith('-') && /^\d+\.\d+\.\d+$/.test(a));

if (!version) {
  console.error('Usage: migrate:restore [--dry-run] <version>');
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

restoreFromBackups(targetRoot, backups, { dryRun, warnOnMissing: true });

console.log(`restore ${version}: done (no migratedVersion bump)`);
