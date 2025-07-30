# Methodology Integration Guide

## Summary

This document provides unified guidance for applying methodologies systematically across commands and projects. It explains how to combine multiple methodologies, when to use which approach, and how to ensure consistent application.

## Purpose

The Methodology Integration Guide serves as the central reference for understanding how to apply methodologies in the Pythia framework. It provides:

- **Unified Approach**: How to combine multiple methodologies in a single command or workflow
- **Decision Framework**: When to use which methodology or combination
- **Integration Patterns**: Standard patterns for methodology application
- **Quality Assurance**: How to ensure methodology application is consistent and effective

## Core Principles

### 1. **Methodology as Foundation**

Methodologies provide the systematic approach to problem-solving. They should be:

- **Applied consistently** across all commands and workflows
- **Combined thoughtfully** when multiple approaches are needed
- **Adapted contextually** to specific project needs

### 2. **Integration Over Isolation**

Methodologies work best when integrated rather than used in isolation:

- **Cross-reference methodologies** when they complement each other
- **Use decision trees** to choose the right methodology combination
- **Document integration patterns** for reuse

### 3. **Quality Through Consistency**

Consistent methodology application ensures:

- **Predictable outcomes** across different projects
- **Reduced learning curve** for new team members
- **Easier maintenance** and improvement of processes

## Methodology Categories

### Core Methodologies (Keep in `/methodology/`)

1. **Context Documentation** (`context-documentation.md`)

   - **Purpose**: Structured information for decision-making
   - **When to Use**: When you need to understand "why" and "what" before "how"
   - **Integration**: Use with any other methodology to provide context

2. **Documentation Guidelines** (`documentation-guidelines.md`)
   - **Purpose**: Standards for creating and maintaining documentation
   - **When to Use**: When creating or updating any documentation
   - **Integration**: Apply to all documentation created by other methodologies

### Reference Guides (Move to `/guides/`)

3. **Prioritization Methods** (`guides/prioritization-methods.md`)

   - **Purpose**: Decision-making frameworks for prioritization
   - **When to Use**: When choosing what to work on next
   - **Integration**: Use with implementation approach for planning

4. **Technical Debt Prioritization** (`guides/technical-debt-prioritization.md`)
   - **Purpose**: Specialized assessment for technical debt
   - **When to Use**: When evaluating technical debt items
   - **Integration**: Use with general prioritization methods

### Processes (Move to `/processes/`)

5. **Implementation Approach** (`processes/implementation-approach.md`)

   - **Purpose**: 4-phase framework for implementing changes
   - **When to Use**: When planning significant system changes
   - **Integration**: Use with prioritization and context documentation

6. **Ideas to Proposals Workflow** (`processes/ideas-to-proposals-workflow.md`)
   - **Purpose**: Process for transforming ideas into implementation
   - **When to Use**: When developing new features or improvements
   - **Integration**: Use with implementation approach and prioritization

## Integration Patterns

### Pattern 1: Context + Implementation

**Use Case**: Planning a major system change
**Methodologies**: Context Documentation + Implementation Approach
**Process**:

1. Create context document for the change
2. Use implementation approach to plan phases
3. Apply documentation guidelines throughout

### Pattern 2: Prioritization + Context

**Use Case**: Choosing what to work on next
**Methodologies**: Prioritization Methods + Context Documentation
**Process**:

1. Create context for each candidate item
2. Apply appropriate prioritization method
3. Document decision and rationale

### Pattern 3: Workflow + Quality

**Use Case**: Implementing a new feature
**Methodologies**: Ideas to Proposals Workflow + Documentation Guidelines
**Process**:

1. Follow the workflow stages
2. Apply documentation standards at each stage
3. Use context documentation for decision points

## Decision Framework

### When to Use Which Methodology

| Scenario                      | Primary Methodology           | Supporting Methodologies                       |
| ----------------------------- | ----------------------------- | ---------------------------------------------- |
| **Planning a major change**   | Implementation Approach       | Context Documentation, Prioritization Methods  |
| **Choosing next priorities**  | Prioritization Methods        | Context Documentation                          |
| **Developing new features**   | Ideas to Proposals Workflow   | Implementation Approach, Context Documentation |
| **Evaluating technical debt** | Technical Debt Prioritization | Prioritization Methods, Context Documentation  |
| **Creating documentation**    | Documentation Guidelines      | Context Documentation                          |

### Methodology Selection Checklist

- [ ] **What type of decision are you making?**

  - Planning → Implementation Approach
  - Prioritizing → Prioritization Methods
  - Creating → Ideas to Proposals Workflow
  - Evaluating → Technical Debt Prioritization
  - Documenting → Documentation Guidelines

- [ ] **Do you need context?**

  - Yes → Add Context Documentation
  - No → Proceed with primary methodology

- [ ] **Will this create documentation?**

  - Yes → Apply Documentation Guidelines
  - No → Focus on primary methodology

- [ ] **Do you need to prioritize?**
  - Yes → Add appropriate Prioritization Method
  - No → Proceed with primary methodology

## Application Guidelines

### 1. **Start with Context**

Always begin by understanding the context:

- What problem are you solving?
- What constraints exist?
- What stakeholders are involved?
- What success looks like?

### 2. **Choose Primary Methodology**

Select the methodology that best fits your primary goal:

- **Planning**: Implementation Approach
- **Prioritizing**: Prioritization Methods
- **Creating**: Ideas to Proposals Workflow
- **Evaluating**: Technical Debt Prioritization
- **Documenting**: Documentation Guidelines

### 3. **Add Supporting Methodologies**

Enhance your approach with supporting methodologies:

- **Context**: Always add if not already present
- **Documentation**: Always apply to any documentation created
- **Prioritization**: Add if you need to choose between options

### 4. **Apply Consistently**

Ensure consistent application:

- Use the same patterns across similar scenarios
- Document your methodology choices
- Review and improve your approach

## Quality Assurance

### Consistency Checks

- [ ] Are you using the same methodology for similar scenarios?
- [ ] Are you applying documentation guidelines consistently?
- [ ] Are you creating context when needed?
- [ ] Are you documenting your methodology choices?

### Effectiveness Measures

- [ ] Are decisions being made more systematically?
- [ ] Is documentation quality improving?
- [ ] Are team members understanding the approach?
- [ ] Are outcomes more predictable?

### Improvement Cycles

- [ ] Review methodology application monthly
- [ ] Identify patterns that work well
- [ ] Document lessons learned
- [ ] Update integration patterns

## Examples

### Example 1: Planning a Major Refactoring

**Scenario**: Need to refactor the authentication system
**Methodologies**: Context Documentation + Implementation Approach + Prioritization Methods

**Process**:

1. **Context**: Create context document explaining why refactoring is needed, current issues, and success criteria
2. **Prioritization**: Use ICE method to prioritize refactoring tasks
3. **Implementation**: Use 4-phase approach to plan the refactoring
4. **Documentation**: Apply documentation guidelines throughout

### Example 2: Choosing Next Sprint Items

**Scenario**: Need to choose what to work on in the next sprint
**Methodologies**: Prioritization Methods + Context Documentation

**Process**:

1. **Context**: Create context for each candidate item
2. **Prioritization**: Use User Pain vs. Dev Effort for sprint planning
3. **Documentation**: Document decisions and rationale

### Example 3: Developing a New Feature

**Scenario**: Need to implement offline mode
**Methodologies**: Ideas to Proposals Workflow + Implementation Approach + Context Documentation

**Process**:

1. **Context**: Create context document for offline mode requirements
2. **Workflow**: Follow idea → exploration → proposal → implementation
3. **Implementation**: Use 4-phase approach for the actual implementation
4. **Documentation**: Apply documentation guidelines at each stage

## Related Documents

- [Methodology Usage Guide](mdc:methodology/methodology-usage-guide.md) - **START HERE** for practical guidance
- [Context Documentation](mdc:methodology/context-documentation.md)
- [Documentation Guidelines](mdc:methodology/documentation-guidelines.md)
- [Implementation Approach](mdc:processes/implementation-approach.md)
- [Prioritization Methods](mdc:guides/prioritization-methods.md)
- [Technical Debt Prioritization](mdc:guides/technical-debt-prioritization.md)
- [Ideas to Proposals Workflow](mdc:processes/ideas-to-proposals-workflow.md)
- [Commands and Methodology Improvement Task](mdc:workflows/tasks/task-2025-01-commands-methodology-improvement.md)

---

**Last Updated**: 2025-01-27
**Purpose**: Core methodology integration guide
**Scope**: How to combine and apply methodologies systematically
**Audience**: LLMs and human documentation maintainers
