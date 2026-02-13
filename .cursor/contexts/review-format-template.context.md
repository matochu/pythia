# Review Format Template

Use this structure for plan reviews (e.g. `/review-plan-feature`). Ensures consistency and enables parsing.

## Required Structure

```markdown
Review for: <Plan-Id> <Plan-Version>
Plan-Path: <PLAN_PATH>
Reviewed against: <REPO_REF>
Verdict: READY | NEEDS_REVISION

## Executive Summary

[2-3 sentence overview of the review, highlighting key findings]

## Step-by-Step Analysis

### S<number>: <Step Title>

**Status**: OK | CONCERN-LOW | CONCERN-MEDIUM | CONCERN-HIGH | BLOCKED

**For OK status**: Only status line, no Evidence/Impact needed. Skip to next step.

**For CONCERN/BLOCKED status**:
**Evidence**:
- File: `<file-path>`:<line-number> | `<symbol-name>` | `<doc-link>`
- (Code snippet or doc reference if applicable)

**Impact**: [1-2 sentences describing why this matters and what could go wrong]

**Revision hint** (optional): [Direction for change without code or solution — not solutioning]

**Questions**: [Optional: Open questions for Architect]

---

### S<number>.<subnumber>: <Substep Title>

[Same structure as above]

## Summary of Concerns

### Blocked Steps (Must Fix)
- S<number>: <Brief description>

### High Priority Concerns
- S<number>: <Brief description>

### Medium Priority Concerns
- S<number>: <Brief description>

### Low Priority Concerns
- S<number>: <Brief description>

## Recommendations for Next Iteration

[Optional: High-level guidance for next revision]
```

## Status Values

- **OK** — Step ready for implementation; no issues.
- **CONCERN-LOW** — Minor issues, suggestions, edge cases.
- **CONCERN-MEDIUM** — Should be addressed before implementation; missing details, risks.
- **CONCERN-HIGH** — Significant issues; missing critical information; high risk.
- **BLOCKED** — Critical; prevents implementation; contradictory or impossible.

## Rules

- Text-only review; no code solutions. Review only where there is clear evidence; avoid judgments without plan/code references.
- Focus on problems: reviews are for improvement and working with errors. For OK status, include only the status line and skip Evidence/Impact entirely. Provide detailed analysis only for concerns.
- For CONCERN-MEDIUM, CONCERN-HIGH, BLOCKED: provide Evidence (file path, line, symbol or doc link) and Impact.
- For CONCERN-LOW: provide Evidence and Impact (can be brief).
- For OK: only status line — no Evidence, no Impact, no "No issues found" text.
