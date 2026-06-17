import { readFileSync, writeFileSync, cpSync, mkdirSync, existsSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseSemver } from '../../../migrate/semver.js';
import { packageRoot } from './workspace.js';
import { pathsMdContent } from './paths-md.js';
import { versionedMigrationFromStaging } from './staging-migration.js';

/** Strip npm pre-release suffix (0.3.2-dev → 0.3.2) for migration semver. */
export function baseSemver(version) {
  return String(version).replace(/-.*$/, '');
}

/**
 * Release under test = next patch after current package.json.
 * Prior = current package base semver (last shipped / dev baseline).
 */
export function resolveReleaseMigrationVersions(root = packageRoot) {
  const raw = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
  const priorVersion = baseSemver(raw);
  const { major, minor, patch } = parseSemver(priorVersion);
  const releaseVersion = `${major}.${minor}.${patch + 1}`;
  return { priorVersion, releaseVersion, packageVersion: raw };
}

export function hasStagingNextMigration(root = packageRoot) {
  return existsSync(join(root, 'assets/migrations/next.md'));
}

/**
 * Tmp package root: copy repo, bump to releaseVersion, write assets/migrations/<release>.md from next.md.
 */
export function materializeReleasePackage(releaseVersion, root = packageRoot) {
  const fakeRoot = mkdtempSync(join(tmpdir(), 'pythia-pkg-release-'));
  cpSync(root, fakeRoot, {
    recursive: true,
    force: true,
    filter: (src) => !src.includes('node_modules') && !/(^|\/)\.git(\/|$)/.test(src),
  });
  const pkgPath = join(fakeRoot, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  pkg.version = releaseVersion;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
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
