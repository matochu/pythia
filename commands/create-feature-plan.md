# Command: Create Feature Plan Document

> **IMPORTANT**: This command requires active execution, not just planning. Follow each step in the checklist by actually performing the actions, creating files, updating references, and validating the documentation.
>
> **NOTE ON FILE PATHS**: This command adapts to your project's documentation structure. It will create plans in your project's `.pythia/workflows/features/{feature-id}/plans/` directory.

## Purpose

This command provides step-by-step instructions for creating detailed implementation plans for specific features. Feature plans are technical design documents that break down complex implementation phases, define architecture, and provide step-by-step implementation guidance.

## Key Principles

### Plan Organization Structure

```
.pythia/workflows/features/
└── feat-YYYY-MM-name/                  # Feature directory
    ├── feat-YYYY-MM-name.md            # Main feature document
    └── plans/                          # Implementation plans
        ├── 1-{plan-name}.plan.md       # First detailed plan
        ├── 2-{plan-name}.plan.md       # Second detailed plan
        └── 3-{plan-name}.plan.md       # Third detailed plan
```

**Examples:**

```
.pythia/workflows/features/
├── feat-2025-10-custom-chromium-wasm-integration/
│   ├── feat-2025-10-custom-chromium-wasm-integration.md
│   └── plans/
│       ├── 1-update-plugin-borsh-serialization.plan.md
│       ├── 2-fix-wasm-panic-deserialize.plan.md
│       └── 3-optimize-deserialize-calls.plan.md
└── feat-2025-10-browser-plugin-system/
    ├── feat-2025-10-browser-plugin-system.md
    └── plans/
        └── 1-v8-integration-architecture.plan.md
```

### Naming Convention

**Feature Directory**: Exact match with feature file name (without `.md`)

- ✅ `feat-2025-10-custom-chromium-wasm-integration/`
- ❌ `chromium-wasm/`
- ❌ `custom-chromium-integration/`

**Plan Files**: `{number}-{descriptive-name}.plan.md`

- ✅ `1-update-plugin-borsh-serialization.plan.md`
- ✅ `2-fix-wasm-panic-deserialize.plan.md`
- ❌ `update-plugin-borsh-serialization.plan.md` (missing number)
- ❌ `1. update-plugin.plan.md` (wrong separator)

### Plan to Feature Relationship

**One-to-Many**: Feature → Plans

- One feature can have multiple plans (numbered sequentially)
- Each plan belongs to exactly one feature
- Plans are created as needed during implementation (not upfront)
- Plans contain deep technical details not in main feature document

**Linking:**

- Plan must reference feature: `**Related Feature**: [Feature Name](../../feat-YYYY-MM-name.md)`
- Feature should list plans: In "Detailed Implementation Plans (External)" section

## Prerequisites

Before creating a feature plan document, ensure you have:

1. [ ] **Feature exists** - Plan is always created for an existing feature
2. [ ] Feature ID is known (e.g., `feat-2025-10-custom-chromium-wasm-integration`)
3. [ ] Understand feature objectives and requirements
4. [ ] Identified specific phase/component requiring detailed planning
5. [ ] Determined plan scope (what part of feature this plan covers)
6. [ ] Obtained the current date for proper timestamping
7. [ ] Reviewed related documentation (context, existing plans)

## Workspace Usage

This command can be used in any project workspace:

```bash
# Reference the command
@create-feature-plan.md

# Execute with feature context
@create-feature-plan.md
Feature: feat-2025-10-custom-chromium-wasm-integration
Plan: Update Plugin Borsh Serialization
Scope: Fix serialization inconsistencies in WASM plugin

# Example with existing plans
@create-feature-plan.md
Feature: feat-2025-10-browser-plugin-system
Plan: V8 Integration Architecture
Note: This is the second plan for this feature
```

## Command Checklist

- [ ] Get current date using `date +%Y-%m-%d`
- [ ] Verify feature exists and get feature ID
- [ ] Check if plans/ directory exists in feature folder
- [ ] Determine plan number (check existing plans)
- [ ] Create plans/ directory if it doesn't exist
- [ ] Define plan scope and objectives
- [ ] Break down implementation into detailed steps
- [ ] Create plan file with correct naming convention
- [ ] Fill in all template sections
- [ ] Add bidirectional references (plan ↔ feature)
- [ ] Update feature document with plan reference
- [ ] Run documentation validation
- [ ] Verify all checklist items are complete

## Step 1: Prepare for Plan Creation

Before starting, gather all necessary information:

```bash
# Get the current date
date +%Y-%m-%d

# Define paths
FEATURES_PATH=".pythia/workflows/features"

# 1. Verify feature exists
FEATURE_ID="feat-2025-10-custom-chromium-wasm-integration"
FEATURE_DIR="$FEATURES_PATH/$FEATURE_ID"
FEATURE_FILE="$FEATURE_DIR/$FEATURE_ID.md"

if [ ! -f "$FEATURE_FILE" ]; then
  echo "ERROR: Feature file not found: $FEATURE_FILE"
  exit 1
fi

echo "✓ Feature found: $FEATURE_FILE"

# 2. Check plans directory
PLANS_DIR="$FEATURE_DIR/plans"

if [ -d "$PLANS_DIR" ]; then
  echo "✓ Plans directory exists"
  # List existing plans
  ls -1 "$PLANS_DIR"
else
  echo "ℹ Plans directory doesn't exist - will create"
fi

# 3. Determine next plan number
if [ -d "$PLANS_DIR" ]; then
  # Count existing plans
  EXISTING_PLANS=$(ls -1 "$PLANS_DIR"/*-*.plan.md 2>/dev/null | wc -l | tr -d ' ')
  NEXT_NUMBER=$((EXISTING_PLANS + 1))
else
  NEXT_NUMBER=1
fi

echo "ℹ Next plan number: $NEXT_NUMBER"
```

## Step 2: Create Plans Directory (if needed)

```bash
# Create plans directory in feature folder
FEATURE_ID="feat-2025-10-custom-chromium-wasm-integration"
FEATURES_PATH=".pythia/workflows/features"
FEATURE_DIR="$FEATURES_PATH/$FEATURE_ID"
PLANS_DIR="$FEATURE_DIR/plans"

mkdir -p "$PLANS_DIR"

echo "✓ Created: $PLANS_DIR"
```

**Directory Guidelines:**

- Located directly in feature directory
- Created only when first plan is needed
- Contains only plan files (no subdirectories)

## Step 3: Create Plan File

```bash
# Create plan file with correct numbering
PLAN_NUMBER=1
PLAN_NAME="update-plugin-borsh-serialization"
PLAN_FILE="$PLANS_DIR/$PLAN_NUMBER-$PLAN_NAME.plan.md"

touch "$PLAN_FILE"

echo "✓ Created: $PLAN_FILE"
```

**File Naming Rules:**

- Format: `{number}-{descriptive-name}.plan.md`
- Number: Sequential integer (1, 2, 3...)
- Separator: Hyphen (`-`)
- Name: Kebab-case, descriptive, specific to implementation phase
- Extension: `.plan.md`

## Step 4: Use the Plan Template

Copy content from the plan template and fill in all sections:

### Required Sections

1. **Metadata**:
   - Plan number and name
   - Related Feature (with link)
   - Creation Date
   - Author
   - Status

2. **Problem Analysis**: What specific problem/phase this plan addresses

3. **Implementation Steps**: Detailed breakdown with file paths and code changes

4. **Technical Details**: Architecture, data structures, algorithms

5. **Testing Strategy**: How to verify implementation

6. **Success Criteria**: When this plan is complete

7. **References**: Links to related plans, contexts, external docs

### Plan Content Guidelines

**What makes a good feature plan:**

- ✅ Focuses on specific implementation phase or component
- ✅ Contains deep technical details (file paths, function names)
- ✅ Includes step-by-step implementation guidance
- ✅ Explains architectural decisions and rationale
- ✅ Provides testing approach and validation
- ✅ References relevant research and context

**What to avoid:**

- ❌ Duplicating high-level content from main feature document
- ❌ Too vague (no specific files or functions)
- ❌ Missing implementation steps
- ❌ No testing strategy
- ❌ No connection to main feature

**Feature Plan vs Main Feature Document:**

| Main Feature Document | Feature Plan             |
| --------------------- | ------------------------ |
| High-level overview   | Deep technical details   |
| Business motivation   | Implementation specifics |
| General phases        | Step-by-step guidance    |
| What & Why            | How (detailed)           |
| Created upfront       | Created as needed        |

## Step 5: Update Feature Document

Add plan reference to the related feature:

```bash
# Feature file location
FEATURE_FILE="$FEATURE_DIR/$FEATURE_ID.md"

# Open feature file and add plan reference
# In feature's "Detailed Implementation Plans (External)" section, add:
# - [Plan 1: Update Plugin Borsh](plans/1-update-plugin-borsh-serialization.plan.md)
```

**Location in Feature Document:**

- Add to `## Detailed Implementation Plans (External)` section
- Under "Existing External Plans:" subsection
- List plans in numerical order
- Use relative path from feature directory

**Example:**

```markdown
## Detailed Implementation Plans (External)

> **Note**: Detailed plans are created separately in `plans/` directory as implementation progresses...

**Existing External Plans:**

- [Plan 1: Update Plugin Borsh Serialization](plans/1-update-plugin-borsh-serialization.plan.md) - Fix serialization inconsistencies
- [Plan 2: Fix WASM Panic Deserialize](plans/2-fix-wasm-panic-deserialize.plan.md) - Handle null-terminated strings
```

## Step 6: Add Cross-References

Ensure bidirectional linking:

### In Plan Document

```markdown
# Plan: Update Plugin Borsh Serialization

## Metadata

- **Plan Number**: 1
- **Related Feature**: [Custom Chromium WASM Integration](../../feat-2025-10-custom-chromium-wasm-integration.md)
- **Creation Date**: 2025-10-31
- **Author**: Claude Sonnet 4
- **Status**: New

## Related Plans

- [Plan 2: Fix WASM Panic](./2-fix-wasm-panic-deserialize.plan.md) - Depends on this plan
```

### In Feature Document

```markdown
## Detailed Implementation Plans (External)

**Existing External Plans:**

- [Plan 1: Update Plugin Borsh](plans/1-update-plugin-borsh-serialization.plan.md) - ✅ Completed
- [Plan 2: Fix WASM Panic](plans/2-fix-wasm-panic-deserialize.plan.md) - 🚧 In Progress
```

## Step 7: Validation and Verification

Run validation to ensure proper structure:

```bash
# Validate directory structure
FEATURE_ID="feat-2025-10-custom-chromium-wasm-integration"
FEATURE_DIR="$FEATURES_PATH/$FEATURE_ID"
PLANS_DIR="$FEATURE_DIR/plans"

# Check plans directory exists
if [ ! -d "$PLANS_DIR" ]; then
  echo "ERROR: Plans directory not found!"
  exit 1
fi

# Check plan numbering sequence
PLANS=($(ls -1 "$PLANS_DIR"/*-*.plan.md 2>/dev/null | sort))
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

### Creating First Plan for Feature

```bash
# Feature already exists
FEATURE_ID="feat-2025-10-custom-chromium-wasm-integration"
FEATURE_DIR=".pythia/workflows/features/$FEATURE_ID"

# Create plans directory
mkdir -p "$FEATURE_DIR/plans"

# Create first plan
PLAN_FILE="$FEATURE_DIR/plans/1-update-plugin-borsh-serialization.plan.md"
touch "$PLAN_FILE"

# Fill in template
# Update feature with plan reference
```

### Creating Second Plan for Feature

```bash
# Feature directory already exists
FEATURE_ID="feat-2025-10-browser-plugin-system"
PLANS_DIR=".pythia/workflows/features/$FEATURE_ID/plans"

# Check existing plans
ls -1 "$PLANS_DIR"
# Output: 1-v8-integration-architecture.plan.md

# Create second plan
PLAN_FILE="$PLANS_DIR/2-dynamic-namespace-creation.plan.md"
touch "$PLAN_FILE"

# Fill in template
# Update feature with new plan reference
```

## Common Issues and Solutions

### Issue 1: Wrong Plan Location

**Problem:**

```
.pythia/workflows/plans/feat-2025-10-name/  ❌ (old task structure)
```

**Solution:**

```bash
# Plans should be in feature directory
.pythia/workflows/features/feat-2025-10-name/plans/  ✅
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
1. update-plugin.plan.md  ❌ (dot-space separator)
1_update-plugin.plan.md  ❌ (underscore separator)
```

**Solution:**

```bash
# Use hyphen separator
mv "1. update-plugin.plan.md" "1-update-plugin.plan.md"
```

## Self-Check Points

Before completing this command, verify:

- [ ] **Location**: Plan is in `feat-XXX/plans/` directory (NOT `.pythia/workflows/plans/`)
- [ ] **Plan Numbering**: Sequential starting from 1 (no gaps)
- [ ] **File Naming**: Format is `{number}-{name}.plan.md`
- [ ] **Bidirectional Links**: Plan references feature AND feature references plan
- [ ] **Complete Content**: All template sections are filled
- [ ] **Clear Scope**: Plan scope is specific to implementation phase
- [ ] **Detailed Steps**: Implementation broken into specific, actionable steps
- [ ] **Technical Details**: Includes file paths, function names, code changes
- [ ] **Testing Strategy**: Clear approach to verify implementation
- [ ] **Success Criteria**: Clear completion criteria defined
- [ ] **Validation Passed**: All structure validations successful

## Differences from Task Plans

| Aspect           | Task Plans                          | Feature Plans                   |
| ---------------- | ----------------------------------- | ------------------------------- |
| **Location**     | `.pythia/workflows/plans/task-XXX/` | `feat-XXX/plans/`               |
| **Created**      | Often upfront                       | As needed during implementation |
| **Detail Level** | Moderate                            | Very detailed                   |
| **Scope**        | Entire task or major phase          | Specific component or problem   |
| **Purpose**      | Overall task planning               | Deep implementation guidance    |

## Related Documents

- [Plan Template](mdc:templates/plan-template.md)
- [Feature Template](mdc:templates/feature-template.md)
- [Create Feature Command](mdc:commands/create-feature.md)
- [Create Task Plan Command](mdc:commands/create-plan.md)

---

**Last Updated**: 2025-10-31
**Command Version**: 1.0.0
