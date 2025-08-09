# Context Documentation Methodology

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

## Memory Bank Integration

Memory Bank complements context documentation by providing session-specific insights and cross-session pattern recognition. While context documents focus on stable, long-term information, Memory Bank captures dynamic insights and decisions that emerge during active work sessions.

### Complementary Roles

**Context Documents:**

- Stable, long-term information
- Domain knowledge and constraints
- Architectural decisions and rationale
- Cross-project patterns and standards

**Memory Bank:**

- Session-specific insights and decisions
- Dynamic pattern recognition
- Cross-task learning and connections
- Temporary context that may become permanent

### Integration Points

1. **Context Document Creation**: Use Memory Bank insights to identify new context documents needed
2. **Pattern Extraction**: Move validated patterns from Memory Bank to context documents
3. **Decision Tracking**: Link Memory Bank decisions to relevant context documents
4. **Cross-Reference Maintenance**: Ensure Memory Bank entries reference appropriate context documents

### Workflow Integration

```bash
# When creating context documents, check Memory Bank for insights
if [ -d ".pythia/memory-bank" ]; then
    # Find related session insights
    find .pythia/memory-bank/sessions -name "*.md" -exec grep -l "topic" {} \;

    # Extract patterns for context documentation
    find .pythia/memory-bank/patterns -name "*.md" -exec basename {} \;

    # Review decisions for context relevance
    find .pythia/memory-bank/decisions -name "*.md" -exec grep -l "architectural" {} \;
fi
```

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

## Context Document Types

### 1. Domain Context Documents

Capture domain-specific knowledge and constraints:

```markdown
# Context: [Domain Name] - [Date]

**Domain Overview:**
[Brief description of the domain and its key concepts]

**Key Constraints:**

- [Constraint 1 with rationale]
- [Constraint 2 with rationale]

**Business Rules:**

- [Rule 1 with implementation details]
- [Rule 2 with implementation details]

**Integration Points:**

- [External system 1 and its requirements]
- [External system 2 and its requirements]

**Cross-References:**

- [Related Memory Bank entries]
- [Related context documents]
```

### 2. Technical Context Documents

Document technical decisions and architectural patterns:

```markdown
# Context: [Technical Area] - [Date]

**Technical Overview:**
[Brief description of the technical area and its importance]

**Architectural Decisions:**

- [Decision 1 with rationale and alternatives considered]
- [Decision 2 with rationale and alternatives considered]

**Implementation Patterns:**

- [Pattern 1 with usage examples]
- [Pattern 2 with usage examples]

**Constraints and Limitations:**

- [Technical constraint 1 with impact]
- [Technical constraint 2 with impact]

**Cross-References:**

- [Related Memory Bank patterns]
- [Related technical context documents]
```

### 3. Process Context Documents

Document workflows and procedures:

```markdown
# Context: [Process Name] - [Date]

**Process Overview:**
[Brief description of the process and its purpose]

**Key Steps:**

- [Step 1 with details and rationale]
- [Step 2 with details and rationale]

**Decision Points:**

- [Decision point 1 with criteria]
- [Decision point 2 with criteria]

**Success Criteria:**

- [Criterion 1 with measurement method]
- [Criterion 2 with measurement method]

**Cross-References:**

- [Related Memory Bank sessions]
- [Related process context documents]
```

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

## Context Document Lifecycle

### 1. Creation

- Identify context gaps through Memory Bank analysis
- Create context documents for stable, reusable information
- Link to relevant Memory Bank entries for dynamic insights

### 2. Maintenance

- Regular review and updates based on Memory Bank insights
- Consolidate similar patterns from Memory Bank
- Archive outdated context information

### 3. Integration

- Ensure bidirectional links between context documents and Memory Bank
- Use context documents to inform Memory Bank searches
- Extract patterns from Memory Bank to create new context documents

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

## Quality Standards

### Context Document Quality Checklist

- [ ] Clear, concise description of the context
- [ ] Specific constraints and their rationale
- [ ] Practical examples and usage patterns
- [ ] Cross-references to related documents
- [ ] Links to relevant Memory Bank entries
- [ ] Regular review and update schedule

### Memory Bank Integration Checklist

- [ ] Context documents reference relevant Memory Bank entries
- [ ] Memory Bank entries link to appropriate context documents
- [ ] Patterns are extracted from Memory Bank to context documents
- [ ] Context documents inform Memory Bank searches
- [ ] Regular synchronization between context and Memory Bank

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

## Best Practices

### 1. Context Document Creation

- Focus on stable, long-term information
- Include practical examples and usage patterns
- Maintain clear cross-references to related documents
- Regular review and updates based on new insights

### 2. Memory Bank Integration

- Use Memory Bank insights to identify new context documents needed
- Extract validated patterns from Memory Bank to context documents
- Maintain bidirectional links between context and Memory Bank
- Regular consolidation of Memory Bank insights into context documents

### 3. Cross-Reference Management

- Ensure all context documents have appropriate Memory Bank references
- Update Memory Bank entries when context documents change
- Regular validation of cross-references
- Clear distinction between stable context and dynamic insights

## Examples of Context Usage

### Example 1: Technical Context for Refactoring

Create a context that describes the current state of the system, problems, technical constraints, and possible approaches. This context is used to create tasks for refactoring.

### Example 2: Business Context for New Functionality

Create a context that describes business needs, expected results, success metrics, and constraints. This context becomes the basis for functional requirements.

### Example 3: Historical Context of System Development

Create a context that describes the evolution of the system, key decisions made, and their consequences. This context helps new team members understand why the system is built the way it is.

## Integration with Pythia Commands

### Context Document Creation

Use Memory Bank insights when creating context documents:

```bash
# Check Memory Bank for related insights before creating context document
if [ -d ".pythia/memory-bank" ]; then
    find .memory-bank/sessions -name "*.md" -exec grep -l "topic" {} \;
    find .memory-bank/patterns -name "*.md" -exec basename {} \;
    find .memory-bank/decisions -name "*.md" -exec grep -l "architectural" {} \;
fi
```

### Context Document Maintenance

Regularly update context documents based on Memory Bank insights:

```bash
# Extract patterns from Memory Bank for context documentation
    find .pythia/memory-bank/patterns -name "*.md" -mtime -30 -exec basename {} \;

# Review recent decisions for context relevance
    find .pythia/memory-bank/decisions -name "*.md" -mtime -30 -exec grep -l "architectural" {} \;
```

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
- **`@memory-bank-management.md`** - Integrate with Memory Bank system

### Template Integration

- Uses `templates/context-template.md` for consistent structure
- Integrates with `templates/task-template.md` for task creation workflow
- Follows documentation standards for cross-referencing

### Methodology Integration

- **Documentation Guidelines**: Follow [Documentation Guidelines](mdc:methodology/documentation-guidelines.md) for structure and cross-referencing
- **Quality Standards**: Apply [Validate Command](mdc:commands/validate-command.md) quality rubric
- **Task Workflow**: Integrate with [Create Task](mdc:commands/create-task.md) command
- **Memory Bank**: Integrate with [Memory Bank Management](mdc:commands/memory-bank-management.md) system

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
- **Integrate with Memory Bank** for dynamic context preservation

Remember, contexts are not just another bureaucratic layer, but an instrument for effective knowledge organization. Use them where they provide real value, and adapt your approach to your specific needs.

## References

- [Create Task](mdc:commands/create-task.md)
- [Validate Command](mdc:commands/validate-command.md)
- [Memory Bank Management](mdc:commands/memory-bank-management.md)
- [Task Template](mdc:templates/task-template.md)
- [Context Template](mdc:templates/context-template.md)
- [Documentation Guidelines](mdc:methodology/documentation-guidelines.md)
- [Documentation Map](mdc:navigation/documentation-map.md)

---

**Last Updated**: 2025-08-06
