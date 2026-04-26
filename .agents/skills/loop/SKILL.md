---
name: loop
description: Orchestrate the full feature workflow loop by detecting artifact state and routing through review, implementation, audit, and follow-up steps.
applyTo: []
---

# /loop

**Purpose**: Orchestrate the full plan loop from any checkpoint. Detects current state from artifacts and runs the appropriate next steps via subagents.

## Instructions for user

**No arguments** (auto-detect from chat):

- `/loop` — infer FEATURE_ID and plan-slug from chat history, auto-detect artifact state

**With FEATURE_ID**:

- `/loop feat-2026-01-xxx` — auto-detect plan-slug from dir, auto-detect state
- `/loop feat-2026-01-xxx 1-plan-slug` — explicit feature + plan

**Reference by artifact**:

- `/loop plan` — reference current plan from chat (infer feature + slug)
- `/loop R{n}` — reference review round (e.g. `loop R2` → find review.md round 2, infer feature + plan)
- `/loop I{n}` — reference impl round (e.g. `loop I1` → find implementation.md round 1, infer feature + plan)

**Entry point override** (optional, rarely used):

- `/loop feat-2026-01-xxx from review` — force start from review
- `/loop feat-2026-01-xxx from implement` — force from implementation
- `/loop feat-2026-01-xxx from audit` — force from audit
- `/loop feat-2026-01-xxx from fix` — force from post-audit fix

---

## Instructions for model

You are the **Architect orchestrator** ([architect.md](../agents/architect.md)). Job: detect artifact state, route to next step, spawn subagents, continue loop.

### Input Parsing

**Parse user input intelligently**:

1. **No arguments** → Search chat history for FEATURE_ID and plan-slug
   - Look for recent references to feature documents or plan slugs
   - If ambiguous → ask user to clarify

2. **Reference by artifact** → Parse and infer feature context
   - `plan` → Search chat for "plan" mentions, infer FEATURE_ID and slug
   - `R{n}` → Search chat for review round reference, extract feature-dir from path, count existing review rounds to verify
   - `I{n}` → Search chat for impl reference, extract feature-dir, verify round exists

3. **With explicit FEATURE_ID** → Validate and proceed
   - If no plan-slug provided → list available plans in `{feature-dir}/plans/` and pick latest/default
   - If no `from` provided → proceed to auto-detection

### State Detection

Read artifact files to determine lifecycle position:

```
1. Does plans/{plan-slug}.plan.md exist?
   NO  → EXIT: "Plan not found. Use /plan skill first."

2. Does reports/{plan-slug}.review.md exist with Verdict: READY?
   NO  → ENTRY: review

3. Does reports/{plan-slug}.implementation.md exist?
   NO  → ENTRY: implement

4. Does reports/{plan-slug}.audit.md exist?
   NO  → ENTRY: audit

5. Read last **Verdict**: line in audit.md
   ready        → DONE
   needs-fixes  → ENTRY: fix (needs-fixes)
   plan-fix     → ENTRY: fix (plan-fix)
   re-plan      → ENTRY: re-plan
```

### Subagent Orchestration

**One subagent per role, one at a time. Wait for completion before next.**

**Orchestrator MUST NOT** create or edit role artifacts meant for subagents: `reports/{plan-slug}.review.md`, `reports/{plan-slug}.implementation.md`, or `reports/{plan-slug}.audit.md`. The orchestrator only reads them, routes, and (for plan-fix only) patches `plans/{plan-slug}.plan.md`. Skipping a real subagent handoff and writing those files in the orchestrator context is incorrect.

**Workflow-doc validation (orchestrator-owned)**: After any subagent (Reviewer / Developer / Audit) writes or materially updates a workflow Markdown artifact, **or** after the orchestrator saves `plans/{plan-slug}.plan.md` in **ENTRY: fix (plan-fix)**, the orchestrator **must** run workflow-doc validation before routing onward: spawn a **Validator subagent** using the **handoff prompt** in [/validate skill](../validate/SKILL.md) § Validator subagent (delegation) (**absolute** validate skill path + **absolute** artifact path), or use **inline fallback** per that skill and state so. **Exit `0` required** before parsing verdicts or entering the next ENTRY. This satisfies the child-skill validation requirement so Reviewer/Developer/Audit subagents may skip nested Validator when the orchestrator documents the run.

**Concrete tooling (orchestrator — if “Validator subagent” is unclear)**: Use a **separate delegated task** (e.g. Cursor **Task**) so validation does not run inside the orchestrator thread — commonly `subagent_type="generalPurpose"` or another **short, shell-capable** one-shot type your host documents. Put **only** the filled **handoff prompt** from [/validate skill](../validate/SKILL.md) § Validator subagent in that task (two absolute paths); **do not** paste ENTRY routing notes, parsed verdicts, or the workflow artifact body — only validation instructions.

**ENTRY: review** → Spawn Reviewer subagent (full procedure: `### ENTRY: review` below)

- Subagent reads plan + contexts, appends review round to `review.md`
- Route: READY → implement | NEEDS_REVISION → replan (see review loop limits)

**ENTRY: implement** → Spawn Developer subagent

- Read plan.md + review.md
- Execute steps, run validation
- Write implementation.md (results + errors)
- Route: → audit

**ENTRY: audit** → Spawn fresh Architect subagent (independent of Developer)

- Read plan.md + implementation.md
- Verify acceptance criteria, assess code quality
- Write audit.md + problems.md (if verdict ≠ ready)
- Route: ready → DONE | needs-fixes/plan-fix → fix | re-plan → BLOCKED

**ENTRY: fix (needs-fixes)** → Spawn Developer subagent (refinement mode)

- Read problems.md
- Minimal fixes only (append to impl.md Out-of-Plan Work, no new round)
- Re-audit

**ENTRY: fix (plan-fix)** → Orchestrator (current context)

- Patch plan.md (≤ 2 steps only)
- Increment Plan-Version, add revision log
- Spawn Developer subagent to re-implement amended steps
- Re-audit (if second plan-fix → escalate to re-plan)

**ENTRY: re-plan** → Report BLOCKED

- User must use `/replan skill` for scope decisions
- (Optional: if user authorized "full auto loop" → Architect patches plan + re-review)

### Exit Conditions

| Status            | Action                                                    |
| ----------------- | --------------------------------------------------------- |
| `ready`           | **DONE** — report success, commit message, artifact paths |
| `needs-fixes ≥ 2` | **STUCK** — manual fix needed                             |
| `plan-fix ≥ 2`    | **ESCALATE** → re-plan                                    |
| `re-plan`         | **BLOCKED** — user decision required                      |
| Review ≥ 2        | **DEADLOCKED** — user decision required                   |

**See also**: [/replan skill](../replan/SKILL.md), [/plan skill](../plan/SKILL.md)

### ENTRY: review

```
1. Spawn Reviewer subagent (separate context — do not perform the review in the orchestrator thread).
   The orchestrator MUST NOT write or edit reports/{plan-slug}.review.md.

2. Pass a self-contained prompt so the subagent does not depend on hidden chat state. Use this
   template (substitute {feature-dir}, {plan-slug}, {R-next} after counting existing ## … R… headers):

   Prompt: "You are the Reviewer subagent, not the loop orchestrator.
   Handoff: Architect orchestrator started ENTRY: review for this feature/plan.
   Feature directory: {feature-dir}
   Plan slug: {plan-slug}
   Next review round: {R-next} (append only; new ## {plan-slug} R{R-next} block at EOF per review format).
   Read:
   - plans/{plan-slug}.plan.md
   - Related contexts under contexts/ as mandatory per [/review skill](../review/SKILL.md)
   Write/update:
   - reports/{plan-slug}.review.md (Navigation + Observations + new round; follow review-format.md)
   Produce Verdict: READY or NEEDS_REVISION in the new round (per review-format.md).
   Follow [/review skill](../review/SKILL.md) and [reviewer.md](../agents/reviewer.md) in full.
   Do NOT implement code, do NOT patch the plan, do NOT run later loop steps (implement/audit)."

3. Wait for the subagent to finish.

3b. Workflow-doc validation: Validator subagent (or inline fallback per [/validate skill](../validate/SKILL.md)) for `reports/{plan-slug}.review.md`. Exit `0` required.

4. Verify reports/{plan-slug}.review.md exists and the latest round contains an explicit verdict
   line the orchestrator can parse (Verdict: READY | NEEDS_REVISION).

5. Route: READY → ENTRY: implement | NEEDS_REVISION → if review rounds < max: [/replan](../replan/SKILL.md)
   path per workflow (user or authorized replan) then re-enter ENTRY: review; if at max rounds → DEADLOCKED exit.
```

### ENTRY: implement

```
1. Spawn Developer subagent
   Prompt: "You are the Developer. Execute plan {plan-slug} for feature {feature-dir}.
   Plan: plans/{plan-slug}.plan.md. Review: reports/{plan-slug}.review.md.
   Write implementation report to reports/{plan-slug}.implementation.md.
   Follow the [/implement skill](../implement/SKILL.md)."
   Wait.

1b. Workflow-doc validation: Validator subagent (or inline fallback per [/validate skill](../validate/SKILL.md)) for `reports/{plan-slug}.implementation.md`. Exit `0` required.

2. Verify reports/{plan-slug}.implementation.md was written (check file exists and is non-empty).
   → ENTRY: audit
```

### ENTRY: audit

```
1. Spawn fresh Architect subagent
   Prompt: "You are the Architect auditor. Audit implementation of plan {plan-slug} for {feature-dir}.
   Plan: plans/{plan-slug}.plan.md. Implementation: reports/{plan-slug}.implementation.md.
   Write audit to reports/{plan-slug}.audit.md.
   If verdict ≠ ready, write problems to notes/{plan-slug}.problems.md.
   Follow the [/audit skill](../audit/SKILL.md).
   Do NOT continue the loop — only audit and write artifacts."
   Wait.

1b. Workflow-doc validation: Validator subagent (or inline fallback per [/validate skill](../validate/SKILL.md)) for `reports/{plan-slug}.audit.md`. Exit `0` required.

2. Read reports/{plan-slug}.audit.md — find verdict.
   → route by verdict (see Post-audit routing below)
```

### ENTRY: fix (needs-fixes)

```
iteration_count += 1
If iteration_count > 2:
  EXIT STUCK: "Needs-fixes loop exceeded 2 iterations. Manual intervention required."
  Report: last audit verdict, path to problems.md, recommended next step.

1. Spawn Developer subagent (refinement mode)
   Prompt: "You are the Developer in REFINEMENT mode for plan {plan-slug}, feature {feature-dir}.
   Read:
   - plans/{plan-slug}.plan.md
   - reports/{plan-slug}.implementation.md (last round)
   - notes/{plan-slug}.problems.md (audit findings)
   Perform the minimal fix for each issue in problems.md.
   Append all work to the last Implementation Round's Out-of-Plan Work.
   Do not create a new implementation round.
   Follow the [/implement skill](../implement/SKILL.md) (refinement mode)."
   Wait.

1b. Workflow-doc validation: Validator subagent (or inline fallback per [/validate skill](../validate/SKILL.md)) for `reports/{plan-slug}.implementation.md`. Exit `0` required.

2. → ENTRY: audit (fresh re-audit)
```

### ENTRY: fix (plan-fix)

```
[Orchestrator — current context]

1. Read notes/{plan-slug}.problems.md.
2. Read plans/{plan-slug}.plan.md.
3. For each problem marked as `plan error`:
   - Amend the affected step in the plan.
   - Add version marker: **Amended**: v{N} (A{audit-round})
   - Increment Plan-Version.
   - Add revision log entry (trigger: Audit A{audit-round}).
4. Save updated plan to plans/{plan-slug}.plan.md.

4b. Workflow-doc validation: Validator subagent (or inline fallback per [/validate skill](../validate/SKILL.md)) for `plans/{plan-slug}.plan.md`. Exit `0` required.

5. Spawn Developer subagent (full re-implement of affected steps)
   Prompt: "You are the Developer. Re-execute the plan for {plan-slug}, feature {feature-dir}.
   The plan was patched (plan-fix). Start a new implementation round.
   Plan: plans/{plan-slug}.plan.md. Focus on steps marked **Amended**.
   Follow the [/implement skill](../implement/SKILL.md)."
   Wait.

6. → ENTRY: audit (fresh re-audit)
   Note: if this second audit produces plan-fix again → escalate to ENTRY: re-plan.
```

### ENTRY: re-plan

```
[Stop auto-continuation — require user decision]

Report to user:
  "Audit verdict is `re-plan`. This requires scope and architectural decisions.
  Please review:
  - reports/{plan-slug}.audit.md
  - notes/{plan-slug}.problems.md
  Then use [/replan skill](../replan/SKILL.md) to revise the plan,
  followed by [/review skill](../review/SKILL.md) and then [/implement skill](../implement/SKILL.md)."

Do not auto-spawn Reviewer or Architect for replan — scope decisions require user input.

Exception: if user explicitly said \"loop with re-plan authority\" or \"auto full loop\":
  Architect (current context) uses [/replan skill](../replan/SKILL.md) (Trigger 2) and patches plan.
  → ENTRY: review (full review cycle via [/review](../review/SKILL.md))
  → ENTRY: implement (via [/implement](../implement/SKILL.md))
  → ENTRY: audit (via [/audit](../audit/SKILL.md))
  If result is still not ready → EXIT BLOCKED.
```

---

## Post-audit routing (after ENTRY: audit completes)

| Verdict       | Route                      |
| ------------- | -------------------------- |
| `ready`       | → EXIT DONE                |
| `needs-fixes` | → ENTRY: fix (needs-fixes) |
| `plan-fix`    | → ENTRY: fix (plan-fix)    |
| `re-plan`     | → ENTRY: re-plan           |

---

## Exit conditions

| Condition                          | Message                                                                          |
| ---------------------------------- | -------------------------------------------------------------------------------- |
| `ready`                            | **DONE** — report final status, commit message from audit.md, and artifact paths |
| `needs-fixes` ≥ 2                  | **STUCK** — report last problems.md path + "Manual fix needed"                   |
| `plan-fix` → second audit ≠ ready  | **ESCALATING** — auto-route to re-plan (if authorized) or report                 |
| `re-plan` from audit               | **BLOCKED** — report, require user input                                         |
| Review ≥ 2 rounds + NEEDS_REVISION | **DEADLOCKED** — report, require user input                                      |

---

## Iteration tracking

The orchestrator tracks iteration counts in memory (not in files) for the current run:

- `needs_fixes_iterations`: incremented each time fix (needs-fixes) runs
- `plan_fix_done`: boolean, set when fix (plan-fix) runs once
- `review_rounds`: read from review file (count `## {plan-slug} R{n}` headers)

---

## Orchestrator response format

After each subagent completes, report its result briefly before continuing:

```markdown
## Loop iteration {n}

**Step**: {step name}
**Subagent**: {role}
**Result**: {artifact written, verdict if applicable}
**Next**: {what the orchestrator will do next}
```

On exit:

```markdown
## Loop complete

**Final status**: {DONE | STUCK | BLOCKED | DEADLOCKED | ESCALATING}
**Verdict**: {last audit verdict}
**Artifact**: {feature-dir}/reports/{plan-slug}.audit.md
**Problems** (if any): {feature-dir}/notes/{plan-slug}.problems.md
**Commit message** (if ready): [from audit.md]
**Iterations**: review={n}, implement={n}, audit={n}, fix={n}
```
