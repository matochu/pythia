---
name: workflow
description: Plan stabilization workflow for features. Use when working on feature plans, reviews, or implementation. Provides procedures and formats for plan stabilization loop.
compatibility: 'Cursor, VS Code Copilot, Claude Desktop, OpenCode'
---

**Note**: This skill contains procedures, formats, and workflow logic. Individual commands (`/plan-feature`, `/review-plan-feature`, etc.) remain in `.cursor/commands/` directory, and specialized skill workflows in `.agents/skills/` (e.g., `/plan`, `/implement`, `/audit`, `/loop`).

**Context Budget**: Skill descriptions have 2% context window budget (fallback 16,000 chars). Keep detailed procedures in `references/` directory within skill, not in main SKILL.md.

# Architecture Workflow Skill

## Overview

This skill provides procedures and formats for the plan stabilization workflow. Commands are defined in `.cursor/commands/` and reference this skill for detailed procedures.

## Commands Reference

Commands are located in `.cursor/commands/`:

- `/feature` → `.cursor/commands/feature.md`
- `/context-feature` → `.cursor/commands/context-feature.md`
- `/plan-feature` → `.cursor/commands/plan-feature.md`
- `/review-plan-feature` → `.cursor/commands/review-plan-feature.md`
- `/replan-feature` → `.cursor/commands/replan-feature.md`
- `/implement-plan-feature` → `.cursor/commands/implement-plan-feature.md` (with gate logic)
- `/audit-implementation-feature` → `.cursor/commands/audit-implementation-feature.md`
- `/run-feature-plan-loop` → `.cursor/commands/run-feature-plan-loop.md` (loop orchestrator from any checkpoint)
- `/audit-implementation-feature` → `.cursor/commands/audit-implementation-feature.md`
- `/retro-feature` → `.cursor/commands/retro-feature.md`

## Workflow Procedures

### Feature Creation

- Input: Feature requirements, scope, objectives
- Output: Feature document in `feat-XXX/feat-XXX.md`
- Format: See feature template structure

### Context Creation

- Input: Feature context + context topic/type
- Output: Context document in `feat-XXX/contexts/{name}.context.md`
- Format: See context template structure

### Plan Creation/Revision

- Input: Feature context + plan slug (required) + optional review text or link to round
- Output: Full plan document with Plan-Id, Plan-Version, Plan revision log
- Format: See `references/plan-format.md`
- Plan-level optional: Code/patterns (reference to quality guidelines + implementation constraints), Out of scope

### Review Process

- Input: Feature context + plan slug
- Output: Review document with Verdict, Step-by-Step Analysis
- Format: See `references/review-format.md`
- Max rounds: 2 (MAX_REVIEW_LOOPS)

### Implementation

- Gate: Check review file exists and Verdict is READY
- Input: Feature context + plan slug (after review pass)
- Output: Implementation report
- Format: See `references/implementation-format.md`

### Audit

- Input: Feature context + plan slug + implementation report
- Output: Architect audit report + plan update + feature document update (if verdict is "ready")
- Format: See `references/audit-format.md`
- **Plan Update**: If verdict is "ready", update plan:
  - Change Status to "Implemented"
  - Add `**Status**: done` to completed Steps
  - Mark acceptance criteria checkboxes as `[x]` for met criteria
- **Feature Document Update**: If verdict is "ready", update feature document:
  - Add/update plan entry in "Existing External Plans" section
  - Add `**Status: Implemented**` marker to plan entry

### Retrospective

- Input: Feature context + plan slug (completed plan with Status: "Implemented")
- Output: Retrospective report in notes/
- Format: See `references/retro-format.md`
- **Gate**: Plan must have Status: "Implemented"
- **Analysis**: Collects data from plan, review, implementation, and audit artifacts
- **Output**: Comprehensive retrospective report with insights, patterns, challenges, solutions, and recommendations

## Review Loop Policy

- **MAX_REVIEW_LOOPS = 2** (recommended 2–3 rounds per Plan 1)
- If after max cycles there are Impact: high findings → stop: re-scope / ask user / re-plan
- Loop: /replan-feature → /review-plan-feature (max 2 cycles)

## Post-Audit Loop Policy

After `/audit-implementation-feature`, the verdict drives the next step automatically. Do not stop at audit — continue the loop.

| Verdict       | Root cause                                                                                                           | Next action                                                               | Max iterations |
| ------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------- |
| `ready`       | —                                                                                                                    | DONE                                                                      | —              |
| `needs-fixes` | Implementation issues; plan is correct                                                                               | Developer refinement → fresh audit subagent                               | 2              |
| `plan-fix`    | Plan had errors (wrong assumption, bad step spec, missing constraint); implementation followed wrong spec faithfully | Architect patches plan (no review) → Developer re-implement → fresh audit | 1              |
| `re-plan`     | Approach wrong, major scope gap, fundamental issues                                                                  | /replan-feature → /review-plan-feature → /implement-plan-feature → /audit | 1              |

**Escalation rules:**

- After 2 `needs-fixes` loops without `ready` → STUCK: report to user, stop
- After 1 `plan-fix` without `ready` → escalate automatically to `re-plan`
- After 1 `re-plan` (audit-triggered) without `ready` → BLOCKED: require user input

**`plan-fix` vs `re-plan` decision:**

- `plan-fix`: ≤ 2 steps need amendment, implementation approach stays the same, no review needed
- `re-plan`: ≥ 3 steps affected, approach changes, or a review is needed to validate the fix

**Fresh-session constraint for auditor:** When running in loop mode, the audit subagent must be a fresh context — it must not share session history with the Developer that just implemented. Spawn the auditor as a separate subagent.

## Execution Mode

- **inline** (default): each step runs in the current agent context. Suitable for single steps invoked manually.
- **loop**: agent spawns a subagent per role, waits for result artifact, then continues automatically. Use `/run-feature-plan-loop` or append `loop` to any command.

When the user says **"loop"**, **"auto"**, or invokes `/run-feature-plan-loop`:

- All role transitions use subagent delegation (Task tool or equivalent)
- Parent reads artifact files after each subagent completes to determine next step
- Auditor is always a fresh subagent (strict, even if loop mode is off)
- Loop continues until `ready` or a max-iterations exit condition is triggered

**Subagent roles in loop mode:**

| Role                    | Inline mode                         | Loop mode                                 |
| ----------------------- | ----------------------------------- | ----------------------------------------- |
| Architect (plan/replan) | Current context                     | Current context (orchestrator)            |
| Reviewer                | Always subagent (strict)            | Always subagent (strict)                  |
| Developer               | Preferred subagent, fallback inline | Always subagent                           |
| Architect (audit)       | Current context                     | Fresh subagent (isolation from developer) |

## Feature Binding

All artifacts are hermetic per feature:

- Plans: `feat-XXX/plans/{plan-slug}.plan.md`
- Reviews: `feat-XXX/reports/{plan-slug}.review.md`
- Implementation: `feat-XXX/reports/{plan-slug}.implementation.md`
- Audit: `feat-XXX/reports/{plan-slug}.audit.md`
- **Problems** (when verdict ≠ ready): `feat-XXX/notes/{plan-slug}.problems.md`

Plan slug identifies the plan within a feature. All related artifacts use the same plan slug.
