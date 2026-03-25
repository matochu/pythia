# Implementation Report Format Specification

**File**: `reports/{plan-slug}.implementation.md`

## Required Structure

```markdown
# Implementation Report: {plan-slug}

Date: {YYYY-MM-DD}
Plan: [plans/{plan-slug}.plan.md](../plans/{plan-slug}.plan.md)
Review: [reports/{plan-slug}.review.md](./{plan-slug}.review.md)

## Plan–Implementation Compatibility

| Implementation Round | Plan Version | Date       | Result              |
|----------------------|--------------|------------|---------------------|
| I1                   | v{N}         | YYYY-MM-DD | N passed / M failed |

## Executed Steps

- Step 1: [Brief description of what was done]
- Step 2: [Brief description of what was done]

## Files Changed

- `path/to/file1.ts` — [what changed]
- `path/to/file2.ts` — [what changed]

## Commands Executed

- `npm test` — [result]
- `npm run build` — [result]

## Results

[Overall outcome — passed/failed, how many tests, etc.]

## Deviations

[If deviated from plan — why. "None" if no deviations.]

## Open Issues

[Any remaining issues or blockers. "None" if clean.]

---

## Developer Retrospective

### I{n} — {YYYY-MM-DD}

Knowledge gained during this implementation round — about the codebase, tools, architecture, or the plan itself:

- [codebase] {insight about how something works}
- [tooling] {insight about test setup, mocks, framework behavior}
- [plan] {what was over/underspecified, what should have been in the plan}
- [process] {what helped or slowed down the work}
- [risk] {newly identified risk for next round}

"None" if no new insights.

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

For each BLOCKER or PROBLEM found during this round:

**[BLOCKER|PROBLEM] Step {N}: {short title}**
- Problem: {what went wrong}
- Evidence: {log line, error message, file:line, test name}
- Root cause hypothesis: {why it happened}
- Impact: {what is blocked or affected}

### Contexts consulted (optional)

- [context-name](../contexts/{name}.context.md) — what was used from this context during this round

*(Omit if no context documents were consulted)*

### Out-of-Plan Work (Debug)

Actions taken outside the plan steps — debugging, investigation, workarounds:

- [{file or area}] {what was tried and outcome}
- [investigation] {what was checked, what was ruled out}

"None" if all work was within plan steps.
```

> **Note**: `## Developer Retrospective` is a **top-level append-only section** — one `### I{n} — {date}` block per round, never delete previous blocks. Mirrors `## Architect Retrospective` in the plan file.

## Key Sections

### Plan–Implementation Compatibility Table

Located in the header block (after Date/Plan). One row per Implementation Round — append-only, never delete rows.

- **Implementation Round**: I1, I2, I3...
- **Plan Version**: the plan version active when this round was executed
- **Date**: date of the run
- **Result**: short summary (e.g. `7 passed / 1 failed`, `build ok`, `8 failed`)

This table gives an at-a-glance history of which plan version was tested and what happened — mirrors the Review round table in review files.

### Top-Level Sections (filled once, after first implementation attempt)

- **Executed Steps**: One line per step — what was done
- **Files Changed**: List of modified files with descriptions
- **Commands Executed**: Validation commands and results
- **Results**: Overall outcome
- **Deviations**: Any deviations from plan with explanations
- **Open Issues**: Remaining issues or blockers

### Implementation Round (appended after each run of validation commands)

Each time the Developer runs the validation command (tests, build, etc.), a new `## Implementation Round I{n}` section is **appended** to the report. Previous rounds are never deleted.

- **Summary**: Plan version + command + result
- **Step Results**: Per-step status table
- **Issues**: Structured BLOCKER/PROBLEM entries for each failure — used by Architect for replan
- **Contexts consulted** (optional): context docs referenced during this round — links to `contexts/` files
- **Out-of-Plan Work**: Debug actions, investigations, workarounds not in plan steps

### Developer Retrospective (top-level section, append-only)

Located **before** the `## Implementation Round` sections (after the header block). Mirrors `## Architect Retrospective` in the plan file.

Each round appends one block:

```markdown
### I{n} — {YYYY-MM-DD}
- [codebase] ...
- [tooling] ...
- [plan] ...
- [process] ...
- [risk] ...
```

- Keyed by `I{n} — {date}` for traceability
- Append-only — previous blocks are never deleted
- Labels: `[codebase]`, `[tooling]`, `[plan]`, `[process]`, `[risk]` — use whichever are relevant
- Read by Developer at the start of each new round (Mandatory context load in `/implement-plan-feature`)

## Round Numbering

- I1 = first validation run
- I2 = after first replan/fix cycle
- I3 = etc.
- Round number is independent of plan version — one plan version may have multiple rounds

## Issue Severity

- **BLOCKER**: Test/build fails, cannot proceed without fix
- **PROBLEM**: Partial failure, workaround possible but fix needed
- **INSIGHT**: Observation for Architect — no immediate action required
