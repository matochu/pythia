#!/usr/bin/env node
/**
 * Checker #3: Resolve every relative markdown link in a workflow doc.
 * Missing target → fail with file:line.
 * Usage: node .pythia/runtime/checks/links.js <file.md>
 * Exit: 0 = ok, 1 = broken links found, 2 = usage/io error
 */

import { existsSync, readFileSync } from 'node:fs';
import { extractRelativeLinks, resolveLink } from '../lib/md.js';

const [file] = process.argv.slice(2);
if (!file) { console.error('Usage: node .pythia/runtime/checks/links.js <file.md>'); process.exit(2); }
if (!existsSync(file)) { console.error(`${file}:0: [io.missing_file] File not found`); process.exit(2); }

const content = readFileSync(file, 'utf8');
const links = extractRelativeLinks(content);

let failed = false;
for (const { href, line } of links) {
  const target = resolveLink(file, href);
  if (!existsSync(target)) {
    console.error(`${file}:${line}: [links.broken] Broken relative link → ${href}`);
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
