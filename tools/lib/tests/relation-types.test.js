import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadRelations, isKnownRelation, _resetCache } from '../references/relation-types.js';

function makeTmpRoot(configContent) {
  const dir = mkdtempSync(join(tmpdir(), 'relation-types-'));
  mkdirSync(join(dir, '.pythia/config'), { recursive: true });
  if (configContent !== undefined) {
    writeFileSync(join(dir, '.pythia/config/relation.md'), configContent, 'utf8');
  }
  return dir;
}

beforeEach(() => { _resetCache(); });

describe('loadRelations', () => {
  it('returns default labels when file is missing', () => {
    const dir = mkdtempSync(join(tmpdir(), 'relation-types-'));
    mkdirSync(join(dir, '.pythia/config'), { recursive: true });
    const result = loadRelations(dir);
    expect(result.labels).toEqual(['source', 'related', 'based-on']);
    expect(result.reverseOf['source']).toBe('sourced-by');
    expect(result.reverseOf['based-on']).toBe('basis-for');
    expect(result.reverseOf['related']).toBe('related');
  });

  it('parses table by column header', () => {
    const root = makeTmpRoot(`# Relation Types

| label    | description | reverse    |
| -------- | ----------- | ---------- |
| source   | a source    | sourced-by |
| related  | lateral     | related    |
| based-on | derives     | basis-for  |
`);
    const result = loadRelations(root);
    expect(result.labels).toEqual(['source', 'related', 'based-on']);
    expect(result.reverseOf['source']).toBe('sourced-by');
  });

  it('returns reverse map', () => {
    const root = makeTmpRoot(`| label  | description | reverse |
| ------ | ----------- | ------- |
| foo    | Foo         | bar     |
| baz    | Baz         | baz     |
`);
    const result = loadRelations(root);
    expect(result.reverseOf['foo']).toBe('bar');
    expect(result.reverseOf['baz']).toBe('baz');
  });

  it('de-duplicates labels (first wins)', () => {
    const root = makeTmpRoot(`| label  | description | reverse |
| ------ | ----------- | ------- |
| source | first       | sourced-by |
| source | second      | other      |
`);
    const result = loadRelations(root);
    expect(result.labels.filter((l) => l === 'source')).toHaveLength(1);
    expect(result.reverseOf['source']).toBe('sourced-by');
  });

  it('tolerates extra columns', () => {
    const root = makeTmpRoot(`| label | description | reverse | extra |
| ----- | ----------- | ------- | ----- |
| a     | A           | b       | c     |
`);
    const result = loadRelations(root);
    expect(result.labels).toContain('a');
    expect(result.reverseOf['a']).toBe('b');
  });

  it('falls back to defaults on malformed file (no valid table)', () => {
    const root = makeTmpRoot('# No table here\njust prose\n');
    const result = loadRelations(root);
    expect(result.labels).toContain('source');
  });
});

describe('isKnownRelation', () => {
  it('returns true for configured labels', () => {
    const root = makeTmpRoot(`| label  | description | reverse |
| ------ | ----------- | ------- |
| source | src         | sourced-by |
`);
    expect(isKnownRelation('source', root)).toBe(true);
  });

  it('returns false for unknown labels', () => {
    const root = makeTmpRoot(`| label  | description | reverse |
| ------ | ----------- | ------- |
| source | src         | sourced-by |
`);
    expect(isKnownRelation('bogus', root)).toBe(false);
  });

  it('returns true for reverse labels (written by sync into ## Used by)', () => {
    const root = makeTmpRoot(`| label    | description | reverse    |
| -------- | ----------- | ---------- |
| based-on | derives     | basis-for  |
| source   | citation    | sourced-by |
| related  | lateral     | related    |
`);
    expect(isKnownRelation('basis-for', root)).toBe(true);
    expect(isKnownRelation('sourced-by', root)).toBe(true);
    expect(isKnownRelation('related', root)).toBe(true);
    // forward labels still work
    expect(isKnownRelation('based-on', root)).toBe(true);
    // unknown still false
    expect(isKnownRelation('bogus', root)).toBe(false);
  });
});
