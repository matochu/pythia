import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * True when a hook entry is owned by pythia (managed marker or runtime hooks path in command/args).
 * Matches install/uninstall filtering — inspects command/args only, not arbitrary JSON substrings.
 */
export function isPythiaManagedHook(h) {
  if (!h || typeof h !== 'object') return false;
  if (h._managed === 'pythia' || h._managed === 'pythia-managed') return true;
  const cmdParts = [];
  if (h.command != null) cmdParts.push(String(h.command));
  if (Array.isArray(h.args)) cmdParts.push(...h.args.map(String));
  return cmdParts.some((p) => p.includes('.pythia/runtime/hooks'));
}

/** Event entry may be flat or Claude-style `{ hooks: [...] }`. */
export function isPythiaManagedHookEntry(entry) {
  if (isPythiaManagedHook(entry)) return true;
  if (Array.isArray(entry?.hooks)) {
    return entry.hooks.some((inner) => isPythiaManagedHook(inner));
  }
  return false;
}

/** True when a host hooks JSON file contains at least one pythia-managed entry. */
export function hooksFileHasPythiaManaged(target, relpath) {
  const abs = join(target, relpath);
  if (!existsSync(abs)) return false;
  let data;
  try {
    data = JSON.parse(readFileSync(abs, 'utf8'));
  } catch {
    return false;
  }
  if (!data?.hooks) return false;
  for (const entries of Object.values(data.hooks)) {
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      if (isPythiaManagedHookEntry(entry)) return true;
    }
  }
  return false;
}
