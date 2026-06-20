import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/**
 * Parse YAML frontmatter from markdown content.
 * Returns { frontmatter: string|null, body: string }.
 */
export function parseFrontmatter(content) {
  if (!content.startsWith('---\n')) return { frontmatter: null, body: content };
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) return { frontmatter: null, body: content };
  return { frontmatter: content.slice(4, end), body: content.slice(end + 5) };
}

/**
 * Extract all relative markdown links from content: [text](path).
 * Returns an array of { text, href, line } where href is not a URL and not an anchor.
 */
export function extractRelativeLinks(content, { skipFenced = false } = {}) {
  const lines = content.split('\n');
  const links = [];
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    if (skipFenced && lines[i].startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (skipFenced && inFence) continue;
    const re = /\[([^\]]*)\]\(([^)]+)\)/g;
    let m;
    while ((m = re.exec(lines[i])) !== null) {
      const href = m[2].split('#')[0].trim();
      if (!href) continue; // anchor-only
      if (/^https?:\/\//.test(href)) continue; // absolute URL
      if (/^mailto:/.test(href)) continue;
      links.push({ text: m[1], href, line: i + 1 });
    }
  }
  return links;
}

/**
 * Resolve a relative link href against a base file path.
 * Returns the absolute path of the target.
 */
export function resolveLink(baseFile, href) {
  return resolve(dirname(baseFile), href);
}

/**
 * Extract the inputs: frontmatter block as an array of "path:hash" strings.
 */
export function extractInputs(content) {
  const { frontmatter } = parseFrontmatter(content);
  if (!frontmatter) return [];
  const lines = frontmatter.split('\n');
  const start = lines.findIndex((l) => l === 'inputs:');
  if (start === -1) return [];
  const entries = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (!lines[i].startsWith('  - ')) break;
    entries.push(lines[i].slice(4));
  }
  return entries;
}

/**
 * Extract the value of a metadata key like **Plan-Version**: from a markdown file.
 */
export function extractMetaValue(content, key) {
  const re = new RegExp(`^\\s*-\\s+\\*\\*${key}\\*\\*:\\s*(.+)$`, 'm');
  const m = content.match(re);
  return m ? m[1].trim() : null;
}

/**
 * Extract all ## section headers from markdown content.
 */
export function extractSections(content) {
  const sections = [];
  for (const line of content.split('\n')) {
    const m = line.match(/^## (.+)$/);
    if (m) sections.push(m[1]);
  }
  return sections;
}

/**
 * Get the text content of a named section (between ## header and next ##).
 */
export function getSectionContent(content, header) {
  const lines = content.split('\n');
  const start = lines.findIndex((l) => l === `## ${header}`);
  if (start === -1) return null;
  const end = lines.findIndex((l, i) => i > start && /^## /.test(l));
  return (end === -1 ? lines.slice(start + 1) : lines.slice(start + 1, end)).join('\n');
}

/**
 * Human title for a markdown doc: frontmatter `title:` then first body `# H1`.
 * @param {string} content
 * @returns {string|null}
 */
export function markdownTitleFromContent(content) {
  const { frontmatter, body } = parseFrontmatter(content);
  if (frontmatter) {
    const m = frontmatter.match(/^title:\s*(.+)$/m);
    if (m) {
      const raw = m[1].trim();
      return raw.replace(/^['"]|['"]$/g, '');
    }
  }
  for (const line of body.split('\n')) {
    const m = line.match(/^#\s+(.+)$/);
    if (m) return m[1].trim();
  }
  return null;
}

/** @param {string} absPath */
export function readMarkdownTitle(absPath) {
  if (!existsSync(absPath)) return null;
  return markdownTitleFromContent(readFileSync(absPath, 'utf8'));
}
