#!/usr/bin/env node
/**
 * Check that literal paths in SKILL.md match the registry.
 * Usage: node .pythia/runtime/checks/skill-paths.js <SKILL.md>
 * Exit: 0 = ok, 1 = mismatches found, 2 = usage/io error
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve, fileURLToPath } from 'node:path';
import { loadZones, zone } from '../lib/paths.js';

const [file] = process.argv.slice(2);
if (!file) { console.error('Usage: node .pythia/runtime/checks/skill-paths.js <SKILL.md>'); process.exit(2); }
if (!existsSync(file)) { console.error(`${file}:0: [io.missing_file] File not found`); process.exit(2); }

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const zones = loadZones(repoRoot);
const generated = zone(zones, 'Generated cache').map((e) => e.path);
const protected_ = zone(zones, 'Protected').map((e) => e.path.replace('/**', ''));

const content = readFileSync(file, 'utf8');

// Extract backtick-quoted tokens that look like paths (contain / or start with .)
const pathTokens = [...content.matchAll(/`([^`]+)`/g)]
  .map((m) => m[1].trim())
  .filter((t) => t.includes('/') || t.startsWith('.'));

let failed = false;

// Warn if a SKILL.md hardcodes a path that the registry marks as generated
for (const token of pathTokens) {
  // Skip code blocks / URLs / commands
  if (token.includes(' ') || /^https?:\/\//.test(token)) continue;
  for (const gen of generated) {
    if (token === gen || token.startsWith(gen + '/')) {
      console.error(`${file}:0: [skill-paths.generated] Path '${token}' is in Generated cache zone — verify it is referenced correctly`);
      failed = true;
      break;
    }
  }
}

process.exit(failed ? 1 : 0);
