#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { parseArtifactMetadata, getArtifactField, inferArtifactType } from '../lib/metadata/parse.js';
import {
  SCHEMA_VERSION,
  OPTIONAL_FIELDS,
  UNIVERSAL_FIELDS,
  schemaForArtifact,
  artifactTypes,
} from '../lib/metadata/schema.js';

function usage() {
  console.error('Usage: node tools/checks/artifact-metadata.js [--strict] <file.md>');
}

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const file = args.find((arg) => arg !== '--strict');
if (!file) {
  usage();
  process.exit(2);
}
if (!existsSync(file)) {
  console.error(`${file}:0: [io.missing_file] File not found`);
  process.exit(2);
}

const content = readFileSync(file, 'utf8');
const parsed = parseArtifactMetadata(content);
const errors = [];
const warnings = [];
const ALLOWED_FIELDS = new Set([...UNIVERSAL_FIELDS, ...OPTIONAL_FIELDS]);

function diag(list, line, code, message) {
  list.push(`${file}:${line}: [artifact-metadata.${code}] ${message}`);
}

if (!parsed.found) {
  diag(strict ? errors : warnings, 0, 'missing_section', 'Missing ## Metadata section');
} else {
  if (parsed.duplicate) diag(errors, parsed.startLine, 'duplicate_section', 'Expected exactly one ## Metadata section');

  const schema = getArtifactField(parsed, 'Schema');
  if (schema !== SCHEMA_VERSION) {
    const target = strict || schema ? errors : warnings;
    diag(target, parsed.fields.get('Schema')?.line ?? parsed.startLine, 'schema', `Expected Schema: ${SCHEMA_VERSION}`);
  }

  const preMigrationAdvisory = !strict && !schema;
  if (preMigrationAdvisory) {
    for (const warning of warnings) console.error(warning);
    process.exit(0);
  }

  const metadataArtifact = getArtifactField(parsed, 'Artifact');
  const artifact = inferArtifactType(file, metadataArtifact);
  const inferred = inferArtifactType(file);
  if (!artifact || !schemaForArtifact(artifact)) {
    diag(errors, parsed.fields.get('Artifact')?.line ?? parsed.startLine, 'artifact', `Artifact must be one of: ${artifactTypes().join(', ')}`);
  } else {
    const spec = schemaForArtifact(artifact);
    for (const entry of parsed.entries) {
      if (!ALLOWED_FIELDS.has(entry.key)) {
        diag(errors, entry.line, 'unknown_field', `Unknown metadata field for ${SCHEMA_VERSION}: ${entry.key}`);
      }
    }

    if (inferred && metadataArtifact && inferred !== metadataArtifact) {
      const allowedContextPair = inferred === 'context' && metadataArtifact === 'research-context';
      const allowedGenericNote = inferred === 'note' && metadataArtifact !== 'note';
      if (!allowedContextPair) {
        if (!allowedGenericNote) {
          diag(errors, parsed.fields.get('Artifact').line, 'artifact_mismatch', `Artifact ${metadataArtifact} does not match inferred type ${inferred}`);
        }
      }
    }

    for (const key of spec.required) {
      if (!getArtifactField(parsed, key)) {
        diag(errors, parsed.startLine, 'missing_field', `Missing required metadata field: ${key}`);
      }
    }

    for (const [key, values] of Object.entries(spec.enums ?? {})) {
      const entry = parsed.fields.get(key);
      if (entry && !values.includes(entry.value)) {
        diag(errors, entry.line, 'enum', `${key} must be one of: ${values.join(' | ')} (got: ${entry.value})`);
      }
    }

    const generator = parsed.fields.get('Generator');
    if (generator && spec.generators?.length && !spec.generators.includes(generator.value)) {
      diag(errors, generator.line, 'generator', `Generator must be one of: ${spec.generators.join(' | ')} (got: ${generator.value})`);
    }
  }

}

for (const warning of warnings) console.error(warning);
for (const error of errors) console.error(error);
process.exit(errors.length > 0 || (strict && warnings.length > 0) ? 1 : 0);
