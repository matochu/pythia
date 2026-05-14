---
name: implement
description: Execute a review-approved feature plan and produce or refine the implementation report for that feature.
---

# Skill: /implement

**Purpose**: Execute a review-approved plan as Developer and create or refine the implementation report. Hermetic per feature; agent doc context = feature.

## Input Formats

Choose any of the following:

```
/implement                               # No args: auto-detect from chat history
/implement feat-2026-01-123             # With FEATURE_ID: infer plan-slug from feature dir
/implement plan                          # Artifact ref: use current feature's latest review-approved plan
/implement feat-2026-01-123 1-refactor  # FEATURE_ID + plan-slug explicitly
/implement A{n}                          # Audit ref: refine active implementation from Audit Round A{n}
/implement {feature-dir}/plans/{plan-slug}.plan.md A{n}  # Explicit audit-triggered refinement
```

**When no args**: auto-detect from chat — find most recent FEATURE_ID reference and most recent approved plan, or validate if already in feature context.

**Mode detection**: From user's message, determine whether this is **plan execution** (execute plan / first run / after replan) or **refinement** (bug fixes, follow-up work on current implementation). In refinement mode, an implementation report must already exist (last round will be extended). `A{n}` always means **audit-triggered refinement**.

## Instructions for user

- **Minimal case**: Just say `/implement` — skill will infer current feature and plan from chat.
- **With FEATURE_ID**: Provide feature ID if context is unclear.
- **Mode**: Default is plan execution. To run **refinement** (bug fixes, follow-up work by request): indicate that you want follow-up work or bug fixes on current implementation; the Developer will perform the work and record progress in the **last** Implementation Round's **Out-of-Plan Work** only — no new round is created.
- **Audit fixes**: Use `/implement ... A{n}` after `/audit` returns `needs-fixes`; this keeps `/implement` active and records audit follow-up in the current implementation report.
- **Gate check**: Skill will verify review pass (Verdict: READY) before executing.

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
   - Explicit plan path arg (e.g. `{feature-dir}/plans/{plan-slug}.plan.md`)
   - Feature directory structure (find `plans/` directory in feature folder)
   - If multiple plans exist: default to most recent approved (review pass), or **prompt user** which plan
   - If exactly one plan exists: use it

3. **Extract trigger reference** from remaining args:
   - `A{n}` → Audit Round n; this is audit-triggered refinement and MUST load `reports/{plan-slug}.audit.md`
   - `I{n}` → Implementation Round n; use only as context for refinement if explicitly supplied
   - No trigger → continue with normal mode detection

4. **Determine mode**:
   - **Plan execution**: default when no prior implementation report exists, or after replan (new plan version)
   - **Refinement**: user explicitly requests bug fixes or follow-up work on current implementation
   - **Audit-triggered refinement**: trigger is `A{n}`; never create a new implementation round

   If ambiguous: **Prompt user** whether this is plan execution or refinement work.

### Gate Logic (HARD GATE — must read file before proceeding)

5. **You MUST read the actual file** `{feature-dir}/reports/{plan-slug}.review.md` from disk. Do NOT assume it exists based on chat history or inference.
6. Parse review file for `Verdict: READY` (search for line starting with `Verdict:`).
7. If no review file exists:
   - Output error: _"Cannot implement: review file not found at `reports/{plan-slug}.review.md`. Run `/review` first."_
   - **STOP immediately. Do NOT run `/review`, do NOT proceed, do NOT fall back to any other action.**
8. If review file exists but verdict is not READY:
   - Output error: _"Cannot implement: plan must have review pass (Verdict: READY). Current verdict: {verdict}. Run `/review` or `/replan` first."_
   - **STOP immediately.**
9. If trigger is `A{n}`:
   - **You MUST read the actual file** `{feature-dir}/reports/{plan-slug}.audit.md` from disk.
   - Search for audit round/source `A{n}` and parse the audit verdict.
   - If audit file or `A{n}` section/source is missing: output error and **STOP immediately**. Do NOT infer from chat or continue with a different audit round.
   - If verdict is not `needs-fixes`: output error and **STOP immediately**. Use `/replan` for `plan-fix` or `re-plan`; use `/retro`/finish for `ready`.
   - If `{feature-dir}/notes/{plan-slug}.problems.md` exists, read it. If audit mentions a problems file but it is missing, document the missing file as a blocker and STOP unless the audit findings are fully present in the audit report.
10. If review pass confirmed (Verdict: READY) and audit trigger gate passes when applicable: proceed to Mandatory context load.

### Mandatory Context Load (before execution)

1. Check if `{feature-dir}/reports/{plan-slug}.implementation.md` exists.
2. If it exists — read the `## Developer Retrospective` section and extract all `### I{n} — {date}` blocks.
3. Extract key learnings, known pitfalls, and `[risk]` entries from those sections.
4. Use this as context for the current implementation round — do NOT repeat mistakes already documented in previous rounds, and use `[risk]` entries to anticipate likely problems.

If no implementation report exists yet (first round) — skip this step and proceed to Delegation.

**Context documents** (optional, if plan has `## Contexts` section):

5. If the plan lists contexts in `## Contexts`, read those context documents from `{feature-dir}/contexts/`.
6. Note which context information is relevant to the current plan steps — this may be referenced in `### Contexts consulted` per Implementation Round.

**Audit-triggered refinement context** (required for `A{n}`):

7. Read the full audit round/source `A{n}` from `reports/{plan-slug}.audit.md`.
8. Extract failed acceptance criteria, implementation quality concerns, risk re-evaluation items, and audit next steps.
9. Read `notes/{plan-slug}.problems.md` when present and map each problem to concrete follow-up work, validation evidence, or documented non-action.
10. Use audit findings as the primary refinement scope. Do not broaden beyond audit findings unless the user explicitly asks for additional custom work.

### Mode Reference

- **Plan execution** (default): Execute plan steps, run validation, append a new `## Implementation Round I{n}`. **One plan version → at most one implementation round**: each plan version (v{N}) may appear only once in the compatibility table; the next implementation run is for the next plan version after replan.
- **Refinement**: User requests follow-up work (bug fixes, small changes) with **no new plan version**. Developer performs the work and records all progress in the **last** `## Implementation Round I{n}`'s **Out-of-Plan Work** section (append entries). No new round is created; Plan Version in the compatibility table stays unchanged. Static sections (Summary, Files Changed, Commands Executed, etc.) are updated to reflect the refinement work.
- **Audit-triggered refinement (`A{n}`)**: Same report-writing behavior as refinement mode, but scope is driven by audit findings and `notes/{plan-slug}.problems.md`. Do not create a new implementation round; append A{n} follow-up work to the active/last `I{round}`.

---

## Execution Context

**CRITICAL — Execution context**: When the user invokes `/implement` directly (inline mode, no "loop" or "auto"), execute the Developer work **in the current context** — you ARE the Developer. Do **NOT** launch a subagent. Subagent delegation for `/implement` happens ONLY in loop/auto mode (user said "loop", "auto", or invoked `/loop`).

**In loop/auto mode only**: Delegate to Developer subagent via the Task tool with `subagent_type="developer"` or equivalent.

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
> **Refinement mode** (when user requested bug fixes or follow-up work, including audit-triggered `A{n}` work): Do not create a new `## Implementation Round I{n}`. Perform the requested work, then **append** all changes to the **last** existing round's **Out-of-Plan Work** (add new bullet entries). Update static sections (Summary, Files Changed, Commands Executed, Validation, Results, Open Issues, etc.) to reflect the refinement. Plan Version in the compatibility table stays unchanged.
>
> **Custom continuation rule**: Any custom user request handled while `/implement` is active MUST be reflected in `{feature-dir}/reports/{plan-slug}.implementation.md`. Record file edits, validation-only work, decisions not to act, blockers, and user-requested scope changes in the active implementation report before completing the turn.
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

### Next-step chooser and active continuation

After emitting Developer Response, halt and wait for the user's next input. The response must end with:

```markdown
---
**Active context**: role: Developer · feat: {feat-id} · plan: {plan-slug} · implementation: I{round} · mode: {execute | refine | validate} · skill: /implement
```

Use `mode: execute` for primary plan execution work, `mode: refine` for in-round follow-up or audit-driven refinement on the active implementation round, and `mode: validate` when the current turn is focused primarily on validation evidence, report closure, or validation-only follow-up.

When the next user input is exactly one of the offered chooser keys:

- **`[a]` / `a`** (completed or partial): launch an **Architect** subagent ([architect.md](../../agents/architect.md)) with `/audit {feature-dir}/reports/{plan-slug}.implementation.md I{round}`. Pass the implementation report path and active round as context. If subagent launch is unavailable, print only the copyable `/audit` command from the response template and stop.
- **`[r]` / `r`** (partial or blocked): launch an **Architect** subagent ([architect.md](../../agents/architect.md)) with `/replan {feature-dir}/plans/{plan-slug}.plan.md I{round}`. Pass the implementation report path, active round, and blockers/deviations as context. If subagent launch is unavailable, print only the copyable `/replan` command from the response template and stop.
- **`[q]` / `q`**: run the QA validation guidance flow below.
- Any key not offered for the current implementation status: reprint the valid chooser keys for that status and stop.

Do not treat arbitrary custom user messages as chooser input. If the user writes a normal instruction instead of a chooser key, stay in `/implement` mode, keep `{feature-dir}/reports/{plan-slug}.implementation.md` as the active implementation document, do the requested follow-up work when in scope, and keep appending/updating the report in the active implementation round (`I{round}`) rather than starting an unrelated workflow. In refinement mode, extend the last round's Out-of-Plan Work and static summary sections; do not create a new round unless the plan version or validation pass semantics require one.

**Mandatory report reflection for custom work**: Every custom continuation under `/implement` must update the implementation report before the turn is complete, even when no files changed. Record the action as Out-of-Plan Work, Validation, Open Issue, or a Developer note as appropriate. If the request is refused or out of scope, record the reason in the report when an active implementation document exists.

**Mandatory footer for every `/implement` response**: If feature, plan, and implementation round are known, every response while `/implement` is active must end with the active context footer, including refinement summaries, blockers, validation-only updates, clarification requests, and error responses. Do not omit the footer just because the response is short or custom. The footer must include the operational mode (`execute`, `refine`, or `validate`) that best matches the current turn.

### QA validation guidance flow

The QA validation guidance is not a formal QA approval and not an audit. It is a Developer-facing assessment of what validation or test work is missing or weak, including gaps the plan did not explicitly call out.

When the user chooses `[q]` after an implementation round:

1. Launch **QA Automation** as a subagent ([qa-automation.md](../../agents/qa-automation.md), `subagent_type="qa-automation"`) with the feature doc, plan path, implementation report path, changed files, validation results, and implementation round `I{round}`.
2. Ask QA Automation to assess whether the implementation has enough validation to prove the plan was implemented correctly.
3. Allow QA Automation to identify validation gaps even when the plan did not explicitly require those checks.
4. Require QA Automation to return a concise Markdown assessment for Developer with missing validation or weak evidence, recommended test/verification follow-up, risk if left unverified, and priority/severity. QA Automation returns assessment only, not edits.
5. Developer decides what to accept as implementation follow-up.
6. If accepted, Developer either performs the follow-up work in the active `/implement` context or records it as a documented remaining issue/deviation if not feasible now.
7. Append a Developer-authored summary under the same implementation round:

```markdown
### QA Validation Guidance

- **Source**: QA Automation assessment for I{round}
- **Accepted Follow-ups**: {count}
- **Implemented Follow-ups**: {count}
- **Remaining Validation Gaps**: {count}
- **Summary**:
  - {Developer-authored summary of accepted QA guidance and action taken}
```

8. Do not paste raw QA output verbatim into the implementation report.
9. Re-run workflow-doc validation for the implementation report after appending QA validation guidance.

## Validation (before completing)

- **Workflow-doc validation (Validator subagent)**: After `reports/{plan-slug}.implementation.md` is updated on disk, launch a **Validator subagent** in a **separate context**. Use the **handoff prompt** in [/validate skill](../validate/SKILL.md) § Validator subagent (delegation): **absolute** `{ABS_PATH_TO_VALIDATE_SKILL}` and **absolute** path to the implementation report. **Do not** complete until **exit `0`**.
  - **(Concrete tooling — if “spawn a Validator subagent” is unclear in your host)** Start a **separate delegated task** (e.g. Cursor **Task**) so validation runs **outside** this Developer thread — commonly `subagent_type="generalPurpose"` or the same type your [/loop skill](../loop/SKILL.md) uses for one-shot handoffs. Delegated body = **only** the filled **handoff prompt** from [/validate skill](../validate/SKILL.md) § Validator subagent; **do not** paste implementation report text, command transcripts, or step results — only validation instructions.
  - **When `/loop` already documented successful validation** for this revision, you may skip nested Validator — state that.
  - **Inline fallback** (no subagent): open the validate skill and complete **one** run **as defined in that skill**; label **inline fallback**.
- Verify report includes all required top-level sections (Summary, Steps Executed, Files Changed, Commands Executed, Validation, Results, Deviations, Open Issues)
- Verify Plan–Implementation Compatibility table is present and up to date
- Verify all deviations from plan are documented with reasons
- Verify validation commands from plan were run (plan execution mode) — if NOT run, the round is NOT complete:
  - Steps with unrun validation must be marked `partial` in Step Results table
  - Developer must attempt to run them before closing the round
  - If environment prevents running (e.g. no Docker, no network), document as PROBLEM entry with environment reason — but still attempt all other validations
- Verify report contains `## Implementation Round I{n}` for each validation run (refinement mode: no new round; only last round's Out-of-Plan Work extended)
- For `A{n}` audit-triggered refinement: verify audit file was read, audit verdict is `needs-fixes`, problems file was read when present, and A{n} follow-up is documented in the implementation report.
- For any custom continuation under active `/implement`: verify the implementation report reflects the custom work or refusal before completing.
- Verify Developer Retrospective and Developer Observations are located **before** the round sections
- Verify report follows [implementation-format.md](../workflow/references/implementation-format.md)
- Verify ordering: the last `## Implementation Round` section is the current `I{n}` and rounds increase monotonically (`I1, I2, … I{n}`) with no out-of-order inserts.
- Verify structured chat response includes status-aware `## Next Steps` and the active implementation footer from [response-formats.md](../workflow/references/response-formats.md).
- Verify every `/implement` response with known context ends with `**Active context**: role: Developer · feat: {feat-id} · plan: {plan-slug} · implementation: I{round} · skill: /implement`.

See also: Requires [/review skill](../review/SKILL.md) verdict READY before executing.
