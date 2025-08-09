# Command: Task Management Workflow

> IMPORTANT: Lightweight workflow to drive a task from creation to completion. Optimized for LLM + human collaboration with minimal ceremony.

## Purpose

Provide a concise, actionable sequence for tasks: Context-First intake → Plan → Execute → Review → Complete, with human-only markers and simple status gates.

## Usage

- Reference this command in your workspace: `@task-management.md`
- Execute with project context and follow the checklist below

## Minimal Checklist

- [ ] Context-First intake performed (link at least one context for Medium/High complexity, or justify none)
- [ ] Overview fields filled: Repository, Branch (human), PR (if any), LLM Model
- [ ] Phased plan with checkboxes; human-only items marked with [H]
- [ ] Status transitions follow canonical model
- [ ] Under Review gate: Context valid, Success Criteria drafted
- [ ] Completed gate: AI Solution Analysis present with pass indicators; all criteria checked
- [ ] Workflows report updated; validation run fixed
- [ ] Memory Bank updated (sessions/patterns/decisions)

## Status Model and Gates (Lightweight)

- Canonical: Not Started → In Progress → Under Review → Completed → Archived
- Side: In Progress ↔ Blocked; Cancelled
- Under Review: context present and valid; criteria drafted
- Completed: AI Solution Analysis results present; criteria checked
- Blocked/Cancelled: include brief reason

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
- [Memory Bank Management](mdc:commands/memory-bank-management.md)
- [Task Template](mdc:templates/task-template.md)

---

Last Updated: 2025-08-08

