// Auto ops for the migration engine.
// All ops: apply only within .pythia/, are idempotent, back up before mutating existing files.
import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync } from 'fs';
import { join, dirname, relative, resolve, isAbsolute } from 'path';
import { createHash } from 'crypto';
import { migrateWorkflowInputs } from '../lib/inputs-core.js';

function sha256(content) {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

// Containment guard: op targets must resolve inside .pythia/ (lexical; catches `.pythia/../foo`).
function assertInProtectedZone(targetRoot, relpath) {
  const pythiaDir = resolve(targetRoot, '.pythia');
  const abs = resolve(targetRoot, relpath);
  const rel = relative(pythiaDir, abs);
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(`Op target must be inside .pythia/: ${relpath}`);
  }
}

function backup(targetRoot, relpath, backups, dryRun, migrationVersion) {
  const src = join(targetRoot, relpath);
  if (!existsSync(src)) return null;
  const content = readFileSync(src, 'utf8');
  const backupBase = migrationVersion
    ? join('.pythia', 'backups', migrationVersion)
    : join('.pythia', 'backups', '_op-level');
  const backupRel = join(backupBase, relpath);
  const backupAbs = join(targetRoot, backupRel);
  if (!dryRun) {
    mkdirSync(dirname(backupAbs), { recursive: true });
    writeFileSync(backupAbs, content, 'utf8');
  }
  const entry = { path: relpath, backupPath: backupRel, sha256: sha256(content) };
  backups.push(entry);
  return entry;
}

// Parse simple YAML frontmatter (--- ... ---)
function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { fm: null, body: content, raw: content };
  const lines = m[1].split('\n');
  const fm = {};
  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    fm[key] = val;
  }
  return { fm, body: m[2], raw: content };
}

function serializeFrontmatter(fm, body) {
  const fmLines = Object.entries(fm)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  return `---\n${fmLines}\n---\n${body}`;
}

// Op: ensure-dir
export function ensureDir(targetRoot, op, backups, dryRun, _migrationVersion) {
  const { path } = op;
  assertInProtectedZone(targetRoot, path);
  const abs = join(targetRoot, path);
  if (existsSync(abs)) return { status: 'skipped', reason: 'already exists' };
  if (!dryRun) mkdirSync(abs, { recursive: true });
  return { status: 'applied', changedPath: path };
}

// Op: write-if-missing
export function writeIfMissing(targetRoot, op, backups, dryRun, _migrationVersion) {
  const { path, content } = op;
  assertInProtectedZone(targetRoot, path);
  const abs = join(targetRoot, path);
  if (existsSync(abs)) return { status: 'skipped', reason: 'already exists' };
  if (!dryRun) {
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content, 'utf8');
  }
  return { status: 'applied', changedPath: path };
}

// Op: set-frontmatter
export function setFrontmatter(targetRoot, op, backups, dryRun, migrationVersion) {
  const { path, key, value } = op;
  assertInProtectedZone(targetRoot, path);
  const abs = join(targetRoot, path);
  if (!existsSync(abs)) throw new Error(`set-frontmatter: file not found: ${path}`);
  const content = readFileSync(abs, 'utf8');
  const { fm, body, raw } = parseFrontmatter(content);
  if (fm && fm[key] === String(value)) return { status: 'skipped', reason: 'already set' };
  backup(targetRoot, path, backups, dryRun, migrationVersion);
  const newFm = fm ? { ...fm, [key]: String(value) } : { [key]: String(value) };
  const newContent = fm ? serializeFrontmatter(newFm, body) : `---\n${key}: ${value}\n---\n${raw}`;
  if (!dryRun) writeFileSync(abs, newContent, 'utf8');
  return { status: 'applied', changedPath: path };
}

// Op: rename-frontmatter-key
export function renameFrontmatterKey(targetRoot, op, backups, dryRun, migrationVersion) {
  const { path, from, to } = op;
  assertInProtectedZone(targetRoot, path);
  const abs = join(targetRoot, path);
  if (!existsSync(abs)) throw new Error(`rename-frontmatter-key: file not found: ${path}`);
  const content = readFileSync(abs, 'utf8');
  const { fm, body } = parseFrontmatter(content);
  if (!fm || !(from in fm)) return { status: 'skipped', reason: 'key not found or already renamed' };
  if (to in fm && !(from in fm)) return { status: 'skipped', reason: 'already renamed' };
  backup(targetRoot, path, backups, dryRun, migrationVersion);
  const newFm = Object.fromEntries(Object.entries(fm).map(([k, v]) => [k === from ? to : k, v]));
  const newContent = serializeFrontmatter(newFm, body);
  if (!dryRun) writeFileSync(abs, newContent, 'utf8');
  return { status: 'applied', changedPath: path };
}

// Op: rename-file
export function renameFile(targetRoot, op, backups, dryRun, migrationVersion) {
  const { from, to } = op;
  assertInProtectedZone(targetRoot, from);
  assertInProtectedZone(targetRoot, to);
  const absFrom = join(targetRoot, from);
  const absTo = join(targetRoot, to);
  if (!existsSync(absFrom)) {
    if (existsSync(absTo)) return { status: 'skipped', reason: 'already renamed' };
    throw new Error(`rename-file: source not found: ${from}`);
  }
  backup(targetRoot, from, backups, dryRun, migrationVersion);
  if (!dryRun) {
    mkdirSync(dirname(absTo), { recursive: true });
    renameSync(absFrom, absTo);
  }
  return { status: 'applied', changedPath: to };
}

// Op: append-to-section
export function appendToSection(targetRoot, op, backups, dryRun, migrationVersion) {
  const { path, section, content } = op;
  assertInProtectedZone(targetRoot, path);
  const abs = join(targetRoot, path);
  if (!existsSync(abs)) throw new Error(`append-to-section: file not found: ${path}`);
  const fileContent = readFileSync(abs, 'utf8');
  // Find the section heading first
  const sectionRe = new RegExp(`^## ${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm');
  if (!sectionRe.test(fileContent)) throw new Error(`append-to-section: section not found: ## ${section}`);
  // Idempotent: check if content already present within the section (not just anywhere in file)
  const lines = fileContent.split('\n');
  let sectionIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (sectionRe.test(lines[i])) { sectionIdx = i; break; }
  }
  let nextSectionIdx = lines.length;
  for (let i = sectionIdx + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) { nextSectionIdx = i; break; }
  }
  const sectionBody = lines.slice(sectionIdx, nextSectionIdx).join('\n');
  if (sectionBody.includes(content.trim())) return { status: 'skipped', reason: 'content already present' };
  backup(targetRoot, path, backups, dryRun, migrationVersion);
  // Insert before next section, stripping trailing blanks first
  let insertIdx = nextSectionIdx;
  while (insertIdx > sectionIdx + 1 && lines[insertIdx - 1].trim() === '') insertIdx--;
  lines.splice(insertIdx, 0, '', content.trimEnd());
  const newContent = lines.join('\n');
  if (!dryRun) writeFileSync(abs, newContent, 'utf8');
  return { status: 'applied', changedPath: path };
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeSectionBlock(text) {
  return dedentBlock(text).trimEnd();
}

function dedentBlock(text) {
  return String(text)
    .split('\n')
    .map((l) => l.trimStart())
    .join('\n');
}

function findSectionRange(lines, section) {
  const sectionRe = new RegExp(`^## ${escapeRegex(section)}\\s*$`);
  let sectionIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (sectionRe.test(lines[i])) {
      sectionIdx = i;
      break;
    }
  }
  if (sectionIdx === -1) return null;
  let nextSectionIdx = lines.length;
  for (let i = sectionIdx + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) {
      nextSectionIdx = i;
      break;
    }
  }
  return { sectionIdx, nextSectionIdx };
}

// Op: replace-once
export function replaceOnce(targetRoot, op, backups, dryRun, migrationVersion) {
  const { path, find, replace } = op;
  assertInProtectedZone(targetRoot, path);
  const abs = join(targetRoot, path);
  if (!existsSync(abs)) throw new Error(`replace-once: file not found: ${path}`);
  const content = readFileSync(abs, 'utf8');
  const findStr = dedentBlock(String(find ?? ''));
  const replaceStr = dedentBlock(String(replace ?? ''));
  if (!content.includes(findStr)) {
    if (replaceStr && content.includes(replaceStr)) {
      return { status: 'skipped', reason: 'replacement already present' };
    }
    if (op.skip_if && content.includes(op.skip_if)) {
      return { status: 'skipped', reason: 'skip_if matched' };
    }
    throw new Error(`replace-once: pattern not found and replacement content absent: ${path}`);
  }
  backup(targetRoot, path, backups, dryRun, migrationVersion);
  const escaped = escapeRegex(findStr);
  const newContent = content.replace(new RegExp(escaped), replaceStr);
  if (!dryRun) writeFileSync(abs, newContent, 'utf8');
  return { status: 'applied', changedPath: path };
}

// Op: replace-section — replace entire ## block or insert if missing
export function replaceSection(targetRoot, op, backups, dryRun, migrationVersion) {
  const { path, section, content, after_section: afterSection } = op;
  assertInProtectedZone(targetRoot, path);
  if (!content || !String(content).trim()) {
    throw new Error('replace-section: empty content');
  }
  const abs = join(targetRoot, path);
  if (!existsSync(abs)) throw new Error(`replace-section: file not found: ${path}`);

  const rawContent = String(content).trimStart();
  const blockSource = rawContent.startsWith('##') ? rawContent : `## ${section}\n${rawContent}`;
  const desiredBlock = normalizeSectionBlock(blockSource);
  const fileContent = readFileSync(abs, 'utf8');
  const lines = fileContent.split('\n');
  const range = findSectionRange(lines, section);

  if (range) {
    const currentBlock = normalizeSectionBlock(lines.slice(range.sectionIdx, range.nextSectionIdx).join('\n'));
    if (currentBlock === desiredBlock) {
      return { status: 'skipped', reason: 'section already canonical' };
    }
    backup(targetRoot, path, backups, dryRun, migrationVersion);
    const desiredLines = desiredBlock.split('\n');
    const newLines = [
      ...lines.slice(0, range.sectionIdx),
      ...desiredLines,
      ...lines.slice(range.nextSectionIdx),
    ];
    if (!dryRun) writeFileSync(abs, newLines.join('\n'), 'utf8');
    return { status: 'applied', changedPath: path };
  }

  backup(targetRoot, path, backups, dryRun, migrationVersion);
  let prefix = fileContent.trimEnd();
  if (afterSection) {
    const afterRange = findSectionRange(lines, afterSection);
    if (!afterRange) {
      throw new Error(`replace-section: after_section not found: ## ${afterSection}`);
    }
    prefix = lines.slice(0, afterRange.nextSectionIdx).join('\n').trimEnd();
    const suffix = lines.slice(afterRange.nextSectionIdx).join('\n');
    const newContent = `${prefix}\n\n${desiredBlock}${suffix ? `\n${suffix}` : '\n'}`;
    if (!dryRun) writeFileSync(abs, newContent, 'utf8');
    return { status: 'applied', changedPath: path };
  }

  const newContent = `${prefix}\n\n${desiredBlock}\n`;
  if (!dryRun) writeFileSync(abs, newContent, 'utf8');
  return { status: 'applied', changedPath: path };
}

// Op: sync-legacy-inputs — migrate frontmatter inputs: → ## References (via inputs sync)
export function syncLegacyInputs(targetRoot, op, _backups, dryRun, _migrationVersion) {
  const globRoot = op.glob ?? '.pythia';
  assertInProtectedZone(targetRoot, globRoot);
  return migrateWorkflowInputs(targetRoot, { dryRun, globRoot });
}

const OP_MAP = {
  'ensure-dir': ensureDir,
  'write-if-missing': writeIfMissing,
  'set-frontmatter': setFrontmatter,
  'rename-frontmatter-key': renameFrontmatterKey,
  'rename-file': renameFile,
  'append-to-section': appendToSection,
  'replace-once': replaceOnce,
  'replace-section': replaceSection,
  'sync-legacy-inputs': syncLegacyInputs,
};

export function runOp(targetRoot, op, backups, dryRun, migrationVersion) {
  const fn = OP_MAP[op.op];
  if (!fn) throw new Error(`Unknown op: ${op.op}`);
  return fn(targetRoot, op, backups, dryRun, migrationVersion);
}
