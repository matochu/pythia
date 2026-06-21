import { basename } from 'node:path';

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
    return { found: false, duplicate: false, fields: new Map(), entries: [], startLine: 0, endLine: 0 };
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

  for (let i = start + 1; i < sectionEnd; i++) {
    if (/^```/.test(lines[i])) break;
    const match = lines[i].match(/^\s*-\s+\*\*([^*]+)\*\*:\s*(.*)$/);
    if (!match) continue;
    const entry = { key: match[1].trim(), value: match[2].trim(), line: i + 1 };
    entries.push(entry);
    if (!fields.has(entry.key)) fields.set(entry.key, entry);
  }

  return {
    found: true,
    duplicate: headings.length > 1,
    fields,
    entries,
    startLine: start + 1,
    endLine: sectionEnd,
  };
}

export function getArtifactField(parsed, key) {
  return parsed?.fields?.get(key)?.value ?? null;
}

export function inferArtifactType(file, metadataArtifact = null) {
  const base = basename(file);
  if (metadataArtifact) return metadataArtifact;
  if (base.startsWith('feat-') && base.endsWith('.md')) return 'feature';
  if (base.endsWith('.plan.md')) return 'plan';
  if (base.endsWith('.review.md')) return 'review';
  if (base.endsWith('.implementation.md')) return 'implementation-report';
  if (base.endsWith('.audit.md')) return 'audit-report';
  if (base.endsWith('.retro.md')) return 'retro';
  if (base.endsWith('.context.md') || base.endsWith('.ctx.md')) return 'context';
  if (base.endsWith('.md')) return 'note';
  return null;
}

export function serializeMetadata(fields) {
  return [
    '## Metadata',
    '',
    ...fields.map(([key, value]) => `- **${key}**: ${value}`),
  ].join('\n');
}
