import { mkdtempSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';
import { doInit, doUpdate } from '../../workspace.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const packageRoot = resolve(__dirname, '../../../..');
export const indexJs = resolve(__dirname, '../../index.js');

export function initGit(dir) {
  spawnSync('git', ['init', dir], { encoding: 'utf8' });
  spawnSync('git', ['-C', dir, 'config', 'user.email', 'test@test.com'], { encoding: 'utf8' });
  spawnSync('git', ['-C', dir, 'config', 'user.name', 'Test'], { encoding: 'utf8' });
}

export function makeOpts(target, extra = {}) {
  return { target, packageRoot, yes: true, ...extra };
}

/** Fresh git repo with init + update applied. Caller must rmSync when done. */
export async function freshInstalledWorkspace(prefix = 'pythia-ws-') {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  initGit(dir);
  await doInit(makeOpts(dir));
  await doUpdate(makeOpts(dir));
  return dir;
}

export function runCli(args, opts = {}) {
  return spawnSync('node', [indexJs, ...args], {
    encoding: 'utf8',
    ...opts,
  });
}
