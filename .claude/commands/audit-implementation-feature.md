# Command: /audit-implementation-feature

**Purpose**: Invoke Architect to audit Developer's implementation report and provide final decision. Hermetic per feature; agent doc context = feature.

## Instructions for user

- Provide **FEATURE_ID** or path to feature doc and **plan slug** (e.g. `1-agents-commands-data-exchange`).
- Implementation report should exist at `{feature-dir}/reports/{plan-slug}.implementation.md`.

## Instructions for model

You are the **Architect**. **Doc context = this feature** (feat doc + plans/ + notes/ + reports/).

**Input**: Feature context + **plan slug** (required). Implementation report path = `reports/{plan-slug}.implementation.md`. Plan path = `plans/{plan-slug}.plan.md`.

**Output**:

1. **Architect audit report** written to `{feature-dir}/reports/{plan-slug}.audit.md` per format specification (see Plan 3 Step 7).
2. **Structured response** in chat using Architect Audit Response Format (plain Markdown) — see `.claude/skills/architecture-workflow/references/response-formats.md` for format specification.
3. **Plan update** (if decision is "ready"): Update plan file `plans/{plan-slug}.plan.md`:
   - Change `Status` from "In Progress" to "Implemented"
   - Add `**Status**: done` to each Step that was completed (based on implementation report)
   - Mark all acceptance criteria checkboxes as `[x]` if they were met (based on audit report)
   - Keep plan metadata (Plan-Version, Last review round) unchanged
4. **Feature document update** (if decision is "ready"): Update feature document `{feature-dir}/{feature-id}.md`:
   - Find section "## Detailed Implementation Plans (External)" → "**Existing External Plans:**"
   - Check if plan is already listed (search for plan-slug or Plan Number in list)
   - If plan NOT listed: Add new entry with format: `- [Plan {Number}: {Title}](plans/{plan-slug}.plan.md) — {description from plan Problem Analysis or Goal section}. **Status: Implemented**`
   - If plan IS listed: Update existing entry to add `**Status: Implemented**` at the end (or replace existing status if present)
   - Extract plan title from plan file: `# Plan {Number}: {Title}` → use as link text
   - Extract description from plan's Problem Analysis or Goal section (1-2 sentences summary)
   - Format: `- [Plan {Number}: {Title}](plans/{plan-slug}.plan.md) — {description}. **Status: Implemented**`
5. **Final decision** to user: ready | needs fixes | re-plan

**Validation** (before completing):
- Verify audit report includes conformance assessment (done | partial | no)
- Verify acceptance criteria are checked (met count/total)
- Verify risk re-evaluation is included
- Verify decision (ready | needs fixes | re-plan) with reasoning
- Verify report follows `references/audit-format.md` specification
- **If decision is "ready"**: Verify plan file is updated:
  - Status changed to "Implemented"
  - Steps have status markers (`**Status**: done`)
  - Acceptance criteria checkboxes marked as `[x]` for met criteria
- **If decision is "ready"**: Verify feature document is updated:
  - Plan added/updated in "Existing External Plans" section
  - Plan entry includes `**Status: Implemented**` marker
  - Plan entry format is correct (link, description, status)

**Audit format**: See Plan 3 Step 7 for Architect Audit format specification:
- Conformance: done | partial | no
- Acceptance criteria check
- Risk re-evaluation
- Decision: ready | needs fixes | re-plan

See [agent-selection-guide](../agents/_agent-selection-guide.md): use Architect for planning and audit; use Developer for implementation.
