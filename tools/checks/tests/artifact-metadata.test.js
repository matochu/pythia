import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  ARTIFACT_METADATA,
  OPTIONAL_FIELDS,
  SCHEMA_VERSION,
  UNIVERSAL_FIELDS,
} from '../../lib/metadata/schema.js';
import { parseArtifactMetadata } from '../../lib/metadata/parse.js';

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

function metadata(fields) {
  return `# Fixture

## Metadata

${Object.entries(fields).map(([key, value]) => `- **${key}**: ${value}`).join('\n')}

## Body

Fixture.
`;
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

describe('parseArtifactMetadata', () => {
  it('parses bullet metadata fields and line numbers', () => {
    const parsed = parseArtifactMetadata(readFileSync(join(fixturesRoot, 'valid/example.plan.md'), 'utf8'));
    expect(parsed.found).toBe(true);
    expect(parsed.fields.get('Id').value).toBe('example');
    expect(parsed.fields.get('Id').line).toBeGreaterThan(0);
  });

  it('detects duplicate metadata sections', () => {
    const parsed = parseArtifactMetadata(`${readFileSync(join(fixturesRoot, 'valid/example.plan.md'), 'utf8')}\n## Metadata\n\n- **Id**: duplicate\n`);
    expect(parsed.duplicate).toBe(true);
  });
});

describe('artifact-metadata.js', () => {
  for (const name of readdirSync(join(fixturesRoot, 'valid'))) {
    it(`accepts valid fixture ${name}`, () => {
      expect(run([join(fixturesRoot, 'valid', name)]).code).toBe(0);
    });
  }

  for (const name of readdirSync(join(workflowFixturesRoot, 'valid'))) {
    it(`accepts workflow valid fixture ${name}`, () => {
      const result = run([join(workflowFixturesRoot, 'valid', name)]);
      expect(result.stderr).toBe('');
      expect(result.code).toBe(0);
    });
  }

  it('keeps review Status and Verdict separate when optional Status is present', () => {
    const content = metadata({
      Schema: 'pythia-artifact-v1',
      Id: 'example-review',
      Title: 'Example Review',
      Artifact: 'review',
      Status: 'completed',
      Plan: 'plans/example.plan.md',
      'Plan-Version': 'v1',
      Round: 'R1',
      Verdict: 'NEEDS_REVISION',
    });
    withTempFile('example.review.md', content, (file) => {
      expect(run([file]).code).toBe(0);
    });
  });

  it('fails review metadata missing Verdict', () => {
    const content = metadata({
      Schema: 'pythia-artifact-v1',
      Id: 'example-review',
      Title: 'Example Review',
      Artifact: 'review',
      Plan: 'plans/example.plan.md',
      'Plan-Version': 'v1',
      Round: 'R1',
    });
    withTempFile('example.review.md', content, (file) => {
      const result = run([file]);
      expect(result.code).toBe(1);
      expect(result.stderr).toMatch(/Missing required metadata field: Verdict/);
    });
  });

  it('fails duplicate metadata sections', () => {
    withTempFile('example.plan.md', `${readFileSync(join(fixturesRoot, 'valid/example.plan.md'), 'utf8')}\n## Metadata\n\n- **Id**: duplicate\n`, (file) => {
      const result = run([file]);
      expect(result.code).toBe(1);
      expect(result.stderr).toMatch(/duplicate_section/);
    });
  });

  it('accepts pre-migration files by default and fails them under --strict', () => {
    withTempFile('legacy.plan.md', '# Plan\n\n## Metadata\n\n- **Plan-Id**: legacy\n- **Plan-Version**: v1\n', (file) => {
      expect(run([file]).code).toBe(0);
      expect(run(['--strict', file]).code).toBe(1);
    });
  });

  it('fails schema-tagged plans that only use Plan-Id and Plan-Version', () => {
    const result = run([join(fixturesRoot, 'invalid/old-fields.plan.md')]);
    expect(result.code).toBe(1);
    expect(result.stderr).toMatch(/Unknown metadata field.*Plan-Id/);
    expect(result.stderr).toMatch(/Missing required metadata field: Id/);
    expect(result.stderr).toMatch(/Missing required metadata field: Version/);
  });

  it('fails stale rich implementation metadata from the removed field set', () => {
    const result = run([join(fixturesRoot, 'invalid/stale-rich.implementation.md')]);
    expect(result.code).toBe(1);
    expect(result.stderr).toMatch(/Unknown metadata field.*Created/);
    expect(result.stderr).toMatch(/Unknown metadata field.*Subject/);
    expect(result.stderr).toMatch(/Missing required metadata field: Plan/);
    expect(result.stderr).toMatch(/Missing required metadata field: Review/);
  });
});

describe('artifact-metadata.js: enum validation', () => {
  it('fails plan with Status value not in allowed enum (draft instead of Draft)', () => {
    withTempFile('bad-status.plan.md', metadata({
      Schema: 'pythia-artifact-v1', Id: 'slug', Title: 'T', Artifact: 'plan',
      Feature: 'feat-test', Status: 'draft', Version: 'v1', Branch: 'main', Round: 'none',
    }), (file) => {
      const r = run([file]);
      expect(r.code).toBe(1);
      expect(r.stderr).toMatch(/artifact-metadata\.enum/);
      expect(r.stderr).toMatch(/Status/);
    });
  });

  it('fails review with Verdict value not in enum', () => {
    withTempFile('bad-verdict.review.md', metadata({
      Schema: 'pythia-artifact-v1', Id: 'slug-review', Title: 'T', Artifact: 'review',
      Plan: 'plans/slug.plan.md', 'Plan-Version': 'v1', Round: 'R1', Verdict: 'APPROVED',
    }), (file) => {
      const r = run([file]);
      expect(r.code).toBe(1);
      expect(r.stderr).toMatch(/artifact-metadata\.enum/);
      expect(r.stderr).toMatch(/Verdict/);
    });
  });

  it('fails audit-report with Verdict not in enum (PASS instead of ready)', () => {
    withTempFile('bad-audit.audit.md', metadata({
      Schema: 'pythia-artifact-v1', Id: 'slug-audit', Title: 'T', Artifact: 'audit-report',
      Implementation: 'reports/slug.implementation.md', Round: 'A1', Verdict: 'PASS',
    }), (file) => {
      const r = run([file]);
      expect(r.code).toBe(1);
      expect(r.stderr).toMatch(/artifact-metadata\.enum/);
      expect(r.stderr).toMatch(/Verdict/);
    });
  });

  it('passes plan with valid Status value', () => {
    withTempFile('ok-status.plan.md', metadata({
      Schema: 'pythia-artifact-v1', Id: 'slug', Title: 'T', Artifact: 'plan',
      Feature: 'feat-test', Status: 'In progress', Version: 'v1', Branch: 'main', Round: 'none',
    }), (file) => {
      expect(run([file]).code).toBe(0);
    });
  });
});

describe('artifact-metadata.js: artifact_mismatch', () => {
  it('fails when Artifact field disagrees with filename (.plan.md declares review)', () => {
    withTempFile('slug.plan.md', metadata({
      Schema: 'pythia-artifact-v1', Id: 'slug-review', Title: 'T', Artifact: 'review',
      Plan: 'plans/slug.plan.md', 'Plan-Version': 'v1', Round: 'R1', Verdict: 'READY',
    }), (file) => {
      const r = run([file]);
      expect(r.code).toBe(1);
      expect(r.stderr).toMatch(/artifact_mismatch/);
    });
  });

  it('fails when .plan.md declares generic note artifact', () => {
    withTempFile('slug.plan.md', metadata({
      Schema: 'pythia-artifact-v1', Id: 'slug-note', Title: 'T', Artifact: 'note',
    }), (file) => {
      const r = run([file]);
      expect(r.code).toBe(1);
      expect(r.stderr).toMatch(/artifact_mismatch/);
    });
  });

  it('allows context file declaring research-context (allowedContextPair)', () => {
    withTempFile('research.context.md', metadata({
      Schema: 'pythia-artifact-v1', Id: 'research-context', Title: 'T', Artifact: 'research-context',
      Feature: 'feat-test', Shape: 'survey',
    }), (file) => {
      expect(run([file]).code).toBe(0);
    });
  });

  it('allows generic *.md to declare non-note Artifact (allowedGenericNote)', () => {
    // Generic *.md infers 'note' but allowedGenericNote lets declared artifact through
    withTempFile('notes.md', metadata({
      Schema: 'pythia-artifact-v1', Id: 'notes', Title: 'Notes', Artifact: 'context',
      Feature: 'feat-test', Shape: 'notes',
    }), (file) => {
      expect(run([file]).code).toBe(0);
    });
  });
});

describe('artifact-metadata.js: Generator field validation', () => {
  it('fails plan with invalid Generator value', () => {
    withTempFile('bad-gen.plan.md', metadata({
      Schema: 'pythia-artifact-v1', Id: 'slug', Title: 'T', Artifact: 'plan',
      Status: 'Draft', Version: 'v1', Branch: 'main', Round: 'none', Generator: 'unknown-tool',
    }), (file) => {
      const r = run([file]);
      expect(r.code).toBe(1);
      expect(r.stderr).toMatch(/artifact-metadata\.generator/);
    });
  });

  it('passes plan with valid Generator value', () => {
    withTempFile('ok-gen.plan.md', metadata({
      Schema: 'pythia-artifact-v1', Id: 'slug', Title: 'T', Artifact: 'plan',
      Status: 'Draft', Version: 'v1', Branch: 'main', Round: 'none', Generator: 'plan',
    }), (file) => {
      expect(run([file]).code).toBe(0);
    });
  });
});

describe('artifact-metadata.js: --strict flag', () => {
  it('fails under --strict when Schema field is missing', () => {
    withTempFile('no-schema.plan.md', metadata({
      Id: 'slug', Title: 'T', Artifact: 'plan', Status: 'Draft', Version: 'v1', Branch: 'main',
    }), (file) => {
      const lax = run([file]);
      const strict = run(['--strict', file]);
      expect(lax.code).toBe(0);
      expect(strict.code).toBe(1);
      expect(strict.stderr).toMatch(/artifact-metadata\.schema/);
    });
  });
});

describe('artifact metadata reference', () => {
  it('keeps the reference JSON contract aligned with schema exports', () => {
    const contract = referenceContract();
    expect(contract.schemaVersion).toBe(SCHEMA_VERSION);
    expect(contract.universalFields).toEqual(UNIVERSAL_FIELDS);
    expect(contract.optionalFields).toEqual(OPTIONAL_FIELDS);
    expect(contract.artifacts).toEqual(ARTIFACT_METADATA);
  });

  it('documents every artifact type and closed enum exported by the schema', () => {
    const doc = readFileSync(reference, 'utf8');
    for (const [artifact, spec] of Object.entries(ARTIFACT_METADATA)) {
      expect(doc).toContain(`\`${artifact}\``);
      for (const [field, values] of Object.entries(spec.enums ?? {})) {
        expect(doc).toContain(`\`${field}\``);
        for (const value of values) expect(doc).toContain(`\`${value}\``);
      }
    }
  });
});
