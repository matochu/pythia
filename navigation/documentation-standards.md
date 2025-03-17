# Documentation Standards

> **Note**: This document outlines standards for documentation in the project. While the documentation itself should be maintained in English only, this document provides standards applicable to all documentation regardless of language.

## Document Structure Standards

This section outlines the expected structure for each type of document in our documentation system. Following these standards ensures consistency across all documentation.

### Architecture Analysis Documents

All architecture analysis documents should follow this structure:

```
# [Component/Feature] Analysis

## Summary

Brief overview of the analysis document, explaining its purpose and scope.

## Current State

Description of the current state of the component/feature being analyzed.

## Analysis

Detailed analysis sections, tailored to the specific topic.

### [Analysis Section 1]

Content for the first analysis section.

### [Analysis Section 2]

Content for the second analysis section.

## Issues Identified

List of issues identified during the analysis:

1. **[Issue 1]**: Description and impact
2. **[Issue 2]**: Description and impact

## Recommendations

Specific recommendations based on the analysis:

1. **[Recommendation 1]**: Details and rationale
2. **[Recommendation 2]**: Details and rationale

## Related Documents

Links to related documents:

- [Related Document 1](link-to-document-1)
- [Related Document 2](link-to-document-2)
```

### Proposal Documents

Proposal documents should follow this structure:

```
# [Proposal Title]

## Summary

Brief overview of the proposal, explaining the change being proposed.

## Current State Analysis

Description of the current state and why a change is needed.

## Proposed Solution

Detailed description of the proposed solution.

### [Solution Component 1]

Details about the first component of the solution.

### [Solution Component 2]

Details about the second component of the solution.

## Benefits

Expected benefits of implementing the proposal:

1. **[Benefit 1]**: Description and impact
2. **[Benefit 2]**: Description and impact

## Risks and Mitigation

Potential risks and their mitigation strategies:

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Risk 1 | High/Medium/Low | High/Medium/Low | Mitigation strategy |
| Risk 2 | High/Medium/Low | High/Medium/Low | Mitigation strategy |

## Implementation Plan

Steps for implementing the proposal:

1. **Phase 1**: Description of phase 1 activities
2. **Phase 2**: Description of phase 2 activities

## Success Metrics

Metrics to measure the success of the implementation:

- **Metric 1**: Baseline and target values
- **Metric 2**: Baseline and target values

## Related Documents

Links to related documents:

- [Related Document 1](link-to-document-1)
- [Related Document 2](link-to-document-2)
```

### Architecture Decision Records (ADRs)

ADRs should follow this concise structure:

```
# [Decision Title] Decision

## Context

Description of the context and problem being addressed.

## Decision

Statement of the decision made.

## Consequences

Description of the consequences of this decision, both positive and negative.

## Status

Current status of the decision (Proposed, Accepted, Deprecated, Superseded).

## Related Documents

Links to related documents:

- [Related Document 1](link-to-document-1)
- [Related Document 2](link-to-document-2)
```

### Task Documentation

Task documentation should follow this structure:

```
# Task: [Title]

## Overview

**Task ID**: [ID]
**Date Created**: [YYYY-MM-DD]
**Status**: [Not Started, In Progress, Completed, On Hold]
**Priority**: [Low, Medium, High]
**Owner**: [Name]

## Context

Description of the task's background and importance.

## Objectives

Clear list of what this task aims to achieve.

## Scope

Definition of what is in scope and out of scope.

## Current State Analysis

Description of the current state relevant to this task.

## Technical Approach

Detailed description of the approach to solve the problem.

## Implementation Plan

Breakdown of implementation steps.

## Progress Tracking

Status tracking table.

## Risks and Mitigation

Identified risks and mitigation strategies.

## Dependencies

List of dependencies.

## Success Criteria

Definition of what constitutes successful completion.

## Expected Outcomes

Description of expected outcomes and impact.

## Implementation Summary

Summary of implementation (after completion).

## Future Improvements

Potential future improvements.

## References
- [Update Documentation Map](../commands/update-documentation-map.md)
- [Documentation Structure](documentation-structure.md)
- [Update Changelog](../commands/update-changelog.md)
- [Documentation Guidelines](../methodology/documentation-guidelines.md)
- [Implementation Approach](../methodology/implementation-approach.md)
- [Llm Task Workflow](../rules/llm-task-workflow.md)
- [README](../README.md)
Links to relevant resources.
```

### Guide Documents

Guide documents should follow this structure:

```
# [Guide Title]

## Purpose

Explanation of what this guide helps users accomplish.

## Prerequisites

List of prerequisites before using this guide:

- Prerequisite 1
- Prerequisite 2

## Step-by-Step Instructions

Detailed instructions:

### Step 1: [Title]

Instructions for step 1.

### Step 2: [Title]

Instructions for step 2.

## Examples

Example scenarios:

### Example 1: [Title]

Detailed example 1.

### Example 2: [Title]

Detailed example 2.

## Troubleshooting

Common issues and solutions:

### Problem: [Issue 1]

Solution description.

### Problem: [Issue 2]

Solution description.

## Related Documents

Links to related documents:

- [Related Document 1](link-to-document-1)
- [Related Document 2](link-to-document-2)
```

### Methodology Documents

Methodology documents should follow this structure:

```
# [Methodology Title]

## Overview

Description of the methodology and its purpose.

## Process

Detailed explanation of the process:

### Phase 1: [Title]

Description of phase 1.

### Phase 2: [Title]

Description of phase 2.

## Best Practices

List of best practices:

1. **[Practice 1]**: Description
2. **[Practice 2]**: Description

## Tools and Templates

Resources to support the methodology:

- **[Tool/Template 1]**: Description and link
- **[Tool/Template 2]**: Description and link

## Examples

Example applications of the methodology:

### Example 1: [Title]

Detailed example 1.

### Example 2: [Title]

Detailed example 2.

## Related Documents

Links to related documents:

- [Related Document 1](link-to-document-1)
- [Related Document 2](link-to-document-2)
```

## Writing Style Guidelines

### General Principles

1. **Clarity**: Write clearly and concisely, avoiding unnecessary jargon
2. **Completeness**: Provide comprehensive information without unnecessary detail
3. **Consistency**: Use consistent terminology throughout all documents
4. **Actionability**: When appropriate, make documentation actionable with clear steps
5. **Audience Awareness**: Write with your audience in mind (developers, architects, etc.)

### Voice and Tone

- Use a professional, neutral tone
- Prefer active voice over passive voice
- Be direct and straightforward
- Avoid condescension or assuming too much knowledge
- Maintain a helpful, instructional tone in guides

### Grammar and Formatting

- Use proper sentence structure and grammar
- Organize content with appropriate headings and subheadings
- Use bullet points and numbered lists for clarity where appropriate
- Include code snippets with proper formatting and syntax highlighting
- Use tables for comparative information or structured data

### Code Examples

- Include meaningful code examples where helpful
- Use proper syntax highlighting
- Provide comments within code to explain complex sections
- Ensure code examples are accurate and follow project coding standards
- For longer code examples, focus on the relevant sections

### Diagrams and Visualizations

- Use diagrams to illustrate complex relationships or processes
- Provide text descriptions alongside diagrams for accessibility
- Use consistent notation in diagrams (UML, C4, etc.)
- Keep diagrams simple and focused on the key information
- Update diagrams when the underlying architecture changes

## Documentation Review Process

### Initial Review

All new documentation should undergo an initial review:

1. Self-review by the author
2. Technical review by a peer
3. Structural review against these standards
4. Final review by a documentation maintainer

### Periodic Reviews

Existing documentation should be reviewed periodically:

1. Quarterly review of high-importance documents
2. Bi-annual review of all other documents
3. Immediate review when related code or architecture changes significantly

### Review Checklist

During documentation review, check for:

- [ ] Adherence to document structure standards
- [ ] Technical accuracy and completeness
- [ ] Clarity and readability
- [ ] Proper cross-referencing to related documents
- [ ] Updated diagrams and visualizations
- [ ] Correct formatting and style
- [ ] Current status (not outdated information)

## Versioning and History

### Version Control

- All documentation is stored in the main repository alongside code
- Changes to documentation follow the same branch and PR process as code
- Major changes should include a description of the changes in the PR

### Change History

For significant documents:

- Add "Last Updated" information at the end of the document in the format `**Last Updated**: YYYY-MM-DD`
- Update the date whenever making meaningful changes to the document
- When working with documents, always check the last updated date and update it if:
  - Making substantial changes to the content
  - Updating related documents as part of a larger change
  - Adding new information that requires a more recent date
- Consider including a brief change log for major revisions
- Ensure the modification date in the file metadata is accurate

## Cross-Referencing Standards

### Internal References

When referencing other project documents:

- Use relative paths: `../folder/file-name.md`
- Provide descriptive link text: `[Learn more about state management](../architecture/analysis-state-management.md)`
- When appropriate, include the specific section: `[Learn about Redux](../architecture/analysis-state-management.md#redux-architecture)`

### External References

When referencing external resources:

- Use direct links to the specific resource
- Include version information when referencing versioned documentation
- Consider including the access date for potentially volatile resources
- Provide context about why the external resource is relevant

## Documentation Maintenance

### Responsibility

- Each document should have a clear owner or responsible team
- The documentation map should be maintained by the architecture team
- Everyone is responsible for suggesting updates when they notice outdated information

### Update Triggers

Documentation should be updated when:

1. Related code or architecture changes significantly
2. New features are added
3. Processes or methodologies change
4. Inaccuracies or gaps are identified
5. Regular review cycles indicate the need for updates

### Archiving

- Obsolete documentation should not be deleted, but rather archived
- Archiving should move the document to an `archived` folder and update the documentation map
- Archived documents should include a notice at the top indicating they are archived and linking to any replacement

## Documentation System: Required Documents

The basic documentation structure should include:

1. **Documentation Map**: Central navigation document, kept at `navigation/documentation-map.md`
2. **Documentation Standards**: This document, with guidelines on document formats
3. **Changelog**: Document history tracker at `CHANGELOG.md`

## Document History

Each document should track its major updates at the bottom:

```markdown
---

**Last Updated**: 2025-03-01

## Document History

| Date       | Changes                    | Author     |
| ---------- | -------------------------- | ---------- |
| 2025-03-01 | Added section on templates | J. Smith   |
| 2025-02-15 | Initial creation           | A. Johnson |
```

For more detailed change tracking across all documents, see the [Changelog](../CHANGELOG.md).
