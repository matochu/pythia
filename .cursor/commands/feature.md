# Command: /feature

> **IMPORTANT**: This command creates complex, multi-phase work items called Features. Features represent substantial development efforts requiring detailed planning, context documentation, and progress tracking.
>
> **NOTE ON FILE PATHS**: This command adapts to your project's documentation structure. It will create features in your project's `.pythia/workflows/features/` directory.

## Purpose

This command provides step-by-step instructions for creating a comprehensive feature document that defines complex, multi-phase work. Features are self-contained work units with their own plans, contexts, reports, and notes - unlike simple tasks which are single files.

The command orchestrates a two-stage process: first, the Product Manager subagent enriches the feature description with business context, problem statements, objectives, scope, and success criteria. The PM may also propose high-level subtasks based on business logic. Then, the Architect subagent builds technical development phases based on the PM's output, creating a structured foundation for implementation planning.

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

## Instructions for model

You are executing the `/feature` command. This command follows a two-stage delegation process: first to the Product Manager subagent, then to the Architect subagent.

### Step 1: Delegate to Product Manager

Delegate to Product Manager subagent via `/product-manager` with:
- User-provided feature description/context
- Optional: Jira ticket ID (if `--jira TICKET-123` flag provided)
- Optional: Atlassian issue ID (if `--atlassian ISSUE-456` flag provided)
- Project context (if available)

The PM will:
1. Fetch ticket/issue data via MCP if `--jira` or `--atlassian` flag is provided
2. Enrich feature description with problem statement, business value, objectives, scope, and success criteria
3. Optionally propose high-level subtasks based on business/product logic

The PM outputs an enriched feature description ready for the feature document template: Summary, Problem Statement, Objectives, Context, Scope, Success Criteria, and optionally Proposed Subtasks.

### Step 2: Delegate to Architect

After PM completes, delegate to Architect subagent via `/architect` with:
- PM-enriched feature description
- PM's objectives and subtasks
- PM's scope definition
- Project context (if available)

The Architect will:
1. Analyze PM's objectives and subtasks
2. Build technical development phases based on PM's output
3. Structure phases logically with dependencies, sequencing, and milestones
4. Define phase deliverables and acceptance criteria
5. Identify technical risks and dependencies

The Architect outputs a technical development phases structure:
- Phase breakdown (Phase 1, Phase 2, Phase 3, etc.)
- Phase descriptions (what will be built in each phase)
- Phase dependencies and sequencing
- Phase deliverables and acceptance criteria
- Technical risks and dependencies

This phases structure is added to the feature document. Detailed implementation plans are created later via `/plan-feature` command.

### Step 3: Create Feature Document

After receiving PM-enriched content and Architect's development phases:
1. Get current date using `date +%Y-%m-%d`
2. Validate feature uniqueness against existing documentation
3. Create feature directory structure (feat-YYYY-MM-name/)
4. Create main feature file (feat-YYYY-MM-name.md) combining:
   - PM-enriched content (Summary, Problem Statement, Objectives, Context, Scope, Success Criteria)
   - Architect's development phases structure
5. Fill in all template sections with combined PM + Architect output
6. Create subdirectories (plans/, contexts/, reports/, notes/) only as needed
7. Add cross-references to related documentation
8. Run documentation validation

## Prerequisites

Before creating a feature document, ensure you have:

1. [ ] Clear understanding of the complex work to be done
2. [ ] Identified that work requires feature-level structure (not simple task)
3. [ ] Determined scope and boundaries of the feature
4. [ ] Obtained current date for proper timestamping
5. [ ] Reviewed related documentation, ideas, or proposals
6. [ ] Validated feature uniqueness against existing documentation
7. [ ] Prepared metadata for proper categorization
8. [ ] Documentation will be written in English

## Workspace Usage

This command can be used in any project workspace:

```bash
# Reference the command
@feature.md

# Execute with project context
Execute this command for my project at [project-path]

# Example usage (basic)
@feature.md
Context: Building custom Chromium with WASM integration
Objective: Complete browser modification with plugin system
Complexity: High
Timeline: 2-3 months

# Example usage (with Jira ticket)
@feature.md --jira PROJECT-123
Context: Building custom Chromium with WASM integration

# Example usage (with Atlassian issue)
@feature.md --atlassian ISSUE-456
Context: Building custom Chromium with WASM integration
```

If `--jira` or `--atlassian` flag is provided, Product Manager fetches ticket/issue data and enriches the feature description accordingly.

## Command Checklist

- [ ] Get current date using `date +%Y-%m-%d`
- [ ] Delegate to Product Manager subagent (`/product-manager`) to enrich feature description
- [ ] If `--jira` or `--atlassian` flag provided, PM fetches ticket/issue data via MCP
- [ ] Delegate to Architect subagent (`/architect`) to build development phases
- [ ] Architect analyzes PM's objectives and subtasks
- [ ] Architect builds technical development phases structure
- [ ] Validate feature uniqueness against existing documentation
- [ ] Create feature directory structure (feat-YYYY-MM-name/)
- [ ] Create main feature file (feat-YYYY-MM-name.md) with PM-enriched content + Architect phases
- [ ] Create subdirectories (plans/, contexts/, reports/, notes/) as needed
- [ ] Add cross-references to related documentation
- [ ] Run documentation validation
- [ ] Generate workflows report
- [ ] Verify all checklist items are complete

## Subagent Delegation Flow

This command follows a two-stage delegation process: first to Product Manager, then to Architect.

### Flow: PM → Architect → Feature Document

```
User Input → PM Subagent → Architect Subagent → Feature Document
              (WHAT/WHY)      (HOW/PHASES)
```

### Step 1: Product Manager Delegation

The command delegates to Product Manager subagent before creating the feature document.

The PM enriches the feature description with:
- Clear problem statement
- Business value and rationale
- User stories (if applicable)
- Well-defined objectives
- Clear scope (in-scope / out-of-scope)
- Measurable success criteria
- Optionally proposes subtasks based on business/product logic

If `--jira` or `--atlassian` flag is provided, the PM fetches ticket/issue data via MCP, extracts relevant fields (title, description, acceptance criteria, user stories, labels, priority), and maps them to feature document sections.

The PM outputs an enriched feature description including: Summary (2-3 paragraphs), Problem Statement, Objectives, Context/Background, Scope (In Scope / Out of Scope), Success Criteria, and optionally Proposed Subtasks (product/business view).

### Step 2: Architect Delegation

After PM completes, the command delegates to Architect subagent to build development phases.

The Architect:
1. Analyzes PM's output: reviews objectives and subtasks, understands scope and success criteria, identifies technical requirements
2. Builds technical development phases: structures phases logically with dependencies and sequencing, defines what will be built in each phase, identifies phase deliverables and acceptance criteria, maps PM's subtasks to technical phases
3. Identifies technical considerations: technical risks and dependencies, architecture decisions needed, integration points

The Architect outputs a technical development phases structure: Phase breakdown (Phase 1, Phase 2, Phase 3, etc.), phase descriptions, phase dependencies and sequencing, phase deliverables and acceptance criteria, and technical risks and dependencies.

This phases structure is added to the feature document. Detailed implementation plans are created later via `/plan-feature` command.

### Step 3: Feature Document Creation

After receiving PM-enriched content and Architect's development phases, combine PM output (WHAT/WHY) with Architect output (HOW/PHASES) to create the feature document. PM content populates business/product sections, while Architect phases populate the Development phases section.

## Step 1: Prepare for Feature Creation

Before starting, gather all necessary information:

```bash
# Get the current date for proper timestamping
date +%Y-%m-%d

# Determine features directory based on project structure
FEATURES_PATH=".pythia/workflows/features"

# Create directory if it doesn't exist
mkdir -p "$FEATURES_PATH"

# List existing features to avoid duplication
ls -la "$FEATURES_PATH"

# Search for similar features
find "$FEATURES_PATH" -type d -name "feat-*" | sort

# Search for existing tasks that might need conversion
TASKS_PATH=".pythia/workflows/tasks"
find "$TASKS_PATH" -type f -name "*.md" -exec grep -l "keyword" {} \;

# Search for relevant context documents
CONTEXTS_PATH=".pythia/contexts"
find "$CONTEXTS_PATH" -type f -name "*.md" -exec grep -l "keyword" {} \;
```

### Enhanced Search Methods

For more effective feature discovery:

```bash
# Search by topic across all features
find "$FEATURES_PATH" -type f -name "*.md" -exec grep -l "search term" {} \;

# Find recent features in a specific area
find "$FEATURES_PATH" -type d -name "*topic*" -mtime -60 | sort

# Check for features with similar scope
rg -C 2 "search term" "$FEATURES_PATH"
```

## Step 2: Create Feature Directory Structure

### Option A: Create New Feature from Scratch

```bash
# Determine feature directory based on project structure
FEATURES_PATH=".pythia/workflows/features"

# Create feature structure
FEATURE_NAME="custom-chromium-wasm-integration"
CURRENT_DATE=$(date +%Y-%m)
FEATURE_ID="feat-$CURRENT_DATE-$FEATURE_NAME"
FEATURE_DIR="$FEATURES_PATH/$FEATURE_ID"

# Create feature directory
mkdir -p "$FEATURE_DIR"

# Create main feature file
FEATURE_FILE="$FEATURE_DIR/$FEATURE_ID.md"
touch "$FEATURE_FILE"

echo "Created feature structure:"
echo "  $FEATURE_DIR/"
echo "  └── $FEATURE_ID.md"
echo ""
echo "Note: Subdirectories (plans/, contexts/, reports/, notes/) will be created as needed"
```

### Option B: Convert Existing Task to Feature

```bash
# Identify task to convert
TASKS_PATH=".pythia/workflows/tasks"
TASK_FILE="task-2025-10-custom-chromium-wasm-integration.md"
TASK_ID="task-2025-10-custom-chromium-wasm-integration"

# Extract feature name (remove 'task-' prefix, add 'feat-')
FEATURE_ID="${TASK_ID/task-/feat-}"
FEATURE_DIR="$FEATURES_PATH/$FEATURE_ID"

# Create feature directory
mkdir -p "$FEATURE_DIR"

# Copy and rename task file
cp "$TASKS_PATH/$TASK_FILE" "$FEATURE_DIR/$FEATURE_ID.md"

# Move existing plans if they exist
PLANS_PATH=".pythia/workflows/plans"
if [ -d "$PLANS_PATH/$TASK_ID" ]; then
  mkdir -p "$FEATURE_DIR/plans"
  mv "$PLANS_PATH/$TASK_ID"/* "$FEATURE_DIR/plans/"
  echo "Moved plans from $PLANS_PATH/$TASK_ID"
fi

# Move task-specific contexts if they exist
CONTEXTS_PATH=".pythia/contexts"
# Identify and move relevant contexts (manual step)
echo "Review contexts in $CONTEXTS_PATH and move relevant ones to $FEATURE_DIR/contexts/"
echo "Create contexts/ directory only if needed: mkdir -p $FEATURE_DIR/contexts"

# Keep original task file for reference (optional)
echo "Original task: $TASKS_PATH/$TASK_FILE"
echo "Consider archiving or removing after verification"
echo ""
echo "Note: Create reports/ and notes/ directories only when needed"
```

## Step 3: Delegate to Product Manager Subagent

Before creating the feature document, delegate to Product Manager subagent (`/product-manager`) with:
- User-provided feature description/context
- Optional: Jira ticket ID (`--jira TICKET-123`) or Atlassian issue ID (`--atlassian ISSUE-456`)
- Project context (if available)

The PM will:
1. Fetch ticket/issue data via MCP Atlassian/Jira if `--jira` or `--atlassian` flag is provided, extracting title, description, acceptance criteria, user stories, labels, priority, and mapping them to feature document structure
2. Enrich feature description with clear problem statement, business value and rationale, user stories (if applicable), well-defined objectives, clear scope (in-scope / out-of-scope), and measurable success criteria
3. Optionally propose high-level subtasks based on business/product logic

The PM returns an enriched feature description ready for the feature document template: Summary (2-3 paragraphs), Problem Statement, Objectives (clear, actionable), Context/Background, Scope (In Scope / Out of Scope), Success Criteria (measurable), and optionally Proposed Subtasks (product/business view).

## Step 4: Delegate to Architect Subagent

After PM completes, delegate to Architect subagent (`/architect`) to build development phases with:
- PM-enriched feature description
- PM's objectives and subtasks
- PM's scope definition
- Project context (if available)

The Architect will:
1. Analyze PM's objectives and subtasks
2. Build technical development phases based on PM's output: structure phases logically with dependencies and sequencing, define what will be built in each phase, map PM's subtasks to technical phases
3. Identify technical considerations: technical risks and dependencies, architecture decisions needed, integration points

The Architect returns a technical development phases structure: Phase breakdown (Phase 1, Phase 2, Phase 3, etc.), phase descriptions, phase dependencies and sequencing, phase deliverables and acceptance criteria, and technical risks and dependencies.

This phases structure is added to the feature document. Detailed implementation plans are created later via `/plan-feature` command.

## Step 5: Use the Feature Template

Create the main feature file with PM-enriched content and Architect's development phases using these sections:

### Feature Document Structure

````markdown
# Feature: {Title}

## Overview

**Feature ID**: feat-YYYY-MM-descriptive-name  
**Date Created**: YYYY-MM-DD  
**Status**: Not Started / In Progress / Under Review / Blocked / Completed  
**Priority**: High / Medium / Low  
**Complexity**: 🔴 High (Features are complex by definition)  
**Owner**: {Name}  
**Repository**: {repo-url-or-name}  
**Branch**: feature/{slug-or-topic}  
**PR**: [link-if-available]  
**LLM Model**: {model-id}

## 📖 Feature Workflow Guide

> **IMPORTANT**: Features are complex, multi-phase work items requiring:
>
> - Detailed planning (plans/)
> - Context documentation (contexts/)
> - Progress tracking (reports/)
> - Research notes (notes/)

### Directory Structure

This feature uses the following structure:

\`\`\`
feat-YYYY-MM-name/
├── feat-YYYY-MM-name.md # This file
├── plans/ # Implementation plans
│ ├── 1-phase-name.plan.md
│ └── 2-phase-name.plan.md
├── contexts/ # Context documentation
│ └── topic-name.context.md
├── reports/ # Progress and analysis reports
│ └── status-report.report.md
└── notes/ # Research notes and explorations
└── exploration-notes.md
\`\`\`

### File Naming Conventions

- **Plans**: `N-descriptive-name.plan.md` (numbered sequentially)
- **Contexts**: `descriptive-name.context.md` (no date, no prefix)
- **Reports**: `descriptive-name.report.md`
- **Notes**: `descriptive-name.md` (no postfix)

## Summary

Brief overview of what this feature accomplishes (2-3 paragraphs).

## Objectives

Clear, concise list of what this feature aims to achieve:

- [ ] Objective 1
- [ ] Objective 2
- [ ] Objective 3

## Context

### Background

What problem does this feature solve?

### Problem Statement

Clear statement of the problem being addressed.

### Technical Constraints

List any technical, resource, or platform constraints.

## Scope

### In Scope

- [ ] Item 1
- [ ] Item 2

### Out of Scope

- Item 1
- Item 2

## Development Phases

Technical development phases structure built by Architect subagent based on Product Manager's objectives and subtasks:

### Phase 1: [Phase Name]
- **Description**: [What will be built in this phase]
- **Deliverables**: [What will be delivered]
- **Dependencies**: [What this phase depends on]
- **Acceptance Criteria**: [How we'll know this phase is complete]

### Phase 2: [Phase Name]
- **Description**: [What will be built in this phase]
- **Deliverables**: [What will be delivered]
- **Dependencies**: [What this phase depends on (may depend on Phase 1)]
- **Acceptance Criteria**: [How we'll know this phase is complete]

### Phase 3: [Phase Name]
- **Description**: [What will be built in this phase]
- **Deliverables**: [What will be delivered]
- **Dependencies**: [What this phase depends on]
- **Acceptance Criteria**: [How we'll know this phase is complete]

### Technical Risks and Dependencies
- [Technical risk 1]
- [Technical risk 2]
- [Dependency 1]
- [Dependency 2]

## Implementation Plans

Link to all detailed implementation plans for this feature:

- [Plan 1: Phase Name](plans/1-phase-name.plan.md)
- [Plan 2: Phase Name](plans/2-phase-name.plan.md)

### Creating New Plans

Use `/plan-feature` command to create detailed implementation plans for each development phase.

## Related Contexts

Link to context documents providing background and analysis:

- [Context: Topic Name](contexts/topic-name.context.md)

### Context Documentation

Context documents provide:

- Technical analysis and research
- Architecture decisions and rationale
- Domain knowledge and background
- Risk assessment and mitigation strategies

## Progress Reports

Track progress through detailed reports:

- [Status Report](reports/status-report.report.md)
- [Performance Analysis](reports/performance-analysis.report.md)

## Progress Tracking

| Phase   | Status      | Completion % | Last Updated | Notes |
| ------- | ----------- | ------------ | ------------ | ----- |
| Phase 1 | Not Started | 0%           |              |       |
| Phase 2 | Not Started | 0%           |              |       |

## Risks and Mitigation

| Risk     | Impact          | Likelihood      | Mitigation Strategy    |
| -------- | --------------- | --------------- | ---------------------- |
| [Risk 1] | High/Medium/Low | High/Medium/Low | [Strategy to mitigate] |
| [Risk 2] | High/Medium/Low | High/Medium/Low | [Strategy to mitigate] |

## Dependencies

List any dependencies that might affect this feature:

- [ ] External dependencies (APIs, services)
- [ ] Internal dependencies (other components, features)
- [ ] Team dependencies (people, skills)

## Success Criteria

Clearly define what it means for this feature to be successfully completed:

- [ ] Functional criteria
- [ ] Technical criteria
- [ ] Quality criteria
- [ ] Performance criteria

## Implementation Summary

> To be filled after feature completion

### Key Challenges Encountered

- Challenge 1
- Challenge 2

### Solutions Implemented

- [ ] Solution 1
- [ ] Solution 2

### Deviations from Original Plan

- Deviation 1
- Deviation 2

### Lessons Learned

- Lesson 1
- Lesson 2

## Future Improvements

Identify potential future improvements related to this feature:

- [ ] Improvement 1
- [ ] Improvement 2

## Notes

Any additional information, caveats, or considerations:

- Note 1
- Note 2

## References

### Core Management

- [Manage Task](mdc:commands/manage-task.md) - Task management workflow
- [Feature Template](mdc:templates/feature-template.md) - Template reference

### Related Documentation

- [Related Feature/Task](mdc:path-to-document.md)

---

**Last Updated**: YYYY-MM-DD
\`\`\`

## Step 6: Create Subdirectories (As Needed)

Subdirectories are created only when needed:

### Creating Plans Directory

```bash
# Create when first plan is needed
mkdir -p "$FEATURE_DIR/plans"

# Use /plan-feature to create plans
```
````

### Creating Contexts Directory

```bash
# Create when first context document is needed
mkdir -p "$FEATURE_DIR/contexts"

# Use /context-feature to create contexts
```

### Creating Reports Directory

```bash
# Create when first report is needed
mkdir -p "$FEATURE_DIR/reports"
```

### Creating Notes Directory

```bash
# Create when first research note is needed
mkdir -p "$FEATURE_DIR/notes"
```

**Note**: Do NOT create empty directories upfront. Create them only when you have content to put in them.

## Step 7: Add Cross-References

Update related documents to reference this new feature:

```markdown
## References

### Core Management

- [Manage Task](mdc:commands/manage-task.md) - Task management workflow
- [Feature Template](mdc:templates/feature-template.md) - Template reference

### Context Integration

- [Create Context Document](mdc:commands/create-context.md) - Context creation

## Status History

| Date       | Status | Notes            |
| ---------- | ------ | ---------------- |
| YYYY-MM-DD | New    | Initial creation |
```

## Step 8: Generate Workflows Report

Use the `@report-workflows.md` command to update the workflows status report:

```bash
# Reference the command
@report-workflows.md

# Execute with project context
Execute this command for my project at [project-path]
```

## Step 9: Validation and Verification

Run documentation validation tools:

```bash
# Validate feature uniqueness
npm run docs:validate-uniqueness

# Validate documentation links
npm run docs:validate-links

# Check documentation coverage
npm run docs:check-coverage

# Validate metadata format
npm run docs:validate-metadata
```

### Self-Validation Checklist

Before finalizing the feature document:

- [ ] **Language Check**: Document is written entirely in English
- [ ] **Completeness**: All required sections are filled with meaningful content
- [ ] **Scope Clarity**: Clear boundaries between in-scope and out-of-scope
- [ ] **Directory Structure**: All subdirectories created (plans/, contexts/, reports/, notes/)
- [ ] **File Naming**: Follows conventions (feat-YYYY-MM-name.md)
- [ ] **Success Criteria**: Success criteria are measurable and objective
- [ ] **Dependencies**: All dependencies are identified with links
- [ ] **Risk Assessment**: Potential risks and mitigations documented
- [ ] **Consistency**: Feature aligns with project standards
- [ ] **Formatting**: Document uses consistent Markdown formatting

## Examples

### Example 1: Create Feature from Scratch

```bash
# Get current date
date +%Y-%m-%d
# Output: 2025-10-31

# Create feature structure
FEATURES_PATH=".pythia/workflows/features"
FEATURE_ID="feat-2025-10-browser-plugin-system"
FEATURE_DIR="$FEATURES_PATH/$FEATURE_ID"

mkdir -p "$FEATURE_DIR"
touch "$FEATURE_DIR/$FEATURE_ID.md"

echo "Created: $FEATURE_DIR/$FEATURE_ID.md"
echo "Create subdirectories (plans/, contexts/, etc.) as needed"
```

### Example 2: Convert Task to Feature

```bash
# Identify task
TASK_ID="task-2025-10-custom-chromium-wasm-integration"
FEATURE_ID="feat-2025-10-custom-chromium-wasm-integration"

# Convert
FEATURES_PATH=".pythia/workflows/features"
TASKS_PATH=".pythia/workflows/tasks"
FEATURE_DIR="$FEATURES_PATH/$FEATURE_ID"

# Create feature directory
mkdir -p "$FEATURE_DIR"

# Copy task content
cp "$TASKS_PATH/$TASK_ID.md" "$FEATURE_DIR/$FEATURE_ID.md"

# Move existing plans (creates plans/ directory)
if [ -d ".pythia/workflows/plans/$TASK_ID" ]; then
  mkdir -p "$FEATURE_DIR/plans"
  mv ".pythia/workflows/plans/$TASK_ID"/* "$FEATURE_DIR/plans/"
fi

echo "Converted task to feature: $FEATURE_ID"
echo "Review and move relevant contexts manually (create contexts/ when needed)"
```

## Common Issues and Solutions

1. **Unclear Scope**:

   - Issue: Feature scope too broad or undefined
   - Solution: Break down into smaller features or define clear boundaries

2. **Missing Plans**:

   - Issue: Feature created without implementation plans
   - Solution: Use `/plan-feature` to create at least one initial plan

3. **Creating Empty Directories**:

   - Issue: Creating plans/, contexts/, reports/, notes/ upfront
   - Solution: Create directories only when you have content for them

4. **Contexts vs Notes Confusion**:

   - Issue: Unclear what goes in contexts/ vs notes/
   - Solution:
     - contexts/ = structured analysis, decisions, architecture (use `/context-feature`)
     - notes/ = explorations, research, informal documentation

5. **Task vs Feature Decision**:

   - Issue: Uncertain whether to use task or feature
   - Solution: If work requires plans + contexts → feature; otherwise → task

6. **Conversion Timing**:
   - Issue: When to convert task to feature
   - Solution: Convert when first plan or context document is needed

## Integration Guidelines

This command integrates with other Pythia components:

### Related Commands

- **`/plan-feature`** - Create implementation plans for feature
- **`/context-feature`** - Create context documentation for feature
- **`@create-context.md`** - Create general context documentation
- **`@create-task.md`** - For simpler work items
- **`@report-workflows.md`** - Generate workflow status reports
- **`@validate-documentation.md`** - Validate feature documentation

### Template Integration

- Uses `templates/feature-template.md` for consistent structure
- Follows metadata standards for proper categorization
- Integrates with workflow reporting system

## Related Documents

- [Feature Template](mdc:templates/feature-template.md)
- [Create Context](mdc:commands/create-context.md)
- [Create Task](mdc:commands/create-task.md)
- [Report Workflows](mdc:commands/report-workflows.md)

---

**Last Updated**: 2025-10-31
