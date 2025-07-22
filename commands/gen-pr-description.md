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

```markdown
# Title of the PR

## Summary

Brief overview of what this PR addresses and why.

## Changes

### Features

- Feature detail 1
- Feature detail 2

### Bug Fixes

- Bug fix detail 1
- Bug fix detail 2

### Dependencies

- Added/updated dependency details

## Implementation

Technical details about implementation approach.

## Testing

Information about how changes were tested.

## Screenshots/Videos

Visual evidence of changes (if applicable).

## Related Issues

Links to related tickets or issues.
```

## Writing Guidelines

### General Principles

- The PR Title and Summary must always clearly and unambiguously state the primary purpose and intent of the PR, regardless of the type of change (feature, fix, refactor, workflow, documentation, etc.).
- Avoid generic or vague titles/summaries. The main change or goal should be immediately clear to reviewers.
- In the Features/Changes section, describe the main change in detail, including its purpose, how it works, and its impact.
- If the PR contains multiple unrelated changes, group them by logical category and ensure each group’s purpose is clear.

### Summary Section

- Explain what problem this PR solves
- Why the change is necessary
- Overall approach taken
- Expected outcomes or benefits
- Keep brief (2-5 sentences)

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

## Output Format

Always provide the PR description:

1. In English, regardless of request language
2. As a properly formatted Markdown code block:

````
```markdown
# Title of the PR

## Summary
...

## Changes
...
```
````

## Examples

> These are examples only. Always tailor the Title and Summary to the actual main purpose of your PR.

### Basic Feature PR Description

```markdown
# Add Favorite Apps Management

## Summary

This PR adds functionality for users to mark and manage favorite applications with persistence across sessions.

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
2. **Missing Context**: Always include context in the Summary section.
3. **Unorganized Changes**: Categorize changes into Features, Bug Fixes, Performance, etc.
4. **No Testing Information**: Always describe testing methods and results.
5. **Missing Visual Evidence**: Include screenshots or videos for UI changes.
6. **Non-English Description**: Always write in English for consistency.
7. **Raw Format Missing**: Provide the description in a markdown code block for easy copying.

## Related Documents

- [Documentation Guidelines](../methodology/documentation-guidelines.md)
- [Git Workflow](../methodology/git-workflow.md)
- [Code Review Standards](../development/code-review-standards.md)

---

**Last Updated**: 2024-07-20

```

```
