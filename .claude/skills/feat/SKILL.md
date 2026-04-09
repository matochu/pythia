sequenceDiagram
    participant User
    participant Orchestrator as 🎪 Orchestrator<br/>(Architect)
    participant Reviewer as 👁️ Reviewer<br/>subagent
    participant Developer as 👨‍💻 Developer<br/>subagent
    participant Auditor as ✍️ Architect Auditor<br/>subagent
    participant Artifacts as 📁 Files

    User->>Orchestrator: /loop [feature-id] [plan-slug]
    Orchestrator->>Artifacts: Read status
    
    alt No plan found
        Orchestrator-->>User: ERROR: Use /plan first
    else Review needed
        Orchestrator->>Reviewer: Spawn subagent<br/>Review plan
        Reviewer->>Artifacts: Read plan.md
        Reviewer->>Artifacts: Write review.md
        Reviewer-->>Orchestrator: Done, Verdict: READY
        Orchestrator->>Artifacts: Verify review exists
    else Implement needed
        Orchestrator->>Developer: Spawn subagent<br/>Execute plan
        Developer->>Artifacts: Read plan.md + review.md
        Developer->>Artifacts: Write impl.md
        Developer-->>Orchestrator: Done, Steps executed
        Orchestrator->>Artifacts: Verify impl exists
    else Audit needed
        Orchestrator->>Auditor: Spawn fresh subagent<br/>Audit implementation
        Auditor->>Artifacts: Read plan.md + impl.md
        Auditor->>Artifacts: Write audit.md + problems.md
        Auditor-->>Orchestrator: Done, Verdict: ready/needs-fixes/plan-fix/re-plan
        
        alt Verdict: ready
            Orchestrator-->>User: ✅ DONE!
        else Verdict: needs-fixes
            Orchestrator->>Developer: Spawn subagent (refinement)<br/>Minimal fixes
            Developer->>Artifacts: Read problems.md
            Developer->>Artifacts: Append to impl.md (Out-of-Plan)
            Developer-->>Orchestrator: Done
            Orchestrator->>Auditor: Spawn fresh subagent (re-audit)
            Note over Auditor: Repeat audit...
        else Verdict: plan-fix
            Orchestrator->>Artifacts: Read + patch plan.md
            Orchestrator->>Developer: Spawn subagent<br/>Re-implement amended steps
            Developer->>Artifacts: Write new impl round
            Developer-->>Orchestrator: Done
            Orchestrator->>Auditor: Spawn fresh subagent (re-audit)
            Note over Auditor: Repeat audit...
        else Verdict: re-plan
            Orchestrator-->>User: ⛔ BLOCKED<br/>Use /replan skill for user decision
        end
    end---
applyTo: []
---

# Skill: /feat

**Purpose**: Create comprehensive feature documents that define complex, multi-phase work. Features are self-contained work units with their own plans, contexts, reports, and notes - unlike simple tasks which are single files.

The skill orchestrates a two-stage process: first, the Product Manager subagent enriches the feature description with business context, problem statements, objectives, scope, and success criteria. The PM may also propose high-level subtasks based on business logic. Then, the Architect subagent builds technical development phases based on the PM's output, creating a structured foundation for implementation planning.

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

You are executing the `/feat` command. This command follows a two-stage delegation process: first to the Product Manager subagent, then to the Architect subagent.

### Step 1: Delegate to Product Manager

Delegate to [Product Manager (product-manager.md)](../../agents/product-manager.md) with:

- User-provided feature description/context
- Optional: Jira ticket ID (if `--jira TICKET-123` flag provided)
- Optional: Atlassian issue ID (if `--atlassian ISSUE-456` flag provided)
- Project context (if available)

The PM will:

1. Fetch ticket/issue data via MCP if `--jira` or `--atlassian` flag is provided
2. Enrich feature description with problem statement, business value, objectives, scope, and success criteria
3. Optionally propose high-level subtasks based on business/product logic

The PM outputs an enriched feature description: Summary, Problem Statement, Objectives, Context, Scope, Success Criteria, and optionally Proposed Subtasks.

### Step 2: Delegate to Architect

After PM completes, delegate to [Architect (architect.md)](../../agents/architect.md) with:

- PM-enriched feature description
- PM's objectives and subtasks
- PM's scope definition
- Project context (if available)

The Architect will:

1. Analyze PM's objectives and subtasks
2. Build technical development phases based on PM's output
3. Structure phases logically with dependencies and sequencing
4. Define phase deliverables and acceptance criteria
5. Identify technical risks and dependencies

The Architect outputs a technical development phases structure: Phase breakdown, dependencies, deliverables, and acceptance criteria.

### Step 3: Create Feature Document

After receiving PM-enriched content and Architect's development phases:

1. Get current date via `date +%Y-%m-%d`
2. Create feature directory structure (feat-YYYY-MM-{slug}/)
3. Create main feature file combining PM + Architect output
4. Add cross-references to related documentation
5. Run documentation validation

**Output**: Feature document in `.pythia/workflows/features/feat-YYYY-MM-{slug}/feat-YYYY-MM-{slug}.md`

**See also**: [/plan skill](../plan/SKILL.md), [/ctx skill](../ctx/SKILL.md), [/research skill](../research/SKILL.md), [/retro skill](../retro/SKILL.md)
