# Plan Format Specification

**File**: `plans/{plan-slug}.plan.md`

## File Structure (top to bottom)

```
# header (Metadata, Contexts, Plan revision log)   ← static metadata
## Navigation                                       ← updated on every plan/replan; links to all steps
## Architect Retrospective                          ← append-only, one v{N} block per replan
## Architect Observations                           ← append-only, accumulates across replans
## Context / Goal / Plan / Risks / Acceptance       ← plan body (steps grow downward)
## Before / After: System Behavior                  ← observable outputs/contracts before and after (when system behavior changes)
```

**Rule**: metadata and accumulating sections (Navigation, Retrospective, Observations) come before the plan body. New steps are appended at the end of `## Plan`. `## Before / After: System Behavior` comes after Risks/Acceptance.

---

## Required Structure

````markdown
# Plan {Plan-Id}: {Title}

## Metadata

- **Plan-Id**: {plan-slug}
- **Plan-Version**: v1 (or v2, v3...)
- **Branch**: {git-branch-name}
- **Status**: Draft
- **Last review round**: [reports/{plan-slug}.review.md → ## {plan-slug} R{n} — YYYY-MM-DD](../reports/{plan-slug}.review.md#plan-slug-rn--yyyy-mm-dd) (or "Initial plan — no review yet")
- **Implementation report**: [reports/{plan-slug}.implementation.md](../reports/{plan-slug}.implementation.md) (omit until implementation starts)

## Contexts

- [context-name](../contexts/{name}.context.md) — what was used from this context

_(Omit section if no contexts were consulted)_

## Plan revision log

| Version | Round | Date       | Changed Steps                | Summary                                   |
| ------- | ----- | ---------- | ---------------------------- | ----------------------------------------- |
| v1      | —     | YYYY-MM-DD | Steps 1–N (initial)          | Initial plan                              |
| v2      | R1    | YYYY-MM-DD | Step 3 amended, Step 4 added | Short description of what changed and why |

## Navigation

- [Architect Retrospective](#architect-retrospective) · [Architect Observations](#architect-observations)
- [Context](#context) · [Goal](#goal) · [Code / patterns](#code--patterns) · [Out of scope](#out-of-scope)
- Plan: [Step 1: {Title}](#step-1-title) · [Step 2: {Title}](#step-2-title) · ...
- [Risks / Unknowns](#risks--unknowns) · [Acceptance Criteria](#acceptance-criteria)
- [Before / After: System Behavior](#before--after-system-behavior) _(when section exists)_

_(Updated by `/plan-feature` on creation and by `/replan-feature` when steps are added or amended.)_

## Architect Retrospective

### v{N} — {round-ref} — {date}

- [plan] {insight about plan structure, scope, or gaps}
- [codebase] {insight about codebase behavior or constraints}
- [process] {what complicated this replan}
- [risk] {newly identified risk for next round}
- [automation] {repeating operations or patterns observed that could be automated; suggest skill name/purpose if applicable}

_(Top-level append-only section — one `### v{N}` block per replan cycle, added by `/replan-feature`. Omit section until first replan. Never delete previous blocks. `[automation]` entries are optional but encouraged if repeating manual operations are detected.)_

## Architect Observations

- `[high|mid|low|nit]` {observation about adjacent code, technical debt, bugs, architecture issues, future work candidates, cross-plan patterns}

**IMPORTANT: These are not optional.** Record observations about the codebase you touch with **priority label** indicating importance to the project:

**Priority levels** (importance to project):

- `[high]` → Critical for current or future work, blocks productivity, or is a critical bug
- `[mid]` → Important technical debt, fragile patterns, or moderate issues that should be addressed
- `[low]` → Code quality improvements, efficiency improvements, or minor issues
- `[nit]` → Cosmetic, minor cleanups, or nice-to-haves

_(Top-level section — accumulates across all replan cycles. Added by `/replan-feature`. Encouraged: write observations on every replan to build organizational knowledge of codebase state. **Every observation must have a priority label** for retrospective triage and decision-making.)_

## Context

[Brief, facts from repo/docs]

## Goal

[What we're building]

## Code / patterns

_(Optional.)_ Reference: `implementation-quality-guidelines.md`. Optional short "Implementation constraints" for this plan (patterns to use, what to avoid — generic wording). Shared baseline for Reviewer and Developer; audit can check against it.

## Out of scope

_(Optional.)_ Short list of what is explicitly not in this plan. Helps Reviewer flag scope creep; Developer avoids gold-plating.

## Plan

**Step detail level**: Each step MUST be concrete enough for (a) Developer to implement without guessing scope, (b) Reviewer to verify completeness, feasibility, and test coverage. Prefer more, smaller steps with clear boundaries over fewer vague steps. Vague steps (e.g. "Add error handling", "Refactor X") are not reviewable — specify what changes, where, and how to verify.

### Step 1: {Step Title}

**Status**: {done | partial | skipped | not started}

- **Change**: What exactly changes — concrete and bounded (specific behavior, data flow, or API change). Avoid high-level only; include enough that implementation and review can target the same scope.
- **Where**: Files, modules, or paths (exact when known). Reviewer and Developer need this to check feasibility and boundaries.
- **Preconditions** (if any): What must be true before this step (e.g. "Step 1 done", "Config X exists"). Omit if none.
- **Concrete outcome**: One or two sentences that define "done" in verifiable terms (so Reviewer can check completeness and Developer knows when to stop).
- **Edge cases / errors** (if relevant): For steps touching I/O, persistence, or integration — list edge cases or error scenarios the step must handle, or state "None / N/A". Helps Reviewer flag gaps.
- **Validation**: How to verify — explicit command(s), test name(s), or manual check. Must be executable (e.g. `cargo test`, `make testbench-wamr`). When the step adds or changes behavior, state which new tests are required (or reference **Tests to add** below). Reviewer uses this to confirm test coverage.
- **Tests to add** (if relevant): For steps that require new tests — list test names or scenarios (e.g. `test_perf_guard_drop_emits_one_record`, "parse_call_entry on new-shape metadata returns normalized object"). Makes it explicit what tests the Developer must write; Validation should run these. Omit if no new tests.
- **API / types** (if relevant): For steps that introduce or change public API or data format — function signatures, struct/enum definitions, or example schema/JSON. Enables direct coding without inferring from prose. Omit if step does not add API or change contract.
- **Pattern / approach** (if relevant): One sentence naming the pattern or design choice for this step (e.g. "Strategy: one interface, implementations per X"). Use when the step has a non-obvious architectural decision so Review can verify adherence.
- **Acceptance**: [Acceptance criteria for this step]

**When a step has multiple distinct changes**, use numbered fixes with the target file in the heading — NOT lettered sub-steps:

```markdown
**Fix 1 — description** (`path/to/file.ts`):
[what and why]

**Fix 2 — description** (`path/to/other-file.ts`):
[what and why]
```
````

Do NOT use "Step A / Step B" or "Sub-step A" — these imply nested step hierarchy which conflicts with the append-only step numbering scheme.

### Step 2: {Step Title}

[Same structure — all step fields above]

## Risks / Unknowns

[What could go wrong, what we don't know]

## Acceptance Criteria

Done when:

- [ ] Criterion 1
- [ ] Criterion 2

`````

## Key Fields

- **Plan-Id**: Plan identifier (typically plan-slug)
- **Plan-Version**: v1 (initial), v2, v3... (incremented on each revision)
- **Status** (document lifecycle, required in `## Metadata`): Must be exactly one of the allowed values in **Plan document status** below. New plans from `/plan` start as **Draft**. This is **not** the same as per-step `**Status**` inside `### Step N` (see **Step Status**).
- **Branch**: Git branch name for this plan's implementation
- **Last review round**: Link to review round (or "Initial plan — no review yet")
- **Contexts**: Links to context documents consulted when writing the plan (omit if none)
- **Plan revision log**: Table with version, round, date, changed steps, and summary — updated by Architect on every replan; Developer uses this to identify what to execute in the current version
- **Code / patterns** (optional): Reference to quality guidelines + implementation constraints for this plan
- **Out of scope** (optional): What is explicitly not in this plan
- **Per-step**: Change (concrete), Where (files/modules), Preconditions (if any), Concrete outcome (verifiable "done"), Edge cases/errors (if relevant), Validation (executable; state which new tests when applicable), Tests to add (optional; list test names/scenarios), API/types (optional; signatures or schema when step adds API/format), Pattern/approach (optional), Acceptance — so that steps are implementable and reviewable

## Plan document status

**Where**: `## Metadata` → line `- **Status**: …` (exactly one; spelling and casing as below).

**Allowed values** (canonical strings for `scripts/validate-plan.sh`):

| Status | When to use |
| ------ | ----------- |
| **Draft** | New plan from `/plan`, or after `/replan`, until review is **READY** (includes **NEEDS_REVISION** / not yet approved for implementation). |
| **Ready for implementation** | Latest review round verdict is **READY**; work has not started or is not yet tracked as in-flight. |
| **In progress** | Implementation is underway (per implementation report / team state). |
| **Implemented** | Implementation audit verdict is **ready** (or equivalent closure); plan outcomes accepted. |
| **Blocked** | External or technical blocker stops implementation; resume with **In progress** or **Draft** when unblocked. |
| **Archived** | Not on the active execution queue: kept for history, reference, or because work moved to another plan/approach (redirect/replace). Distinct from **Cancelled** (see below). |
| **Cancelled** | Deliberately abandoned; no intention to implement. Use **Archived** when the doc stays useful as context or may be revived. |

**Workflow hints**: `/plan` and review-driven `/replan` outputs should use **Draft** unless a prior **Ready for implementation** state still applies (e.g. minor doc-only replan). Update **Status** when review or audit milestones change.

## Step Status

Steps may include `**Status**: {done | partial | skipped | not started}` field:

- **not started**: Default status when plan is created (may be omitted)
- **done**: Step completed successfully (added by `/audit-implementation-feature` after successful audit)
- **partial**: Step partially completed (added by `/audit-implementation-feature` if audit shows partial completion)
- **skipped**: Step was skipped (added by `/audit-implementation-feature` if step was intentionally skipped)

**Note**:
- `/plan-feature` and `/replan-feature` do NOT add status to steps (plan not yet implemented)
- `/audit-implementation-feature` adds status to steps ONLY if decision is "ready" (based on implementation report)

---

## Before / After: System Behavior

**When to include**: Required when the plan changes **observable behavior of a system** — what a generator emits, what a validator accepts/rejects, what a plugin receives, what a CLI outputs, what a contract contains. Omit only for purely internal refactors where no output or interface changes.

**Purpose**: Answer the question _"what will be different after this plan lands?"_ from the perspective of whoever **consumes** the system — not the developer writing it. Give Developer an unambiguous target. Give Reviewer a concrete baseline to audit against.

**Position in document**: After `## Acceptance Criteria`. Add a link in `## Navigation`.

**How to pick what to show**: For each system the plan touches, ask: _who consumes its output?_ Show that output before and after. Examples of what this means in practice:

| Plan touches... | Show before/after for... |
|---|---|
| A **code generator** | The generated file / snippet it emits |
| A **validator / linter** | Which inputs now pass, which now fail (with error message) |
| A **host handler** | What the plugin receives in response |
| A **CLI command** | Its output or new flags |
| A **contract / WIT / schema** | The contract text or schema shape |
| A **plugin API** | How to correctly write a plugin call / export |
| A **config format** | What the config file looks like |

**Format rules**:

- Use fenced code blocks with language tags. BEFORE = actual current output (read from codebase/fixtures, not invented). AFTER = normative target — implementation must match this exactly.
- One subsection per system boundary. Keep examples minimal — just enough to be unambiguous.
- What does NOT change is equally important: state it explicitly so Developer doesn't touch it.

**Template** (one subsection per affected system; skip non-applicable with one line):

````markdown
## Before / After: System Behavior

> One-line scope: what systems change observable behavior, what stays the same.

### {System name} — {what aspect changes}

**BEFORE** — {description of current output/behavior}:

`````

// actual current output, contract, or example

```

**AFTER** — {description of new output/behavior}:

```

// new output, contract, or example — this is what implementation must produce

```

_{What does NOT change — e.g. "Wire format unchanged. Plugin call site unchanged."}_
```

---

## Validation script

From the Pythia repository root, run:

`scripts/validate-plan.sh <path-to-plan.md>`

The script checks required sections, metadata keys (including **Status** against **Plan document status**), Navigation step links, and required fields inside each `### Step N` block.

**Legacy plans** that predate `## Metadata` may still carry `**Status**:` in the header block under the title; they often fail structural validation until migrated to this format. Prefer the standard layout for all new `/plan` and `/replan` output.
