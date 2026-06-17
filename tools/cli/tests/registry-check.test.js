/**
 * Unit tests: manifest registryCheck helpers (no npm).
 */
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  isRegistryCheckFresh,
  registryUpdateAvailable,
  formatRegistryLine,
  refreshRegistryCheck,
  REGISTRY_CHECK_RATE_MS,
} from '../registry-check.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { writeManifest } from '../../migrate/manifest.js';
import { initGit } from './helpers/workspace.js';
import { doInit } from '../workspace.js';
import { makeOpts } from './helpers/workspace.js';

describe('registry-check.js', () => {
  it('isRegistryCheckFresh returns true within rate limit', () => {
    const check = { checkedAt: new Date().toISOString(), latestVersion: '0.3.3' };
    expect(isRegistryCheckFresh(check)).toBe(true);
  });

  it('isRegistryCheckFresh returns false when stale', () => {
    const stale = new Date(Date.now() - REGISTRY_CHECK_RATE_MS - 1000).toISOString();
    expect(isRegistryCheckFresh({ checkedAt: stale, latestVersion: '0.3.3' })).toBe(false);
  });

  it('registryUpdateAvailable uses !== comparison', () => {
    expect(registryUpdateAvailable('0.3.2', { latestVersion: '0.3.3' })).toBe(true);
    expect(registryUpdateAvailable('0.3.2', { latestVersion: '0.3.2' })).toBe(false);
    expect(registryUpdateAvailable('0.9.0', { latestVersion: '0.10.0' })).toBe(true);
  });

  it('formatRegistryLine shows available vs up to date', () => {
    const check = { checkedAt: '2026-06-17T12:00:00.000Z', latestVersion: '0.4.0' };
    expect(formatRegistryLine('0.3.2', check)).toMatch(/0\.4\.0 available/);
    expect(formatRegistryLine('0.4.0', check)).toMatch(/up to date/);
    expect(formatRegistryLine('0.3.2', null)).toMatch(/unknown/);
  });

  it('refreshRegistryCheck with force bypasses fresh cache', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pythia-reg-force-'));
    try {
      initGit(dir);
      await doInit(makeOpts(dir));
      writeManifest(dir, {
        registryCheck: { checkedAt: new Date().toISOString(), latestVersion: '0.1.0' },
      }, false);
      const result = refreshRegistryCheck(dir, {
        force: true,
        fetchLatest: () => '88.88.88',
      });
      expect(result.latestVersion).toBe('88.88.88');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('refreshRegistryCheck without force respects fresh cache', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pythia-reg-noforce-'));
    try {
      initGit(dir);
      await doInit(makeOpts(dir));
      writeManifest(dir, {
        registryCheck: { checkedAt: new Date().toISOString(), latestVersion: '0.1.0' },
      }, false);
      const result = refreshRegistryCheck(dir, {
        fetchLatest: () => '88.88.88',
      });
      expect(result.latestVersion).toBe('0.1.0');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('refreshRegistryCheck skips fetch when cache is fresh', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pythia-reg-skip-fetch-'));
    try {
      initGit(dir);
      await doInit(makeOpts(dir));
      writeManifest(dir, {
        registryCheck: { checkedAt: new Date().toISOString(), latestVersion: '0.1.0' },
      }, false);
      const fetchLatest = vi.fn(() => '99.99.99');
      refreshRegistryCheck(dir, { fetchLatest });
      expect(fetchLatest).not.toHaveBeenCalled();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('refreshRegistryCheck returns existing when fetchLatest is null', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pythia-reg-npm-fail-'));
    try {
      initGit(dir);
      await doInit(makeOpts(dir));
      const stale = new Date(Date.now() - REGISTRY_CHECK_RATE_MS - 1000).toISOString();
      writeManifest(dir, {
        registryCheck: { checkedAt: stale, latestVersion: '0.1.0' },
      }, false);
      const before = readFileSync(join(dir, '.pythia/manifest.json'), 'utf8');
      const result = refreshRegistryCheck(dir, { fetchLatest: () => null });
      expect(result?.latestVersion).toBe('0.1.0');
      expect(readFileSync(join(dir, '.pythia/manifest.json'), 'utf8')).toBe(before);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('refreshRegistryCheck dryRun does not write manifest', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pythia-reg-dryrun-'));
    try {
      initGit(dir);
      await doInit(makeOpts(dir));
      const before = readFileSync(join(dir, '.pythia/manifest.json'), 'utf8');
      refreshRegistryCheck(dir, {
        force: true,
        dryRun: true,
        fetchLatest: () => '1.2.3',
      });
      expect(readFileSync(join(dir, '.pythia/manifest.json'), 'utf8')).toBe(before);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('refreshRegistryCheck refreshes stale cache via injected fetchLatest', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pythia-reg-stale-'));
    try {
      initGit(dir);
      await doInit(makeOpts(dir));
      const stale = new Date(Date.now() - REGISTRY_CHECK_RATE_MS - 1000).toISOString();
      writeManifest(dir, {
        registryCheck: { checkedAt: stale, latestVersion: '0.1.0' },
      }, false);
      const result = refreshRegistryCheck(dir, { fetchLatest: () => '77.77.77' });
      expect(result.latestVersion).toBe('77.77.77');
      const manifest = JSON.parse(readFileSync(join(dir, '.pythia/manifest.json'), 'utf8'));
      expect(manifest.registryCheck.latestVersion).toBe('77.77.77');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
