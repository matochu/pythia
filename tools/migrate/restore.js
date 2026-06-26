#!/usr/bin/env node
// migrate:restore <version> — roll back to the pre-update snapshot, no version bump.
import { resolve, dirname } from 'path';
import { realpathSync } from 'fs';
import { fileURLToPath } from 'url';
import { readState } from './state.js';
import { readManifest } from './manifest.js';
import { restoreFromPreUpdateBackup } from './backups.js';

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

const { preUpdateBackup } = state;
if (!preUpdateBackup) {
  console.error(`restore ${version}: no pre-update backup recorded — cannot roll back automatically.`);
  console.error('  Fix the reported files and re-run update, or restore from git.');
  process.exit(1);
}

try {
  const count = restoreFromPreUpdateBackup(targetRoot, preUpdateBackup, { dryRun });
  console.log(`restore ${version}: ${dryRun ? 'would restore' : 'restored'} ${count} entr${count === 1 ? 'y' : 'ies'} (no migratedVersion bump)`);
} catch (err) {
  console.error(`restore ${version}: ${err.message}`);
  process.exit(1);
}
