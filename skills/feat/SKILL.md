---
name: feat
description: Create a feature document covering business context and initial architecture for a new feature using the PM and Architect workflow.
---

# Skill: /feat

**Purpose**: Create comprehensive feature documents that define complex, multi-phase work. Features are self-contained work units with their own plans, contexts, reports, and notes - unlike simple tasks which are single files.

The skill orchestrates a two-stage process: first, the Product Manager stage enriches the feature description with business context, problem statements, objectives, scope, and success criteria. Then, the Architect stage decides whether there is enough context to propose a lightweight Draft Plans List and creates a feature document whose planning surface is `## Plans`.

## Input Formats

Choose any of the following:

```
/feat {description}                    # Provide feature description directly
/feat "{feature-title}" {description}  # Feature title + description
/feat --jira TICKET-123 {description}  # With Jira ticket integration
/feat --atlassian ISSUE-456 {description}  # With Atlassian issue integration
/feat {description} --name {custom-slug}  # Custom feature directory name
```

**When {description} only**: Use provided text + auto-generate feature slug.

**When --jira or --atlassian provided**: Fetch ticket data via MCP integration + enhance with ticket context.

**When --name provided**: Use custom slug for feature directory (e.g. `feat-2026-01-custom-name`).

## When to Use Features vs Tasks

### Use Feature When:

- Work requires multiple implementation plans
- Need dedicated context documentation
- Requires progress reports and analysis
- Timeline: weeks to months
- High complexity with multiple phases
- Need structured knowledge accumulation

### Use Task When:

- Simple, straightforward work
- Timeline: days to 1 week
- Single file is sufficient
- No need for separate plans/contexts

## Instructions for user

- **Minimal case**: `/feat {your feature description}` — skill will create feature and orchestrate PM + Architect stages.
- **With Jira**: `/feat --jira TICKET-123 additional context` (fetches ticket data).
- **With Atlassian**: `/feat --atlassian ISSUE-456 additional context` (fetches issue data).
- **Custom name**: `/feat "My Feature" description... --name custom-slug` (custom directory naming).
- **Examples**:
  - `/feat Create user authentication flow with OAuth2 and WebAuthn options`
  - `/feat --jira PROJ-123 Implement role-based access control for admin panel`

## Instructions for model

You are executing the `/feat` command. This command follows a two-stage process: first as the Product Manager, then as the Architect.

**CRITICAL — Execution context**: When the user invokes `/feat` directly (inline mode, no "loop" or "auto"), execute BOTH stages **in the current context** — you ARE the PM for Stage 1, then you ARE the Architect for Stage 2. Do **NOT** launch subagents. Subagent delegation for `/feat` stages happens ONLY in loop/auto mode.

### Step 1: Execute as Product Manager

Use [Product Manager (product-manager.md)](../../agents/product-manager.md) role with:

- User-provided feature description/context
- Optional: Jira ticket ID (if `--jira TICKET-123` flag provided)
- Optional: Atlassian issue ID (if `--atlassian ISSUE-456` flag provided)
- Project context (if available)

The PM will:

1. Fetch ticket/issue data via MCP if `--jira` or `--atlassian` flag is provided
2. Enrich feature description with problem statement, business value, objectives, scope, and success criteria
3. Optionally propose high-level subtasks based on business/product logic

The PM outputs an enriched feature description: Summary, Problem Statement, Objectives, Context, Scope, Success Criteria, and optionally Proposed Subtasks. For internal/tooling features, PM may use `Internal Value` and omit `User Stories`.

### Step 2: Execute as Architect

After PM stage completes, switch to [Architect (architect.md)](../../agents/architect.md) role with:

- PM-enriched feature description
- PM's objectives and subtasks
- PM's scope definition
- Project context (if available)

The Architect will:

1. Analyze PM's objectives, scope, and subtasks
2. Decide whether there is enough context to suggest draft plans
3. Propose up to 5 draft plans when safe to do so
4. Leave `## Plans` empty except for the hint when context is still insufficient
5. Identify technical risks and missing information that affect plan decomposition

The Architect outputs a Draft Plans List only when context is sufficient. Each proposal is `N-{slug}` plus a one-line goal, not a phase specification.

### Step 3: Create Feature Document

After receiving PM-enriched content and the Architect decision about draft plans:

1. Get current date via `date +%Y-%m-%d`
2. Create feature directory structure (feat-YYYY-MM-{slug}/)
3. Create main feature file combining PM output with a `## Plans` section
4. Add cross-references to related documentation
5. Run documentation validation

**Inputs integration**:

- `/feat` produces feature documents (`feat-YYYY-MM-{slug}.md`).
- Create: when the feature doc is grounded in direct repo-file evidence, run `.pythia/runtime/inputs.js add <feature-doc> <dep> [<dep>...]` to record those direct source files. Do not run `update` on first creation.
- Revise stale feature doc: rewrite the document content first. Run `.pythia/runtime/inputs.js update <feature-doc>` only after the document already reflects the current source files.
- If there are no direct file dependencies, do not add an `inputs:` block.
- If `.pythia/runtime/inputs.js add` or `.pythia/runtime/inputs.js update` returns an error, show that raw failure to the user.

**Output**: Feature document in `.pythia/workflows/features/feat-YYYY-MM-{slug}/feat-YYYY-MM-{slug}.md`

**See also**: [/plan skill](../plan/SKILL.md), [/ctx skill](../ctx/SKILL.md), [/research skill](../research/SKILL.md), [/retro skill](../retro/SKILL.md)

### /feat sync

`/feat sync` is a manual reconciliation command for the user. It is not auto-triggered by `/feat` or `/plan`.

Behavior:

1. Determine the feature from explicit arg, then active context, otherwise ask the user for `feat-id`
2. Read all `plans/*.plan.md` files in the feature directory
3. Extract each plan title from `# Plan {slug}: {Title}` and status from `## Metadata`
4. Update `## Plans` in the feature doc:
   - replace matching checklist items with `- [{slug}](plans/{slug}.plan.md) — {Title} · Status: {status}`
   - keep unmatched checklist items unchanged
   - remove the hint only when all entries were converted to links
5. Write the updated feature doc
6. Return a diff-style summary in chat

Do not change frontmatter, feature status, or any sections outside `## Plans`.

## Active context item

At the end of every `/feat` or `/feat sync` response, output a verdict/state-aware `## Next Steps` block and active context footer.

### `/feat` next steps

After creating or updating a feature document:

```markdown
## Next Steps

Feature saved: `{feature-dir}/{feature-id}.md`

**Actions**
**[a]** Architect next plan - choose this to inspect the feature and propose the next concrete plan.
**[q]** Clarify scope - choose this to ask Product/Architect clarification questions about scope, risks, constraints, and missing context.
**[r]** Research topic - choose this to launch Researcher only after a concrete uncertainty/topic is identified.
**[s]** Sync plans - choose this to reconcile `## Plans` against existing plan files.

---
**Active context**: role: Product Manager · feat: {feat-id} · mode: create · skill: /feat
```

### `/feat sync` next steps

After completing `/feat sync`:

```markdown
## Next Steps

Feature sync complete: `{feature-dir}/{feature-id}.md`

**Actions**
**[a]** Architect next plan - choose this to inspect synced `## Plans` and propose the next missing, blocked, or highest-value plan.
**[q]** Clarify gaps - choose this to inspect stale scope, missing ownership, unclear plan boundaries, or context gaps.
**[p]** Plan now - choose this only after the target plan direction is clear.

---
**Active context**: role: Product Manager · feat: {feat-id} · mode: sync · skill: /feat
```

### Next-step chooser handling

After emitting `/feat` or `/feat sync` response, halt and wait for user input.

When the next user input is exactly one of the offered chooser keys:

- **`[a]` / `a`**: launch **Architect** subagent ([architect.md](../../agents/architect.md)) with the feature doc path and ask for next-plan proposal. Architect should not write a plan unless user confirms the proposed direction.
- **`[q]` / `q`** (`/feat` only): stay in current context and ask 3-5 Product/Architect clarification questions about scope, risks, constraints, and missing context. Do not edit artifacts.
- **`[q]` / `q`** (`/feat sync` only): stay in current context and clarify stale scope, missing ownership, unclear plan boundaries, or context gaps. Do not edit artifacts.
- **`[r]` / `r`** (`/feat` only): launch **Researcher** subagent ([researcher.md](../../agents/researcher.md)) only if the user supplies or confirms a concrete research topic/uncertainty. If topic is missing, ask for it first.
- **`[s]` / `s`** (`/feat` only): run `/feat sync {feature-dir}/{feature-id}.md` in current context.
- **`[p]` / `p`** (`/feat sync` only): launch Architect planning only when the plan direction is already clear; otherwise ask for the missing plan direction first.
- Any key not offered for the current feature state: reprint valid chooser keys and stop.

Do not treat arbitrary custom user messages as chooser input. Do not provide copyable `/ctx` or `/research` commands without a concrete topic because those commands need additional user context.

### Active context footer

Every `/feat` or `/feat sync` response must end with:

---
**Active context**: role: Product Manager · feat: {feat-id} · mode: {create|sync} · skill: /feat
