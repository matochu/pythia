import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const thisDir = dirname(fileURLToPath(import.meta.url));
// tools/lib/metadata/ → tools/lib/ → tools/ → repo root (dev)
// .pythia/runtime/lib/metadata/ → same depth (materialized)
const repoRoot = resolve(thisDir, '../../..');

// Baked contract: .pythia/runtime/lib/metadata/../../metadata-contract.json = .pythia/runtime/metadata-contract.json
const bakedContractPath = resolve(thisDir, '../..', 'metadata-contract.json');

let contract;
if (existsSync(bakedContractPath)) {
  contract = JSON.parse(readFileSync(bakedContractPath, 'utf8'));
} else {
  const contractPath = [
    resolve(repoRoot, 'skills/workflow/references/artifact-metadata.md'),
    resolve(repoRoot, '.agents/skills/workflow/references/artifact-metadata.md'),
    resolve(repoRoot, '../../.agents/skills/workflow/references/artifact-metadata.md'),
    resolve(process.cwd(), 'skills/workflow/references/artifact-metadata.md'),
    resolve(process.cwd(), '.agents/skills/workflow/references/artifact-metadata.md'),
  ].find((candidate) => existsSync(candidate));

  if (!contractPath) {
    throw new Error('Missing artifact metadata contract block source');
  }

  const contractDoc = readFileSync(contractPath, 'utf8');
  const contractMatch = contractDoc.match(/```json artifact-metadata-contract\n([\s\S]*?)\n```/);

  if (!contractMatch) {
    throw new Error(`Missing artifact metadata contract block in ${contractPath}`);
  }

  contract = JSON.parse(contractMatch[1]);
}

export const SCHEMA_VERSION = contract.schemaVersion;
export const FORBIDDEN_KEYS = contract.forbiddenKeys ?? [];
export const CLASSIFICATION_ORDER = contract.classificationOrder ?? [];
export const ARTIFACT_METADATA = contract.artifacts;

// v1 compat exports (used by existing checker and tests)
export const UNIVERSAL_FIELDS = contract.universalFields ?? [];
export const OPTIONAL_FIELDS = contract.optionalFields ?? [];

export function artifactTypes() {
  return Object.keys(ARTIFACT_METADATA);
}

export function schemaForArtifact(artifact) {
  return ARTIFACT_METADATA[artifact] ?? null;
}

/**
 * Infer artifact kind from file path using suffix-first classification.
 * Fixes retro misclassification (feat-*.retro.md → retro, not feature).
 */
export function inferArtifactKind(file) {
  const base = basename(file);
  // Suffix-specific checks before generic feat-* / *.md (order matters)
  if (base.endsWith('.retro.md')) return 'retro';
  if (base.endsWith('.plan.md')) return 'plan';
  if (base.endsWith('.review.md')) return 'review';
  if (base.endsWith('.implementation.md')) return 'implementation-report';
  if (base.endsWith('.audit.md')) return 'audit-report';
  if (base.endsWith('.context.md') || base.endsWith('.ctx.md')) return 'context';
  if (base.startsWith('feat-') && base.endsWith('.md')) return 'feature';
  if (base.endsWith('.md')) return 'note';
  return null;
}
