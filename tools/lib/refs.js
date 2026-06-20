import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { relative, resolve, dirname } from 'node:path';
import { realpathSync } from 'node:fs';

const REF_LINE = /^- \[([^\]]+)\] \[([^\]]*)\]\(([^)]+)\)\s*$/;

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

/** Paths under `.pythia/` excluded from sync/backlinks (runtime, config, backups, README). */
function isPythiaSyncExcludedRelPath(norm) {
  return norm.startsWith('.pythia/runtime/')
    || norm.startsWith('.pythia/config/')
    || norm.startsWith('.pythia/backups/')
    || norm === '.pythia/README.md';
}

/** Outside `.pythia` sync zone: external markdown → doc, source files → code. */
function kindOutsidePythiaSyncZone(base) {
  return base.endsWith('.md') ? 'doc' : 'code';
}

function isInsidePythiaSyncZone(rel) {
  return rel.startsWith('.pythia/') && !isPythiaSyncExcludedRelPath(rel);
}

/** @param {string} path @param {{ targetAbs?: string, root?: string }} [opts] */
export function kindForPath(path, opts = {}) {
  const norm = path.replace(/\\/g, '/');
  const base = norm.split('/').pop() || norm;
  const { targetAbs, root } = opts;
  let rel = norm;
  if (targetAbs && root) {
    rel = relative(resolve(root), resolve(targetAbs)).replace(/\\/g, '/');
    if (!isInsidePythiaSyncZone(rel)) {
      return kindOutsidePythiaSyncZone(base);
    }
    const ctxKind = kindForContextArtifact(targetAbs);
    if (ctxKind) return ctxKind;
  } else if (targetAbs) {
    const ctxKind = kindForContextArtifact(targetAbs);
    if (ctxKind) return ctxKind;
  }
  if (/^feat-.+\.md$/.test(base)) return 'feat';
  if (base.endsWith('.plan.md')) return 'plan';
  if (base.endsWith('.ctx.md')) return 'ctx';
  if (base.endsWith('.context.md')) return 'research';
  if (base.endsWith('.review.md')) return 'review';
  if (base.endsWith('.implementation.md')) return 'impl';
  if (base.endsWith('.audit.md')) return 'audit';
  if (base.endsWith('.retro.md')) return 'retro';
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
 * Relocates misplaced ## headings that appear after the region back into body.
 */
export function splitBodyAndRegion(content) {
  const lines = content.split('\n');
  const refIdx = lines.findIndex((l) => l === '## References');
  if (refIdx === -1) {
    return { bodyLines: lines, references: [], usedBy: [], hadRegion: false };
  }

  const bodyPrefix = lines.slice(0, refIdx);
  const references = [];
  const usedBy = [];
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
    const m = line.match(REF_LINE);
    if (m) {
      const { path, hash } = splitHashFragment(m[3]);
      if (mode === 'refs') {
        references.push({ kind: m[1], text: m[2], path, hash });
      } else {
        usedBy.push({ kind: m[1], text: m[2], path });
      }
    }
    i++;
  }

  const bodyLines = [...bodyPrefix];
  if (tailSections.length) {
    if (bodyLines.length && bodyLines[bodyLines.length - 1] !== '') bodyLines.push('');
    bodyLines.push(...tailSections);
  }

  return { bodyLines, references, usedBy, hadRegion: true };
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
  const { references, usedBy, hadRegion } = splitBodyAndRegion(content);
  if (!hadRegion) return null;
  return { references, usedBy };
}

function formatRefEntry({ kind, text, path, hash }) {
  const href = hash ? `${path}#${hash}` : path;
  return `- [${kind}] [${text}](${href})`;
}

function formatUsedByEntry({ kind, text, path }) {
  return `- [${kind}] [${text}](${path})`;
}

/** @param {{ references: object[], usedBy: object[] }} region */
export function renderTrailingRegion(region) {
  const refs = region.references ?? [];
  const used = region.usedBy ?? [];
  if (!refs.length && !used.length) return '';

  const lines = ['## References', ''];
  const sortedRefs = [...refs].sort((a, b) => a.path.localeCompare(b.path));
  for (const r of sortedRefs) {
    lines.push(formatRefEntry(r));
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

/** @param {string} file @param {{ references: object[], usedBy: object[] }} region */
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

/** Prefer repo-root-relative path when target is inside the workspace. */
export function repoOrDocRelativePath(fromFile, absTarget, root) {
  const fromRoot = relative(normalizeAbsPath(root), normalizeAbsPath(absTarget)).replace(/\\/g, '/');
  if (!fromRoot.startsWith('..') && !fromRoot.startsWith('/')) return fromRoot;
  return docRelativePath(fromFile, absTarget);
}

/** Resolve a stored doc-relative or repo-root-relative path against a base file. */
export function resolveDocLink(baseFile, href, root) {
  const { path: hrefPath } = splitHashFragment(href);
  if (!hrefPath) return null;

  const isExplicitRelative = hrefPath.startsWith('./') || hrefPath.startsWith('../');
  const workspaceRooted =
    hrefPath.startsWith('.pythia/')
    || hrefPath.startsWith('skills/')
    || hrefPath.startsWith('.claude/')
    || hrefPath.startsWith('tools/')
    || hrefPath.startsWith('assets/');

  const candidates = [];
  // Repo-root-relative and allowlisted paths: workspace root before doc-relative
  // (matches repoOrDocRelativePath storage; avoids local README.md shadowing root).
  if (root && (workspaceRooted || !isExplicitRelative)) {
    candidates.push(resolve(normalizeAbsPath(root), hrefPath));
  }
  candidates.push(resolve(dirname(normalizeAbsPath(baseFile)), hrefPath));

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
