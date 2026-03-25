# Command: /run-feature-plan-loop

**Purpose**: Orchestrate the full plan loop from any checkpoint. Detects current state from artifacts and runs the appropriate next steps via subagents. Works in loop mode by default — each role is a separate subagent.

## Instructions for user

Provide **FEATURE_ID** (or path to feature dir) and **plan slug**.

Optional: specify entry point to force start from a specific step:

- `from review` — force start from review (plan already exists)
- `from implement` — force start from implementation (plan + review already READY)
- `from audit` — force start from audit (implementation already done)
- `from fix` — force start from post-audit fix/replan loop (audit already exists)

Without `from`, state is auto-detected from artifacts.

**Loop mode is the default for this command.** All roles run as subagents. Results return to this orchestrator context after each step.

---

## Instructions for model

You are the **Architect orchestrator**. Your job is to detect the current artifact state, determine the next step, spawn the appropriate subagent, wait for the result, and continue the loop.

**Feature dir**: determined from FEATURE_ID or feature doc path.  
**Plan path**: `{feature-dir}/plans/{plan-slug}.plan.md`

---

## Step 1 — State detection

Read artifact files to determine where the plan is in the lifecycle. Do NOT infer from chat history — read actual files.

```
1. Does plans/{plan-slug}.plan.md exist?
   NO  → EXIT: "Plan not found. Run /plan-feature first."

2. Does reports/{plan-slug}.review.md exist with a line starting with `Verdict: READY`?
   NO  → ENTRY: review

3. Does reports/{plan-slug}.implementation.md exist?
   NO  → ENTRY: implement

4. Does reports/{plan-slug}.audit.md exist?
   NO  → ENTRY: audit

5. Read the last `- **Verdict**:` line in reports/{plan-slug}.audit.md.
   ready      → DONE (report final status)
   needs-fixes → count existing needs-fixes iterations
              ≥ 2 → EXIT STUCK
              < 2 → ENTRY: fix (needs-fixes)
   plan-fix   → check if this is the first plan-fix pass
              already done once → escalate: ENTRY: re-plan
              first time → ENTRY: fix (plan-fix)
   re-plan    → ENTRY: re-plan
```

If the user specified `from {step}`, skip detection and jump to that entry directly.

---

## Step 2 — Subagent delegation model

**One subagent per role, one at a time. Wait for completion before spawning the next.**

| Role                       | Subagent                                    | Constraint                                                 |
| -------------------------- | ------------------------------------------- | ---------------------------------------------------------- |
| Reviewer                   | `reviewer` subagent                         | Always separate context; never run in orchestrator context |
| Developer                  | `developer` or `feature-developer` subagent | One per implementation round                               |
| Architect (audit)          | `architect` subagent                        | Fresh subagent, never same context as preceding developer  |
| Architect (plan-fix patch) | Current context (orchestrator)              | Orchestrator reads problems.md and patches plan directly   |

After each subagent completes, re-read the relevant artifact file to verify the step produced output before continuing.

---

## Loop sequences

### ENTRY: review

```
1. Spawn Reviewer subagent
   Prompt: "You are the Reviewer subagent. Review plan {plan-slug} for feature {feature-dir}.
   Read plans/{plan-slug}.plan.md and write the review to reports/{plan-slug}.review.md.
   Follow .cursor/commands/review-plan-feature.md."
   Wait.

2. Read reports/{plan-slug}.review.md — find verdict.
   READY       → ENTRY: implement
   NEEDS_REVISION:
     count review rounds. If ≥ MAX_REVIEW_LOOPS (2):
       EXIT DEADLOCKED: "Review cycles exhausted. Scope needs user input."
     Else:
       Architect (current context) runs replan:
         Read problems from review, patch plan, save revised plan.
         Note: use Trigger 1 replan procedure from replan-feature.md.
       → loop back to step 1 (next review round)
```

### ENTRY: implement

```
1. Spawn Developer subagent
   Prompt: "You are the Developer. Execute plan {plan-slug} for feature {feature-dir}.
   Plan: plans/{plan-slug}.plan.md. Review: reports/{plan-slug}.review.md.
   Write implementation report to reports/{plan-slug}.implementation.md.
   Follow .cursor/commands/implement-plan-feature.md."
   Wait.

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
   Follow .cursor/commands/audit-implementation-feature.md.
   Do NOT continue the loop — only audit and write artifacts."
   Wait.

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
1. Read notes/{plan-slug}.problems.md (audit findings)
   Perform the minimal fix for each issue in problems.md.
   Append all work to the last Implementation Round's Out-of-Plan Work.
   Do not create a new implementation round.
   Follow .cursor/commands/implement-plan-feature.md (refinement mode)."
   Wait.

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

5. Spawn Developer subagent (full re-implement of affected steps)
   Prompt: "You are the Developer. Re-execute the plan for {plan-slug}, feature {feature-dir}.
   The plan was patched (plan-fix). Start a new implementation round.
   Plan: plans/{plan-slug}.plan.md. Focus on steps marked **Amended**.
   Follow .cursor/commands/implement-plan-feature.md."
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
  Then run /replan-feature to revise the plan (Trigger 2: implementation issues),
  followed by /review-plan-feature and then /implement-plan-feature."

Do not auto-spawn Reviewer or Architect for replan — scope decisions require user input.

Exception: if user explicitly said "loop with re-plan authority" or "auto full loop":
  Architect (current context) runs /replan-feature (Trigger 2) and patches plan.
  → ENTRY: review (full review cycle)
  → ENTRY: implement
  → ENTRY: audit
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
