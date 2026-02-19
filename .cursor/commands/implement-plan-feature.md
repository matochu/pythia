# Command: /implement-plan-feature

**Purpose**: Delegate to Developer subagent to execute plan and create implementation report. Hermetic per feature; agent doc context = feature.

## Instructions for user

- Provide **FEATURE_ID** or path to feature doc and **plan slug** (e.g. `1-agents-commands-data-exchange` for plan `1-agents-commands-data-exchange.plan.md`).
- **Gate check**: Command will verify review pass before proceeding.

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

---

## Round Lifecycle

**One round = one plan version.** A round starts when the Developer begins executing a plan version and ends only when a new plan version (updated by the Architect) is received.

- Within one round, multiple validation runs may occur — each appends a new `## Implementation Round I{n}` section
- All `I{n}` sections within the same plan version are **continuations of the same round**, not separate rounds
- Do NOT treat repeated test runs or debug iterations as new rounds — they are amendments to the current round
- A new round begins only when the plan version number changes

**Example**: If you run tests, fix an issue, and run tests again — that is still Round I1 (two `I{n}` entries, same plan version). Only after the Architect updates the plan (v2) does Round I2 begin.

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
> - Always run validation commands from the plan (or explain why not)
> - After each validation run, append a new `## Implementation Round I{n}` section (see below)
> - Rounds are append-only — never delete previous rounds
>
> **Implementation Round** (append after each validation run):
> - Step Results table (done/partial/failed per step)
> - Issues: structured BLOCKER/PROBLEM entries with evidence + root cause hypothesis
> - Contexts consulted (optional): if context documents were consulted during this round, list them with links
> - Out-of-Plan Work: **mandatory** — document ALL changes made outside plan steps, including:
>   - File edits, config tweaks, or code changes not described in any plan step
>   - Debug scripts, extra test runs, logging added temporarily
>   - Dependency or environment changes
>   - Workarounds and stabilisation patches applied "on the fly"
>   - Format: `- [type] description → reason → result`
>   - **Purpose**: Architect reads this to understand real changes — omissions cause plan drift and missed review
>   - If nothing was done outside the plan: write `Out-of-Plan Work: none`
>
> **Developer Retrospective** (top-level section, NOT inside the round):
> - After each round, append `### I{n} — {YYYY-MM-DD}` block to `## Developer Retrospective` at the bottom of the file
> - Append-only — never delete previous blocks
> - Labels: `[codebase]`, `[tooling]`, `[plan]`, `[process]`, `[risk]`
> - Mirrors `## Architect Retrospective` in the plan file
>
> See full format: `references/implementation-format.md`

---

## Plan–Implementation Compatibility Table

The implementation report MUST include a compatibility table in the top-level header block (after Date/Plan lines):

```markdown
## Plan–Implementation Compatibility

| Implementation Round | Plan Version | Date       | Result              |
|----------------------|--------------|------------|---------------------|
| I1                   | v{N}         | YYYY-MM-DD | N passed / M failed |
| I2                   | v{N+1}       | YYYY-MM-DD | N passed / M failed |
```

- Each row is added when a new `## Implementation Round I{n}` is written
- **Plan Version** = the plan version that was active when this round was executed
- **Result** = summary outcome (test count, build status, etc.)
- Table is append-only — rows are never deleted

---

## Output

1. **Implementation report** written to `{feature-dir}/reports/{plan-slug}.implementation.md` per `references/implementation-format.md`.
2. **Structured response** in chat using Developer Response Format — see `references/response-formats.md`.

## Validation (before completing)

- Verify report includes all required top-level sections (executed steps, files changed, commands executed, results, deviations, open issues)
- Verify Plan–Implementation Compatibility table is present and up to date
- Verify all deviations from plan are documented with reasons
- Verify validation commands from plan were run (or explanation why not)
- Verify report contains `## Implementation Round I{n}` for each validation run
- Verify report follows `references/implementation-format.md`

See [agent-selection-guide](../agents/_agent-selection-guide.md): use Developer for implementation; use Architect for planning and audit.
