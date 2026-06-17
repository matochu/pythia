#!/usr/bin/env node
/**
 * Checker #4: For each context in a plan's ## Contexts, assert that context's ## Used by links back.
 * Usage: node .pythia/runtime/checks/cross-refs.js <plan.md>
 * Exit: 0 = ok, 1 = missing back-references, 2 = usage/io error
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve, basename } from 'node:path';
import { getSectionContent, resolveLink } from '../lib/md.js';

const [file] = process.argv.slice(2);
if (!file) { console.error('Usage: node .pythia/runtime/checks/cross-refs.js <plan.md>'); process.exit(2); }
if (!existsSync(file)) { console.error(`${file}:0: [io.missing_file] File not found`); process.exit(2); }

const content = readFileSync(file, 'utf8');
const contextsSection = getSectionContent(content, 'Contexts');
if (!contextsSection) process.exit(0); // no Contexts section → nothing to check

let failed = false;

// Extract context file links from ## Contexts section
const linkRe = /\[([^\]]*)\]\(([^)]+)\)/g;
let m;
while ((m = linkRe.exec(contextsSection)) !== null) {
  const href = m[2].split('#')[0].trim();
  if (!href || /^https?:\/\//.test(href)) continue;

  const contextFile = resolveLink(file, href);
  if (!existsSync(contextFile)) continue; // links.js covers broken links

  const contextContent = readFileSync(contextFile, 'utf8');
  const usedBySection = getSectionContent(contextContent, 'Used by');
  if (!usedBySection) {
    console.error(`${file}:0: [cross-refs.missing_used_by] Context ${basename(contextFile)} has no ## Used by section`);
    failed = true;
    continue;
  }

  // The context's ## Used by should link back to this plan or its feature
  const planBase = basename(file, '.plan.md');
  if (!usedBySection.includes(planBase) && !usedBySection.includes(basename(file))) {
    console.error(`${file}:0: [cross-refs.missing_backlink] Context ${basename(contextFile)} ## Used by does not reference this plan (${basename(file)})`);
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
