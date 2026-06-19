import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Package-default paths.md: dev layout (tools/lib) or materialized runtime copy. */
export function resolvePackagePathsMd() {
  const here = dirname(fileURLToPath(import.meta.url));
  const devAsset = resolve(here, '../../assets/base/config/paths.md');
  if (existsSync(devAsset)) return devAsset;
  const materialized = resolve(here, '../package-paths.md');
  return existsSync(materialized) ? materialized : devAsset;
}

/**
 * Parse paths.md content into a Map<zoneName, Entry[]>.
 * Grammar:
 *   ## Zone-Name   → zone key
 *   - path                              → plain entry
 *   - path source: dir/                 → source annotation (one or more spaces before `source:`)
 *   - path checker: a.js, b.js          → checker annotation (optional `checker` keyword)
 *   - path: a.js, b.js                  → shorthand checker list (no `checker` word)
 * Glob tokens may use `*` or markdown-escaped `\*` (normalized to `*`).
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
    const entry = parseEntryBody(body);

    if (entry.path) {
      zones.get(current).push(entry);
    }
  }

  return zones;
}

/** Normalize markdown formatter escapes in path/glob tokens. */
export function unescapeMdPath(token) {
  return token.replace(/\\\*/g, '*');
}

/**
 * Parse a list-item body after `- `.
 * Supports explicit `source:` / `checker:`, shorthand `path: checker-list`, or plain path.
 */
export function parseEntryBody(body) {
  const explicit = body.match(/^(.+?)\s+(source|checker):\s+(.*)$/);
  if (explicit) {
    const key = explicit[2];
    const value = explicit[3].trim();
    const entry = { path: unescapeMdPath(explicit[1].trim()) };
    if (value) entry[key] = value;
    return entry;
  }

  const shorthand = body.match(/^(.+?):\s+(.+)$/);
  if (shorthand) {
    return {
      path: unescapeMdPath(shorthand[1].trim()),
      checker: shorthand[2].trim(),
    };
  }

  return { path: unescapeMdPath(body.trim()) };
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
    join(root, '.pythia', 'runtime', 'package-paths.md'), // materialized on init/update
    resolvePackagePathsMd(),
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

/** Basenames from a paths.md checker field (`a.js, dir/b.js`). */
export function checkerBasenames(checkerField) {
  if (!checkerField) return [];
  return checkerField
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => (name.includes('/') ? name.split('/').pop() : name));
}

/** Invoke fn(checkerBasename, workflowDocEntry) for each Workflow docs checker. */
export function forEachWorkflowChecker(zones, fn) {
  for (const entry of zone(zones, 'Workflow docs')) {
    if (!entry.checker) continue;
    for (const base of checkerBasenames(entry.checker)) {
      fn(base, entry);
    }
  }
}

/** Default install surfaces — Cursor is opt-in, not included here. */
export const DEFAULT_SURFACE_PATHS = ['.claude/skills', '.agents/skills'];

/** CLI/manifest surface key → skills directory path. */
export const SURFACE_KEY_MAP = {
  claude: '.claude/skills',
  codex: '.agents/skills',
  cursor: '.cursor/skills',
};

/**
 * Load zones for CLI package bootstrap — shipped asset only, not dogfood workspace copy.
 * Set PYTHIA_USE_DOGFOOD_PATHS=1 to include packageRoot/.pythia/config/paths.md (tests).
 */
export function loadZonesForBootstrap(packageRoot) {
  const candidates = [];
  if (process.env.PYTHIA_USE_DOGFOOD_PATHS === '1') {
    candidates.push(join(packageRoot, '.pythia', 'config', 'paths.md'));
  }
  candidates.push(resolvePackagePathsMd());

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      try {
        return parseZones(readFileSync(candidate, 'utf8'));
      } catch {
        // fall through
      }
    }
  }
  return new Map();
}

/**
 * Derive surface dirs + instruction targets from the Generated cache zone.
 * Returns { surfaces, defaultSurfaces, substitutions } for workspace.js init/update.
 */
export function deriveSurfacesAndSubstitutions(zones) {
  const cached = zone(zones, 'Generated cache');

  const surfaces = cached
    .filter((e) => e.source === 'skills/')
    .map((e) => e.path);

  const substitutions = cached
    .filter((e) => e.source === 'assets/instructions.md')
    .map((e) => {
      const file = e.path;
      if (file === 'CLAUDE.md') {
        return { file, tool: 'Claude Code', skillsPath: '.claude/skills' };
      }
      if (file === 'AGENTS.md') {
        return { file, tool: 'agent', skillsPath: '.agents/skills' };
      }
      return null;
    })
    .filter(Boolean);

  return { surfaces, defaultSurfaces: DEFAULT_SURFACE_PATHS, substitutions };
}
