import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { relative, resolve, dirname } from 'node:path';
import { realpathSync } from 'node:fs';

const TYPED_REF_LINE = /^- \[([^\]]+)\] \[([^\]]*)\]\(([^)]+)\)\s*$/;
/** Legacy bibliography lines (task/idea docs): `- [label](path)` optional trailing prose. */
const PLAIN_REF_LINE = /^- \[([^\]]+)\]\(([^)]+)\)\s*(?:[—–-]\s.*)?$/;
/** `- Label: [title](path)` lines common in ctx/task bibliographies. */
const PROSE_PREFIX_LINK_LINE = /^- (.+?):\s*\[([^\]]*)\]\(([^)]+)\)\s*$/;
/** `- Label: https://...` external bibliography lines. */
const PROSE_PREFIX_URL_LINE = /^- (.+?):\s*(https?:\/\/\S+)\s*$/;
/** `- Label. [title](path)` — period separator (common in research bibliographies). */
const PROSE_PERIOD_LINK_LINE = /^- (.+?)\.\s*\[([^\]]*)\]\(([^)]+)\)\s*$/;
/** `- Author. "Title." https://...` academic bibliography lines (period may be inside quotes). */
const PROSE_ACADEMIC_URL_LINE = /^- (.+?\.\s+)?"([^"]+)"\s+(https?:\/\/\S+)\s*$/;
/** `- Label. https://...` — period before bare URL. */
const PROSE_PERIOD_URL_LINE = /^- (.+?)\.\s+(https?:\/\/\S+)\s*$/;

/** Kind tag for external bibliography hrefs (https://…); not repo `code` or in-tree `note`. */
export const EXTERNAL_REF_KIND = 'url';

/** @param {string} path */
export function isExternalBibliographyHref(path) {
  return /^https?:\/\//i.test(path.trim());
}

/** Normalize legacy href shapes (mdc:, etc.) for resolution and storage. */
export function normalizeBibliographyPath(path) {
  const trimmed = path.trim();
  if (trimmed.startsWith('mdc:')) return trimmed.slice(4);
  return trimmed;
}

function splitKindTag(tag) {
  const idx = tag.indexOf(':');
  if (idx === -1) return { kind: tag, relType: undefined };
  return { kind: tag.slice(0, idx), relType: tag.slice(idx + 1) || undefined };
}

function parseRefLine(line, mode) {
  const typed = line.match(TYPED_REF_LINE);
  if (typed) {
    const { path, hash } = splitHashFragment(normalizeBibliographyPath(typed[3]));
    const { kind, relType } = splitKindTag(typed[1]);
    if (mode === 'refs') {
      return { kind, relType, text: typed[2], path, hash };
    }
    return { kind, relType, text: typed[2], path };
  }
  const plain = line.match(PLAIN_REF_LINE);
  if (plain) {
    const { path, hash } = splitHashFragment(normalizeBibliographyPath(plain[2]));
    const text = plain[1];
    if (mode === 'refs') {
      return { kind: kindForPath(path), text, path, hash };
    }
    return { kind: kindForPath(path), text, path };
  }
  if (mode !== 'refs') return null;
  const proseLink = line.match(PROSE_PREFIX_LINK_LINE);
  if (proseLink) {
    const { path, hash } = splitHashFragment(normalizeBibliographyPath(proseLink[3]));
    const text = (proseLink[2]?.trim() || proseLink[1]?.trim());
    return { kind: kindForPath(path), text, path, hash };
  }
  const proseUrl = line.match(PROSE_PREFIX_URL_LINE);
  if (proseUrl) {
    return { kind: EXTERNAL_REF_KIND, text: proseUrl[1].trim(), path: proseUrl[2].trim(), hash: null };
  }
  const periodLink = line.match(PROSE_PERIOD_LINK_LINE);
  if (periodLink) {
    const { path, hash } = splitHashFragment(normalizeBibliographyPath(periodLink[3]));
    const text = (periodLink[2]?.trim() || periodLink[1]?.trim());
    return { kind: kindForPath(path), text, path, hash };
  }
  const academicUrl = line.match(PROSE_ACADEMIC_URL_LINE);
  if (academicUrl) {
    return {
      kind: EXTERNAL_REF_KIND,
      text: academicUrl[2].trim(),
      path: academicUrl[3].trim(),
      hash: null,
    };
  }
  const periodUrl = line.match(PROSE_PERIOD_URL_LINE);
  if (periodUrl) {
    return {
      kind: EXTERNAL_REF_KIND,
      text: periodUrl[1].trim(),
      path: periodUrl[2].trim(),
      hash: null,
    };
  }
  return null;
}

/**
 * Split legacy ## References regionTrail into typed internal/external refs and leftover prose.
 * @param {string[] | undefined} regionTrail
 */
export function extractBibliographyFromTrail(regionTrail) {
  const internal = [];
  const external = [];
  const remainder = [];
  for (const line of regionTrail ?? []) {
    const parsed = parseRefLine(line, 'refs');
    if (!parsed) {
      if (line.trim()) remainder.push(line);
      continue;
    }
    if (isExternalBibliographyHref(parsed.path)) external.push(parsed);
    else internal.push(parsed);
  }
  return { internal, external, remainder };
}

/** @param {string} href */
export function splitHashFragment(href) {
  const trimmed = href.trim();
  const hashIdx = trimmed.lastIndexOf('#');
  if (hashIdx === -1) return { path: trimmed, hash: null };
  const path = trimmed.slice(0, hashIdx).trim();
  const hash = trimmed.slice(hashIdx + 1).trim();
  return { path, hash: hash || null };
}

/** Read `type:` from markdown frontmatter when present. */
function readFrontmatterType(absPath) {
  if (!absPath || !existsSync(absPath)) return null;
  const content = readFileSync(absPath, 'utf8');
  if (!content.startsWith('---\n')) return null;
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) return null;
  const line = content.slice(4, end).split('\n').find((l) => l.startsWith('type:'));
  return line ? line.slice(5).trim().toLowerCase() : null;
}

/** Classify `.context.md` / `.ctx.md` workflow artifacts (not all `.context.md` are `ctx`). */
function kindForContextArtifact(absPath) {
  if (!absPath || !existsSync(absPath)) return null;
  const base = absPath.split('/').pop() || absPath;
  if (base.endsWith('.ctx.md')) return 'ctx';
  if (!base.endsWith('.context.md')) return null;

  const fmType = readFrontmatterType(absPath);
  if (fmType === 'context' || fmType === 'architecture') return 'ctx';
  if (fmType && (fmType.includes('research') || fmType.includes('brainstorm'))) return 'research';

  const content = readFileSync(absPath, 'utf8');
  if (/\*\*Artifact\*\*:\s*research/i.test(content)) return 'research';

  if (/-research\.context\.md$|deep-dive\.context\.md$|brainstorm\.context\.md$/i.test(base)) {
    return 'research';
  }

  return 'research';
}

/** Index/instruction basenames — never get typed ## References / ## Used by from inputs sync. */
export const SYNC_FOOTER_EXCLUDED_BASENAMES = new Set([
  'README.md',
  'AGENTS.md',
  'CLAUDE.md',
]);

/** Paths under `.pythia/` excluded from sync/backlinks (runtime, config, backups, index readmes). */
function isPythiaSyncExcludedRelPath(norm) {
  const base = norm.split('/').pop() ?? '';
  if (SYNC_FOOTER_EXCLUDED_BASENAMES.has(base)) return true;
  return norm.startsWith('.pythia/runtime/')
    || norm.startsWith('.pythia/config/')
    || norm.startsWith('.pythia/backups/');
}

function isSkillRelPath(norm) {
  return /\/SKILL\.md$/i.test(norm)
    && (norm.startsWith('skills/')
      || norm.startsWith('.claude/skills/')
      || norm.startsWith('.agents/skills/'));
}

/** Outside `.pythia` sync zone: skills → skill, other markdown → doc, else code. */
function kindOutsidePythiaSyncZone(norm, base) {
  if (isSkillRelPath(norm)) return 'skill';
  return base.endsWith('.md') ? 'doc' : 'code';
}

/** Default link label for a stored ref path (skill folder name, artifact stem, etc.). */
export function defaultRefText(depPath) {
  const norm = depPath.replace(/\\/g, '/');
  const base = norm.split('/').pop() || norm;
  if (base === 'SKILL.md') {
    const parts = norm.split('/').filter(Boolean);
    const skillsIdx = parts.lastIndexOf('skills');
    if (skillsIdx !== -1 && parts[skillsIdx + 1]) return parts[skillsIdx + 1];
  }
  if (base.endsWith('.retro.md')) return base.slice(0, -'.retro.md'.length);
  if (base.endsWith('.plan.md')) return base.slice(0, -'.plan.md'.length);
  if (base.endsWith('.context.md')) return base.slice(0, -'.context.md'.length);
  if (base.endsWith('.review.md')) return base.slice(0, -'.review.md'.length);
  if (base.endsWith('.implementation.md')) return base.slice(0, -'.implementation.md'.length);
  if (base.endsWith('.audit.md')) return base.slice(0, -'.audit.md'.length);
  if (/^feat-.+\.md$/.test(base)) return base.slice(0, -3);
  return base.replace(/\.md$/, '');
}

function isInsidePythiaSyncZone(rel) {
  return rel.startsWith('.pythia/') && !isPythiaSyncExcludedRelPath(rel);
}

/** @param {string} path @param {{ targetAbs?: string, root?: string }} [opts] */
export function kindForPath(path, opts = {}) {
  const norm = path.replace(/\\/g, '/');
  if (isExternalBibliographyHref(norm)) return EXTERNAL_REF_KIND;
  const base = norm.split('/').pop() || norm;
  const { targetAbs, root } = opts;
  let rel = norm;
  if (isSkillRelPath(norm)) return 'skill';
  if (targetAbs && root) {
    rel = relative(resolve(root), resolve(targetAbs)).replace(/\\/g, '/');
    if (!isInsidePythiaSyncZone(rel)) {
      return kindOutsidePythiaSyncZone(rel, base);
    }
    const ctxKind = kindForContextArtifact(targetAbs);
    if (ctxKind) return ctxKind;
  } else if (targetAbs) {
    const ctxKind = kindForContextArtifact(targetAbs);
    if (ctxKind) return ctxKind;
  }
  if (base.endsWith('.plan.md')) return 'plan';
  if (base.endsWith('.ctx.md')) return 'ctx';
  if (base.endsWith('.context.md')) return 'research';
  if (base.endsWith('.review.md')) return 'review';
  if (base.endsWith('.implementation.md')) return 'impl';
  if (base.endsWith('.audit.md')) return 'audit';
  if (base.endsWith('.retro.md')) return 'retro';
  if (/^feat-.+\.md$/.test(base)) return 'feat';
  if (base.endsWith('.md')) {
    if (isInsidePythiaSyncZone(rel)) return 'note';
    return 'doc';
  }
  return 'code';
}

/** Markdown under `.pythia/` eligible for sync/backlinks (excludes runtime, config, backups). */
export function isPythiaSyncMarkdownRelPath(relPath) {
  const norm = relPath.replace(/\\/g, '/');
  if (!norm.startsWith('.pythia/') || !norm.endsWith('.md')) return false;
  if (isPythiaSyncExcludedRelPath(norm)) return false;
  return true;
}

/** @deprecated use isPythiaSyncMarkdownRelPath */
export function isWorkflowMarkdownRelPath(relPath) {
  return isPythiaSyncMarkdownRelPath(relPath);
}

/**
 * Split document into body parts and trailing References/Used-by region.
 * Uses the **last** `## References` heading (freshness footer); earlier in-body
 * sections with the same heading stay in the body prefix.
 * Relocates misplaced ## headings that appear after the region back into body.
 */
export function splitBodyAndRegion(content) {
  const lines = content.split('\n');
  let refIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === '## References') refIdx = i;
  }
  if (refIdx === -1) {
    return { bodyLines: lines, references: [], usedBy: [], regionTrail: [], hadRegion: false };
  }

  const bodyPrefix = lines.slice(0, refIdx);
  const references = [];
  const usedBy = [];
  const regionTrail = [];
  let mode = 'refs';
  let i = refIdx + 1;
  const tailSections = [];

  while (i < lines.length) {
    const line = lines[i];
    if (line === '## Used by') {
      mode = 'usedBy';
      i++;
      continue;
    }
    if (/^## /.test(line)) {
      tailSections.push(...lines.slice(i));
      break;
    }
    const parsed = parseRefLine(line, mode);
    if (parsed) {
      if (mode === 'refs') references.push(parsed);
      else usedBy.push(parsed);
    } else if (line.trim()) {
      regionTrail.push(line);
    }
    i++;
  }

  const bodyLines = [...bodyPrefix];
  if (tailSections.length) {
    if (bodyLines.length && bodyLines[bodyLines.length - 1] !== '') bodyLines.push('');
    bodyLines.push(...tailSections);
  }

  return { bodyLines, references, usedBy, regionTrail, hadRegion: true };
}

/** @returns {string} */
export function getBodyContent(content) {
  const { bodyLines } = splitBodyAndRegion(content);
  return bodyLines.join('\n');
}

/**
 * @param {string} content
 * @returns {{ references: Array<{kind:string,text:string,path:string,hash:string|null}>, usedBy: Array<{kind:string,text:string,path:string}> } | null}
 */
export function parseTrailingRefs(content) {
  const { references, usedBy, regionTrail, hadRegion } = splitBodyAndRegion(content);
  if (!hadRegion) return null;
  return { references, usedBy, regionTrail };
}

function formatRefEntry({ kind, relType, text, path, hash }) {
  const href = hash ? `${path}#${hash}` : path;
  // 'related' is the implicit default lateral relation — omit the suffix to reduce noise
  const tag = (relType && relType !== 'related') ? `${kind}:${relType}` : kind;
  return `- [${tag}] [${text}](${href})`;
}

function formatUsedByEntry({ kind, relType, text, path }) {
  const tag = (relType && relType !== 'related') ? `${kind}:${relType}` : kind;
  return `- [${tag}] [${text}](${path})`;
}

/** @param {{ references: object[], usedBy: object[], regionTrail?: string[] }} region */
export function renderTrailingRegion(region) {
  const refs = region.references ?? [];
  const used = region.usedBy ?? [];
  const trail = region.regionTrail ?? [];
  if (!refs.length && !used.length && !trail.length) return '';

  const lines = ['## References', ''];
  const sortedRefs = [...refs].sort((a, b) => a.path.localeCompare(b.path));
  for (const r of sortedRefs) {
    lines.push(formatRefEntry(r));
  }
  if (trail.length) {
    if (lines.length && lines[lines.length - 1] !== '') lines.push('');
    lines.push(...trail);
  }
  if (used.length) {
    lines.push('', '## Used by', '');
    const sortedUsed = [...used].sort((a, b) => a.path.localeCompare(b.path));
    for (const u of sortedUsed) {
      lines.push(formatUsedByEntry(u));
    }
  }
  return `${lines.join('\n')}\n`;
}

/** @param {string} file @param {{ references: object[], usedBy: object[], regionTrail?: string[] }} region */
export function writeTrailingRefs(file, region) {
  const content = readFileSync(file, 'utf8');
  const { bodyLines } = splitBodyAndRegion(content);
  while (bodyLines.length && bodyLines[bodyLines.length - 1] === '') {
    bodyLines.pop();
  }
  const body = bodyLines.join('\n');
  const regionStr = renderTrailingRegion(region);
  writeFileSync(file, regionStr ? (body ? `${body}\n\n${regionStr}` : regionStr) : body, 'utf8');
}

function normalizeAbsPath(p) {
  try {
    return realpathSync.native(p);
  } catch {
    return resolve(p);
  }
}

/** Doc-relative POSIX path from one file to another absolute target. */
export function docRelativePath(fromFile, absTarget) {
  const rel = relative(
    dirname(normalizeAbsPath(fromFile)),
    normalizeAbsPath(absTarget),
  );
  return rel.split('\\').join('/');
}

/** Prefer the correct path format based on source/target location:
 *  - Both source and target inside .pythia/ → doc-relative (markdown-resolvable)
 *  - Target inside project but outside .pythia/ → /-absolute (e.g. /tools/lib/foo.js)
 *  - Target outside project → doc-relative (existing behaviour)
 */
export function repoOrDocRelativePath(fromFile, absTarget, root) {
  const fromRoot = relative(normalizeAbsPath(root), normalizeAbsPath(absTarget)).replace(/\\/g, '/');
  // Target outside workspace: fall back to doc-relative
  if (fromRoot.startsWith('..') || fromRoot.startsWith('/')) return docRelativePath(fromFile, absTarget);
  // Intra-.pythia: both source and target inside .pythia/ — use doc-relative so editors can resolve
  const fromFileRel = relative(normalizeAbsPath(root), normalizeAbsPath(fromFile)).replace(/\\/g, '/');
  if (fromFileRel.startsWith('.pythia/') && fromRoot.startsWith('.pythia/')) {
    return docRelativePath(fromFile, absTarget);
  }
  // Target outside .pythia/ (tools/, assets/, templates/, etc.) → /-absolute
  if (!fromRoot.startsWith('.pythia/')) {
    return '/' + fromRoot;
  }
  // Target inside .pythia/, source outside (e.g. root doc referencing .pythia file) — repo-root-relative
  return fromRoot;
}

/** Resolve a stored doc-relative or repo-root-relative path against a base file. */
export function resolveDocLink(baseFile, href, root) {
  const { path: hrefPath } = splitHashFragment(href);
  if (!hrefPath) return null;

  const isProjectAbsolute = hrefPath.startsWith('/');
  const isExplicitRelative = hrefPath.startsWith('./') || hrefPath.startsWith('../');
  const workspaceRooted =
    hrefPath.startsWith('.pythia/')
    || hrefPath.startsWith('skills/')
    || hrefPath.startsWith('.claude/')
    || hrefPath.startsWith('tools/')
    || hrefPath.startsWith('assets/')
    || hrefPath.startsWith('commands/')
    || hrefPath.startsWith('templates/');

  const candidates = [];
  // /-absolute project paths: resolve from workspace root (strip leading /)
  if (isProjectAbsolute) {
    const stripped = hrefPath.slice(1);
    if (root) candidates.push(resolve(normalizeAbsPath(root), stripped));
    candidates.push(resolve(dirname(normalizeAbsPath(baseFile)), stripped));
  } else {
    // Repo-root-relative and allowlisted paths: workspace root before doc-relative
    // (matches repoOrDocRelativePath storage; avoids local README.md shadowing root).
    if (root && (workspaceRooted || !isExplicitRelative)) {
      candidates.push(resolve(normalizeAbsPath(root), hrefPath));
    }
    candidates.push(resolve(dirname(normalizeAbsPath(baseFile)), hrefPath));
  }
  // Legacy task/idea docs: `../navigation/foo.md` from `.pythia/workflows/tasks/` → `{projectRoot}/navigation/foo.md`
  if (root && isExplicitRelative) {
    const stripped = hrefPath.replace(/^(\.\.\/)+/, '');
    if (stripped && stripped !== hrefPath && !stripped.startsWith('..')) {
      candidates.push(resolve(normalizeAbsPath(root), stripped));
    }
  }

  const seen = new Set();
  for (const abs of candidates) {
    const key = normalizeAbsPath(abs);
    if (seen.has(key)) continue;
    seen.add(key);
    if (existsSync(abs)) return abs;
  }
  return candidates[0] ?? null;
}

/**
 * True when usedBy (on fromFile) contains a backlink to consumerFile.
 * Accepts repo-root-relative, doc-relative, or resolved paths.
 */
export function usedByLinksToConsumer(usedBy, fromFile, consumerFile, root) {
  if (!usedBy?.length || !root) return false;
  const canonical = repoOrDocRelativePath(fromFile, consumerFile, root);
  const docRel = docRelativePath(fromFile, consumerFile);
  for (const u of usedBy) {
    if (u.path === canonical || u.path === docRel) return true;
    const resolved = resolveDocLink(fromFile, u.path, root);
    if (resolved && existsSync(resolved)) {
      try {
        if (normalizeAbsPath(resolved) === normalizeAbsPath(consumerFile)) return true;
      } catch {
        if (resolve(resolved) === resolve(consumerFile)) return true;
      }
    }
  }
  return false;
}
