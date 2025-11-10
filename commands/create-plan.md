# Command: Create Plan Document

> **IMPORTANT**: This command requires active execution, not just planning. Follow each step in the checklist by actually performing the actions, creating files, updating references, and validating the documentation.
>
> **NOTE ON FILE PATHS**: This command adapts to your project's documentation structure. It will create plans in your project's `.pythia/workflows/plans/{task-id}/` directory.

## Purpose

This command provides step-by-step instructions for creating a detailed implementation plan for a specific task. Plans are technical design documents that break down complex tasks into phases, define architecture, and provide implementation guidance.

## Key Principles

### Plan Organization Structure

```
.pythia/workflows/plans/
└── {task-id}/                          # Папка таски (task-YYYY-MM-name)
    ├── 1-{plan-name}.plan.md           # Перший план
    ├── 2-{plan-name}.plan.md           # Другий план
    └── 3-{plan-name}.plan.md           # Третій план
```

**Examples:**
```
.pythia/workflows/plans/
├── task-2025-10-hybrid-data-management-system/
│   ├── 1-redux-persist-integration.plan.md
│   ├── 2-background-queue-implementation.plan.md
│   └── 3-performance-optimization.plan.md
└── task-2025-03-animation-metrics-system/
    └── 1-metrics-collection-architecture.plan.md
```

### Naming Convention

**Task Folder**: Exact match with task file name (without `.md`)
- ✅ `task-2025-10-hybrid-data-management-system/`
- ❌ `hybrid-data-management/`
- ❌ `data-management-system/`

**Plan Files**: `{number}-{descriptive-name}.plan.md`
- ✅ `1-redux-persist-integration.plan.md`
- ✅ `2-background-queue-implementation.plan.md`
- ❌ `redux-persist-integration.plan.md` (missing number)
- ❌ `1. redux-persist-integration.plan.md` (wrong separator)

### Plan to Task Relationship

**One-to-Many**: Task → Plans
- One task can have multiple plans (numbered sequentially)
- Each plan belongs to exactly one task
- Plans are created in chronological order (1, 2, 3...)

**Linking:**
- Plan must reference task: `**Related Task**: [Task Name](mdc:../../tasks/task-YYYY-MM-name.md)`
- Task should reference plans: `**Plans**: [Plan 1](mdc:.pythia/workflows/plans/task-id/1-name.plan.md)`

## Prerequisites

Before creating a plan document, ensure you have:

1. [ ] **Task exists** - Plan is always created for an existing task
2. [ ] Task ID is known (e.g., `task-2025-10-hybrid-data-management-system`)
3. [ ] Understand task objectives and requirements
4. [ ] Identified technical complexity requiring detailed planning
5. [ ] Determined plan scope (what part of task this plan covers)
6. [ ] Obtained the current date for proper timestamping
7. [ ] Reviewed related documentation (context, ideas, proposals)

## Workspace Usage

This command can be used in any project workspace:

```bash
# Reference the command
@create-plan.md

# Execute with task context
@create-plan.md
Task: task-2025-10-hybrid-data-management-system
Plan: Redux Persist Integration
Scope: Phases 1-3 of persistence layer implementation

# Example with existing plans
@create-plan.md
Task: task-2025-10-authentication
Plan: OAuth2 Provider Integration
Note: This is the second plan for this task
```

## Command Checklist

- [ ] Get current date using `date +%Y-%m-%d`
- [ ] Verify task exists and get task ID
- [ ] Check if task folder exists in plans directory
- [ ] Determine plan number (check existing plans in task folder)
- [ ] Create task folder if it doesn't exist
- [ ] Define plan scope and objectives
- [ ] Break down implementation into phases
- [ ] Create plan file with correct naming convention
- [ ] Fill in all template sections
- [ ] Add bidirectional references (plan ↔ task)
- [ ] Update task document with plan reference
- [ ] Run documentation validation
- [ ] Verify all checklist items are complete

## Step 1: Prepare for Plan Creation

Before starting, gather all necessary information:

```bash
# Get the current date
date +%Y-%m-%d

# Define paths
TASKS_PATH=".pythia/workflows/tasks"
PLANS_PATH=".pythia/workflows/plans"

# 1. Verify task exists
TASK_ID="task-2025-10-hybrid-data-management-system"
TASK_FILE="$TASKS_PATH/$TASK_ID.md"

if [ ! -f "$TASK_FILE" ]; then
  echo "ERROR: Task file not found: $TASK_FILE"
  exit 1
fi

echo "✓ Task found: $TASK_FILE"

# 2. Check task folder in plans
TASK_PLANS_DIR="$PLANS_PATH/$TASK_ID"

if [ -d "$TASK_PLANS_DIR" ]; then
  echo "✓ Task plans folder exists"
  # List existing plans
  ls -1 "$TASK_PLANS_DIR"
else
  echo "ℹ Task plans folder doesn't exist - will create"
fi

# 3. Determine next plan number
if [ -d "$TASK_PLANS_DIR" ]; then
  # Count existing plans
  EXISTING_PLANS=$(ls -1 "$TASK_PLANS_DIR"/*-*.plan.md 2>/dev/null | wc -l | tr -d ' ')
  NEXT_NUMBER=$((EXISTING_PLANS + 1))
else
  NEXT_NUMBER=1
fi

echo "ℹ Next plan number: $NEXT_NUMBER"
```

## Step 2: Create Task Folder (if needed)

```bash
# Create task folder in plans directory
TASK_ID="task-2025-10-hybrid-data-management-system"
PLANS_PATH=".pythia/workflows/plans"
TASK_PLANS_DIR="$PLANS_PATH/$TASK_ID"

mkdir -p "$TASK_PLANS_DIR"

echo "✓ Created: $TASK_PLANS_DIR"
```

**Folder Naming Rules:**
- Must exactly match task file name (without `.md`)
- Use kebab-case (lowercase with hyphens)
- Include full date prefix: `task-YYYY-MM-`
- No abbreviations or modifications

## Step 3: Create Plan File

```bash
# Create plan file with correct numbering
PLAN_NUMBER=1
PLAN_NAME="redux-persist-integration"
PLAN_FILE="$TASK_PLANS_DIR/$PLAN_NUMBER-$PLAN_NAME.plan.md"

touch "$PLAN_FILE"

echo "✓ Created: $PLAN_FILE"
```

**File Naming Rules:**
- Format: `{number}-{descriptive-name}.plan.md`
- Number: Sequential integer (1, 2, 3...)
- Separator: Hyphen (`-`)
- Name: Kebab-case, descriptive
- Extension: `.plan.md`

## Step 4: Use the Plan Template

Copy the content from the [Plan Template](mdc:templates/plan-template.md) and fill in all sections:

### Required Sections

1. **Metadata**:
   - Plan number and name
   - Related Task (with link)
   - Creation Date
   - Author
   - Status

2. **Overview**: Brief summary of what this plan covers

3. **Scope**: What is included/excluded in this plan

4. **Architecture**: Technical design and structure

5. **Implementation Phases**:
   - Phase 1: ...
   - Phase 2: ...
   - Phase N: ...

6. **Dependencies**: External/internal dependencies

7. **Risk Assessment**: Technical and business risks

8. **Success Criteria**: How to measure completion

9. **References**: Related documents

### Plan Content Guidelines

**What makes a good plan:**
- ✅ Breaks complex task into manageable phases
- ✅ Provides technical architecture details
- ✅ Includes implementation steps for each phase
- ✅ Identifies risks and mitigation strategies
- ✅ Defines clear success criteria
- ✅ References relevant context documents

**What to avoid:**
- ❌ Duplicating task description
- ❌ Too high-level (no actionable details)
- ❌ Too low-level (code-level details)
- ❌ Missing phase breakdown
- ❌ No risk assessment

## Step 5: Update Task Document

Add plan reference to the related task:

```bash
# Task file location
TASK_FILE="$TASKS_PATH/$TASK_ID.md"

# Open task file and add plan reference
# In task's "Related Plans" section, add:
# - [1. Redux Persist Integration](mdc:.pythia/workflows/plans/task-2025-10-name/1-redux-persist-integration.plan.md)
```

**Location in Task Document:**
- Add to `## Related Plans` section (create if doesn't exist)
- List plans in numerical order
- Use markdown link format with `mdc:` protocol

**Example:**
```markdown
## Related Plans

1. [1. Redux Persist Integration](mdc:.pythia/workflows/plans/task-2025-10-hybrid-data-management-system/1-redux-persist-integration.plan.md) - Persistence layer implementation
2. [2. Background Queue Implementation](mdc:.pythia/workflows/plans/task-2025-10-hybrid-data-management-system/2-background-queue-implementation.plan.md) - Request queue for low-end devices
```

## Step 6: Add Cross-References

Ensure bidirectional linking:

### In Plan Document

```markdown
## Related Task

**Task**: [Hybrid Data Management System](mdc:../../tasks/task-2025-10-hybrid-data-management-system.md)

**Plan Number**: 1 of 2

**Related Plans**:
- [2-background-queue-implementation.plan.md](./2-background-queue-implementation.plan.md) - Depends on this plan
```

### In Task Document

```markdown
## Related Plans

- [1. Redux Persist Integration](mdc:.pythia/workflows/plans/task-2025-10-hybrid-data-management-system/1-redux-persist-integration.plan.md) - ✅ Completed
- [2. Background Queue Implementation](mdc:.pythia/workflows/plans/task-2025-10-hybrid-data-management-system/2-background-queue-implementation.plan.md) - 🚧 In Progress
```

## Step 7: Validation and Verification

Run validation tools to ensure proper structure:

```bash
# Validate folder structure
TASK_ID="task-2025-10-hybrid-data-management-system"
TASK_PLANS_DIR="$PLANS_PATH/$TASK_ID"

# Check folder name matches task ID
TASK_FILE_NAME=$(basename "$TASK_FILE" .md)
PLAN_FOLDER_NAME=$(basename "$TASK_PLANS_DIR")

if [ "$TASK_FILE_NAME" != "$PLAN_FOLDER_NAME" ]; then
  echo "ERROR: Folder name mismatch!"
  echo "  Task: $TASK_FILE_NAME"
  echo "  Folder: $PLAN_FOLDER_NAME"
  exit 1
fi

# Check plan numbering sequence
PLANS=($(ls -1 "$TASK_PLANS_DIR"/*-*.plan.md 2>/dev/null | sort))
EXPECTED_NUM=1

for PLAN in "${PLANS[@]}"; do
  PLAN_NUM=$(basename "$PLAN" | cut -d'-' -f1)

  if [ "$PLAN_NUM" != "$EXPECTED_NUM" ]; then
    echo "ERROR: Plan numbering gap detected!"
    echo "  Expected: $EXPECTED_NUM"
    echo "  Found: $PLAN_NUM"
    exit 1
  fi

  EXPECTED_NUM=$((EXPECTED_NUM + 1))
done

echo "✓ All validations passed"
```

## Examples

### Creating First Plan for Task

```bash
# Task already exists
TASK_ID="task-2025-10-hybrid-data-management-system"

# Create task folder
mkdir -p ".pythia/workflows/plans/$TASK_ID"

# Create first plan
PLAN_FILE=".pythia/workflows/plans/$TASK_ID/1-redux-persist-integration.plan.md"
touch "$PLAN_FILE"

# Fill in template
# Update task with plan reference
```

### Creating Second Plan for Task

```bash
# Task folder already exists
TASK_ID="task-2025-10-authentication"
TASK_PLANS_DIR=".pythia/workflows/plans/$TASK_ID"

# Check existing plans
ls -1 "$TASK_PLANS_DIR"
# Output: 1-oauth2-setup.plan.md

# Create second plan
PLAN_FILE="$TASK_PLANS_DIR/2-jwt-token-management.plan.md"
touch "$PLAN_FILE"

# Fill in template
# Update task with new plan reference
```

## Common Issues and Solutions

### Issue 1: Folder Name Doesn't Match Task

**Problem:**
```
Task: task-2025-10-hybrid-data-management-system.md
Folder: hybrid-data-management/  ❌
```

**Solution:**
```bash
# Rename folder to match task ID exactly
mv .pythia/workflows/plans/hybrid-data-management \
   .pythia/workflows/plans/task-2025-10-hybrid-data-management-system
```

### Issue 2: Wrong Plan Numbering

**Problem:**
```
1-plan-a.plan.md
3-plan-b.plan.md  ❌ (missing 2)
```

**Solution:**
```bash
# Renumber plans sequentially
mv "3-plan-b.plan.md" "2-plan-b.plan.md"
```

### Issue 3: Wrong Separator in Plan Name

**Problem:**
```
1. redux-persist-integration.plan.md  ❌ (dot-space separator)
1_redux-persist-integration.plan.md  ❌ (underscore separator)
```

**Solution:**
```bash
# Use hyphen separator
mv "1. redux-persist-integration.plan.md" \
   "1-redux-persist-integration.plan.md"
```

## Self-Check Points

Before completing this command, verify:

- [ ] **Folder Structure**: Task folder exists in `.pythia/workflows/plans/`
- [ ] **Folder Name**: Exactly matches task ID (no modifications)
- [ ] **Plan Numbering**: Sequential starting from 1 (no gaps)
- [ ] **File Naming**: Format is `{number}-{name}.plan.md`
- [ ] **Bidirectional Links**: Plan references task AND task references plan
- [ ] **Complete Content**: All template sections are filled
- [ ] **Clear Scope**: Plan scope is clearly defined
- [ ] **Phase Breakdown**: Implementation broken into manageable phases
- [ ] **Risk Assessment**: Technical and business risks identified
- [ ] **Success Criteria**: Clear completion criteria defined
- [ ] **Validation Passed**: All structure validations successful

## Related Documents

- [Plan Template](mdc:templates/plan-template.md)
- [Task Template](mdc:templates/task-template.md)
- [Create Task Command](mdc:commands/create-task.md)
- [Workspace Integration](mdc:guides/guide-workspace-integration.md)

---

**Last Updated**: 2025-10-26
**Command Version**: 1.0.0
