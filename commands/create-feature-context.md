# Command: Create Feature Context Document

> **IMPORTANT**: This command requires active execution, not just planning. Follow each step in the checklist by actually performing the actions, creating files, updating references, and validating the documentation.
>
> **NOTE**: This command focuses on **feature-specific context creation**. For general context creation, see [@create-context.md](mdc:commands/create-context.md). This command extends the general context creation process with feature-specific requirements.

## Purpose

This command provides step-by-step instructions for creating context documents **for specific features**. Feature contexts are stored in the feature directory and linked to the feature document.

**Key Difference from General Contexts:**

- **Location**: `feat-XXX/contexts/` (not `.pythia/contexts/`)
- **Naming**: No date prefix (unlike general contexts)
- **Linking**: Must reference parent feature document

For general context creation guidelines, structure, and templates, see [@create-context.md](mdc:commands/create-context.md).

## Key Principles

### Context Organization Structure

```
.pythia/workflows/features/
└── feat-YYYY-MM-name/                  # Feature directory
    ├── feat-YYYY-MM-name.md            # Main feature document
    ├── contexts/                       # Context documents
    │   ├── technical-analysis.context.md
    │   ├── architecture-decisions.context.md
    │   └── domain-knowledge.context.md
    └── plans/                          # Implementation plans
        └── 1-{plan-name}.plan.md
```

**Examples:**

```
.pythia/workflows/features/
├── feat-2025-10-feature-name/
│   ├── feat-2025-10-feature-name.md
│   ├── contexts/
│   │   ├── technical-analysis.context.md
│   │   └── architecture-decisions.context.md
│   └── plans/
│       └── 1-implementation-phase.plan.md
```

### Naming Convention

**Feature Directory**: Exact match with feature file name (without `.md`)

- ✅ `feat-2025-10-feature-name/`
- ❌ `feature-name/`
- ❌ `custom-feature/`

**Context Files**: `{descriptive-name}.context.md` or `{type}-{topic}.context.md`

- ✅ `technical-analysis.context.md`
- ✅ `architecture-decisions.context.md`
- ✅ `domain-knowledge.context.md`
- ❌ `context-2025-11-18-topic.md` (date not needed in feature contexts)
- ❌ `topic.md` (missing `.context` suffix)

### Context to Feature Relationship

**One-to-Many**: Feature → Contexts

- One feature can have multiple contexts (different topics)
- Each context belongs to exactly one feature
- Contexts are created as needed during implementation or research
- Contexts contain analysis and knowledge not in main feature document

**Linking:**

- Context must reference feature: inline link `[feat-YYYY-MM-name](../feat-YYYY-MM-name.md#@related)` in the context body (not bold-bullet frontmatter)
- Feature should link to context: inline prose link `[Context Title](contexts/filename#@related)` in the feature doc body

## Prerequisites

Before creating a feature context document, ensure you have:

1. [ ] **Feature exists** - Context is always created for an existing feature
2. [ ] Feature ID is known (e.g., `feat-2025-10-feature-name`)
3. [ ] Understand feature objectives and requirements
4. [ ] Identified specific topic/analysis requiring context documentation
5. [ ] Determined context type (technical, architecture, domain, etc.)
6. [ ] Obtained the current date for proper timestamping
7. [ ] Reviewed related documentation (existing contexts, plans)

## Workspace Usage

This command can be used in any project workspace:

```bash
# Reference the command
@create-feature-context.md

# Execute with feature context
@create-feature-context.md
Feature: feat-2025-10-feature-name
Context: Technical Analysis
Type: Technical Analysis
Topic: Analysis topic and implementation strategies

# Example with existing contexts
@create-feature-context.md
Feature: feat-2025-10-feature-name
Context: Performance Analysis
Note: This is a technical analysis context
```

## Command Checklist

- [ ] Get current date using `date +%Y-%m-%d`
- [ ] Verify feature exists and get feature ID
- [ ] Check if contexts/ directory exists in feature folder
- [ ] Determine context file name (check existing contexts)
- [ ] Create contexts/ directory if it doesn't exist
- [ ] Define context scope and objectives
- [ ] Create context file with correct naming convention
- [ ] Fill in all template sections
- [ ] Add bidirectional references (context ↔ feature)
- [ ] Update feature document with context reference
- [ ] Run documentation validation
- [ ] Verify all checklist items are complete

## Step 1: Prepare for Context Creation

Before starting, gather all necessary information:

```bash
# Get the current date
date +%Y-%m-%d

# Define paths
FEATURES_PATH=".pythia/workflows/features"

# 1. Verify feature exists
FEATURE_ID="feat-2025-10-feature-name"
FEATURE_DIR="$FEATURES_PATH/$FEATURE_ID"
FEATURE_FILE="$FEATURE_DIR/$FEATURE_ID.md"

if [ ! -f "$FEATURE_FILE" ]; then
  echo "ERROR: Feature file not found: $FEATURE_FILE"
  exit 1
fi

echo "✓ Feature found: $FEATURE_FILE"

# 2. Check contexts directory
CONTEXTS_DIR="$FEATURE_DIR/contexts"

if [ -d "$CONTEXTS_DIR" ]; then
  echo "✓ Contexts directory exists"
  # List existing contexts
  ls -1 "$CONTEXTS_DIR"
else
  echo "ℹ Contexts directory doesn't exist - will create"
fi
```

## Step 2: Create Contexts Directory (if needed)

```bash
# Create contexts directory in feature folder
FEATURE_ID="feat-2025-10-feature-name"
FEATURES_PATH=".pythia/workflows/features"
FEATURE_DIR="$FEATURES_PATH/$FEATURE_ID"
CONTEXTS_DIR="$FEATURE_DIR/contexts"

mkdir -p "$CONTEXTS_DIR"

echo "✓ Created: $CONTEXTS_DIR"
```

**Directory Guidelines:**

- Located directly in feature directory
- Created only when first context is needed
- Can contain subdirectories for organization (e.g., `proposals/`, `analysis/`)

## Step 3: Create Context File

```bash
# Create context file with descriptive name
CONTEXT_NAME="technical-analysis"
CONTEXT_FILE="$CONTEXTS_DIR/$CONTEXT_NAME.context.md"

touch "$CONTEXT_FILE"

echo "✓ Created: $CONTEXT_FILE"
```

**File Naming Rules:**

- Format: `{descriptive-name}.context.md` or `{type}-{topic}.context.md`
- Name: Kebab-case, descriptive, specific to context topic
- Suffix: `.context.md` (required for identification)
- No date prefix (unlike general contexts in `.pythia/contexts/`)
- No numbering (unlike plans)

**Examples:**

- ✅ `technical-analysis.context.md`
- ✅ `architecture-decisions.context.md`
- ✅ `domain-knowledge.context.md`
- ❌ `context-2025-11-18-topic.md` (date not needed)
- ❌ `1-topic.context.md` (no numbering)

## Step 4: Use the Context Template

**For context structure, required sections, content guidelines, and the full template, see [@create-context.md - Step 7: Insert Minimal Template](mdc:commands/create-context.md#step-7-insert-minimal-template-copypaste).**

### Feature-Specific Requirements

When creating a feature context using the template from `@create-context.md`, ensure:

1. **Body includes feature backlink** (inline prose, not a metadata field):

   ```markdown
   Context for [feat-YYYY-MM-name](../feat-YYYY-MM-name.md#@related).
   ```

2. **Body links to related documents inline** where they fit naturally:
   - Feature (required): `[feat-YYYY-MM-name](../feat-YYYY-MM-name.md#@related)`
   - Related plans (if applicable): `[Plan title](../plans/N-plan-name.plan.md#@source)`
   - Sibling contexts: `[Other context](./other-context.context.md#@related)`

3. **Content focuses on feature-specific analysis:**
   - Technical analysis supporting feature implementation
   - Architecture decisions for this feature
   - Domain knowledge relevant to feature scope
   - Research findings that inform feature work

**Feature Context vs Main Feature Document:**

| Main Feature Document | Feature Context             |
| --------------------- | --------------------------- |
| High-level overview   | Deep technical analysis     |
| Business motivation   | Technical research findings |
| General phases        | Specific topic deep-dive    |
| What & Why            | How & Why (detailed)        |
| Implementation plans  | Supporting knowledge        |

## Step 5: Update Feature Document

Add context reference to the related feature:

```bash
# Feature file location
FEATURE_FILE="$FEATURE_DIR/$FEATURE_ID.md"

# Open feature file and add context reference
# In feature's "Related Contexts" section, add:
# - [Context Name](contexts/context-name.context.md) - Brief description
```

**Location in Feature Document:**

Add the context as an inline link in the feature doc body where it fits naturally (e.g. under a relevant prose section or `## Contexts`). Use `#@related` when the relation type matters for sync:

```markdown
See [Technical Analysis](contexts/technical-analysis.context.md#@related) for communication protocol details.
```

Do **not** create a `## Related Contexts` or standalone `## Related` section — `## Related` is a migration artifact only. Place links inline in prose. Machine-owned `## References` / `## Used by` are written by `inputs.js sync`; never add them manually.

## Step 6: Add Cross-References

Ensure bidirectional linking:

### In Context Document

```markdown
# Context: Technical Analysis

## Metadata

- status: draft
- updated: YYYY-MM-DD
- tags: technical, domain, topic

Context for [feat-2025-10-feature-name](../feat-2025-10-feature-name.md#@related).
See also [architecture-decisions.context.md](./architecture-decisions.context.md) and
[1-implementation-phase.plan.md](../plans/1-implementation-phase.plan.md).
```

### In Feature Document

Add inline in the relevant prose section — not as a standalone `## Related` block:

```markdown
The [Technical Analysis](contexts/technical-analysis.context.md#@related) context covers implementation approach decisions.
```

## Step 7: Validation and Verification

Run validation to ensure proper structure:

```bash
# Validate directory structure
FEATURE_ID="feat-2025-10-feature-name"
FEATURE_DIR="$FEATURES_PATH/$FEATURE_ID"
CONTEXTS_DIR="$FEATURE_DIR/contexts"

# Check contexts directory exists
if [ ! -d "$CONTEXTS_DIR" ]; then
  echo "ERROR: Contexts directory not found!"
  exit 1
fi

# Check context file naming
CONTEXTS=($(ls -1 "$CONTEXTS_DIR"/*.context.md 2>/dev/null))

for CTX in "${CONTEXTS[@]}"; do
  if [[ ! "$CTX" =~ \.context\.md$ ]]; then
    echo "WARNING: Context file missing .context.md suffix: $CTX"
  fi
done

echo "✓ All validations passed"
```

## Examples

### Creating First Context for Feature

```bash
# Feature already exists
FEATURE_ID="feat-2025-10-feature-name"
FEATURE_DIR=".pythia/workflows/features/$FEATURE_ID"

# Create contexts directory
mkdir -p "$FEATURE_DIR/contexts"

# Create context
CONTEXT_FILE="$FEATURE_DIR/contexts/technical-analysis.context.md"
touch "$CONTEXT_FILE"

# Fill in template
# Update feature with context reference
```

### Creating Additional Context for Feature

```bash
# Feature directory already exists
FEATURE_ID="feat-2025-10-feature-name"
CONTEXTS_DIR=".pythia/workflows/features/$FEATURE_ID/contexts"

# Check existing contexts
ls -1 "$CONTEXTS_DIR"
# Output: technical-analysis.context.md

# Create new context
CONTEXT_FILE="$CONTEXTS_DIR/architecture-decisions.context.md"
touch "$CONTEXT_FILE"

# Fill in template
# Update feature with new context reference
```

## Common Issues and Solutions

### Issue 1: Wrong Context Location

**Problem:**

```
.pythia/contexts/feat-2025-10-name/  ❌ (general contexts location)
```

**Solution:**

```bash
# Contexts should be in feature directory
.pythia/workflows/features/feat-2025-10-name/contexts/  ✅
```

### Issue 2: Missing .context Suffix

**Problem:**

```
wasm-types.md  ❌ (missing .context suffix)
```

**Solution:**

```bash
# Use .context.md suffix
mv "wasm-types.md" "wasm-types.context.md"
```

### Issue 3: Date Prefix in Feature Contexts

**Problem:**

```
context-2025-11-18-wasm-types.context.md  ❌ (date not needed)
```

**Solution:**

```bash
# Remove date prefix for feature contexts
mv "context-2025-11-18-topic.context.md" "technical-analysis.context.md"
```

### Issue 4: Wrong Separator in Context Name

**Problem:**

```
wasm_types.context.md  ❌ (underscore separator)
wasm.types.context.md  ❌ (dot separator)
```

**Solution:**

```bash
# Use hyphen separator (kebab-case)
mv "topic_name.context.md" "technical-analysis.context.md"
```

## Self-Check Points

Before completing this command, verify:

- [ ] **Location**: Context is in `feat-XXX/contexts/` directory (NOT `.pythia/contexts/`)
- [ ] **File Naming**: Format is `{descriptive-name}.context.md` (no date, no numbering)
- [ ] **Bidirectional Links**: Context references feature AND feature references context
- [ ] **Complete Content**: All template sections are filled
- [ ] **Clear Scope**: Context scope is specific to analysis topic
- [ ] **Technical Details**: Includes code references, file paths, analysis findings
- [ ] **Related Documents**: Links to feature, plans, and other contexts
- [ ] **Metadata**: Status, version, dates, tags are filled
- [ ] **Validation Passed**: All structure validations successful

## Differences from General Contexts

| Aspect       | General Contexts                                 | Feature Contexts               |
| ------------ | ------------------------------------------------ | ------------------------------ |
| **Location** | `.pythia/contexts/`                              | `feat-XXX/contexts/`           |
| **Naming**   | `context-YYYY-MM-topic.md` or `topic-context.md` | `{topic}.context.md` (no date) |
| **Scope**    | Project-wide knowledge                           | Feature-specific analysis      |
| **Created**  | As needed for general knowledge                  | As needed during feature work  |
| **Purpose**  | Domain knowledge, patterns                       | Technical analysis, decisions  |

## Context Template

**For the full context template and detailed section descriptions, see [@create-context.md - Step 7: Insert Minimal Template](mdc:commands/create-context.md#step-7-insert-minimal-template-copypaste).**

### Feature-Specific Template Additions

When using the template from `@create-context.md`, replace the `## Links to Related Documents` section with **inline prose links** in the body — no dedicated section. Required links:

```markdown
Context for [feat-YYYY-MM-name](../feat-YYYY-MM-name.md#@related).

See also [N-plan-name.plan.md](../plans/N-plan-name.plan.md#@source) and
[other-context.context.md](./other-context.context.md#@related).
```

**Note**: The feature backlink is **required** for feature contexts. Use `#@related` for the feature link and sibling contexts; use `#@source` when this context was built from a plan. Never use a standalone `## Links to Related Documents` section — that is a legacy v1 pattern replaced by inline prose links.

## Related Documents

### Primary Reference

- **[Create Context Command](mdc:commands/create-context.md)** - **READ THIS FIRST** for:
  - General context creation guidelines
  - Context structure and sections
  - Content guidelines and best practices
  - Full context template
  - General context naming conventions

### Feature-Specific Commands

- [Create Feature Plan Command](mdc:commands/create-feature-plan.md) - For feature implementation plans
- [Feature Template](mdc:templates/feature-template.md) - Feature document structure

### Templates

- [Context Template](mdc:templates/context-template.md) - General context template (see also `@create-context.md`)

---

**Last Updated**: 2025-11-18
**Command Version**: 1.0.0
