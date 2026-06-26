import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { packageRoot } from './workspace.js';

/** Find the staging migration file: next.md if present, else the current shipped version. */
export function stagingMigrationPath(version, root = packageRoot) {
  const nextPath = join(root, 'assets/migrations/next.md');
  if (existsSync(nextPath)) return nextPath;
  const shippedPath = join(root, `assets/migrations/${version}.md`);
  if (existsSync(shippedPath)) return shippedPath;
  return null;
}

/** Staging next.md (or shipped version) → versioned migration body. */
export function versionedMigrationFromStaging(version, root = packageRoot) {
  const path = stagingMigrationPath(version, root);
  if (!path) throw new Error(`No staging or shipped migration found for ${version}`);
  const raw = readFileSync(path, 'utf8');
  return raw
    .replace(/^# Migration next/m, `# Migration ${version}`)
    .replace(/migratedVersion < <version>/, `migratedVersion < ${version}`)
    .replace(/\n<!-- At release:[\s\S]*?-->\n\n/, '\n\n');
}
