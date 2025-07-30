# Context Documents: Methodology and Application

> **IMPORTANT**: This document provides a systematic, production-ready methodology for creating, using, and managing context documents in projects that use the Pythia system. It is designed for use by LLMs and human reviewers to ensure all context documents meet the highest standards of clarity, completeness, and integration with task creation workflows.

## Quick Reference

- **Purpose**: Define methodology for context documents that support decision-making and task creation
- **Key Steps**: Definition → Principles → Classification → Structure → Integration → Work Process
- **Self-Check**: Use the Self-Check Points section before finalizing context documents
- **Methodology**: Integrate with task creation workflow and documentation standards
- **Safety**: Stop and request clarification if context requirements are unclear

## Document Purpose

This document describes the methodology for creating, using, and managing context documents (Context Documents) in projects that use the Pythia system. It defines what contexts are, what types of contexts can exist, and how to properly integrate them into the project's documentation structure and task creation workflow.

## Definition of Context

**Context Document** — is a document that contains structured information necessary for making decisions, creating tasks, or understanding the prerequisites of certain aspects of the project. Contexts focus on "why" and "what", complementing "how", which is described in other types of documents.

Contexts serve as the project's institutional memory, preserving knowledge that could be lost when the team changes or over time.

## Core Principles of Context Documents

1. **Structuredness** — contexts have a clear structure that facilitates their search and use
2. **Knowledge Focus** — contexts contain information necessary for making informed decisions
3. **Connectedness** — contexts are linked to other documents through references
4. **Evolutionary** — contexts can evolve and be updated over time
5. **Autonomy** — each context should be a self-sufficient document
6. **Flexibility** — the structure and organization of contexts can adapt to the needs of a specific project
7. **Task Integration** — contexts should support task creation workflow and decision-making processes

## Flexible Classification of Context Documents

It's important to understand that context classification should correspond to the needs of a specific project and team processes. Instead of rigid typing, we propose considering possible classification dimensions that can be combined:

### By Knowledge Domain

- **Technical Contexts** — architecture, technologies, tools, constraints
- **Business Contexts** — business requirements, business processes, market aspects
- **User Contexts** — user research, needs, behavior
- **Operational Contexts** — deployment, monitoring, support

### By Time Axis

- **Historical Contexts** — describe past decisions and their consequences
- **Current Contexts** — describe the current state of systems or processes
- **Prospective Contexts** — describe plans, forecasts, expected changes

### By Detail Level

- **High-level Contexts** — general overview of systems and processes
- **Mid-level Contexts** — overview of components or modules
- **Low-level Contexts** — detailed breakdown of system elements

### By Functional Purpose

This is a classification that is close to the initial approach but is considered optional:

- **Project Contexts** — general aspects of the project, goals, constraints
- **Task Contexts** — prerequisites for specific tasks
- **Decision Contexts** — justification of important decisions
- **Reference Contexts** — useful reference information

## Examples of Context Documents

Instead of fixed classification, here are examples of possible contexts:

- Competitor analysis
- User personas
- Technology stack overview
- Architectural constraints
- History of evolution of key components
- Technology comparison for a specific task
- Research of usage patterns of functionality
- Knowledge base of typical problems and their solutions
- Project terminology glossary
- User feedback analysis
- Documentation of deployment and monitoring processes
- Description of integrations with external services

## Context Document Structure

The basic structure of a context document includes:

- **Metadata** - information about type, status, tags, dates, author
- **Description** - general description of the context and its purpose
- **Key Information** - main content of the document, structured according to needs
- **Artifacts and Resources** - links to external resources, files, data
- **Questions and Answers** - answers to key questions
- **Conclusions** - summaries and recommendations
- **Links to Other Contexts** - list of related contexts
- **Change History** - table of major document changes

A detailed template with all sections and recommendations for their completion is available in the [context document template](../templates/context-template.md).

## Integration with Task Creation Workflow

### Context-to-Task Integration

Contexts should be designed to support the task creation process:

1. **Task Preparation** — contexts provide the knowledge base for creating well-informed tasks
2. **Decision Support** — contexts help determine task scope, priority, and approach
3. **Risk Assessment** — contexts inform task risk analysis and mitigation strategies
4. **Success Criteria** — contexts help define clear, measurable success criteria for tasks

### Task Creation Process Integration

When using [Create Task](mdc:commands/create-task.md) command:

1. **Context Analysis** — review relevant contexts before creating tasks
2. **Context References** — include references to relevant contexts in task documents
3. **Context Updates** — update contexts based on task outcomes and learnings
4. **Context Validation** — ensure task objectives align with context conclusions

### Template Integration

The [Task Template](mdc:templates/task-template.md) includes a "Context" section that should reference relevant context documents:

```markdown
## Context

Brief description of the task's background and why it's important. This should provide enough context for the task to be understood independently.

- What problem does this task solve?
- Why is it important now?
- How does it relate to overall project goals?
- What triggered the need for this task?

**Related Context Documents:**

- [Context Document 1](mdc:docs/contexts/domain/context-YYYY-MM-topic.md)
- [Context Document 2](mdc:docs/contexts/domain/context-YYYY-MM-topic.md)
```

## Flexible Organization of Contexts in the Project

### Approaches to Directory Structure

Instead of rigid structure, we propose several approaches that can be adapted:

#### 1. By Knowledge Domains

```
contexts/
  technical/     # Technical contexts
  business/      # Business contexts
  user/          # User contexts
  operational/   # Operational contexts
```

#### 2. By Functional Areas of the Project

```
contexts/
  authentication/     # Contexts related to authentication
  reporting/          # Contexts related to reporting
  integration/        # Contexts related to integrations
  performance/        # Contexts related to performance
```

#### 3. Flat structure with tags

```
contexts/
  context-2025-03-authentication-evolution.md   # Tags: #technical #security #history
  context-2025-03-user-research-results.md      # Tags: #user #research #current
  context-2025-04-performance-bottlenecks.md    # Tags: #technical #performance #current
```

#### 4. Hybrid approach

Combine the above approaches according to project needs.

### File Naming

Recommended file naming format for contexts:

```
context-[YYYY-MM]-[short-description].md
```

where:

- `[YYYY-MM]` — year and month of context creation
- `[short-description]` — concise description of context content in slug format

Examples:

- `context-2025-03-performance-analysis.md`
- `context-2025-04-technology-selection.md`

## Avoiding Cross-Workflows

An important aspect of effective context usage is avoiding duplication of information already present in workflow documents. Here are some recommendations:

### Separation of Contexts and Workflows

- **Workflows** describe **processes** and **steps** of execution (how to do)
- **Contexts** describe **knowledge** and **prerequisites** (why and what)

### Strategies for Avoiding Duplication

1. **Mutual References** — instead of duplication, workflow documents can reference relevant contexts and vice versa

   ```markdown
   ## Context

   Detailed information is available in [context-2025-04-technology-selection](../../contexts/technical/context-2025-04-technology-selection.md).
   ```

2. **Different Focus** — workflows focus on a sequence of actions, contexts — on knowledge and justifications

3. **Time Frames** — workflows are often oriented towards specific tasks with a limited time frame, contexts have a longer "lifespan"

4. **Just-in-time Documentation** — create contexts only when they provide valuable information that is not adequately reflected in other documents

### Examples of Complementary Information

| Workflow Document             | Context Document                                       |
| ----------------------------- | ------------------------------------------------------ |
| Deployment Process            | Architecture of deployment and justification           |
| Steps for Feature Creation    | User research that justifies the need for a feature    |
| Incident Resolution Procedure | Knowledge base of typical problems and their solutions |

## Context Work Process

### Creating a Context

1. Determine if a new context is actually needed (check if information is not duplicated)
2. Choose the appropriate classification and location in the project structure
3. Use the `create-context` command or create a file manually
4. Fill in the template according to needs
5. Add links to related documents
6. Add appropriate tags for easy search
7. **Validate context quality** using [Validate Command](mdc:commands/validate-command.md) standards

### Using Contexts

Contexts can be used for:

1. **Preparing for Task Creation** — analyzing contexts helps formulate clear, well-justified tasks
2. **Making Decisions** — contexts provide necessary information for making informed decisions
3. **Introducing New Team Members** — contexts allow new team members to quickly understand the project's history and logic
4. **Documenting Knowledge** — contexts serve as a repository for institutional knowledge about the project

### Updating Contexts

1. Use the `update-context` command or update the file manually
2. Add information about changes to the history section
3. Update the last updated date in metadata
4. If significant changes occur, consider creating a new context
5. **Re-validate context quality** after significant updates

## Quality Validation for Context Documents

### Self-Check Points

Before finalizing a context document, verify:

- [ ] **Clarity**: Context purpose and content are clear and understandable
- [ ] **Completeness**: All required sections are present and filled
- [ ] **Connectedness**: Proper links to related documents using `mdc:` format
- [ ] **Task Integration**: Context supports task creation workflow
- [ ] **Metadata**: All metadata fields are properly filled
- [ ] **Structure**: Document follows the established template structure
- [ ] **Tags**: Appropriate tags are assigned for easy discovery

### Quality Rubric

| Dimension            | 1 (Low)         | 3 (Medium)      | 5 (High)              |
| -------------------- | --------------- | --------------- | --------------------- |
| **Clarity**          | Unclear purpose | Mostly clear    | Crystal clear purpose |
| **Completeness**     | Major gaps      | Minor gaps      | Complete coverage     |
| **Connectedness**    | No links        | Basic links     | Comprehensive links   |
| **Task Integration** | No task support | Basic support   | Full task integration |
| **Maintainability**  | Hard to update  | Moderate effort | Easy to maintain      |

## Examples of Context Usage

### Example 1: Technical Context for Refactoring

Create a context that describes the current state of the system, problems, technical constraints, and possible approaches. This context is used to create tasks for refactoring.

### Example 2: Business Context for New Functionality

Create a context that describes business needs, expected results, success metrics, and constraints. This context becomes the basis for functional requirements.

### Example 3: Historical Context of System Development

Create a context that describes the evolution of the system, key decisions made, and their consequences. This context helps new team members understand why the system is built the way it is.

## Safety & Stop Conditions

- **No Duplication**: If information already exists in workflow documents, STOP and reference instead
- **Stop Conditions**:
  - Missing required context information
  - Conflicting context data
  - Insufficient justification for context creation
- **Fallback**: Use existing contexts when possible instead of creating new ones
- **Request Help**: If context requirements are unclear, escalate to a human reviewer

## Integration Guidelines

This methodology integrates with other Pythia components:

### Related Commands

- **`@create-task.md`** - Use contexts to inform task creation
- **`@validate-command.md`** - Apply validation standards to context documents
- **`@validate-documentation.md`** - Validate context documentation integrity

### Template Integration

- Uses `templates/context-template.md` for consistent structure
- Integrates with `templates/task-template.md` for task creation workflow
- Follows documentation standards for cross-referencing

### Methodology Integration

- **Documentation Guidelines**: Follow [Documentation Guidelines](mdc:methodology/documentation-guidelines.md) for structure and cross-referencing
- **Quality Standards**: Apply [Validate Command](mdc:commands/validate-command.md) quality rubric
- **Task Workflow**: Integrate with [Create Task](mdc:commands/create-task.md) command

## Conclusions

Context documents are an important component of the project's documentation system, which ensures the preservation and transfer of knowledge, justification of decisions, and creation of an information base for making new decisions.

The key feature of an effective context system is **flexibility** — the structure and organization of contexts must adapt to the needs of a specific project and team, not the other way around.

Proper use of contexts allows:

- Reduce knowledge loss when the team changes
- Improve the quality of decisions made
- Simplify introducing new team members
- Create a single source of truth for critical aspects of the project
- Avoid duplication with other document types
- **Support task creation workflow** with informed decision-making

Remember, contexts are not just another bureaucratic layer, but an instrument for effective knowledge organization. Use them where they provide real value, and adapt your approach to your specific needs.

## References

- [Create Task](mdc:commands/create-task.md)
- [Validate Command](mdc:commands/validate-command.md)
- [Task Template](mdc:templates/task-template.md)
- [Context Template](mdc:templates/context-template.md)
- [Documentation Guidelines](mdc:methodology/documentation-guidelines.md)
- [Documentation Map](mdc:navigation/documentation-map.md)

---

**Last Updated**: 2025-07-30
