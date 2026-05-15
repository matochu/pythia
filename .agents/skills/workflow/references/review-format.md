# Review Format Specification

**File**: `reports/{plan-slug}.review.md`

---

## File Structure (top to bottom)

```
## Metadata                       ← file-level current snapshot; updated every round
## Navigation                     ← updated after each round; links to all rounds
## Retrospective                  ← top-level, before all rounds; accumulates across all rounds
## {plan-slug} R1 — YYYY-MM-DD   ← first round block
## {plan-slug} R2 — YYYY-MM-DD   ← second round block (appended after each review)
...                               ← rounds grow downward
```

**Rule**: `Metadata`, `Navigation`, and `Retrospective` come first. Round blocks are appended at the end as the review progresses.

---

## Metadata

Top-level section at the very beginning of the file. This is the current snapshot of the review artifact, not a history log.

```markdown
## Metadata

- **Plan**: [plans/{plan-slug}.plan.md](../plans/{plan-slug}.plan.md)
- **Plan Version**: v{plan-version}
- **Last Status**: {READY | NEEDS_REVISION}
- **Last Review Round**: R{round}
```

- Create this section if the file is new
- Update it on every new review round
- `Plan Version` = the version of the plan reviewed in the current round
- `Last Status` = the verdict of the most recently appended review round
- `Last Review Round` = the most recently appended round identifier
- Keep this section file-level only; do not duplicate it inside round blocks

---

## Navigation

Top-level section at the very beginning of the file. Updated after each round by appending a new entry.

```markdown
## Navigation

- [Retrospective](#retrospective)
- Rounds: [R1 — YYYY-MM-DD — NEEDS_REVISION](#plan-slug-r1--yyyy-mm-dd) · [R2 — YYYY-MM-DD — READY](#plan-slug-r2--yyyy-mm-dd) · ...
```

- One line per category; Rounds line grows with each new round
- Include verdict in each round link so LLM can scan without opening rounds
- Anchor format: lowercase, spaces→hyphens, special chars removed (e.g. `## 4-wamr R1 — 2026-02-20` → `#4-wamr-r1--2026-02-20`)

---

## Retrospective

Top-level section — **before all round blocks**. Not tied to any single round. Accumulates across all review rounds — append new entries after each round, never delete previous ones. Omit section entirely if nothing to note.

```markdown
## Retrospective

- [codebase] {retrospective signal about codebase constraints or behavior noticed while reading the plan}
- [risk] {architectural risk in adjacent area, outside current review scope}
- [process] {workflow friction or pattern worth tracking across plans}
- [tooling] {tooling constraint or opportunity}
```

- Suggested labels: `[codebase]`, `[risk]`, `[process]`, `[tooling]`; add domain-specific labels when they make future synthesis clearer
- NOT recommendations — retrospective signals only (no "do X", "use Y", "rewrite Z")
- Add only findings that are reusable outside this review, evidence-backed, and useful for future planning, implementation, review, audit, research, or automation
- Do not add concern restatements, review recommendations, completed work, or user decisions
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

- **Metadata.Plan**: canonical link to the current plan artifact
- **Metadata.Plan Version**: latest plan version reviewed by this file
- **Metadata.Last Status**: current top-level verdict snapshot for the file
- **Metadata.Last Review Round**: latest review round appended to this file
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
