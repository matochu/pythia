import { readFileSync, writeFileSync } from 'node:fs';
import { relative, resolve, dirname } from 'node:path';

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

/** @param {string} path */
export function kindForPath(path) {
  const base = path.split('/').pop() || path;
  if (base.endsWith('.plan.md')) return 'plan';
  if (base.endsWith('.context.md')) return 'research';
  if (base.endsWith('.md')) return 'doc';
  return 'code';
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
  const lines = ['## References', ''];
  const sortedRefs = [...region.references].sort((a, b) => a.path.localeCompare(b.path));
  for (const r of sortedRefs) {
    lines.push(formatRefEntry(r));
  }
  if (region.usedBy?.length) {
    lines.push('', '## Used by', '');
    const sortedUsed = [...region.usedBy].sort((a, b) => a.path.localeCompare(b.path));
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
  writeFileSync(file, body ? `${body}\n\n${regionStr}` : regionStr, 'utf8');
}

/** Doc-relative POSIX path from one file to another absolute target. */
export function docRelativePath(fromFile, absTarget) {
  let rel = relative(dirname(resolve(fromFile)), resolve(absTarget));
  return rel.split('\\').join('/');
}

/** Resolve a stored doc-relative path against a base file. */
export function resolveDocLink(baseFile, href) {
  const { path } = splitHashFragment(href);
  if (!path) return null;
  return resolve(dirname(resolve(baseFile)), path);
}
