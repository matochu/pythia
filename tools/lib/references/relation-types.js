import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const DEFAULT_LABELS = [
  { label: 'source', description: 'primary source / citation this doc draws on', reverse: 'sourced-by' },
  { label: 'related', description: 'lateral "see also" relation', reverse: 'related' },
  { label: 'based-on', description: 'this doc derives from / extends the target', reverse: 'basis-for' },
];

function parseRelationTable(content) {
  const lines = content.split('\n');
  let headerIdx = -1;
  let colLabel = -1, colReverse = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').map((c) => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
    if (headerIdx === -1) {
      colLabel = cells.findIndex((c) => c.toLowerCase() === 'label');
      colReverse = cells.findIndex((c) => c.toLowerCase() === 'reverse');
      if (colLabel !== -1 && colReverse !== -1) { headerIdx = i; }
      continue;
    }
    if (/^[\s|:-]+$/.test(line)) continue; // separator row
    if (cells.length < Math.max(colLabel, colReverse) + 1) continue;
    return { headerIdx, colLabel, colReverse, lines };
  }
  return null;
}

function loadRelationsFromContent(content, filePath) {
  const lines = content.split('\n');
  let headerIdx = -1;
  let colLabel = -1, colReverse = -1;
  const labels = [];
  const reverseOf = {};
  let parsed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').map((c) => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

    if (headerIdx === -1) {
      const lIdx = cells.findIndex((c) => c.toLowerCase() === 'label');
      const rIdx = cells.findIndex((c) => c.toLowerCase() === 'reverse');
      if (lIdx !== -1 && rIdx !== -1) {
        colLabel = lIdx; colReverse = rIdx; headerIdx = i;
      }
      continue;
    }
    if (/^[\s|:-]+$/.test(line)) continue;
    if (cells.length < Math.max(colLabel, colReverse) + 1) continue;
    const label = cells[colLabel];
    const reverse = cells[colReverse];
    if (!label) continue;
    parsed = true;
    if (!labels.includes(label)) {
      labels.push(label);
      reverseOf[label] = reverse || label;
    }
  }

  if (!parsed) {
    if (filePath) process.stderr.write(`[relation-types] Warning: no valid table found in ${filePath}, using defaults\n`);
    return null;
  }
  return { labels, reverseOf };
}

let _cache = null;
let _cacheRoot = null;

export function loadRelations(root) {
  if (_cache && _cacheRoot === root) return _cache;

  const configPath = root ? resolve(root, '.pythia/config/relation.md') : null;
  if (configPath && existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, 'utf8');
      const result = loadRelationsFromContent(content, configPath);
      if (result) {
        _cache = result;
        _cacheRoot = root;
        return result;
      }
    } catch (err) {
      process.stderr.write(`[relation-types] Warning: could not read ${configPath}: ${err.message}, using defaults\n`);
    }
  }

  const result = {
    labels: DEFAULT_LABELS.map((r) => r.label),
    reverseOf: Object.fromEntries(DEFAULT_LABELS.map((r) => [r.label, r.reverse])),
  };
  _cache = result;
  _cacheRoot = root;
  return result;
}

export function isKnownRelation(label, root) {
  const { labels, reverseOf } = loadRelations(root);
  if (labels.includes(label)) return true;
  // Also accept reverse labels (e.g. basis-for, sourced-by) — written by sync into ## Used by
  const reverseValues = Object.values(reverseOf);
  return reverseValues.includes(label);
}

export function _resetCache() {
  _cache = null;
  _cacheRoot = null;
}
