import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
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
export const UNIVERSAL_FIELDS = contract.universalFields;
export const OPTIONAL_FIELDS = contract.optionalFields;
export const ARTIFACT_METADATA = contract.artifacts;

export function artifactTypes() {
  return Object.keys(ARTIFACT_METADATA);
}

export function schemaForArtifact(artifact) {
  return ARTIFACT_METADATA[artifact] ?? null;
}
