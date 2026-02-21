# Review Format Specification

**File**: `reports/{plan-slug}.review.md`

---

## File Structure (top to bottom)

```
## Reviewer Observations          ← top-level, before all rounds; accumulates across all rounds
## {plan-slug} R1 — YYYY-MM-DD   ← first round block
## {plan-slug} R2 — YYYY-MM-DD   ← second round block (appended after each review)
...                               ← rounds grow downward
```

**Rule**: static sections (Reviewer Observations) come first. Round blocks are appended at the end as the review progresses.

---

## Reviewer Observations

Top-level section — **before all round blocks**. Not tied to any single round. Accumulates across all review rounds — append new entries after each round, never delete previous ones. Omit section entirely if nothing to note.

```markdown
## Reviewer Observations

- [codebase] {observation about codebase constraints or behavior noticed while reading the plan}
- [risk] {architectural risk in adjacent area, outside current review scope}
- [process] {workflow friction or pattern worth tracking across plans}
- [tooling] {tooling constraint or opportunity}
```

- Labels: `[codebase]`, `[risk]`, `[process]`, `[tooling]`
- NOT recommendations — observations only (no "do X", "use Y", "rewrite Z")
- Forward-looking signals for the retro and future plans

---

## Round Block Structure

Each review round appends one block at the end of the file:

```markdown
## {plan-slug} R{n} — YYYY-MM-DD

Review for: [{Plan-Id} {Plan-Version}](../plans/{plan-slug}.plan.md)
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

### Medium Priority Concerns
- S{n}: [Brief description]

### Low Priority Concerns
- S{n}: [Brief description]

## Addressed by Architect
[Filled by Reviewer on next round after seeing revised plan]
- [ ] S1 addressed
- [ ] S2 addressed
```

---

## Key Fields

- **Verdict**: READY | NEEDS_REVISION
- **Status per step**: OK | CONCERN-LOW | CONCERN-MEDIUM | CONCERN-HIGH | BLOCKED
- **Evidence**: File paths with line numbers, symbol names, documentation links — concrete, not vague
- **Impact**: Why the finding matters for implementation or correctness
- **Revision hint**: Direction only — no specific solution (no "do X", "use Y", "rewrite Z")

## Finding Categories

Use in parentheses after concern description:
- `gap` — plan step is incomplete or missing detail
- `risk` — identified risk that may block implementation
- `ambiguity` — unclear or contradictory specification
- `infeasible` — technically not achievable as specified
- `missing-validation` — validation command missing or not runnable
- `wrong-assumption` — plan assumes something that is not true in codebase

## Prohibition

- Never write "do X", "use Y", "rewrite Z" — only identify issues, risks, gaps
- For OK status items: 1 sentence max (e.g., "No issues found")
- Focus on problems — detailed analysis only for CONCERN-*/BLOCKED findings
