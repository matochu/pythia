#!/usr/bin/env node
/**
 * Checker #1: Assert that N in N-*.plan.md is sequential vs sibling plans (no gap/duplicate).
 * Usage: node .pythia/runtime/checks/plan-numbering.js <N-slug.plan.md>
 * Exit: 0 = ok, 1 = out of sequence, 2 = usage/io error
 */

import { existsSync, readdirSync } from 'node:fs';
import { basename, dirname } from 'node:path';

const [file] = process.argv.slice(2);
if (!file) { console.error('Usage: node .pythia/runtime/checks/plan-numbering.js <plan.md>'); process.exit(2); }
if (!existsSync(file)) { console.error(`${file}:0: [io.missing_file] File not found`); process.exit(2); }

const base = basename(file);
const m = base.match(/^(\d+)-/);
if (!m) {
  // Not a numbered plan — skip silently
  process.exit(0);
}

const thisNum = parseInt(m[1], 10);
const dir = dirname(file);
let entries;
try {
  entries = readdirSync(dir);
} catch {
  console.error(`${file}:0: [plan-numbering.io] Cannot read directory: ${dir}`);
  process.exit(2);
}

const siblingNums = entries
  .filter((e) => e.endsWith('.plan.md') && e !== base)
  .map((e) => { const sm = e.match(/^(\d+)-/); return sm ? parseInt(sm[1], 10) : null; })
  .filter((n) => n !== null)
  .sort((a, b) => a - b);

// Duplicate check
if (siblingNums.includes(thisNum)) {
  console.error(`${file}:0: [plan-numbering.duplicate] Plan number ${thisNum} is already used by a sibling plan`);
  process.exit(1);
}

// Gap check: this plan's number should be max(siblingNums) + 1
const maxSibling = siblingNums.length ? Math.max(...siblingNums) : 0;
const expected = maxSibling + 1;
if (thisNum !== expected) {
  console.error(`${file}:0: [plan-numbering.gap] Plan number ${thisNum} is not sequential (expected ${expected}, siblings: ${siblingNums.join(', ') || 'none'})`);
  process.exit(1);
}

process.exit(0);
