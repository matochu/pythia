import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { isPythiaManagedHookEntry } from './hook-detect.js';

/**
 * Merge a flat hooks.json template (Codex/Cursor) into an existing host config.
 * @param {{
 *   targetPath: string,
 *   templatePath: string,
 *   hooksAbsDir: string,
 *   dryRun?: boolean,
 *   logLabel: string,
 *   defaultDoc?: object,
 * }} opts
 * @returns {boolean} false when template missing
 */
export function mergeHooksJson({
  targetPath,
  templatePath,
  hooksAbsDir,
  dryRun = false,
  logLabel,
  defaultDoc = {},
}) {
  if (!existsSync(templatePath)) return false;

  const template = readFileSync(templatePath, 'utf8').replace(/{{HOOKS_DIR}}/g, hooksAbsDir);
  const incoming = JSON.parse(template);

  let existing = { ...defaultDoc };
  if (existsSync(targetPath)) {
    try {
      existing = JSON.parse(readFileSync(targetPath, 'utf8'));
    } catch {
      /* malformed */
    }
  }
  if (!existing.hooks) existing.hooks = {};

  for (const [event, entries] of Object.entries(incoming.hooks ?? {})) {
    if (!existing.hooks[event]) existing.hooks[event] = [];
    existing.hooks[event] = existing.hooks[event].filter((h) => !isPythiaManagedHookEntry(h));
    for (const entry of entries) {
      existing.hooks[event].push({ ...entry, _managed: 'pythia' });
    }
  }

  if (!dryRun) {
    mkdirSync(dirname(targetPath), { recursive: true });
    writeFileSync(targetPath, JSON.stringify(existing, null, 2), 'utf8');
    console.log(`  merged hooks → ${logLabel}`);
  }
  return true;
}
