# Command: /replan-feature

**Purpose**: Invoke the Architect to revise **the plan of this feature** using the review or implementation issues. Hermetic per feature; agent doc context = feature.

## Instructions for user

- Provide **FEATURE_ID** or feature doc path, **plan slug** (required), and one of:
  - **Review text or link to round** — paste markdown from Reviewer's response or use the link Reviewer gave (file path + section header).
  - **Implementation issues** — reference `## Implementation Round R{n}` section from `reports/{plan-slug}.implementation.md`.
- Save the revised plan to `plans/{plan-slug}.plan.md`.
- Alternatively: if you **made edits to the plan** and ask to "apply automatically" or "agree with these changes", the Architect will output the plan with those edits incorporated (no review needed).

## Instructions for model

You are the **Architect** for revision. **Doc context = this feature** (feat doc + plans/).

**Input**: Feature context, plan path = `plans/{plan-slug}.plan.md`, **full review text OR implementation round section** (from the round the user linked or pasted).

**Mandatory context load** (before any analysis):

1. Read `plans/{plan-slug}.plan.md` — section `## Architect Retrospective`
2. Extract all existing blocks (keyed by `### v{N} — {round-ref} — {date}`)
3. Use this as context for the current replan — do NOT repeat issues already identified in previous blocks, and use `[risk]` entries to anticipate likely problems in this round

**Trigger detection**: Before starting, determine the trigger type:

- **Trigger 1: Review** — input contains Reviewer findings (`Verdict:`, `CONCERN-*`, `BLOCKED`)
- **Trigger 2: Implementation Issues** — input references `## Implementation Round R{n}` or contains BLOCKER/PROBLEM entries from implementation report
- **Trigger 3: Manual edits** — user says "apply my edits" or "agree with these changes"

---

### Trigger 1: Review-driven replan

**Review Analysis Process**:

1. **Read and analyze review findings**: Extract all concerns, findings, and recommendations from the review.
2. **Critical evaluation**: Architect must critically evaluate each review finding:
   - **Verify validity**: Check if concerns are valid based on plan content, feature context, and technical constraints
   - **Assess impact**: Determine if addressing the concern improves the plan or introduces unnecessary complexity
   - **Consider trade-offs**: Evaluate if addressing the concern aligns with plan goals and feature objectives
   - **Check feasibility**: Verify if recommendations are technically feasible and align with project constraints
3. **Decision on each finding**:
   - **Accept**: Include changes in revised plan if finding is valid and improves the plan
   - **Reject**: Do NOT include changes if finding is invalid, out of scope, or contradicts plan objectives
   - **Modify**: Adapt recommendations if partially valid but need adjustment
4. **Document decisions**: In structured response, clearly document accepted/rejected/modified findings with reasoning.

**Critical**: Architect is NOT required to accept all review findings. Architect must exercise professional judgment and may disagree with Reviewer's recommendations if they are invalid, out of scope, or contradict plan objectives.

**Automatic Follow-up**: After saving the revised plan, **automatically invoke `/review-plan-feature`** with the same plan-slug.

---

### Trigger 2: Implementation Issues-driven replan

**Implementation Issues Analysis Process**:

1. **Read implementation round**: Extract all BLOCKER and PROBLEM entries from the referenced `## Implementation Round R{n}` section.
2. **Analyze each issue**:
   - Understand root cause hypothesis from Developer
   - Verify if the issue indicates a gap in the plan (missing step, wrong assumption, underspecified requirement)
   - Determine what new plan step(s) are needed to address the issue
3. **Decision on each issue**:
   - **New Step**: Add a new step to the plan to address the issue
   - **Amend existing step**: Clarify or extend an existing step if the issue is a specification gap
   - **Reject**: If the issue is outside plan scope or already handled
4. **Document decisions**: In structured response, for each issue indicate what plan change was made and why.

**Critical rules for implementation-driven replan**:
- **NEVER delete or replace existing steps** — only ADD new steps or amend existing ones
- **NEVER renumber or reorder existing steps** — step numbers are permanent identifiers; Step 9 remains Step 9 forever regardless of where new steps are inserted
- New steps go **after** the last existing step only — do NOT insert between existing steps (e.g. if last step is 9, new steps are 10, 11, 12…)
- Preserve full step history — old steps remain as-is even if superseded
- Every new or amended step MUST have a version marker (see Step Version Marker below)
- Plan-Version must be incremented

**Step Version Marker** (required on every new or amended step):

```markdown
### Step N: {title}

**Added**: v{N} ({round-ref})        ← for new steps
**Amended**: v{N} ({round-ref})      ← for amended steps (keep original text, add amendment note at end)
```

- `{round-ref}` = `I{n}` for implementation-driven replan, `R{n}` for review-driven replan
- Original steps (without a marker) were part of the initial plan — do NOT add markers retroactively

**No automatic follow-up**: Implementation-driven replan does NOT auto-trigger `/review-plan-feature`. The Architect decides whether a new review cycle is needed.

---

### Common Output Rules (all triggers)

**Before generating revised plan**: Get current date via `date +%Y-%m-%d`. Use this date for new Plan revision log entry.

**Output**: **Full revised plan document (Markdown) only**. Do **not** edit the review or implementation report files (Architect stays read-only on those). The plan output MUST include:

- **Plan-Id**
- **Plan-Version**: increment from previous (e.g. v2, v3)
- **Last review round**: link to the round the user provided (if Trigger 1); or `Implementation Round R{n} — {date}` (if Trigger 2)
- **## Plan revision log**: add one new row — Plan-Version, round reference, date, list of steps added/amended (e.g. `Step 9 amended, Step 12 added`), 1-line summary of what changed and why
- **## Architect Retrospective**: append a new versioned block (see below) — never delete previous blocks

**Architect Retrospective section** (append to plan after `## Plan revision log`):

```markdown
## Architect Retrospective

### v{N} — {round-ref} — {date}

- [plan] {insight about plan structure, scope, or gaps}
- [codebase] {insight about codebase behavior or constraints}
- [process] {what complicated this replan}
- [risk] {newly identified risk for next round}

"None" if no insights.
```

- One block per replan cycle, keyed by plan version + round reference
- **Append-only — add new block AFTER all existing blocks** (chronological order: oldest first, newest last)
- Never delete or reorder previous blocks
- Labels: `[plan]`, `[codebase]`, `[process]`, `[risk]` — use whichever are relevant

**Cross-reference update** (after writing plan): For each context listed in `## Contexts`, update that context file's `## Used by` section to add a link back to this plan if not already present.

**Validation** (before completing):
- Verify Plan-Version is incremented from previous version
- Verify Plan revision log is updated with new entry (version, round, date, changed steps, summary)
- Verify `## Architect Retrospective` block added to plan file for this replan cycle
- Verify date format is `YYYY-MM-DD` (from `date +%Y-%m-%d`)
- Verify each context in `## Contexts` has this plan listed in its `## Used by` section
- For Trigger 2: verify no existing steps were deleted, renumbered, or reordered
- For Trigger 2: verify every new/amended step has `**Added**` or `**Amended**` version marker

**Structured response**: Output structured response in chat using Architect Plan Revision Response Format (plain Markdown) — see `references/response-formats.md` for format specification.

**Findings / Issue Assessment** (required in structured response):

- List all findings/issues analyzed
- For each, indicate the decision using the label matching the trigger:
  - Trigger 1 (Review): **Accepted** | **Rejected** | **Modified**
  - Trigger 2 (Implementation): **New Step** | **Amended** | **Rejected**
- Provide reasoning for every non-trivial decision

**Architect Retrospective** (required in structured response summary AND saved to plan file):

The Architect reflects on what was learned or observed during this replan cycle. This content is **both** output in chat summary **and** appended to `## Architect Retrospective` in the plan file.

```markdown
### Architect Retrospective

- [plan] {insight about plan structure, scope, or gaps that became apparent}
- [codebase] {insight about codebase behavior or constraints discovered while analyzing issues}
- [process] {what slowed down or complicated this replan — e.g. ambiguous evidence, missing context}
- [risk] {newly identified risk or unknown that should be watched in next implementation round}

"None" if no new insights.
```

Labels: `[plan]`, `[codebase]`, `[process]`, `[risk]` — use whichever are relevant, skip others.

When revising from review, address BLOCKED and CONCERN-* first, but critically evaluate each one — you may reject invalid concerns.

**Note**: Do NOT add `**Status**:` field to Steps in plan. Steps are not yet implemented, so status is not applicable. Status will be added by `/audit-implementation-feature` after successful audit.

See [agent-selection-guide](../agents/_agent-selection-guide.md): use Architect for planning; use Reviewer for review; use Developer for implementation.
