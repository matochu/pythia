# Command: Generate PR Description

> **IMPORTANT**: This command provides a structured approach to creating clear, informative PR descriptions that help reviewers understand the purpose and scope of changes.

## Purpose

This command provides step-by-step instructions for creating comprehensive PR descriptions. A well-structured PR description improves the review process, documents changes effectively, and helps maintain a clear history of project development.

## Prerequisites

Before creating a PR description, ensure you have:

1. Completed all changes and committed them to your branch
2. Verified that tests pass locally
3. Reviewed the diff between your branch and the target branch
4. Obtained the current date for reference
5. Identified the key components affected by your changes
6. Listed the main features or bug fixes implemented

## Command Checklist

- [ ] Review the diff between your branch and the target branch
- [ ] Identify key components and features modified
- [ ] Categorize changes into logical sections
- [ ] Create a clear, concise title for the PR
- [ ] Write a summary section explaining the purpose of the PR
- [ ] Detail implementation approach in a separate section
- [ ] List changes by category (features, fixes, enhancements)
- [ ] Document any breaking changes or deprecations
- [ ] Add testing information
- [ ] Include relevant screenshots or videos if UI changes are present
- [ ] Add links to related issues or documentation
- [ ] Proofread the description for clarity and completeness
- [ ] Ensure proper Markdown formatting for readability

## Step 1: Review Changes and Categorize

Before writing the PR description, thoroughly review your changes:

```bash
# Get the current date for reference
date +%Y-%m-%d

# Review the diff between your branch and the target branch
git diff main...your-branch --stat
```

Categorize your changes into logical sections based on:

- Features added
- Bugs fixed
- Performance improvements
- Refactoring
- Documentation updates
- Configuration changes
- Dependency updates

## Step 2: Create the PR Description Structure

Structure your PR description with clearly defined sections using Markdown:

```markdown
# Title of the PR

## Summary

Brief overview of what this PR addresses and why.

## Changes

Detailed list of changes, categorized by type.

### Feature Category 1

- Feature detail 1
- Feature detail 2

### Bug Fixes

- Bug fix detail 1
- Bug fix detail 2

## Implementation

Technical details about how the changes were implemented.

## Testing

Information about how the changes were tested.

## Screenshots/Videos

Visual evidence of changes (if applicable).

## Related Issues

Links to related tickets, issues, or documentation.
```

## Step 3: Write the Summary Section

The summary should concisely explain:

- What problem this PR solves
- Why the change is necessary
- The overall approach taken
- Expected outcomes or benefits

Keep this section brief (2-5 sentences) but informative.

## Step 4: Detail the Changes Section

Break down your changes into logical categories, using bullet points for clarity:

```markdown
## Changes

### Features

- Added new component for displaying user profiles
- Implemented caching mechanism for API responses

### Bug Fixes

- Fixed incorrect date formatting in reports
- Resolved memory leak in the video player component

### Performance

- Optimized image loading process, reducing initial load time by 40%
- Implemented lazy loading for off-screen components

### Dependencies

- Added `package-name` (v1.2.3) for feature implementation
- Updated `existing-package` from v2.1.0 to v3.0.0
```

For each major change, include:

- What was changed
- How it works now
- Benefits of the change

## Step 5: Explain the Implementation Approach

In the Implementation section, provide technical details about:

- Architectural decisions
- Design patterns used
- Algorithms implemented
- Dependencies added or modified
- Configuration changes

Include code snippets for complex changes when helpful:

````markdown
## Implementation

The signal library provides a React-friendly API with familiar patterns:

```typescript
// Example implementation of a hook
const useCustomHook = (initialValue) => {
  // Implementation details
  return [value, setValue];
};
```
````

Key implementation decisions:

- Used pattern X because of Y
- Implemented caching strategy Z

## Step 6: Document Testing Information

In the Testing section, describe:

- How the changes were tested
- Types of tests added or modified
- Edge cases considered
- Performance impacts
- Browser/device compatibility information
- Test coverage metrics

## Step 7: Add Visual Evidence

For UI changes, include:

- Screenshots showing before/after states
- GIFs or videos demonstrating functionality
- Mobile and desktop views when relevant

## Step 8: Link Related Resources

Include links to:

- Related issues or tickets
- Design documents
- API documentation
- Relevant discussions

## Output Format

Always provide the final PR description in two formats:

1. As properly formatted Markdown directly in the output
2. As a code block enclosed in triple backticks for easy copying:

````
```markdown
# Title of the PR

## Summary
...

## Changes
...
```
````

This ensures that the description can be easily copied and pasted into GitHub, GitLab, or other repository management systems without losing formatting.

## Examples

### Basic Feature PR Description

````
```markdown
# Add Favorite Apps Management

## Summary

This PR adds functionality for users to mark and manage their favorite applications. Users can now add, remove, and reorder favorites through the UI, with changes persisting across sessions.

## Changes

### Features

- Added Redux slice for managing favorite apps state
- Implemented UI components for adding/removing favorites
- Created custom hook `useReduxEnhancedFavouriteApps` for optimized favorites handling
- Added persistent storage of favorites

### Performance

- Implemented React Suspense for async loading of favorites list
- Added caching for favorite apps data

## Implementation

The implementation uses Redux for state management with a custom middleware for persistence. React Suspense handles loading states, and a custom hook encapsulates the favorite management logic.

## Testing

- Added unit tests for Redux actions and reducers
- Added integration tests for the favorites UI components
- Verified persistence across browser sessions
- Tested performance with large numbers of favorite apps

## Screenshots

![Favorites UI](link-to-screenshot.png)

## Related Issues

- Resolves #123: User-requested feature for favorites management
- Related to #456: Performance improvements for app listings
```
````

### Bug Fix PR Description

````
```markdown
# Fix Player Memory Leak on Navigation

## Summary

This PR resolves a critical memory leak in the video player that occurred when navigating away during playback. The fix ensures proper cleanup of player resources when the component unmounts.

## Changes

### Bug Fixes

- Added cleanup handler for player resources
- Implemented immediate player destruction on navigation
- Added event listener removal for custom keyboard events

### Performance

- Improved resource management during navigation
- Reduced memory consumption after player use

## Implementation

Added explicit destruction of player instances when the component unmounts or when the HOME key is pressed. Also implemented tracking of destruction progress to prevent multiple cleanup attempts.

## Testing

- Verified memory usage before and after fix using Chrome DevTools
- Added automated tests for component cleanup
- Tested on multiple devices to ensure consistent behavior

## Related Issues

- Fixes #789: Memory leak when navigating from video player
```
````

### Library Implementation PR Description

````
```markdown
# Signal Library Implementation

## Summary

This PR adds a complete Signal library implementation that introduces reactive state management to the Thea project. Signals provide fine-grained reactivity and performance improvements, particularly beneficial for TV-oriented interfaces where rendering efficiency is critical.

## Changes

### Features Added

- Implemented a complete set of signal hooks for React applications:

  - `useSignal` - Creates reactive state with automatic dependency tracking
  - `useSignalEffect` - Creates effects that run when dependencies change
  - `useSignalSelector` - Selects parts of signal state for optimized rendering
  - `useComputedSignal` - Creates derived values that update automatically

- Added comprehensive documentation with usage examples
- Included demo components for signals usage

### Dependencies

- Added `@preact/signals-react` (v3.0.1) dependency for core signal functionality
- Integrated Preact signals with custom React hooks implementation

### Configuration

- Updated testing configuration in `.cursorignore` to include test files
- Added `/docs/` to `.gitignore`
- Updated Cypress baseUrl from `https://localhost:3001` to `http://localhost:3001`
- Updated APP_VERSION from `0.2.1083` to `0.2.1086`
- Added test commands in package.json:
  ```json
  "test": "vitest --watch=false",
  "test:dev": "vitest --watch",
  ```

### Documentation

- Added comprehensive README for the signal library including:
  - Quick reference for available hooks
  - Explanation of signal concepts
  - Code examples for each hook
  - Usage recommendations
  - Future improvement plans

## Implementation Details

The signal library provides a React-friendly API with familiar patterns while leveraging the performance benefits of signals:

### Core Signal Components

- Wrapped Preact signals in custom hooks that follow React conventions
- Implemented proxy-based access for cleaner developer experience
- Created proper TypeScript types for all signal implementations
- Added automatic tracking and subscription management for signals

### Signal Hooks

1. **useSignal**: Creates a reactive state variable

   ```typescript
   const [value, setValue] = useSignal(initialValue);
   ```

2. **useSignalEffect**: Runs effects when dependencies change

   ```typescript
   useSignalEffect(effectFn, dependencies);
   ```

3. **useSignalSelector**: Optimizes component updates

   ```typescript
   const [selectedValue, setSelectedValue] = useSignalSelector(
     source,
     selector
   );
   ```

4. **useComputedSignal**: Creates derived values
   ```typescript
   const [computedValue] = useComputedSignal(computeFn, dependencies);
   ```

## Testing

- Added comprehensive tests for all signal hooks
- Created examples that demonstrate correct signal behavior
- Verified compatibility with existing React patterns
- Test coverage is now at 95% for the signal library

## Related Issues

- Implements feature request #234: Reactive state management
- Related to performance improvement issue #345
```
````

## Common Issues and Solutions

1. **Too Brief or Vague Descriptions**:

   - Issue: PR description lacks sufficient detail for reviewers
   - Solution: Use the structured format above and ensure each section has adequate detail

2. **Missing Context**:

   - Issue: Description assumes reviewer knows why changes were made
   - Solution: Always include context in the Summary section

3. **Unorganized Change List**:

   - Issue: Changes listed as a flat list making it hard to understand scope
   - Solution: Categorize changes into Features, Bug Fixes, Performance, etc.

4. **No Testing Information**:

   - Issue: No mention of how changes were tested
   - Solution: Always include testing methods, test coverage, and test results

5. **Missing Visual Evidence**:

   - Issue: UI changes described only in text
   - Solution: Include screenshots or videos for all UI changes

6. **No Links to Related Issues**:

   - Issue: PR doesn't reference related tickets or issues
   - Solution: Always include links to related issues, tickets, or documentation

7. **Poor Markdown Formatting**:

   - Issue: Description is hard to read due to lack of proper formatting
   - Solution: Use headers, bullet points, code blocks, and other Markdown elements for readability

8. **Missing Code Examples**:

   - Issue: Complex implementations described without examples
   - Solution: Include relevant code snippets to illustrate key changes

9. **Results Not Copyable**:

   - Issue: PR description is rendered and not easily copyable as formatted text
   - Solution: Always provide the completed PR description enclosed in triple backticks as a markdown code block for easy copying

## Related Documents

- [Documentation Guidelines](../methodology/documentation-guidelines.md)
- [Git Workflow](../methodology/git-workflow.md)
- [Code Review Standards](../development/code-review-standards.md)

---

**Last Updated**: 2024-06-20

```

```
