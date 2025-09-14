# Task: {Title}

## Overview

**Task ID**: task-YYYY-MM-descriptive-name  
**Date Created**: YYYY-MM-DD  
**Status**: Not Started / In Progress / Under Review / Blocked / Completed  
**Priority**: High / Medium / Low  
**Complexity**: 🟢 Low / 🟡 Medium / 🔴 High  
**Owner**: {Name}  
**Repository**: {repo-url-or-name}  
**Branch**: feature|bugfix|hotfix/{slug-or-topic}  
**PR**: [link-if-available]  
**LLM Model**: {model-id}

<!-- Add no-archive tag here if the task should never be archived: [no-archive] -->

## 📖 Task Workflow Guide

> **IMPORTANT**: This section provides embedded rules for working with this task. Follow this workflow for consistent execution and quality control.
>
> **Quick Reference**: [Manage Task](mdc:commands/manage-task.md) - Complete task management workflow

### Checkbox Markers (Lightweight Conventions)

- `[LLM]` is the default actor and can be omitted. Any unchecked box without other markers is assumed to be performable by LLM.
- Use `- [ ] ... [H]` for steps that only a human should confirm (LLM never checks these).
- LLM can prepare evidence/notes for each `[H]` item (commands run, links, outcomes) but leaves the box unchecked.
- Example: `- [ ] Create branch 'feature/xyz' and push initial commit [H]`.

### How to Work with This Task

1. **Before Starting**:

   - [ ] Review all Context Documents and related analysis
   - [ ] Check Dependencies section for blockers
   - [ ] Set up Change Tracking (see below)
   - [ ] Prepare for AI Solution Analysis (use @analyze-ai-solutions.md command)

2. **During Implementation**:

   - [ ] Update Progress Tracking after each phase
   - [ ] Document key decisions in context documents
   - [ ] Add changed files to File Changes section
   - [ ] Run AI Solution Analysis for major changes (use @analyze-ai-solutions.md)
   - [ ] Update Context sections when new insights emerge

3. **Quality Control Phase** (Required before completion):

   - [ ] Add/Update tests for all new/changed code (unit/integration as appropriate)
   - [ ] Run coverage and capture summary (target ≥ 85% or project-specific)
   - [ ] Run AI Solution Analysis (use @analyze-ai-solutions.md command)
   - [ ] Run Self-Review Process (see section below)
   - [ ] Validate against Success Criteria
   - [ ] Check Quality Standards compliance
   - [ ] Update context documents with final insights
   - [ ] TDD Integration: Ensure test-driven development workflow is followed

4. **Task Completion**:
   - [ ] Complete Implementation Summary
   - [ ] Archive relevant sessions to context documents
   - [ ] Update related Context Documents
   - [ ] Mark task as Completed

### Change Tracking Setup

```bash
# Set up change tracking for this task
TASK_ID="task-YYYY-MM-descriptive-name"
echo "# Changed Files for $TASK_ID" > .task-changes.md
echo "**Start Date**: $(date +%Y-%m-%d)" >> .task-changes.md
echo "" >> .task-changes.md

# Track changes during work (run after each significant change)
git status --porcelain >> .task-changes.md
```

### Context Document Integration

**Context Tracking**:

- Create or update relevant context documents in `.pythia/contexts/`
- Document key decisions and insights during implementation
- Link to this task file and related context documents

- **Pattern Extraction**:

- If new patterns emerge, document in appropriate context documents
- Cross-reference patterns in task implementation

- **Decision Recording**:

- Major architectural decisions → architecture context documents
- Link decisions to affected components and future implications

## Context

Brief description of the task's background and why it's important. This should provide enough context for the task to be understood independently.

- What problem does this task solve?
- Why is it important now?
- How does it relate to overall project goals?
- What triggered the need for this task?

**Related Context Documents:**

- [Context Document 1](mdc:.pythia/contexts/domain/context-YYYY-MM-topic.md)
- [Context Document 2](mdc:.pythia/contexts/domain/context-YYYY-MM-topic.md)

**Context Documentation Resources:**

- [Context Documentation Guide](mdc:commands/create-context.md) - How to work with context documents
- [Create Context Document](mdc:commands/create-context.md) - How to create new context documents

**Context Analysis:**

- **Key Insights**: [Key insights from context documents]
- **Patterns Identified**: [Relevant patterns from context analysis]
- **Decision Context**: [Context for key decisions made]

## Objectives

Clear, concise list of what this task aims to achieve:

- [ ] Objective 1
- [ ] Objective 2
- [ ] Objective 3

## Implementation Plan

Detailed breakdown of the implementation steps:

1. **Phase 1**: [Description] (Complexity: [Low/Medium/High])

   - [ ] Task 1.1
   - [ ] Task 1.2

2. **Phase 2**: [Description] (Complexity: [Low/Medium/High])

   - [ ] Task 2.1
   - [ ] Task 2.2

3. **Phase 3**: AI Solution Analysis & Quality Control (Complexity: Medium)
   - [ ] **Run AI Solution Analysis** (use @analyze-ai-solutions.md command)
   - [ ] **Run Self-Review Process** (see section below)
   - [ ] **Update context documents with final insights**
   - [ ] **Complete documentation updates**

## Scope

Define what is in scope and out of scope for this task.

**In Scope**:

- [ ] Item 1
- [ ] Item 2

**Out of Scope**:

- Item 1
- Item 2

## Current State Analysis

Describe the current state of the system/component related to this task:

- Current implementation/approach
- Known limitations or issues
- Performance metrics (if relevant)
- User or developer pain points

## Technical Approach

Detailed description of the technical approach to solving the problem:

- [ ] Architectural decisions
- [ ] Design patterns to apply
- [ ] Technologies or libraries to utilize
- [ ] Alternatives considered and why they were rejected

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

List any dependencies that might affect this task:

- [ ] External dependencies (APIs, services)
- [ ] Internal dependencies (other components, tasks)
- [ ] Team dependencies (people, skills)

## Success Criteria

Clearly define what it means for this task to be successfully completed:

- [ ] Functional criteria
- [ ] Technical criteria
- [ ] **Quality criteria** (AI Solution Analysis passed):
  - [ ] Use @analyze-ai-solutions.md command for validation
  - [ ] All quality thresholds met
  - [ ] Documentation concise and clear
- [ ] **Testing criteria**
  - [ ] Tests are present for all new/changed code
  - [ ] Coverage meets target (e.g., ≥ 85%) or deviation justified and approved
- [ ] Performance criteria

## Expected Outcomes

Describe the expected outcomes and impact of completing this task:

- [ ] User/developer experience improvements
- [ ] Performance improvements
- [ ] **Code quality improvements** (validated by AI Solution Analysis):
  - [ ] Use @analyze-ai-solutions.md command for validation
  - [ ] Improved maintainability and reduced complexity
  - [ ] Better documentation quality
- [ ] Process improvements

## Implementation Summary

> To be filled after task completion

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

### AI Solution Analysis Results

> **Note**: Use mdc:commands/analyze-ai-solutions.md command to generate detailed analysis results

**Quality Assessment**:

- [ ] Complexity thresholds met (CC ≤ 10, avg ≤ 7)
- [ ] Duplication < 3% of changed code
- [ ] No unused imports/exports
- [ ] Documentation concise and clear
- [ ] Coverage: [XX%] (target ≥ 85% or project-specific)
- [ ] Overall quality score: [X/5] (minimum 4/5 required)

## Future Improvements

Identify potential future improvements related to this task:

- [ ] Improvement 1
- [ ] Improvement 2

## Notes

Any additional information, caveats, or considerations that should be kept in mind:

- Note 1
- Note 2

### Archiving

This task will be automatically archived when:

1. The status is set to "Completed"
2. All success criteria are marked as completed (✅)
3. It has been in "Completed" status for at least 7 days

If this task should never be archived (e.g., it's an ongoing process or serves as documentation), add the `no-archive` tag in the Overview section.

## References

- [Workflows Status Report](../workflows/report.md)
- [Llm Task Workflow](../rules/llm-task-workflow.md)
- [Create Task](../commands/create-task.md)
- [Manage Task](../commands/manage-task.md)
- [Task Archiving Rules](../rules/task-archiving-rules.md)
- [Documentation Map](../navigation/documentation-map.md)
- [Analyze AI Solutions](../commands/analyze-ai-solutions.md) - Quality control for AI-generated solutions
- [Context Documentation Guide](../methodology/context-documentation.md) - Working with context documents

Links to relevant resources, documentation, or discussions:

- [Reference 1](#)
- [Reference 2](#)

---

**Last Updated**: YYYY-MM-DD
