#!/usr/bin/env node
/**
 * Checker #2: Static plan-version consistency check.
 * On a .plan.md, asserts:
 *   (a) Version exists
 *   (b) newest Plan revision log row Version == metadata Version
 *   (c) Navigation covers all steps
 *   (d) [optional, fail-open] if inside a git repo, warn when body changed vs HEAD but Plan-Version/log not bumped
 *
 * Usage: node .pythia/runtime/checks/plan-version-log.js <file.plan.md>
 * Exit: 0 = ok, 1 = issues found, 2 = usage/io error
 */

import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { extractMetaValue } from '../lib/md.js';
import { parseArtifactMetadata, getArtifactField } from '../lib/metadata/parse.js';

const [file] = process.argv.slice(2);
if (!file) { console.error('Usage: node .pythia/runtime/checks/plan-version-log.js <file.plan.md>'); process.exit(2); }
if (!existsSync(file)) { console.error(`${file}:0: [io.missing_file] File not found`); process.exit(2); }

const content = readFileSync(file, 'utf8');
const lines = content.split('\n');

let failed = false;

const parsedMetadata = parseArtifactMetadata(content);

// (a) Version exists (v2: lowercase 'version'; legacy fallbacks removed)
const planVersion = getArtifactField(parsedMetadata, 'version') ?? getArtifactField(parsedMetadata, 'Version');
if (!planVersion) {
  console.error(`${file}:0: [plan-version-log.missing_version] Version not found in ## Metadata`);
  failed = true;
}

// (b) newest revision log row == Plan-Version
const logHeader = lines.findIndex((l) => l === '## Plan revision log');
if (logHeader !== -1) {
  let inTable = false;
  let lastLogVersion = null;
  for (let i = logHeader + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^## /.test(line)) break;
    if (/\| Version \| Round \| Date/.test(line)) { inTable = true; continue; }
    if (inTable && /^\|[-\s|]+\|/.test(line)) continue;
    if (inTable && line.startsWith('|')) {
      const parts = line.split('|').map((s) => s.trim());
      if (parts.length >= 3 && parts[1] && parts[1] !== 'Version') {
        lastLogVersion = parts[1];
      }
    }
  }
  if (planVersion && lastLogVersion && lastLogVersion !== planVersion) {
    console.error(`${file}:0: [plan-version-log.version_mismatch] Version (${planVersion}) does not match newest revision log row (${lastLogVersion})`);
    failed = true;
  }
}

// (c) Navigation covers all steps
const navLine = lines.find((l) => l.includes('Plan: [Step '));
const stepHeaders = lines.filter((l) => /^### Step \d+:/.test(l));
if (navLine && stepHeaders.length > 0) {
  const stepNums = stepHeaders.map((l) => { const m = l.match(/^### Step (\d+):/); return m ? m[1] : null; }).filter(Boolean);
  for (const num of stepNums) {
    if (!navLine.includes(`Step ${num}:`)) {
      console.error(`${file}:0: [plan-version-log.nav_missing_step] Navigation does not reference Step ${num}`);
      failed = true;
    }
  }
}

// (d) Optional best-effort: git-HEAD diff for body changes without version bump (fail-open)
try {
  const gitShow = spawnSync('git', ['show', `HEAD:${file}`], { encoding: 'utf8' });
  if (gitShow.status === 0 && gitShow.stdout.trim()) {
    const headContent = gitShow.stdout;
    const headVersion = getArtifactField(parseArtifactMetadata(headContent), 'Version') ?? extractMetaValue(headContent, 'Plan-Version');
    // Strip frontmatter for body comparison
    const bodyOf = (c) => { const idx = c.indexOf('\n---\n', 4); return idx > 0 ? c.slice(idx) : c; };
    const currentBody = bodyOf(content);
    const headBody = bodyOf(headContent);
    if (headVersion && planVersion && headVersion === planVersion && currentBody !== headBody) {
      console.error(`${file}:0: [plan-version-log.content_changed_no_bump] Plan content changed vs HEAD but Version (${planVersion}) was not bumped (best-effort, fail-open)`);
      // warn only — do not set failed=true; this is the optional fail-open branch
    }
  }
} catch { /* git unavailable or file untracked — skip */ }

process.exit(failed ? 1 : 0);
