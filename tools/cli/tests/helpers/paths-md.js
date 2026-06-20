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

/** Post-commands zone lists inputs.js sync for all workflow doc globs. */
export function hasInputsFreshnessPostCommands(content) {
  if (!content.includes('## Post-commands')) return false;
  const globs = [
    '*.plan.md',
    '*.context.md',
    '*.review.md',
    '*.implementation.md',
    '*.audit.md',
    'feat-*.md',
  ];
  return globs.every((g) => content.includes(`${g}  command:`));
}
