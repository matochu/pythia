# Command: Create Context Document

> **IMPORTANT**: Creates a minimal, production‑ready context document and wires it into the documentation graph (tasks/proposals/map/Memory Bank) with zero custom config.

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
- [ ] Create file with standard naming: `context-YYYY-MM-short-slug.md`
- [ ] Insert required metadata and sections (see Minimal Template)
- [ ] Add cross‑references (related tasks/proposals/contexts)
- [ ] Update Documentation Map
- [ ] Validate links and structure
- [ ] (Optional) Link relevant Memory Bank entries; create a short session note

## Step 1: Determine Type and Placement

- Choose type/directory based on your project structure (examples):
  - `docs/contexts/technical/`
  - `docs/contexts/business/`
  - `docs/contexts/user/`
  - `docs/contexts/operational/`
- If unsure, place under `docs/contexts/technical/` and tag appropriately.

## Step 2: Create the Context File

```bash
# Get the current date for proper timestamping
DATE=$(date +%Y-%m)
SLUG="offline-caching"
CTX_DIR="docs/contexts/technical"
mkdir -p "$CTX_DIR"
CTX_FILE="$CTX_DIR/context-$DATE-$SLUG.md"

# Create file
[ -f "$CTX_FILE" ] || touch "$CTX_FILE"
echo "Created: $CTX_FILE"
```

## Step 3: Insert Minimal Template (copy/paste)

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

## Step 4: Add Cross‑References (bidirectional)

- From the context: link to related tasks/proposals/contexts (Links section).
- From related tasks/proposals: add a link back to this context in their Context/References section.
- For tasks managed with Context‑First intake, ensure at least one such link exists (or justification if none).

## Step 5: Update Documentation Map

- Add the new context to the Documentation Map under appropriate section/category:

```bash
@update-documentation-map.md
```

## Step 6: Validation

- Validate links and structure:

```bash
@validate-documentation.md
```

- If broken links are reported, fix paths and re‑run.

## Step 7: Memory Bank Integration (Optional)

- If relevant entries exist, link them:

```bash
# List recent session insights
find .memory-bank/sessions -name "*.md" -mtime -30 | head -10 || true
```

- Create a short session note about the new context (optional):

```bash
cat > .memory-bank/sessions/$(date +%Y-%m-%d)-context-$SLUG.md << 'EOF'
# Session: Created context - $SLUG

**Context File**: mdc:docs/contexts/technical/context-YYYY-MM-$SLUG.md
**Reason**: [Why the context was needed]
**Links**: [Add related tasks/proposals]
EOF
```

## Acceptance Criteria

- Context file exists with standard naming and required sections
- Metadata block filled (Status, Version, Created, Last Updated, Tags)
- Bidirectional links to at least one related document (task/proposal/context)
- Documentation Map updated; link validation passes

## References

- [Context Documentation Methodology](mdc:methodology/context-documentation.md)
- [Context Documentation Critique](mdc:contexts/analysis/analysis-context-documentation-critique.md)
- [Context Template](mdc:templates/context-template.md)
- [Create Task](mdc:commands/create-task.md)
- [Validate Documentation](mdc:commands/validate-documentation.md)
- [Update Documentation Map](mdc:commands/update-documentation-map.md)

---

Last Updated: 2025-08-08
