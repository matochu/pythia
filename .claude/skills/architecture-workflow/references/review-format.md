# Review Format Specification

**File**: `reports/{plan-slug}.review.md`

## Round Header

Each round starts with:
```markdown
## {plan-slug} R{round} — YYYY-MM-DD
```

## Required Structure

```markdown
## {plan-slug} R1 — YYYY-MM-DD

Review for: {Plan-Id} {Plan-Version}
Plan-Path: plans/{plan-slug}.plan.md
Reviewed against: [REPO_REF]
Verdict: READY | NEEDS_REVISION

## Executive Summary
[2-3 sentence overview]

## Step-by-Step Analysis

### S1: {Step Title}
**Status**: OK | CONCERN-LOW | CONCERN-MEDIUM | CONCERN-HIGH | BLOCKED
**Evidence**: File: `path/to/file.ts:123` | Symbol: `functionName` | Doc: `link`
**Impact**: [1-2 sentences why this matters]
**Revision hint** (optional): [Direction without code/solution]

### S2: {Step Title}
[Same structure]

## Summary of Concerns

### Blocked Steps (Must Fix)
- S{n}: [Brief description]

### High Priority Concerns
- S{n}: [Brief description]

## Addressed by Architect
[Filled by Reviewer on next round after seeing revised plan]
- [ ] S1 addressed
- [ ] S2 addressed
```

## Key Fields

- **Verdict**: READY | NEEDS_REVISION
- **Status per step**: OK | CONCERN-LOW | CONCERN-MEDIUM | CONCERN-HIGH | BLOCKED
- **Evidence**: File paths, symbols, documentation links
- **Impact**: Why the finding matters
- **Revision hint**: Direction without specific solution (no "do X", "use Y")

## Prohibition

Never write "do X", "use Y", "rewrite Z" — only identify issues/risks/gaps.
