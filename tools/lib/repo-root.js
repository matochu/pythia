import { existsSync, statSync, realpathSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';

export function normalizePath(p) {
  try {
    return realpathSync(p);
  } catch {
    return resolve(p);
  }
}

function startDir(startPath) {
  let dir = resolve(startPath);
  try {
    if (existsSync(dir) && statSync(dir).isFile()) dir = dirname(dir);
  } catch {
    // keep dir
  }
  return dir;
}

function isPythiaProjectRoot(dir) {
  const pythiaDir = join(dir, '.pythia');
  if (!existsSync(pythiaDir) || !statSync(pythiaDir).isDirectory()) return false;
  return (
    existsSync(join(pythiaDir, 'manifest.json'))
    || existsSync(join(pythiaDir, 'version.json'))
    || existsSync(join(pythiaDir, 'package.json'))
  );
}

/**
 * Project root: parent of `.pythia/` (where manifest.json / package.json live).
 * Detected by walking up from startPath — no git involved.
 */
export function projectRoot(startPath = process.cwd()) {
  let dir = startDir(startPath);
  while (true) {
    if (isPythiaProjectRoot(dir)) return normalizePath(dir);
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error('not inside a pythia project (no .pythia/manifest.json ancestor)');
}

/** Pythia workspace directory: `{projectRoot}/.pythia/`. */
export function pythiaWorkspaceDir(startPath = process.cwd()) {
  return join(projectRoot(startPath), '.pythia');
}

/**
 * Anchor for inputs link resolution (= project root, parent of `.pythia/`).
 * @deprecated name kept for inputs-core imports; use projectRoot().
 */
export function repoRoot(startPath = process.cwd()) {
  return projectRoot(startPath);
}

/** @deprecated use projectRoot */
export const workspaceRoot = projectRoot;
