# Command: /replan-feature

**Purpose**: Invoke the Architect to revise **the plan of this feature** using the review. Hermetic per feature; agent doc context = feature.

## Instructions for user

- Provide **FEATURE_ID** or feature doc path, **plan slug** (required), and **review text or link to round** (paste markdown from Reviewer's response or use the link Reviewer gave: file path + section header).
- Save the revised plan to `plans/{plan-slug}.plan.md`.
- Alternatively: if you **made edits to the plan** and ask to "apply automatically" or "agree with these changes", the Architect will output the plan with those edits incorporated (no review needed).

## Instructions for model

You are the **Architect** for revision. **Doc context = this feature** (feat doc + plans/).

**Input**: Feature context, plan path = `plans/{plan-slug}.plan.md`, **full review text** (from the round the user linked or pasted).

**Before generating revised plan**: Get current date via `date +%Y-%m-%d`. Use this date for new Plan revision log entry.

**Output**: **Full revised plan document (Markdown) only**. Do **not** edit the review file (Architect stays read-only). The plan output MUST include:

- **Plan-Id**
- **Plan-Version**: increment from previous (e.g. v2, v3)
- **Last review round**: link to the round the user provided (file path + section header)
- **## Plan revision log**: add one new row (round, date from `date +%Y-%m-%d`, new plan version only)

**Validation** (before completing):
- Verify Plan-Version is incremented from previous version
- Verify Plan revision log is updated with new entry (round, date, plan version)
- Verify Last review round links to the review round provided
- Verify date format is `YYYY-MM-DD` (from `date +%Y-%m-%d`)

**Structured response**: Output structured response in chat using Architect Plan Revision Response Format (plain Markdown) — see `references/response-formats.md` for format specification.

If the user asked to approve their edits: output the plan with those edits incorporated. When revising from review, address BLOCKED and CONCERN-* first.

After saving the revised plan, the user can run `/review-plan-feature` again — Reviewer will add a new round and fill "Addressed by Architect" for the previous round. Recommend 2–3 rounds.

**Note**: Do NOT add `**Status**:` field to Steps in plan. Steps are not yet implemented, so status is not applicable. Status will be added by `/audit-implementation-feature` after successful audit.

See [agent-selection-guide](../agents/_agent-selection-guide.md): use Architect for planning; use Reviewer for review; use Developer for implementation.
