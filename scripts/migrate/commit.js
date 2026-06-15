#!/usr/bin/env node
// migrate:commit <version> — bump migratedVersion, prune backups.
import { join, resolve } from 'path';
import { existsSync, readdirSync, rmSync, realpathSync } from 'fs';
import { readState, writeState } from './state.js';
import { readManifest, writeManifest } from './manifest.js';
import { compareSemver } from './semver.js';

const args = process.argv.slice(2);
const targetIdx = args.indexOf('--target');
const targetRoot = realpathSync(resolve(targetIdx !== -1 ? args[targetIdx + 1] : process.cwd()));
const dryRun = args.includes('--dry-run');
const version = args.find((a) => !a.startsWith('-') && /^\d+\.\d+\.\d+$/.test(a));
const retentionIdx = args.indexOf('--retention');
const retention = retentionIdx !== -1 ? parseInt(args[retentionIdx + 1], 10) : 3;

if (!version) {
  console.error('Usage: migrate:commit [--target <dir>] [--dry-run] [--retention <n>] <version>');
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

if (!dryRun) {
  writeManifest(targetRoot, { migratedVersion: version }, dryRun);
  console.log(`  migratedVersion → ${version}`);
  // Mark state as committed so findUnresolvedMixedStates no longer sees it
  const currentState = readState(targetRoot, version);
  if (currentState) writeState(targetRoot, { ...currentState, llmRemaining: false }, false);
}

// Prune old backups (keep newest N)
const backupsDir = join(targetRoot, '.pythia', 'backups');
if (existsSync(backupsDir)) {
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

console.log(`commit ${version}: done`);
