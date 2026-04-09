# Skill: /plan

**Purpose**: Invoke the Architect to create or update **the plan of this feature**. Hermetic per feature: agent doc context = feature (feat doc + plans/).

## Instructions for user

- Provide **FEATURE_ID** (e.g. `feat-2026-01-cursor-subagents-skills-planloop-ts`) or path to the feature doc (e.g. `.pythia/workflows/features/feat-XXX/feat-XXX.md`).
- Provide **plan slug** (required), e.g. `1-agents-commands-data-exchange` for plan `1-agents-commands-data-exchange.plan.md`.
- Plan path = `plans/{plan-slug}.plan.md` (under the feature directory).

## Instructions for model

You are the **Architect** ([architect.md](../../agents/architect.md)). **Doc context = this feature** (feat doc + plans/).

**Input**: Feature context + **plan slug** (required). Plan path = `plans/{plan-slug}.plan.md`. Optional: existing plan content, review text or link to round (for revision), or **user's edits to the plan** — if the user asks to "apply automatically" or "agree with these changes", output the plan with those edits incorporated.

**Architecture Ambiguity Checkpoint** (required before writing plan):

- If there are ambiguous architectural choices with materially different trade-offs, **ask user before generating plan changes**.
- Do not proceed to full plan output until user selects direction (unless user explicitly asks Architect to decide autonomously).
- Use this short structure for the checkpoint message:
  1. **Decision point**: one-line statement of what is ambiguous
  2. **Overview**: 2-4 lines of context and why decision matters
  3. **Options** (2-4): each with brief `Pros`, `Cons`, and expected impact
  4. **Question**: explicit user choice request (e.g. "Which option should be baseline?")
- Keep options concrete and codebase-relevant; avoid generic textbook alternatives.

**Before generating plan**: Get current date via `date +%Y-%m-%d`. Use this date in the **Date Created** field.

**Step detail (mandatory)**: Each step MUST follow the step structure in [plan-format.md](../workflow/references/plan-format.md). Steps must be **concrete and reviewable**: (a) Developer can implement without guessing what "done" means, (b) Reviewer can verify completeness, feasibility, and test coverage. Include per step: **Change** (concrete, bounded), **Where** (files/modules), **Preconditions** (if any), **Concrete outcome** (verifiable "done"), **Edge cases / errors** (if the step touches I/O, persistence, or integration), **Validation** (explicit command(s); when the step adds behavior, state which new tests are required), **Tests to add** (if the step requires new tests — list test names or scenarios so Developer knows exactly what to write), **API / types** (if the step introduces or changes public API or data format — signatures, struct/schema, or example JSON), **Pattern / approach** (if relevant), **Acceptance**. Prefer more, smaller steps with clear boundaries over fewer vague steps. Vague steps (e.g. "Add error handling", "Refactor X") are not acceptable — they block good review.

**Output**: **Full plan document (Markdown)**. Do not write files; output the full document for the user to save. The plan MUST include:

- **Plan-Id** (e.g. plan slug or feature-scoped id)
- **Plan-Version**: v1 for initial plan (if plan exists but lacks Plan-Version field, add it — migration from create-feature-plan format)
- **Last review round**: "Initial plan — no review yet" for v1 (or link to review round if revised)
- **## Plan revision log** — empty table for initial plan (entries are added by review rounds) — format: Version | Round | Date | Changed Steps | Summary
- **## Navigation** — placed after Plan revision log; flat list with links to all top-level sections and all steps (include Code / patterns and Out of scope when present). See [plan-format.md](../workflow/references/plan-format.md).
- When applicable, include **Code / patterns** and **Out of scope** per plan-format (optional sections after Goal).
- **## Plan** — steps with full detail per plan-format

**Cross-reference update** (after writing plan): For each context listed in `## Contexts`, update that context file's `## Used by` section to add a link back to this plan if not already present.

**Validation** (before completing):

- When the plan is **saved to a file**, run `scripts/validate-plan.sh <plan-file-path>` (from pythia repo or project root; see [plan-format.md](../workflow/references/plan-format.md) § Validation script) and fix any reported structure errors before finishing.
- Verify ambiguity checkpoint was used when decision trade-offs were materially different
- Verify user choice was captured before plan output (or user explicitly delegated choice to Architect)
- Verify plan includes all required fields (Plan-Id, Plan-Version, Branch, Last review round, Plan revision log)
- Verify Plan revision log format is correct (5 columns: Version | Round | Date | Changed Steps | Summary)
- Verify `## Navigation` is present with links to all steps
- Verify date format is `YYYY-MM-DD` (from `date +%Y-%m-%d`)
- Verify each context in `## Contexts` has this plan listed in its `## Used by` section

**Migration Note**: If an existing plan (created via create-feature-plan) lacks Plan-Version field, add:

- Plan-Version: v1 (if no revisions yet)
- Last review round: "Initial plan — no review yet"
- Plan revision log section — empty table (no entries until first review)

**Structured response**: Output structured response in chat using Architect Plan Response Format (plain Markdown) — see [response-formats.md](../workflow/references/response-formats.md) for format specification.

**See also**: Use [/review skill](../review/SKILL.md) to review the plan after creating it.

**Note**: Do NOT add `**Status**:` field to Steps in plan. Steps are not yet implemented, so status is not applicable. Status will be added by `/audit` after successful audit.

See [agent-selection-guide](../../agents/_agent-selection-guide.md): use Architect for planning; use Developer for implementation.
