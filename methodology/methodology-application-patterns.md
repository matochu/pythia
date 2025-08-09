# Methodology Application Patterns

## Summary

This document provides standardized patterns for applying methodologies systematically across commands and projects. It defines best practices, anti-patterns, decision trees, and common application scenarios to ensure consistent and effective methodology usage.

## Purpose

The Methodology Application Patterns document serves as a practical guide for applying methodologies in real-world scenarios. It provides:

- **Standardized Patterns**: Common patterns for methodology application
- **Best Practices**: Proven approaches for effective methodology usage
- **Anti-Patterns**: Common mistakes to avoid
- **Decision Trees**: Clear guidance for choosing the right methodology combination
- **Application Scenarios**: Real-world examples of methodology usage

## Core Principles

### 1. **Pattern-Based Application**

Methodologies should be applied using established patterns:

- **Sequential Application**: Apply methodologies in logical order
- **Parallel Application**: Use multiple methodologies simultaneously when appropriate
- **Iterative Application**: Apply methodologies in cycles for complex problems

### 2. **Context-Aware Selection**

Choose methodologies based on specific context:

- **Problem Type**: Different problems require different approaches
- **Project Phase**: Early vs. late project phases have different needs
- **Team Size**: Methodology complexity should match team capabilities
- **Time Constraints**: Choose methodologies that fit available time

### 3. **Quality Through Consistency**

Consistent application ensures:

- **Predictable Outcomes**: Similar inputs produce similar results
- **Reduced Learning Curve**: Team members can quickly understand approaches
- **Easier Maintenance**: Consistent patterns are easier to update and improve

## Methodology Categories and Patterns

### Core Methodologies (Keep in `/methodology/`)

#### Context Documentation Pattern

**When to Use**: Always, as foundation for other methodologies
**Application Pattern**:

1. **Identify Context Type**: Determine if you need domain, technical, or process context
2. **Gather Information**: Collect relevant background and current state
3. **Structure Context**: Organize information using standard context template
4. **Validate Completeness**: Ensure all necessary context is captured
5. **Link to Decisions**: Connect context to specific decisions or actions

**Best Practices**:

- Start with context documentation before any other methodology
- Update context as project evolves
- Keep context documents concise and focused

**Anti-Patterns**:

- Creating context documents without clear purpose
- Over-documenting irrelevant information
- Failing to update context as project changes

#### Documentation Guidelines Pattern

**When to Use**: When creating or updating any documentation
**Application Pattern**:

1. **Determine Document Type**: Identify if it's analysis, proposal, task, etc.
2. **Apply Structure**: Use appropriate template and format
3. **Follow Naming Conventions**: Use consistent file naming
4. **Add Cross-References**: Link to related documents
5. **Validate Quality**: Check against quality standards

**Best Practices**:

- Apply guidelines consistently across all documentation
- Use templates to ensure consistency
- Regular quality reviews

**Anti-Patterns**:

- Inconsistent formatting across documents
- Missing cross-references
- Poor file organization

### Reference Guides (Move to `/guides/`)

#### Prioritization Methods Pattern

**When to Use**: When choosing what to work on next
**Application Pattern**:

1. **Select Framework**: Choose ICE, RICE, WSJF, or other framework
2. **Define Criteria**: Establish clear criteria for evaluation
3. **Score Items**: Apply consistent scoring methodology
4. **Rank Results**: Order items by priority score
5. **Validate Decisions**: Review rankings for reasonableness

**Best Practices**:

- Use consistent scoring scales
- Include multiple stakeholders in evaluation
- Regular re-prioritization

**Anti-Patterns**:

- Inconsistent scoring criteria
- Ignoring qualitative factors
- Infrequent re-prioritization

#### Technical Debt Prioritization Pattern

**When to Use**: When evaluating technical debt items
**Application Pattern**:

1. **Assess Impact**: Evaluate business and technical impact
2. **Measure Effort**: Estimate effort required for resolution
3. **Calculate Priority**: Use technical debt formula
4. **Consider Dependencies**: Account for blocking relationships
5. **Plan Resolution**: Schedule debt reduction activities

**Best Practices**:

- Regular technical debt assessments
- Balance new features with debt reduction
- Track debt reduction progress

**Anti-Patterns**:

- Ignoring technical debt
- Prioritizing only new features
- No debt reduction planning

### Processes (Move to `/processes/`)

#### Implementation Approach Pattern

**When to Use**: When planning significant system changes
**Application Pattern**:

1. **Phase 1 (R&D)**: Research alternatives, build proof-of-concepts
2. **Phase 2 (Preparation)**: Refactor codebase, establish patterns
3. **Phase 3 (Full Integration)**: Implement changes incrementally
4. **Phase 4 (Optimization)**: Optimize performance and add features

**Best Practices**:

- Complete each phase before moving to next
- Document decisions and rationale
- Regular progress reviews

**Anti-Patterns**:

- Skipping phases
- Insufficient research in Phase 1
- Rushing to implementation

#### Ideas to Proposals Workflow Pattern

**When to Use**: When developing new features or improvements
**Application Pattern**:

1. **Idea Generation**: Capture and document ideas
2. **Initial Analysis**: Quick assessment of feasibility
3. **Detailed Exploration**: In-depth research and analysis
4. **Proposal Creation**: Formal proposal with implementation plan
5. **Review and Approval**: Stakeholder review and decision

**Best Practices**:

- Encourage diverse idea sources
- Quick initial screening
- Thorough exploration for promising ideas

**Anti-Patterns**:

- Over-analysis of simple ideas
- Insufficient exploration of complex ideas
- Bypassing approval process

## Decision Framework

### Methodology Selection Decision Tree

```
Start
├── Is this a new project or major change?
│   ├── Yes → Use Implementation Approach (4-phase)
│   └── No → Continue
├── Do you need to choose what to work on?
│   ├── Yes → Use Prioritization Methods
│   └── No → Continue
├── Are you evaluating technical debt?
│   ├── Yes → Use Technical Debt Prioritization
│   └── No → Continue
├── Are you developing new ideas?
│   ├── Yes → Use Ideas to Proposals Workflow
│   └── No → Continue
└── Always apply Context Documentation and Documentation Guidelines
```

### Complexity Assessment Matrix

| Project Complexity | Recommended Methodologies                                   |
| ------------------ | ----------------------------------------------------------- |
| **Low**            | Context Documentation + Documentation Guidelines            |
| **Medium**         | Add Prioritization Methods + Ideas to Proposals             |
| **High**           | Add Implementation Approach + Technical Debt Prioritization |
| **Very High**      | All methodologies with iterative application                |

## Application Scenarios

### Scenario 1: New Feature Development

**Context**: Team wants to add user authentication to existing application
**Methodologies Applied**:

1. **Context Documentation**: Document current authentication state and requirements
2. **Ideas to Proposals Workflow**: Generate and evaluate authentication options
3. **Prioritization Methods**: Choose between different authentication approaches
4. **Implementation Approach**: Plan and execute the implementation
5. **Documentation Guidelines**: Ensure all documentation follows standards

### Scenario 2: Technical Debt Reduction

**Context**: Application has accumulated technical debt affecting performance
**Methodologies Applied**:

1. **Context Documentation**: Document current system state and debt impact
2. **Technical Debt Prioritization**: Evaluate and rank debt items
3. **Prioritization Methods**: Balance debt reduction with new features
4. **Implementation Approach**: Plan debt reduction implementation
5. **Documentation Guidelines**: Document debt reduction progress

### Scenario 3: Process Improvement

**Context**: Team wants to improve their development workflow
**Methodologies Applied**:

1. **Context Documentation**: Document current workflow and pain points
2. **Ideas to Proposals Workflow**: Generate improvement ideas
3. **Prioritization Methods**: Choose which improvements to implement
4. **Implementation Approach**: Plan and execute workflow changes
5. **Documentation Guidelines**: Document new processes and procedures

## Quality Assurance

### Pattern Validation Checklist

- [ ] **Appropriate Methodology Selection**: Right methodology for the problem
- [ ] **Complete Application**: All phases/steps completed
- [ ] **Consistent Application**: Same approach used across similar problems
- [ ] **Documentation Quality**: All outputs follow documentation guidelines
- [ ] **Context Integration**: Context documentation supports methodology application
- [ ] **Cross-Reference Completeness**: All related documents properly linked

### Anti-Pattern Detection

- **Methodology Hopping**: Switching methodologies mid-process
- **Over-Engineering**: Using complex methodologies for simple problems
- **Under-Engineering**: Using simple approaches for complex problems
- **Documentation Neglect**: Failing to document methodology application
- **Context Ignorance**: Applying methodologies without proper context

## Integration with Commands

### Command-Specific Patterns

#### Create Task Command

**Required Methodologies**:

- Context Documentation (for task context)
- Documentation Guidelines (for task document)
- Prioritization Methods (for task prioritization)
- Implementation Approach (for complex tasks)

#### Create Proposal Command

**Required Methodologies**:

- Context Documentation (for proposal context)
- Documentation Guidelines (for proposal document)
- Ideas to Proposals Workflow (for proposal development)

#### Analyze Project Command

**Required Methodologies**:

- Context Documentation (for project context)
- Documentation Guidelines (for analysis document)
- Technical Debt Prioritization (for debt assessment)

## Related Documents

- [Methodology Usage Guide](mdc:methodology/methodology-usage-guide.md) - **START HERE** for practical guidance
- [Methodology Integration Guide](mdc:methodology/methodology-integration-guide.md)
- [Context Documentation](mdc:methodology/context-documentation.md)
- [Documentation Guidelines](mdc:methodology/documentation-guidelines.md)
- [Implementation Approach](mdc:processes/implementation-approach.md)
- [Ideas to Proposals Workflow](mdc:processes/ideas-to-proposals-workflow.md)
- [Prioritization Methods](mdc:guides/guide-prioritization-methods.md)
- [Commands and Methodology Improvement Task](mdc:workflows/tasks/task-2025-01-commands-methodology-improvement.md)

---

**Last Updated**: 2025-01-27
