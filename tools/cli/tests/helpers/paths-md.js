import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '../fixtures');

/** @param {'new' | 'old' | 'old-basename'} variant */
export function pathsMdContent(variant = 'new') {
  const file = {
    new: 'paths-md-hardened.md',
    old: 'paths-md-legacy.md',
    'old-basename': 'paths-md-legacy-basename.md',
  }[variant];
  return readFileSync(join(FIXTURES, file), 'utf8');
}

export function hasHooksHardeningPaths(content) {
  return content.includes('role-boundary.js') && content.includes('*.context.md');
}
