// State-file helpers: read/write .pythia/backups/<version>/state.json
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

export function stateDir(targetRoot, migrationVersion) {
  return join(targetRoot, '.pythia', 'backups', migrationVersion);
}

export function statePath(targetRoot, migrationVersion) {
  return join(stateDir(targetRoot, migrationVersion), 'state.json');
}

export function readState(targetRoot, migrationVersion) {
  const p = statePath(targetRoot, migrationVersion);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

export function writeState(targetRoot, data, dryRun) {
  const dir = stateDir(targetRoot, data.migrationVersion);
  const p = statePath(targetRoot, data.migrationVersion);
  if (dryRun) return;
  mkdirSync(dir, { recursive: true });
  // Write gitignore so backups are always local-only
  const gitignorePath = join(targetRoot, '.pythia', 'backups', '.gitignore');
  if (!existsSync(gitignorePath)) {
    mkdirSync(join(targetRoot, '.pythia', 'backups'), { recursive: true });
    writeFileSync(gitignorePath, '*\n', 'utf8');
  }
  writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}

// Scan all backup dirs for unresolved mixed state (llmRemaining: true).
export function findUnresolvedMixedStates(targetRoot) {
  const backupsDir = join(targetRoot, '.pythia', 'backups');
  if (!existsSync(backupsDir)) return [];
  let dirs;
  try {
    dirs = readdirSync(backupsDir).filter((d) => /^\d+\.\d+\.\d+$/.test(d));
  } catch {
    return [];
  }
  const unresolved = [];
  for (const d of dirs) {
    const state = readState(targetRoot, d);
    if (state?.llmRemaining === true) unresolved.push(state);
  }
  return unresolved;
}
