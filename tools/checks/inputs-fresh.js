#!/usr/bin/env node
/**
 * Checker #7: Wrap inputs.js check — warn when grounding artifact has STALE inputs.
 * Usage: node .pythia/runtime/checks/inputs-fresh.js <file.md>
 * Exit: 0 = ok / no inputs declared, 1 = stale inputs detected, 2 = usage/io error
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const [file] = process.argv.slice(2);
if (!file) { console.error('Usage: node .pythia/runtime/checks/inputs-fresh.js <file.md>'); process.exit(2); }
if (!existsSync(file)) { console.error(`${file}:0: [io.missing_file] File not found`); process.exit(2); }

const inputsJs = resolve(dirname(fileURLToPath(import.meta.url)), '../inputs.js');
if (!existsSync(inputsJs)) {
  // inputs.js not available — skip silently
  process.exit(0);
}

const result = spawnSync(process.execPath, [inputsJs, 'check', file], { encoding: 'utf8' });

if (result.status === 2) {
  // usage error from inputs.js — skip silently in hook context
  process.exit(0);
}

const output = (result.stdout || '').trim();
if (!output || output === 'no inputs declared') process.exit(0);

const hasStale = output.split('\n').some((l) => l.includes('STALE') || l.startsWith('!'));
if (hasStale) {
  console.error(`${file}:0: [inputs-fresh.stale] Grounding artifact has STALE or missing inputs — run: node scripts/inputs.js update ${file}`);
  for (const line of output.split('\n').filter((l) => l.includes('STALE') || l.startsWith('!'))) {
    console.error(`  ${line}`);
  }
  process.exit(1);
}

process.exit(0);
