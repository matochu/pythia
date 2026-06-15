#!/usr/bin/env node
// migrate:apply <version> — run auto steps for one migration version, write state.json.
import { join, resolve } from 'path';
import { existsSync, readFileSync } from 'fs';
import { readManifest } from './manifest.js';
import { runOp } from './ops.js';
import { parseMigration, migrationHasLlm } from './parse.js';
import { writeState } from './state.js';

const args = process.argv.slice(2);
const targetIdx = args.indexOf('--target');
const targetRoot = resolve(targetIdx !== -1 ? args[targetIdx + 1] : process.cwd());
const dryRun = args.includes('--dry-run');
const version = args.find((a) => !a.startsWith('-') && /^\d+\.\d+\.\d+$/.test(a));

if (!version) {
  console.error('Usage: migrate:apply [--target <dir>] [--dry-run] <version>');
  process.exit(1);
}

const manifest = readManifest(targetRoot);
if (!manifest) {
  console.error('Not a pythia workspace');
  process.exit(1);
}

const migPath = join(targetRoot, '.pythia', 'runtime', 'migrations', `${version}.md`);
if (!existsSync(migPath)) {
  console.error(`Migration file not found: ${migPath}`);
  process.exit(1);
}

const migContent = readFileSync(migPath, 'utf8');
const steps = parseMigration(migContent);
const autoSteps = steps.filter((s) => s.kind === 'auto');
const llmRemaining = migrationHasLlm(steps);

const backups = [];
const changedPaths = [];
const appliedSteps = [];

for (const step of autoSteps) {
  try {
    const result = runOp(targetRoot, step.op, backups, dryRun, version);
    if (result.changedPath) changedPaths.push(result.changedPath);
    appliedSteps.push(step.stepNum);
    console.log(`  step ${step.stepNum} (${step.op?.op ?? 'auto'}): ${result.status}`);
  } catch (err) {
    console.error(`  step ${step.stepNum} FAILED: ${err.message}`);
    process.exit(2);
  }
}

const state = {
  migrationVersion: version,
  frameworkVersion: manifest.frameworkVersion,
  changedPaths,
  appliedSteps,
  llmRemaining,
  backups,
};

writeState(targetRoot, state, dryRun);
if (!dryRun) console.log(`  state written: .pythia/backups/${version}/state.json`);
console.log(`apply ${version}: done (llmRemaining=${llmRemaining})`);
