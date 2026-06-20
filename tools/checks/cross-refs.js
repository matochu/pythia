#!/usr/bin/env node
/**
 * Checker #4: Context backlinks + References/Used-by round-trip validation.
 * Usage: node .pythia/runtime/checks/cross-refs.js <plan.md>
 * Exit: 0 = ok, 1 = missing back-references, 2 = usage/io error
 */

import { existsSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { getSectionContent, resolveLink } from '../lib/md.js';
import { parseTrailingRefs, resolveDocLink, docRelativePath } from '../lib/refs.js';

const [file] = process.argv.slice(2);
if (!file) { console.error('Usage: node .pythia/runtime/checks/cross-refs.js <plan.md>'); process.exit(2); }
if (!existsSync(file)) { console.error(`${file}:0: [io.missing_file] File not found`); process.exit(2); }

/** @param {Array<{path:string}>} usedBy @param {string} consumerFile @param {string} fromFile */
function usedByLinksBack(usedBy, consumerFile, fromFile) {
  if (!usedBy?.length) return false;
  const sourceBase = basename(consumerFile);
  const rel = docRelativePath(fromFile, consumerFile);
  return usedBy.some(
    (u) => u.path === rel || basename(u.path) === sourceBase,
  );
}

const content = readFileSync(file, 'utf8');
let failed = false;

const contextsSection = getSectionContent(content, 'Contexts');
if (contextsSection) {
  const linkRe = /\[([^\]]*)\]\(([^)]+)\)/g;
  let m;
  while ((m = linkRe.exec(contextsSection)) !== null) {
    const href = m[2].split('#')[0].trim();
    if (!href || /^https?:\/\//.test(href)) continue;

    const contextFile = resolveLink(file, href);
    if (!existsSync(contextFile)) continue;

    const contextContent = readFileSync(contextFile, 'utf8');
    const targetParsed = parseTrailingRefs(contextContent);
    const usedBy = targetParsed?.usedBy ?? [];
    if (!usedBy.length) {
      console.error(`${file}:0: [cross-refs.missing_used_by] Context ${basename(contextFile)} has no ## Used by backlink to this plan`);
      failed = true;
      continue;
    }

    if (!usedByLinksBack(usedBy, file, contextFile)) {
      console.error(`${file}:0: [cross-refs.missing_backlink] Context ${basename(contextFile)} ## Used by does not reference this plan (${basename(file)})`);
      failed = true;
    }
  }
}

const parsed = parseTrailingRefs(content);
if (parsed?.references?.length) {
  const sourceBase = basename(file);
  for (const ref of parsed.references) {
    const targetFile = resolveDocLink(file, ref.path);
    if (!targetFile || !existsSync(targetFile)) continue;

    const targetContent = readFileSync(targetFile, 'utf8');
    const targetParsed = parseTrailingRefs(targetContent);
    const usedBy = targetParsed?.usedBy ?? [];
    if (!usedByLinksBack(usedBy, file, targetFile)) {
      console.error(`${file}:0: [cross-refs.missing_used_by_ref] Target ${basename(targetFile)} ## Used by does not reference ${sourceBase} (from ## References)`);
      failed = true;
    }
  }
}

process.exit(failed ? 1 : 0);
