# Skill: /implement

**Purpose**: Delegate to Developer subagent to execute plan and create implementation report. Hermetic per feature; agent doc context = feature.

## Input Formats

Choose any of the following:

```
/implement                               # No args: auto-detect from chat history
/implement feat-2026-01-123             # With FEATURE_ID: infer plan-slug from feature dir
/implement plan                          # Artifact ref: use current feature's latest review-approved plan
/implement feat-2026-01-123 1-refactor  # FEATURE_ID + plan-slug explicitly
```

**When no args**: auto-detect from chat — find most recent FEATURE_ID reference and most recent approved plan, or validate if already in feature context.

**Mode detection**: From user's message, determine whether this is **plan execution** (execute plan / first run / after replan) or **refinement** (bug fixes, follow-up work on current implementation). In refinement mode, an implementation report must already exist (last round will be extended).

## Instructions for user

- **Minimal case**: Just say `/implement` — skill will infer current feature and plan from chat.
- **With FEATURE_ID**: Provide feature ID if context is unclear.
- **Mode**: Default is plan execution. To run **refinement** (bug fixes, follow-up work by request): indicate that you want follow-up work or bug fixes on current implementation; the Developer will perform the work and record progress in the **last** Implementation Round's **Out-of-Plan Work** only — no new round is created.
- **Gate check**: Skill will verify review pass (Verdict: READY) before delegating to Developer.

## Instructions for model

### Input Parsing

Parse the user's input using this order:

1. **Extract FEATURE_ID** from:
   - Explicit arg (e.g. `feat-2026-01-123`)
   - Chat history (most recent feature reference)
   - Current feature context (if already in feature namespace)
   
   If unable to determine: **Prompt user** for FEATURE_ID before proceeding.

2. **Infer plan-slug** from:
   - Explicit arg (second positional after FEATURE_ID)
   - Feature directory structure (find `plans/` directory in feature folder)
   - If multiple plans exist: default to most recent approved (review pass), or **prompt user** which plan
   - If exactly one plan exists: use it

3. **Determine mode**:
   - **Plan execution**: default when no prior implementation report exists, or after replan (new plan version)
   - **Refinement**: user explicitly requests bug fixes or follow-up work on current implementation
   
   If ambiguous: **Prompt user** whether this is plan execution or refinement work.

### Gate Logic (execute before delegation)

4. Check if `{feature-dir}/reports/{plan-slug}.review.md` exists.
5. Parse review file for `Verdict: READY` (search for line starting with `Verdict:`).
6. If no review file exists:
   - Return error: "Cannot implement: plan must have review pass (Verdict: READY). Use /review skill first or complete review cycle."
   - Do not proceed.
7. If review file exists but verdict is not READY:
   - Return error: "Cannot implement: plan must have review pass (Verdict: READY). Current verdict: {verdict}. Use /review skill first or complete review cycle."
   - Do not proceed.
8. If review pass confirmed (Verdict: READY): proceed to Mandatory context load.

### Mandatory Context Load (before delegating to Developer)

1. Check if `{feature-dir}/reports/{plan-slug}.implementation.md` exists.
2. If it exists — read the `## Developer Retrospective` section and extract all `### I{n} — {date}` blocks.
3. Extract key learnings, known pitfalls, and `[risk]` entries from those sections.
4. Use this as context for the current implementation round — do NOT repeat mistakes already documented in previous rounds, and use `[risk]` entries to anticipate likely problems.

If no implementation report exists yet (first round) — skip this step and proceed to Delegation.

**Context documents** (optional, if plan has `## Contexts` section):

5. If the plan lists contexts in `## Contexts`, read those context documents from `{feature-dir}/contexts/`.
6. Note which context information is relevant to the current plan steps — this may be referenced in `### Contexts consulted` per Implementation Round.

### Mode Reference

- **Plan execution** (default): Execute plan steps, run validation, append a new `## Implementation Round I{n}`. **One plan version → at most one implementation round**: each plan version (v{N}) may appear only once in the compatibility table; the next implementation run is for the next plan version after replan.
- **Refinement**: User requests follow-up work (bug fixes, small changes) with **no new plan version**. Developer performs the work and records all progress in the **last** `## Implementation Round I{n}`'s **Out-of-Plan Work** section (append entries). No new round is created; Plan Version in the compatibility table stays unchanged. Static sections (Summary, Files Changed, Commands Executed, etc.) are updated to reflect the refinement work.

---

## Delegation to Developer Subagent

**Preferred**: Delegate to Developer subagent via the Task tool with `subagent_type="developer"` or equivalent.

**Fallback**: If the Task tool or Developer subagent is unavailable, execute the Developer prompt directly in this conversation (same prompt, same constraints, same output requirements — just run here instead of in a subagent).

Pass to Developer:
- FEATURE_ID
- plan-slug
- mode (plan execution OR refinement)
- feature context (feat doc + plan + review + existing implementation report if present)

**Developer prompt** (used for both delegation and fallback):

> **Role**: You are the **Developer** ([developer.md](../../agents/developer.md)). Your only job is to execute the plan and write the implementation report.
>
> **Doc context**: This feature (feat doc + `plans/` + `notes/` + `reports/`)
>
> **Task**: Execute plan `{plan-slug}` step by step.
>
> - Plan path: `plans/{plan-slug}.plan.md`
> - Output: `{feature-dir}/reports/{plan-slug}.implementation.md`
>
> **Constraints**:
>
> - Execute only what is in PLAN.md — do NOT change the plan
> - If something blocks — document in Deviations section
> - **Validation is mandatory**: run ALL validation commands listed in each Step's `- **Validation**:` block before marking that step done
>   - If a validation command cannot be run (environment issue) — mark Step as `partial`, document the reason as a PROBLEM entry, and still attempt all other validations
>   - A Step is `done` only when its validation commands have been executed and passed
>   - A Step is `partial` when code changes are made but validation was not run or did not pass
>   - **Never mark a Step `done` if its validation commands were not executed**
>
> **Report file structure** (top to bottom — static sections first, rounds at the end):
>
> 1. Header + Compatibility table
> 2. Summary, Steps Executed, Files Changed, Commands Executed, Validation, Results, Deviations, Open Issues
> 3. `## Developer Retrospective` — append one `### I{n}` block after each validation run
> 4. `## Developer Observations` — accumulates across all rounds
> 5. `## Implementation Round I1`, `## Implementation Round I2`, … — appended at the end, chronologically
>
> **Developer Retrospective** (section 3 above):
>
> - One `### I{n} — {YYYY-MM-DD}` block per validation run — appended after each run, never deleted
> - **Write when**: unexpected codebase facts, environment constraints that changed the approach, risks that materialized
> - **Do NOT write**: paraphrasing of Issues, summary of what was done — no value
> - If round produced no discoveries — skip the block entirely
> - Labels: `[codebase]`, `[tooling]`, `[plan]`, `[process]`, `[risk]`
> - Mirrors `## Architect Retrospective` in the plan file
>
> **Developer Observations** (section 4 above):
>
> - Place for observations **outside the current plan scope**: technical debt, future work, architectural concerns in adjacent code
> - Not round-specific — accumulates throughout the implementation
> - Write only when there is something concrete; omit section entirely if nothing observed
>
> **Implementation Round** (section 5 above — append after each validation run):
>
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
> See full format: [implementation-format.md](../workflow/references/implementation-format.md)

---

## Plan–Implementation Compatibility Table

The implementation report MUST include a compatibility table in the header block (after Date/Plan lines):

```markdown
## Plan–Implementation Compatibility

| Implementation Round | Plan Version | Date       | Result              |
| -------------------- | ------------ | ---------- | ------------------- |
| I1                   | v{N}         | YYYY-MM-DD | N passed / M failed |
| I2                   | v{N+1}       | YYYY-MM-DD | N passed / M failed |
```

- One row added when a new `## Implementation Round I{n}` is written
- **Plan Version** = the plan version active when this round was executed
- **Result** = summary outcome (test count, build status, etc.)
- Append-only — rows are never deleted

---

## Output

1. **Implementation report** written to `{feature-dir}/reports/{plan-slug}.implementation.md` per [implementation-format.md](../workflow/references/implementation-format.md).
2. **Structured response** in chat using Developer Response Format — see [response-formats.md](../workflow/references/response-formats.md).

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
- Verify report follows [implementation-format.md](../workflow/references/implementation-format.md)
- Verify ordering: the last `## Implementation Round` section is the current `I{n}` and rounds increase monotonically (`I1, I2, … I{n}`) with no out-of-order inserts.

See also: Requires [/review skill](../review/SKILL.md) verdict READY before executing.
