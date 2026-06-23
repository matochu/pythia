#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { parseArtifactMetadata, getArtifactField, inferArtifactType, metadataFormatDiagnostics } from '../lib/metadata/parse.js';
import {
  FORBIDDEN_KEYS,
  schemaForArtifact,
  artifactTypes,
  inferArtifactKind,
} from '../lib/metadata/schema.js';

// ── V1 compat spec (frozen — used only for files still carrying Schema: pythia-artifact-v1) ──

const V1_UNIVERSAL = ['Schema', 'Id', 'Title', 'Artifact'];
const V1_OPTIONAL = ['Feature', 'Status', 'Version', 'Generator', 'Plan', 'Plan-Version', 'Review', 'Implementation', 'Round', 'Verdict', 'Result', 'Branch', 'Shape', 'Sub-category', 'Tags'];
const V1_ALLOWED = new Set([...V1_UNIVERSAL, ...V1_OPTIONAL]);

const V1_SPEC = {
  feature:                { required: [...V1_UNIVERSAL], enums: { Status: ['draft','active','completed','archived','cancelled'] }, generators: ['feat'] },
  context:                { required: [...V1_UNIVERSAL], enums: { Status: ['draft','ready','active','archived'], Shape: ['notes','survey','decision-record','source-summary'] }, generators: ['ctx','research'] },
  'research-context':     { required: [...V1_UNIVERSAL], enums: { Status: ['draft','ready-for-plan','ready','archived'], Shape: ['survey','options','source-summary','decision-support'] }, generators: ['research'] },
  plan:                   { required: [...V1_UNIVERSAL, 'Status','Version','Branch','Round'], enums: { Status: ['Draft','Ready for implementation','In progress','Implemented','Blocked','Archived','Cancelled'] }, generators: ['plan','replan'] },
  review:                 { required: [...V1_UNIVERSAL, 'Plan','Plan-Version','Round','Verdict'], enums: { Status: ['active','completed','archived'], Verdict: ['READY','NEEDS_REVISION'] }, generators: ['review'] },
  'implementation-report':{ required: [...V1_UNIVERSAL, 'Plan','Plan-Version','Review','Round','Result'], enums: { Status: ['active','completed','blocked'], Result: ['implemented','partial','blocked','failed'] }, generators: ['implement'] },
  'audit-report':         { required: [...V1_UNIVERSAL, 'Implementation','Round','Verdict'], enums: { Status: ['active','completed'], Verdict: ['ready','needs-fixes','plan-fix','re-plan'] }, generators: ['audit'] },
  retro:                  { required: [...V1_UNIVERSAL], enums: { Status: ['active','completed','archived'] }, generators: ['retro'] },
  note:                   { required: [...V1_UNIVERSAL], enums: {}, generators: ['manual','migration'] },
};

// ── CLI ─────────────────────────────────────────────────────────────────────

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

function diag(list, line, code, message) {
  list.push(`${file}:${line}: [artifact-metadata.${code}] ${message}`);
}

if (!parsed.found) {
  diag(strict ? errors : warnings, 0, 'missing_section', 'Missing ## Metadata section');
} else {
  if (parsed.duplicate) diag(errors, parsed.startLine, 'duplicate_section', 'Expected exactly one ## Metadata section');

  const schemaField = getArtifactField(parsed, 'Schema');
  const isV1 = Boolean(schemaField);

  if (isV1) {
    // ── V1 backward-compat validation ─────────────────────────────────────
    // Schema key is now forbidden in v2 — warn (strict: error)
    diag(strict ? errors : warnings, parsed.fields.get('Schema')?.line ?? parsed.startLine, 'forbidden_key',
      `Schema is a forbidden v2 metadata key — run migration to convert to v2 list format`);

    const metadataArtifact = getArtifactField(parsed, 'Artifact');
    const artifact = inferArtifactType(file, metadataArtifact);
    const inferred = inferArtifactType(file);
    const spec = V1_SPEC[artifact];

    if (!spec) {
      diag(errors, parsed.fields.get('Artifact')?.line ?? parsed.startLine, 'artifact', `Artifact must be one of: ${Object.keys(V1_SPEC).join(', ')}`);
    } else {
      // Unknown field check
      for (const entry of parsed.entries) {
        if (!V1_ALLOWED.has(entry.key)) {
          diag(errors, entry.line, 'unknown_field', `Unknown metadata field for pythia-artifact-v1: ${entry.key}`);
        }
      }

      // Artifact mismatch
      if (inferred && metadataArtifact && inferred !== metadataArtifact) {
        const allowedContextPair = inferred === 'context' && metadataArtifact === 'research-context';
        const allowedGenericNote = inferred === 'note' && metadataArtifact !== 'note';
        if (!allowedContextPair && !allowedGenericNote) {
          diag(errors, parsed.fields.get('Artifact')?.line ?? parsed.startLine, 'artifact_mismatch',
            `Artifact ${metadataArtifact} does not match inferred type ${inferred}`);
        }
      }

      // Required fields
      for (const key of (spec.required ?? [])) {
        if (!getArtifactField(parsed, key)) {
          diag(errors, parsed.startLine, 'missing_field', `Missing required metadata field: ${key}`);
        }
      }

      // Enum validation
      for (const [key, values] of Object.entries(spec.enums ?? {})) {
        const entry = parsed.fields.get(key);
        if (entry && !values.includes(entry.value)) {
          diag(errors, entry.line, 'enum', `${key} must be one of: ${values.join(' | ')} (got: ${entry.value})`);
        }
      }

      // Generator validation
      const generator = parsed.fields.get('Generator');
      if (generator && spec.generators?.length && !spec.generators.includes(generator.value)) {
        diag(errors, generator.line, 'generator', `Generator must be one of: ${spec.generators.join(' | ')} (got: ${generator.value})`);
      }
    }
  } else {
    // ── V2 validation (path-inferred kind, list key:value, no Schema) ────
    const isEmpty = parsed.entries.length === 0;
    const formatIssues = metadataFormatDiagnostics(parsed);
    for (const issue of formatIssues) {
      diag(strict ? errors : warnings, issue.line, issue.code, issue.message);
    }

    // Forbidden key check (v2 banned fields) — scan raw lines to catch uppercase-first keys
    // and non-canonical bare keys that the canonical v2 parser skips.
    const metaLines = content.split('\n').slice(parsed.startLine, parsed.endLine);
    for (let i = 0; i < metaLines.length; i++) {
      const m = metaLines[i].match(/^\s*(?:-\s+)?([A-Za-z][A-Za-z0-9_-]*):\s*.+$/);
      if (m && FORBIDDEN_KEYS.includes(m[1])) {
        diag(errors, parsed.startLine + i + 1, 'forbidden_key', `${m[1]} is a forbidden v2 metadata key (inferred from path)`);
      }
    }

    // No fields: fail strict only when the inferred kind has required fields
    if (isEmpty) {
      const kindForEmpty = inferArtifactKind(file);
      const specForEmpty = kindForEmpty ? schemaForArtifact(kindForEmpty) : null;
      const hasRequired = specForEmpty && (specForEmpty.required ?? []).length > 0;
      if (strict && hasRequired) diag(errors, parsed.startLine, 'missing_section', 'No metadata fields found');
      // else: empty section is fine for all-optional kinds (note, retro, feature, context)
    } else {
      const kind = inferArtifactKind(file);
      // Also check already-parsed entries (lowercase forbidden keys if any)
      for (const entry of parsed.entries) {
        if (FORBIDDEN_KEYS.includes(entry.key)) {
          diag(errors, entry.line, 'forbidden_key', `${entry.key} is a forbidden v2 metadata key (inferred from path)`);
        }
      }

      if (!kind || !schemaForArtifact(kind)) {
        diag(strict ? errors : warnings, parsed.startLine, 'unknown_kind', `Cannot infer artifact kind from path: ${file}`);
      } else {
        const spec = schemaForArtifact(kind);
        const allowed = new Set([...(spec.required ?? []), ...(spec.optional ?? [])]);

        // Unknown fields
        for (const entry of parsed.entries) {
          if (!FORBIDDEN_KEYS.includes(entry.key) && !allowed.has(entry.key)) {
            diag(strict ? errors : warnings, entry.line, 'unknown_field', `Unknown v2 metadata field for ${kind}: ${entry.key}`);
          }
        }

        // Required fields
        for (const key of (spec.required ?? [])) {
          if (!getArtifactField(parsed, key)) {
            diag(strict ? errors : warnings, parsed.startLine, 'missing_field', `Missing required v2 metadata field for ${kind}: ${key}`);
          }
        }

        // Enum validation
        for (const [key, values] of Object.entries(spec.enums ?? {})) {
          const entry = parsed.fields.get(key);
          if (entry && !values.includes(entry.value)) {
            diag(strict ? errors : warnings, entry.line, 'enum', `${key} must be one of: ${values.join(' | ')} (got: ${entry.value})`);
          }
        }
      }
    }
  }
}

for (const warning of warnings) console.error(warning);
for (const error of errors) console.error(error);
process.exit(errors.length > 0 || (strict && warnings.length > 0) ? 1 : 0);
