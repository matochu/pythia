# Command: Generate PR Description

> **IMPORTANT**: This command provides a structured approach to creating clear, informative PR descriptions.

## Purpose

A well-structured PR description improves the review process, documents changes effectively, and maintains a clear history of project development.

## Prerequisites

Before creating a PR description:

1. Complete all changes and commit them
2. Verify that tests pass locally
3. Review the diff between your branch and the target branch
4. Identify affected components and implemented features/fixes

## Workspace Usage

This command can be used in any project workspace:

```bash
# Reference the command
@gen-pr-description.md

# Execute with project context
Execute this command for my project at [project-path]

# Example usage
@gen-pr-description.md
Context: My React application needs a new user authentication feature
Objective: Generate PR description for authentication implementation
Changes: Added login/logout functionality, user state management
Testing: Unit tests for auth components, integration tests for API calls
```

## Command Checklist

- [ ] The PR Title and Summary clearly state the main purpose and intent of the PR.
- [ ] Review the diff between your branch and target branch
- [ ] Identify key components and features modified
- [ ] Categorize changes into logical sections
- [ ] Create a clear, concise title for the PR
- [ ] Write a summary explaining the purpose
- [ ] Detail implementation approach
- [ ] List changes by category (features, fixes, enhancements, dependencies)
- [ ] Document any breaking changes
- [ ] Add testing information
- [ ] Proofread for clarity and completeness
- [ ] Use proper Markdown formatting
- [ ] Write in English, regardless of request language
- [ ] Provide final description as raw Markdown in a code block

## PR Description Structure

> **Note**: This is a modular template. Include only sections relevant to your PR type. See [PR Type Templates](#pr-type-templates) for specific examples.

### Full Template (Standard Feature/Bug Fix)

```markdown
# Title of the PR

## Summary

Brief overview of what this PR addresses and why.

## Motivation

### Problem Statement
Clear formulation of the problem being solved.

### Current Behavior
How it works now (if applicable).

### Expected Behavior
How it should work after changes.

### Alternatives Considered (Optional)
Other approaches that were evaluated and why they were not chosen.

## Changes

### Features

- Feature detail 1
- Feature detail 2

### Bug Fixes

- Bug fix detail 1
- Bug fix detail 2

### Dependencies

- Added/updated dependency details

### Breaking Changes ⚠️ (If applicable)

**BREAKING**:
- What changed in API/behavior
- Migration guide for users
- Deprecated features and alternatives

## Implementation

Technical details about implementation approach, architectural decisions, and design patterns used.

## Testing

Information about how changes were tested, including test types, edge cases, and performance impact.

## Review Focus

Key areas that require special attention during review:
- [ ] Specific module or logic
- [ ] Performance implications
- [ ] Security considerations

## Screenshots/Videos

Visual evidence of changes (if applicable).

## Related Issues

Links to related tickets or issues.
```

### Quick Mode Template (Simple Changes)

For typo fixes, minor refactors, or trivial bug fixes:

```markdown
# Title of the PR

## Summary
Brief description of what changed and why (1-2 sentences).

## Changes
- Change detail 1
- Change detail 2

## Testing
How it was verified.
```

## PR Type Templates

Different PR types require different levels of detail and focus areas.

### Refactoring PR

```markdown
# Refactor: [Component/Module Name]

## Summary
Brief description of refactoring goals and scope.

## Motivation

### Code Quality Issues
- Technical debt being addressed
- Maintainability concerns

### Benefits
- Improved readability
- Better performance
- Easier testing

## Changes

### Code Structure
- Reorganized components/modules
- Extracted reusable utilities
- Simplified complex logic

### Breaking Changes ⚠️ (If applicable)
- Internal API changes (if any)

## Implementation
Technical approach to refactoring, patterns used.

## Testing
- [ ] All existing tests pass
- [ ] No behavior changes verified
- [ ] Performance benchmarks (if applicable)

## Review Focus
- [ ] Logic equivalence maintained
- [ ] No unintended side effects
```

### CI/CD Changes

```markdown
# CI/CD: [Pipeline/Workflow Description]

## Summary
What changes were made to CI/CD pipeline and why.

## Motivation
Problem with current pipeline or new requirement.

## Changes

### Pipeline Configuration
- Modified workflows
- New steps added
- Dependencies updated

### Performance
- Build time impact: +/- Xs
- Resource usage changes

## Testing
- [ ] Pipeline tested on feature branch
- [ ] All stages pass successfully
- [ ] Rollback plan verified

## Review Focus
- [ ] Security implications
- [ ] Secrets and credentials handling
- [ ] Resource limits and costs
```

### Documentation Only

```markdown
# Docs: [Documentation Area]

## Summary
What documentation was added/updated and why.

## Motivation
Gap in current documentation or need for clarification.

## Changes

### Documentation Updates
- New guides added
- Existing docs updated
- Examples added/improved

## Review Focus
- [ ] Technical accuracy
- [ ] Clarity and readability
- [ ] Code examples work correctly
```

## Writing Guidelines

### General Principles

- The PR Title and Summary must always clearly and unambiguously state the primary purpose and intent of the PR, regardless of the type of change (feature, fix, refactor, workflow, documentation, etc.).
- Avoid generic or vague titles/summaries. The main change or goal should be immediately clear to reviewers.
- In the Features/Changes section, describe the main change in detail, including its purpose, how it works, and its impact.
- If the PR contains multiple unrelated changes, group them by logical category and ensure each group's purpose is clear.

### Summary Section

- Explain what problem this PR solves
- Overall approach taken
- Expected outcomes or benefits
- Keep brief (2-5 sentences)
- Avoid repeating details that will be covered in Motivation section

### Motivation Section

**Default**: Keep it brief - explain why this change is necessary in 2-3 sentences. Skip if the change is self-explanatory.

**When user requests detailed context OR when there's important context to share**, structure with subsections:

- **Problem Statement**: Clear formulation of the problem
- **Current Behavior**: How it works now (if fixing/changing existing behavior)
- **Expected Behavior**: How it should work after changes
- **Alternatives Considered**: Other approaches evaluated and why they were rejected (only when relevant)

Only include subsections when:
- User explicitly asks for detailed motivation
- There's complex business/technical context that reviewers need
- Architectural decisions need explanation
- Multiple approaches were considered

### Changes Section

For each change, include:

- What was changed
- How it works now
- Benefits of the change

### Implementation Section

Include:

- Architectural decisions
- Design patterns used
- Dependencies added or modified
- Configuration changes
- Code snippets for complex changes when helpful

### Testing Section

Describe:

- How changes were tested
- Test types added or modified
- Edge cases considered
- Performance impacts
- Browser/device compatibility

## AI-Friendly Instructions

When generating PR descriptions, AI assistants should:

1. **Analyze Context First**
   - Review git diff to understand actual code changes
   - Check commit messages for development context
   - Identify related issues or tickets mentioned

2. **Identify Primary Purpose**
   - Determine the MAIN goal of the PR (don't just list everything)
   - Distinguish between primary changes and side effects
   - Group related changes logically

3. **Choose Appropriate Template**
   - Use Quick Mode for trivial changes (typos, minor fixes)
   - Use Full Template for features and significant bug fixes
   - Use specialized templates for refactoring, CI/CD, or docs-only changes

4. **Highlight Breaking Changes**
   - Identify any breaking changes prominently at the top
   - Provide migration guidance when applicable
   - Mark deprecated features clearly

5. **Focus on WHY, Not Just WHAT**
   - Explain the reasoning behind decisions
   - Provide context for reviewers
   - Document alternatives that were considered

6. **Generate Review Focus**
   - Identify complex or risky areas
   - Highlight security implications
   - Point out performance-critical changes

## Output Format

Always provide the PR description for **GitHub**:

1. **In English**, regardless of request language
2. **As a properly formatted Markdown code block** for easy copying:

````
```markdown
# Title of the PR

## Summary
...

## Changes
...
```
````

3. **Include PR metadata** (after the markdown block):
   - Suggested PR title (50 chars max)
   - Suggested labels: `feature`, `bugfix`, `breaking-change`, `documentation`, etc.
   - Reviewers recommendations (if applicable)

## Examples

> These are examples only. Always tailor the Title and Summary to the actual main purpose of your PR.

### Basic Feature PR Description

```markdown
# Add Favorite Apps Management

## Summary

This PR adds functionality for users to mark and manage favorite applications with persistence across sessions.

## Motivation

Users frequently access the same applications but currently have to navigate through the full app list each time. This creates friction in the user experience and reduces efficiency. A favorites system will improve user satisfaction and reduce navigation time, especially for power users who regularly use specific applications.

## Changes

### Features

- Added Redux slice for managing favorite apps state
- Implemented UI components for adding/removing favorites
- Created custom hook for favorites handling
- Added persistent storage of favorites

### Performance

- Implemented React Suspense for async loading
- Added caching for favorite apps data

## Implementation

Uses Redux for state management with custom middleware for persistence. React Suspense handles loading states.

## Testing

- Added unit tests for Redux actions and reducers
- Added integration tests for UI components
- Verified persistence across sessions
- Tested with large numbers of favorites

## Screenshots

![Favorites UI](link-to-screenshot.png)

## Related Issues

- Resolves #123: Favorites management feature
- Related to #456: Performance improvements
```

### Bug Fix PR Description

```markdown
# Fix Player Memory Leak on Navigation

## Summary

This PR resolves a memory leak in the video player during navigation by ensuring proper cleanup of resources.

## Motivation

The video player was retaining memory references when users navigated between different content, causing memory usage to grow continuously during a session. This leads to performance degradation and potential crashes on memory-constrained devices. The issue was particularly problematic for users who frequently switch between videos or browse content for extended periods.

## Changes

### Bug Fixes

- Added cleanup handler for player resources
- Implemented immediate player destruction on navigation
- Added event listener cleanup

### Performance

- Improved resource management
- Reduced memory consumption

## Implementation

Added explicit destruction of player instances on unmount or navigation, with tracking to prevent multiple cleanup attempts.

## Testing

- Verified memory usage before/after with DevTools
- Added automated tests for component cleanup
- Tested on multiple devices

## Related Issues

- Fixes #789: Memory leak during navigation
```

## Common Issues and Solutions

1. **Too Brief Descriptions**: Use the structured format with adequate detail in each section.
2. **Missing Context**: Always include context in the Summary section and detailed motivation.
3. **Unorganized Changes**: Categorize changes into Features, Bug Fixes, Performance, etc.
4. **No Testing Information**: Always describe testing methods and results.
5. **Missing Visual Evidence**: Include screenshots or videos for UI changes.
6. **Non-English Description**: Always write in English for consistency.
7. **Raw Format Missing**: Provide the description in a markdown code block for easy copying.
8. **Repetitive Content**: Avoid repeating the same information between Summary and Motivation sections.

## Related Documents

- [Documentation Guidelines](../methodology/documentation-guidelines.md)
- [Git Workflow](../methodology/git-workflow.md)
- [Code Review Standards](../development/code-review-standards.md)

---

**Last Updated**: 2025-09-30

```

```
