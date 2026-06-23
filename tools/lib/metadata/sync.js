import { readFileSync, writeFileSync } from 'node:fs';
import { parseArtifactMetadata, getArtifactField } from './parse.js';
import { inferArtifactKind } from './schema.js';

// ── Review round parsing ────────────────────────────────────────────────────

function parseReviewRounds(content) {
  const rounds = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    // ## {anything} R{n} — YYYY-MM-DD
    const headingMatch = lines[i].match(/^## .+\s+(R(\d+))\s+—\s+\d{4}-\d{2}-\d{2}/);
    if (!headingMatch) continue;
    const round = headingMatch[1]; // e.g. "R2"
    const n = parseInt(headingMatch[2], 10);
    let verdict = null;
    let planVersion = null;
    for (let j = i + 1; j < lines.length && j < i + 6; j++) {
      if (/^## /.test(lines[j])) break;
      const vm = lines[j].match(/^Verdict:\s*(READY|NEEDS_REVISION)\s*$/);
      if (vm) verdict = vm[1];
      // Review for: [Id Version](../plans/...)  OR  Review for: [Id v3](...)
      const pm = lines[j].match(/^Review for:.*\]\(.*\)\s*$/) || lines[j].match(/^Review for:/);
      if (pm) {
        const versionMatch = lines[j].match(/\[.*?\s+(v\d+)\]/);
        if (versionMatch) planVersion = versionMatch[1];
      }
    }
    if (verdict) rounds.push({ round, n, verdict, planVersion });
  }
  return rounds;
}

// ── Plan revision log parsing ───────────────────────────────────────────────

function parsePlanRevisionLog(content) {
  const lines = content.split('\n');
  let inTable = false;
  let lastRow = null;
  for (const line of lines) {
    if (/^\|\s*Version\s*\|\s*Round\s*\|/.test(line)) { inTable = true; continue; }
    if (!inTable) continue;
    if (/^\|\s*[-:]+/.test(line)) continue;
    if (!/^\|/.test(line)) { inTable = false; continue; }
    const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
    if (cells.length >= 2 && /^v\d+$/.test(cells[0])) {
      lastRow = {
        version: cells[0],
        round: cells[1] || null,
      };
    }
  }
  return lastRow;
}

// ── Implementation compatibility table parsing ──────────────────────────────

function parseImplTable(content) {
  const lines = content.split('\n');
  let inTable = false;
  let lastRow = null;
  for (const line of lines) {
    if (/^\|\s*Implementation Round/.test(line)) { inTable = true; continue; }
    if (!inTable) continue;
    if (/^\|\s*[-:]+/.test(line)) continue; // separator row
    if (!/^\|/.test(line)) { inTable = false; continue; }
    const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
    if (cells.length >= 2) {
      const roundMatch = cells[0].match(/^(I\d+)$/);
      const versionMatch = cells[1].match(/^(v\d+)$/);
      if (roundMatch) lastRow = {
        round: roundMatch[1],
        planVersion: versionMatch ? versionMatch[1] : null,
        result: normalizeImplementationResult(cells[3] ?? ''),
      };
    }
  }
  return lastRow;
}

function normalizeImplementationResult(value) {
  if (/blocked/i.test(value)) return 'blocked';
  if (/\bfail(?:ed|ure|ures|ing)?\b/i.test(value)) return 'failed';
  if (/partial|skipped|incomplete/i.test(value)) return 'partial';
  if (value) return 'implemented';
  return null;
}

// ── Audit round parsing ─────────────────────────────────────────────────────

function parseAuditRounds(content) {
  const lines = content.split('\n');

  // Multi-round: ## Audit Round A{n} — YYYY-MM-DD  (one per round block)
  const multiRound = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^## Audit\s+Round\s+(A(\d+))/i);
    if (!m) continue;
    const round = m[1].toUpperCase();
    const n = parseInt(m[2], 10);
    // search until next Audit Round heading (inner ## headings like ## Decision A1 are allowed)
    let verdict = null;
    for (let j = i + 1; j < lines.length; j++) {
      if (/^## Audit\s+Round/i.test(lines[j])) break;
      const vm = lines[j].match(/^-\s+\*\*Verdict\*\*:\s*(.+)$/);
      if (vm) { verdict = vm[1].trim(); break; }
    }
    if (verdict) multiRound.push({ round, n, verdict });
  }
  if (multiRound.length > 0) return multiRound;

  // Single-round: ## Decision → - **Verdict**: {value}
  const decisionIdx = lines.findLastIndex((l) => l === '## Decision');
  if (decisionIdx !== -1) {
    for (let j = decisionIdx + 1; j < lines.length; j++) {
      if (/^## /.test(lines[j])) break;
      const vm = lines[j].match(/^-\s+\*\*Verdict\*\*:\s*(.+)$/);
      if (vm) return [{ round: 'A1', n: 1, verdict: vm[1].trim() }];
    }
  }

  return [];
}

// ── Helper: get field from parsed (supports both v1 and v2 key names) ───────

function getField(parsed, ...keys) {
  for (const k of keys) {
    const v = getArtifactField(parsed, k);
    if (v) return v;
  }
  return null;
}

// ── Core sync ───────────────────────────────────────────────────────────────

export function computeMetadataSync(file, content) {
  const parsed = parseArtifactMetadata(content);
  if (!parsed.found) return null;

  // Use suffix-first kind inference (fixes retro regression)
  const artifact = inferArtifactKind(file);
  const updates = {};

  if (artifact === 'plan') {
    const row = parsePlanRevisionLog(content);
    if (!row) return null;
    // v2: sync 'version' (lowercase), NOT 'Version'
    // v2: no 'round' in plan metadata — plan round lives only in revision log body
    const versionKey = parsed.fields.has('version') ? 'version' : 'Version';
    const currentVersion = getField(parsed, 'version', 'Version');
    if (row.version && currentVersion !== row.version) updates[versionKey] = row.version;
  } else if (artifact === 'review') {
    const rounds = parseReviewRounds(content);
    if (!rounds.length) return null;
    const latest = rounds.reduce((a, b) => (b.n > a.n ? b : a));
    // v2: lowercase keys
    const roundKey = parsed.fields.has('round') ? 'round' : 'Round';
    const verdictKey = parsed.fields.has('verdict') ? 'verdict' : 'Verdict';
    const pvKey = parsed.fields.has('plan_version') ? 'plan_version' : 'Plan-Version';
    updates[roundKey] = latest.round;
    updates[verdictKey] = latest.verdict;
    if (latest.planVersion) updates[pvKey] = latest.planVersion;
  } else if (artifact === 'implementation-report') {
    const row = parseImplTable(content);
    if (!row) return null;
    const roundKey = parsed.fields.has('round') ? 'round' : 'Round';
    const pvKey = parsed.fields.has('plan_version') ? 'plan_version' : 'Plan-Version';
    const resultKey = parsed.fields.has('result') ? 'result' : 'Result';
    updates[roundKey] = row.round;
    if (row.planVersion) updates[pvKey] = row.planVersion;
    if (row.result) updates[resultKey] = row.result;
  } else if (artifact === 'audit-report') {
    const rounds = parseAuditRounds(content);
    if (!rounds.length) return null;
    const latest = rounds.reduce((a, b) => (b.n > a.n ? b : a));
    const roundKey = parsed.fields.has('round') ? 'round' : 'Round';
    const verdictKey = parsed.fields.has('verdict') ? 'verdict' : 'Verdict';
    updates[roundKey] = latest.round;
    updates[verdictKey] = latest.verdict;
  } else {
    return null;
  }

  // Check if any field actually changed
  const changed = Object.entries(updates).filter(([k, v]) => getArtifactField(parsed, k) !== v);
  if (!changed.length) return null;

  return { artifact, updates, changed: changed.map(([k]) => k) };
}

export function applyMetadataSync(content, updates) {
  const parsed = parseArtifactMetadata(content);
  if (!parsed.found) return content;

  const lines = content.split('\n');
  const result = [...lines];

  // Separate in-place replacements (stable indices) from insertions.
  const inserts = [];
  for (const [key, newValue] of Object.entries(updates)) {
    const existing = parsed.fields.get(key);
    if (existing) {
      if (existing.format === 'v2') {
        result[existing.line - 1] = `- ${key}: ${newValue}`;
      } else {
        result[existing.line - 1] = `- **${key}**: ${newValue}`;
      }
    } else {
      inserts.push([key, newValue]);
    }
  }

  // Apply insertions in reverse index order so earlier splices don't shift later positions.
  if (inserts.length) {
    const lastField = parsed.entries.at(-1);
    const insertAt = lastField ? lastField.line : parsed.startLine;
    const formatField = parsed.format === 'v1'
      ? ([key, value]) => `- **${key}**: ${value}`
      : ([key, value]) => `- ${key}: ${value}`;
    // All new fields go to the same position; insert in reverse to preserve order.
    for (let i = inserts.length - 1; i >= 0; i--) {
      result.splice(insertAt, 0, formatField(inserts[i]));
    }
  }

  return result.join('\n');
}

export function syncMetadataFile(file) {
  const content = readFileSync(file, 'utf8');
  const sync = computeMetadataSync(file, content);
  if (!sync) return { changed: false };

  const updated = applyMetadataSync(content, sync.updates);
  writeFileSync(file, updated, 'utf8');
  return { changed: true, fields: sync.changed, artifact: sync.artifact };
}

// ── CLI entrypoint ──────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const file = args[0];
  if (!file) {
    console.error('Usage: node metadata-sync.js <file.md>');
    process.exit(2);
  }
  const result = syncMetadataFile(file);
  if (result.changed) {
    console.log(`[metadata-sync] ${file}: synced ${result.fields.join(', ')} (${result.artifact})`);
  }
}

const isMain = /[/\\]sync\.js$/.test(process.argv[1] ?? '');
if (isMain) main();
