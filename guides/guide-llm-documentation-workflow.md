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

## Philosophy: Text-in-the-Middle

- Context-first: anchor work and decisions in living context docs, not tickets/config.
- Minimal ceremony: commands are utilities; we optimize flows and outcomes, not command syntax.
- Human-in-the-loop: LLM executes defaults; guarded steps are explicitly marked and confirmed by a person.
- Traceability by design: analysis/review artifacts are documented and linked from tasks/contexts.

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

## End-to-End Lifecycle (Idea → Completed)

### Lifecycle Phases: What to do and run

- Phase A — Shape the Change

  - Purpose: turn a vague idea/problem into a decision-ready change when needed
  - Run: `@create-idea.md` → `@create-exploration.md` (optional) → `@create-proposal.md` (optional)
  - Output: context(s), rationale, options, recommendation; bidirectional links

- Phase B — Start the Task

  - Purpose: create an executable plan with clear gates
  - Run: `@create-task.md`, then inside the task use `@manage-task.md`
  - Do: fill Overview (Repository, Branch [H], PR, LLM Model), add phased checklist with `[H]` where human confirmation is required; link contexts via `mdc:`
  - Status: Not Started → In Progress

- Phase C — Execute

  - Purpose: implement in small, verifiable steps
  - Run: iterate with `@manage-task.md` guidance; keep notes in the task
  - Do: add/update tests for all new/changed code; run coverage; prepare AI review
  - Artifacts: keep evidence and link from the task
  - Status: In Progress (use Blocked with reason when needed)

- Phase D — Under Review (Gate)

  - Preconditions: Context valid; Success Criteria drafted; tests present; coverage meets target; AI review evidence attached
  - Run: `@analyze-ai-solutions.md` (diff-aware by default)
  - Do: add a short evidence summary in the task; ensure `[H]` items are ready for human validation
  - Status: In Progress → Under Review

- Phase E — Completed (Gate)

  - Preconditions: all Success Criteria checked; evidence OK; `[H]` items confirmed; "AI Solution Analysis Results" present
  - Do: finalize notes, cross-links, and references
  - Status: Under Review → Completed

- Phase F — Archive & Report
  - Run: `@archive-tasks.md`, `@update-documentation-map.md`, `@report-workflows.md`
  - Do: ensure bidirectional links remain valid
  - Status: Completed → Archived

### 1) Idea → Exploration → Proposal → Task → Completed

1. Capture idea context (short rationale, scope, desired impact)
2. Exploration to reduce uncertainty (alternatives, risks, recommendation)
3. Proposal to formalize the change (decision-ready)
4. Implementation task with phased plan and success criteria
5. Quality gates: tests/coverage + AI analysis; archive when done

References: `@create-idea.md`, `@create-exploration.md`, `@create-proposal.md`, `@create-task.md`, `@manage-task.md`, `@analyze-ai-solutions.md`

### 2) Direct Task (Bug/Feature) → Review → Complete

1. Context-First intake: link at least one relevant context (or justify none for Low)
2. Plan and execute with small, verifiable steps; mark human-only steps with `[H]`
3. Add/Update tests for new/changed code; run coverage
4. Run AI review (diff-aware)
5. Move to Under Review → Completed when gates are satisfied

References: `@create-task.md`, `@manage-task.md`, `@analyze-ai-solutions.md`

### 3) Status and Gates (Control)

- Status model: Not Started, In Progress, Under Review, Blocked, Completed, Archived
- Gate to Under Review: valid Context, drafted Success Criteria, tests + coverage OK, AI review evidence attached
- Gate to Completed: evidence OK, all criteria checked, `[H]` items confirmed, "AI Solution Analysis Results" present
- `[H]` marker: human-only checklist items; LLM writes notes but never checks them

### 4) PR Loop → Evidence → Human Confirmation

1. LLM produces review artifacts (JSON + MD) for the task/PR
2. Human validates outcomes for guarded steps `[H]` (branch, prod checks)
3. Link artifacts back to the task/contexts for traceability

References: `@analyze-ai-solutions.md`

---

## 🔍 Real-World Examples

---

## ⚡ Task Flow Quick Start (LLM + Human)

- Use `@manage-task.md` inside the task to drive the lifecycle: Context-First → Plan → Execute → Under Review → Completed.
- Mark human-only steps with `[H]` (LLM prepares notes but does not tick the box). Example: `- [ ] Create/push branch 'feature/x' [H]`.
- Add/Update tests for all new/changed code and run coverage before completion (see `@analyze-ai-solutions.md`).
- Store AI review artifacts and link them from the task.

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
