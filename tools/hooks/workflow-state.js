/**
 * Workflow lifecycle nudge logic (single source of truth for post.js nudges).
 * Pure functions — no I/O except reading artifact files. Testable without hooks.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

export function planSlugFromBasename(base) {
  return base.replace(/\.(plan|review|implementation|audit)\.md$/, '');
}

/** plans/ or reports/ artifact → feature directory (two levels up). */
export function featureDirFromArtifact(filePath) {
  const parentName = basename(dirname(filePath));
  if (parentName === 'plans' || parentName === 'reports') {
    return dirname(dirname(filePath));
  }
  return null;
}

/** Last Verdict line in a text slice (review round block or audit). */
export function extractVerdict(content) {
  let verdict = null;
  for (const line of content.split('\n')) {
    const patterns = [
      /^Verdict:\s*(.+)$/i,
      /^\*\*Verdict\*\*:\s*(.+)$/i,
      /^-\s*\*\*Verdict\*\*:\s*(.+)$/i,
    ];
    for (const re of patterns) {
      const m = line.match(re);
      if (m) verdict = m[1].trim();
    }
  }
  if (!verdict) return null;
  return verdict.replace(/\*\*/g, '').trim();
}

/** Review file Metadata snapshot (review-format.md § Metadata). */
export function extractReviewLastStatus(content) {
  const m = content.match(/^- \*\*Last Status\*\*:\s*(.+)$/im);
  if (!m) return null;
  return m[1].replace(/\*\*/g, '').trim();
}

/** Body of the most recently appended review round (or full file if no round headers). */
export function lastReviewRoundSection(content) {
  const matches = [...content.matchAll(/^## .+ R\d+ — .+$/gm)];
  if (matches.length === 0) return content;
  return content.slice(matches[matches.length - 1].index);
}

/** Verdict for nudge routing: Metadata.Last Status, else last round Verdict line. */
export function extractReviewVerdict(content) {
  return extractReviewLastStatus(content) ?? extractVerdict(lastReviewRoundSection(content));
}

export function highImpactInLastReviewRound(content) {
  const round = lastReviewRoundSection(content);
  return (round.match(/CONCERN-HIGH|BLOCKED/g) ?? []).length;
}

export function normalizeAuditVerdict(verdict) {
  if (!verdict) return null;
  return verdict
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^needsfixes$/, 'needs-fixes');
}

export function reviewRoundCount(content) {
  return (content.match(/^## .+ R\d+ — /gm) ?? []).length;
}

export function isNewerThan(fileA, fileB) {
  if (!existsSync(fileA)) return false;
  if (!existsSync(fileB)) return true;
  return statSync(fileA).mtimeMs > statSync(fileB).mtimeMs;
}

/**
 * @param {string} filePath absolute or relative path to a workflow artifact
 * @returns {string[]} nudge messages (may be empty)
 */
export function computeWorkflowNudges(filePath) {
  if (!filePath || !existsSync(filePath)) return [];

  const base = basename(filePath);
  const featureDir = featureDirFromArtifact(filePath);
  if (!featureDir) return [];

  const slug = planSlugFromBasename(base);
  const reportsDir = join(featureDir, 'reports');
  const plansDir = join(featureDir, 'plans');
  const nudges = [];

  if (base.endsWith('.plan.md')) {
    const reviewFile = join(reportsDir, `${slug}.review.md`);
    if (!existsSync(reviewFile) || isNewerThan(filePath, reviewFile)) {
      nudges.push(
        `pythia-nudge: Plan updated (${slug}). Run /review — delegate Reviewer subagent to reports/${slug}.review.md`,
      );
    }
    return nudges;
  }

  if (base.endsWith('.review.md')) {
    const content = readFileSync(filePath, 'utf8');
    const verdict = extractReviewVerdict(content)?.toUpperCase();
    const highImpact = highImpactInLastReviewRound(content);
    const roundCount = reviewRoundCount(content);

    const planFile = join(plansDir, `${slug}.plan.md`);
    if (existsSync(planFile) && isNewerThan(planFile, filePath)) {
      nudges.push(`pythia-nudge: Plan newer than review for ${slug} — re-run /review`);
    }

    if (verdict === 'NEEDS_REVISION') {
      if (roundCount >= 2) {
        nudges.push(
          'pythia-nudge: Review still NEEDS_REVISION after 2 rounds — escalate to user; do not auto-replan without decision',
        );
      } else if (highImpact > 0) {
        nudges.push(
          'pythia-nudge: Review needs revision. Run /replan (Plan revision log), then /review',
        );
      } else {
        nudges.push(
          `pythia-nudge: Review verdict NEEDS_REVISION for ${slug} — run /replan or /review per findings`,
        );
      }
    } else if (verdict === 'READY') {
      const implFile = join(reportsDir, `${slug}.implementation.md`);
      if (!existsSync(implFile)) {
        nudges.push(
          `pythia-nudge: Review READY for ${slug}. Run /implement or /loop to delegate Developer subagent`,
        );
      }
    }
    return nudges;
  }

  if (base.endsWith('.implementation.md')) {
    const reviewFile = join(reportsDir, `${slug}.review.md`);
    if (existsSync(reviewFile)) {
      const reviewVerdict = extractReviewVerdict(readFileSync(reviewFile, 'utf8'))?.toUpperCase();
      if (reviewVerdict !== 'READY') {
        nudges.push(
          `pythia-nudge: Review for ${slug} is not READY — do not treat implementation as approved`,
        );
      }
    }

    const auditFile = join(reportsDir, `${slug}.audit.md`);
    if (!existsSync(auditFile) || isNewerThan(filePath, auditFile)) {
      nudges.push(
        `pythia-nudge: Implementation updated (${slug}). Run /audit or /loop — delegate fresh Architect audit subagent`,
      );
    }
    return nudges;
  }

  if (base.endsWith('.audit.md')) {
    const content = readFileSync(filePath, 'utf8');
    const verdict = normalizeAuditVerdict(extractVerdict(content));

    if (verdict === 'needs-fixes') {
      nudges.push(
        `pythia-nudge: Audit needs-fixes for ${slug}. Run /implement refine or /loop from fix`,
      );
    } else if (verdict === 'plan-fix') {
      nudges.push(
        `pythia-nudge: Audit plan-fix for ${slug}. Patch plan via /replan then /review`,
      );
    } else if (verdict === 're-plan') {
      nudges.push(
        'pythia-nudge: Audit re-plan — run /replan or /plan before further implementation',
      );
    } else if (verdict === 'ready') {
      nudges.push(
        `pythia-nudge: Audit ready for ${slug} — loop complete unless feature follow-ups remain`,
      );
    }
    return nudges;
  }

  return [];
}
