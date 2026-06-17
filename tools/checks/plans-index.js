#!/usr/bin/env node
/**
 * Checker #5: Assert that the feature doc's ## Plans section lists every sibling .plan.md.
 * Usage: node .pythia/runtime/checks/plans-index.js <plan.md>
 * Exit: 0 = ok, 1 = drift found, 2 = usage/io error
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { getSectionContent } from '../lib/md.js';

const [file] = process.argv.slice(2);
if (!file) { console.error('Usage: node .pythia/runtime/checks/plans-index.js <plan.md>'); process.exit(2); }
if (!existsSync(file)) { console.error(`${file}:0: [io.missing_file] File not found`); process.exit(2); }

// Feature doc is two levels up from plans/: feature-dir/plans/ → feature-dir/
const plansDir = dirname(resolve(file));
const featureDir = dirname(plansDir);

// Find the feature doc (*.md directly in featureDir that is not a plans/reports/contexts subdir file)
const featDocs = readdirSync(featureDir)
  .filter((e) => e.endsWith('.md') && !e.startsWith('.'));
const featDoc = featDocs.length === 1 ? join(featureDir, featDocs[0]) : null;
if (!featDoc || !existsSync(featDoc)) {
  // Can't find unique feature doc — skip silently
  process.exit(0);
}

const featContent = readFileSync(featDoc, 'utf8');
const plansSection = getSectionContent(featContent, 'Plans');
if (!plansSection) {
  // Feature doc has no ## Plans section — skip silently (might not be required)
  process.exit(0);
}

// All .plan.md files in the plans/ directory
let siblings;
try {
  siblings = readdirSync(plansDir).filter((e) => e.endsWith('.plan.md'));
} catch {
  process.exit(0);
}

let failed = false;
for (const sibling of siblings) {
  const slug = sibling.replace(/\.plan\.md$/, '');
  if (!plansSection.includes(slug) && !plansSection.includes(sibling)) {
    console.error(`${file}:0: [plans-index.drift] Feature Plans index (${basename(featDoc)}) does not list plan: ${sibling}`);
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
