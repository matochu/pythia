# Architect Audit Format Specification

**File**: `reports/{plan-slug}.audit.md`

## Required Structure

````markdown
# Architect Audit: {plan-slug}

Plan: [plans/{plan-slug}.plan.md](../plans/{plan-slug}.plan.md)
Implementation: [reports/{plan-slug}.implementation.md](./{plan-slug}.implementation.md)

## Conformance

- Status: done | partial | no
- Details: [what was done vs plan]

## Acceptance Criteria Check

- [ ] Criterion 1 — [status]
- [ ] Criterion 2 — [status]

## Implementation quality check

- Status: pass | concerns | fail
- **Test/criteria integrity**: [Code that only satisfies tests/criteria for narrow cases, bypasses or stubs tests, hardcoded "pass" outcomes, shallow edge/error handling — or "None found."]
- **Maintainability**: [Alignment with implementation-quality-guidelines: defensive code, error handling, logging, tests that verify behavior; brittleness or convention violations — or "OK."]
- **Architecture & design**: [KISS, DRY; layering (core/upper layers depend on abstractions/contracts, not on concrete names/identities); no magic strings that should be parameters/config; no context- or environment-specific workarounds in production; explicit API/contracts — or "OK." **Out-of-plan changes**: explicit architectural assessment for each; list any violations.]
- Details: [Concrete file/area and finding if concerns/fail]

**Example architectural findings** (generic; project may add its own):

- _Wrong layering_: A higher-level component has hardcoded knowledge of a concrete lower-level or extension by name/ID; should depend on abstraction/contract only.
- _Magic string_: A literal is baked in instead of a parameter or config — brittle and not portable.
- _Wrong abstraction_: A context- or environment-specific workaround was baked into production code; masks the real issue.
- _Implicit behavior_: Behavior depends on one specific name or case without an explicit API/contract — unpredictable and hard to reason about.

## Risk Re-evaluation

[Reassess risks from plan]

## Decision

- **Verdict**: ready | needs-fixes | plan-fix | re-plan
- **Reasoning**: [why]
- **Next Steps**: [what to do]

### Verdict definitions

- **`ready`**: implementation meets all acceptance criteria, quality check passes, plan conformance is done or acceptable partial.
- **`needs-fixes`**: implementation issues (code wrong, tests missing, edge cases unhandled) — plan is correct; Developer refinement needed.
- **`plan-fix`**: plan had errors that caused wrong implementation (wrong step spec, bad assumption, missing constraint, incorrect file/API reference) — implementation faithfully executed the wrong spec. ≤ 2 steps need amendment, approach stays the same. Architect patches plan without new review cycle.
- **`re-plan`**: fundamental approach wrong, ≥ 3 steps affected, or architectural rethink needed. Full replan + review cycle required.

### `plan-fix` conditions (ALL must be true)

- Implementation faithfully executed the spec — the developer made no mistake
- The error originated in the plan (wrong assumption, bad spec, incorrect reference)
- ≤ 2 steps need to be amended to correct the plan
- Implementation approach does not need to change

If any condition is false → use `re-plan`.

### Post-audit routing

| Verdict       | Root cause                                        | Next action                                                   | Max iterations |
| ------------- | ------------------------------------------------- | ------------------------------------------------------------- | -------------- |
| `ready`       | —                                                 | DONE                                                          | —              |
| `needs-fixes` | Implementation issues; plan correct               | Developer refinement → fresh audit                            | 2              |
| `plan-fix`    | Plan errors; implementation correct to wrong spec | Architect patches plan → Developer re-implement → fresh audit | 1              |
| `re-plan`     | Approach wrong or ≥ 3 steps broken                | /replan-feature → /review → /implement → /audit               | 1              |

## Suggested git commit (application repository)

**If and only if Verdict is `ready`:** include this section **in the audit file** immediately after **Decision** (before plan/feature update notes). Same message MUST appear in the Architect chat response as a fenced block.

- **Subject**: `feat: …` — one line, ≤ 72 characters, from real repo changes (`## Files Changed` / `## Steps Executed` in implementation report).
- **Body**: imperative bullets, one per meaningful change; no plan/workflow-doc references.
- **Forbidden in the message**: plan slugs, `Plan N`, `.pythia/`, `.claude/` command paths, feature workflow filenames, audit/implementation report names. Optional: `Files: {n}` footer counting repo paths only.

```text
feat: {subject}

- {bullet}
```
````

_(Omit entire **Suggested git commit** section when Verdict is `needs fixes` or `re-plan`.)_

````

## Plan Update (if Verdict is "ready")

After creating audit report, if Verdict is "ready", Architect MUST also update the plan file:

1. **Update plan metadata**:
   - Change `Status` from "In Progress" to "Implemented"

2. **Add status to Steps**:
   - For each Step in plan, add `**Status**: done` (or `partial`/`skipped` if applicable)
   - Base status on implementation report: if implementation report shows step as "done", mark as `done`
   - Place status immediately after Step title (before "Change" field)

3. **Mark acceptance criteria**:
   - Mark all acceptance criteria checkboxes as `[x]` if they were met (based on audit report)
   - Keep unmet criteria as `[ ]`

**Example Step update**:
```markdown
### Step 1: Create Skill Directory Structure

**Status**: done

- **Change**: Create skill directory structure for sync skill
...
````

4. **Update feature document**:
   - Find section "## Detailed Implementation Plans (External)" → "**Existing External Plans:**"
   - Check if plan is already listed (search for plan-slug or Plan Number in list)
   - If plan NOT listed: Add new entry with format: `- [Plan {Number}: {Title}](plans/{plan-slug}.plan.md) — {description}. **Status: Implemented**`
   - If plan IS listed: Update existing entry to add `**Status: Implemented**` at the end (or replace existing status if present)
   - Extract plan title from plan file: `# Plan {Number}: {Title}` → use as link text
   - Extract description from plan's Problem Analysis or Goal section (1-2 sentences summary)
   - Format: `- [Plan {Number}: {Title}](plans/{plan-slug}.plan.md) — {description}. **Status: Implemented**`

**Example feature document update**:

```markdown
**Existing External Plans:**

- [Plan 1: Agents and Commands — Creation and Data Exchange](plans/1-agents-commands-data-exchange.plan.md) — Architect + Developer (review-only mode), commands **hermetic per feature** (/plan-feature, /review-plan-feature, /replan-feature), data exchange (plan ↔ review), integration with create-feature-plan
- [Plan 2: Skill Search and Fit — Agent Skill Discovery and Adaptation](plans/2-skill-search-and-fit.plan.md) — Cursor Skill for searching and evaluating Agent Skills from major catalogs, evaluating quality, and adapting skills to project needs
- [Plan 3: Cursor Architecture — Rules, Skills, Subagents, and Hooks Integration](plans/3-cursor-architecture-rules-skills-subagents-hooks.plan.md) — Complete Cursor architecture mapping: Rules (always-on policy), Skills (on-demand procedures + commands), Subagents (three roles with isolated context), Hooks (auto-transitions and gates) — all hermetic per feature
- [Plan 4: Sync Cursor to Claude — Agent and Skill Synchronization](plans/4-sync-cursor-to-claude.plan.md) — Synchronize agents and skills from Cursor to Claude Code/Desktop at project-level. **Status: Implemented**
```

**Note**: Plan and feature document updates are ONLY performed if Verdict is "ready". If Verdict is "needs fixes" or "re-plan", plan and feature document remain unchanged.

## Key Fields

- **Conformance**: done | partial | no
- **Acceptance Criteria Check**: Status per criterion from plan
- **Implementation quality check**: pass | concerns | fail (test/criteria integrity + maintainability + architecture & design, generic; out-of-plan changes get explicit architectural assessment)
- **Risk Re-evaluation**: Updated risk assessment
- **Decision**: ready | needs-fixes | plan-fix | re-plan
- **Suggested git commit**: required **in `reports/{plan-slug}.audit.md`** when Verdict is **ready** (see Required Structure above); also repeated in chat

## problems.md (when verdict ≠ ready)

**File**: `notes/{plan-slug}.problems.md`

Write this file whenever verdict is `needs-fixes`, `plan-fix`, or `re-plan`. It is the primary input for the fixer/replanner that follows.

```markdown
# Audit Problems: {plan-slug} — {verdict} — {YYYY-MM-DD}

## Audit: {plan-slug} A{n} — {verdict}

### AC{n}: {criterion text}

- **Status**: FAIL | PARTIAL | UNKNOWN
- **Root cause**: implementation issue | plan error | approach wrong
- **Evidence**: [file paths, command output snippets, line references]
- **Expected vs Actual**: [what spec/AC says vs what was found]
- **Affected steps**: [Step N, Step M]
- **Affected files**: [list]
- **Fix scope**:
  - needs-fixes: [smallest code/test change]
  - plan-fix: [which step to amend and what to correct]
  - re-plan: [what needs rethinking]
- **Hint**: [1–3 sentences of corrective direction; no specific code]
```

**Rules:**

- One block per non-passing acceptance criterion
- `Root cause` must clearly distinguish between implementation fault vs plan fault
- For `plan-fix`: describe the plan text that was wrong and what it should say
- For `needs-fixes`: describe the implementation behavior that is wrong
- Auditor must not prescribe exact implementation — only direction
