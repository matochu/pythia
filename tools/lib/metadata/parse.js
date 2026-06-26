import { basename } from 'node:path';
import { inferArtifactKind } from './schema.js';

export function parseArtifactMetadata(content) {
  const lines = content.split('\n');
  const headings = [];
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^```/.test(lines[i])) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (lines[i] === '## Metadata') headings.push(i);
  }

  if (headings.length === 0) {
    return { found: false, duplicate: false, fields: new Map(), entries: [], metadataLines: [], startLine: 0, endLine: 0, format: null };
  }

  const start = headings[0];
  let sectionEnd = lines.length;
  inFence = false;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^```/.test(lines[i])) {
      inFence = !inFence;
      continue;
    }
    if (!inFence && /^## /.test(lines[i])) {
      sectionEnd = i;
      break;
    }
  }
  const entries = [];
  const fields = new Map();
  const metadataLines = [];
  let hasV2 = false;

  for (let i = start + 1; i < sectionEnd; i++) {
    if (/^```/.test(lines[i])) break;
    metadataLines.push({ line: i + 1, text: lines[i] });
    // v2: markdown list item  - key: value
    const listMatch = lines[i].match(/^\s*-\s+([a-z][a-z0-9_]*):\s*(.+)\s*$/);
    if (listMatch) {
      hasV2 = true;
      const entry = { key: listMatch[1].trim(), value: listMatch[2].trim(), line: i + 1, format: 'v2' };
      entries.push(entry);
      if (!fields.has(entry.key)) fields.set(entry.key, entry);
      continue;
    }
  }

  const format = hasV2 ? 'v2' : null;

  return {
    found: true,
    duplicate: headings.length > 1,
    fields,
    entries,
    metadataLines,
    startLine: start + 1,
    endLine: sectionEnd,
    format,
  };
}

export function getArtifactField(parsed, key) {
  return parsed?.fields?.get(key)?.value ?? null;
}

export function metadataFormatDiagnostics(parsed) {
  const diagnostics = [];
  for (const entry of parsed?.metadataLines ?? []) {
    const plainMatch = entry.text.match(/^([a-z][a-z0-9_]*):\s*(.+)\s*$/);
    if (plainMatch) {
      diagnostics.push({
        line: entry.line,
        code: 'non_canonical_format',
        message: `Use '- ${plainMatch[1]}: ${plainMatch[2].trim()}' for v2 metadata`,
      });
    }
  }
  return diagnostics;
}

export function inferArtifactType(file, metadataArtifact = null) {
  const kind = inferArtifactKind(file);
  if (kind && kind !== 'note') return kind;
  if (metadataArtifact && metadataArtifact !== 'feature') return metadataArtifact;
  return kind ?? metadataArtifact ?? null;
}

/** Serialize v2 metadata as markdown list items so rendered Markdown preserves line breaks. */
export function serializeMetadata(fields) {
  return [
    '## Metadata',
    '',
    ...fields.map(([key, value]) => `- ${key}: ${value}`),
  ].join('\n');
}

/**
 * Build a v2 metadata block from parsed metadata.
 * Returns array of [key, value] pairs for serializeMetadata().
 */
export function normalizeMetadataBlock({ kind, parsed, existing = null }) {
  const get = (k) => getArtifactField(parsed, k) ?? existing?.get(k) ?? null;

  const fields = [];

  function add(k, v) {
    if (v !== null && v !== undefined && v !== '') fields.push([k, v]);
  }

  if (kind === 'plan') {
    add('status', get('status') ?? 'draft');
    add('version', get('version') ?? 'v1');
    const branch = get('branch');
    if (branch) add('branch', branch);
    const updated = get('updated');
    if (updated) add('updated', updated);
  } else if (kind === 'review') {
    add('status', get('status') ?? 'active');
    add('plan_version', get('plan_version') ?? 'v1');
    add('round', extractRoundId(get('round') ?? 'R1'));
    add('verdict', get('verdict') ?? 'needs-revision');
    const updated = get('updated');
    if (updated) add('updated', updated);
  } else if (kind === 'implementation-report') {
    add('status', get('status') ?? 'active');
    add('plan_version', get('plan_version') ?? 'v1');
    add('round', get('round') ?? 'I1');
    add('result', get('result') ?? 'implemented');
    const updated = get('updated');
    if (updated) add('updated', updated);
  } else if (kind === 'audit-report') {
    add('status', get('status') ?? 'active');
    add('round', get('round') ?? 'A1');
    add('verdict', get('verdict') ?? 'ready');
    const updated = get('updated');
    if (updated) add('updated', updated);
  } else if (kind === 'context') {
    const status = get('status');
    if (status) add('status', status);
    const existingKind = get('kind');
    if (existingKind) add('kind', existingKind);
    const updated = get('updated');
    if (updated) add('updated', updated);
  } else {
    // feature, retro, note, task
    const status = get('status');
    if (status) add('status', status);
    const updated = get('updated');
    if (updated) add('updated', updated);
  }

  return fields;
}

/** Extract plain round id from a possibly link-valued field. */
export function extractRoundId(value) {
  if (!value) return value;
  // Markdown link: [text](url) → extract text or last path segment
  const linkMatch = value.match(/\[([^\]]+)\]/);
  if (linkMatch) {
    const text = linkMatch[1];
    const roundMatch = text.match(/\b(R\d+|I\d+|A\d+)\b/);
    return roundMatch ? roundMatch[1] : text;
  }
  return value;
}
