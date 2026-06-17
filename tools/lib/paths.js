import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG_PATHS_MD = resolve(dirname(fileURLToPath(import.meta.url)), '../../assets/base/config/paths.md');

/**
 * Parse paths.md content into a Map<zoneName, Entry[]>.
 * Grammar:
 *   ## Zone-Name   → zone key
 *   - path [key: value ...]  → entry with optional annotations
 * Any non-`- ` line inside a zone section is ignored.
 * @param {string} content
 * @returns {Map<string, Array<{path: string, source?: string, checker?: string}>>}
 */
export function parseZones(content) {
  const zones = new Map();
  let current = null;

  for (const raw of content.split('\n')) {
    const line = raw.trimEnd();

    if (line.startsWith('## ')) {
      const name = line.slice(3).trim();
      current = name;
      zones.set(name, []);
      continue;
    }

    if (current === null) continue;
    if (!line.startsWith('- ')) continue;

    const body = line.slice(2).trim();
    const entry = { path: '' };

    // Extract key: value annotations (greedy split: first token = path, rest = annotations)
    const parts = body.split(/\s{2,}/);
    entry.path = parts[0].trim();

    for (const part of parts.slice(1)) {
      const colon = part.indexOf(':');
      if (colon === -1) continue;
      const key = part.slice(0, colon).trim();
      const value = part.slice(colon + 1).trim();
      if (key && value) entry[key] = value;
    }

    if (entry.path) {
      zones.get(current).push(entry);
    }
  }

  return zones;
}

/**
 * Load zones from the workspace paths.md, falling back to the package asset.
 * @param {string} root - repo/workspace root directory
 * @returns {Map<string, Array<{path: string, source?: string, checker?: string}>>}
 */
export function loadZones(root) {
  const candidates = [
    join(root, '.pythia', 'config', 'paths.md'),
    join(root, '.pythia', 'paths.md'), // legacy path (pre-config/ restructure)
    PKG_PATHS_MD,
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      try {
        return parseZones(readFileSync(candidate, 'utf8'));
      } catch {
        // fall through to next candidate
      }
    }
  }

  return new Map();
}

/**
 * Return all entries for a zone, or [] if zone not found.
 * @param {Map} zones
 * @param {string} name
 */
export function zone(zones, name) {
  return zones.get(name) ?? [];
}

/**
 * Return paths of all generated-cache entries (entries that have a source).
 */
export function generatedCachePaths(zones) {
  return zone(zones, 'Generated cache')
    .filter((e) => e.source)
    .map((e) => e.path);
}

/**
 * Return paths of all protected-zone entries.
 */
export function protectedPaths(zones) {
  return zone(zones, 'Protected').map((e) => e.path);
}

/**
 * Derive surface dirs + instruction targets from the Generated cache zone.
 * Returns { surfaces: string[], substitutions: Array<{file, tool, skillsPath}> }
 * for use in workspace.js init/update.
 */
export function deriveSurfacesAndSubstitutions(zones) {
  const cached = zone(zones, 'Generated cache');

  // Skills surfaces: entries whose source is 'skills/'
  const surfaces = cached
    .filter((e) => e.source === 'skills/')
    .map((e) => e.path);

  // Instruction substitution targets: entries whose source is 'assets/instructions.md'
  const substitutions = cached
    .filter((e) => e.source === 'assets/instructions.md')
    .map((e) => {
      const file = e.path; // e.g. CLAUDE.md, AGENTS.md
      const isClaude = file === 'CLAUDE.md';
      const tool = isClaude ? 'Claude Code' : 'Codex';
      // skillsPath: find the surface dir associated with this tool
      // Claude surface: path contains 'claude'. Non-Claude (Codex/any other): first surface that isn't Claude.
      const surfaceEntry = cached.find((s) =>
        s.source === 'skills/' &&
        (isClaude ? s.path.includes('claude') : !s.path.includes('claude'))
      );
      const skillsPath = surfaceEntry?.path ?? (isClaude ? '.claude/skills' : '.agents/skills');
      return { file, tool, skillsPath };
    });

  return { surfaces, substitutions };
}
