# Documentation Guidelines

## Pythia as Shared Documentation Base & Project Workspace Integration

Pythia is a **shared documentation base** designed to be integrated into any project workspace. It provides:

- **Standardized commands** (e.g., `@create-task.md`, `@validate-command.md`) for generating and maintaining documentation
- **Templates** for all major document types
- **Methodologies** and best practices for documentation management
- **Automation scripts** for validation and reporting

### Two-Level Documentation System

1. **Pythia Project (Shared Base)**

   - Contains all core commands, templates, methodologies, and rules
   - Files are referenced using `mdc:` links and `@command.md` syntax
   - Examples: `mdc:commands/create-task.md`, `mdc:methodology/documentation-guidelines.md`

2. **Project Workspace (e.g., /docs)**
   - Each project has its own `/docs` directory (or equivalent)
   - Project-specific documents are generated and maintained here using Pythia commands/templates
   - Examples: `/.pythia/project-structure.md`, `/.pythia/workflows/tasks/task-2025-07-feature-x.md`

### How Integration Works

- **Reference Pythia commands** in your workspace using `@command.md` syntax (e.g., `@create-task.md`)
- **Generate new documents** in your project workspace using Pythia templates and commands
- **Use `mdc:` links** for workspace-aware cross-references (e.g., `[Create Task](mdc:commands/create-task.md)`)
- **Keep project docs up-to-date** by regularly validating and updating with Pythia base improvements

### Example: Creating a Task in a Project Workspace

```bash
# In your project workspace (e.g., /docs)
@create-task.md
Context: Implement offline mode for user data
Objective: Create a new task document for this feature
```

This will generate `/.pythia/workflows/tasks/task-2025-07-implement-offline-mode.md` using the Pythia template.

---

## General Principles

1. **Document Interconnections**:

   - Each document should be connected to other relevant documents through cross-references
   - When creating a new document, always add a reference to it in `mdc:navigation/documentation-map.md`
   - Related documents should contain mutual references (e.g., analysis → proposal and proposal → analysis)

2. **Document Structure**:

   - Each document should begin with a "Summary" section describing the main content
   - The Summary should be followed by a "Current State" section to provide context
   - Table of contents is mandatory for documents longer than 3 sections

3. **Change Context**:
   - When updating an existing document, maintain its general structure and format
   - New proposals should be based on existing analytical documents
   - When creating a new proposal, first identify all related analytical documents

---

## Folders and Their Purpose

- **Pythia Base (shared):**
  - `commands/` - Standardized commands for documentation management (e.g., `create-task.md`, `validate-command.md`)
  - `templates/` - Templates for all document types
  - `methodology/` - Methodologies and best practices
  - `navigation/` - Navigation and documentation map
  - `rules/` - Guidelines and standards for LLMs and documentation
- **Project Workspace (per-project):**
  - `.pythia/` - Main documentation directory in each project
    - `architecture/` - Analytical documents about the current state of architecture
    - `workflows/` - Work items and documentation workflows
      - `tasks/` - Task documentation and context
      - `proposals/` - Proposals for changes and improvements
      - `decisions/` - Architecture Decision Records (ADRs)
      - `ideas/` - Ideas and early concepts
      - `explorations/` - Explorations of ideas
      - `archive/` - Archived documents
    - `commands/` - Project-specific or extended commands (optional)
    - `guides/` - Practical guides and instructions
    - `navigation/` - Project navigation documents
    - `contexts/` - Project-specific context documents
    - `reports/` - Generated reports

---

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
  - Commands: `create-task.md`, `validate-command.md`, etc.
  - Special navigation documents:
    - `documentation-map.md` - Central navigation hub
    - `documentation-changelog.md` - Document change history
    - `summary-documents-registry.md` - Registry of summary/aggregator documents

---

## Cross-References

- Use `mdc:` links for referencing Pythia base files and commands (e.g., `[Create Task](mdc:commands/create-task.md)`)
- Use relative paths for project workspace files (e.g., `[Project Structure](project-structure.md)`)
- When referencing commands/templates in project docs, use `@command.md` syntax or `mdc:` links
- Add contextual description when linking: `[Learn more about state management](mdc:architecture/analysis-state-management.md)`
- When adding a new proposal, update all related documents with links to the new proposal

---

## Documentation Change Management

- When significant system changes occur, update the corresponding analytical documents
- After implementing a proposal, update its status in `mdc:navigation/documentation-map.md`
- For documents with version history, add an entry about the latest change

---

## Task Documentation Structure

Task documentation should include:

- **Context**: Clear description of the problem and why it's important
- **Objectives**: Specific goals the task aims to achieve
- **Implementation Plan**: Detailed steps for completing the task
- **Progress Tracking**: Current status and completion metrics
- **Risks and Mitigation**: Identified risks and strategies to address them
- **Implementation Summary**: After completion, a summary of the work done, challenges faced, and lessons learned

---

## Practical Examples

### Referencing a Pythia Command in a Project Workspace

```bash
# In your project workspace
@create-task.md
Context: Add offline support to user data
```

### Using mdc: Links in Project Docs

```markdown
[Create Task Command](mdc:commands/create-task.md)
[Documentation Guidelines](mdc:methodology/documentation-guidelines.md)
```

### Adding a New Proposal

1. Analyze existing analytical documents in `/.pythia/architecture/`
2. Create a new document in `/.pythia/workflows/proposals/` using the naming convention `proposal-{topic}.md`
3. Add references to analytical documents using `mdc:` links
4. Update `mdc:navigation/documentation-map.md`
5. Add references to the proposal in relevant analytical documents

---

## Notes for LLMs and Humans

- Always check for the navigation map at `mdc:navigation/documentation-map.md`
- Use it to understand relationships between documents
- When modifying documents, maintain their general style and format
- Always aim for documentation integrity by adding appropriate cross-references
- Preserve contextual information about changes in the documentation system
- When updating documents, ensure links between related documents remain valid
- Keep the documentation map updated as the single source of truth for document relationships
- Follow the established pattern for each document type (analysis, proposal, decision, task, command)
- Ensure new documents integrate seamlessly with the existing documentation structure

---

## Automation and Validation

- Use Pythia's validation commands (e.g., `@validate-command.md`, `@validate-documentation.md`) to maintain documentation quality and consistency
- Run validation scripts regularly to check for broken links, missing sections, and outdated references
- See [Validate Documentation](mdc:commands/validate-documentation.md) for details

---

## Change Management

- Track significant updates in the project changelog (e.g., `/.pythia/CHANGELOG.md`)
- When adding new documents, update the documentation map and cross-references
- For major changes, summarize what changed and why

---

## References

- [Pythia README](mdc:README.md)
- [Documentation Map](mdc:navigation/documentation-map.md)
- [Documentation Guidelines](mdc:methodology/documentation-guidelines.md)
- [Validate Documentation](mdc:commands/validate-documentation.md)
- [Create Task Command](mdc:commands/create-task.md)
