# Command: Create Context Document

> **IMPORTANT**: Creates a minimal, production‑ready context document and wires it into the documentation graph (tasks/proposals/map) with zero custom config.

## Purpose

Create a new context document with the right structure, metadata, naming, and references so LLMs and humans can reliably discover and use it during task and decision workflows.

## Workspace Usage

```bash
# Reference the command
@create-context.md

# Execute with project context
Execute this command for my project at [project-path]

# Example usage
@create-context.md
Context: Need a technical context for TV offline caching patterns
Type: Technical
Target folder: docs/contexts/performance
```

## Command Checklist (Minimal)

- [ ] Determine context type and target folder (technical/business/user/operational)
- [ ] Create file with flexible naming: `{type}-{date}-{topic-slug}.md` or `{topic-slug}.md`
- [ ] Insert required metadata and sections (see Minimal Template)
- [ ] Add cross‑references (related tasks/proposals/contexts)
- [ ] Update Documentation Map
- [ ] Validate links and structure
- [ ] Link to related tasks or proposals if they exist

## Quick Start (Skip to Step 7 if you know what you're doing)

If you need a context RIGHT NOW and don't want to analyze the whole project:

1. **Choose location**: Use existing `docs/contexts/` structure or create `docs/contexts/general/`
2. **Name file**: `context-YYYY-MM-topic.md` (for task-specific) or `topic-context.md` (for general)
3. **Copy template** from Step 7 below and fill it
4. **Add links** in Step 8

For detailed analysis and project integration, follow Steps 1-6 below.

## Step 1: Analyze Project Context Structure

### 1.1. Map Existing Contexts

```bash
# Find all context files
find docs/contexts -name "*.md" -type f | head -20

# Extract document types
find docs/contexts -name "*.md" -type f | sed 's/.*\///' | sed 's/-.*//' | sort | uniq
```

### 1.2. Identify Project Domains

```bash
# Find subdirectories (domains)
find docs/contexts -type d | grep -v "^docs/contexts$" | sed 's|docs/contexts/||' | sort
```

### 1.3. Understand Naming Conventions

```bash
# Find date patterns
find docs/contexts -name "*.md" -type f | grep -E "[0-9]{4}-[0-9]{2}-[0-9]{2}"  # YYYY-MM-DD
find docs/contexts -name "*.md" -type f | grep -E "[0-9]{4}-[0-9]{2}-" | grep -v -E "[0-9]{4}-[0-9]{2}-[0-9]{2}"  # YYYY-MM
find docs/contexts -name "*.md" -type f | grep -v -E "[0-9]{4}-[0-9]{2}"  # No date
```

## Step 2: Determine Creation Date

```bash
# Get current date for LLM
CURRENT_DATE=$(date +%Y-%m-%d)
echo "Current date: $CURRENT_DATE"
```

## Step 3: Determine Document Type

### 3.1. Analyze Context Purpose

- Is this context for a specific task? → Use task-specific type
- Is this context for general knowledge? → Use general type
- Is this context for reference? → Use reference type
- Is this context for analysis? → Use analysis type

### 3.2. Choose Appropriate Type

- **Follow existing patterns** in the project
- **Use established types** when possible
- **Create new types** only when necessary
- **Maintain consistency** across similar contexts

### 3.3. Determine Date Relevance

- **Task-specific context** → Use YYYY-MM-DD
- **Monthly relevant context** → Use YYYY-MM
- **Stable, timeless context** → No date
- **Follow existing date patterns** in the project

## Step 4: Determine Categorization

### 4.1. Choose Category Based on Analysis

- **Domain categories**: Based on project domains found
- **Technical categories**: Based on technical areas
- **Process categories**: Based on workflow areas
- **Reference categories**: Based on reference materials

### 4.2. Create Directory Structure

```bash
# Create directory based on analysis
CTX_DIR="docs/contexts/[category]/[subcategory]"
mkdir -p "$CTX_DIR"
```

## Step 5: Create File Name

### 5.1. Apply Naming Pattern

```bash
# Generate file name based on analysis
TYPE="context"  # or analysis, guide, reference, spec, design, review, audit, etc.
DATE="$CURRENT_DATE"  # or YYYY-MM or empty
TOPIC="tv-navigation-patterns"
FILENAME="${TYPE}-${DATE}-${TOPIC}.md"
# Remove empty date part if no date
FILENAME=$(echo $FILENAME | sed 's/--/-/g')

# Alternative: No prefix for stable contexts
# FILENAME="${DATE}-${TOPIC}.md"  # or just "${TOPIC}.md"
```

### 5.2. Validate Naming

- Check if similar files exist
- Ensure uniqueness
- Follow project conventions
- Maintain consistency

## Step 6: Create Context File

```bash
# Create file with determined name
CTX_FILE="$CTX_DIR/$FILENAME"
[ -f "$CTX_FILE" ] || touch "$CTX_FILE"
echo "Created: $CTX_FILE"
```

## Step 7: Insert Minimal Template (copy/paste)

Paste the following Minimal Context Template into the new file and fill in the brackets:

```markdown
# Context: [Short Title]

Status: Draft
Version: 1.0.0
Created: YYYY-MM-DD
Last Updated: YYYY-MM-DD
Tags: #technical #domain/[name] #time/[current|historical|prospective]

## Description

Brief overview: what this context covers and why it exists.

## Key Information

- [Core facts / constraints]
- [Patterns / practices]
- [Examples / edge cases]

## Artifacts and Resources

- [Links to specs, diagrams, repos]

## Questions and Answers

- Q: [Question]
  A: [Answer]

## Conclusions

- [Key takeaways and recommendations]

## Links to Related Documents

- Related Contexts: [mdc:docs/contexts/...]
- Related Tasks: [mdc:docs/workflows/tasks/task-YYYY-MM-topic.md]
- Related Proposals/Decisions: [mdc:docs/workflows/proposals/...]

## Change History

| Date       | Change           | Author |
| ---------- | ---------------- | ------ |
| YYYY-MM-DD | Initial creation | Name   |
```

Notes:

- Keep the context concise; move verbose artifacts to “Resources” and link.
- Use English for consistency across tools.

## Step 8: Add Cross‑References (bidirectional)

- From the context: link to related tasks/proposals/contexts (Links section).
- From related tasks/proposals: add a link back to this context in their Context/References section.
- For tasks managed with Context‑First intake, ensure at least one such link exists (or justification if none).

## Step 9: Update Documentation Map

- Add the new context to the Documentation Map under appropriate section/category:

```bash
@update-documentation-map.md
```

## Step 10: Validation

- Validate links and structure:

```bash
@validate-documentation.md
```

- If broken links are reported, fix paths and re‑run.

## Step 11: Final Check

- Validate all links work
- Check that context is referenced from at least one task or proposal
- Update Documentation Map if needed

## Acceptance Criteria

- Context file exists with flexible naming and required sections
- Metadata block filled (Status, Version, Created, Last Updated, Tags)
- Bidirectional links to at least one related document (task/proposal/context)
- Documentation Map updated; link validation passes

## References

- [Context Template](mdc:templates/context-template.md)
- [Create Task](mdc:commands/create-task.md)
- [Validate Documentation](mdc:commands/validate-documentation.md)
- [Update Documentation Map](mdc:commands/update-documentation-map.md)

---

Last Updated: 2025-09-13
