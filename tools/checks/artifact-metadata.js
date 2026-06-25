#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { parseArtifactMetadata, getArtifactField, metadataFormatDiagnostics } from '../lib/metadata/parse.js';
import {
  FORBIDDEN_KEYS,
  schemaForArtifact,
  inferArtifactKind,
} from '../lib/metadata/schema.js';

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

  // v1 file (has Schema field) — flag only Schema and stop; no v2 checks on unmigrated files
  if (parsed.fields.get('Schema')) {
    diag(errors, parsed.fields.get('Schema').line, 'forbidden_key',
      `File uses v1 metadata format (Schema: pythia-artifact-v1) — run migration to convert to v2`);
    for (const e of errors) console.error(e);
    process.exit(1);
  }

  // ── V2 validation (path-inferred kind, list key:value) ─────────────────
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

for (const warning of warnings) console.error(warning);
for (const error of errors) console.error(error);
process.exit(errors.length > 0 || (strict && warnings.length > 0) ? 1 : 0);
