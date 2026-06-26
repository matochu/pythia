import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  ARTIFACT_METADATA,
  FORBIDDEN_KEYS,
  SCHEMA_VERSION,
} from '../../lib/metadata/schema.js';
import { metadataFormatDiagnostics, parseArtifactMetadata } from '../../lib/metadata/parse.js';

const checker = 'tools/checks/artifact-metadata.js';
const reference = 'skills/workflow/references/artifact-metadata.md';
const fixturesRoot = 'tools/fixtures/artifact-metadata';
const workflowFixturesRoot = 'tools/fixtures/workflow-docs';

function referenceContract() {
  const doc = readFileSync(reference, 'utf8');
  const match = doc.match(/```json artifact-metadata-contract\n([\s\S]*?)\n```/);
  if (!match) throw new Error('Missing artifact-metadata-contract JSON block');
  return JSON.parse(match[1]);
}

function run(args) {
  const result = spawnSync(process.execPath, [checker, ...args], { encoding: 'utf8' });
  return { code: result.status, stderr: result.stderr };
}

/** Create a v2 list metadata file for a given filename and fields. */
function metadataV2(fields) {
  const fieldLines = Object.entries(fields).map(([key, value]) => `- ${key}: ${value}`).join('\n');
  return `# Fixture\n\n## Metadata\n\n${fieldLines}\n\n## Body\n\nFixture.\n`;
}


function withTempFile(name, content, fn) {
  const dir = mkdtempSync(join(tmpdir(), 'pythia-artifact-metadata-'));
  try {
    const file = join(dir, name);
    writeFileSync(file, content, 'utf8');
    return fn(file);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// ── parseArtifactMetadata ──────────────────────────────────────────────────

describe('parseArtifactMetadata', () => {
  it('parses v2 list key:value metadata fields and line numbers', () => {
    const parsed = parseArtifactMetadata(readFileSync(join(fixturesRoot, 'valid/example.plan.md'), 'utf8'));
    expect(parsed.found).toBe(true);
    expect(parsed.fields.get('status').value).toBe('draft');
    expect(parsed.fields.get('status').line).toBeGreaterThan(0);
    expect(parsed.format).toBe('v2');
    expect(metadataFormatDiagnostics(parsed)).toEqual([]);
  });

  it('reports legacy bare v2 fields without accepting them as parsed fields', () => {
    const content = '# Fixture\n\n## Metadata\n\nstatus: draft\nversion: v1\n';
    const parsed = parseArtifactMetadata(content);
    expect(parsed.fields.has('status')).toBe(false);
    expect(parsed.entries).toEqual([]);
    expect(parsed.format).toBe(null);
    expect(metadataFormatDiagnostics(parsed).map((issue) => issue.code)).toEqual([
      'non_canonical_format',
      'non_canonical_format',
    ]);
  });

  it('detects duplicate metadata sections', () => {
    const content = readFileSync(join(fixturesRoot, 'valid/example.plan.md'), 'utf8') + '\n## Metadata\n\n- status: draft\n';
    const parsed = parseArtifactMetadata(content);
    expect(parsed.duplicate).toBe(true);
  });
});

// ── valid fixtures ─────────────────────────────────────────────────────────

describe('artifact-metadata.js', () => {
  for (const name of readdirSync(join(fixturesRoot, 'valid'))) {
    it(`accepts valid v2 fixture ${name}`, () => {
      const fixture = join(fixturesRoot, 'valid', name);
      const parsed = parseArtifactMetadata(readFileSync(fixture, 'utf8'));
      expect(metadataFormatDiagnostics(parsed)).toEqual([]);
      const result = run([fixture]);
      expect(result.stderr).toBe('');
      expect(result.code).toBe(0);
    });
  }

  for (const name of readdirSync(join(workflowFixturesRoot, 'valid'))) {
    it(`accepts workflow valid fixture ${name}`, () => {
      const fixture = join(workflowFixturesRoot, 'valid', name);
      const parsed = parseArtifactMetadata(readFileSync(fixture, 'utf8'));
      expect(metadataFormatDiagnostics(parsed)).toEqual([]);
      const result = run([fixture]);
      expect(result.stderr).toBe('');
      expect(result.code).toBe(0);
    });
  }

  // ── v2 validation ──────────────────────────────────────────────────────

  it('accepts v2 plan with required fields', () => {
    withTempFile('ok.plan.md', metadataV2({ status: 'draft', version: 'v1', branch: 'main' }), (file) => {
      expect(run([file]).code).toBe(0);
    });
  });

  it('accepts v2 review with required fields', () => {
    withTempFile('ok.review.md', metadataV2({ status: 'active', plan_version: 'v1', round: 'R1', verdict: 'ready' }), (file) => {
      expect(run([file]).code).toBe(0);
    });
  });

  it('accepts v2 implementation-report with required fields', () => {
    withTempFile('ok.implementation.md', metadataV2({ status: 'completed', plan_version: 'v1', round: 'I1', result: 'implemented' }), (file) => {
      expect(run([file]).code).toBe(0);
    });
  });

  it('accepts v2 audit-report with required fields', () => {
    withTempFile('ok.audit.md', metadataV2({ status: 'completed', round: 'A1', verdict: 'ready' }), (file) => {
      expect(run([file]).code).toBe(0);
    });
  });

  it('warns (not errors) on v2 plan missing required fields in non-strict mode', () => {
    withTempFile('missing.plan.md', metadataV2({ branch: 'main' }), (file) => {
      const r = run([file]);
      expect(r.code).toBe(0); // non-strict: warnings only
      expect(r.stderr).toMatch(/missing_field/);
    });
  });

  it('errors on v2 plan missing required fields in --strict mode', () => {
    withTempFile('missing.plan.md', metadataV2({ branch: 'main' }), (file) => {
      const r = run(['--strict', file]);
      expect(r.code).toBe(1);
      expect(r.stderr).toMatch(/missing_field/);
    });
  });

  it('warns on legacy bare v2 metadata and errors in strict mode', () => {
    withTempFile('bare.plan.md', '# Fixture\n\n## Metadata\n\nstatus: draft\nversion: v1\n\n## Body\n', (file) => {
      const nonStrict = run([file]);
      expect(nonStrict.code).toBe(0);
      expect(nonStrict.stderr).toMatch(/non_canonical_format/);

      const strictResult = run(['--strict', file]);
      expect(strictResult.code).toBe(1);
      expect(strictResult.stderr).toMatch(/non_canonical_format/);
    });
  });

  it('warns on bare implementation fixture shape even when all required fields are present', () => {
    withTempFile('bare.implementation.md', [
      '# Fixture',
      '',
      '## Metadata',
      '',
      'status: completed',
      'plan_version: v1',
      'round: I1',
      'result: implemented',
      '',
      '## Body',
      '',
    ].join('\n'), (file) => {
      const nonStrict = run([file]);
      expect(nonStrict.code).toBe(0);
      expect(nonStrict.stderr).toMatch(/non_canonical_format/);

      const strictResult = run(['--strict', file]);
      expect(strictResult.code).toBe(1);
      expect(strictResult.stderr).toMatch(/non_canonical_format/);
    });
  });

  it('errors on forbidden key Schema in v2 file (non-strict)', () => {
    withTempFile('forbidden.plan.md', `# Fixture\n\n## Metadata\n\n- status: draft\n- version: v1\n- Schema: pythia-artifact-v1\n\n## Body\n`, (file) => {
      const r = run([file]);
      expect(r.code).toBe(1);
      expect(r.stderr).toMatch(/forbidden_key/);
    });
  });

  it('errors on forbidden key Id in v2 file', () => {
    withTempFile('forbidden-id.review.md', `# Fixture\n\n## Metadata\n\n- status: active\n- plan_version: v1\n- round: R1\n- verdict: ready\n- Id: slug\n\n## Body\n`, (file) => {
      const r = run([file]);
      expect(r.code).toBe(1);
      expect(r.stderr).toMatch(/forbidden_key/);
    });
  });

  it('retro file (feat-*.retro.md) is classified as retro, not feature', () => {
    withTempFile('feat-2026-05-example.retro.md', metadataV2({ status: 'active' }), (file) => {
      expect(run([file]).code).toBe(0);
    });
  });

  it('fails duplicate metadata sections', () => {
    const base = readFileSync(join(fixturesRoot, 'valid/example.plan.md'), 'utf8');
    withTempFile('example.plan.md', `${base}\n## Metadata\n\n- status: draft\n`, (file) => {
      const result = run([file]);
      expect(result.code).toBe(1);
      expect(result.stderr).toMatch(/duplicate_section/);
    });
  });

  it('accepts pre-migration v2 files with empty metadata (no fields)', () => {
    withTempFile('empty.plan.md', `# Empty\n\n## Metadata\n\n## Body\n`, (file) => {
      expect(run([file]).code).toBe(0);
    });
  });

});


// ── v2 enum validation ──────────────────────────────────────────────────────

describe('artifact-metadata.js: v2 enum validation', () => {
  it('warns (non-strict) on v2 plan with invalid status enum', () => {
    withTempFile('bad-status.plan.md', metadataV2({ status: 'invalid-status', version: 'v1' }), (file) => {
      const r = run([file]);
      expect(r.code).toBe(0); // non-strict: warning
      expect(r.stderr).toMatch(/enum/);
    });
  });

  it('errors (--strict) on v2 plan with invalid status enum', () => {
    withTempFile('bad-status.plan.md', metadataV2({ status: 'invalid-status', version: 'v1' }), (file) => {
      const r = run(['--strict', file]);
      expect(r.code).toBe(1);
      expect(r.stderr).toMatch(/enum/);
    });
  });

  it('accepts v2 plan with valid status (draft)', () => {
    withTempFile('ok-status.plan.md', metadataV2({ status: 'draft', version: 'v1' }), (file) => {
      expect(run([file]).code).toBe(0);
    });
  });

  it('warns on v2 review with invalid verdict enum', () => {
    withTempFile('bad-verdict.review.md', metadataV2({ status: 'active', plan_version: 'v1', round: 'R1', verdict: 'APPROVED' }), (file) => {
      const r = run([file]);
      expect(r.stderr).toMatch(/enum/);
    });
  });

  it('warns on v2 audit-report with invalid verdict enum', () => {
    withTempFile('bad-audit.audit.md', metadataV2({ status: 'completed', round: 'A1', verdict: 'PASS' }), (file) => {
      const r = run([file]);
      expect(r.stderr).toMatch(/enum/);
    });
  });
});


// ── contract drift ─────────────────────────────────────────────────────────

describe('artifact metadata reference', () => {
  it('keeps reference JSON contract aligned with schema.js exports', () => {
    const contract = referenceContract();
    expect(contract.schemaVersion).toBe(SCHEMA_VERSION);
    expect(contract.forbiddenKeys).toEqual(FORBIDDEN_KEYS);
    expect(contract.artifacts).toEqual(ARTIFACT_METADATA);
  });

  it('documents every artifact kind and closed enum from the v2 schema', () => {
    const doc = readFileSync(reference, 'utf8');
    for (const [kind, spec] of Object.entries(ARTIFACT_METADATA)) {
      // kind name should appear in the reference doc
      expect(doc).toContain(kind);
      for (const [field, values] of Object.entries(spec.enums ?? {})) {
        expect(doc).toContain(field);
        for (const value of values) {
          expect(doc).toContain(value);
        }
      }
    }
  });

  it('reference lists FORBIDDEN_KEYS', () => {
    const doc = readFileSync(reference, 'utf8');
    for (const key of FORBIDDEN_KEYS) {
      expect(doc).toContain(key);
    }
  });
});
