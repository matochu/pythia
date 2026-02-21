# Implementation Report Format Specification

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
## Developer Retrospective        ← append-only, before rounds; one I{n} block per round
## Developer Observations         ← append-only, before rounds; accumulates across all rounds
## Implementation Round I1        ← rounds grow downward
## Implementation Round I2
...
```

**Rule**: static sections and top-level accumulating sections come first. Round blocks are appended at the end as implementation progresses.

---

## Full Format

```markdown
# Implementation Report: {plan-slug}

Date: {YYYY-MM-DD}
Plan: [plans/{plan-slug}.plan.md](../plans/{plan-slug}.plan.md)
Review: [reports/{plan-slug}.review.md](./{plan-slug}.review.md)

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

## Developer Retrospective

### I{n} — {YYYY-MM-DD}

- [codebase] {unexpected codebase fact, constraint, or behavior discovered}
- [tooling] {insight about build setup, test runner, framework behavior}
- [plan] {what was over/underspecified, what should have been in the plan}
- [process] {what helped or slowed down the work}
- [risk] {newly identified risk for next round}

*(Omit block entirely if no discoveries this round. Do NOT write paraphrasing of Issues or summary of what was done.)*

---

## Developer Observations

- {observation about adjacent code, technical debt, future work candidates, architectural concerns outside current plan scope}

*(Top-level section — accumulates across all rounds. Write only when there is something concrete; omit section entirely if nothing observed.)*

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

*(Mandatory — write "none" if all work was within plan steps. Document ALL changes outside plan steps: debug scripts, config tweaks, workarounds, extra test runs.)*
```

---

## Key Rules

### Plan–Implementation Compatibility Table

- Located in the header block (after Date/Plan links)
- One row added per Implementation Round — append-only, never delete rows
- **Plan Version**: the plan version active when this round was executed
- **Result**: short outcome (e.g. `7 passed / 1 failed`, `build ok`)

### Developer Retrospective

- Top-level section — **before all `## Implementation Round` sections**
- One `### I{n} — {date}` block per round, appended after each run
- **Write when**: unexpected codebase facts, environment constraints, risks that materialized, something you would do differently next time
- **Do NOT write**: paraphrasing of Issues, summary of what was done
- If round produced no discoveries — skip the block entirely
- Append-only — never delete previous blocks
- Labels: `[codebase]`, `[tooling]`, `[plan]`, `[process]`, `[risk]`
- Mirrors `## Architect Retrospective` in the plan file

### Developer Observations

- Top-level section — **before all `## Implementation Round` sections**, after Developer Retrospective
- For observations **outside the current plan scope**: technical debt noticed, future work candidates, architectural concerns in adjacent code
- Not round-specific — accumulates throughout the implementation
- Write only when there is something concrete; omit section entirely if nothing observed
- No required labels — plain bullet list

### Implementation Round

- Appended at the **end of the file** after all previous rounds
- Never insert between existing rounds, never delete previous rounds
- One round per validation run (tests, build, etc.)

### Issue Severity

- **BLOCKER**: test/build fails, cannot proceed without fix
- **PROBLEM**: partial failure, workaround possible but fix needed
