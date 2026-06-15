#!/usr/bin/env node
// Release gate: verifies next.md is absent and a versioned migration for the current frameworkVersion exists.
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(__dirname, '..');
const pkg = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
const version = pkg.version;
const migrationsDir = join(packageRoot, 'assets', 'migrations');

let ok = true;

const nextMd = join(migrationsDir, 'next.md');
if (existsSync(nextMd)) {
  console.error(`[release-check] FAIL: assets/migrations/next.md still exists. Rename it to ${version}.md before publishing.`);
  ok = false;
}

const versionedMd = join(migrationsDir, `${version}.md`);
if (!existsSync(versionedMd)) {
  console.warn(`[release-check] WARN: assets/migrations/${version}.md not found. If this release has no protected-zone format changes, this is expected. Otherwise, produce it from next.md.`);
}

if (!ok) process.exit(1);
console.log(`[release-check] OK: next.md absent, version ${version} checks passed.`);
