import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, cpSync, readdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';

export interface VersionJson {
  frameworkVersion: string;
  installedAt: string;
  surfaces: string[];
  generated: Record<string, string>;
}

export interface WorkspaceOptions {
  target: string;
  dryRun: boolean;
  packageRoot: string;
}

export function isWorkspace(target: string): boolean {
  try {
    const versionPath = join(target, '.pythia', 'version.json');
    if (!existsSync(versionPath)) return false;
    JSON.parse(readFileSync(versionPath, 'utf8'));
    return true;
  } catch {
    return false;
  }
}

export function sha256(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

function readVersionJson(target: string): VersionJson | null {
  try {
    const versionPath = join(target, '.pythia', 'version.json');
    if (!existsSync(versionPath)) return null;
    return JSON.parse(readFileSync(versionPath, 'utf8')) as VersionJson;
  } catch {
    return null;
  }
}

function readPackageVersion(packageRoot: string): string {
  const pkgPath = join(packageRoot, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  if (!pkg.version) throw new Error('package.json has no version field');
  return pkg.version as string;
}

function renderInstructions(source: string, tool: string, skillsPath: string): string {
  return source.replace(/\{tool\}/g, tool).replace(/\{skillsPath\}/g, skillsPath);
}

function seedIfMissing(target: string, relpath: string, content: string, dryRun: boolean): void {
  const dest = join(target, relpath);
  if (existsSync(dest)) return;
  if (dryRun) {
    console.log(`  [seed] ${relpath}`);
    return;
  }
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, content, 'utf8');
  console.log(`  seeded: ${relpath}`);
}

function writeManaged(
  target: string,
  relpath: string,
  content: string,
  existingManifest: Record<string, string>,
  dryRun: boolean,
): string {
  const dest = join(target, relpath);
  const newHash = sha256(content);
  const recordedHash = existingManifest[relpath];

  if (existsSync(dest)) {
    const currentContent = readFileSync(dest, 'utf8');
    const currentHash = sha256(currentContent);
    const isModified = !recordedHash || currentHash !== recordedHash;

    if (isModified) {
      if (dryRun) {
        console.log(`  [backup+overwrite] ${relpath} (local modifications detected)`);
      } else {
        writeFileSync(dest + '.bak', currentContent, 'utf8');
        writeFileSync(dest, content, 'utf8');
        console.log(`  backed up and refreshed: ${relpath}`);
      }
    } else {
      if (dryRun) {
        console.log(`  [refresh] ${relpath}`);
      } else {
        writeFileSync(dest, content, 'utf8');
        console.log(`  refreshed: ${relpath}`);
      }
    }
  } else {
    if (dryRun) {
      console.log(`  [write] ${relpath}`);
    } else {
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, content, 'utf8');
      console.log(`  wrote: ${relpath}`);
    }
  }

  return newHash;
}

function installSkills(packageRoot: string, target: string, surfaces: string[], dryRun: boolean): void {
  const skillsSource = join(packageRoot, 'skills');
  if (!existsSync(skillsSource)) {
    throw new Error(`skills/ not found at ${skillsSource}`);
  }

  for (const surface of surfaces) {
    const dest = join(target, surface);
    if (dryRun) {
      console.log(`  [install skills] ${surface}`);
    } else {
      mkdirSync(dest, { recursive: true });
      cpSync(skillsSource, dest, { recursive: true, force: true });
      console.log(`  installed skills → ${surface}`);
    }
  }
}

function pruneSkills(packageRoot: string, target: string, surfaces: string[], dryRun: boolean): void {
  const skillsSource = join(packageRoot, 'skills');
  if (!existsSync(skillsSource)) return;

  const sourceSkills = new Set(readdirSync(skillsSource));

  for (const surface of surfaces) {
    const dest = join(target, surface);
    if (!existsSync(dest)) continue;
    for (const entry of readdirSync(dest)) {
      if (!sourceSkills.has(entry)) {
        const entryPath = join(dest, entry);
        if (dryRun) {
          console.log(`  [prune] ${surface}/${entry}`);
        } else {
          rmSync(entryPath, { recursive: true, force: true });
          console.log(`  pruned: ${surface}/${entry}`);
        }
      }
    }
  }
}

function writeVersionJson(target: string, data: VersionJson, dryRun: boolean): void {
  const versionPath = join(target, '.pythia', 'version.json');
  if (dryRun) {
    console.log(`  [write] .pythia/version.json`);
    return;
  }
  mkdirSync(dirname(versionPath), { recursive: true });
  writeFileSync(versionPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  wrote: .pythia/version.json`);
}

const SURFACES = ['.claude/skills', '.agents/skills'];

const SUBSTITUTIONS: Array<{ file: string; tool: string; skillsPath: string }> = [
  { file: 'AGENTS.md', tool: 'Codex', skillsPath: '.agents/skills' },
  { file: 'CLAUDE.md', tool: 'Claude Code', skillsPath: '.claude/skills' },
];

export function doInit(opts: WorkspaceOptions): void {
  const { target, dryRun, packageRoot } = opts;
  const assetsDir = join(packageRoot, 'assets');
  if (!existsSync(assetsDir)) throw new Error(`assets/ not found at ${assetsDir}`);
  if (!existsSync(join(packageRoot, 'skills'))) throw new Error(`skills/ not found at ${join(packageRoot, 'skills')}`);

  const instructionSource = readFileSync(join(assetsDir, 'instructions.md'), 'utf8');
  const frameworkVersion = readPackageVersion(packageRoot);

  console.log(`[init] target: ${target}`);

  // Seed base .pythia files
  const baseDir = join(assetsDir, 'base');
  seedIfMissing(target, '.pythia/config.md', readFileSync(join(baseDir, 'config.md'), 'utf8'), dryRun);
  seedIfMissing(target, '.pythia/README.md', readFileSync(join(baseDir, 'README.md'), 'utf8'), dryRun);
  seedIfMissing(target, '.pythia/workflows/.gitkeep', '', dryRun);

  // Render and write instruction files
  const manifest: Record<string, string> = {};
  for (const sub of SUBSTITUTIONS) {
    const content = renderInstructions(instructionSource, sub.tool, sub.skillsPath);
    const hash = writeManaged(target, sub.file, content, {}, dryRun);
    if (!dryRun) manifest[sub.file] = hash;
    else manifest[sub.file] = sha256(renderInstructions(instructionSource, sub.tool, sub.skillsPath));
  }

  // Install skills
  installSkills(packageRoot, target, SURFACES, dryRun);

  // Write version stamp
  const versionData: VersionJson = {
    frameworkVersion,
    installedAt: new Date().toISOString(),
    surfaces: SURFACES,
    generated: manifest,
  };
  writeVersionJson(target, versionData, dryRun);

  console.log(`[init] done${dryRun ? ' (dry-run)' : ''}`);
}

export function doUpdate(opts: WorkspaceOptions): void {
  const { target, dryRun, packageRoot } = opts;
  const assetsDir = join(packageRoot, 'assets');
  if (!existsSync(assetsDir)) throw new Error(`assets/ not found at ${assetsDir}`);
  if (!existsSync(join(packageRoot, 'skills'))) throw new Error(`skills/ not found at ${join(packageRoot, 'skills')}`);

  const instructionSource = readFileSync(join(assetsDir, 'instructions.md'), 'utf8');
  const frameworkVersion = readPackageVersion(packageRoot);
  const existing = readVersionJson(target);
  const existingManifest: Record<string, string> = existing?.generated ?? {};

  console.log(`[update] target: ${target}`);

  // Render and write instruction files
  const manifest: Record<string, string> = {};
  for (const sub of SUBSTITUTIONS) {
    const content = renderInstructions(instructionSource, sub.tool, sub.skillsPath);
    const hash = writeManaged(target, sub.file, content, existingManifest, dryRun);
    manifest[sub.file] = hash;
  }

  // Prune and reinstall skills
  pruneSkills(packageRoot, target, SURFACES, dryRun);
  installSkills(packageRoot, target, SURFACES, dryRun);

  // Write version stamp
  const versionData: VersionJson = {
    frameworkVersion,
    installedAt: new Date().toISOString(),
    surfaces: SURFACES,
    generated: manifest,
  };
  writeVersionJson(target, versionData, dryRun);

  console.log(`[update] done${dryRun ? ' (dry-run)' : ''}`);
}
