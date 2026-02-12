# Command: /implement-plan-feature

**Purpose**: Delegate to Developer subagent to execute plan and create implementation report. Hermetic per feature; agent doc context = feature.

## Instructions for user

- Provide **FEATURE_ID** or path to feature doc and **plan slug** (e.g. `1-agents-commands-data-exchange` for plan `1-agents-commands-data-exchange.plan.md`).
- **Gate check**: Command will verify review pass before proceeding.

## Instructions for model

**Gate Logic** (execute before delegating to Developer):

1. Check if `{feature-dir}/notes/{plan-slug}.review.md` exists in feature directory.
2. Parse review file for `Verdict: READY` (search for line starting with `Verdict:`).
3. If no review file exists:
   - Return error: "Cannot implement: plan must have review pass (Verdict: READY). Run /review-plan-feature first or complete review cycle."
   - Do not proceed to Developer subagent.
4. If review file exists but verdict is not READY:
   - Return error: "Cannot implement: plan must have review pass (Verdict: READY). Current verdict: {verdict}. Run /review-plan-feature first or complete review cycle."
   - Do not proceed to Developer subagent.
5. If review pass confirmed (Verdict: READY):
   - Proceed to delegate to Developer subagent.

**Action** (only if gate passes): Delegate to Developer subagent via `/developer`. **Doc context = this feature** (feat doc + plans/ + notes/ + reports/).

**Input**: Feature context + **plan slug** (required). Plan path = `plans/{plan-slug}.plan.md`.

**Output**:

1. **Implementation report** written to `{feature-dir}/reports/{plan-slug}.implementation.md` per format specification (see Plan 3 Step 7).
2. **Structured response** in chat using Developer Response Format (plain Markdown) — see `references/response-formats.md` for format specification.

**Validation** (before completing):
- Verify implementation report includes all required sections (executed steps, files changed, commands executed, results, deviations, open issues)
- Verify all deviations from plan are documented with reasons
- Verify validation commands from plan were run (or explanation why not)
- Verify report follows `references/implementation-format.md` specification

**Developer constraints**:
- Execute only PLAN.md
- Do NOT change plan
- If something blocks — document in Deviations section of report
- Always run validation commands from plan (or explain why not)
- Only output: `{feature-dir}/reports/{plan-slug}.implementation.md`

See [agent-selection-guide](../agents/_agent-selection-guide.md): use Developer subagent for implementation; use Architect for planning and audit.
