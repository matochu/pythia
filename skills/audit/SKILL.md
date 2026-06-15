---
name: audit
description: Audit a feature implementation against its approved plan and implementation report, then produce the architect verdict and follow-up direction.
---

# Skill: /audit

**Purpose**: Audit Developer's implementation report as Architect and provide final decision plus follow-up direction. Hermetic per feature; agent doc context = feature.

## Input Formats

Choose any of the following:

```
/audit                                   # No args: auto-detect from chat history
/audit feat-2026-01-123                 # With FEATURE_ID: infer plan-slug from feature dir
/audit plan                              # Artifact ref: use current feature's latest plan + implementation
/audit I{n}                              # Implementation ref: audit latest implementation round
/audit feat-2026-01-123 1-refactor      # FEATURE_ID + plan-slug explicitly
```

**When no args**: auto-detect from chat — find most recent FEATURE_ID reference and most recent implementation report, or validate if already in feature context.

## Instructions for user

- **Minimal case**: Just say `/audit` — skill will infer current feature and plan from chat.
- **With artifact**: `/audit plan` (use current implementation), `/audit I{n}` (reference specific round).
- **With FEATURE_ID**: Provide feature ID if context is unclear; skill will find the latest plan/implementation.
- Implementation report must exist at `{feature-dir}/reports/{plan-slug}.implementation.md` before audit can proceed.

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
   - Feature directory structure (find most recent approved plan in `plans/` directory)
   - If multiple plans exist: **prompt user** which plan to audit
   - If exactly one plan exists: use it

3. **Extract implementation round reference** (optional):
   - `I{n}` → audit specific Implementation Round n
   - `plan` → audit latest implementation round for this plan
   - Not specified → audit latest round in implementation report

### State Detection (HARD GATE — must read file before proceeding)

After input parsing:

1. **You MUST read the actual file** `{feature-dir}/reports/{plan-slug}.implementation.md` from disk. Do NOT assume it exists based on chat history or inference.
2. If missing: output error _"Cannot audit: implementation report not found at `reports/{plan-slug}.implementation.md`. Run `/implement` first."_ — **STOP immediately. Do NOT run `/implement`, do NOT fall back to any other action.**
3. Load the implementation report and identify the implementation round(s) to audit.
4. Confirm all prerequisites (plan file, contexts if referenced) are accessible.

---

You are the **Architect** ([architect.md](../../agents/architect.md)). **Doc context = this feature** (feat doc + plans/ + notes/ + reports/).

**Input**: Feature context + **plan slug** (required). Implementation report path = `reports/{plan-slug}.implementation.md`. Plan path = `plans/{plan-slug}.plan.md`.

---

## Mandatory context load (before audit)

1. Read `plans/{plan-slug}.plan.md` — sections `## Retrospective` and user-only `## Decision Log`. Extract all `### v{N}` blocks and explicit user choices/corrections. Use as context — especially `[risk]` entries and user decisions that shaped the plan.
2. Read `reports/{plan-slug}.implementation.md` — sections `## Retrospective` and user-only `## Decision Log`. Extract all `### I{n}` blocks and explicit user choices/corrections. Use as context — know what the Developer learned, what risks were flagged, and what operations/patterns the Developer identified as candidates for automation.
3. Use both to inform the audit — assess whether known risks materialized, whether Developer learnings are reflected in the outcome, whether unresolved retrospective findings affect implementation quality, and whether the implementation contradicts explicit user decisions.
4. **Context documents**: If the plan lists contexts in `## Contexts`, read those context documents from `{feature-dir}/contexts/`. Note any requirements defined there — these will be checked in the Audit Process (step 4a below).

---

## Audit Process

1. **Read implementation report**: Extract all `## Implementation Round I{n}` sections — step results, issues, out-of-plan work.
2. **Compare against plan**: Check each plan step against implementation round results.
3. **Check acceptance criteria**: For each criterion in plan — met / not met / partial.
4. **Re-evaluate risks**: Which plan risks materialized? Which were mitigated?
   - **4a. Context conformance** (if contexts exist): If feature has context documents with requirements (loaded in Mandatory context load step 4) — check that the implementation conforms to those requirements. Flag any non-conformance as a finding. Non-conformance with a requirement context is grounds for "needs fixes" or "re-plan" verdict.
   - **4b. Automation suggestions** (if present): Review any `[automation]` entries from implementation Retrospective. Synthesize them — if multiple rounds noted similar repeating patterns, note this as a potential skill candidate in your audit summary (does not affect verdict, but informs retrospective). Examples: "Developer observed manual validation step repeating in 3 places — skill candidate"; "Config pattern X appears in implementation steps — consider parametric skill for similar future features".
   - **4c. User decision conformance** (if present): Review user-only `## Decision Log` entries from plan and implementation. Check only whether implementation or report output contradicts explicit user choices/corrections. Do not expect priority labels in `Decision Log`; it is not a backlog and not a source for codebase issues. If a contradiction affects requested scope, artifact format, language, placement, or validation/reporting expectations, include it as an audit finding.
   - **4d. Unresolved retrospective findings** (if present): Review `## Retrospective` entries from plan and implementation. Check whether unresolved `[risk]`, `[codebase]`, `[plan]`, `[process]`, or `[tooling]` findings affect implemented behavior, maintainability, validation confidence, or future work. Infer audit severity from evidence and impact; do not require source entries to carry priority labels.
5. **Implementation quality check** (mandatory): Review the **actual code changes** listed in the implementation report (`## Files Changed`). Read the modified files (or relevant diffs) and assess:
   - **Test/criteria integrity**: Code that only satisfies tests or acceptance criteria for narrow or specific cases; logic that bypasses or stubs tests; hardcoded outcomes for "passing" scenarios; missing or shallow handling of edge cases and errors. Flag as finding if present.
   - **Maintainability**: Alignment with [implementation-quality-guidelines.md](../workflow/references/implementation-quality-guidelines.md) — defensive code, explicit error handling, logging, tests that verify behavior (not implementation), no swallowed errors or unsafe assumptions. Code that is brittle, hard to extend, or violates project conventions. Flag as finding if present.
   - **Architecture & design**: KISS, DRY; **layering**: higher-level / core must not depend on concrete extension points or lower-level components by name or identity — only on abstractions or contracts (otherwise renaming or removing a dependency breaks the system). No **magic strings** that should be parameters or config. **Correct abstraction**: no context- or environment-specific workarounds baked into production code (they mask the real problem). **Explicit contracts**: behavior (e.g. where data is read from, which branch is taken) must be driven by explicit API/contract, not implicit rules that depend on one specific name or case. Apply this especially to **out-of-plan** changes — give an explicit architectural assessment for each; violations can justify "needs fixes" or "re-plan".
   - **Verdict for this step**: pass | concerns | fail. "Concerns" or "fail" must be reflected in the audit report and can justify "needs-fixes" (or "re-plan" if severe).
6. **Decision**: ready | needs-fixes | plan-fix | re-plan.

   **`plan-fix` conditions** (all must be true):
   - Implementation faithfully executed the spec — developer made no mistake
   - Error originated in the plan (wrong assumption, bad step spec, incorrect reference)
   - ≤ 2 steps need amendment, approach stays the same
     If any is false → use `re-plan`.

---

## Output

1. **Architect audit report** written to `{feature-dir}/reports/{plan-slug}.audit.md` per [audit-format.md](../workflow/references/audit-format.md).
2. **`problems.md`** (if verdict ≠ `ready`): write `{feature-dir}/notes/{plan-slug}.problems.md` per the `problems.md` format in [audit-format.md](../workflow/references/audit-format.md). This is the primary handoff document to the next agent (fixer / replanner). Include one AC block per non-passing criterion.
3. **Structured response** in chat using Architect Audit Response Format — see [response-formats.md](../workflow/references/response-formats.md).
4. **Plan update** (if decision is "ready"): Update plan file `plans/{plan-slug}.plan.md`:
   - Change `Status` from "In Progress" to "Implemented"
   - Add `**Status**: done` to each Step that was completed (based on implementation report)
   - Mark all acceptance criteria checkboxes as `[x]` if they were met
   - Keep plan metadata (Plan-Version, Last review round) unchanged
5. **Feature document update** (if decision is "ready"): Update feature document `{feature-dir}/{feature-id}.md`:
   - Find or create `## Plans`
   - Match plan entries by `{plan-slug}`
   - If plan NOT listed: add new entry with format: `- [{plan-slug}](plans/{plan-slug}.plan.md) — {title} · Status: Implemented`
   - If plan IS listed: replace/update existing slug entry with the same format
   - Do not mutate unrelated feature sections or frontmatter
6. **Suggested git commit message** (if decision is "ready"): Output a message suitable for the **application repository** (the code repo), not for workflow/docs that live outside git.
   - **Subject line**: `feat: {1-sentence summary}` — from what actually changed in the repo + `## Steps Executed` / `## Files Changed`; max 72 chars
   - **Body**: bullet list, imperative mood, one bullet per meaningful change (aligned with `## Steps Executed` where it maps to code)
   - **Optional footer**: `Files: {count}` — count of unique paths under `## Files Changed` **in the repo** (omit if unknown)
   - **Hard rule — never in commit message**: plan slugs, plan numbers (`Plan 3`, `17-copilot-…`), `.pythia/`, `.claude/` workflow paths, feature workflow filenames, or any reference to internal planning artifacts. Those are not part of the code repo; git history must stay free of them.
   - **Jira/task IDs**: only if the team already uses them in commits (e.g. from branch name); never substitute plan IDs for ticket IDs.
   - Format as a fenced code block for copy/paste
   - Do NOT include implementation round details, command lists, audit verdict, or plan metadata in the commit message
7. **Final decision** to user: ready | needs-fixes | plan-fix | re-plan

### Next-step chooser handling

After emitting Architect Audit Response, halt and wait for the user's next input. The response must end with:

```markdown
---
**Active context**: role: Architect · feat: {feat-id} · plan: {plan-slug} · audit: A{round} · skill: /audit
```

When the next user input is exactly one of the offered chooser keys:

- **`[t]` / `t`** (ready only): run `/retro {feature-dir}` in the current Architect context. Do not launch a subagent by default.
- **`[x]` / `x`** (ready only): finish and stop.
- **`[i]` / `i`** (needs-fixes only): launch a **Developer** subagent ([developer.md](../../agents/developer.md)) with `/implement {feature-dir}/plans/{plan-slug}.plan.md A{round}` in refinement mode. Pass the audit report, `problems.md`, implementation report, and active audit round as context. If subagent launch is unavailable, print only the copyable `/implement` command from the response template and stop.
- **`[q]` / `q`** (needs-fixes only): launch **QA Automation** subagent ([qa-automation.md](../../agents/qa-automation.md), `subagent_type="qa-automation"`) for validation/test-evidence analysis of audit concerns. QA returns assessment only; Architect decides whether it changes the audit follow-up direction.
- **`[r]` / `r`** (plan-fix or re-plan): stay in Architect context and run `/replan {feature-dir}/plans/{plan-slug}.plan.md A{round}`. If the host cannot execute `/replan` inline, print only the copyable `/replan` command from the response template and stop.
- **`[d]` / `d`** (plan-fix or re-plan): stay in current Architect context and clarify whether this is a local plan fix or broader re-plan before editing artifacts. Do not edit artifacts until the user confirms direction.
- **`[v]` / `v`** (needs-fixes, plan-fix, or re-plan only): restart `/audit` as a skill invocation on the same implementation artifact after external changes. Do not continue with free-form Architect audit analysis in place. Append a new audit round; do not overwrite the existing round. If the implementation round is not explicit, read the implementation report and use the latest implementation round. If the host cannot execute `/audit` inline, print only the copyable `/audit` command from the response template and stop.
- Any key not offered for the current verdict: reprint the valid chooser keys for that verdict and stop.

Do not treat arbitrary custom user messages as chooser input. If the user writes a normal instruction instead of a chooser key, handle it as normal Architect/audit context and do not auto-launch workflow agents.

### Post-audit loop continuation

**CRITICAL — Execution context**: When the user invokes `/audit` directly (inline mode, no "loop" or "auto"), execute the audit **in the current context** — you ARE the Architect auditor. Do **NOT** launch a subagent for the audit itself. After producing the audit artifacts, show the verdict-aware next-step chooser and stop.

**Loop/auto mode only**: If the user invoked this command in **loop mode** (said "loop" or "auto", or called `/loop`), continue automatically after writing the audit artifacts:

| Verdict       | Action                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ready`       | Report DONE. Output commit message. Stop.                                                                                                                                                                                                                                                                                                                                                 |
| `needs-fixes` | Spawn **Developer subagent** (refinement mode) using `problems.md`. Wait. Then spawn **fresh Architect subagent** for re-audit. Max 2 `needs-fixes` iterations total.                                                                                                                                                                                                                     |
| `plan-fix`    | Report BLOCKED. Do not auto-continue — plan repair still requires user decision before `/replan` or any later implementation.                                                                                                                                                                                                                                                              |
| `re-plan`     | Report BLOCKED. Do not auto-continue — re-plan requires user-assisted scope decision unless user explicitly delegated full authority.                                                                                                                                                                                                                                                     |

**Fresh-session constraint:** The re-audit subagent must be a different subagent instance from the Developer that just ran. Never re-audit in the same context that just implemented.

---

## Validation (before completing)

- **Workflow-doc validation (Validator subagent)**: After `reports/{plan-slug}.audit.md` is written on disk, launch a **Validator subagent** in a **separate context**. Use the **handoff prompt** in [/validate skill](../validate/SKILL.md) § Validator subagent (delegation): **absolute** `{ABS_PATH_TO_VALIDATE_SKILL}` and **absolute** path to the audit file. **Do not** complete until **exit `0`**.
  - **(Concrete tooling — if “spawn a Validator subagent” is unclear in your host)** Start a **separate delegated task** (e.g. Cursor **Task**) so validation runs **outside** this Architect (audit) thread — commonly `subagent_type="generalPurpose"` or the same type your [/loop skill](../loop/SKILL.md) uses for one-shot handoffs. Delegated body = **only** the filled **handoff prompt** from [/validate skill](../validate/SKILL.md) § Validator subagent; **do not** paste audit verdict narrative, findings, or implementation excerpts — only validation instructions.
  - **When `/loop` already documented successful validation** for this revision, you may skip nested Validator — state that.
  - **Inline fallback** (no subagent): open the validate skill and complete **one** run **as defined in that skill**; label **inline fallback**.
- Verify audit report includes conformance assessment (done | partial | no)
- Verify **implementation quality check** is present (pass | concerns | fail) with concrete findings if concerns/fail
- Verify acceptance criteria are checked (met count/total)
- Verify risk re-evaluation is included
- Verify decision (ready | needs-fixes | plan-fix | re-plan) with reasoning
- Verify report follows [audit-format.md](../workflow/references/audit-format.md)
- **If decision ≠ `ready`**: Verify `problems.md` is written to `{feature-dir}/notes/{plan-slug}.problems.md`
- **If decision is `plan-fix`**: Verify only `plan-fix` conditions are met (≤ 2 steps, implementation faithfully followed wrong spec)
- **If decision is "ready"**: Verify plan file is updated:
  - Status changed to "Implemented"
  - Steps have status markers (`**Status**: done`)
  - Acceptance criteria checkboxes marked as `[x]` for met criteria
- **If decision is "ready"**: Verify feature document is updated:
  - Plan added/updated in `## Plans` by slug
  - Plan entry includes `Status: Implemented`
- **If decision is "ready"**: Verify suggested commit message is present in structured response:
  - Subject line starts with `feat:` and is ≤ 72 chars
  - Body describes repo changes (imperative bullets); aligned with implementation where applicable
  - **No** plan slug, plan number, `.pythia/`, or workflow-only paths in the message
  - Formatted as a fenced code block
- Verify structured chat response includes verdict-aware `## Next Steps` and the active audit footer from [response-formats.md](../workflow/references/response-formats.md).

See also: Use [/loop skill](../loop/SKILL.md) for automated post-audit routing.
