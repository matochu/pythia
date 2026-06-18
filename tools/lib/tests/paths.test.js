import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, cpSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseZones, parseEntryBody, unescapeMdPath, zone, generatedCachePaths, protectedPaths, deriveSurfacesAndSubstitutions, loadZones } from '../paths.js';

const PKG_PATHS_MD = resolve('assets/base/config/paths.md');
const VSCODE_FORMATTED_MD = resolve('tools/cli/tests/fixtures/paths-md-vscode-formatted.md');

const SAMPLE = `
# Pythia Workspace Path Registry

## Edit source

- skills/
- assets/instructions.md

## Generated cache

- .claude/skills  source: skills/
- .agents/skills  source: skills/
- CLAUDE.md  source: assets/instructions.md
- AGENTS.md  source: assets/instructions.md

## Protected

- .pythia/workflows/**
- .pythia/config/settings.md

## Runtime

- .pythia/runtime/**

## Workflow docs

- *.plan.md  checker: links.js, plan-version-log.js, plan-numbering.js, cross-refs.js, plans-index.js, inputs-fresh.js, doc-structure.js
- *.review.md  checker: role-boundary.js, links.js, inputs-fresh.js, doc-structure.js
- *.implementation.md  checker: role-boundary.js, links.js, inputs-fresh.js, doc-structure.js
- *.audit.md  checker: role-boundary.js, links.js, inputs-fresh.js, doc-structure.js
- *.context.md  checker: links.js, inputs-fresh.js
- feat-*.md  checker: links.js
- *.retro.md  checker: links.js

## Scripts

- tools/inputs.js
- tools/checks/
`;

describe('parseZones', () => {
  it('returns all zone keys', () => {
    const zones = parseZones(SAMPLE);
    expect([...zones.keys()]).toEqual([
      'Edit source',
      'Generated cache',
      'Protected',
      'Runtime',
      'Workflow docs',
      'Scripts',
    ]);
  });

  it('parses plain entries', () => {
    const zones = parseZones(SAMPLE);
    expect(zone(zones, 'Edit source')).toEqual([
      { path: 'skills/' },
      { path: 'assets/instructions.md' },
    ]);
  });

  it('parses entries with source annotation', () => {
    const zones = parseZones(SAMPLE);
    const cached = zone(zones, 'Generated cache');
    expect(cached[0]).toEqual({ path: '.claude/skills', source: 'skills/' });
    expect(cached[2]).toEqual({ path: 'CLAUDE.md', source: 'assets/instructions.md' });
  });

  it('parses entries with checker annotation', () => {
    const zones = parseZones(SAMPLE);
    const docs = zone(zones, 'Workflow docs');
    expect(docs[0]).toEqual({
      path: '*.plan.md',
      checker: 'links.js, plan-version-log.js, plan-numbering.js, cross-refs.js, plans-index.js, inputs-fresh.js, doc-structure.js',
    });
    expect(docs[1]).toEqual({
      path: '*.review.md',
      checker: 'role-boundary.js, links.js, inputs-fresh.js, doc-structure.js',
    });
    expect(docs[2]).toEqual({
      path: '*.implementation.md',
      checker: 'role-boundary.js, links.js, inputs-fresh.js, doc-structure.js',
    });
    expect(docs[3]).toEqual({
      path: '*.audit.md',
      checker: 'role-boundary.js, links.js, inputs-fresh.js, doc-structure.js',
    });
    expect(docs[4]).toEqual({
      path: '*.context.md',
      checker: 'links.js, inputs-fresh.js',
    });
    expect(docs[5]).toEqual({ path: 'feat-*.md', checker: 'links.js' });
    expect(docs[6]).toEqual({ path: '*.retro.md', checker: 'links.js' });
  });

  it('package asset paths.md has workflow doc checker entries', () => {
    const zones = parseZones(readFileSync(PKG_PATHS_MD, 'utf8'));
    const docs = zone(zones, 'Workflow docs');
    expect(docs.map((d) => d.path)).toEqual([
      '*.plan.md',
      '*.review.md',
      '*.implementation.md',
      '*.audit.md',
      '*.context.md',
      'feat-*.md',
      '*.retro.md',
    ]);
    expect(docs[1].checker).toContain('role-boundary.js');
  });

  it('every generated-cache entry has source', () => {
    const zones = parseZones(SAMPLE);
    const cached = zone(zones, 'Generated cache');
    expect(cached.every((e) => e.source)).toBe(true);
  });

  it('silently skips malformed entries (no - prefix)', () => {
    const zones = parseZones('## Zone\npath/no/dash\n- valid/path\n');
    expect(zone(zones, 'Zone')).toEqual([{ path: 'valid/path' }]);
  });

  it('silently skips zone header typos (not ## prefix)', () => {
    const zones = parseZones('### Not a zone\n- something\n');
    expect(zones.size).toBe(0);
  });

  it('returns empty map for empty content', () => {
    expect(parseZones('').size).toBe(0);
  });

  it('parses VS Code–formatted paths.md (escaped globs, shorthand colon, optional checker)', () => {
    const zones = parseZones(readFileSync(VSCODE_FORMATTED_MD, 'utf8'));
    const docs = zone(zones, 'Workflow docs');
    expect(docs[0]).toEqual({
      path: '*.plan.md',
      checker: 'links.js, plan-version-log.js, plan-numbering.js, cross-refs.js, plans-index.js, inputs-fresh.js, doc-structure.js',
    });
    expect(docs[1].checker).toContain('role-boundary.js');
    expect(docs[6]).toEqual({ path: '*.retro.md', checker: 'links.js' });
    expect(zone(zones, 'Generated cache')[0]).toEqual({ path: '.claude/skills', source: 'skills/' });
    expect(protectedPaths(zones)[0]).toBe('.pythia/workflows/**');
    expect(zone(zones, 'Runtime')[0].path).toBe('.pythia/runtime/**');
  });

  it('parses single-space source: and double-space checker: (legacy)', () => {
    const zones = parseZones(`
## Generated cache
- .claude/skills source: skills/
## Workflow docs
- *.plan.md  checker: doc-structure.js
- *.review.md: role-boundary.js, links.js
`);
    expect(zone(zones, 'Generated cache')[0].source).toBe('skills/');
    expect(zone(zones, 'Workflow docs')[0].checker).toBe('doc-structure.js');
    expect(zone(zones, 'Workflow docs')[1].checker).toContain('role-boundary.js');
  });

  it('plain path entries have no checker or source', () => {
    expect(parseEntryBody('skills/')).toEqual({ path: 'skills/' });
    expect(parseEntryBody('tools/checks/')).toEqual({ path: 'tools/checks/' });
  });

  it('unescapeMdPath normalizes markdown \\* escapes', () => {
    expect(unescapeMdPath('\\*.plan.md')).toBe('*.plan.md');
    expect(unescapeMdPath('.pythia/workflows/\\*\\*')).toBe('.pythia/workflows/**');
    expect(unescapeMdPath('feat-\\*.md')).toBe('feat-*.md');
  });
});

describe('generatedCachePaths', () => {
  it('returns only paths with source annotation', () => {
    const zones = parseZones(SAMPLE);
    expect(generatedCachePaths(zones)).toEqual([
      '.claude/skills',
      '.agents/skills',
      'CLAUDE.md',
      'AGENTS.md',
    ]);
  });
});

describe('protectedPaths', () => {
  it('returns protected zone paths', () => {
    const zones = parseZones(SAMPLE);
    expect(protectedPaths(zones)).toEqual(['.pythia/workflows/**', '.pythia/config/settings.md']);
  });
});

describe('deriveSurfacesAndSubstitutions', () => {
  it('derives correct surfaces', () => {
    const zones = parseZones(SAMPLE);
    const { surfaces } = deriveSurfacesAndSubstitutions(zones);
    expect(surfaces).toEqual(['.claude/skills', '.agents/skills']);
  });

  it('derives correct substitutions', () => {
    const zones = parseZones(SAMPLE);
    const { substitutions } = deriveSurfacesAndSubstitutions(zones);
    expect(substitutions).toHaveLength(2);
    expect(substitutions[0]).toMatchObject({ file: 'CLAUDE.md', tool: 'Claude Code', skillsPath: '.claude/skills' });
    expect(substitutions[1]).toMatchObject({ file: 'AGENTS.md', tool: 'Codex', skillsPath: '.agents/skills' });
  });
});

describe('loadZones', () => {
  it('falls back to materialized package-paths.md when workspace copy is absent', () => {
    const root = mkdtempSync(join(tmpdir(), 'pythia-loadzones-'));
    try {
      mkdirSync(join(root, '.pythia', 'runtime'), { recursive: true });
      cpSync(PKG_PATHS_MD, join(root, '.pythia', 'runtime', 'package-paths.md'));
      const docs = zone(loadZones(root), 'Workflow docs');
      expect(docs.map((d) => d.path)).toContain('*.context.md');
      expect(docs[0].checker).toContain('doc-structure.js');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
