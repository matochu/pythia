/**
 * Per-workspace npm registry version check (rate-limited via manifest.registryCheck).
 */
import { execFileSync } from 'node:child_process';
import { readManifest, writeManifest } from '../migrate/manifest.js';

export const REGISTRY_CHECK_RATE_MS = 86_400_000;

export function isRegistryCheckFresh(registryCheck) {
  if (!registryCheck?.checkedAt) return false;
  return Date.now() - new Date(registryCheck.checkedAt).getTime() < REGISTRY_CHECK_RATE_MS;
}

function fetchNpmLatestVersion() {
  try {
    return execFileSync('npm', ['view', 'pythia-workspace', 'version'], {
      timeout: 10_000,
      encoding: 'utf8',
      shell: process.platform === 'win32',
    }).trim();
  } catch {
    return null;
  }
}

/**
 * @param {string} target workspace root
 * @param {{ dryRun?: boolean, force?: boolean, fetchLatest?: () => string | null }} [opts]
 *   force — skip 24h rate limit (used by `update`; `version` stays rate-limited)
 */
export function refreshRegistryCheck(target, { dryRun = false, force = false, fetchLatest } = {}) {
  const manifest = readManifest(target);
  if (!manifest) return null;

  const existing = manifest.registryCheck ?? null;
  if (!force && isRegistryCheckFresh(existing)) return existing;

  const latestVersion = (fetchLatest ?? fetchNpmLatestVersion)();
  if (!latestVersion) return existing;

  const registryCheck = {
    checkedAt: new Date().toISOString(),
    latestVersion,
  };

  if (!dryRun) {
    writeManifest(target, { registryCheck }, false);
  }

  return registryCheck;
}

export function registryUpdateAvailable(frameworkVersion, registryCheck) {
  if (!frameworkVersion || !registryCheck?.latestVersion) return false;
  return registryCheck.latestVersion !== frameworkVersion;
}

export function formatRegistryLine(frameworkVersion, registryCheck) {
  if (!registryCheck?.latestVersion) {
    return 'unknown (registry check failed or not run yet)';
  }
  const checked = registryCheck.checkedAt?.slice(0, 10) ?? 'unknown';
  if (registryUpdateAvailable(frameworkVersion, registryCheck)) {
    return `${registryCheck.latestVersion} available on npm (checked ${checked})`;
  }
  return `up to date (checked ${checked})`;
}

export function printRegistryUpdateNotice(target, frameworkVersion, registryCheck) {
  if (!registryUpdateAvailable(frameworkVersion, registryCheck)) return;
  console.log(
    `[update] newer pythia-workspace on npm: ${frameworkVersion} → ${registryCheck.latestVersion}. Run: npx pythia-workspace@latest ${target}`
  );
}
