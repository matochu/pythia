# Command: Update Documentation Map

This command provides instructions for Large Language Models (LLMs) to effectively manage and update the Documentation Map, ensuring it remains current and organized.

## Description

The Documentation Map (`.pythia/navigation/documentation-map.md`) serves as the central navigation document for the project. It needs regular updates to include new documents, remove obsolete ones, and maintain an accurate representation of the project's documentation structure.

This command outlines the steps to scan the documentation repository, identify missing documents, and update the Documentation Map accordingly.

## Workspace Usage

This command can be used in any project workspace:

```bash
# Reference the command
@update-documentation-map.md

# Execute with project context
Execute this command for my project at [project-path]

# Example usage
@update-documentation-map.md
Context: My project documentation needs map updates
Focus: Add new documents, update links, maintain navigation
Requirements: Keep documentation map current and organized
```

## Prerequisites

- Access to the Documentation Map file: `.pythia/navigation/documentation-map.md`
- Knowledge of document categories and their organization in the map
- Understanding of the relative paths between documents

## Command Checklist

Before proceeding with the documentation map update, complete this checklist:

- [ ] Review current Documentation Map structure
- [ ] Identify missing documents
- [ ] Check for documents that need to be moved
- [ ] Verify document categorization
- [ ] Update Recently Added Documents section
- [ ] Check all document relationships
- [ ] Verify all links are correct
- [ ] Update Last Modified date
- [ ] Run documentation validation
- [ ] Fix any validation issues
- [ ] Verify all sections are properly organized

## Command Steps

### 1. Review the Current Documentation Map

First, review the current state of the Documentation Map to understand its structure and existing content:

```bash
cat .pythia/navigation/documentation-map.md
```

Take note of:

- The categories used to organize documents
- The format of document entries in each category
- The structure of tables and sections
- The "Recently Added Documents" section
- The last updated date

### 2. Check for Missing Documents

Identify documents that exist in the repository but are not included in the Documentation Map:

```bash
# For projects with Pythia tools installed
ts-node scripts/documentation/updateDocumentationMap.ts

# For workspace integration (manual approach)
find docs -name "*.md" -type f | sort
```

This script will:

- Find all Markdown documents in the `..` directory
- Compare them with documents referenced in the Documentation Map
- List missing documents grouped by category
- Identify recently modified documents (last 30 days)
- Suggest formatting for additions to each section

### 3. Update the Map for New Documents

For each missing document:

1. Determine the appropriate category based on its path and content
2. Add an entry in the correct section following the established format:
   - For Tasks: `| [Task Title](path/to/task.md) | Brief description of the task |`
   - For Architecture Analysis: `| [Analysis Title](path/to/analysis.md) | Description | Key Sections |`
   - For LLM Rules: `| [Rule Title](path/to/rule.md) | Description of the rule |`
   - Etc. (follow the existing format for each category)

### 4. Move Documents Between Sections if Needed

If a document's status or nature has changed:

1. Remove its entry from the current section
2. Add a new entry in the appropriate section
3. Update any references to reflect its new location

Example: Moving a task from "Tasks" to "Archived Tasks" section after archiving.

### 5. Update the Recently Added Documents Section

For documents created or significantly modified in the last 30 days:

1. Add or update entries in the "Recently Added Documents" section
2. Group them by their directory structure
3. Sort them by modification date (newest first)
4. Use the format: `- [Document Title](path/to/document.md)`

### 6. Update Document Relationships

Ensure document relationships are properly reflected:

1. Check cross-references between related documents
2. Verify that links in the "References" section are up-to-date
3. Add missing references to new documents

### 7. Update the Last Modified Date

Update the "Last Updated" date at the bottom of the Documentation Map:

```markdown
**Last Updated**: YYYY-MM-DD
```

Replace `YYYY-MM-DD` with the current date.

## Example Implementation

Here's an example of adding a new task document to the Documentation Map:

```markdown
### Tasks

| Document | Description | Status |
| -------- | ----------- | ------ |

// Existing task entries...
```

## Automation Script

The `updateDocumentationMap.ts` script automates much of this process:

```typescript
// Find all documentation files
async function findAllDocuments(): Promise<string[]> {
  const { stdout } = await execAsync(`find ${DOCS_ROOT} -name "*.md" -type f`);
  return stdout.split('\n').filter(Boolean);
}

// Categorize documents based on their path and content
async function categorizeDocument(filePath: string): Promise<string> {
  if (filePath.includes('/workflows/tasks/')) return 'Tasks';
  if (filePath.includes('/archive/tasks/')) return 'Archived Tasks';
  if (filePath.includes('/architecture/analysis-'))
    return 'Architecture Analysis';
  // Additional categorizations...
  return 'Other';
}

// Identify documents already in the map
async function getDocumentsInMap(): Promise<Set<string>> {
  const content = fs.readFileSync(MAP_PATH, 'utf8');
  const links = content.match(/\[.*?\]\((.*?\.md)\)/g) || [];
  // Process links to get standardized paths...
  return new Set(processedLinks);
}

// Main function to check for missing documents
async function checkDocumentationMap(): Promise<void> {
  const entries = await buildDocumentEntries();
  const documentsInMap = await getDocumentsInMap();

  // Find documents not in the map
  const missingDocuments = entries.filter(
    (entry) => !documentsInMap.has(entry.path)
  );

  // Group by category and generate suggestions
  // ...
}
```

## Interactive Update

For interactive updates, run:

```bash
ts-node scripts/documentation/updateDocumentationMap.ts --interactive
```

This will:

1. Scan for missing documents
2. Prompt for each missing document whether to add it to the map
3. For added documents, prompt for additional metadata (description, status, etc.)
4. Generate the updated Documentation Map content

Note: Interactive mode is currently under development and may have limited functionality.

## References

- [Guide Llm Documentation Workflow](mdc:guides/guide-llm-documentation-workflow.md)
- [CHANGELOG](mdc:CHANGELOG.md)
- [Documentation Map](mdc:navigation/documentation-map.md)
- [Documentation Standards](mdc:navigation/documentation-standards.md)
- [Archive Tasks](mdc:commands/archive-tasks.md)

## Workspace Integration Notes

This command is designed for workspace integration and adapts to your project's structure:

- **Documentation Map**: Works with any project's documentation structure
- **Navigation Updates**: Maintains central navigation for your project
- **Cross-References**: Uses `mdc:` links for workspace navigation
- **Command Usage**: Reference with `@update-documentation-map.md` in your workspace

---

**Last Updated**: 2025-03-11
