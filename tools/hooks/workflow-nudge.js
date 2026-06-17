#!/usr/bin/env node
/**
 * Workflow-state nudges (converted from .claude/hooks/auto-review.sh + review-loop.sh).
 * Called from post.js after workflow doc edits.
 *
 * Given a file path, emits reminder messages to stderr.
 * Exit: 0 always (warnings only, never blocks).
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname } from 'node:path';

export function nudge(filePath) {
  if (!filePath || !existsSync(filePath)) return;
  const base = basename(filePath);

  // auto-review nudge: plan updated, review may be stale
  if (base.endsWith('.plan.md')) {
    const planSlug = base.replace(/\.plan\.md$/, '');
    const featureDir = dirname(dirname(filePath));
    const reviewFile = `${featureDir}/reports/${planSlug}.review.md`;

    if (!existsSync(reviewFile) || statSync(filePath).mtimeMs > statSync(reviewFile).mtimeMs) {
      console.error(`Plan updated: ${planSlug}. Run /review to delegate Reviewer subagent. Write to reports/${planSlug}.review.md`);
    }
    return;
  }

  // review-loop nudge: review needs revision, suggest replan
  if (base.endsWith('.review.md')) {
    const content = readFileSync(filePath, 'utf8');
    const verdictLine = content.split('\n').find((l) => /^Verdict:/.test(l));
    const verdict = verdictLine?.replace(/^Verdict:\s*/, '').trim();

    const highImpact = (content.match(/CONCERN-HIGH|BLOCKED/g) ?? []).length;
    const roundCount = (content.match(/^## .+ R\d+ — /gm) ?? []).length;

    if (verdict === 'NEEDS_REVISION' && highImpact > 0 && roundCount < 2) {
      console.error('Review needs revision. Run /replan to update plan (Plan revision log), then /review (max 2 loops)');
    }
  }
}

// Direct invocation: read file path from stdin event (same format as bash hooks)
if (process.argv[1] && process.argv[1].endsWith('workflow-nudge.js')) {
  const raw = readFileSync(0, 'utf8').trim();
  let filePath = null;
  try {
    const event = JSON.parse(raw);
    filePath = event?.tool_input?.file_path ?? event?.file_path ?? null;
  } catch { /* not JSON */ }
  nudge(filePath);
}
