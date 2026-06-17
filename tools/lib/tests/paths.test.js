import { describe, it, expect } from 'vitest';
import { parseZones, zone, generatedCachePaths, protectedPaths, deriveSurfacesAndSubstitutions } from '../paths.js';

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

- *.plan.md  checker: tools/checks/doc-structure.js
- *.review.md  checker: tools/checks/doc-structure.js

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
    expect(docs[0]).toEqual({ path: '*.plan.md', checker: 'tools/checks/doc-structure.js' });
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
