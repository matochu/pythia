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

<!-- Add no-archive tag here if the feature should never be archived: [no-archive] -->

## 📖 Feature Workflow Guide

> - Features are complex, multi-phase work items that may include:
> - Detailed implementation plans (plans/ directory)
> - Context documentation (contexts/ directory)
> - Progress tracking reports (reports/ directory)
> - Research notes (notes/ directory)

### Directory Structure

This feature directory can contain supplementary materials:

```
feat-YYYY-MM-name/
├── feat-YYYY-MM-name.md        # This file (main feature document)
├── plans/                       # Detailed implementation plans (created as needed)
├── contexts/                    # Context documentation (created as needed)
├── reports/                     # Progress and analysis reports (created as needed)
└── notes/                       # Research notes and explorations (created as needed)
```

**Note**: Subdirectories are created only when needed, not upfront.

### Checkbox Markers (Lightweight Conventions)

- `[LLM]` is the default actor and can be omitted
- Use `- [ ] ... [H]` for steps that only a human should confirm
- LLM can prepare evidence/notes for `[H]` items but leaves the box unchecked
- Example: `- [ ] Create branch 'feature/xyz' and push initial commit [H]`

### How to Work with This Feature

1. **Before Starting**:

   - [ ] Review all Context Documents in contexts/
   - [ ] Review all Implementation Plans in plans/
   - [ ] Check Dependencies section for blockers
   - [ ] Set up Change Tracking

2. **During Implementation**:

   - [ ] Update Progress Tracking after each phase
   - [ ] Document key decisions in context documents
   - [ ] Create progress reports in reports/
   - [ ] Update contexts/ when new insights emerge
   - [ ] Add research notes to notes/

3. **Quality Control Phase**:

   - [ ] Add/Update tests for all new/changed code
   - [ ] Run coverage and capture summary (target ≥ 85%)
   - [ ] Run AI Solution Analysis (use @analyze-ai-solutions.md)
   - [ ] Run Self-Review Process
   - [ ] Validate against Success Criteria
   - [ ] Update context documents with final insights

4. **Feature Completion**:
   - [ ] Complete Implementation Summary
   - [ ] Archive relevant sessions to context documents
   - [ ] Create final status report
   - [ ] Update related documentation
   - [ ] Mark feature as Completed

## Summary

Brief overview of what this feature accomplishes (2-3 paragraphs).

- What is being built?
- Why is it important?
- What is the expected impact?

## Motivation

### Why This Feature?

Explain the motivation and driving factors behind this feature:

- What problem are we solving?
- Why is this feature necessary now?
- What value does it bring to users/project?
- What happens if we don't build this?

### Business/Technical Drivers

- **Business Need**: [Describe business motivation]
- **Technical Need**: [Describe technical motivation]
- **User Impact**: [Describe user benefit]
- **Strategic Alignment**: [How does this align with project goals?]

## Objectives

Clear, concise list of what this feature aims to achieve:

- [ ] Objective 1: [Specific, measurable goal]
- [ ] Objective 2: [Specific, measurable goal]
- [ ] Objective 3: [Specific, measurable goal]

## Context

### Background

Describe the context and background for this feature:

- What problem does this feature solve?
- Why is it important now?
- How does it relate to overall project goals?
- What triggered the need for this feature?

### Problem Statement

Clear, concise statement of the problem being addressed.

### Technical Constraints

List any technical, resource, or platform constraints:

- Technical limitations
- Resource constraints
- Platform requirements
- Timeline constraints

## Scope

Define what is in scope and out of scope for this feature.

### In Scope

- [ ] Item 1: [Description]
- [ ] Item 2: [Description]
- [ ] Item 3: [Description]

### Out of Scope

- Item 1: [Description and reason why out of scope]
- Item 2: [Description and reason why out of scope]
- Item 3: [Description and reason why out of scope]

## Implementation Plan (Internal)

High-level breakdown of implementation phases within this feature document:

### Phase 1: [Phase Name] (Complexity: [Low/Medium/High])

- [ ] Step 1.1: [Description]
- [ ] Step 1.2: [Description]
- [ ] Step 1.3: [Description]

### Phase 2: [Phase Name] (Complexity: [Low/Medium/High])

- [ ] Step 2.1: [Description]
- [ ] Step 2.2: [Description]

### Phase 3: [Phase Name] (Complexity: [Low/Medium/High])

- [ ] Step 3.1: [Description]
- [ ] Step 3.2: [Description]

---

## Detailed Implementation Plans (External)

> **Note**: Detailed plans are created separately in `plans/` directory as implementation progresses and requirements become clearer. External plans contain deep technical details, research findings, and step-by-step implementation guidance.

**When to create external plans:**

- Implementation phase requires detailed technical design
- Multiple approaches need evaluation
- Complex architecture decisions needed
- Step-by-step implementation guidance required

**Existing External Plans:**

- [Plan 1: Phase Name](plans/1-phase-name.plan.md) - Brief description
- [Plan 2: Phase Name](plans/2-phase-name.plan.md) - Brief description

**Creating New Plans:**
Use [@create-feature-plan.md](mdc:commands/create-feature-plan.md) command to create detailed implementation plans for specific phases.

## Related Contexts

Link to context documents providing background and analysis:

- [Context: Topic Name](contexts/topic-name.context.md) - Brief description

### Context Documentation

Context documents provide:

- Technical analysis and research
- Architecture decisions and rationale
- Domain knowledge and background
- Risk assessment and mitigation strategies

Use [@create-context.md](mdc:commands/create-context.md) to create new context documents.

## Progress Reports

Track progress through detailed reports:

- [Status Report](reports/status-report.report.md) - Overall feature status
- [Performance Analysis](reports/performance-analysis.report.md) - Performance metrics

### Creating Reports

Create reports to document:

- Milestone completion
- Performance analysis
- Risk assessment updates
- Stakeholder updates

## Technical Approach

Detailed description of the technical approach:

- [ ] Architectural decisions
- [ ] Design patterns to apply
- [ ] Technologies or libraries to utilize
- [ ] Alternatives considered and why they were rejected

### Architecture Overview

Provide high-level architecture overview (diagrams welcome):

```
[Architecture diagram or description]
```

## Progress Tracking

| Phase   | Status      | Completion % | Last Updated | Notes |
| ------- | ----------- | ------------ | ------------ | ----- |
| Phase 1 | Not Started | 0%           |              |       |
| Phase 2 | Not Started | 0%           |              |       |
| Phase 3 | Not Started | 0%           |              |       |

## Risks and Mitigation

| Risk     | Impact          | Likelihood      | Mitigation Strategy    |
| -------- | --------------- | --------------- | ---------------------- |
| [Risk 1] | High/Medium/Low | High/Medium/Low | [Strategy to mitigate] |
| [Risk 2] | High/Medium/Low | High/Medium/Low | [Strategy to mitigate] |
| [Risk 3] | High/Medium/Low | High/Medium/Low | [Strategy to mitigate] |

## Dependencies

List any dependencies that might affect this feature:

- [ ] External dependencies (APIs, services, third-party libraries)
- [ ] Internal dependencies (other components, features, tasks)
- [ ] Team dependencies (people, skills, knowledge)
- [ ] Infrastructure dependencies (servers, tools, access)

## Success Criteria

Clearly define what it means for this feature to be successfully completed:

- [ ] **Functional Criteria**:

  - [ ] [Specific functional requirement 1]
  - [ ] [Specific functional requirement 2]

- [ ] **Technical Criteria**:

  - [ ] [Specific technical requirement 1]
  - [ ] [Specific technical requirement 2]

- [ ] **Quality Criteria**:

  - [ ] Tests are present for all new/changed code
  - [ ] Coverage meets target (≥ 85%) or deviation justified
  - [ ] AI Solution Analysis passed

- [ ] **Performance Criteria**:
  - [ ] [Specific performance requirement 1]
  - [ ] [Specific performance requirement 2]

## Expected Outcomes

Describe the expected outcomes and impact of completing this feature:

- [ ] **User/Developer Experience Improvements**:

  - [Improvement 1]
  - [Improvement 2]

- [ ] **Performance Improvements**:

  - [Improvement 1]
  - [Improvement 2]

- [ ] **Code Quality Improvements**:
  - [Improvement 1]
  - [Improvement 2]

## Implementation Summary

> To be filled after feature completion

### Key Challenges Encountered

- Challenge 1: [Description]
- Challenge 2: [Description]

### Solutions Implemented

- [ ] Solution 1: [Description]
- [ ] Solution 2: [Description]

### Deviations from Original Plan

- Deviation 1: [Description and rationale]
- Deviation 2: [Description and rationale]

### Lessons Learned

- Lesson 1: [Description and future application]
- Lesson 2: [Description and future application]

### AI Solution Analysis Results

> **Note**: Use @analyze-ai-solutions.md command to generate detailed analysis

**Quality Assessment**:

- [ ] Complexity thresholds met (CC ≤ 10, avg ≤ 7)
- [ ] Duplication < 3% of changed code
- [ ] No unused imports/exports
- [ ] Documentation concise and clear
- [ ] Coverage: [XX%] (target ≥ 85%)
- [ ] Overall quality score: [X/5] (minimum 4/5 required)

## Future Improvements

Identify potential future improvements related to this feature:

- [ ] Improvement 1: [Description]
- [ ] Improvement 2: [Description]
- [ ] Improvement 3: [Description]

## Notes

Any additional information, caveats, or considerations:

### Research Notes

Link to detailed research in notes/ directory:

- [Research Note 1](notes/research-note-1.md)
- [Exploration 1](notes/exploration-1.md)

### Additional Considerations

- Consideration 1
- Consideration 2

### Archiving

This feature will be automatically archived when:

1. The status is set to "Completed"
2. All success criteria are marked as completed (✅)
3. It has been in "Completed" status for at least 30 days (longer than tasks due to complexity)

If this feature should never be archived, add the `no-archive` tag in the Overview section.

## References

### Core Management

- [Create Feature](mdc:commands/create-feature.md) - Feature creation workflow
- [Create Feature Plan](mdc:commands/create-feature-plan.md) - Plan creation
- [Create Context](mdc:commands/create-context.md) - Context documentation
- [Manage Task](mdc:commands/manage-task.md) - Task management workflow
- [Feature Template](mdc:templates/feature-template.md) - This template

### Related Documentation

- [Related Feature 1](mdc:path-to-feature.md)
- [Related Task 1](mdc:path-to-task.md)
- [External Resource 1](#)

---

**Last Updated**: YYYY-MM-DD
