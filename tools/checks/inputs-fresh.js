#!/usr/bin/env node
/**
 * Checker #7: Wrap inputs.js check — warn when grounding artifact has STALE references.
 * Usage: node .pythia/runtime/checks/inputs-fresh.js <file.md>
 * Exit: 0 = ok / no references declared, 1 = stale inputs detected, 2 = usage/io error
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseTrailingRefs } from '../lib/references/refs.js';
import { parseFrontmatter } from '../lib/md.js';

const [file] = process.argv.slice(2);
if (!file) { console.error('Usage: node .pythia/runtime/checks/inputs-fresh.js <file.md>'); process.exit(2); }
if (!existsSync(file)) { console.error(`${file}:0: [io.missing_file] File not found`); process.exit(2); }

const content = readFileSync(file, 'utf8');
const parsed = parseTrailingRefs(content);

if (!parsed) {
  const { frontmatter } = parseFrontmatter(content);
  const hasLegacyInputs = frontmatter?.split('\n').some((l) => l === 'inputs:');
  if (hasLegacyInputs) {
    const inputsJs = resolve(dirname(fileURLToPath(import.meta.url)), '../inputs.js');
    if (!existsSync(inputsJs)) process.exit(0);
    const result = spawnSync(process.execPath, [inputsJs, 'check', file], { encoding: 'utf8' });
    if (result.status === 2) process.exit(0);
    const output = (result.stdout || '').trim();
    if (!output || output === 'no inputs declared') process.exit(0);
    const hasStale = output.split('\n').some((l) => l.includes('STALE') || l.startsWith('!'));
    if (hasStale) {
      console.error(`${file}:0: [inputs-fresh.stale] Grounding artifact has STALE or missing inputs — run: node .pythia/runtime/inputs.js sync ${file}`);
      for (const line of output.split('\n').filter((l) => l.includes('STALE') || l.startsWith('!'))) {
        console.error(`  ${line}`);
      }
      process.exit(1);
    }
  }
  process.exit(0);
}

const inputsJs = resolve(dirname(fileURLToPath(import.meta.url)), '../inputs.js');
if (!existsSync(inputsJs)) process.exit(0);

const result = spawnSync(process.execPath, [inputsJs, 'check', file], { encoding: 'utf8' });
if (result.status === 2) process.exit(0);

const output = (result.stdout || '').trim();
if (!output || output.startsWith('SKIP')) process.exit(0);

const hasStale = output.split('\n').some((l) => l.includes('STALE') || l.startsWith('!'));
if (hasStale) {
  console.error(`${file}:0: [inputs-fresh.stale] Grounding artifact has STALE ## References — run: node .pythia/runtime/inputs.js sync ${file}`);
  for (const line of output.split('\n').filter((l) => l.includes('STALE') || l.startsWith('!'))) {
    console.error(`  ${line}`);
  }
  process.exit(1);
}

process.exit(0);
