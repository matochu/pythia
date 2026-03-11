# Command: /implement-plan-feature

**Purpose**: Delegate to Developer subagent to execute plan and create implementation report. Hermetic per feature; agent doc context = feature.

## Instructions for user

- Provide **FEATURE_ID** or path to feature doc and **plan slug** (e.g. `1-agents-commands-data-exchange` for plan `1-agents-commands-data-exchange.plan.md`).
- **Gate check**: Command will verify review pass before proceeding.
- **Mode**: Default is plan execution. To run **refinement** (bug fixes, follow-up work by request): indicate that you want follow-up work or bug fixes on the current implementation; the Developer will perform the work and record progress in the **last** Implementation Round's **Out-of-Plan Work** only — no new round is created.

## Instructions for model

**Gate Logic** (execute before any action):

1. Check if `{feature-dir}/reports/{plan-slug}.review.md` exists in feature directory.
2. Parse review file for `Verdict: READY` (search for line starting with `Verdict:`).
3. If no review file exists:
   - Return error: "Cannot implement: plan must have review pass (Verdict: READY). Run /review-plan-feature first or complete review cycle."
   - Do not proceed.
4. If review file exists but verdict is not READY:
   - Return error: "Cannot implement: plan must have review pass (Verdict: READY). Current verdict: {verdict}. Run /review-plan-feature first or complete review cycle."
   - Do not proceed.
5. If review pass confirmed (Verdict: READY): proceed to Mandatory context load.

---

## Mandatory context load (before implementation)

1. Check if `{feature-dir}/reports/{plan-slug}.implementation.md` exists.
2. If it exists — read the `## Developer Retrospective` section and extract all `### I{n} — {date}` blocks.
3. Extract key learnings, known pitfalls, and `[risk]` entries from those sections.
4. Use this as context for the current implementation round — do NOT repeat mistakes already documented in previous rounds, and use `[risk]` entries to anticipate likely problems.

If no implementation report exists yet (first round) — skip this step and proceed to Execution.

**Context documents** (optional, if plan has `## Contexts` section):

5. If the plan lists contexts in `## Contexts`, read those context documents from `{feature-dir}/contexts/`.
6. Note which context information is relevant to the current plan steps — this may be referenced in `### Contexts consulted` per Implementation Round.

**Mode detection**: From the user's message, determine whether this run is **plan execution** (execute plan / first run / after replan) or **refinement** (bug fixes, follow-up work on current implementation). In refinement mode, an implementation report must already exist (last round will be extended).

---

## Mode: Plan execution vs Refinement

**Plan execution** (default): Execute plan steps, run validation, append a new `## Implementation Round I{n}`. **One plan version → at most one implementation round**: each plan version (v{N}) may appear only once in the compatibility table; the next implementation run is for the next plan version after replan. Plan version can be any v{N} (e.g. v12, v5), since it advances with review/replan cycles.

**Refinement**: User requests follow-up work (bug fixes, small changes) with **no new plan version**. Developer performs the work and records all progress in the **last** `## Implementation Round I{n}`'s **Out-of-Plan Work** section (append entries). No new round is created; Plan Version in the compatibility table stays unchanged. Static sections (Summary, Files Changed, Commands Executed, etc.) are updated to reflect the refinement work.

- **When to use refinement**: User explicitly asks for bug fixes, follow-up tasks, or small changes on top of the current implementation.
- **When to use plan execution**: First run, or after Architect delivered a new plan version (replan), or user asks to "continue implementing the plan".

---

## Round Lifecycle

- **New `## Implementation Round I{n}`**: Created when executing the plan (first run or after a new plan version). **Only one implementation round per plan version** — each v{N} appears at most once in the table; plan version can be e.g. v12, v5 (advances with review/replan).
- **Refinement**: No new round, no new plan version. Append to the **last** round's **Out-of-Plan Work**; update static sections. Plan Version in the table stays unchanged (keeps one-implementation-per-plan-version).
- Implementation rounds are appended at end: `I{n}` must be the final section in the file, after all prior rounds (`I1… I{n-1}`) and after `Developer Retrospective`/`Developer Observations`.
- Repeated validation runs or debug iterations within the same plan version can be folded into the current round's Out-of-Plan Work.

---

## Execution

**Preferred**: Delegate to Developer subagent via the Task tool with `subagent_type="developer"`.

**Fallback**: If the Task tool or Developer subagent is unavailable, execute the Developer prompt directly in this conversation (same prompt, same constraints, same output requirements — just run here instead of in a subagent).

**Developer prompt** (used for both delegation and fallback):

> **Role**: You are the Developer. Your only job is to execute the plan and write the implementation report.
>
> **Doc context**: This feature (feat doc + `plans/` + `notes/` + `reports/`)
>
> **Task**: Execute plan `{plan-slug}` step by step.
> - Plan path: `plans/{plan-slug}.plan.md`
> - Output: `{feature-dir}/reports/{plan-slug}.implementation.md`
>
> **Constraints**:
> - Execute only what is in PLAN.md — do NOT change the plan
> - If something blocks — document in Deviations section
> - **Validation is mandatory**: run ALL validation commands listed in each Step's `- **Validation**:` block before marking that step done
>   - If a validation command cannot be run (environment issue) — mark Step as `partial`, document the reason as a PROBLEM entry, and still attempt all other validations
>   - A Step is `done` only when its validation commands have been executed and passed
>   - A Step is `partial` when code changes are made but validation was not run or did not pass
>   - **Never mark a Step `done` if its validation commands were not executed**
>
> **Report file structure** (top to bottom — static sections first, rounds at the end):
> 1. Header + Compatibility table
> 2. Summary, Steps Executed, Files Changed, Commands Executed, Validation, Results, Deviations, Open Issues
> 3. `## Developer Retrospective` — append one `### I{n}` block after each validation run
> 4. `## Developer Observations` — accumulates across all rounds
> 5. `## Implementation Round I1`, `## Implementation Round I2`, … — appended at the end, chronologically
>
> **Developer Retrospective** (section 3 above):
> - One `### I{n} — {YYYY-MM-DD}` block per validation run — appended after each run, never deleted
> - **Write when**: unexpected codebase facts, environment constraints that changed the approach, risks that materialized
> - **Do NOT write**: paraphrasing of Issues, summary of what was done — no value
> - If round produced no discoveries — skip the block entirely
> - Labels: `[codebase]`, `[tooling]`, `[plan]`, `[process]`, `[risk]`
> - Mirrors `## Architect Retrospective` in the plan file
>
> **Developer Observations** (section 4 above):
> - Place for observations **outside the current plan scope**: technical debt, future work, architectural concerns in adjacent code
> - Not round-specific — accumulates throughout the implementation
> - Write only when there is something concrete; omit section entirely if nothing observed
>
> **Implementation Round** (section 5 above — append after each validation run):
> - Step Results table (done/partial/failed per step)
> - Issues: structured BLOCKER/PROBLEM entries with evidence + root cause hypothesis
> - Contexts consulted (optional): context docs referenced during this round
> - Out-of-Plan Work: **mandatory** — document ALL changes outside plan steps:
>   - File edits, config tweaks, or code changes not in any plan step
>   - Debug scripts, extra test runs, logging added temporarily
>   - Dependency or environment changes, workarounds
>   - Format: `- [type] description → reason → result`
>   - **Purpose**: Architect reads this to understand real changes — omissions cause plan drift
>   - If nothing was done outside the plan: write `Out-of-Plan Work: none`
>
> **Refinement mode** (when user requested bug fixes or follow-up work): Do not create a new `## Implementation Round I{n}`. Perform the requested work, then **append** all changes to the **last** existing round's **Out-of-Plan Work** (add new bullet entries). Update static sections (Summary, Files Changed, Commands Executed, etc.) to reflect the refinement. Plan Version in the compatibility table stays unchanged.
>
> See full format: `references/implementation-format.md`

---

## Plan–Implementation Compatibility Table

The implementation report MUST include a compatibility table in the header block (after Date/Plan lines):

```markdown
## Plan–Implementation Compatibility

| Implementation Round | Plan Version | Date       | Result              |
|----------------------|--------------|------------|---------------------|
| I1                   | v{N}         | YYYY-MM-DD | N passed / M failed |
| I2                   | v{N+1}       | YYYY-MM-DD | N passed / M failed |
```

- One row added when a new `## Implementation Round I{n}` is written
- **Plan Version** = the plan version active when this round was executed
- **Result** = summary outcome (test count, build status, etc.)
- Append-only — rows are never deleted

---

## Output

1. **Implementation report** written to `{feature-dir}/reports/{plan-slug}.implementation.md` per `references/implementation-format.md`.
2. **Structured response** in chat using Developer Response Format — see `references/response-formats.md`.

## Validation (before completing)

- Verify report includes all required top-level sections (Summary, Steps Executed, Files Changed, Commands Executed, Validation, Results, Deviations, Open Issues)
- Verify Plan–Implementation Compatibility table is present and up to date
- Verify all deviations from plan are documented with reasons
- Verify validation commands from plan were run (plan execution mode) — if NOT run, the round is NOT complete:
  - Steps with unrun validation must be marked `partial` in Step Results table
  - Developer must attempt to run them before closing the round
  - If environment prevents running (e.g. no Docker, no network), document as PROBLEM entry with environment reason — but still attempt all other validations
- Verify report contains `## Implementation Round I{n}` for each validation run (refinement mode: no new round; only last round's Out-of-Plan Work extended)
- Verify Developer Retrospective and Developer Observations are located **before** the round sections
- Verify report follows `references/implementation-format.md`
- Verify ordering: the last `## Implementation Round` section is the current `I{n}` and rounds increase monotonically (`I1, I2, … I{n}`) with no out-of-order inserts.

See [agent-selection-guide](../agents/_agent-selection-guide.md): use Developer for implementation; use Architect for planning and audit.
