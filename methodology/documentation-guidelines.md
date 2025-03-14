# Documentation Guidelines for `/docs` Directory

> **Note**: All documentation should be maintained in English only.

## General Principles

1. **Document Interconnections**:

   - Each document should be connected to other relevant documents through cross-references
   - When creating a new document, always add a reference to it in `docs/navigation/documentation-map.md`
   - Related documents should contain mutual references (e.g., analysis → proposal and proposal → analysis)

2. **Document Structure**:

   - Each document should begin with a "Summary" section describing the main content
   - The Summary should be followed by a "Current State" section to provide context
   - Table of contents is mandatory for documents longer than 3 sections

3. **Change Context**:
   - When updating an existing document, maintain its general structure and format
   - New proposals should be based on existing analytical documents
   - When creating a new proposal, first identify all related analytical documents

## Folders and Their Purpose

- `/docs/architecture/` - Analytical documents about the current state of architecture
- `/docs/methodology/` - Development methodologies and processes
- `/docs/guides/` - Practical guides and instructions
- `/docs/navigation/` - Documents for navigating the documentation
- `/docs/commands/` - Instructions for automation tools
- `/docs/templates/` - Templates for creating new documents
- `/docs/rules/` - Guidelines and standards for development and LLMs
- `/docs/workflows/` - Work items and documentation workflows
  - `/docs/workflows/tasks/` - Task documentation and context
  - `/docs/workflows/proposals/` - Proposals for changes and improvements
  - `/docs/workflows/decisions/` - Architecture Decision Records (ADRs)
  - `/docs/workflows/ideas/` - Ideas and early concepts
  - `/docs/workflows/explorations/` - Explorations of ideas
  - `/docs/workflows/archive/` - Archived documents

## File Naming

- Use kebab-case for all documents (e.g., `file-name.md`)
- Names should clearly indicate the content of the document
- Use prefixes to indicate document type:
  - Architecture documents: `analysis-{topic}.md`
  - Decision records: `decision-YYYY-MM-{topic}.md`
  - Guides: `guide-{topic}.md`
  - Process documents: `{process-name}.md`
  - Proposals: `proposal-{topic}.md`
  - Tasks: `task-YYYY-MM-{topic}.md`
  - Special navigation documents:
    - `documentation-map.md` - Central navigation hub
    - `documentation-changelog.md` - Document change history
    - `summary-documents-registry.md` - Registry of summary/aggregator documents

## Cross-References

- Use relative paths for links: `../folder/file-name.md`
- Add contextual description when linking: `[Learn more about state management](../architecture/analysis-state-management.md)`
- When adding a new proposal, update all related documents with links to the new proposal

## Documentation Change Management

### Changelog Maintenance

1. **When to Update**:

   - Add an entry to the changelog whenever a new document is created
   - Add an entry when significant updates are made to existing documents
   - Skip changelog updates for minor formatting or typo fixes

2. **Update Process**:

   - Add a new entry to `/docs/navigation/documentation-changelog.md`
   - Follow the established format with date, document path, change type, summary, author, and impact
   - For major restructuring, consider adding details about what changed and why

3. **Quarterly Reviews**:
   - At the end of each quarter, add a summary of significant changes
   - Review and condense older entries if necessary

### Summary Documents Registry

1. **Registry Purpose**:

   - The registry at `/docs/navigation/summary-documents-registry.md` tracks all documents that summarize or aggregate information from other sources
   - This helps maintain consistency when source documents change

2. **When to Update**:

   - When creating a new summary or aggregator document
   - When changing the update frequency or dependencies of an existing document
   - When modifying the owner or update process

3. **Document Owner Responsibilities**:
   - The document owner listed in the registry is responsible for keeping the document up to date
   - When making changes to source documents, notify the owners of affected summary documents

## Documentation Updates

- When significant system changes occur, update the corresponding analytical documents
- After implementing a proposal, update its status in `documentation-map.md`
- For documents with version history, add an entry about the latest change

## Task Documentation Structure

Task documentation should include:

- **Context**: Clear description of the problem and why it's important
- **Objectives**: Specific goals the task aims to achieve
- **Implementation Plan**: Detailed steps for completing the task
- **Progress Tracking**: Current status and completion metrics
- **Risks and Mitigation**: Identified risks and strategies to address them
- **Implementation Summary**: After completion, a summary of the work done, challenges faced, and lessons learned

## Visualizing Connections

- For complex relationships, use diagrams in ASCII or Mermaid format
- Update the relationship diagram in `documentation-map.md` when adding new documents
- Use tables for comparative analysis of alternatives

## Practical Examples

### Adding a New Proposal:

1. Analyze existing analytical documents
2. Create a new document in `/docs/proposals/` using the naming convention `proposal-{topic}.md`
3. Add references to analytical documents
4. Update `documentation-map.md`
5. Add references to the proposal in relevant analytical documents

### Creating a New Task:

1. Identify the purpose of the task (implementation, research, analysis)
2. Choose the appropriate template from `/docs/tasks/`
3. Create a new document in `/docs/tasks/` using the naming convention `task-YYYY-MM-{topic}.md`
4. Fill in all required sections
5. Update `documentation-map.md` with the new task

### Updating an Analytical Document:

1. Preserve the existing structure
2. Update content with new information
3. Add references to related proposals
4. Update all documents that reference the updated document

## Notes for LLMs

- Always check for the navigation map at `docs/navigation/documentation-map.md`
- Use it to understand relationships between documents
- When modifying documents, maintain their general style and format
- Always aim for documentation integrity by adding appropriate cross-references
- Preserve contextual information about changes in the documentation system
- When updating documents, ensure links between related documents remain valid
- Keep the documentation map updated as the single source of truth for document relationships
- Follow the established pattern for each document type (analysis, proposal, decision, task)
- Honor the existing document hierarchy and organization scheme
- Ensure new documents integrate seamlessly with the existing documentation structure

## Automation and Validation

To help maintain documentation quality and consistency, we have several automation tools available:

- [Validate Documentation](../commands/validate-documentation.md)

These tools can be run via npm scripts:

```bash
# Validate documentation links
npm run docs:validate-links

# Check documentation coverage
npm run docs:check-coverage
```

## Change Management

The project maintains a centralized [Changelog](../CHANGELOG.md) to track significant updates to documentation. This helps team members understand how documentation evolves over time.

### When to Update the Changelog

- When adding new documents
- When making significant content changes to existing documents
- When restructuring documentation organization
- When removing obsolete documents

### Important Note on Changelog Scope

**Only changes to files in the `docs/` directory should be recorded in the changelog.** Changes to code files, scripts, or other non-documentation assets should not be included, even if they are related to documentation processes.

### How to Update the Changelog

1. Add an entry to the appropriate section under the current date
2. Group changes by type (Added, Changed, Removed, Fixed)
3. If the change is part of a larger initiative, consider adding it to the quarterly summary as well

### Tools

Document these key resources in your documentation files:

- For LLMs working with the documentation, point them to the [Documentation Standards](../navigation/documentation-standards.md)
- For validation of documentation, reference the [Validate Documentation](../commands/validate-documentation.md)

## References

- [Report Workflows](../commands/report-workflows.md)
- [Work Items Status Report](../workflows/report.md)
- [Archive Tasks](../commands/archive-tasks.md)
- [Task Archiving Rules](../rules/task-archiving-rules.md)
- [Update Changelog](../commands/update-changelog.md)
- [Update Summary Registry](../commands/update-summary-registry.md)
- [Create Proposal](../commands/create-proposal.md)
- [Create Task](../commands/create-task.md)
- [Documentation Changelog](../CHANGELOG.md)
- [Documentation Map](../navigation/documentation-map.md)
- [Llm Task Workflow](../rules/llm-task-workflow.md)
- [README](../README.md)

## Workflow Cross-Reference Rules

1. **External References to Workflows**:

   - Documents outside of the `/docs/workflows/` directory should only reference the workflow category directories (e.g., `/docs/workflows/tasks/`) or specific documents within them, but not subdirectories.
   - Always reference specific work items (tasks, proposals, etc.) by their full path including the workflows directory (e.g., `../workflows/tasks/task-2025-03-topic.md`).
   - The work items status report is maintained in `/docs/workflows/report.md` and serves as the central reference point for all active work items.

2. **Internal Workflow References**:
   - Work items can freely reference other items within the `/docs/workflows/` directory structure.
   - When referencing archived items, always use the path with `/docs/workflows/archive/` prefix.
