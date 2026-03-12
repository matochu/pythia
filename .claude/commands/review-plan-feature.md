# Command: /review-plan-feature

**Purpose**: Delegate to Reviewer subagent to produce a structured review of **the plan of this feature**. Hermetic per feature; agent doc context = feature. When this command is invoked as an automatic follow-up (e.g. from `/replan-feature`), the caller must have launched the Reviewer subagent; the review must not be executed in the caller’s context (see architecture-workflow Delegation policy).

## Instructions for user

- Provide **FEATURE_ID** or path to feature doc and **plan slug** (e.g. `1-agents-commands-data-exchange` for plan `1-agents-commands-data-exchange.plan.md`).
- Append output to **`{feature-dir}/reports/{plan-slug}.review.md`** under a new round header at **EOF only** (append-only; do not insert anywhere else), or copy for `/replan-feature`.

## Instructions for model

You are the **Reviewer subagent** — run in Reviewer context only (delegate via `/reviewer` so execution is in the subagent context, not in the caller’s). **Doc context = this feature** (feat doc + plans/).

**Input**: Feature context + **plan slug** (required). Plan path = `plans/{plan-slug}.plan.md`.

**Scope rule**:
- Primary focus is the current plan.
- **Related contexts are mandatory**: load and use the contexts directly related to this plan (from feature/context documents) before issuing verdict.

**Review mode selection (mandatory)**:
- Reviewer must select review depth based on round and change magnitude:
  - **Deep mode**: use full architecture due-diligence depth.
  - **Standard mode**: use baseline architecture checks, with less breadth.
- Use **Deep mode** when at least one condition is true:
  1. This is **R1** (first review for this plan).
  2. Architect update indicates **vector change** (goal/approach change), not just refinement.
  3. Architect update includes **serious structural changes** (core module boundaries, data model, integration contracts, protocol/API strategy, security model, or major step reshaping).
- If none of the above apply, use Standard mode.

**Before generating review**:
1. Get current date via `date +%Y-%m-%d`. Use this date for review round header.
2. Read the review format specification: `cat .claude/skills/architecture-workflow/references/review-format.md`. Copy the structure exactly — do NOT invent section names or field names.
3. Read the structured chat response format: `cat .claude/skills/architecture-workflow/references/response-formats.md`. Copy the Reviewer Subagent Response Format exactly — every section including `## Next Steps` is mandatory.
4. Read the review framework: `cat .claude/skills/architecture-workflow/references/plan-review-framework.md`. Use it as baseline checklist.

**Output**:

1. **Review block** for appending to `{feature-dir}/reports/{plan-slug}.review.md` with round header **`## {plan-slug} R{round} — YYYY-MM-DD`** (use date from `date +%Y-%m-%d`). Round = next after existing rounds in that file (count existing `## … R…` headers), or 1 if the file is new. Feature directory is determined from feature context (feat doc path).
2. **Update `## Navigation`** at the top of the review file: append new round entry to the Rounds line — `· [R{n} — YYYY-MM-DD — {VERDICT}](#anchor)`. Create the Navigation section if the file is new.
3. **Structured response** in chat using Reviewer Response Format (plain Markdown) — see `.claude/skills/architecture-workflow/references/response-formats.md` for format specification.
4. **Link to this round** in your response (full path to file + section header) so Architect or user can copy/reference it for `/replan-feature`.
5. If this is a **follow-up round** (plan was revised), also fill **"Addressed by Architect"** for the **previous** round (checkboxes per S1, S2… from that round).

**Review format**: Follow the [Review Format Template](.cursor/contexts/review-format-template.context.md): Verdict (READY | NEEDS_REVISION), Plan-Path; Executive Summary; Step-by-Step Analysis (Status, Evidence, Impact, optional Revision hint; no solutioning); Summary of Concerns.

**Review depth baseline (mandatory every round)**:
- This review is not only a consistency check. It is an architecture quality check of the chosen approach.
- Evaluate both **internal coherence** and **external fitness** against codebase constraints and existing architectural patterns.
- Keep scope centered on the current plan, but always include **related contexts** and directly relevant code/context needed to validate this plan.
- For medium/high/blocked concerns, provide concrete evidence from plan + codebase/context (files, symbols, references).
- For high-impact assumptions and constraints, verify against external sources (official docs/standards) and cite URLs in Evidence.
- In **Deep mode**, apply all architecture quality dimensions with full breadth and stricter evidence.

**Architecture quality dimensions** (in addition to clarity/completeness/feasibility/risks/testability):
1. **Decision quality and alternatives**
   - Check whether major decisions are justified against realistic alternatives in this codebase.
   - If alternatives are not considered where trade-offs are significant, report `gap` or `wrong-assumption`.
2. **Architecture fit (real codebase fit)**
   - Verify alignment with current modules, boundaries, ownership, and established patterns in actual code/docs.
   - If plan assumes non-existing capabilities or conflicts with current architecture, report `wrong-assumption`, `risk`, or `infeasible`.
3. **Complexity budget**
   - Evaluate whether introduced complexity is proportional to feature scope.
   - Identify over-engineering, unnecessary abstraction, or lifecycle/operational burden (`risk` or `gap`).
4. **System-level impact**
   - Evaluate likely impact on performance, reliability, security, observability, operability, and backward compatibility.
   - Missing treatment of critical system-level concerns should be reported as `risk` or `gap`.
5. **Evidence quality and source validation**
   - Validate key technical assumptions with trustworthy external sources (official documentation, language/runtime specs, standards).
   - Use external sources to challenge weak assumptions, not to replace codebase-specific reasoning.
6. **Test coverage of changes**
   - Assess whether the **planned changes** are adequately covered by tests: each step or acceptance criterion that introduces or modifies behavior should have a corresponding validation/test expectation in the plan (e.g. `- **Validation**:` blocks, test scenarios, acceptance criteria that are verifiable).
   - Report `gap` or `missing-validation` when changes are not clearly covered by tests or when validation is vague/absent for testable surface.
   - **Optional — QA Automation Lead**: In **Deep mode** or when the plan has substantial testable surface, you may delegate to the **QA Automation Lead** subagent (Task tool, `subagent_type="qa-automation-lead"`) to assess test coverage of the planned changes. Provide the plan (and feature/context path). Use the returned assessment as input only: incorporate findings into your Step-by-Step Analysis and Summary of Concerns as Reviewer (gap/missing-validation); do not copy QA output verbatim; do not add solutions. If QA subagent is unavailable, perform the test-coverage check yourself.

**Deep mode evidence expectations**:
- For each high-impact concern in Deep mode, include multi-source evidence:
  - plan/context evidence (local)
  - codebase evidence (local)
  - at least one external source URL (official docs/specs)

**Reviewer Observations** (top-level section in `.review.md`, before all round blocks — see `references/review-format.md`):
- Forward-looking signals outside the verdict scope: tech debt noticed while reading the plan, architectural risks in adjacent areas, patterns worth tracking
- Not round-specific — accumulates across all review rounds; append new entries after each round; never delete previous
- Write only when there is something concrete to note; omit section entirely if nothing observed
- Labels: `[codebase]`, `[risk]`, `[process]`, `[tooling]` — observations only, no recommendations

Review only where there is clear evidence; avoid judgments without plan/code references. Do not implement — output review only. Do not give specific recommendations (no "do X", "use Y", "rewrite Z"). Terminal commands allowed: `date +%Y-%m-%d` (current date), `cat` (read files), `grep` (search in files), `find` (locate files). Web lookup allowed: use `WebSearch` + `WebFetch` for official sources and cite URLs in `Evidence`. Do not run build, test, or any other commands.

Focus on problems: reviews are for improvement and working with errors. For OK status items, keep description minimal (1 sentence max, e.g., "No issues found"). Provide detailed analysis only for concerns (CONCERN-LOW/MEDIUM/HIGH, BLOCKED).

**Reviewer strictness (mandatory — no rubber-stamp)**:
- **Verify plan references**: When the plan cites file paths and line numbers (e.g. "Where: file.ts line 45"), you MUST open those files and verify the cited lines exist and match the described behaviour. If the plan says "line 145" but the relevant code is at line 138, report **wrong-assumption** or **gap** with Evidence (plan says X, codebase shows Y at file:line).
- **Implementation specificity**: When a step lists multiple options (e.g. "fix by (a), (b), or (c)"), assess whether the plan explicitly chooses or prefers one so the implementer does not have to guess. If no option is chosen and the step is non-trivial, report **ambiguity** or **gap** (e.g. "Plan leaves implementation choice open; implementer must guess").
- **Critical stance**: Do not default to READY when the plan has fix steps or non-trivial changes. Before issuing READY, re-check: (1) all cited file:line references verified against codebase, (2) each step has a single or clearly preferred implementation path, (3) previous round CONCERN-MEDIUM/HIGH/BLOCKED are addressed or explicitly marked still open. If in doubt, prefer NEEDS_REVISION and state what is missing or wrong.

**Validation** (before completing):
- Verify review includes Verdict (READY | NEEDS_REVISION)
- Verify round header format is correct: `## {plan-slug} R{round} — YYYY-MM-DD` (date from `date +%Y-%m-%d`)
- Verify `## Navigation` is updated with new round entry (verdict included)
- Verify findings are categorized (gap, risk, ambiguity, infeasible, missing-validation, wrong-assumption)
- Verify no recommendations or solutions provided
- Verify selected review mode (Deep/Standard) matches round and change magnitude rules
- Verify concerns reflect architecture quality checks (alternatives, fit, complexity, system impact, source validation, **test coverage of changes**) where relevant
- Verify **test coverage of changes** was assessed (plan steps/acceptance criteria vs validation and test expectations); if QA Automation Lead was used, verify findings were incorporated into the review without solutioning
- Verify high-impact technical claims include at least one external source URL in `Evidence`
- Verify structured chat response contains ALL mandatory sections from `response-formats.md` Reviewer format: `## Summary`, `## Verdict`, `## Critical Findings`, `## High Priority Concerns`, `## Review Artifact`, `## Next Steps` — **`## Next Steps` is REQUIRED even when verdict is READY**

See [agent-selection-guide](../agents/_agent-selection-guide.md): use Reviewer subagent for plan review; use Architect for planning; use Developer for implementation.
