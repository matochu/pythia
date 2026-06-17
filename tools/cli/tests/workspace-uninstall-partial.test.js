/**
 * doUninstall returns 1 when rmSync fails on a managed file.
 */
import { describe, it, expect, vi } from 'vitest';
import { rmSync } from 'fs';
import { freshInstalledWorkspace } from './helpers/workspace.js';

const hoisted = vi.hoisted(() => ({
  mockRmSync: vi.fn(),
  actualRmSync: null,
}));

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal();
  hoisted.actualRmSync = actual.rmSync;
  hoisted.mockRmSync.mockImplementation(actual.rmSync);
  return {
    ...actual,
    rmSync: (...args) => hoisted.mockRmSync(...args),
  };
});

import { doUninstall } from '../workspace.js';

describe('doUninstall partial failure', () => {
  it('returns 1 when rmSync fails', async () => {
    const ws = await freshInstalledWorkspace('pythia-ws-uninstall-partial-');
    try {
      hoisted.mockRmSync.mockImplementation((path, ...args) => {
        if (typeof path === 'string' && path.endsWith('CLAUDE.md')) {
          throw Object.assign(new Error('EPERM: operation not permitted'), { code: 'EPERM' });
        }
        return hoisted.actualRmSync(path, ...args);
      });

      const code = await doUninstall({ target: ws, yes: true });
      expect(code).toBe(1);
    } finally {
      hoisted.mockRmSync.mockImplementation(hoisted.actualRmSync);
      rmSync(ws, { recursive: true, force: true });
    }
  });
});
