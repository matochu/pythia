# How to Use LLM for Effective Documentation Work (Guide)

**Author:** Serhii
**Updated:** 12.03.2025
**Status:** Active

---

## What is This?

This guide will help you quickly and easily use Large Language Models (LLM) capabilities for creating, updating, and maintaining documentation in the project. Forget about tedious routine – let LLM handle your mundane tasks.

---

## What Benefits Will You Get Using LLM?

- ✅ **Rapid Document Creation**: Less time spent, more space for creativity.
- 📌 **Consistency Across All Documents**: Documents automatically adhere to standards.
- 🔗 **Automatic Link Management**: Links are always up-to-date and properly updated.
- 🚀 **Instant Updates**: Changes automatically propagate to dependent documents.
- 📚 **Automatic Information Integration**: Collecting information from various sources without extra effort.
- 🛠️ **Documentation Cleanliness**: Reduces errors and missing references.

---

## How LLM Commands Work?

Before looking at specific commands, let's understand how they work:

1. **Command Operating Principle**:

   - LLM recognizes references to instruction files (e.g., `@create-task.md`)
   - It reads this file and understands what structure needs to be created
   - Extracts necessary information from your request and other documents
   - Generates content according to the template and requirements

2. **Automatic File Creation**:

   - After recognizing the command, LLM:
     - Creates a new file in the appropriate directory
     - Names it according to project conventions
     - Fills content according to the template
     - Adds necessary metadata and cross-references

3. **Integration with Other Documents**:
   - Commands also update dependent documents
   - For example, creating a new task automatically updates the documentation map

---

## Getting Started: Basic Commands

Simply enter one of these commands in the chat:

### 🆕 Creating New Documents

- `@create-task.md` – new task document with description, goals, and implementation plan.

  - _What happens_: LLM analyzes the context, creates a structured document in the `../workflows/tasks/` folder with name `task-YYYY-MM-{topic}.md`, fills all sections according to the template, adds cross-references and progress markers.

- `@create-proposal.md` – automatically forms a proposal with benefits and risks analysis.

  - _What happens_: LLM analyzes related architecture documents, creates a proposal document in `../workflows/proposals/` with name `proposal-{topic}.md`, including current state analysis, proposal description, risk assessment, and implementation plan.

- `@create-idea.md` – creates a document for a new idea with description and rationale.

  - _What happens_: LLM creates an idea document in `../workflows/ideas/` with name `idea-YYYY-MM-{topic}.md`, structuring problem description, proposed solution, potential benefits, and implementation risks.

- `@create-exploration.md` – prepares a detailed research of ideas or technologies.
  - _What happens_: LLM creates a research document in `../workflows/explorations/` with name `exploration-{topic}.md`, including detailed technology analysis, comparison of alternatives, suitability assessment, and recommendations.

### 🔄 Updating and Maintaining

- `@update-documentation-map.md` – updates the documentation map with all current references.

  - _What happens_: LLM scans all documentation, finds new or changed documents, classifies them by type, and updates the central documentation map, adding new documents to the appropriate sections.

- `@update-changelog.md` – adds recent changes to the change log.

  - _What happens_: LLM analyzes recent changes in documentation, classifies them as added, changed, fixed, and removed, forms structured entries in CHANGELOG.md with proper dating.

- `@update-summary-registry.md` – updates the summary documents registry.
  - _What happens_: LLM updates the registry of documents that aggregate information from other sources, ensures tracking of dependencies between documents, and indicates who is responsible for updating each document.

### ✅ Validating and Archiving

- `@validate-documentation.md` – checks the integrity of your documentation.

  - _What happens_: LLM checks all references in the documentation, finds and fixes broken links, ensures that all documents are included in the documentation map, and that cross-references between related documents exist in both directions.

- `@archive-tasks.md` – quickly archives completed tasks.
  - _What happens_: LLM determines which tasks meet archiving criteria, moves them to the `../workflows/archive/tasks/` folder, updates references in dependent documents, adds an archiving entry to CHANGELOG.md.

### 🌟 Completing Research

- `@complete-exploration.md` – automatically prepares summaries and recommendations after research.
  - _What happens_: LLM analyzes the research document, forms summaries, recommendations, and conclusions, adds decision-making criteria, and, if necessary, recommends creating a proposal document based on research results.

---

## 🔍 Real-World Examples

### 📌 Example 1. Creating a Task Document

Request:

> "Use @create-task.md to create a task document for migrating from Redux to Zustand. The task should include analysis of the current state, a component-by-component migration plan, and a testing strategy."

LLM automatically:

- Analyzes documents about the current state of state management
- Creates a new file `task-2025-03-redux-zustand-migration.md` in the `../workflows/tasks/` folder
- Fills all required sections following the task template
- Adds references to related documents, including state analysis and the corresponding proposal
- Updates the documentation map and change log

### 📌 Example 2. Researching New Technology

Request:

> "Run @create-exploration.md to research the possibility of using feature flags for A/B testing. Consider experiences from other projects and analyze React libraries."

LLM:

- Creates a new file `exploration-feature-flags-ab-testing.md` in the `../workflows/explorations/` folder
- Conducts analysis of available libraries and implementation approaches
- Structures research according to project methodology
- Includes a comparative table of alternatives with their advantages and disadvantages
- Adds a collection of sources and references to existing documents

### 📌 Example 3. Validating Documentation Quality

Request:

> "Run @validate-documentation.md and fix all issues with links and documentation structure."

LLM:

- Analyzes all documents for issues
- Identifies broken links, missing cross-references, or documents not included in the documentation map
- Automatically fixes identified issues
- Provides a report of changes made
- Suggests additional recommendations for improving structure

---

## 💡 Tips for Effective Collaboration with LLM

### 🧭 Clearly State Request Purpose

Instead of:

- ❌ "Use @create-task.md"
- ✅ "Use @create-task.md to create a task for caching optimization with a detailed description of steps"

### 🔍 Provide Context

- Specify which documents should be considered, for example:
  > "Use @create-proposal.md to create a proposal for offline mode optimization based on the analysis in the file analysis-offline-mode.md"

### 📝 Clearly Describe Desired Outcome

- For example:
  > "Use @create-idea.md to describe the idea of migrating to TypeScript 5.0 with effort and benefits assessment"

### 💬 Ask for Clarification

- If unsure which command to use, just describe what you want to do:
  > "I need to research new WebGL technology for UI. Which command should I use?"

---

## 🔖 Common Questions

**❓ How do I know what parameters are needed for a command?**

- You can view the instruction file directly (e.g., `../commands/create-task.md`) or simply ask LLM: "What parameters are needed for @create-task.md?"

**❓ What if the result doesn't meet expectations?**

- Simply clarify your request: "Rework the document, adding more details about the migration plan and risk assessment"

**❓ Can commands be combined?**

- Yes, you can use multiple commands sequentially:
  > "First use @create-idea.md for the migration idea, then @create-exploration.md for its research"

**❓ How to ensure document quality?**

- Use the validation command: `@validate-documentation.md`
- Or simply ask: "Check the quality and completeness of this document"

---

## 🚨 What NOT to Do with LLM?

- **Don't specify many commands simultaneously** – better to execute them sequentially
- **Don't forget to specify details** – more context means better results
- **Don't expect LLM to guess all details** – be specific in your requests

---

## 🗒️ Additional Tips from Me

- 🌟 **Start Simple**: First try simple commands for creating ideas or tasks
- 🎯 **Study Templates**: Review several created documents to understand their structure
- 🔖 **Create Your Cheat Sheet**: Write down the most useful commands and queries for reuse
- 🔄 **Regularly Update Documentation**: Use `@validate-documentation.md` weekly

---

## 🎯 Conclusion

Use LLM through convenient commands to free up your time for strategic tasks and creativity. Simply specify the right command, add context, and enjoy the result!

## References

- [Validate Documentation](../commands/validate-documentation.md)
- [Create Task](../commands/create-task.md)
- [Create Proposal](../commands/create-proposal.md)
- [Create Idea](../commands/create-idea.md)
- [Create Exploration](../commands/create-exploration.md)
- [Update Documentation Map](../commands/update-documentation-map.md)
- [Update Changelog](../commands/update-changelog.md)
- [Update Summary Registry](../commands/update-summary-registry.md)
- [Archive Tasks](../commands/archive-tasks.md)
- [Complete Exploration](../commands/complete-exploration.md)
- [Documentation Map](../navigation/documentation-map.md)
- [Task Workflow](../rules/llm-task-workflow.md)
