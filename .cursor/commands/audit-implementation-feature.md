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
5. **Decision**: ready | needs fixes | re-plan.

---

## Output

1. **Architect audit report** written to `{feature-dir}/reports/{plan-slug}.audit.md` per `references/audit-format.md`.
2. **Structured response** in chat using Architect Audit Response Format — see `references/response-formats.md`.
3. **Plan update** (if decision is "ready"): Update plan file `plans/{plan-slug}.plan.md`:
   - Change `Status` from "In Progress" to "Implemented"
   - Add `**Status**: done` to each Step that was completed (based on implementation report)
   - Mark all acceptance criteria checkboxes as `[x]` if they were met
   - Keep plan metadata (Plan-Version, Last review round) unchanged
4. **Feature document update** (if decision is "ready"): Update feature document `{feature-dir}/{feature-id}.md`:
   - Find section "## Detailed Implementation Plans (External)" → "**Existing External Plans:**"
   - If plan NOT listed: Add new entry with format: `- [{plan title}](plans/{plan-slug}.plan.md) — {description}. **Status: Implemented**`
   - If plan IS listed: Update existing entry to add `**Status: Implemented**` at the end
5. **Commit message** (if decision is "ready"): Generate a git commit message based on the implementation report and output it in the structured response:
   - **Subject line**: `feat: {1-sentence summary of what was implemented}` — derive from plan title + `## Steps Executed` summary; max 72 chars
   - **Body**: bullet list from `## Steps Executed` in implementation report (each step → one bullet, imperative mood)
   - **Footer**: `Plan: {plan-slug}` and `Files: {count of unique files from ## Files Changed}`
   - Format as a fenced code block so user can copy directly
   - Do NOT include implementation round details, command lists, or audit verdict in the commit message
6. **Final decision** to user: ready | needs fixes | re-plan

---

## Validation (before completing)

- Verify audit report includes conformance assessment (done | partial | no)
- Verify acceptance criteria are checked (met count/total)
- Verify risk re-evaluation is included
- Verify decision (ready | needs fixes | re-plan) with reasoning
- Verify report follows `references/audit-format.md`
- **If decision is "ready"**: Verify plan file is updated:
  - Status changed to "Implemented"
  - Steps have status markers (`**Status**: done`)
  - Acceptance criteria checkboxes marked as `[x]` for met criteria
- **If decision is "ready"**: Verify feature document is updated:
  - Plan added/updated in "Existing External Plans" section
  - Plan entry includes `**Status: Implemented**` marker
- **If decision is "ready"**: Verify commit message is present in structured response:
  - Subject line starts with `feat:` and is ≤ 72 chars
  - Body bullets match `## Steps Executed` from implementation report
  - Formatted as a fenced code block

See [agent-selection-guide](../agents/_agent-selection-guide.md): use Architect for planning and audit; use Developer for implementation.
