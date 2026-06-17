import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { packageRoot } from './workspace.js';

const NEXT_MD = join(packageRoot, 'assets/migrations/next.md');

/** Staging next.md → versioned migration body (e.g. 0.3.3.md at release). */
export function versionedMigrationFromStaging(version) {
  const raw = readFileSync(NEXT_MD, 'utf8');
  return raw
    .replace(/^# Migration next/m, `# Migration ${version}`)
    .replace(/migratedVersion < <version>/, `migratedVersion < ${version}`)
    .replace(/\n<!-- At release:[\s\S]*?-->\n\n/, '\n\n');
}
