# Methodology Usage Guide

## Summary

This guide explains when and how to use each methodology document in the Pythia framework. It provides practical scenarios, decision trees, and integration patterns to help you choose the right methodologies for your specific needs.

## Purpose

This guide serves as your practical reference for:

- **When to use each methodology**: Clear decision criteria for methodology selection
- **How methodologies work together**: Integration patterns and combinations
- **Real-world application scenarios**: Practical examples of methodology usage
- **Decision frameworks**: Structured approaches for choosing methodologies
- **Quality assurance**: Ensuring effective methodology application

## Methodology Overview

### Core Methodology Documents

#### 1. **Context Documentation** (`context-documentation.md`)

**What it is**: Foundation methodology for capturing structured information needed for decision-making
**When to use**: ALWAYS - as the foundation for any other methodology
**Key purpose**: Understand "why" and "what" before "how"

#### 2. **Documentation Guidelines** (`documentation-guidelines.md`)

**What it is**: Standards and principles for creating and maintaining documentation
**When to use**: When creating or updating ANY documentation
**Key purpose**: Ensure consistent, high-quality documentation

#### 3. **Methodology Integration Guide** (`methodology-integration-guide.md`)

**What it is**: Master guide for combining multiple methodologies effectively
**When to use**: When you need to use multiple methodologies together
**Key purpose**: Ensure methodologies work together harmoniously

#### 4. **Methodology Application Patterns** (`methodology-application-patterns.md`)

**What it is**: Standardized patterns and best practices for applying methodologies
**When to use**: When applying methodologies to ensure consistency and quality
**Key purpose**: Apply methodologies effectively using proven patterns

#### 5. **Methodology Consistency Checker** (`methodology-consistency-checker.md`)

**What it is**: Validation framework for ensuring methodology consistency
**When to use**: When reviewing or validating methodology application
**Key purpose**: Ensure methodologies are applied consistently and correctly

#### 6. **Methodology Effectiveness Framework** (`methodology-effectiveness-framework.md`)

**What it is**: Measurement and improvement system for methodology effectiveness
**When to use**: When measuring methodology impact and planning improvements
**Key purpose**: Ensure methodologies deliver value and can be improved

## Decision Framework: When to Use Each Methodology

### Quick Decision Tree

```
Start: What are you trying to accomplish?
├── Creating/updating documentation?
│   ├── Yes → Use Documentation Guidelines
│   └── No → Continue
├── Need to understand context first?
│   ├── Yes → Use Context Documentation
│   └── No → Continue
├── Using multiple methodologies together?
│   ├── Yes → Use Methodology Integration Guide
│   └── No → Continue
├── Applying methodologies systematically?
│   ├── Yes → Use Methodology Application Patterns
│   └── No → Continue
├── Validating methodology application?
│   ├── Yes → Use Methodology Consistency Checker
│   └── No → Continue
└── Measuring methodology effectiveness?
    ├── Yes → Use Methodology Effectiveness Framework
    └── No → Continue
```

### Detailed Decision Matrix

| Situation                        | Primary Methodology                             | Supporting Methodologies      | Purpose                        |
| -------------------------------- | ----------------------------------------------- | ----------------------------- | ------------------------------ |
| **Starting a new project**       | Context Documentation                           | Documentation Guidelines      | Establish project foundation   |
| **Creating any document**        | Documentation Guidelines                        | Context Documentation         | Ensure quality and consistency |
| **Planning major changes**       | Context Documentation + Implementation Approach | Methodology Integration Guide | Comprehensive planning         |
| **Choosing what to work on**     | Prioritization Methods                          | Context Documentation         | Informed decision-making       |
| **Evaluating technical debt**    | Technical Debt Prioritization                   | Prioritization Methods        | Systematic debt assessment     |
| **Developing new ideas**         | Ideas to Proposals Workflow                     | Context Documentation         | Structured idea development    |
| **Using multiple methodologies** | Methodology Integration Guide                   | All relevant methodologies    | Coordinated application        |
| **Applying methodologies**       | Methodology Application Patterns                | Specific methodologies        | Consistent application         |
| **Validating methodology usage** | Methodology Consistency Checker                 | All methodologies             | Quality assurance              |
| **Measuring methodology impact** | Methodology Effectiveness Framework             | All methodologies             | Continuous improvement         |

## Integration Patterns: How Methodologies Work Together

### Pattern 1: Foundation Setup

**Use Case**: Starting a new project or major initiative
**Methodologies**:

1. **Context Documentation** - Establish project context
2. **Documentation Guidelines** - Set up documentation standards
3. **Methodology Integration Guide** - Plan methodology usage

**Process**:

```markdown
1. Create context document for the project
2. Apply documentation guidelines to all project documentation
3. Use methodology integration guide to plan methodology usage
4. Establish regular methodology application patterns
```

### Pattern 2: Decision Making

**Use Case**: Choosing what to work on next
**Methodologies**:

1. **Context Documentation** - Understand current situation
2. **Prioritization Methods** - Evaluate options systematically
3. **Methodology Application Patterns** - Apply prioritization consistently

**Process**:

```markdown
1. Document current context and constraints
2. Apply prioritization framework (ICE, RICE, WSJF)
3. Use application patterns for consistent evaluation
4. Document decision rationale
```

### Pattern 3: Change Implementation

**Use Case**: Implementing significant system changes
**Methodologies**:

1. **Context Documentation** - Understand current state and requirements
2. **Implementation Approach** - Plan the implementation phases
3. **Methodology Application Patterns** - Apply implementation systematically
4. **Methodology Consistency Checker** - Validate implementation approach

**Process**:

```markdown
1. Document current system context and change requirements
2. Use 4-phase implementation approach
3. Apply implementation patterns consistently
4. Validate approach using consistency checker
```

### Pattern 4: Quality Assurance

**Use Case**: Ensuring methodology application quality
**Methodologies**:

1. **Methodology Consistency Checker** - Validate application
2. **Methodology Effectiveness Framework** - Measure impact
3. **Methodology Application Patterns** - Improve application

**Process**:

```markdown
1. Run consistency checks on methodology application
2. Measure effectiveness using defined metrics
3. Apply improvement patterns based on findings
4. Update methodology usage based on results
```

## Practical Application Scenarios

### Scenario 1: New Feature Development

**Context**: Team wants to add user authentication to existing application

**Methodologies Applied**:

1. **Context Documentation** - Document current authentication state and requirements
2. **Documentation Guidelines** - Ensure all documentation follows standards
3. **Ideas to Proposals Workflow** - Generate and evaluate authentication options
4. **Prioritization Methods** - Choose between different authentication approaches
5. **Implementation Approach** - Plan and execute the implementation
6. **Methodology Application Patterns** - Apply all methodologies consistently

**Process**:

```markdown
1. Create context document for authentication requirements
2. Apply documentation guidelines to all authentication docs
3. Use ideas-to-proposals workflow to explore options
4. Apply prioritization methods to choose best approach
5. Use implementation approach for systematic implementation
6. Apply patterns throughout for consistency
```

### Scenario 2: Technical Debt Reduction

**Context**: Application has accumulated technical debt affecting performance

**Methodologies Applied**:

1. **Context Documentation** - Document current system state and debt impact
2. **Technical Debt Prioritization** - Evaluate and rank debt items
3. **Prioritization Methods** - Balance debt reduction with new features
4. **Implementation Approach** - Plan debt reduction implementation
5. **Methodology Consistency Checker** - Validate debt reduction approach

**Process**:

```markdown
1. Document current system context and debt impact
2. Apply technical debt prioritization framework
3. Use general prioritization to balance with new features
4. Plan implementation using 4-phase approach
5. Validate approach using consistency checker
```

### Scenario 3: Process Improvement

**Context**: Team wants to improve their development workflow

**Methodologies Applied**:

1. **Context Documentation** - Document current workflow and pain points
2. **Ideas to Proposals Workflow** - Generate improvement ideas
3. **Prioritization Methods** - Choose which improvements to implement
4. **Implementation Approach** - Plan and execute workflow changes
5. **Methodology Effectiveness Framework** - Measure improvement impact

**Process**:

```markdown
1. Document current workflow context and pain points
2. Use ideas-to-proposals workflow for improvement ideas
3. Apply prioritization methods to choose improvements
4. Plan implementation using systematic approach
5. Measure effectiveness of improvements
```

## Quality Assurance Checklist

### Before Using Any Methodology

- [ ] **Context Ready**: Do you have sufficient context to make informed decisions?
- [ ] **Documentation Standards**: Are you following documentation guidelines?
- [ ] **Methodology Selection**: Have you chosen the right methodology for your situation?
- [ ] **Integration Planning**: Do you need to combine multiple methodologies?

### During Methodology Application

- [ ] **Pattern Compliance**: Are you following established application patterns?
- [ ] **Consistency Check**: Are you applying methodologies consistently?
- [ ] **Quality Standards**: Are you meeting established quality criteria?
- [ ] **Cross-References**: Are you maintaining proper cross-references?

### After Methodology Application

- [ ] **Effectiveness Measurement**: Are you measuring methodology impact?
- [ ] **Feedback Collection**: Are you gathering user feedback?
- [ ] **Improvement Planning**: Are you planning methodology improvements?
- [ ] **Documentation Updates**: Are you updating methodology documentation?

## Common Anti-Patterns to Avoid

### 1. **Methodology Isolation**

**Problem**: Using methodologies in isolation without considering integration
**Solution**: Always use Methodology Integration Guide when combining methodologies

### 2. **Context Neglect**

**Problem**: Applying methodologies without proper context understanding
**Solution**: Always start with Context Documentation before other methodologies

### 3. **Inconsistent Application**

**Problem**: Applying methodologies differently across similar situations
**Solution**: Use Methodology Application Patterns for consistent application

### 4. **Quality Neglect**

**Problem**: Failing to validate methodology application quality
**Solution**: Use Methodology Consistency Checker regularly

### 5. **Effectiveness Ignorance**

**Problem**: Not measuring methodology impact and effectiveness
**Solution**: Use Methodology Effectiveness Framework to measure and improve

## Integration with Commands

### Command-Specific Methodology Usage

#### Create Task Command

**Required Methodologies**:

- **Context Documentation** - For task context and requirements
- **Documentation Guidelines** - For task document quality
- **Methodology Application Patterns** - For consistent task creation

#### Create Proposal Command

**Required Methodologies**:

- **Context Documentation** - For proposal context
- **Ideas to Proposals Workflow** - For proposal development
- **Documentation Guidelines** - For proposal document quality

#### Analyze Project Command

**Required Methodologies**:

- **Context Documentation** - For project context
- **Technical Debt Prioritization** - For debt assessment
- **Methodology Consistency Checker** - For analysis quality

## Related Documents

- [Context Documentation](mdc:methodology/context-documentation.md)
- [Documentation Guidelines](mdc:methodology/documentation-guidelines.md)
- [Methodology Integration Guide](mdc:methodology/methodology-integration-guide.md)
- [Methodology Application Patterns](mdc:methodology/methodology-application-patterns.md)
- [Methodology Consistency Checker](mdc:methodology/methodology-consistency-checker.md)
- [Methodology Effectiveness Framework](mdc:methodology/methodology-effectiveness-framework.md)
- [Implementation Approach](mdc:processes/implementation-approach.md)
- [Ideas to Proposals Workflow](mdc:processes/ideas-to-proposals-workflow.md)
- [Prioritization Methods](mdc:guides/prioritization-methods.md)
- [Technical Debt Prioritization](mdc:guides/technical-debt-prioritization.md)

---

**Last Updated**: 2025-01-27
