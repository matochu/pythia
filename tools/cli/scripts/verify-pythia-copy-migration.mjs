#!/usr/bin/env node
/**
 * Smoke: copy a real .pythia/ tree into /tmp, run update against next release package
 * (staging next.md → assets/migrations/<release>.md). Versions from package.json.
 *
 * Does NOT modify the source .pythia — only a temp copy.
 *
 * Usage (from pythia repo root):
 *   node tools/cli/scripts/verify-pythia-copy-migration.mjs
 *   node tools/cli/scripts/verify-pythia-copy-migration.mjs /path/to/.pythia
 */
import { mkdtempSync, cpSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { doUpdate, readManifest } from '../workspace.js';
import {
  resolveReleaseMigrationVersions,
  materializeReleasePackage,
  preparePythiaPreRelease,
} from '../tests/helpers/release-migration.js';
import {
  auditArtifactMetadataMigration,
  formatArtifactMetadataAudit,
} from '../tests/helpers/artifact-metadata-migration-audit.js';
import { hasHooksHardeningPaths } from '../tests/helpers/paths-md.js';
import { parseZones, zone } from '../../lib/paths.js';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const sourcePythia = resolve(process.argv[2] ?? join(packageRoot, '.pythia'));
const { priorVersion, releaseVersion } = resolveReleaseMigrationVersions();

if (!existsSync(join(sourcePythia, 'manifest.json'))) {
  console.error(`Not a .pythia directory: ${sourcePythia}`);
  process.exit(2);
}

const ws = mkdtempSync(join(tmpdir(), 'pythia-mig-verify-ws-'));
const pkg = materializeReleasePackage(releaseVersion);

console.log('=== verify-pythia-copy-migration ===');
console.log('source .pythia:', sourcePythia);
console.log('prior → release:', `${priorVersion} → ${releaseVersion}`);
console.log('tmp workspace: ', ws);

spawnSync('git', ['init', ws], { encoding: 'utf8' });
spawnSync('git', ['-C', ws, 'config', 'user.email', 'verify@test.local'], { encoding: 'utf8' });
spawnSync('git', ['-C', ws, 'config', 'user.name', 'Migration Verify'], { encoding: 'utf8' });
cpSync(sourcePythia, join(ws, '.pythia'), { recursive: true });

for (const f of ['CLAUDE.md', 'AGENTS.md']) {
  const src = join(packageRoot, f);
  if (existsSync(src)) cpSync(src, join(ws, f));
}

preparePythiaPreRelease(ws, { priorVersion });

const pathsBefore = readFileSync(join(ws, '.pythia/config/paths.md'), 'utf8');
const metadataBefore = auditArtifactMetadataMigration(ws);
console.log('\nBEFORE: legacy paths=', pathsBefore.includes('tools/checks/doc-structure.js') || pathsBefore.includes('doc-structure.js'));
console.log('BEFORE: metadata schema tagged=', `${metadataBefore.schemaTagged}/${metadataBefore.covered}`);

await doUpdate({ target: ws, packageRoot: pkg, yes: true });

const pathsAfter = readFileSync(join(ws, '.pythia/config/paths.md'), 'utf8');
const metadataAfter = auditArtifactMetadataMigration(ws);
const m = readManifest(ws);
const docs = zone(parseZones(pathsAfter), 'Workflow docs');
const ok =
  m.migratedVersion === releaseVersion &&
  hasHooksHardeningPaths(pathsAfter) &&
  !pathsAfter.includes('tools/checks/doc-structure.js') &&
  !pathsAfter.includes('doc-structure.js') &&
  pathsAfter.includes('structure.js') &&
  pathsAfter.includes('artifact-metadata.js') &&
  docs.length === 7 &&
  metadataAfter.ok &&
  metadataAfter.covered === metadataAfter.schemaTagged;

console.log('AFTER: migratedVersion=', m.migratedVersion, 'types=', docs.length);
console.log(formatArtifactMetadataAudit(metadataAfter, { before: metadataBefore }));
console.log('VERDICT:', ok ? 'PASS' : 'FAIL');
console.log('Inspect tmp workspace:', ws);
process.exit(ok ? 0 : 1);
