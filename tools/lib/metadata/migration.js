import { basename } from 'node:path';
import { getArtifactField, parseArtifactMetadata, serializeMetadata } from './parse.js';
import { SCHEMA_VERSION } from './schema.js';
import { parseFrontmatter } from '../md.js';

function titleFrom(content, fallback) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].replace(/^Plan\s+[^:]+:\s*/, '').trim() : fallback;
}

function featureIdFromPath(file) {
  const parts = file.split(/[\\/]/);
  return parts.find((part) => /^feat-\d{4}-\d{2}-/.test(part)) ?? null;
}

function slugFromFile(file) {
  return basename(file)
    .replace(/\.(plan|review|implementation|audit|retro|context|ctx)\.md$/, '')
    .replace(/\.md$/, '');
}

function value(content, key) {
  return getArtifactField(parseArtifactMetadata(content), key);
}

function lineValue(content, key) {
  const re = new RegExp(`^${key}:\\s*(.+)$`, 'm');
  const match = content.match(re);
  return match ? match[1].trim() : null;
}

function markdownLinkTarget(value) {
  if (!value) return null;
  const match = value.match(/\[[^\]]+\]\(([^)]+)\)/);
  return match ? match[1].trim() : value.trim();
}

function normalizeArtifactRef(ref, kind, slug) {
  if (!ref) return null;
  const clean = ref.replace(/^\.\//, '').replace(/^\.\.\//, '');
  if (kind === 'plan') {
    const match = clean.match(/(?:^|\/)(plans\/[^/]+\.plan\.md)$/);
    return match ? match[1] : clean;
  }
  if (kind === 'review') {
    const match = clean.match(/(?:^|\/)(reports\/[^/]+\.review\.md)$/);
    if (match) return match[1];
    if (/^[^/]+\.review\.md$/.test(clean)) return `reports/${clean}`;
    return clean || `reports/${slug}.review.md`;
  }
  return clean;
}

function implementationResult(content) {
  const explicit = value(content, 'Result');
  if (['implemented', 'partial', 'blocked', 'failed'].includes(explicit)) return explicit;
  const status = value(content, 'Status');
  if (status === 'blocked') return 'blocked';
  if (status === 'completed') return 'implemented';
  const compatibilityResults = [...content.matchAll(/^\|\s*I\d+\s*\|\s*v\d+\s*\|\s*[^|]+\|\s*([^|]+?)\s*\|/gm)];
  const latest = compatibilityResults.length ? compatibilityResults[compatibilityResults.length - 1][1].trim() : '';
  if (/blocked/i.test(latest)) return 'blocked';
  if (/\bfail(?:ed|ure|ures|ing)?\b/i.test(latest)) return 'failed';
  if (/partial|skipped|incomplete/i.test(latest)) return 'partial';
  return 'implemented';
}

function firstRound(content, prefix) {
  const match = content.match(new RegExp(`^## .+ ${prefix}(\\d+) .+$`, 'm'));
  return match ? `${prefix}${match[1]}` : `${prefix}1`;
}

function versionFromLog(content) {
  const rows = [...content.matchAll(/^\|\s*(v\d+)\s*\|/gm)];
  return rows.length ? rows[rows.length - 1][1] : 'v1';
}

function implementationPlanVersion(content) {
  const explicit = value(content, 'Plan Version') ?? value(content, 'Plan-Version');
  if (explicit) return explicit;
  const rows = [...content.matchAll(/^\|\s*I\d+\s*\|\s*(v\d+)\s*\|/gm)];
  return rows.length ? rows[rows.length - 1][1] : 'v1';
}

function latestReviewVerdict(content) {
  const matches = [...content.matchAll(/^Verdict:\s*(READY|NEEDS_REVISION)$/gm)];
  return matches.length ? matches[matches.length - 1][1] : value(content, 'Last Status') ?? 'NEEDS_REVISION';
}

function auditVerdict(content) {
  const match = content.match(/^-\s+\*\*Verdict\*\*:\s*(ready|needs-fixes|plan-fix|re-plan)$/m);
  return match ? match[1] : 'ready';
}

function removeMetadataSection(body) {
  const lines = body.split('\n');
  const start = lines.findIndex((line) => line === '## Metadata');
  if (start === -1) return body;
  const end = lines.findIndex((line, index) => index > start && /^## /.test(line));
  const next = end === -1 ? lines.length : end;
  const before = lines.slice(0, start);
  const after = lines.slice(next);
  return [...before, ...after].join('\n').replace(/\n{3,}/g, '\n\n').trimStart();
}

function stripLegacyFrontmatter(content) {
  const { frontmatter, body } = parseFrontmatter(content);
  if (!frontmatter) return content;
  const remaining = [];
  for (const line of frontmatter.split('\n')) {
    if (/^(feature-id|title|status|type|shape|generator|version|tags):/.test(line)) continue;
    if (line.trim()) remaining.push(line);
  }
  if (remaining.length === 0) return body;
  return `---\n${remaining.join('\n')}\n---\n${body}`;
}

function stripImplementationHeaderMetadata(content, file) {
  if (!basename(file).endsWith('.implementation.md')) return content;
  return content
    .split('\n')
    .filter((line) => !/^(Plan|Review):\s+/.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

function insertMetadata(content, fields) {
  const withoutOld = removeMetadataSection(stripLegacyFrontmatter(content));
  const lines = withoutOld.split('\n');
  const h1 = lines.findIndex((line) => /^#\s+/.test(line));
  const block = serializeMetadata(fields).split('\n');
  if (h1 === -1) return `${serializeMetadata(fields)}\n\n${withoutOld.trimStart()}`;
  return [
    ...lines.slice(0, h1 + 1),
    '',
    ...block,
    '',
    ...lines.slice(h1 + 1).join('\n').trimStart().split('\n'),
  ].join('\n').replace(/\n{4,}/g, '\n\n\n');
}

function compactFields(fields) {
  return fields.filter(([, value]) => value !== null && value !== undefined && value !== '');
}

function baseFields({ content, artifact, id }) {
  return compactFields([
    ['Schema', SCHEMA_VERSION],
    ['Id', id],
    ['Title', titleFrom(content, id)],
    ['Artifact', artifact],
  ]);
}

function featureFields(file) {
  const feature = featureIdFromPath(file);
  return feature ? [['Feature', feature]] : [];
}

function frontmatterType(content) {
  const { frontmatter } = parseFrontmatter(content);
  if (!frontmatter) return null;
  const match = frontmatter.match(/^type:\s*(.+)$/m);
  return match ? match[1].trim() : null;
}

export function convertArtifactMetadata(file, content) {
  const base = basename(file);
  let fields = null;
  const warnings = [];

  if (base.startsWith('feat-') && base.endsWith('.md')) {
    fields = [
      ...baseFields({ content, artifact: 'feature', id: base.replace(/\.md$/, '') }),
      ['Status', value(content, 'Status') ?? 'active'],
    ];
  } else if (base.endsWith('.context.md') || base.endsWith('.ctx.md')) {
    const explicitType = frontmatterType(content) ?? value(content, 'Artifact');
    const isResearch = explicitType === 'research-context'
      || (!explicitType && (/research/i.test(base) || /Artifact\*\*:\s*research-context/.test(content)));
    fields = [
      ...baseFields({
        content,
        artifact: isResearch ? 'research-context' : 'context',
        id: slugFromFile(file),
      }),
      ...featureFields(file),
      ['Shape', isResearch ? 'survey' : 'notes'],
    ];
  } else if (base.endsWith('.plan.md')) {
    fields = [
      ...baseFields({
        content,
        artifact: 'plan',
        id: slugFromFile(file),
      }),
      ...featureFields(file),
      ['Status', value(content, 'Status') ?? 'Draft'],
      ['Version', value(content, 'Plan-Version') ?? value(content, 'Version') ?? versionFromLog(content)],
      ['Branch', value(content, 'Branch') ?? 'main'],
      ['Round', value(content, 'Last review round') ?? value(content, 'Round') ?? 'none'],
    ];
  } else if (base.endsWith('.review.md')) {
    fields = [
      ...baseFields({ content, artifact: 'review', id: `${slugFromFile(file)}-review` }),
      ...featureFields(file),
      ['Plan', value(content, 'Plan') ?? `plans/${slugFromFile(file)}.plan.md`],
      ['Plan-Version', value(content, 'Plan Version') ?? 'v1'],
      ['Round', value(content, 'Last Review Round') ?? value(content, 'Round') ?? firstRound(content, 'R')],
      ['Verdict', latestReviewVerdict(content)],
    ];
  } else if (base.endsWith('.implementation.md')) {
    const slug = slugFromFile(file);
    const plan = normalizeArtifactRef(markdownLinkTarget(value(content, 'Plan') ?? lineValue(content, 'Plan')), 'plan', slug) ?? `plans/${slug}.plan.md`;
    const review = normalizeArtifactRef(markdownLinkTarget(value(content, 'Review') ?? lineValue(content, 'Review')), 'review', slug) ?? `reports/${slug}.review.md`;
    fields = [
      ...baseFields({ content, artifact: 'implementation-report', id: `${slugFromFile(file)}-implementation` }),
      ...featureFields(file),
      ['Plan', plan],
      ['Plan-Version', implementationPlanVersion(content)],
      ['Review', review],
      ['Round', value(content, 'Round') ?? firstRound(content, 'I')],
      ['Result', implementationResult(content)],
    ];
  } else if (base.endsWith('.audit.md')) {
    fields = [
      ...baseFields({ content, artifact: 'audit-report', id: `${slugFromFile(file)}-audit` }),
      ...featureFields(file),
      ['Implementation', `reports/${slugFromFile(file)}.implementation.md`],
      ['Round', value(content, 'Round') ?? firstRound(content, 'A')],
      ['Verdict', auditVerdict(content)],
    ];
  } else if (base.endsWith('.retro.md')) {
    fields = [
      ...baseFields({ content, artifact: 'retro', id: `${slugFromFile(file)}-retro` }),
      ...featureFields(file),
    ];
  } else if (base.endsWith('.md')) {
    fields = [
      ...baseFields({ content, artifact: 'note', id: slugFromFile(file) }),
      ...featureFields(file),
    ];
  }

  if (!fields) {
    return { changed: false, content, warnings: [`uncovered artifact: ${file}`] };
  }

  const source = base.endsWith('.implementation.md') ? stripImplementationHeaderMetadata(content, file) : content;
  const next = insertMetadata(source, fields);
  return { changed: next !== content, content: next, warnings };
}
