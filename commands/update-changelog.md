# Command: Update Changelog

This guide provides step-by-step instructions for Large Language Models (LLMs) to update the project's Changelog in the project.

> **IMPORTANT: ALWAYS CHECK THE DATE FIRST!**  
> Before making any changes, get the current date using the command:
>
> ```bash
> date '+%Y-%m-%d'
> ```
>
> Make sure both the changelog entry date and the "Last Updated" date at the bottom reflect this current date.

## Purpose

This command provides a structured approach to updating project changelogs with recent changes, ensuring proper documentation of project evolution and maintaining clear change history.

## Prerequisites

Before updating the Changelog, ensure you have:

1. Knowledge of recent significant changes to the documentation or codebase
2. The current date for proper changelog timestamping
3. Reviewed the existing Changelog (`CHANGELOG.md`)
4. Understood the categorization of changes (Added, Changed, Removed, Fixed)

## Workspace Usage

This command can be used in any project workspace:

```bash
# Reference the command
@update-changelog.md

# Execute with project context
Execute this command for my project at [project-path]

# Example usage
@update-changelog.md
Context: My project has recent documentation updates
Objective: Update changelog with recent changes
Changes: Added new task documentation, updated architecture analysis
```

## Command Checklist

Before proceeding with the changelog update, complete this checklist:

- [ ] Get current date using `date +%Y-%m-%d`
- [ ] Review recent changes in documentation and code
- [ ] Categorize changes (Added/Changed/Removed/Fixed)
- [ ] Check if a new date entry is needed
- [ ] Group related changes together
- [ ] Format entries consistently
- [ ] Update quarterly summary if needed
- [ ] Verify all file paths and links
- [ ] Update Last Updated date
- [ ] Run documentation validation
- [ ] Fix any validation issues
- [ ] Verify all entries are properly formatted

## Step 1: Review the Existing Changelog

First, review the current state of the Changelog:

1. Open `CHANGELOG.md`
2. Understand the current organization and format of entries
3. Note the most recent date entry and its contents
4. Familiarize yourself with how changes are categorized and described

## Step 2: Determine If a New Date Entry Is Needed

Decide whether to:

1. Add to an existing date entry (if changes occurred on the same day as the most recent entry)
2. Create a new date entry (if changes occurred on a different day)

## Step 3: Create or Update Date Entry

### If creating a new date entry:

Add a new section at the top of the changelog (below the introduction and above the most recent entry):

```markdown
## [YYYY-MM-DD]

### Added

- (list of added items)

### Changed

- (list of changed items)

### Removed

- (list of removed items)

### Fixed

- (list of fixed items)
```

### If updating an existing date entry:

Find the most recent date entry and add to the appropriate category sections.

## Step 4: Categorize and Document Changes

For each change, add an entry to the appropriate category:

1. **Added**: New documents, features, or significant content additions

   ```markdown
   - Added new task documentation for [topic] (`docs/workflows/tasks/task-yyyy-mm-topic.md`)
   ```

2. **Changed**: Updates to existing documents or content

   ```markdown
   - Updated architecture diagram in `docs/architecture/analysis-general-architecture.md`
   ```

3. **Removed**: Documents or content that have been removed

   ```markdown
   - Removed obsolete performance analysis from `../architecture/analysis-performance.md`
   ```

4. **Fixed**: Corrections to errors in existing documents
   ```markdown
   - Fixed incorrect links in `../navigation/documentation-map.md`
   ```

## Step 5: Formatting Guidelines

When adding entries, follow these formatting rules:

1. Start each entry with a capitalized verb in past tense (Added, Updated, Fixed, etc.)
2. Be concise but descriptive, explaining what changed and where
3. Include file paths in backticks: `` `/path/to/file.md` ``
4. Group related changes together in a single bullet point
5. For multiple similar changes, consolidate into a single entry with examples
6. Omit very minor changes (typo corrections, formatting fixes)
7. Avoid excessive details - focus on the main changes and their impact, not implementation specifics
8. Combine duplicate sections - if you have multiple "Added" or "Changed" sections for the same date, merge them together
9. Use high-level summaries for related changes rather than listing every detail

## Step 6: Consider Quarterly Summaries

If the current date is near the end of a quarter, consider creating or updating a quarterly summary section:

```markdown
## Quarterly Summary - Q1 2025

### Major Accomplishments

- Established standardized documentation structure
- Created task and technical debt templates
- Implemented documentation navigation system
```

## Step 7: Update References Section

If needed, update the References section at the bottom of the Changelog to include links to any new significant documents mentioned in the changelog entries.

## Step 8: Update Last Updated Date

At the bottom of the document, update the "Last Updated" date to the current date:

```markdown
**Last Updated**: YYYY-MM-DD
```

This date should be identical to the date you obtained at the very beginning of this process.

## Step 9: Verification Checklist

Before finalizing the changelog update, verify:

- [ ] Changes are categorized correctly
- [ ] Entries are formatted consistently
- [ ] File paths and links are accurate
- [ ] Entry descriptions are clear and concise
- [ ] Related changes are grouped appropriately
- [ ] A new date entry was created if needed
- [ ] Quarterly summary is updated if appropriate
- [ ] Last updated date at the bottom is current
- [ ] Duplicate sections are combined
- [ ] There are no excessive implementation details

## Step 10: Run Documentation Validation

Run the documentation validation tools to ensure the changelog update is properly integrated:

```bash
npm run docs:validate-links
npm run docs:check-coverage
```

Fix any issues reported by these tools.

## Step 11: Use the CLI Command (Optional)

To update the changelog using the command line interface:

```bash
npm run docs:update-changelog
```

This will guide you through the process of adding new entries to the changelog.

## Example Changelog Entry

Here's an example of a well-formed changelog entry:

```markdown
## [2025-03-15]

### Added

- Created command documentation for updating the changelog (`./update-changelog.md`)
- Added WebGL performance metrics section to TV performance analysis (`../architecture/analysis-tv-performance.md`)

### Changed

- Updated documentation map with new command documents (`../navigation/documentation-map.md`)
- Improved API integration documentation with more detailed examples (`../architecture/analysis-api-integration.md`)

### Fixed

- Fixed broken links in WebGL component system analysis (`../architecture/analysis-webgl-component-system.md`)
- Corrected outdated information in state management analysis (`../architecture/analysis-state-management.md`)
```

## Related Documents

- [Documentation Map](../navigation/documentation-map.md)
- [Changelog](../CHANGELOG.md)
- [Documentation Guidelines](../methodology/documentation-guidelines.md)
- [Documentation Standards](../navigation/documentation-standards.md)

---

**Last Updated**: 2025-03-12

## References

- [Guide Llm Documentation Workflow](../guides/guide-llm-documentation-workflow.md)
