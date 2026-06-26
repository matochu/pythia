import { existsSync, readdirSync, cpSync } from 'fs';
import { join } from 'path';

/**
 * Restore a workspace from a single pre-update snapshot directory.
 * The snapshot mirrors the workspace layout (`.pythia/` data + managed surfaces like
 * `.claude`, `.agents`, `.cursor`, `CLAUDE.md`); runtime is excluded (regenerable).
 * Restoring copies each top-level entry back over the target.
 *
 * @param {string} targetRoot
 * @param {string} relBackupDir  e.g. `.pythia/backups/pre-update-<stamp>`
 * @param {{ dryRun?: boolean, log?: (msg: string) => void }} [opts]
 * @returns {number} entries restored (or would restore when dryRun)
 */
export function restoreFromPreUpdateBackup(targetRoot, relBackupDir, opts = {}) {
  const { dryRun = false, log = (msg) => console.log(msg) } = opts;
  const backupDir = join(targetRoot, relBackupDir);
  if (!existsSync(backupDir)) {
    throw new Error(`pre-update backup not found: ${relBackupDir}`);
  }

  let count = 0;
  for (const entry of readdirSync(backupDir)) {
    const src = join(backupDir, entry);
    const dst = join(targetRoot, entry);
    if (dryRun) {
      log(`  [restore] ${entry}`);
    } else {
      cpSync(src, dst, { recursive: true, force: true });
      log(`  restored: ${entry}`);
    }
    count += 1;
  }
  return count;
}
