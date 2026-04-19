# Automation Workflow Guide

**Purpose**: Guide for identifying, tracking, and acting on process automation opportunities during feature planning, review, implementation, and audit cycles. **Closely related: Codebase Observations Guide** — agents should also systematically record bugs, technical debt, and architecture issues encountered during work (see below).

---

## Important Note: Observations (not just Automation)

Agents should **always** record observations beyond just automation:
- **Bugs** or fragile code patterns encountered
- **Technical debt** shortcuts that should be addressed
- **Architecture issues** or layering violations you notice
- Code that is **hard to maintain** or test
- **Missing error handling** or edge cases
- **Performance concerns**

These are recorded in `## [Type] Observations` sections in the same way, without `[automation]` prefix. **Observations are not optional** — they protect future work from repeating mistakes observed during current feature cycle.

---

## Overview

The Pythia workflow systematically captures:
1. **Codebase observations**: bugs, tech debt, architecture issues, maintenance concerns
2. **Automation opportunities**: repeating manual operations, procedural workflows, boilerplate patterns

When agents notice either category during work, they record in **Observations sections** (Architect, Developer, Reviewer). Automation entries use `[automation]:` prefix; codebase observations use no prefix. Both accumulate and inform retrospective analysis.

This document focuses on automation tracking. For general observations guidance, see sections marked [Observations] below.

---

## Automation Tracking Points

### 1. **Planning Phase** (`/plan`)

**Who**: Architect  
**Where**: `## Architect Observations` section in plan document  
**What**: While creating plan steps, Architect notices patterns and issues. Records with no prefix for codebase observations (bugs, tech debt, architecture issues), and with `[automation]:` prefix for automation opportunities.

**[Observations] Codebase issues to record** (each with priority label `[high|mid|low|nit]`):
- Bugs or fragile patterns you notice in code you touch
- Technical debt or shortcuts that should be addressed
- Architecture violations or poor layering
- Code that is hard to work with or maintain
- Missing error handling or edge cases

**Examples**:
```markdown
## Architect Observations

- `[high]` Bug in Step 2's module: error handling swallows validation failures — critical issue
- `[automation]` Steps 2, 5, and 7 all require manual config validation against schema X — repeating pattern
- `[mid]` Technical debt: Step 5 integrates with deprecated API
```

**Action**: Expected — record both codebase issues and automation ideas.

---

### 2. **Review Phase** (`/review`)

**Who**: Reviewer  
**Where**: `## Reviewer Observations` section in review report  
**What**: While reviewing plan for quality, Reviewer notices codebase issues and automation opportunities. Records without prefix for codebase issues (bugs, tech debt, architecture risks), and with `[automation]:` prefix for procedural patterns.

**[Observations] Codebase issues to record**:
- Bugs or fragile patterns noticed while reading plan/code
- Technical debt in adjacent areas touched by plan
- Architecture risks or violations in related code
- Code that is hard to maintain or test
- Missing error handling you discover
- Performance concerns in related modules

**Examples**:
```markdown
## Reviewer Observations

- `[high]` Step 3 touches module X which has known critical issue Y documented in Issue #456
- `[mid]` Architecture risk: Step 5 violates layering rule by importing concrete types instead of interfaces
- `[automation]` Steps 3 and 5 both perform similar state validation — repeating pattern
```

**Action**: Expected — record observations every review round.

---

### 3. **Implementation Phase** (`/implement`)

**Who**: Developer  
**Where**: `## Developer Retrospective` section in implementation report (labels in `### I{n}` blocks) AND `## Developer Observations` section (codebase issues)  
**What**: During execution, Developer observes patterns and code issues. Records in Retrospective with labels `[codebase]`, `[tooling]`, `[plan]`, `[process]`, `[risk]`, `[automation]`. Also records codebase observations in Developer Observations section.

**[Observations] Codebase issues to record in Developer Observations**:
- Bugs or fragile patterns encountered during implementation
- Technical debt that blocks or complicates work
- Architecture issues in code you touch or integrate with
- Code that is hard to work with or test
- Missing error handling you discover
- Performance problems you encounter

**Examples** (Retrospective):
```markdown
## Developer Retrospective

### I1 — 2025-04-17

- [codebase]: Module X in Step 3 has inefficient loop; slowed down test by 2min
- [automation]: Validation in Step 3 and Step 5 both run validation-check.sh — could be single script
- [risk]: Out-of-plan: had to work around missing error handling in dependency lib
```

**Examples** (Developer Observations):
```markdown
## Developer Observations

- `[high]` Fragile error handling in Module Y makes debugging difficult; masks root cause — blocks timeout investigation
- `[mid]` Technical debt: Configuration validation repeats 3x in different places
- `[low]` Architecture: Module Z violates layering by importing concrete types from Module A
```

**Action**: Expected — record both codebase issues and automation observations during every implementation round.

---

### 4. **Replan Phase** (`/replan`)

**Who**: Architect  
**Where**: `## Architect Retrospective` section in plan (new `### v{N}` block) AND `## Architect Observations` section  
**What**: When replanning based on review or implementation, Architect synthesizes observations from all sources:
- Reviewer's notes (from review round)
- Developer's observations (from implementation round)
- Architect's own codebase observations from plan iteration

**[Observations] Synthesis rules**:
- Collect all codebase observations from Reviewer and Developer
- If multiple rounds note similar issues → consolidate into one observation
- Focus on patterns that affect multiple areas or future features
- Examples: "fragile error handling pattern appears in 2 modules", "tech debt blocking 3 steps"

**Examples**:
```markdown
## Architect Retrospective

### v2 — R1 — 2025-04-17

- [plan] Added Step 8 to clarify data flow
- [codebase] Reviewer and Developer both noted fragile error handling pattern in Module X affecting multiple steps
- [automation]: Steps 2, 5, 7 all perform similar config validation — repeating pattern

## Architect Observations

- `[high]` Module Y error handling bug; affects Step 2 and Step 5
- `[mid]` Fragile error handling pattern in logging module observed across feature
- `[low]` Deprecated API integration in adjacent code
```

**Action**: Expected — synthesize observations every replan cycle to inform both immediate fixes and long-term codebase health.

---

### 5. **Audit Phase** (`/audit`)

**Who**: Architect (auditor)  
**Where**: Audit report text and plan update (if verdict is `ready`)  
**What**: When auditing implementation:
- Review Developer Observations for codebase issues
- Review Developer Retrospective for `[automation]` entries
- Assess whether observations indicate:
  - **Codebase health issues** that should be tracked (bugs, tech debt)
  - **Automation opportunities** that merit skill creation

If verdict is `ready`, Architect may optionally synthesize key observations in audit summary or as forward-looking recommendations.

**[Observations] Actions**:
- Summarize codebase issues observed during implementation
- Note if patterns appear in multiple areas (potential systemic issues)
- Flag tech debt that blocks or complicates future work
- Summarize automation opportunities for backlog

**Action**: Summarize in audit report. Observations inform both immediate fixes (if verdict ≠ ready) and long-term improvements (tech debt backlog, skill creation queue).

---

### 6. **Retrospective Phase** (`/retro`)

**Who**: Architect  
**Where**: Multiple sections in feature retrospective report  
**What**: Comprehensive synthesis of all observations (both codebase issues and automation) from:
- All Architect Retrospective blocks (plans + replans)
- All Architect Observations (plans + replans)
- All Developer Retrospective blocks (all implementation rounds)
- All Developer Observations (all implementation rounds)
- All Review findings and Reviewer Observations

**[Observations] Sections in retro output**:

1. **Codebase Knowledge Base** — Distilled insights about code quality, patterns, issues:
   - Recurring bugs or fragile patterns
   - Technical debt themes
   - Architecture violations
   - Maintenance concerns ordered by severity

2. **Key Discoveries** — Evidence-backed findings with cross-references:
   - How many times pattern appeared
   - Which modules/features affected
   - Why it matters (blocking, performance, security, maintainability)

3. **Automation Opportunities** — Repeating manual operations:
   - Pattern description
   - Frequency (# of occurrences across feature/features)
   - Candidate skill name and purpose
   - Estimated effort/benefit, priority

**Actions from observations**:
- **Codebase issues** → Input to team for backlog prioritization (bugs, debt, maintenance concerns)
- **Automation opportunities** → Input to team for skill creation backlog (high-ROI repeating patterns)

**Overall**: Retrospective consolidates distributed observations into consolidated insights for team review and future planning decisions.

---

## Workflow Flow

```
         ┌─────────────────────┐
         │   Planning (/plan)  │
         │ - Architect notices │
         │   patterns          │
         │ - Record in Obs.    │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │   Plan created      │
         │ (with [automation]) │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │  Review (/review)   │
         │ - Reviewer notices  │
         │   procedures        │
         │ - Record in concerns│
         │ - [automation]:     │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │ Implementation      │
         │ (/implement)        │
         │ - Developer runs it │
         │ - Notices repeats   │
         │ - Records in Retro  │
         │ - [automation]:     │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │   Replan (/replan)  │
         │ - Architect reads   │
         │   all [automation]  │
         │   entries           │
         │ - Synthesizes into  │
         │   Arch Retro block  │
         │ - [automation]:     │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │   Audit (/audit)    │
         │ - Review [automation│
         │   findings          │
         │ - Inform summary    │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │ Retrospective       │
         │ (/retro)            │
         │ - Collect all       │
         │ - Synthesize        │
         │ - "Automation       │
         │   Opportunities"    │
         │   section           │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │ Team Backlog        │
         │ - Review retro      │
         │ - Decide on skills  │
         │ - Create tickets    │
         └─────────────────────┘
```

---

## When to Create a Skill

**Criteria for automation skill creation** (based on retrospective synthesis):

1. **Appears 2+ times**: Pattern observed in 2+ features OR 3+ plan steps within same feature
2. **Clear scope**: Can be described in 1-2 sentences; not too broad
3. **No existing tool**: Checked SKILL.md catalog; no pre-existing equivalent
4. **Effort-benefit ratio**: Estimated implementation effort is lower than expected savings (e.g., 1-day task saves 3+ days per feature)

**Typical skill creation workflow**:

1. **Post-retro**: Team reviews Automation Opportunities section
2. **Estimate**: Architect/Lead + interested Developer assess time + impact
3. **Schedule**: Assign to next sprint or backlog
4. **Create**: Use `.claude/skills/{skill-name}/SKILL.md` template
5. **Test**: Validate in 1-2 features before adoption
6. **Document**: Add to SKILL.md catalog and Pythia instructions

---

## Best Practices

### For Agents (during capture)

**Codebase Observations** (high priority):
- **Record bugs and fragile code**: Don't ignore — include them even if outside plan scope
- **Note tech debt**: Track shortcuts, deprecated APIs, missing error handling
- **Architecture issues**: Flag layering violations, poor abstractions, tight coupling
- **Specificity**: Include module name, symptoms, why it matters (blocking? slow? hard to maintain?)
- **Examples**: "Module X swallows errors in exception handler making debugging hard"; "Memory leak in loop in Step 3"; "Deprecated API Y used in adjacent code should be upgraded"

**Automation Opportunities**:
- **Be specific**: Record what operation repeats and where (steps, rounds, files)
- **Estimate scope**: If possible, note how many times pattern appears
- **Suggest skill purpose**: Help future readers (or skill creators) understand intent
- **Avoid false positives**: Don't record one-off workarounds or minor config differences as automation candidates

### For Team (during retrospective)

**Codebase Observations**:
- **Review all entries**: Examine bugs, tech debt, architecture issues from all agents
- **Assess severity**: Prioritize by impact (blocking > performance > maintainability)
- **Assign** to tech debt backlog or next sprint if high-impact
- **Track**: Create tickets for bugs/issues that block future work
- **Queue**: Consider architecture improvements as separate backlog stream

**Automation Opportunities**:
- **Synthesize**: Group similar patterns; don't treat every entry as independent
- **Prioritize**: Focus on patterns that affect multiple features or consume significant execution time
- **ROI**: Estimate effort required vs. time saved across future features
- **Validate**: Before creating skill, discuss with team member(s) who observed the pattern
- **Document**: Link skills back to the automation opportunities that motivated them

**Combined action**: Use retrospective to populate 2 backlogs: **Codebase Health** (bugs, tech debt, architecture) and **Process Automation** (skills, tooling).

### Example: Bad Entry (Avoid)

```markdown
[automation]: Step 2 does something
```

### Example: Good Codebase Observation (Follow)

```markdown
Module X swallows exceptions in error handler, making failures hard to debug — appears in steps 2 and 5 and blocks timeout investigation
```

### Example: Good Automation Entry (Follow)

```markdown
[automation]: Step 2 and Step 5 both run validation-check.sh with schema X and then inspect output manually. 
Config pattern repeats in other features (feature-X step 3, feature-Z step 6). 
Candidate: parametric validator skill that takes schema + config and returns structured result.
```

---

## Example: Feature Execution with Observations

### Feature X Lifecycle

1. **Architect plans** (using `/plan`):
   - While designing steps, notices Module Y has error handling issues
   - Records in Observations: `[high] Module Y in Step 3 swallows validation errors — hard to debug, critical`
   - Observes Steps 2, 5, 7 all validate config identically
   - Records: `[automation]: Config validation pattern repeats 3x — parametric-validator candidate`

2. **Reviewer reviews** (using `/review`):
   - Reads plan, notes Module Y error handling is indeed fragile
   - Records in Reviewer Observations: `[high] Module Y error handling is unsafe; blocks debugging — should be fixed or add to plan`
   - Notices Steps 3–5 are similar
   - Records: `[automation]: Consider unifying config workflow per Architect note`

3. **Developer implements** (using `/implement` & Developer role):
   - During Step 3, encounters missing error handling that early observations predicted
   - Records: `[high] Module Y error handling bug: validation calls fail silently — had to add try/catch workaround`
   - Runs validation 3 times, notices boilerplate
   - Records in Retrospective: `[automation]: Validation cmdline identical in all 3 checks — could be single script`

4. **Architect audits** (using `/audit`):
   - Reads Developer Observations with priority `[high]` for Module Y error handling
   - Confirms it matches Architect and Reviewer notes (all noted it as `[high]`)
   - Evaluates: Observation was addressed with workaround, but root cause not fixed
   - Synthesizes in audit: "Recurring Module Y error handling issue; workaround deployed but architectural problem remains. Recommend: add to tech debt backlog or create separate plan for proper fix in next sprint."

5. **Architect generates retro** (using `/retro`):
   - Collects observations and prioritization:
     - `[high]` issues: Module Y error handling (3 independent observations, 1 fixed with workaround)
     - `[mid]` issues: none
     - `[low]` issues: none
     - **Automation**: Config validation workflow (3 occurrences), error handling wrapper
   - **Unfixed Observations & Recommendations** section:
     - `[high]` Module Y error handling (observed across 3 agents) — Team evaluates: quick fix? separate plan? defer?
   - Retro report also has:
     - **Codebase Knowledge Base**: "Module Y error handling pattern unsafe; affects validation, debugging; shared observation pattern"
     - **Automation Opportunities**: "Config validation repeats 3x; error handling wrapper candidate"

6. **Team acts**:
   - **Codebase Health backlog**: 
     - `[high]` Module Y error handling → Team decides priority (immediate vs. next sprint vs. backlog)
     - May propose separate plan or refactor ticket
   - **Automation backlog**: 
     - parametric-validator skill candidate (priority: team decides)
     - error-handling-wrapper skill candidate (priority: team decides)
   - **Next feature planning**: 
     - Team reviews whether Module Y limitation affects scope
     - Plans for parametric-validator skill if created
     - Documents Module Y status in feature context

---

## See Also

- [plan-format.md](./plan-format.md) — Architect Retrospective and Observations structure
- [SKILL.md template](../../skills-template/SKILL.md) — Creating new skills
- [skill-search-and-fit](../skill-search-and-fit/SKILL.md) — Before creating, check if skill already exists
