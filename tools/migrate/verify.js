#!/usr/bin/env node
// migrate:verify <version> — validate changedPaths from state.json using workflow-doc rules.
import { join, resolve, dirname } from 'path';
import { existsSync, readFileSync, realpathSync } from 'fs';
import { fileURLToPath } from 'url';
import { readState } from './state.js';
import { readManifest } from './manifest.js';
import { verifyPathsMdWorkflowDocs } from '../lib/paths-md-invariants.js';
import { parseArtifactMetadata, getArtifactField, metadataFormatDiagnostics } from '../lib/metadata/parse.js';
import { FORBIDDEN_KEYS, schemaForArtifact, inferArtifactKind } from '../lib/metadata/schema.js';

const MIGRATION_TOLERATED_LEGACY_FIELDS = new Set([
  'Created',
  'Updated',
  'Subject',
  'Subject-Version',
  'Plan-Id',
  'Last review round',
  'Last Review Round',
  'Last Status',
]);

// Target derived from this script's materialized location: .pythia/runtime/migrate/verify.js
const targetRoot = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../..'));
const args = process.argv.slice(2);
const version = args.find((a) => !a.startsWith('-') && /^\d+\.\d+\.\d+$/.test(a));
const verbose = args.includes('--verbose') || args.includes('-v');

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

// Inline v2 metadata validator for workflow documents after migration.
// Returns {ok, reason}.
function validateV2Metadata(content, relpath) {
  const metadata = parseArtifactMetadata(content);
  if (!metadata.found) return { ok: false, reason: 'missing ## Metadata section' };
  if (metadata.duplicate) return { ok: false, reason: 'duplicate ## Metadata sections' };
  const formatIssue = metadataFormatDiagnostics(metadata)[0];
  if (formatIssue) return { ok: false, reason: formatIssue.message };

  // Forbidden key check — scan raw metadata lines to catch Title-case keys
  const metaLines = content.split('\n').slice(metadata.startLine, metadata.endLine);
  for (const line of metaLines) {
    const m = line.match(/^\s*(?:-\s+)?([A-Za-z][A-Za-z0-9_-]*):\s*.+$/);
    if (m && FORBIDDEN_KEYS.includes(m[1])) {
      return { ok: false, reason: `forbidden v2 metadata key: ${m[1]}` };
    }
  }
  // Also check bold-bullet v1 keys (Schema, Title, etc.) as forbidden
  for (const entry of metadata.entries) {
    if (FORBIDDEN_KEYS.includes(entry.key)) {
      return { ok: false, reason: `forbidden v2 metadata key: ${entry.key}` };
    }
  }

  const kind = inferArtifactKind(relpath);
  const spec = kind ? schemaForArtifact(kind) : null;
  if (!spec) {
    // Unknown kind — pass with advisory (not a hard failure for migration verify)
    return { ok: true };
  }

  const missing = (spec.required ?? []).find((key) => !getArtifactField(metadata, key));
  if (missing) return { ok: false, reason: `missing required v2 field for ${kind}: ${missing}` };

  for (const [key, values] of Object.entries(spec.enums ?? {})) {
    const value = getArtifactField(metadata, key);
    if (value && !values.includes(value)) {
      return { ok: false, reason: `${key} must be one of: ${values.join(' | ')} (got: ${value})` };
    }
  }

  return { ok: true };
}

function validateWorkflowDoc(content, relpath) {
  if (!content || content.trim().length === 0) {
    return { ok: false, reason: 'file is empty' };
  }
  const metadata = parseArtifactMetadata(content);
  // Pipeline artifacts must have a ## Metadata section after migration.
  const isPipelineArtifact = ['.plan.md', '.review.md', '.implementation.md', '.audit.md']
    .some((s) => relpath.endsWith(s));
  if (isPipelineArtifact && !metadata.found) {
    return { ok: false, reason: 'missing ## Metadata section' };
  }
  // Migration verify scope: metadata correctness only.
  // Structural section rules are enforced by structure.js at edit time, not here.
  if (metadata.found && metadata.entries.length > 0) {
    return validateV2Metadata(content, relpath);
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
      if (verbose) console.log(`  [OK] ${relpath}`);
    } else {
      console.error(`  [FAIL] ${relpath}: ${result.reason}`);
      allOk = false;
    }
  } else {
    if (verbose) console.log(`  [OK] ${relpath} (existence confirmed)`);
  }
}

if (!allOk) {
  console.error(`verify ${version}: FAILED`);
  process.exit(1);
}
console.log(`verify ${version}: OK`);
