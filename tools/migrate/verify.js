#!/usr/bin/env node
// migrate:verify <version> — validate changedPaths from state.json using workflow-doc rules.
import { join, resolve, dirname } from 'path';
import { existsSync, readFileSync, realpathSync } from 'fs';
import { fileURLToPath } from 'url';
import { readState } from './state.js';
import { readManifest } from './manifest.js';
import { verifyPathsMdWorkflowDocs } from '../lib/paths-md-invariants.js';

// Target derived from this script's materialized location: .pythia/runtime/migrate/verify.js
const targetRoot = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../..'));
const args = process.argv.slice(2);
const version = args.find((a) => !a.startsWith('-') && /^\d+\.\d+\.\d+$/.test(a));

if (!version) {
  console.error('Usage: migrate:verify <version>');
  process.exit(1);
}

const state = readState(targetRoot, version);
if (!state) {
  console.error(`No state.json found for version ${version} in ${targetRoot}`);
  process.exit(1);
}

const manifest = readManifest(targetRoot);
if (!manifest) {
  console.error('Not a pythia workspace');
  process.exit(1);
}
if (state.frameworkVersion !== manifest.frameworkVersion) {
  console.error(`State frameworkVersion (${state.frameworkVersion}) does not match workspace (${manifest.frameworkVersion})`);
  process.exit(1);
}

const { changedPaths } = state;
if (!changedPaths || changedPaths.length === 0) {
  console.log(`verify ${version}: no changed paths to verify`);
  process.exit(0);
}

// Inline structural validator for workflow documents.
// Mirrors the section-level checks in scripts/validate-plan.sh and scripts/validators/*.sh.
// Returns {ok, reason}.
function validateWorkflowDoc(content, relpath) {
  if (!content || content.trim().length === 0) {
    return { ok: false, reason: 'file is empty' };
  }

  if (relpath.endsWith('.plan.md')) {
    // Required sections per validate-plan.sh
    const required = ['## Metadata', '## Plan revision log', '## Navigation', '## Context', '## Goal', '## Plan'];
    for (const sec of required) {
      if (!content.includes(`\n${sec}\n`) && !content.startsWith(`${sec}\n`)) {
        return { ok: false, reason: `plan doc missing required section: ${sec}` };
      }
    }
    if (!/^## Risks/m.test(content) && !/^## Acceptance/m.test(content)) {
      return { ok: false, reason: 'plan doc missing ## Risks or ## Acceptance section' };
    }
    const requiredMeta = ['Plan-Id', 'Plan-Version', 'Status', 'Branch'];
    for (const key of requiredMeta) {
      if (!content.includes(`**${key}**`)) {
        return { ok: false, reason: `plan doc ## Metadata missing key: ${key}` };
      }
    }
    return { ok: true };
  }

  if (relpath.endsWith('.review.md')) {
    // Required per validate-review.sh
    const checks = [
      [/^## Navigation$/m, '## Navigation'],
      [/^Verdict: (READY|NEEDS_REVISION)$/m, 'Verdict: READY|NEEDS_REVISION'],
      [/^## Executive Summary$/m, '## Executive Summary'],
      [/^## Step-by-Step Analysis$/m, '## Step-by-Step Analysis'],
      [/^## Summary of Concerns$/m, '## Summary of Concerns'],
    ];
    for (const [re, label] of checks) {
      if (!re.test(content)) {
        return { ok: false, reason: `review doc missing: ${label}` };
      }
    }
    return { ok: true };
  }

  if (relpath.endsWith('.implementation.md')) {
    // Required per validate-implementation.sh
    const checks = [
      [/^# Implementation Report:/m, '# Implementation Report:'],
      [/Implementation Round/m, 'compatibility table with Implementation Round'],
      [/Plan Version/m, 'compatibility table with Plan Version'],
      [/^### Summary$/m, '### Summary'],
      [/^### Step Results$/m, '### Step Results'],
      [/^### Issues$/m, '### Issues'],
      [/^### Out-of-Plan Work$/m, '### Out-of-Plan Work'],
    ];
    for (const [re, label] of checks) {
      if (!re.test(content)) {
        return { ok: false, reason: `implementation doc missing: ${label}` };
      }
    }
    return { ok: true };
  }

  if (relpath.endsWith('.audit.md')) {
    // Required per validate-audit.sh
    const checks = [
      [/^# Architect Audit:/m, '# Architect Audit:'],
      [/^## Conformance$/m, '## Conformance'],
      [/^## Acceptance Criteria Check$/m, '## Acceptance Criteria Check'],
      [/^## Implementation quality check$/m, '## Implementation quality check'],
      [/^## Risk Re-evaluation$/m, '## Risk Re-evaluation'],
      [/^## Decision$/m, '## Decision'],
      [/\*\*Verdict\*\*:\s*(ready|needs-fixes|plan-fix|re-plan)/m, '**Verdict**: ready|needs-fixes|plan-fix|re-plan'],
    ];
    for (const [re, label] of checks) {
      if (!re.test(content)) {
        return { ok: false, reason: `audit doc missing: ${label}` };
      }
    }
    return { ok: true };
  }

  // feat-* and .context. docs: require at least one ## heading (no dedicated shell validator for these types)
  if (!/^## /m.test(content)) {
    return { ok: false, reason: 'workflow doc has no level-2 headings (## )' };
  }
  return { ok: true };
}

function isWorkflowDoc(relpath) {
  if (!relpath.endsWith('.md')) return false;
  return (
    relpath.endsWith('.plan.md') ||
    relpath.endsWith('.review.md') ||
    relpath.endsWith('.implementation.md') ||
    relpath.endsWith('.audit.md') ||
    relpath.includes('feat-') ||
    relpath.includes('.context.')
  );
}

let allOk = true;

for (const relpath of changedPaths) {
  const abspath = join(targetRoot, relpath);
  if (!existsSync(abspath)) {
    console.error(`  [FAIL] ${relpath}: file does not exist`);
    allOk = false;
    continue;
  }

  const content = readFileSync(abspath, 'utf8');

  if (relpath === '.pythia/config/paths.md' || relpath.endsWith('/config/paths.md')) {
    const pathsResult = verifyPathsMdWorkflowDocs(content);
    if (!pathsResult.ok) {
      console.error(`  [FAIL] ${relpath}: ${pathsResult.reason}`);
      allOk = false;
      continue;
    }
  }

  if (isWorkflowDoc(relpath)) {
    const result = validateWorkflowDoc(content, relpath);
    if (result.ok) {
      console.log(`  [OK] ${relpath}`);
    } else {
      console.error(`  [FAIL] ${relpath}: ${result.reason}`);
      allOk = false;
    }
  } else {
    console.log(`  [OK] ${relpath} (existence confirmed)`);
  }
}

if (!allOk) {
  console.error(`verify ${version}: FAILED`);
  process.exit(1);
}
console.log(`verify ${version}: OK`);
