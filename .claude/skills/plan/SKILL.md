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

**Plan artefact (normative)**: Emit the **full plan document (Markdown)** for the user to save; do not write files from this skill. The document is defined end-to-end in [plan-format.md](../workflow/references/plan-format.md): section order, `## Metadata` fields (including document **Status** per **Plan document status** — **Draft** for every new `/plan` output), **Plan revision log**, **Navigation**, Context / Goal / Plan body, Risks or Acceptance, and step field requirements. Treat that file as the single specification; your output must conform to it. Steps must be **concrete and reviewable** (Developer knows scope, Reviewer can verify): each `### Step N` uses the required fields from plan-format (**Change**, **Where**, **Validation**, **Acceptance**, plus optional fields there). Do **not** add per-step `**Status**:` in `/plan` output — `/audit` adds step status after implementation. When the plan **changes observable behavior of a system** (generator output, validator rules, plugin response, contract shape, CLI output), include `## Before / After: System Behavior` after Acceptance Criteria (see plan-format.md § Before / After: System Behavior for guidance and template).

**Codebase observations** (expected, not optional): While analyzing the codebase for planning, note issues you encounter. **Each observation must include a priority label**: `[high|mid|low|nit]`.

**Priority guide** (importance to project):
- `[high]` → Critical for current or future work, blocks productivity, or is a critical bug
- `[mid]` → Important technical debt, fragile patterns, or moderate issues
- `[low]` → Code quality improvements, efficiency improvements, or minor issues
- `[nit]` → Cosmetic, minor cleanups, or nice-to-haves

Record in `## Architect Observations` with priority label and clear description. Examples:
```markdown
## Architect Observations

- `[high]` Module Y swallows validation errors; critical for debugging Step 3
- `[mid]` Duplicated fetch logic across 3 services; suggests need for utility layer
- `[low]` Inefficient loop in helper function; not blocking but impacts large datasets
- `[nit]` JSDoc comments missing on util.js exports
```

**Do not skip this.** Observations build organizational knowledge of codebase state and importance.

**Automation awareness** (optional, accumulated over iterations): While creating the plan, watch for repetitive manual operations, validation steps, or configuration patterns in the plan steps. If you notice opportunities for automation — e.g. repeated data validation, boilerplate configuration, manual verification cycles, or integration checklists — record them in `## Architect Observations` with prefix `[automation]:` suggesting skill purpose (e.g. `[automation]: Consider a skill to automate X validation workflow` or `[automation]: Pattern Y appears in steps 2, 5, 7 — candidate for parametric skill`). This accumulates across future iterations for retrospective analysis and skill creation decisions.

**Cross-reference update** (after writing plan): For each context listed in `## Contexts`, update that context file's `## Used by` section to add a link back to this plan if not already present.

**Validation** (before completing):

- **Workflow-doc validation (Validator subagent)**: When the plan is **saved to disk**, launch a **Validator subagent** in a **separate context**. Use the **handoff prompt** in [/validate skill](../validate/SKILL.md) § Validator subagent (delegation): **absolute** `{ABS_PATH_TO_VALIDATE_SKILL}` (`.agents/skills/validate/SKILL.md` or `.claude/skills/validate/SKILL.md` in this repo) and **absolute** path to the plan file. **Do not** claim the plan matches the format contract until **exit `0`**.
  - **(Concrete tooling — if “spawn a Validator subagent” is unclear in your host)** “Validator subagent” **does not** mean a magic built-in role. Start a **separate delegated task** (e.g. Cursor **Task**, or your product’s equivalent) so validation runs **outside** this Architect thread. Use a **short, shell-capable** profile your stack supports — commonly `subagent_type="generalPurpose"` or the same type your [/loop skill](../loop/SKILL.md) uses for one-shot subagent handoffs when no dedicated Validator type exists. Put **only** the filled **handoff prompt** from [/validate skill](../validate/SKILL.md) § Validator subagent in the delegated body (paths substituted); **do not** paste plan content, step drafts, or long architecture narrative — only validation instructions.
  - **Inline fallback** (only if no subagent): open that validate skill and complete **one** validation run for that path **as defined in that skill**; report exit code + stderr; label **inline fallback**. Fix reported issues before finishing.
- Confirm the ambiguity checkpoint and user choice where trade-offs matter; revision log uses the table format in plan-format; `## Navigation` links cover all steps; dates are `YYYY-MM-DD`; each listed context’s `## Used by` references this plan.

**Migration**: If an existing plan lacks **Plan-Version**, add v1, set Last review round to "Initial plan — no review yet", and add an empty revision-log table as in plan-format.

**Structured response**: Use the Architect Plan Response Format in [response-formats.md](../workflow/references/response-formats.md).

**See also**: [/review skill](../review/SKILL.md) after creating the plan.

See [agent-selection-guide](../../agents/_agent-selection-guide.md): Architect for planning; Developer for implementation.
