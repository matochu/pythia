#!/usr/bin/env node
/**
 * Structural validation for workflow docs (plan, review, implementation, audit).
 * Replaces: validate-plan.sh, validate-workflow-doc.sh, validators/validate-{review,implementation,audit}.sh
 *
 * Usage:
 *   node .pythia/runtime/checks/structure.js <file.md> [--type plan|review|implementation|audit]
 * Exit: 0 = ok, 1 = validation failed, 2 = usage/io error
 */

import { readFileSync, existsSync } from 'node:fs';
import { basename } from 'node:path';
import { parseArtifactMetadata, getArtifactField } from '../lib/metadata/parse.js';

function usage() {
  console.error('Usage: node .pythia/runtime/checks/structure.js <file.md> [--type plan|review|implementation|audit]');
}

function die(msg, code = 2) {
  console.error(msg);
  process.exit(code);
}

function inferType(file) {
  const base = basename(file);
  if (base.endsWith('.plan.md')) return 'plan';
  if (base.endsWith('.review.md')) return 'review';
  if (base.endsWith('.implementation.md')) return 'implementation';
  if (base.endsWith('.audit.md')) return 'audit';
  return null;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function lineFor(lines, pattern) {
  const idx = lines.findIndex((l) => pattern.test(l));
  return idx === -1 ? 0 : idx + 1;
}

function sectionLines(lines, header) {
  const start = lines.findIndex((l) => l === header);
  if (start === -1) return [];
  const end = lines.findIndex((l, i) => i > start && /^## /.test(l));
  return end === -1 ? lines.slice(start + 1) : lines.slice(start + 1, end);
}

function hasLine(lines, pattern) {
  return lines.some((l) => pattern.test(l));
}

function countLines(lines, pattern) {
  return lines.filter((l) => pattern.test(l)).length;
}

// ── validators ────────────────────────────────────────────────────────────────

function checkTrailingRefsPlacement(file, lines) {
  const errors = [];
  const refIdx = lines.findIndex((l) => l === '## References');
  if (refIdx === -1) return errors;
  for (let i = refIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line === '## Used by') continue;
    if (/^## /.test(line)) {
      errors.push(`${file}:${i + 1}: [structure.trailing_refs_not_last] ## References must be the last ## heading (found '${line.slice(3)}' after it)`);
      break;
    }
  }
  return errors;
}

function validatePlan(file, lines) {
  const errors = checkTrailingRefsPlacement(file, lines);

  const h1Count = countLines(lines, /^# [^#]/);
  if (h1Count !== 1) errors.push(`${file}:${lineFor(lines, /^# /)}: [plan.header.h1_count] Expected exactly one H1 title line (found ${h1Count})`);

  const metaCount = countLines(lines, /^## Metadata$/);
  if (metaCount !== 1) errors.push(`${file}:${lineFor(lines, /^## Metadata$/)}: [plan.section.metadata] Expected exactly one ## Metadata section (found ${metaCount})`);

  for (const section of ['## Metadata', '## Plan revision log', '## Navigation', '## Context', '## Goal', '## Plan']) {
    if (!hasLine(lines, new RegExp(`^${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)))
      errors.push(`${file}:0: [plan.section.required] Missing required section: ${section}`);
  }

  if (hasLine(lines, /^## .*Observations($| )/))
    errors.push(`${file}:${lineFor(lines, /^## .*Observations($| )/)}: [plan.section.observations_forbidden] Use ## Retrospective instead of Observations sections`);

  if (!hasLine(lines, /^## Risks/) && !hasLine(lines, /^## Acceptance/))
    errors.push(`${file}:0: [plan.section.required] Missing required section: ## Risks / Unknowns or ## Acceptance Criteria`);

  // Version >= v2 requires ## Retrospective (check both v1 bold and v2 list format)
  const parsedMetadata = parseArtifactMetadata(lines.join('\n'));
  const versionValue = getArtifactField(parsedMetadata, 'Version') ?? getArtifactField(parsedMetadata, 'version');
  if (versionValue) {
    const m = versionValue.match(/^v(\d+)/);
    if (m && parseInt(m[1], 10) >= 2 && !hasLine(lines, /^## Retrospective$/))
      errors.push(`${file}:0: [plan.retrospective.required] Version ${versionValue} requires ## Retrospective section`);
  }

  if (!hasLine(lines, /\| Version \| Round \| Date /))
    errors.push(`${file}:${lineFor(lines, /Plan revision log/)}: [plan.revision_log.table] Plan revision log missing table header (Version | Round | Date | ...)`);

  // Revision log Round column tokens
  let inLog = false, inTable = false;
  for (const line of lines) {
    if (line === '## Plan revision log') { inLog = true; inTable = false; continue; }
    if (inLog && /^## /.test(line) && line !== '## Plan revision log') { inLog = false; inTable = false; break; }
    if (inLog && /\| Version \| Round \| Date/.test(line)) { inTable = true; continue; }
    if (inTable && /^\|[-\s|]+\|/.test(line)) continue;
    if (inTable && line.startsWith('|')) {
      const parts = line.split('|').map((s) => s.trim());
      if (parts.length < 4) continue;
      const [, ver, rnd] = parts;
      if (ver === 'Version' && rnd === 'Round') continue;
      if (!ver && !rnd) continue;
      if (!rnd) errors.push(`${file}:0: [plan.revision_log.round_tokens] Empty Round cell for revision row`);
      else if (!/^(—|-|Manual|R\d+|I\d+|A\d+)$/.test(rnd))
        errors.push(`${file}:0: [plan.revision_log.round_tokens] Invalid Round value (use —, Manual, R{n}, I{n}, A{n}): ${rnd}`);
    }
  }

  if (!hasLine(lines, /Plan: \[Step /))
    errors.push(`${file}:${lineFor(lines, /^## Navigation$/)}: [plan.navigation.steps] Navigation missing Plan step links (Plan: [Step 1: ...] ...)`);

  // Step fields
  let inPlan = false;
  let stepTitle = '';
  let stepLines = [];

  function checkStep(title, sl) {
    if (!title) return;
    for (const field of ['**Change**', '**Where**', '**Validation**', '**Acceptance**']) {
      if (!sl.some((l) => l.includes(field)))
        errors.push(`${file}:0: [plan.step.fields] Step '${title}' missing field: ${field}`);
    }
  }

  for (const line of lines) {
    if (line === '## Plan') { inPlan = true; continue; }
    if (inPlan && /^## /.test(line)) { checkStep(stepTitle, stepLines); break; }
    if (inPlan && /^### Step \d+:/.test(line)) {
      checkStep(stepTitle, stepLines);
      stepTitle = line.replace(/^### Step \d+:\s*/, '');
      stepLines = [];
      continue;
    }
    if (inPlan && line) stepLines.push(line);
  }
  checkStep(stepTitle, stepLines);

  return errors;
}

function validateReview(file, lines) {
  const errors = checkTrailingRefsPlacement(file, lines);

  if (!hasLine(lines, /^## Navigation$/))
    errors.push(`${file}:0: [review.section.navigation] Missing ## Navigation`);

  if (hasLine(lines, /^## .*Observations($| )/))
    errors.push(`${file}:${lineFor(lines, /^## .*Observations($| )/)}: [review.section.observations_forbidden] Use ## Retrospective instead of Observations sections`);

  if (hasLine(lines, /^## Decision Log$/))
    errors.push(`${file}:${lineFor(lines, /^## Decision Log$/)}: [review.section.decision_log_forbidden] Review reports must use ## Retrospective only; Decision Log belongs to plans and implementation reports`);

  if (!hasLine(lines, /^## .+ R\d+ — \d{4}-\d{2}-\d{2}$/))
    errors.push(`${file}:0: [review.round.heading] Missing round heading matching ## {slug} R{n} — YYYY-MM-DD`);

  if (!hasLine(lines, /Review for:/))
    errors.push(`${file}:0: [review.round.review_for] Missing Review for: line`);

  if (!hasLine(lines, /\.plan\.md/))
    errors.push(`${file}:0: [review.round.review_for] Missing link to .plan.md`);

  if (!hasLine(lines, /^Verdict: (READY|NEEDS_REVISION)$/))
    errors.push(`${file}:${lineFor(lines, /Verdict:/)}: [review.round.verdict] Missing or invalid Verdict: READY | NEEDS_REVISION`);

  if (!hasLine(lines, /^## Executive Summary$/))
    errors.push(`${file}:0: [review.round.executive_summary] Missing ## Executive Summary`);

  if (!hasLine(lines, /^## Step-by-Step Analysis$/))
    errors.push(`${file}:0: [review.round.step_analysis] Missing ## Step-by-Step Analysis`);

  if (!hasLine(lines, /^### S\d+:/))
    errors.push(`${file}:0: [review.round.step_analysis] Missing at least one ### Sn: step block`);

  if (!hasLine(lines, /^## Summary of Concerns$/))
    errors.push(`${file}:0: [review.round.summary_concerns] Missing ## Summary of Concerns`);

  if (!hasLine(lines, /^## Addressed by Architect$/))
    errors.push(`${file}:0: [review.round.addressed] Missing ## Addressed by Architect`);

  // Step block Status validation
  const validStatus = /\*\*Status\*\*:\s*(OK|CONCERN-LOW|CONCERN-MEDIUM|CONCERN-HIGH|BLOCKED)/;
  let inSteps = false;
  let block = [];
  let blockHead = '';

  function checkBlock(head, bl) {
    if (!head) return;
    const joined = bl.join('\n');
    if (!joined.includes('**Status**:'))
      errors.push(`${file}:0: [review.step.status_enum] Step block missing **Status**: ${head}`);
    else if (!validStatus.test(joined))
      errors.push(`${file}:0: [review.step.status_enum] **Status** must be OK | CONCERN-LOW | CONCERN-MEDIUM | CONCERN-HIGH | BLOCKED in ${head}`);
  }

  for (const line of lines) {
    if (line === '## Step-by-Step Analysis') { inSteps = true; continue; }
    if (inSteps && line === '## Summary of Concerns') { checkBlock(blockHead, block); inSteps = false; break; }
    if (!inSteps) continue;
    if (/^### S\d+:/.test(line)) { checkBlock(blockHead, block); blockHead = line; block = []; continue; }
    if (blockHead) block.push(line);
  }
  if (inSteps) checkBlock(blockHead, block);

  return errors;
}

function validateImplementation(file, lines) {
  const errors = checkTrailingRefsPlacement(file, lines);

  if (!hasLine(lines, /^# /))
    errors.push(`${file}:1: [impl.header.h1] Missing H1`);

  if (!hasLine(lines, /^## Plan.{1,5}Implementation Compatibility$/))
    errors.push(`${file}:0: [impl.section.compatibility] Missing ## Plan–Implementation Compatibility (en dash or hyphen between Plan and Implementation)`);

  if (!hasLine(lines, /Implementation Round/) || !hasLine(lines, /Plan Version/) || !hasLine(lines, /\|.*Result/))
    errors.push(`${file}:0: [impl.section.compatibility] Compatibility table missing expected columns (Implementation Round, Plan Version, Result)`);

  for (const sec of ['## Summary', '## Steps Executed', '## Files Changed', '## Commands Executed', '## Validation', '## Results', '## Deviations', '## Open Issues']) {
    if (!hasLine(lines, new RegExp(`^${sec.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)))
      errors.push(`${file}:0: [impl.section.static] Missing ${sec}`);
  }

  if (hasLine(lines, /^## .*Observations($| )/))
    errors.push(`${file}:${lineFor(lines, /^## .*Observations($| )/)}: [impl.section.observations_forbidden] Use ## Retrospective instead of Observations sections`);

  const firstRoundIdx = lines.findIndex((l) => /^## Implementation Round I\d+/.test(l));
  if (firstRoundIdx === -1) {
    errors.push(`${file}:0: [impl.round.heading] Missing ## Implementation Round I{n}`);
  } else {
    const retroIdx = lines.findIndex((l) => l === '## Retrospective');
    if (retroIdx === -1 || retroIdx >= firstRoundIdx)
      errors.push(`${file}:0: [impl.section.retro_order] ## Retrospective must appear before first ## Implementation Round`);

    const decisionIdx = lines.findIndex((l) => l === '## Decision Log');
    if (decisionIdx !== -1 && decisionIdx >= firstRoundIdx)
      errors.push(`${file}:0: [impl.section.decision_log_order] ## Decision Log must appear before first ## Implementation Round when present`);
  }

  if (!hasLine(lines, /### Summary/))
    errors.push(`${file}:0: [impl.round.summary] Missing ### Summary in implementation round`);

  if (!hasLine(lines, /Plan version:/))
    errors.push(`${file}:0: [impl.round.plan_version] Missing Plan version: in implementation round`);

  return errors;
}

function validateAudit(file, lines) {
  const errors = checkTrailingRefsPlacement(file, lines);

  if (!hasLine(lines, /^# Architect Audit:/))
    errors.push(`${file}:1: [audit.header.h1] Missing H1 # Architect Audit:`);

  if (!hasLine(lines, /^Plan:.*\.plan\.md/))
    errors.push(`${file}:${lineFor(lines, /^Plan:/)}: [audit.header.links] Missing Plan: link to .plan.md`);

  if (!hasLine(lines, /^Implementation:.*\.implementation\.md/))
    errors.push(`${file}:${lineFor(lines, /^Implementation:/)}: [audit.header.links] Missing Implementation: link to .implementation.md`);

  if (!hasLine(lines, /^## Conformance$/))
    errors.push(`${file}:0: [audit.section.conformance] Missing ## Conformance`);

  if (!hasLine(lines, /^- Status:\s*(done|partial|no)/))
    errors.push(`${file}:0: [audit.section.conformance] Missing Conformance Status: done | partial | no`);

  if (!hasLine(lines, /^## Acceptance Criteria Check$/))
    errors.push(`${file}:0: [audit.section.acceptance] Missing ## Acceptance Criteria Check`);

  if (!hasLine(lines, /^- \[[ xX]\]/))
    errors.push(`${file}:0: [audit.section.acceptance] Missing at least one checkbox line under acceptance criteria`);

  if (!hasLine(lines, /^## Implementation quality check$/))
    errors.push(`${file}:0: [audit.section.quality] Missing ## Implementation quality check`);

  if (!hasLine(lines, /^- Status:\s*(pass|concerns|fail)/))
    errors.push(`${file}:0: [audit.section.quality] Missing quality Status: pass | concerns | fail`);

  if (!hasLine(lines, /^## Risk Re-evaluation$/))
    errors.push(`${file}:0: [audit.section.risk] Missing ## Risk Re-evaluation`);

  if (!hasLine(lines, /^## Decision$/))
    errors.push(`${file}:0: [audit.section.decision] Missing ## Decision`);

  if (!hasLine(lines, /^\s*-\s+\*\*Verdict\*\*:\s*(ready|needs-fixes|plan-fix|re-plan)/))
    errors.push(`${file}:${lineFor(lines, /Verdict/)}: [audit.section.decision] Missing - **Verdict**: ready | needs-fixes | plan-fix | re-plan`);

  // Verdict-specific rules
  const verdictLine = lines.find((l) => /^\s*-\s+\*\*Verdict\*\*:/.test(l));
  if (verdictLine) {
    const verdict = verdictLine.replace(/^\s*-\s+\*\*Verdict\*\*:\s*/, '').trim();
    const hasSuggestedCommit = hasLine(lines, /^## Suggested git commit/);
    if (verdict === 'ready') {
      if (!hasSuggestedCommit)
        errors.push(`${file}:0: [audit.git_commit_when_ready] Verdict ready requires ## Suggested git commit section`);
      else {
        const commitIdx = lines.findIndex((l) => /^## Suggested git commit/.test(l));
        const commitSection = lines.slice(commitIdx, commitIdx + 20).join('\n');
        if (!commitSection.includes('```'))
          errors.push(`${file}:0: [audit.git_commit_when_ready] Suggested git commit should include a fenced code block`);
      }
    } else if (hasSuggestedCommit) {
      errors.push(`${file}:0: [audit.git_commit_when_not_ready] Suggested git commit must be omitted when Verdict is not ready`);
    }
  }

  return errors;
}

// ── main ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
if (args.length === 0) { usage(); process.exit(2); }

let typeOverride = null;
const files = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--type') {
    typeOverride = args[++i];
  } else {
    files.push(args[i]);
  }
}

if (files.length === 0) { usage(); process.exit(2); }

const validTypes = ['plan', 'review', 'implementation', 'audit'];
if (typeOverride && !validTypes.includes(typeOverride)) die(`Unknown --type: ${typeOverride}. Valid: ${validTypes.join(', ')}`);

let failed = false;

for (const file of files) {
  if (!existsSync(file)) die(`${file}:0: [io.missing_file] File not found`, 2);

  const type = typeOverride ?? inferType(file);
  if (!type) die(`${file}:0: [io.unknown_type] Cannot infer type from name; use --type (got suffix: ${basename(file)})`, 2);

  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');

  const errors = type === 'plan' ? validatePlan(file, lines)
    : type === 'review' ? validateReview(file, lines)
    : type === 'implementation' ? validateImplementation(file, lines)
    : validateAudit(file, lines);

  for (const e of errors) console.error(e);
  if (errors.length > 0) {
    console.error(`${file}:0: [${type}.summary] Validation failed with ${errors.length} error(s).`);
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
