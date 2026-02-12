# Architect Audit Format Specification

**File**: `reports/{plan-slug}.audit.md`

## Required Structure

```markdown
# Architect Audit: {plan-slug}

## Conformance
- Status: done | partial | no
- Details: [what was done vs plan]

## Acceptance Criteria Check
- [ ] Criterion 1 — [status]
- [ ] Criterion 2 — [status]

## Risk Re-evaluation
[Reassess risks from plan]

## Decision
- **Verdict**: ready | needs fixes | re-plan
- **Reasoning**: [why]
- **Next Steps**: [what to do]
```

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
```

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
- **Risk Re-evaluation**: Updated risk assessment
- **Decision**: ready | needs fixes | re-plan
