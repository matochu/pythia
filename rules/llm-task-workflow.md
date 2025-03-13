# LLM Task Workflow Guide

## Purpose

This document provides a high-level workflow for Large Language Models (LLMs) working on the project. It focuses on planning, documentation, and context preservation throughout task execution.

## Core Principles

1. **Plan First, Execute Second** - Always document your approach before implementation
2. **Preserve Context** - Maintain a record of decision-making rationale
3. **Follow Documentation Standards** - Adhere to project conventions
4. **Connect Documents** - Create a web of related documentation
5. **Structured Implementation** - Use the established four-phase approach
6. **Use Current Date** - Always obtain and use the current date for timestamping documents
7. **Track Progress** - Use checkboxes and completion percentages to track task progress
8. **Measure Complexity** - Use complexity ratings instead of time estimates

## Workflow Overview

![LLM Task Workflow](https://mermaid.ink/img/eyJjb2RlIjoiZ3JhcGggVERcbiAgICBBW1JlY2VpdmUgVGFzayBSZXF1ZXN0XSAtLT4gQltBbmFseXplICYgUGxhbl1cbiAgICBCIC0tPiBDW0RvY3VtZW50IFBsYW5dXG4gICAgQyAtLT4gRFtFeGVjdXRlIFRhc2tdXG4gICAgRCAtLT4gRVtEb2N1bWVudCBSZXN1bHRzXVxuICAgIEUgLS0-IEZbVXBkYXRlIFJlbGF0ZWQgRG9jc10iLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9fQ)

### 1. Initial Analysis

When receiving a task request:

- Obtain the current date for proper document timestamping
- Understand core objectives and requirements
- Determine task type (implementation, research, refactoring)
- Review relevant existing documentation
- Identify related components and dependencies
- Assess task complexity using the following criteria:
  - **Low**: Single component, clear requirements, minimal dependencies
  - **Medium**: Multiple components, some dependencies, moderate risk
  - **High**: Cross-system impact, multiple dependencies, high risk

### 2. Plan Development

Before implementing any changes:

- Create a structured plan following the [Implementation Approach](../methodology/implementation-approach.md)
- Identify risks and dependencies
- Define clear success criteria
- Break down work into phases and tasks
- Add checkboxes ([ ]) to all actionable items for progress tracking
- Assign complexity ratings to each phase

### 3. Plan Documentation

Document your plan:

- Create a task file in `docs/tasks` following the naming convention `task-YYYY-MM-{topic}.md`, using the current date
- Use the structure from [Task Template](../templates/task-template.md)
- Emphasize context, objectives, and implementation plan
- Link to related documents and dependencies
- Include progress tracking with completion percentages
- Add checkboxes to all tasks and subtasks

### 4. Task Execution

Follow your plan:

- Work through phases sequentially
- Update task checkboxes as items are completed
- Update progress tracking percentages
- Document key decisions and rationale
- Note any deviations from the original plan

### 5. Results Documentation

After completion:

- Document findings, implementation details, and lessons learned
- Update document status and related cross-references
- Ensure the [Documentation Map](../navigation/documentation-map.md) is updated
- Mark all relevant checkboxes as completed
- Update final completion percentages

## Documentation References

Instead of duplicating content, refer to these key documents:

- [Task Template](../templates/task-template.md) - For the complete task documentation structure
- [Implementation Approach](../methodology/implementation-approach.md) - For the four-phase implementation framework
- [Documentation Guidelines](../methodology/documentation-guidelines.md) - For naming conventions and cross-referencing
- [Documentation Standards](../navigation/documentation-standards.md) - For document structure standards
- [Documentation Structure](../navigation/documentation-structure.md) - For overall documentation organization

## LLM-Specific Guidelines

When working on as an LLM:

1. **Get Current Date** - Always obtain the current date before creating timestamped documents using CLI command `date +%Y-%m-%d`
2. **Create Independent Context** - Document enough context that future work can be done without relying on conversation history
3. **Prioritize Planning** - Spend more time on thorough planning than might seem necessary; this pays dividends later
4. **Capture Decision Points** - Document considered alternatives and reasons for choices
5. **Link Everything** - Create extensive cross-references between related documents
6. **Show Your Work** - Document your thought process for complex problem-solving
7. **Track Progress** - Use checkboxes and completion percentages for all tasks
8. **Assess Complexity** - Rate task complexity instead of providing time estimates

## Progress Tracking Guidelines

### Using Checkboxes

- Add checkboxes to all actionable items: `- [ ] Task description`
- Update checkboxes as tasks are completed: `- [x] Completed task`
- Use nested checkboxes for subtasks:
  ```markdown
  - [ ] Main task
    - [x] Completed subtask
    - [ ] Pending subtask
  ```

### Complexity Ratings

Instead of time estimates, use complexity ratings:

- **Low**: Simple tasks with clear scope and minimal dependencies
- **Medium**: Moderate complexity with some dependencies or uncertainty
- **High**: Complex tasks with multiple dependencies or significant impact

### Progress Tracking Table

Include a progress tracking table with:

- Phase/Component name
- Current status
- Completion percentage
- Last update date
- Notes/Comments

Example:

```markdown
| Phase   | Status      | Completion % | Last Updated | Notes |
| ------- | ----------- | ------------ | ------------ | ----- |
| Phase 1 | In Progress | 60%          | 2025-03-10   | -     |
```

## Simplified Example

**User Request**: "Improve offline data handling"

**LLM Response**:

1. **Create task document** in `docs/tasks/task-2025-03-offline-data-handling.md`
2. **Document plan** including research on caching strategies, implementation phases, and success criteria
3. **Implement solution** according to plan
4. **Document results** including challenges encountered and solutions found
5. **Update related documents** like `analysis-offline-mode.md` with new findings

## Success Criteria

A task is successfully executed when:

1. A well-structured task document exists in the appropriate location
2. The implementation follows the documented plan
3. All context and decision-making rationale are preserved
4. The documentation map and related documents are updated
5. The completed work meets the defined success criteria
6. All task checkboxes are properly marked
7. Progress tracking is complete and accurate

---

**Last Updated**: 2025-03-10

## References

- [Guide Llm Documentation Workflow](../guides/guide-llm-documentation-workflow.md)
