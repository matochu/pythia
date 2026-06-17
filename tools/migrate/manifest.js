// Self-contained manifest read/write for the materialized runtime.
// Must NOT import from src/cli/workspace.js — this file is copied to .pythia/runtime/migrate/
// and must run without the source package being present.
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';

export function readManifest(target) {
  try {
    const manifestPath = join(target, '.pythia', 'manifest.json');
    if (existsSync(manifestPath)) {
      return JSON.parse(readFileSync(manifestPath, 'utf8'));
    }
    const versionPath = join(target, '.pythia', 'version.json');
    if (existsSync(versionPath)) {
      const data = JSON.parse(readFileSync(versionPath, 'utf8'));
      return { ...data, migratedVersion: data.migratedVersion ?? '0.0.0' };
    }
    return null;
  } catch {
    return null;
  }
}

export function writeManifest(target, data, dryRun) {
  const manifestPath = join(target, '.pythia', 'manifest.json');
  const legacyPath = join(target, '.pythia', 'version.json');
  if (dryRun) {
    console.log(`  [write] .pythia/manifest.json`);
    return;
  }
  mkdirSync(dirname(manifestPath), { recursive: true });
  let existing = {};
  try {
    if (existsSync(manifestPath)) {
      existing = JSON.parse(readFileSync(manifestPath, 'utf8'));
    } else if (existsSync(legacyPath)) {
      const legacy = JSON.parse(readFileSync(legacyPath, 'utf8'));
      existing = { ...legacy, migratedVersion: legacy.migratedVersion ?? '0.0.0' };
    }
  } catch { /* ignore corrupt existing */ }
  const merged = { ...existing, ...data };
  writeFileSync(manifestPath, JSON.stringify(merged, null, 2), 'utf8');
  if (existsSync(legacyPath)) {
    rmSync(legacyPath);
    console.log(`  renamed: .pythia/version.json → .pythia/manifest.json`);
  } else {
    console.log(`  wrote: .pythia/manifest.json`);
  }
}
