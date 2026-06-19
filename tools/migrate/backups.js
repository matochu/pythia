import { existsSync, mkdirSync, cpSync } from 'fs';
import { join, dirname } from 'path';

/**
 * Restore migration backup entries under targetRoot.
 * @param {string} targetRoot
 * @param {{ path: string, backupPath: string }[]} backups
 * @param {{
 *   dryRun?: boolean,
 *   warnOnMissing?: boolean,
 *   log?: (msg: string) => void,
 *   warn?: (msg: string) => void,
 * }} [opts]
 * @returns {number} entries restored (or would restore when dryRun)
 */
export function restoreFromBackups(targetRoot, backups = [], opts = {}) {
  const {
    dryRun = false,
    warnOnMissing = false,
    log = (msg) => console.log(msg),
    warn = (msg) => console.warn(msg),
  } = opts;

  let count = 0;
  for (const entry of backups) {
    const backupAbs = join(targetRoot, entry.backupPath);
    const targetAbs = join(targetRoot, entry.path);
    if (!existsSync(backupAbs)) {
      if (warnOnMissing) warn(`  [SKIP] no backup found for ${entry.path}`);
      continue;
    }
    if (dryRun) {
      log(`  [restore] ${entry.path} ← ${entry.backupPath}`);
    } else {
      mkdirSync(dirname(targetAbs), { recursive: true });
      cpSync(backupAbs, targetAbs, { force: true });
      log(`  restored: ${entry.path}`);
    }
    count += 1;
  }
  return count;
}
