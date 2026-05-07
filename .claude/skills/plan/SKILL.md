---
name: plan
description: Create or update a feature implementation plan with concrete steps, risks, and acceptance criteria for the Architect workflow.
---

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

## Plan output behavior

Check if sufficient data is available to write a concrete, reviewable plan.

**Scenario A — insufficient data**

- Output a 1-2 line summary of what is understood
- Output numbered questions only for missing information that materially changes the plan
- Do not write a plan file
- Do not show the chooser menu

**Scenario B — sufficient data**

- Build the full plan document
- Write it to disk at `plans/{plan-slug}.plan.md`
- If the file already exists, ask whether to overwrite it or create a new revision before writing
- After writing, respond with a short summary instead of echoing the full markdown unless the user explicitly asks for it

The document is defined end-to-end in [plan-format.md](../workflow/references/plan-format.md): section order, `## Metadata` fields (including document **Status** per **Plan document status** — **Draft** for every new `/plan` output), **Plan revision log**, **Navigation**, Context / Goal / Plan body, Risks or Acceptance, and step field requirements. Treat that file as the single specification; your output must conform to it. Steps must be **concrete and reviewable** (Developer knows scope, Reviewer can verify): each `### Step N` uses the required fields from plan-format (**Change**, **Where**, **Validation**, **Acceptance**, plus optional fields there). Do **not** add per-step `**Status**:` in `/plan` output — `/audit` adds step status after implementation. When the plan **changes observable behavior of a system** (generator output, validator rules, plugin response, contract shape, CLI output), include `## Before / After: System Behavior` after Acceptance Criteria (see plan-format.md § Before / After: System Behavior for guidance and template).

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

## Plans Index update

`/plan` is the authoritative write path for a single plan create/update.

After writing the plan file in Scenario B:

- look for the parent feature doc at `{feature-dir}/{feature-id}.md`
- ensure it has a `## Plans` section; add it if needed
- match entries by plan slug only
- if the slug already exists, replace/update that line
- if the slug does not exist, append a new line
- use this format: `- [{slug}](plans/{slug}.plan.md) — {Title} · Status: {status}`

If the parent feature doc is missing, skip silently.

`/feat sync` is a manual reconciliation path for `## Plans`, not an alternate authoring path. Both flows must use the same line format and replace-by-slug logic.

**Cross-reference update** (after writing plan): For each context listed in `## Contexts`, update that context file's `## Used by` section to add a link back to this plan if not already present.

**Inputs integration**:

- Before trusting any context artifact listed in `## Contexts`, if that context file declares `inputs:`, run `scripts/inputs.sh check <context-file>`.
- If the check reports `STALE`, `MISSING`, or `INVALID`, surface that raw result to the user before proceeding. This skill does not assign a global warn/block policy and must not hide the check output.
- If a context file has no `inputs:` block, proceed normally and do not invent one just because the plan consumes it.
- Create plan: run `scripts/inputs.sh add <plan-file> <dep> [<dep>...]` to record the feature doc and each consulted context as direct plan inputs. Do not run `update` on first creation.
- Revise stale plan: rewrite the plan content first. Run `scripts/inputs.sh update <plan-file>` only after the document already reflects the current source files.

**Validation** (before completing):

- **Workflow-doc validation (Validator subagent)**: When the plan is **saved to disk**, launch a **Validator subagent** in a **separate context**. Use the **handoff prompt** in [/validate skill](../validate/SKILL.md) § Validator subagent (delegation): **absolute** `{ABS_PATH_TO_VALIDATE_SKILL}` (`.agents/skills/validate/SKILL.md` or `.claude/skills/validate/SKILL.md` in this repo) and **absolute** path to the plan file. **Do not** claim the plan matches the format contract until **exit `0`**.
  - **(Concrete tooling — if “spawn a Validator subagent” is unclear in your host)** “Validator subagent” **does not** mean a magic built-in role. Start a **separate delegated task** (e.g. Cursor **Task**, or your product’s equivalent) so validation runs **outside** this Architect thread. Use a **short, shell-capable** profile your stack supports — commonly `subagent_type="generalPurpose"` or the same type your [/loop skill](../loop/SKILL.md) uses for one-shot subagent handoffs when no dedicated Validator type exists. Put **only** the filled **handoff prompt** from [/validate skill](../validate/SKILL.md) § Validator subagent in the delegated body (paths substituted); **do not** paste plan content, step drafts, or long architecture narrative — only validation instructions.
  - **Inline fallback** (only if no subagent): open that validate skill and complete **one** validation run for that path **as defined in that skill**; report exit code + stderr; label **inline fallback**. Fix reported issues before finishing.
- Confirm the ambiguity checkpoint and user choice where trade-offs matter; revision log uses the table format in plan-format; `## Navigation` links cover all steps; dates are `YYYY-MM-DD`; each listed context’s `## Used by` references this plan.

**Migration**: If an existing plan lacks **Plan-Version**, add v1, set Last review round to "Initial plan — no review yet", and add an empty revision-log table as in plan-format.

## Post-save response contract

Use Architect Response Format **A1. Plan Creation Response** from [response-formats.md](../workflow/references/response-formats.md).

After Scenario B, respond with:

1. one-line summary of what was written
2. saved path and plan version
3. Plans Index result: updated | appended | skipped
4. BMAD-style next-step chooser
5. active context footer

Do not print the full plan markdown back into chat after a successful write unless the user explicitly asks for it.

### Next-step chooser behavior

After a successful save in Scenario B, show the chooser and halt for user input.

- **HALT rule**: after printing the chooser, stop and wait for the user
- **[a]**: perform an Architect analysis pass on alternatives and trade-offs; do not write a new plan file unless explicitly asked
- **[q]**: ask 3-5 deep questions about the plan; do not launch review
- **[r]**: launch Reviewer in a separate context on the current plan path
- **[p]**: allowed only when a review artifact already exists for this plan; otherwise reprint the chooser and note that review does not exist yet
- **Unknown input**: reprint the chooser with `Enter a, q, r, or p`

## Active context item

At the end of every `/plan` response, output:

---
**Active context**: feat: {feat-id} · plan: {plan-slug} · skill: /plan

**See also**: [/review skill](../review/SKILL.md) after creating the plan.

See [Architect](../../agents/architect.md) for planning and [Developer](../../agents/developer.md) for implementation.
