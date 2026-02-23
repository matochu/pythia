# Plan Format Specification

**File**: `plans/{plan-slug}.plan.md`

## File Structure (top to bottom)

```
# header (Metadata, Contexts, Plan revision log)   ← static metadata
## Navigation                                       ← updated on every plan/replan; links to all steps
## Architect Retrospective                          ← append-only, one v{N} block per replan
## Architect Observations                           ← append-only, accumulates across replans
## Context / Goal / Plan / Risks / Acceptance       ← plan body (steps grow downward)
```

**Rule**: metadata and accumulating sections (Navigation, Retrospective, Observations) come before the plan body. New steps are appended at the end of `## Plan`.

---

## Required Structure

```markdown
# Plan {Plan-Id}: {Title}

## Metadata
- **Plan-Id**: {plan-slug}
- **Plan-Version**: v1 (or v2, v3...)
- **Branch**: {git-branch-name}
- **Last review round**: [reports/{plan-slug}.review.md → ## {plan-slug} R{n} — YYYY-MM-DD](../reports/{plan-slug}.review.md#plan-slug-rn--yyyy-mm-dd) (or "Initial plan — no review yet")
- **Implementation report**: [reports/{plan-slug}.implementation.md](../reports/{plan-slug}.implementation.md) (omit until implementation starts)

## Contexts
- [context-name](../contexts/{name}.context.md) — what was used from this context

*(Omit section if no contexts were consulted)*

## Plan revision log

| Version | Round | Date       | Changed Steps                    | Summary                                     |
|---------|-------|------------|----------------------------------|---------------------------------------------|
| v1      | —     | YYYY-MM-DD | Steps 1–N (initial)              | Initial plan                                |
| v2      | R1    | YYYY-MM-DD | Step 3 amended, Step 4 added     | Short description of what changed and why   |

## Navigation

- [Architect Retrospective](#architect-retrospective) · [Architect Observations](#architect-observations)
- [Context](#context) · [Goal](#goal)
- Plan: [Step 1: {Title}](#step-1-title) · [Step 2: {Title}](#step-2-title) · ...
- [Risks / Unknowns](#risks--unknowns) · [Acceptance Criteria](#acceptance-criteria)

*(Updated by `/plan-feature` on creation and by `/replan-feature` when steps are added or amended.)*

## Architect Retrospective

### v{N} — {round-ref} — {date}

- [plan] {insight about plan structure, scope, or gaps}
- [codebase] {insight about codebase behavior or constraints}
- [process] {what complicated this replan}
- [risk] {newly identified risk for next round}

*(Top-level append-only section — one `### v{N}` block per replan cycle, added by `/replan-feature`. Omit section until first replan. Never delete previous blocks.)*

## Architect Observations

- {observation about adjacent code, technical debt, future work candidates, cross-plan patterns}

*(Top-level section — accumulates across all replan cycles. Added by `/replan-feature`. Omit section if nothing observed. No required labels.)*

## Context
[Brief, facts from repo/docs]

## Goal
[What we're building]

## Plan

### Step 1: {Step Title}

**Status**: {done | partial | skipped | not started}

- **Change**: What exactly changes
- **Where**: Files/modules
- **Validation**: How to verify (command/test/manual check)
- **Acceptance**: [Acceptance criteria for this step]

**When a step has multiple distinct changes**, use numbered fixes with the target file in the heading — NOT lettered sub-steps:

```markdown
**Fix 1 — description** (`path/to/file.ts`):
[what and why]

**Fix 2 — description** (`path/to/other-file.ts`):
[what and why]
```

Do NOT use "Step A / Step B" or "Sub-step A" — these imply nested step hierarchy which conflicts with the append-only step numbering scheme.

### Step 2: {Step Title}
[Same structure]

## Risks / Unknowns
[What could go wrong, what we don't know]

## Acceptance Criteria
Done when:
- [ ] Criterion 1
- [ ] Criterion 2
```

## Key Fields

- **Plan-Id**: Plan identifier (typically plan-slug)
- **Plan-Version**: v1 (initial), v2, v3... (incremented on each revision)
- **Status**: "New" (initial), "In Progress" (during implementation), "Implemented" (after successful audit)
- **Branch**: Git branch name for this plan's implementation
- **Last review round**: Link to review round (or "Initial plan — no review yet")
- **Contexts**: Links to context documents consulted when writing the plan (omit if none)
- **Plan revision log**: Table with version, round, date, changed steps, and summary — updated by Architect on every replan; Developer uses this to identify what to execute in the current version

## Step Status

Steps may include `**Status**: {done | partial | skipped | not started}` field:

- **not started**: Default status when plan is created (may be omitted)
- **done**: Step completed successfully (added by `/audit-implementation-feature` after successful audit)
- **partial**: Step partially completed (added by `/audit-implementation-feature` if audit shows partial completion)
- **skipped**: Step was skipped (added by `/audit-implementation-feature` if step was intentionally skipped)

**Note**:
- `/plan-feature` and `/replan-feature` do NOT add status to steps (plan not yet implemented)
- `/audit-implementation-feature` adds status to steps ONLY if decision is "ready" (based on implementation report)
