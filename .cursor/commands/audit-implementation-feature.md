# Command: /audit-implementation-feature

**Purpose**: Invoke Architect to audit Developer's implementation report and provide final decision. Hermetic per feature; agent doc context = feature.

## Instructions for user

- Provide **FEATURE_ID** or path to feature doc and **plan slug** (e.g. `1-agents-commands-data-exchange`).
- Implementation report should exist at `{feature-dir}/reports/{plan-slug}.implementation.md`.

## Instructions for model

You are the **Architect**. **Doc context = this feature** (feat doc + plans/ + notes/ + reports/).

**Input**: Feature context + **plan slug** (required). Implementation report path = `reports/{plan-slug}.implementation.md`. Plan path = `plans/{plan-slug}.plan.md`.

---

## Mandatory context load (before audit)

1. Read `plans/{plan-slug}.plan.md` — section `## Architect Retrospective`. Extract all `### v{N} — {round-ref} — {date}` blocks. Use as context — especially `[risk]` entries to know what issues were anticipated.
2. Read `reports/{plan-slug}.implementation.md` — section `## Developer Retrospective`. Extract all `### I{n} — {date}` blocks. Use as context — know what the Developer learned and what risks were flagged.
3. Use both to inform the audit — assess whether known risks materialized and whether Developer learnings are reflected in the outcome.
4. **Context documents**: If the plan lists contexts in `## Contexts`, read those context documents from `{feature-dir}/contexts/`. Note any requirements defined there — these will be checked in the Audit Process (step 4a below).

---

## Audit Process

1. **Read implementation report**: Extract all `## Implementation Round I{n}` sections — step results, issues, out-of-plan work.
2. **Compare against plan**: Check each plan step against implementation round results.
3. **Check acceptance criteria**: For each criterion in plan — met / not met / partial.
4. **Re-evaluate risks**: Which plan risks materialized? Which were mitigated?
   - **4a. Context conformance** (if contexts exist): If feature has context documents with requirements (loaded in Mandatory context load step 4) — check that the implementation conforms to those requirements. Flag any non-conformance as a finding. Non-conformance with a requirement context is grounds for "needs fixes" or "re-plan" verdict.
5. **Implementation quality check** (mandatory): Review the **actual code changes** listed in the implementation report (`## Files Changed`). Read the modified files (or relevant diffs) and assess:
   - **Test/criteria integrity**: Code that only satisfies tests or acceptance criteria for narrow or specific cases; logic that bypasses or stubs tests; hardcoded outcomes for "passing" scenarios; missing or shallow handling of edge cases and errors. Flag as finding if present.
   - **Maintainability**: Alignment with `references/implementation-quality-guidelines.md` — defensive code, explicit error handling, logging, tests that verify behavior (not implementation), no swallowed errors or unsafe assumptions. Code that is brittle, hard to extend, or violates project conventions. Flag as finding if present.
   - **Architecture & design**: KISS, DRY; **layering**: higher-level / core must not depend on concrete extension points or lower-level components by name or identity — only on abstractions or contracts (otherwise renaming or removing a dependency breaks the system). No **magic strings** that should be parameters or config. **Correct abstraction**: no context- or environment-specific workarounds baked into production code (they mask the real problem). **Explicit contracts**: behavior (e.g. where data is read from, which branch is taken) must be driven by explicit API/contract, not implicit rules that depend on one specific name or case. Apply this especially to **out-of-plan** changes — give an explicit architectural assessment for each; violations can justify "needs fixes" or "re-plan".
   - **Verdict for this step**: pass | concerns | fail. "Concerns" or "fail" must be reflected in the audit report and can justify "needs fixes" (or "re-plan" if severe).
6. **Decision**: ready | needs-fixes | plan-fix | re-plan.

   **`plan-fix` conditions** (all must be true):
   - Implementation faithfully executed the spec — developer made no mistake
   - Error originated in the plan (wrong assumption, bad step spec, incorrect reference)
   - ≤ 2 steps need amendment, approach stays the same
     If any is false → use `re-plan`.

---

## Output

1. **Architect audit report** written to `{feature-dir}/reports/{plan-slug}.audit.md` per `references/audit-format.md`.
2. **`problems.md`** (if verdict ≠ `ready`): write `{feature-dir}/notes/{plan-slug}.problems.md` per the `problems.md` format in `references/audit-format.md`. This is the primary handoff document to the next agent (fixer / replanner). Include one AC block per non-passing criterion.
3. **Structured response** in chat using Architect Audit Response Format — see `references/response-formats.md`.
4. **Plan update** (if decision is "ready"): Update plan file `plans/{plan-slug}.plan.md`:
   - Change `Status` from "In Progress" to "Implemented"
   - Add `**Status**: done` to each Step that was completed (based on implementation report)
   - Mark all acceptance criteria checkboxes as `[x]` if they were met
   - Keep plan metadata (Plan-Version, Last review round) unchanged
5. **Feature document update** (if decision is "ready"): Update feature document `{feature-dir}/{feature-id}.md`:
   - Find section "## Detailed Implementation Plans (External)" → "**Existing External Plans:**"
   - If plan NOT listed: Add new entry with format: `- [{plan title}](plans/{plan-slug}.plan.md) — {description}. **Status: Implemented**`
   - If plan IS listed: Update existing entry to add `**Status: Implemented**` at the end
6. **Commit message** (if decision is "ready"): Generate a git commit message based on the implementation report and output it in the structured response:
   - **Subject line**: `feat: {1-sentence summary of what was implemented}` — derive from plan title + `## Steps Executed` summary; max 72 chars
   - **Body**: bullet list from `## Steps Executed` in implementation report (each step → one bullet, imperative mood)
   - **Footer**: `Plan: {plan-slug}` and `Files: {count of unique files from ## Files Changed}`
   - Format as a fenced code block so user can copy directly
   - Do NOT include implementation round details, command lists, or audit verdict in the commit message
7. **Final decision** to user: ready | needs-fixes | plan-fix | re-plan

### Post-audit loop continuation

If the user invoked this command in **loop mode** (said "loop" or "auto", or called `/run-feature-plan-loop`), continue automatically after writing the audit artifacts:

| Verdict       | Action                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ready`       | Report DONE. Output commit message. Stop.                                                                                                                                                                                                                                                                                                                                                 |
| `needs-fixes` | Spawn **Developer subagent** (refinement mode) using `problems.md`. Wait. Then spawn **fresh Architect subagent** for re-audit. Max 2 `needs-fixes` iterations total.                                                                                                                                                                                                                     |
| `plan-fix`    | Architect (current context) reads `problems.md` and patches plan: amend affected steps with `**Amended**: v{N} (A{n})` marker, increment Plan-Version, add revision log entry (trigger: Audit A{n}). Then spawn **Developer subagent** (re-implement). Then spawn **fresh Architect subagent** for re-audit. Max 1 `plan-fix` iteration; if second audit ≠ ready → escalate to `re-plan`. |
| `re-plan`     | Report BLOCKED. Do not auto-continue — re-plan requires user-assisted scope decision unless user explicitly delegated full authority.                                                                                                                                                                                                                                                     |

**Fresh-session constraint:** The re-audit subagent must be a different subagent instance from the Developer that just ran. Never re-audit in the same context that just implemented.

---

## Validation (before completing)

- Verify audit report includes conformance assessment (done | partial | no)
- Verify **implementation quality check** is present (pass | concerns | fail) with concrete findings if concerns/fail
- Verify acceptance criteria are checked (met count/total)
- Verify risk re-evaluation is included
- Verify decision (ready | needs-fixes | plan-fix | re-plan) with reasoning
- Verify report follows `references/audit-format.md`
- **If decision ≠ `ready`**: Verify `problems.md` is written to `{feature-dir}/notes/{plan-slug}.problems.md`
- **If decision is `plan-fix`**: Verify only `plan-fix` conditions are met (≤ 2 steps, implementation faithfully followed wrong spec)
- **If decision is "ready"**: Verify plan file is updated:
  - Status changed to "Implemented"
  - Steps have status markers (`**Status**: done`)
  - Acceptance criteria checkboxes marked as `[x]` for met criteria
- **If decision is "ready"**: Verify feature document is updated:
  - Plan added/updated in "Existing External Plans" section
  - Plan entry includes `**Status: Implemented**` marker
- **If decision is "ready"**: Verify suggested commit message is present in structured response:
  - Subject line starts with `feat:` and is ≤ 72 chars
  - Body describes repo changes (imperative bullets); aligned with implementation where applicable
  - **No** plan slug, plan number, `.pythia/`, or workflow-only paths in the message
  - Formatted as a fenced code block

See [agent-selection-guide](../agents/_agent-selection-guide.md): use Architect for planning and audit; use Developer for implementation.
