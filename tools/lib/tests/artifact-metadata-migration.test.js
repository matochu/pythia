import { describe, it, expect } from 'vitest';
import { convertArtifactMetadata } from '../metadata/migration.js';
import { getArtifactField, parseArtifactMetadata } from '../metadata/parse.js';

describe('convertArtifactMetadata', () => {
  it('converts plan Plan-Id and Plan-Version to Id and Version', () => {
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
    expect(result.content).toContain('- **Id**: 1-example');
    expect(result.content).toContain('- **Version**: v2');
    expect(result.content).not.toContain('Plan-Id');
    expect(convertArtifactMetadata('.pythia/workflows/features/feat-2026-05-example/plans/1-example.plan.md', result.content).changed).toBe(false);
  });

  it('converts review metadata while preserving round verdict history', () => {
    const before = `## Metadata

- **Plan**: [plans/1-example.plan.md](../plans/1-example.plan.md)
- **Plan Version**: v1
- **Last Status**: READY
- **Last Review Round**: R2

## 1-example R2 — 2026-06-21

Verdict: READY
`;
    const result = convertArtifactMetadata('.pythia/workflows/features/feat-2026-05-example/reports/1-example.review.md', before);
    expect(result.content).toContain('- **Plan-Version**: v1');
    expect(result.content).toContain('- **Round**: R2');
    expect(result.content).toContain('- **Verdict**: READY');
    expect(result.content).toContain('Verdict: READY');
  });

  it('moves implementation Plan and Review headers into metadata with Result', () => {
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
    expect(result.content).toContain('- **Artifact**: implementation-report');
    expect(result.content).toContain('- **Plan**: plans/1-example.plan.md');
    expect(result.content).toContain('- **Plan-Version**: v2');
    expect(result.content).toContain('- **Review**: reports/1-example.review.md');
    expect(result.content).toContain('- **Round**: I1');
    expect(result.content).toContain('- **Result**: implemented');
    expect(result.content).not.toMatch(/^Plan: /m);
    expect(result.content).not.toMatch(/^Review: /m);
    expect(result.content).toContain('Date: 2026-06-21');
  });

  it('does not read metadata-looking bullets outside ## Metadata', () => {
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
    expect(getArtifactField(metadata, 'Round')).toBe('I1');
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
    expect(result.content).toContain('- **Result**: implemented');
  });

  it('does not infer failed result from compatibility text about error handling', () => {
    const before = `# Implementation Report: 1-example

## Plan–Implementation Compatibility

| Implementation Round | Plan Version | Date | Result |
| --- | --- | --- | --- |
| I1 | v1 | 2026-06-21 | Added error handling coverage |
`;
    const result = convertArtifactMetadata('.pythia/workflows/features/feat-2026-05-example/reports/1-example.implementation.md', before);
    expect(result.content).toContain('- **Result**: implemented');
  });

  it('converts context frontmatter to body metadata and preserves body', () => {
    const before = `---
type: context
shape: notes
status: ready
---
# Notes

Body.
`;
    const result = convertArtifactMetadata('.pythia/workflows/features/feat-2026-05-example/contexts/notes.context.md', before);
    expect(result.content).toContain('- **Artifact**: context');
    expect(result.content).toContain('- **Shape**: notes');
    expect(result.content).toContain('Body.');
    expect(result.content).not.toMatch(/^---/);
  });

  it('converts legacy .ctx.md global contexts', () => {
    const before = `---
type: ctx
shape: notes
status: ready
tags: context
---
# Global Notes

Body.
`;
    const result = convertArtifactMetadata('.pythia/ctx/global-notes.ctx.md', before);
    expect(result.changed).toBe(true);
    expect(result.content).toContain('- **Schema**: pythia-artifact-v1');
    expect(result.content).toContain('- **Id**: global-notes');
    expect(result.content).toContain('- **Artifact**: context');
    expect(result.content).not.toContain('Generator');
    expect(result.content).not.toMatch(/^---/);
  });
});
