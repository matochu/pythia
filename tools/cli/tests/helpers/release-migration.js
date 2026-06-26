import { readFileSync, writeFileSync, cpSync, mkdirSync, existsSync, mkdtempSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseSemver, sortVersions } from '../../../migrate/semver.js';
import { packageRoot } from './workspace.js';
import { pathsMdContent } from './paths-md.js';
import { versionedMigrationFromStaging, stagingMigrationPath } from './staging-migration.js';

/** Strip npm pre-release suffix (0.3.2-dev → 0.3.2) for migration semver. */
export function baseSemver(version) {
  return String(version).replace(/-.*$/, '');
}

/**
 * Release under test:
 * - If next.md exists: release = current + 0.0.1, prior = current package version
 * - If shipped {version}.md exists: release = current package version,
 *   prior = highest migration version strictly below current in assets/migrations/
 */
export function resolveReleaseMigrationVersions(root = packageRoot) {
  const raw = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
  const currentVersion = baseSemver(raw);

  // next.md present → in-progress release
  if (existsSync(join(root, 'assets/migrations/next.md'))) {
    const { major, minor, patch } = parseSemver(currentVersion);
    const releaseVersion = `${major}.${minor}.${patch + 1}`;
    return { priorVersion: currentVersion, releaseVersion, packageVersion: raw };
  }

  // Shipped migration exists — find prior from migration files
  const migrDir = join(root, 'assets/migrations');
  const versions = existsSync(migrDir)
    ? sortVersions(readdirSync(migrDir)
        .filter((f) => /^\d+\.\d+\.\d+\.md$/.test(f))
        .map((f) => f.replace('.md', '')))
    : [];
  const below = versions.filter((v) => {
    const { major, minor, patch } = parseSemver(v);
    const { major: cm, minor: cn, patch: cp } = parseSemver(currentVersion);
    return major < cm || (major === cm && minor < cn) || (major === cm && minor === cn && patch < cp);
  });
  const priorVersion = below.length ? below[below.length - 1] : currentVersion;
  return { priorVersion, releaseVersion: currentVersion, packageVersion: raw };
}

/** Returns true when there is a staging (next.md) or shipped migration to test. */
export function hasStagingNextMigration(root = packageRoot) {
  const path = stagingMigrationPath(
    baseSemver(JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version),
    root,
  );
  if (!path) return false;
  const content = readFileSync(path, 'utf8');
  return /^## Step \d/m.test(content);
}

/**
 * Tmp package root at an explicit semver (uses shipped assets/migrations/<version>.md when present).
 */
export function materializePackageAtVersion(version, root = packageRoot) {
  const fakeRoot = mkdtempSync(join(tmpdir(), 'pythia-pkg-shipped-'));
  cpSync(root, fakeRoot, {
    recursive: true,
    force: true,
    filter: (src) => !src.includes('node_modules') && !/(^|\/)\.git(\/|$)/.test(src),
  });
  const pkgPath = join(fakeRoot, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  pkg.version = version;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
  return fakeRoot;
}

/** Tmp package root: copy repo, bump to releaseVersion, write assets/migrations/<release>.md from next.md. */
export function materializeReleasePackage(releaseVersion, root = packageRoot) {
  const fakeRoot = materializePackageAtVersion(releaseVersion, root);
  writeFileSync(
    join(fakeRoot, 'assets/base/config/paths.md'),
    pathsMdContent('new'),
    'utf8',
  );
  const migrDir = join(fakeRoot, 'assets/migrations');
  mkdirSync(migrDir, { recursive: true });
  writeFileSync(
    join(migrDir, `${releaseVersion}.md`),
    versionedMigrationFromStaging(releaseVersion),
    'utf8',
  );
  return fakeRoot;
}

/**
 * Simulate pre-release .pythia: modern layout (config/) + legacy Workflow docs + manifest baseline.
 * @param {'old' | 'old-basename'} pathsVariant
 */
export function preparePythiaPreRelease(targetDir, { priorVersion, pathsVariant = 'old' }) {
  writeFileSync(
    join(targetDir, '.pythia/config/paths.md'),
    pathsMdContent(pathsVariant),
    'utf8',
  );
  const manifestPath = join(targetDir, '.pythia/manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  manifest.migratedVersion = priorVersion;
  manifest.frameworkVersion = priorVersion;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
}
