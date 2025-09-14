# Command: Task Management Workflow

> IMPORTANT: Lightweight workflow to drive a task from creation to completion. Optimized for LLM + human collaboration with minimal ceremony.

## Purpose

Provide a concise, actionable sequence for tasks: Context-First intake → Plan → Execute → Review → Complete, with human-only markers and simple status gates.

## Usage

- Reference this command in your workspace: `@manage-task.md`
- Execute with project context and follow the checklist below

## Minimal Checklist

- [ ] Context-First intake performed (link at least one context for Medium/High complexity, or justify none - if none exists, create minimal context using Quick Start)

### Context Document Integration

Before managing the task, review relevant context documents:

```bash
# Search for relevant context documents
CONTEXTS_PATH="docs/contexts"
find "$CONTEXTS_PATH" -type f -name "*.md" -exec grep -l "feature-name" {} \;

# Find context directory structure
find "$CONTEXTS_PATH" -type d | grep -v "^docs/contexts$" | sed 's|docs/contexts/||' | sort

# Review context documents for insights
cat "$CONTEXTS_PATH/[category]/context-YYYY-MM-DD-topic.md"

# Extract key insights for task management
grep -A 5 -B 5 "key-term" "$CONTEXTS_PATH/[category]/context-YYYY-MM-DD-topic.md"
```

**For detailed context creation and directory structure guidance, see [@create-context.md](mdc:commands/create-context.md)**

Context documents should inform:

- Task scope and objectives
- Risk assessment and mitigation strategies
- Success criteria definition
- Technical approach and constraints
- [ ] Overview fields filled: Repository, Branch (human), PR (if any), LLM Model
- [ ] Phased plan with checkboxes; human-only items marked with [H]
- [ ] Any changes to existing plan/checklist are requested and approved ([H]); no silent edits
- [ ] Tests added/updated for all new or changed code
- [ ] Coverage meets project target (e.g., ≥85%); attach/report summary
- [ ] Status transitions follow canonical model
- [ ] Under Review gate: Context valid, Success Criteria drafted
- [ ] Completed gate: AI Solution Analysis present with pass indicators; tests/coverage OK; all criteria checked
- [ ] Workflows report updated; validation run fixed
- [ ] Context documents updated with task insights

## Status Model and Gates (Lightweight)

- Canonical: Not Started → In Progress → Under Review → Completed → Archived
- Side: In Progress ↔ Blocked; Cancelled
- Under Review: context present and valid; criteria drafted; plan changes (if any) recorded and approved ([H])
- Completed: AI Solution Analysis results present; tests exist for new/changed code; coverage ≥ target; criteria checked
- Blocked/Cancelled: include brief reason

## Plan and Checklist Change Control

- Do not modify or remove existing checklist items or phases without explicit human approval. No silent edits.
- When re-planning or altering existing items, add a Change Request in the task and wait for `[H]` approval.
- New items may be appended as suggestions, but must be clearly marked and not alter prior commitments until approved.

### How to propose a change

Add a short block under Implementation/Progress (or a dedicated "Change Log"):

```markdown
### Change Request (YYYY-MM-DD)

- Reason: [why change is needed]
- Proposed change: [new/edited items or phase adjustments]
- Impact: [scope/timeline/success criteria]
- Affected checklist items: [list]
- Approval: [H]
```

After human approval `[H]`, apply the change. Preserve original text by striking through or moving to a "Superseded" sub-list to keep auditability.

### Editing rules

- Minor clarifications may be added as indented notes beneath an item without changing the original line.
- For deletions, use a Change Request and move the item to a "Removed (approved)" section with the approval note.
- For phase reordering, include a brief rationale and update dependencies.
- Formatting: Use minimal formatting - only bold (\*\*) in critical places where it was in the original
- Current Date: Always update current date when making changes
- New Sections: Ask user permission before adding new sections to existing documents

## Human-Only Checkboxes

- `[LLM]` is the default actor and can be omitted
- Use `[H]` at the end of the line for human-only steps (e.g., create/push branch)
- LLM may add notes under `[H]` items (commands, PR/CI links, what to verify), but must not check the box

## References

- [Create Task](mdc:commands/create-task.md)
- [Update Status](mdc:commands/update-status.md)
- [Report Workflows](mdc:commands/report-workflows.md)
- [Validate Documentation](mdc:commands/validate-documentation.md)
- [Analyze AI Solutions](mdc:commands/analyze-ai-solutions.md)
- [Context Documentation Guide](mdc:commands/create-context.md)
- [Create Context Document](mdc:commands/create-context.md) - How to create context with flexible naming
- [Task Template](mdc:templates/task-template.md)

---

Last Updated: 2025-09-04
