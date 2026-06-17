#!/usr/bin/env node
// migrate:status — list pending migrations and any unresolved mixed state.
import { join, resolve, dirname } from 'path';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { readManifest } from './manifest.js';
import { inPendingRange, sortVersions } from './semver.js';
import { findUnresolvedMixedStates } from './state.js';
import { parseMigration, migrationHasLlm } from './parse.js';

// Target derived from this script's materialized location: .pythia/runtime/migrate/status.js
const targetRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const args = process.argv.slice(2);
const jsonMode = args.includes('--json');

const manifest = readManifest(targetRoot);
if (!manifest) {
  console.error('Not a pythia workspace (no manifest.json or version.json found)');
  process.exit(1);
}

const { migratedVersion = '0.0.0', frameworkVersion } = manifest;
const migrationsDir = join(targetRoot, '.pythia', 'runtime', 'migrations');

let pending = [];
if (existsSync(migrationsDir)) {
  const files = readdirSync(migrationsDir).filter((f) => /^\d+\.\d+\.\d+\.md$/.test(f));
  const versions = sortVersions(files.map((f) => f.replace('.md', '')));
  pending = versions.filter((v) => inPendingRange(v, migratedVersion, frameworkVersion));
}

const unresolved = findUnresolvedMixedStates(targetRoot);

if (jsonMode) {
  console.log(JSON.stringify({ pending, unresolved, migratedVersion, frameworkVersion }));
} else {
  console.log(`migratedVersion: ${migratedVersion}`);
  console.log(`frameworkVersion: ${frameworkVersion}`);
  if (unresolved.length > 0) {
    console.log(`\nUnresolved mixed migrations (must resolve before update):`);
    for (const s of unresolved) console.log(`  ${s.migrationVersion} (llmRemaining)`);
  }
  if (pending.length === 0) {
    console.log('No pending migrations.');
  } else {
    console.log(`\nPending migrations (${pending.length}):`);
    for (const v of pending) {
      const migPath = join(migrationsDir, `${v}.md`);
      try {
        const steps = parseMigration(readFileSync(migPath, 'utf8'));
        const hasLlm = migrationHasLlm(steps);
        console.log(`  ${v}${hasLlm ? ' (mixed: has llm steps)' : ' (auto-only)'}`);
      } catch {
        console.log(`  ${v}`);
      }
    }
  }
}
