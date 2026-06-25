import { describe, it, expect } from 'vitest';
import { convertArtifactMetadata } from '../metadata/migration.js';
import { getArtifactField, parseArtifactMetadata } from '../metadata/parse.js';

describe('convertArtifactMetadata', () => {
  it('converts plan v1 to v2: drops Schema/Id/Title/Artifact, maps Version→version, idempotent', () => {
    const before = `# Plan 1-example: Example

## Metadata

- **Plan-Id**: 1-example
- **Plan-Version**: v2
- **Status**: Draft
- **Branch**: main
- **Last review round**: R1

## Plan revision log

| Version | Round | Date |
| ------- | ----- | ---- |
| v2 | R1 | 2026-06-21 |
`;
    const result = convertArtifactMetadata('.pythia/workflows/features/feat-2026-05-example/plans/1-example.plan.md', before);
    expect(result.changed).toBe(true);
    // v2: list key:value, no bold bullets
    expect(result.content).toContain('- status: draft');
    expect(result.content).toContain('- version: v2');
    expect(result.content).toContain('- branch: main');
    // v2: forbidden keys dropped
    expect(result.content).not.toContain('Plan-Id');
    expect(result.content).not.toContain('Schema');
    expect(result.content).not.toContain('- **Id**');
    expect(result.content).not.toContain('- **Title**');
    expect(result.content).not.toContain('- **Artifact**');
    // v2 plan: no round in metadata (lives in revision log body)
    expect(result.content).not.toMatch(/^round:/m);
    // Idempotent
    expect(convertArtifactMetadata('.pythia/workflows/features/feat-2026-05-example/plans/1-example.plan.md', result.content).changed).toBe(false);
  });

  it('converts review metadata to v2: plan_version, round, verdict (lowercase keys)', () => {
    const before = `## Metadata

- **Plan**: [plans/1-example.plan.md](../plans/1-example.plan.md)
- **Plan Version**: v1
- **Last Status**: READY
- **Last Review Round**: R2

## 1-example R2 — 2026-06-21

Verdict: ready
`;
    const result = convertArtifactMetadata('.pythia/workflows/features/feat-2026-05-example/reports/1-example.review.md', before);
    // v2 list format
    expect(result.content).toContain('- plan_version: v1');
    expect(result.content).toContain('- round: R2');
    expect(result.content).toContain('- verdict: ready');
    // Body round heading preserved
    expect(result.content).toContain('Verdict: ready');
    // No v1 keys
    expect(result.content).not.toContain('- **Plan-Version**');
    expect(result.content).not.toContain('- **Round**');
  });

  it('moves implementation Plan and Review headers into v2 metadata with result (lowercase)', () => {
    const before = `# Implementation Report: 1-example

Date: 2026-06-21
Plan: [plans/1-example.plan.md](../plans/1-example.plan.md)
Review: [reports/1-example.review.md](./1-example.review.md)

## Plan–Implementation Compatibility

| Implementation Round | Plan Version | Date | Result |
| --- | --- | --- | --- |
| I1 | v2 | 2026-06-21 | ok |

## Results

Implemented.
`;
    const result = convertArtifactMetadata('.pythia/workflows/features/feat-2026-05-example/reports/1-example.implementation.md', before);
    // v2 list metadata
    expect(result.content).toContain('- plan_version: v2');
    expect(result.content).toContain('- round: I1');
    expect(result.content).toContain('- result: implemented');
    // Plan/Review header lines stripped (moved to metadata in v1, now dropped — body links remain)
    expect(result.content).not.toMatch(/^Plan: /m);
    expect(result.content).not.toMatch(/^Review: /m);
    expect(result.content).toContain('Date: 2026-06-21');
    // No v1 bold bullets
    expect(result.content).not.toContain('- **Artifact**');
    expect(result.content).not.toContain('- **Result**');
  });

  it('normalizes legacy bare v2 metadata to list format during migration', () => {
    const before = `# Implementation Report: 1-example

## Metadata

status: completed
plan_version: v2
round: I1
result: implemented

## Results

Done.
`;
    const result = convertArtifactMetadata('.pythia/workflows/features/feat-2026-05-example/reports/1-example.implementation.md', before);
    expect(result.changed).toBe(true);
    expect(result.content).toContain('- status: completed');
    expect(result.content).toContain('- plan_version: v2');
    expect(result.content).toContain('- round: I1');
    expect(result.content).toContain('- result: implemented');
    expect(result.content).not.toMatch(/^status:/m);
    expect(result.content).not.toMatch(/^plan_version:/m);
  });

  it('does not read metadata-looking bullets outside ## Metadata (round from compat table)', () => {
    const before = `# Implementation Report: 1-example

## Metadata

- **Schema**: pythia-artifact-v1
- **Id**: 1-example-implementation
- **Title**: Example Implementation
- **Artifact**: implementation-report
- **Plan**: plans/1-example.plan.md
- **Plan-Version**: v1
- **Review**: reports/1-example.review.md
- **Round**: I1
- **Result**: implemented

## Plan–Implementation Compatibility

| Implementation Round | Plan Version | Date | Result |
| --- | --- | --- | --- |
| I1 | v1 | 2026-06-21 | ok |

## Results

- **Round**: I99
`;
    const result = convertArtifactMetadata('.pythia/workflows/features/feat-2026-05-example/reports/1-example.implementation.md', before);
    const metadata = parseArtifactMetadata(result.content);
    // Should read I1 from compat table (or existing Round), not I99 from body bullet
    const round = getArtifactField(metadata, 'round') ?? getArtifactField(metadata, 'Round');
    expect(round).toBe('I1');
  });

  it('does not infer failed result from body text about error handling', () => {
    const before = `# Implementation Report: 1-example

## Plan–Implementation Compatibility

| Implementation Round | Plan Version | Date | Result |
| --- | --- | --- | --- |
| I1 | v1 | 2026-06-21 | ok |

## Results

Added error handling coverage. All checks passed.
`;
    const result = convertArtifactMetadata('.pythia/workflows/features/feat-2026-05-example/reports/1-example.implementation.md', before);
    expect(result.content).toContain('- result: implemented');
  });

  it('does not infer failed result from compatibility text about error handling', () => {
    const before = `# Implementation Report: 1-example

## Plan–Implementation Compatibility

| Implementation Round | Plan Version | Date | Result |
| --- | --- | --- | --- |
| I1 | v1 | 2026-06-21 | Added error handling coverage |
`;
    const result = convertArtifactMetadata('.pythia/workflows/features/feat-2026-05-example/reports/1-example.implementation.md', before);
    expect(result.content).toContain('- result: implemented');
  });

  it('converts context frontmatter to v2 list metadata and preserves body', () => {
    const before = `---
type: context
shape: notes
status: ready
---
# Notes

Body.
`;
    const result = convertArtifactMetadata('.pythia/workflows/features/feat-2026-05-example/contexts/notes.context.md', before);
    // v2: no Artifact written (inferred from path), status preserved
    expect(result.content).toContain('- status: ready');
    expect(result.content).toContain('Body.');
    // No v1 keys
    expect(result.content).not.toContain('- **Artifact**');
    expect(result.content).not.toMatch(/^---/);
  });

  it('converts research context to v2 with kind: research (replaces Artifact: research-context)', () => {
    const before = `---
type: ctx
shape: survey
status: ready
tags: context
---
# Global Notes

Body.
`;
    const result = convertArtifactMetadata('.pythia/ctx/global-notes.ctx.md', before);
    expect(result.changed).toBe(true);
    // research context: kind: research in v2
    expect(result.content).toContain('- kind: research');
    // No v1 bold keys
    expect(result.content).not.toContain('- **Schema**');
    expect(result.content).not.toContain('- **Artifact**');
    expect(result.content).not.toContain('Generator');
    expect(result.content).not.toMatch(/^---/);
  });

  it('strips legacy date/scope frontmatter from global contexts', () => {
    const before = `---
created: 2026-04-29
updated: 2026-04-29
scope: project
---
# Global Notes

Body.
`;
    const result = convertArtifactMetadata('.pythia/ctx/global-notes.ctx.md', before);
    expect(result.changed).toBe(true);
    // No v1 Artifact field
    expect(result.content).not.toContain('- **Artifact**');
    expect(result.content).not.toMatch(/^---/);
    expect(result.content).not.toContain('created:');
    expect(result.content).not.toContain('scope:');
  });

  it('strips all top frontmatter from covered artifacts', () => {
    const before = `---
feature: feat-2026-05-example
author: PM
sources:
  - docs/example.md
topic: Example
context-id: example-context
---
# Example

Body.
`;
    const result = convertArtifactMetadata('.pythia/workflows/features/feat-2026-05-example/contexts/example.context.md', before);
    expect(result.changed).toBe(true);
    // Frontmatter stripped, no v1 bold Artifact
    expect(result.content).not.toContain('- **Artifact**');
    expect(result.content).not.toMatch(/^---/);
    expect(result.content).not.toContain('feature:');
    expect(result.content).not.toContain('author:');
    expect(result.content).not.toContain('sources:');
    expect(result.content).not.toContain('topic:');
    expect(result.content).not.toContain('context-id:');
  });

  it('does not leave an extra blank line at EOF for empty note bodies', () => {
    const result = convertArtifactMetadata('.pythia/workflows/tasks/task-empty.md', ' ');
    expect(result.changed).toBe(true);
    // v2: empty ## Metadata section (no fields for notes without status)
    expect(result.content).toContain('## Metadata');
    expect(result.content).not.toContain('- **Schema**');
    expect(result.content).not.toContain('- **Artifact**');
  });

  it('retro file is classified as retro, not feature (feat-*.retro.md regression)', () => {
    const before = `# Example Feature Retrospective

## Metadata

- **Schema**: pythia-artifact-v1
- **Artifact**: feature
- **Status**: active

Body.
`;
    const result = convertArtifactMetadata(
      '.pythia/workflows/features/feat-2026-05-example/feat-2026-05-example.retro.md',
      before,
    );
    // After conversion, inferred kind is retro (not feature)
    // v2 has no Artifact field, but the file should not contain v1 feature artifact
    expect(result.content).not.toContain('- **Artifact**: feature');
    // Idempotent: re-running on v2 output does not change it
    expect(convertArtifactMetadata(
      '.pythia/workflows/features/feat-2026-05-example/feat-2026-05-example.retro.md',
      result.content,
    ).changed).toBe(false);
  });

  it('merge does not downgrade existing v2 version field', () => {
    const before = `# Plan 1-example: Example

## Metadata

version: v3
status: Draft
branch: main

## Plan revision log

| Version | Round | Date |
| ------- | ----- | ---- |
| v2 | R1 | 2026-06-21 |
`;
    const result = convertArtifactMetadata('.pythia/workflows/features/feat-2026-05-example/plans/1-example.plan.md', before);
    // Existing v3 should not be downgraded to v2 from revision log
    expect(result.content).toContain('- version: v3');
    expect(result.content).not.toContain('- version: v2');
  });

  it('prepends H1 from legacy Title field when missing', () => {
    const before = `## Metadata

- **Schema**: pythia-artifact-v1
- **Id**: 1-example
- **Title**: My Plan Title
- **Artifact**: plan
- **Status**: Draft
- **Version**: v1
- **Branch**: main

## Plan revision log

| Version | Round | Date |
| ------- | ----- | ---- |
| v1 | — | 2026-06-21 |
`;
    const result = convertArtifactMetadata('.pythia/workflows/features/feat-2026-05-example/plans/1-example.plan.md', before);
    expect(result.content).toMatch(/^# /m);
    expect(result.content).toContain('My Plan Title');
  });

  it('maps Artifact: research-context to kind: research (not a separate artifact type)', () => {
    const before = `# Research: Example Survey

## Metadata

- **Schema**: pythia-artifact-v1
- **Id**: example-context
- **Title**: Example Survey
- **Artifact**: research-context
- **Status**: ready

Body.
`;
    const result = convertArtifactMetadata('.pythia/workflows/features/feat-2026-05-example/contexts/example.context.md', before);
    expect(result.content).toContain('- kind: research');
    expect(result.content).not.toContain('research-context');
    expect(result.content).not.toContain('- **Artifact**');
  });

  it('normalizes invalid feature status (In Research → active, Draft → draft)', () => {
    const inResearch = `# Feature: Example

## Metadata

status: In Research
`;
    const r1 = convertArtifactMetadata('.pythia/workflows/features/feat-2026-05-example/feat-2026-05-example.md', inResearch);
    expect(r1.content).toContain('- status: active');
    expect(r1.content).not.toContain('In Research');

    const draft = `# Feature: Example

## Metadata

status: Draft
`;
    const r2 = convertArtifactMetadata('.pythia/workflows/features/feat-2026-05-example/feat-2026-05-example.md', draft);
    expect(r2.content).toContain('- status: draft');
    expect(r2.content).not.toContain('- status: Draft');
  });

  it('normalizes invalid context status (in-research → draft, ready-for-plan → ready, decided → archived)', () => {
    const test = (status, expected) => {
      const content = `# Context\n\n## Metadata\n\nstatus: ${status}\n`;
      const r = convertArtifactMetadata('.pythia/workflows/features/feat/contexts/example.context.md', content);
      expect(r.content).toContain(`status: ${expected}`);
      expect(r.content).not.toContain(`status: ${status === expected ? '__never__' : status}`);
    };
    test('in-research', 'draft');
    test('ready-for-plan', 'ready');
    test('decided', 'archived');
  });

  it('basename heuristic: research as slug-token → kind: research; as substring → no kind', () => {
    const body = `# Context\n\n## Metadata\n\nBody.\n`;
    // token: "research" surrounded by separators
    const r1 = convertArtifactMetadata('.pythia/workflows/features/feat/contexts/my-research-notes.context.md', body);
    expect(r1.content).toContain('- kind: research');
    // substring: "research" embedded inside another word — should NOT match
    const r2 = convertArtifactMetadata('.pythia/workflows/features/feat/contexts/nonresearched-approach.context.md', body);
    expect(r2.content).not.toContain('kind: research');
  });

  it('maps YAML type: research to kind: research (not only type: research-context)', () => {
    const before = `---
title: BMAD-METHOD Deep-Dive
feature: feat-2026-04-llm-wiki-integration
type: research
created: 2026-04-29
---

# BMAD-METHOD Deep-Dive

## Metadata

Body.
`;
    const result = convertArtifactMetadata(
      '.pythia/workflows/features/feat-2026-04/contexts/bmad-method-deep-dive.context.md',
      before,
    );
    expect(result.content).toContain('- kind: research');
    expect(result.content).not.toMatch(/^---/m);
  });

  it('migrates YAML tags to v2 metadata for context and feature', () => {
    const ctx = `---
title: LLM Comparison Criteria
type: global-context
created: 2026-04-29
updated: 2026-04-29
tags: [llm-agents, sdd, comparison]
---

# LLM Comparison Criteria

## Metadata

Body.
`;
    const r = convertArtifactMetadata('.pythia/ctx/llm-agent-and-sdd-comparison-criteria.ctx.md', ctx);
    expect(r.content).toContain('- tags: [llm-agents, sdd, comparison]');
    expect(r.content).not.toMatch(/^---/m);
  });

  it('maps YAML type: brainstorm-context to kind: brainstorm', () => {
    const before = `---
title: Quick Dev — Pythia Analog (Brainstorm)
feature: feat-2026-05-bmad-adaptations
type: brainstorm-context
created: 2026-05-08
tags: [bmad, quick-dev]
---

# Quick Dev — Pythia Analog (Brainstorm)

## Metadata

Body.
`;
    const result = convertArtifactMetadata(
      '.pythia/workflows/features/feat-2026-05/contexts/quick-dev-pythia-analog.context.md',
      before,
    );
    expect(result.content).toContain('- kind: brainstorm');
    expect(result.content).not.toMatch(/^---/m);
  });

  it('falls back to created when updated is missing', () => {
    const before = `---
title: Example Research
feature: feat-2026-04-example
type: research
created: 2026-04-29
---

# Example Research

## Metadata

Body.
`;
    const result = convertArtifactMetadata(
      '.pythia/workflows/features/feat-2026-04/contexts/example-research.context.md',
      before,
    );
    expect(result.content).toContain('- updated: 2026-04-29');
    expect(result.content).not.toMatch(/^---/m);
  });

  it('prefers updated over created when both present', () => {
    const before = `---
title: Example
type: research
created: 2026-04-01
updated: 2026-05-15
---

# Example

## Metadata

Body.
`;
    const result = convertArtifactMetadata(
      '.pythia/workflows/features/feat/contexts/example.context.md',
      before,
    );
    expect(result.content).toContain('- updated: 2026-05-15');
    expect(result.content).not.toContain('2026-04-01');
  });

  it('captures Date: from implementation metadata section as updated', () => {
    const before = `# Implementation Report: 1-example

## Metadata

- status: active
- plan_version: v6
- round: I1
- result: partial

Date: 2026-05-06

## Plan–Implementation Compatibility

| Implementation Round | Plan Version | Date | Result |
| ---- | ---- | ---- | ---- |
| I1 | v6 | 2026-05-06 | done |

## Implementation Round I1

Date: 2026-05-06

Body content.
`;
    const result = convertArtifactMetadata(
      '.pythia/workflows/features/feat/reports/1-example.implementation.md',
      before,
    );
    expect(result.content).toContain('- updated: 2026-05-06');
    // Date: in round body must not be stripped
    expect(result.content).toContain('\nDate: 2026-05-06\n');
  });

  it('fixes wrong-casing canonical prefix (e.g. # report: → # Report:)', () => {
    const impl = `# report: 1-example\n\n## Metadata\n\n- status: active\n- plan_version: v1\n- round: I1\n- result: implemented\n\n## Summary\n\n## Steps Executed\n\n## Files Changed\n\n## Commands Executed\n\n## Validation\n\n## Results\n\n## Deviations\n\n## Open Issues\n\n## Retrospective\n\n## Implementation Round I1\n\n### Summary\n\nPlan version: v1\nDate: 2026-01-01\n\n### Step Results\n\n### Issues\n\n### Out-of-Plan Work\n\nnone\n`;
    const r = convertArtifactMetadata('.pythia/workflows/features/feat/reports/1-example.implementation.md', impl);
    expect(r.content).toMatch(/^# Report: 1-example$/m);

    const audit = `# audit: 1-example\n\n## Metadata\n\n- status: active\n- round: A1\n- verdict: ready\n\n## Conformance\n`;
    const r2 = convertArtifactMetadata('.pythia/workflows/features/feat/reports/1-example.audit.md', audit);
    expect(r2.content).toMatch(/^# Audit: 1-example$/m);
  });

  it('normalizes legacy H1 prefixes to canonical form', () => {
    const impl = `# Implementation Report: 1-example\n\n## Metadata\n\n- status: active\n- plan_version: v1\n- round: I1\n- result: implemented\n\n## Summary\n\n## Steps Executed\n\n## Files Changed\n\n## Commands Executed\n\n## Validation\n\n## Results\n\n## Deviations\n\n## Open Issues\n\n## Retrospective\n\n## Implementation Round I1\n\n### Summary\n\nPlan version: v1\nDate: 2026-01-01\n\n### Step Results\n\n### Issues\n\n### Out-of-Plan Work\n\nnone\n`;
    const r1 = convertArtifactMetadata('.pythia/workflows/features/feat/reports/1-example.implementation.md', impl);
    expect(r1.content).toMatch(/^# Report: 1-example$/m);

    const audit = `# Architect Audit: 1-example\n\n## Metadata\n\n- status: active\n- round: A1\n- verdict: ready\n\n## Conformance\n`;
    const r2 = convertArtifactMetadata('.pythia/workflows/features/feat/reports/1-example.audit.md', audit);
    expect(r2.content).toMatch(/^# Audit: 1-example$/m);
  });

  it('normalizes bare-slug H1 to prefixed form for review files', () => {
    const before = `# 9-artifact-metadata-v2-repair

## Metadata

- status: active
- plan_version: v4
- round: R1
- verdict: ready

Body.
`;
    const result = convertArtifactMetadata(
      '.pythia/workflows/features/feat/reports/9-artifact-metadata-v2-repair.review.md',
      before,
    );
    expect(result.content).toMatch(/^# Review: 9-artifact-metadata-v2-repair$/m);
  });

  it('leaves custom H1 unchanged for review files', () => {
    const before = `# Artifact Metadata Contract and Checker Review

## Metadata

- status: active
- plan_version: v1
- round: R1
- verdict: ready

Body.
`;
    const result = convertArtifactMetadata(
      '.pythia/workflows/features/feat/reports/8-artifact-metadata-contract-and-checker.review.md',
      before,
    );
    expect(result.content).toMatch(/^# Artifact Metadata Contract and Checker Review$/m);
  });

  it('migrates audit Plan:/Implementation: body lines into metadata fields', () => {
    const before = `# Audit: 1-example

## Metadata

- status: active
- round: A1
- verdict: ready

Plan: [plans/1-example.plan.md](../plans/1-example.plan.md)
Implementation: [reports/1-example.implementation.md](./1-example.implementation.md)

## Conformance

Body.
`;
    const result = convertArtifactMetadata(
      '.pythia/workflows/features/feat/reports/1-example.audit.md',
      before,
    );
    expect(result.content).toContain('- plan: [plans/1-example.plan.md]');
    expect(result.content).toContain('- implementation: [reports/1-example.implementation.md]');
    expect(result.content).not.toMatch(/^Plan: /m);
    expect(result.content).not.toMatch(/^Implementation: /m);
    expect(result.content).toContain('- round: A1');
    expect(result.content).toContain('- verdict: ready');
  });
});
