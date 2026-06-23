# Implementation (Report) Format Specification

**File**: `reports/{plan-slug}.implementation.md`

---

## File Structure (top to bottom)

```
# header + Compatibility table    ← static, filled on first round
## Summary                        ← static, current overall summary
## Steps Executed                 ← static, updated as steps complete
## Files Changed                  ← static, updated as files change
## Commands Executed              ← static, running list of all commands
## Validation                     ← static, validation status
## Results                        ← static, current overall outcome
## Deviations                     ← static, updated when deviations occur
## Open Issues                    ← static, updated each round
## Retrospective                  ← append-only, before rounds; one I{n} block per round
## Decision Log                   ← append-only, before rounds; accumulates user choices/corrections/preferences
## Implementation Round I1        ← rounds grow downward
## Implementation Round I2
...
```

**Rule**: static sections and top-level accumulating sections come first. Round blocks are appended at the end as implementation progresses.

---

## Full Format

Metadata follows [artifact-metadata.md](artifact-metadata.md). Use artifact type `implementation-report`; do not duplicate or extend metadata fields in this format.

```markdown
# Report: {plan-slug}

## Metadata

{metadata for artifact type `implementation-report` from artifact-metadata.md}

## Plan–Implementation Compatibility

| Implementation Round | Plan Version | Date       | Result              |
|----------------------|--------------|------------|---------------------|
| I1                   | v{N}         | YYYY-MM-DD | N passed / M failed |
| I2                   | v{N+1}       | YYYY-MM-DD | N passed / M failed |

## Summary

[Current overall summary of implementation status]

## Steps Executed

- Step 1: [Brief description of what was done]
- Step 2: [Brief description of what was done]

## Files Changed

- `path/to/file1.ts` — [what changed]
- `path/to/file2.ts` — [what changed]

## Commands Executed

- `make test` — [result]
- `make build` — [result]

## Validation

[Validation commands run and their outcomes]

## Results

[Overall outcome — passed/failed, how many tests, etc.]

## Deviations

[If deviated from plan — why. "None" if no deviations.]

## Open Issues

[Any remaining issues or blockers. "None" if clean.]

---

## Retrospective

### I{n} — {YYYY-MM-DD}

- [codebase] {unexpected codebase fact, constraint, or behavior discovered}
- [tooling] {insight about build setup, test runner, framework behavior}
- [plan] {what was over/underspecified, what should have been in the plan}
- [process] {what helped or slowed down the work}
- [risk] {newly identified risk for next round}

*(Omit block entirely if no discoveries this round. Do NOT write paraphrasing of Issues or summary of what was done.)*

---

## Decision Log

- {context/condition}: {decision, correction, or preference}

*(Top-level section — user-only. Write only when explicit user input changed implementation behavior, artifact content, language/format, scope, or validation/reporting expectations. The section itself means "user"; do not prefix entries with `User:`. Omit section entirely if no user-driven decisions were captured.)*

---

## Implementation Round I1 — Plan v{N} — {YYYY-MM-DD}

### Summary
- Plan version: v{N}
- Command: `{validation command from plan}`
- Result: {N passed / M failed / build ok / etc.}

### Step Results

| Step | Status | Notes |
|------|--------|-------|
| Step 1 | done | |
| Step 2 | partial | [brief note] |
| Step 3 | failed | [brief note] |

### Issues

**[BLOCKER|PROBLEM] Step {N}: {short title}**
- Problem: {what went wrong}
- Evidence: {log line, error message, file:line, test name}
- Root cause hypothesis: {why it happened}
- Impact: {what is blocked or affected}

### Contexts consulted

- [context-name](../contexts/{name}.context.md) — what was used from this context during this round

*(Omit if no context documents were consulted)*

### Out-of-Plan Work

- [type] {what was done} → {reason} → {result}

*(Mandatory — write "none" if all work was within plan steps. Document ALL changes outside plan steps: debug scripts, config tweaks, workarounds, extra test runs. In **refinement mode** (bug fixes / follow-up by request), append new entries here; do not create a new Implementation Round.)*
```

---

## Key Rules

### Plan–Implementation Compatibility Table

- Located in the header block (after Date/Plan links)
- One row per Implementation Round — append-only, never delete rows
- **One plan version → one row**: each Plan Version (v{N}) must appear at most once; one implementation round per plan version
- **Plan Version**: the plan version active when this round was executed (can be e.g. v12, v5 — advances with review/replan)
- **Result**: short outcome (e.g. `7 passed / 1 failed`, `build ok`)

### Retrospective

- Top-level section — **before all `## Implementation Round` sections**
- One `### I{n} — {date}` block per round, appended after each run
- **Write when**: unexpected codebase facts, environment constraints, risks that materialized, something you would do differently next time
- **Do NOT write**: paraphrasing of Issues, summary of what was done
- Add only findings that are reusable outside this artifact, evidence-backed, and useful for future planning, implementation, review, audit, research, or automation
- User choices and corrections belong in `## Decision Log`, not Retrospective
- If round produced no discoveries — skip the block entirely
- Append-only — never delete previous blocks
- Suggested labels: `[codebase]`, `[tooling]`, `[plan]`, `[process]`, `[risk]`; add domain-specific labels when they make future synthesis clearer
- Mirrors `## Retrospective` in the plan file

### Decision Log

- Top-level section — **before all `## Implementation Round` sections**, after Retrospective
- For explicit user choices, corrections, artifact-placement choices, rejected/accepted directions, and durable user workflow preferences
- Not round-specific — accumulates throughout the implementation
- Write only when explicit user input changed implementation behavior or the report; omit section entirely if no user-driven decisions were captured
- Use concise bullets in the form `{context/condition}: {decision, correction, or preference}`
- The section itself means "user"; do not prefix entries with `User:`

### Implementation Round

- Appended at the **end of the file** after all previous rounds
- Never insert between existing rounds, never delete previous rounds
- One round per validation run (tests, build, etc.) when in plan execution mode
- **One plan version → at most one implementation round**: each plan version (v{N}) may appear only once in the compatibility table. Plan version can be any v{N} (e.g. v12, v5), since it advances with review/replan cycles. Refinement work (bug fixes, follow-up by request) does not create a new round — it is recorded in the last round's **Out-of-Plan Work** (see Refinement below).

### Refinement (out-of-plan follow-up)

- When the user requests **bug fixes or follow-up work** with no new plan version, the Developer works in **refinement mode**: no new `## Implementation Round I{n}` is created.
- All changes are **appended** to the **last** existing round's **Out-of-Plan Work** section (new bullet entries). Static sections (Summary, Files Changed, Commands Executed, etc.) are updated.
- Plan Version in the compatibility table stays unchanged.

### Issue Severity

- **BLOCKER**: test/build fails, cannot proceed without fix
- **PROBLEM**: partial failure, workaround possible but fix needed
