# Plan Format Specification

**File**: `plans/{plan-slug}.plan.md`

## Required Structure

```markdown
# Plan {Plan-Id}: {Title}

## Metadata
- **Plan-Id**: {plan-slug}
- **Plan-Version**: v1 (or v2, v3...)
- **Last review round**: notes/{plan-slug}.review.md → ## {plan-slug} R{n} — YYYY-MM-DD (or "Initial plan — no review yet")

## Plan revision log

| Round | Date       | Plan version |
|-------|------------|--------------|
| R1    | YYYY-MM-DD | v1           |

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
- **Last review round**: Link to review round (or "Initial plan — no review yet")
- **Plan revision log**: Table/list with round, date, plan version only (no change descriptions)

## Step Status

Steps may include `**Status**: {done | partial | skipped | not started}` field:

- **not started**: Default status when plan is created (may be omitted)
- **done**: Step completed successfully (added by `/audit-implementation-feature` after successful audit)
- **partial**: Step partially completed (added by `/audit-implementation-feature` if audit shows partial completion)
- **skipped**: Step was skipped (added by `/audit-implementation-feature` if step was intentionally skipped)

**Note**: 
- `/plan-feature` and `/replan-feature` do NOT add status to steps (plan not yet implemented)
- `/audit-implementation-feature` adds status to steps ONLY if decision is "ready" (based on implementation report)
