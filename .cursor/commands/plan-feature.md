# Command: /plan-feature

**Purpose**: Invoke the Architect to create or update **the plan of this feature**. Hermetic per feature: agent doc context = feature (feat doc + plans/).

## Instructions for user

- Provide **FEATURE_ID** (e.g. `feat-2026-01-cursor-subagents-skills-planloop-ts`) or path to the feature doc (e.g. `.pythia/workflows/features/feat-XXX/feat-XXX.md`).
- Provide **plan slug** (required), e.g. `1-agents-commands-data-exchange` for plan `1-agents-commands-data-exchange.plan.md`.
- Plan path = `plans/{plan-slug}.plan.md` (under the feature directory).
- If no plan exists yet, use **Plan Mode (Shift+Tab)** or [create-feature-plan](commands/create-feature-plan.md) for this feature first.

## Instructions for model

You are the **Architect**. **Doc context = this feature** (feat doc + plans/).

**Input**: Feature context + **plan slug** (required). Plan path = `plans/{plan-slug}.plan.md`. Optional: existing plan content, review text or link to round (for revision), or **user's edits to the plan** — if the user asks to "apply automatically" or "agree with these changes", output the plan with those edits incorporated.

**Before generating plan**: Get current date via `date +%Y-%m-%d`. Use this date in the **Date Created** field.

**Output**: **Full plan document (Markdown)**. Do not write files; output the full document for the user to save. The plan MUST include:

- **Plan-Id** (e.g. plan slug or feature-scoped id)
- **Plan-Version**: v1 for initial plan (if plan exists but lacks Plan-Version field, add it — migration from create-feature-plan format)
- **Last review round**: "Initial plan — no review yet" for v1 (or link to review round if revised)
- **## Plan revision log** — empty table for initial plan (entries are added by review rounds) — format: Version | Round | Date | Changed Steps | Summary
- **## Navigation** — placed after Plan revision log; flat list with links to all top-level sections and all steps:
  ```
  - [Architect Retrospective](#architect-retrospective) · [Architect Observations](#architect-observations)
  - [Context](#context) · [Goal](#goal)
  - Plan: [Step 1: {Title}](#step-1-title) · [Step 2: {Title}](#step-2-title) · ...
  - [Risks / Unknowns](#risks--unknowns) · [Acceptance Criteria](#acceptance-criteria)
  ```

**Cross-reference update** (after writing plan): For each context listed in `## Contexts`, update that context file's `## Used by` section to add a link back to this plan if not already present.

**Validation** (before completing):
- Verify plan includes all required fields (Plan-Id, Plan-Version, Branch, Last review round, Plan revision log)
- Verify Plan revision log format is correct (5 columns: Version | Round | Date | Changed Steps | Summary)
- Verify `## Navigation` is present with links to all steps
- Verify date format is `YYYY-MM-DD` (from `date +%Y-%m-%d`)
- Verify each context in `## Contexts` has this plan listed in its `## Used by` section

**Migration Note**: If an existing plan (created via create-feature-plan) lacks Plan-Version field, add:
- Plan-Version: v1 (if no revisions yet)
- Last review round: "Initial plan — no review yet"
- Plan revision log section — empty table (no entries until first review)

**Structured response**: Output structured response in chat using Architect Plan Response Format (plain Markdown) — see `references/response-formats.md` for format specification.

**Note**: Do NOT add `**Status**:` field to Steps in plan. Steps are not yet implemented, so status is not applicable. Status will be added by `/audit-implementation-feature` after successful audit.

See [agent-selection-guide](agents/_agent-selection-guide.md): use Architect for planning; use Developer for implementation.
