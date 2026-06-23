import { basename } from 'node:path';
import { extractRoundId, parseArtifactMetadata, getArtifactField, serializeMetadata } from './parse.js';
import { inferArtifactKind, schemaForArtifact } from './schema.js';
import { parseFrontmatter } from '../md.js';

// ── Helpers ─────────────────────────────────────────────────────────────────

function slugFromFile(file) {
  return basename(file)
    .replace(/\.(plan|review|implementation|audit|retro|context|ctx)\.md$/, '')
    .replace(/\.md$/, '');
}

/** Get highest version from revision log table. */
function versionFromLog(content) {
  const rows = [...content.matchAll(/^\|\s*(v\d+)\s*\|/gm)];
  return rows.length ? rows[rows.length - 1][1] : null;
}

/** Get first round heading for given prefix (R/I/A). */
function firstRound(content, prefix) {
  const match = content.match(new RegExp(`^## .+ ${prefix}(\\d+) .+$`, 'm'));
  return match ? `${prefix}${match[1]}` : `${prefix}1`;
}

/** Get latest implementation result from compatibility table. */
function implementationResult(content) {
  const explicit = getField(parseArtifactMetadata(content), 'Result', 'result');
  if (['implemented', 'partial', 'blocked', 'failed'].includes(explicit)) return explicit;
  const compatibilityResults = [...content.matchAll(/^\|\s*I\d+\s*\|\s*v\d+\s*\|\s*[^|]+\|\s*([^|]+?)\s*\|/gm)];
  const latest = compatibilityResults.length ? compatibilityResults[compatibilityResults.length - 1][1].trim() : '';
  if (/blocked/i.test(latest)) return 'blocked';
  if (/\bfail(?:ed|ure|ures|ing)?\b/i.test(latest)) return 'failed';
  if (/partial|skipped|incomplete/i.test(latest)) return 'partial';
  return 'implemented';
}

/** Get v2 plan_version from implementation report (compat table or explicit field). */
function implementationPlanVersion(content) {
  const parsed = parseArtifactMetadata(content);
  const explicit = getField(parsed, 'Plan-Version', 'Plan Version', 'plan_version');
  if (explicit) return explicit;
  const rows = [...content.matchAll(/^\|\s*I\d+\s*\|\s*(v\d+)\s*\|/gm)];
  return rows.length ? rows[rows.length - 1][1] : 'v1';
}

/** Get a field from parsed metadata, checking multiple key aliases. */
function getField(parsed, ...keys) {
  for (const k of keys) {
    const v = getArtifactField(parsed, k);
    if (v !== null && v !== undefined && v !== '') return v;
  }
  return null;
}

/** Strip legacy YAML frontmatter. */
function stripFrontmatter(content) {
  const { frontmatter, body } = parseFrontmatter(content);
  return frontmatter ? body : content;
}

/** Remove ## Metadata section from content. */
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

/** Extract a bare `Key: value` link line from the body (anywhere, not just metadata section). */
function extractBodyLink(body, key) {
  const match = body.match(new RegExp(`^${key}:\\s+(.+)$`, 'm'));
  return match ? match[1].trim() : null;
}

/** Strip body-level header lines that are migrated into metadata fields. */
function stripImplementationHeaderLines(content, file) {
  const b = basename(file);
  if (b.endsWith('.implementation.md')) {
    return content
      .split('\n')
      .filter((line) => !/^(Plan|Review):\s+/.test(line))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n');
  }
  if (b.endsWith('.audit.md')) {
    // Plan: and Implementation: move into ## Metadata as fields; remove bare body lines.
    return content
      .split('\n')
      .filter((line) => !/^(Plan|Implementation):\s+/.test(line))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n');
  }
  return content;
}

/** Ensure content has an H1. If missing, prepend from title or slug. */
function ensureH1(content, title) {
  if (/^#\s+/m.test(content)) return content;
  const h1 = `# ${title}`;
  return `${h1}\n\n${content.trimStart()}`;
}

/**
 * Canonical H1 prefixes per artifact kind.
 * OLD_PREFIX lists legacy prefixes that should be replaced with the canonical one.
 */
const H1_PREFIX = {
  'plan': 'Plan',
  'review': 'Review',
  'implementation-report': 'Report',
  'audit-report': 'Audit',
  'retro': 'Retrospective',
};
const H1_OLD_PREFIX = {
  'implementation-report': ['Implementation Report'],
  'audit-report': ['Architect Audit'],
  'retro': ['Feature Retrospective'],
};

function normalizeH1(content, kind, slug) {
  const prefix = H1_PREFIX[kind];
  if (!prefix) return content;
  return content.replace(/^(# )(.+)$/m, (match, hash, rawTitle) => {
    const title = rawTitle.trim();
    // Already canonical
    if (title.toLowerCase().startsWith(prefix.toLowerCase() + ':')) return match;
    // Migrate old prefix → canonical
    for (const old of H1_OLD_PREFIX[kind] ?? []) {
      if (title.toLowerCase().startsWith(old.toLowerCase() + ':')) {
        return `${hash}${prefix}:${title.slice(old.length + 1)}`;
      }
    }
    // Bare slug → add prefix
    if (title === slug) return `${hash}${prefix}: ${slug}`;
    return match;
  });
}

/** Insert metadata block after H1 (or at top if no H1). */
function insertMetadata(content, fields) {
  const bodyWithoutMeta = removeMetadataSection(content);
  const lines = bodyWithoutMeta.split('\n');
  const h1 = lines.findIndex((line) => /^#\s+/.test(line));
  const block = serializeMetadata(fields).split('\n');
  if (h1 === -1) {
    const body = bodyWithoutMeta.trim();
    return body ? `${serializeMetadata(fields)}\n\n${body}\n` : `${serializeMetadata(fields)}\n`;
  }
  return [
    ...lines.slice(0, h1 + 1),
    '',
    ...block,
    '',
    ...lines.slice(h1 + 1).join('\n').trimStart().split('\n'),
  ].join('\n').replace(/\n{4,}/g, '\n\n\n');
}

/** Return existing v2 fields as a Map for merge. */
function existingV2Fields(parsed) {
  const m = new Map();
  for (const entry of parsed.entries) {
    if (entry.format === 'v2') m.set(entry.key, entry.value);
  }
  return m;
}

/** Read legacy bare key:value metadata for migration input only. Accepts both lowercase and Title-case keys (e.g. Date:, Updated:). */
function legacyPlainMetadataFields(parsed) {
  const m = new Map();
  for (const entry of parsed.metadataLines ?? []) {
    const match = entry.text.match(/^([A-Za-z][a-zA-Z0-9_-]*):\s*(.+)\s*$/);
    if (match) m.set(match[1].trim(), match[2].trim());
  }
  return m;
}

/**
 * Parse simple key:value pairs from YAML frontmatter text.
 * Only handles scalar values (not arrays/objects).
 */
function parseFrontmatterValues(frontmatter) {
  const map = new Map();
  if (!frontmatter) return map;
  for (const line of frontmatter.split('\n')) {
    const m = line.match(/^([a-z][a-z0-9_-]*):\s*(.+)\s*$/);
    if (m) map.set(m[1].trim(), m[2].trim());
  }
  return map;
}

// ── Main converter ───────────────────────────────────────────────────────────

/**
 * Convert a workflow artifact from v1 bold-bullet metadata to v2 list key:value.
 *
 * Rules:
 * - Classification by path suffix first (retro before feat-*)
 * - Merge-first: existing good values are preserved, not overwritten
 * - v1→v2 key mapping (Schema/Id/Title/Artifact/Feature are dropped)
 * - YAML frontmatter stripped (values extracted before stripping)
 * - H1 prepended if missing (from Title field or slug)
 * - Idempotent: returns changed=false when normalized output equals input
 */
export function convertArtifactMetadata(file, content) {
  const base = basename(file);
  const warnings = [];

  const { frontmatter } = parseFrontmatter(content);
  const fmValues = parseFrontmatterValues(frontmatter);

  const stripped = stripFrontmatter(content);
  const parsed = parseArtifactMetadata(stripped);
  const legacyPlain = legacyPlainMetadataFields(parsed);
  const kind = inferArtifactKind(file);

  if (!kind) {
    return { changed: false, content, warnings: [`uncovered artifact: ${file}`] };
  }

  // Get current v1 fields (for merge) — checks parsed metadata then frontmatter values
  const get = (...keys) => {
    const fromParsed = getField(parsed, ...keys);
    if (fromParsed) return fromParsed;
    for (const k of keys) {
      const fromLegacyPlain = legacyPlain.get(k);
      if (fromLegacyPlain) return fromLegacyPlain;
      const v = fmValues.get(k) ?? fmValues.get(k.toLowerCase());
      if (v) return v;
    }
    return null;
  };

  const existingH1Match = stripped.match(/^#\s+(.+)$/m);
  const legacyTitle = get('Title') ?? (existingH1Match ? existingH1Match[1] : null) ?? slugFromFile(file);

  let body = ensureH1(stripped, legacyTitle);
  body = normalizeH1(body, kind, slugFromFile(file));
  // Capture body links BEFORE stripping so extractBodyLink sees them regardless of layout.
  const preStripLinks = kind === 'audit-report'
    ? { plan: extractBodyLink(body, 'Plan'), implementation: extractBodyLink(body, 'Implementation') }
    : null;
  body = stripImplementationHeaderLines(body, file);

  const bodyParsed = parseArtifactMetadata(body);
  const existing = new Map([
    ...legacyPlainMetadataFields(bodyParsed),
    ...existingV2Fields(bodyParsed),
  ]);
  const fields = buildFields({ kind, get, body, fmValues, base, preStripLinks });
  const finalFields = mergeExistingFields(fields, existing, kind);

  const next = insertMetadata(body, finalFields);

  const normalizedInput = content.replace(/\n+$/, '\n');
  const normalizedNext = next.replace(/\n+$/, '\n');

  return {
    changed: normalizedNext !== normalizedInput,
    content: next,
    warnings,
  };
}

// ── Helpers for field extraction ─────────────────────────────────────────────

function addField(fields, key, value) {
  if (value !== null && value !== undefined && value !== '') fields.push([key, value]);
}

function addUpdated(fields, get) {
  addField(fields, 'updated', get('Updated', 'updated', 'Date', 'date') ?? get('created', 'Created'));
}

function buildFields({ kind, get, body, fmValues, base, preStripLinks = null }) {
  if (kind === 'plan') {
    const fields = [
      ['status', get('Status', 'status') ?? 'Draft'],
      ['version', get('Plan-Version', 'Version', 'version') ?? versionFromLog(body) ?? 'v1'],
    ];
    addField(fields, 'branch', get('Branch', 'branch'));
    addUpdated(fields, get);
    return fields;
  }

  if (kind === 'review') {
    const rawRound = get('Last Review Round', 'Last review round', 'Round', 'round') ?? firstRound(body, 'R');
    const fields = [
      ['status', get('Status', 'status') ?? 'active'],
      ['plan_version', get('Plan-Version', 'Plan Version', 'plan_version') ?? 'v1'],
      ['round', extractRoundId(rawRound)],
      ['verdict', latestReviewVerdict(body) ?? get('Verdict', 'verdict', 'Last Status') ?? 'NEEDS_REVISION'],
    ];
    addUpdated(fields, get);
    return fields;
  }

  if (kind === 'implementation-report') {
    const fields = [
      ['status', get('Status', 'status') ?? 'active'],
      ['plan_version', implementationPlanVersion(body)],
      ['round', get('Round', 'round') ?? firstRound(body, 'I')],
      ['result', implementationResult(body)],
    ];
    addUpdated(fields, get);
    return fields;
  }

  if (kind === 'audit-report') {
    const fields = [
      ['status', get('Status', 'status') ?? 'active'],
      ['round', get('Round', 'round') ?? firstRound(body, 'A')],
      ['verdict', auditVerdict(body) ?? get('Verdict', 'verdict') ?? 'ready'],
    ];
    // Migrate Plan:/Implementation: links into metadata fields.
    // preStripLinks captures them from body before stripImplementationHeaderLines runs,
    // so canonical layout (body, outside ## Metadata) and legacy layout (inside ## Metadata scope) both work.
    addField(fields, 'plan', preStripLinks?.plan ?? get('Plan', 'plan'));
    addField(fields, 'implementation', preStripLinks?.implementation ?? get('Implementation', 'implementation'));
    addUpdated(fields, get);
    return fields;
  }

  const fields = [];
  const rawStatus = get('Status', 'status');
  const status = normalizeStatus(rawStatus, kind);
  addField(fields, 'status', status);

  if (kind === 'context') {
    const ctxKind = inferContextKind({ get, fmValues, base });
    addField(fields, 'kind', ctxKind);
  }

  // Migrate YAML tags to v2 metadata for context and feature artifacts.
  if (kind === 'context' || kind === 'feature') {
    const tags = fmValues.get('tags') ?? get('tags', 'Tags');
    addField(fields, 'tags', tags);
  }

  addUpdated(fields, get);
  return fields;
}

function inferContextKind({ get, fmValues, base }) {
  const existingKind = get('kind');
  if (existingKind) return existingKind;
  const fmType = fmValues.get('type') ?? '';
  if (
    get('Artifact') === 'research-context'
    || get('Shape') === 'survey'
    || fmType === 'research-context'
    || fmType === 'research'
    || fmValues.get('shape') === 'survey'
    // Match "research" as a slug token (surrounded by separator or at boundary),
    // not as a substring — avoids mis-classifying e.g. non-research-notes.context.md.
    || /(^|[-_.])research([-_.]|$)/i.test(base)
  ) return 'research';
  if (fmType === 'brainstorm-context' || fmType === 'brainstorm') return 'brainstorm';
  return null;
}

function mergeExistingFields(fields, existing, kind) {
  return fields.map(([key, value]) => {
    const existingValue = existing.get(key);
    if (!existingValue) return [key, value];
    if (key === 'version' || key === 'plan_version') return [key, higherVersion(existingValue, value)];
    if (key === 'status') return [key, normalizeStatus(existingValue, kind)];
    return [key, existingValue];
  }).filter(([, value]) => value !== null && value !== undefined && value !== '');
}

function latestReviewVerdict(content) {
  const matches = [...content.matchAll(/^Verdict:\s*(READY|NEEDS_REVISION)$/gm)];
  if (matches.length) return matches[matches.length - 1][1];
  const parsed = parseArtifactMetadata(content);
  return getField(parsed, 'Verdict', 'verdict', 'Last Status') ?? null;
}

function auditVerdict(content) {
  // Multi-round audit: search for - **Verdict**: value
  const match = content.match(/^-\s+\*\*Verdict\*\*:\s*(ready|needs-fixes|plan-fix|re-plan)$/m);
  return match ? match[1] : null;
}

// Legacy status values not valid in v2 → canonical v2 mapping, per kind where values differ.
// Cross-kind fallbacks: 'Implemented'→'completed', capitalization errors, etc.
const LEGACY_STATUS_MAP = {
  // Feature / generic
  'In Research': 'active', 'In Progress': 'active', 'in-progress': 'active',
  'Implemented': 'completed',
  'New': 'active', 'new': 'active',
  'done': 'completed', 'Done': 'completed',
};
// Context-specific: 'in-research' maps to 'draft' (still being researched, not yet active)
const LEGACY_STATUS_MAP_CONTEXT = {
  'in-research': 'draft', 'In Research': 'draft',
  'ready-for-plan': 'ready', 'Ready for plan': 'ready',
  'decided': 'archived', 'Decided': 'archived',
  'candidates': 'draft', 'Candidates': 'draft',
};

/**
 * Normalize a legacy status value to a valid v2 enum for the given kind.
 * Valid v2 values pass through unchanged. Invalid values are resolved via
 * kind-specific or cross-kind legacy maps, then case-fold as last resort.
 * Contract enums (schemaForArtifact) are the single source of truth for valid values.
 */
function normalizeStatus(status, kind) {
  if (!status) return status;
  const spec = kind ? schemaForArtifact(kind) : null;
  const validValues = spec?.enums?.status ?? [];
  // Already valid — pass through
  if (validValues.includes(status)) return status;
  // Kind-specific legacy map takes priority
  const kindMap = kind === 'context' ? LEGACY_STATUS_MAP_CONTEXT : LEGACY_STATUS_MAP;
  const mapped = kindMap[status];
  if (mapped && validValues.includes(mapped)) return mapped;
  // Cross-kind fallback (context didn't have it, try the generic map)
  if (kind === 'context') {
    const generic = LEGACY_STATUS_MAP[status];
    if (generic && validValues.includes(generic)) return generic;
  }
  // Case-fold (e.g. 'Draft' → 'draft')
  const lower = status.toLowerCase();
  return validValues.includes(lower) ? lower : status;
}

/** Return the higher of two version strings (vN). */
function higherVersion(a, b) {
  const na = parseInt((a ?? '').replace(/^v/, ''), 10);
  const nb = parseInt((b ?? '').replace(/^v/, ''), 10);
  if (isNaN(na)) return b;
  if (isNaN(nb)) return a;
  return na >= nb ? a : b;
}
