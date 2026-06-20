---
name: plan
description: Create or update a feature implementation plan with concrete steps, risks, and acceptance criteria for the Architect workflow.
---

# Skill: /plan

**Purpose**: Invoke the Architect to create or update a workflow plan. The primary mode is feature-scoped planning, but this skill also supports standalone fixes under `.pythia/workflows/fixes/`.

## Instructions for user

- For feature planning: provide **FEATURE_ID** (e.g. `feat-2026-01-cursor-subagents-skills-planloop-ts`) or a path to the feature doc.
- For standalone fixes: use the explicit `fix` trigger or rely on the corrective implicit routing rules below.
- Provide **plan slug** (required), e.g. `1-agents-commands-data-exchange` for plan `1-agents-commands-data-exchange.plan.md`.
- Plan path = `plans/{plan-slug}.plan.md` under the resolved feature or fixes workspace.

## Fix routing

### Explicit trigger

When `/plan` is called with `fix` keyword (for example `/plan fix auth-bug`):

1. determine the next `N` from `.pythia/workflows/fixes/plans/*.plan.md`
2. ensure `.pythia/workflows/fixes/plans/` exists
3. ensure `.pythia/workflows/fixes/fixes.md` exists with a minimal `## Plans` section
4. save the plan to `.pythia/workflows/fixes/plans/N-{slug}.plan.md`
5. update `.pythia/workflows/fixes/fixes.md` using the fix-specific Plans Index rules below

No confirmation is required for the explicit `fix` trigger.

### Semantic implicit trigger

When `/plan` is called without an explicit feature-id and:

- no active feature is detected in conversation context, and
- the request is corrective (bug fix, regression, tech debt, config change) rather than additive

route to fixes and tell the user:

`Routing to fixes (no active feature, corrective intent). Plan: fixes/plans/N-{slug}.plan.md`

If the request is additive and no active feature is available, ask the user for a feature-id or direct them to `/feat` first.

### Plans Index update — fix case

The standard `## Plans Index update` section below is feature-specific. For the fixes case:

- skip the feature-doc lookup at `{feature-dir}/{feature-id}.md`
- treat `.pythia/workflows/fixes/fixes.md` as the parent index document
- match entries by plan slug in `## Plans`
- if the slug exists, update that line
- if the slug does not exist, append a new line
- use format `- [{slug}](plans/{slug}.plan.md) — {Title} · Status: {status}`

## Instructions for model

You are the **Architect** ([architect.md](../../agents/architect.md)). **Doc context = resolved planning workspace**: either a feature directory (`feat doc + plans/`) or the standalone fixes workspace (`fixes.md + plans/`).

**CRITICAL — Execution context**: Execute the planning work **in the current context**. Do **NOT** launch a subagent to create the plan. Validator delegation is allowed only after the plan is saved; see **Validation**.

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

## Plan Brainstorm Mode

### Activation

When `/plan` is invoked with an argument that resolves to an existing `.plan.md` file, enter Plan Brainstorm Mode instead of create mode.

Detect brainstorm mode only when:

- the argument ends with `.plan.md`, and
- the resolved file already exists on disk

Do not enter brainstorm mode when:

- the file does not exist
- the argument is only a feature-id
- the argument is only a plain slug without `.plan.md`

Brainstorm mode suppresses Scenario B's overwrite question for existing plan paths.

### Startup sequence

Run this sequence once on activation before the first brainstorm response:

1. **Inputs check**
   - run `.pythia/runtime/inputs.js check <plan-file>` when the plan has `## References`
   - surface raw `STALE`, `MISSING`, or `INVALID` results
   - if no `## References`, skip silently
   - if the script is missing or not executable, skip silently
2. **Closed plans review**
   - scan sibling `plans/` for implemented or archived plans
   - extract `[risk]` and `[plan]` items from their `## Retrospective`
   - if no closed plans exist, skip silently
3. **Context freshness**
   - for each context in `## Contexts`, run `.pythia/runtime/inputs.js check <context-file>` when the context has `## References`
   - surface stale findings and which plan sections may be affected
   - do not edit `## References` or `## Used by` manually — `sync` on save handles backlinks
4. **Proactive suggestions**
   - list 2-4 concrete improvement candidates
   - prioritize by likely impact
   - ask what to address first

### Session behavior

After every brainstorm response:

- output the session footer below
- keep a short working-memory list of agreed changes
- replace or remove bullets when the user changes direction
- keep only changes that are ready to feed into `/replan`

When the user is ready, `/replan <plan-path>` uses those agreed changes as Manual-trigger context.

### Session footer

Append this after every brainstorm response:

```markdown
Agreed changes:
- {change 1}
- {change 2}

---
Active plan: {plan-slug} v{version} · {Status} | Agreed: {comma-separated labels or "none yet"}
```

Omit the bullet list when no agreed changes exist, but always print the final `Active plan:` line.

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

**Reusable findings**: While analyzing the codebase for planning, put transferable lessons in `## Retrospective`. A good retrospective entry is reusable outside this artifact, evidence-backed, and useful for future planning, implementation, review, audit, or automation. Put only explicit user choices/corrections in `## Decision Log`.

Record in `## Decision Log` only when user choices or corrections affect the artifact. The section itself means "user"; do not prefix entries with `User:`. Examples:
```markdown
## Decision Log

- Current plan scope: keep adjacent cleanup out of scope
- Implementation report language: always English
```

Do not use an Observations section. Reusable findings belong in `## Retrospective`; user-only decisions belong in `## Decision Log`. Do not put plan summaries, completed work, issue restatements, or user decisions in Retrospective.

**Automation awareness** (optional, accumulated over iterations): While creating the plan, watch for repetitive manual operations, validation steps, or configuration patterns in the plan steps. If you notice opportunities for automation, record them in `## Retrospective` with label `[automation]` so `/retro` can collect them.

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

For standalone fixes, do not use the feature-doc lookup above. Update `.pythia/workflows/fixes/fixes.md` instead, using the fix-case rules in `## Fix routing`.

**Inputs integration**:

- List consulted contexts in `## Contexts`; cite other dependencies as markdown links in the body. Never hand-write or edit trailing `## References` / `## Used by`.
- The plan auto-syncs on save. Before trusting a context, run `.pythia/runtime/inputs.js check <context-file>` when it has `## References`; surface `STALE`, `MISSING`, or `INVALID` raw output.

**Validation** (before completing):

- **Workflow-doc validation (Validator subagent)**: When the plan is **saved to disk**, launch a **Validator subagent** in a **separate context**. Use the **handoff prompt** in [/validate skill](../validate/SKILL.md) § Validator subagent (delegation): **absolute** `{ABS_PATH_TO_VALIDATE_SKILL}` (`.agents/skills/validate/SKILL.md` or `.claude/skills/validate/SKILL.md` in this repo) and **absolute** path to the plan file. **Do not** claim the plan matches the format contract until **exit `0`**. **PostToolUse hook warnings ≠ PASS** — see [hook-integration.md](../workflow/references/hook-integration.md).
  - **(Concrete tooling — if “spawn a Validator subagent” is unclear in your host)** “Validator subagent” **does not** mean a magic built-in role. Start a **separate delegated task** (e.g. Cursor **Task**, or your product’s equivalent) so validation runs **outside** this Architect thread. Use a **short, shell-capable** profile your stack supports — commonly `subagent_type="generalPurpose"` or the same type your [/loop skill](../loop/SKILL.md) uses for one-shot subagent handoffs when no dedicated Validator type exists. Put **only** the filled **handoff prompt** from [/validate skill](../validate/SKILL.md) § Validator subagent in the delegated body (paths substituted); **do not** paste plan content, step drafts, or long architecture narrative — only validation instructions.
  - **Inline fallback** (only if no subagent): open that validate skill and complete **one** validation run for that path **as defined in that skill**; report exit code + stderr; label **inline fallback**. Fix reported issues before finishing.
- Confirm the ambiguity checkpoint and user choice where trade-offs matter; revision log uses the table format in plan-format; `## Navigation` links cover all steps; dates are `YYYY-MM-DD`; plan body cites each listed context as a markdown link (backlinks are maintained by `sync`, validated by `cross-refs.js`).

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
- **[q]**: ask 3-5 clarification questions about the plan; do not launch review
- **[b]**: enter Brainstorm mode for the current saved plan; use the current plan artifact as the working basis for iterative Architect exploration and reshaping
- **[r]**: launch Reviewer in a separate context on the current plan path
- **[p]**: launch `/replan` as a separate workflow for formal revision of the current plan; do not hide or disable this action based on whether a review artifact exists
- **Unknown input**: reprint the chooser with `Enter a, q, b, r, or p`

## Active context item

At the end of every `/plan` response, output:

1. `## Next Steps` with separate `**Actions**` and `**Copy to run elsewhere**` blocks
2. a final `**Active context**` footer with explicit mode

Use the feature form when planning inside a feature create flow:

---
**Active context**: role: Architect · feat: {feat-id} · plan: {plan-slug} · mode: create · skill: /plan

Use the fixes form when planning in `.pythia/workflows/fixes/`:

---
**Active context**: role: Architect · fixes · plan: {plan-slug} · mode: create · skill: /plan

Use the brainstorm form when `/plan` is active on an existing plan path:

---
**Active context**: role: Architect · feat: {feat-id}|fixes · plan: {plan-slug} · mode: brainstorm · skill: /plan

Do not put brainstorm hints, review hints, or `See also` lines inside the active context footer itself.
