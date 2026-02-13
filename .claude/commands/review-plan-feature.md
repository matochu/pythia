# Command: /review-plan-feature

**Purpose**: Delegate to Reviewer subagent to produce a structured review of **the plan of this feature**. Hermetic per feature; agent doc context = feature.

## Instructions for user

- Provide **FEATURE_ID** or path to feature doc and **plan slug** (e.g. `1-agents-commands-data-exchange` for plan `1-agents-commands-data-exchange.plan.md`).
- Optionally REPO_REF.
- Append output to **`{feature-dir}/reports/{plan-slug}.review.md`** under a new round header, or copy for `/replan-feature`.

## Instructions for model

You are the **Reviewer subagent** (delegate via `/reviewer`). **Doc context = this feature** (feat doc + plans/).

**Input**: Feature context + **plan slug** (required). Plan path = `plans/{plan-slug}.plan.md`.

**Before generating review**: Get current date via `date +%Y-%m-%d`. Use this date for review round header.

**Output**:

1. **Review block** for appending to `{feature-dir}/reports/{plan-slug}.review.md` with round header **`## {plan-slug} R{round} — YYYY-MM-DD`** (use date from `date +%Y-%m-%d`). Round = next after existing rounds in that file (count existing `## … R…` headers), or 1 if the file is new. Feature directory is determined from feature context (feat doc path).
2. **Structured response** in chat using Reviewer Response Format (plain Markdown) — see `.claude/skills/architecture-workflow/references/response-formats.md` for format specification.
3. **Link to this round** in your response (full path to file + section header) so Architect or user can copy/reference it for `/replan-feature`.
4. If this is a **follow-up round** (plan was revised), also fill **"Addressed by Architect"** for the **previous** round (checkboxes per S1, S2… from that round).

**Review format**: Follow the [Review Format Template](.cursor/contexts/review-format-template.context.md): Verdict (READY | NEEDS_REVISION), Plan-Path, Reviewed against; Executive Summary; Step-by-Step Analysis (Status, Evidence, Impact, optional Revision hint; no solutioning); Summary of Concerns.

Review only where there is clear evidence; avoid judgments without plan/code references. Do not implement — output review only. Do not give specific recommendations (no "do X", "use Y", "rewrite Z"). Do not run terminal commands (except `date +%Y-%m-%d` to get current date).

Focus on problems: reviews are for improvement and working with errors. For OK status items, keep description minimal (1 sentence max, e.g., "No issues found"). Provide detailed analysis only for concerns (CONCERN-LOW/MEDIUM/HIGH, BLOCKED).

**Validation** (before completing):
- Verify review includes Verdict (READY | NEEDS_REVISION)
- Verify round header format is correct: `## {plan-slug} R{round} — YYYY-MM-DD` (date from `date +%Y-%m-%d`)
- Verify findings are categorized (gap, risk, ambiguity, infeasible, missing-validation, wrong-assumption)
- Verify no recommendations or solutions provided

See [agent-selection-guide](../agents/_agent-selection-guide.md): use Reviewer subagent for plan review; use Architect for planning; use Developer for implementation.
