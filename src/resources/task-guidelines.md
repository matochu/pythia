# Task Management Guidelines

## Task Creation Best Practices

### Naming Convention

- Format: `task-YYYY-MM-descriptive-name.md`
- Use kebab-case for descriptive names
- Be specific but concise (3-5 words max)

### Priority Levels

- **Critical**: System-breaking issues, security vulnerabilities
- **High**: Important features, major improvements
- **Medium**: Standard features, optimizations
- **Low**: Nice-to-have features, minor improvements

### Complexity Assessment

- **Low**: Simple changes, single component, < 1 day
- **Medium**: Multiple components, some dependencies, 1-3 days
- **High**: Complex changes, multiple dependencies, > 3 days

## Task Structure Requirements

### Required Sections

1. **Overview** - Basic metadata and status
2. **Summary** - Brief description of what needs to be done
3. **Context** - Background and rationale
4. **Objectives** - Specific, measurable goals
5. **Scope** - In-scope and out-of-scope items
6. **Implementation Plan** - Phased approach with checkboxes
7. **Success Criteria** - Measurable completion criteria
8. **Dependencies** - Other tasks or components
9. **Quality Control** - Testing and validation steps
10. **Progress Tracking** - Status updates

### Optional Sections

- **Risks and Mitigation** - For complex tasks
- **Technical Approach** - For implementation details
- **Testing Strategy** - For complex features
- **Performance Considerations** - For performance-critical tasks

## Context Integration

### Context Document Requirements

- **High Complexity Tasks**: Must reference ≥1 context document
- **Medium Complexity Tasks**: Should reference context documents
- **Low Complexity Tasks**: Context documents optional

### Context Document Types

- **Domain Context**: Business logic, user workflows
- **Technical Context**: Architecture, implementation details
- **Process Context**: Development workflows, methodologies
- **Reference Context**: Standards, guidelines, external dependencies

## Quality Control Process

### AI Solution Analysis

- **Required for**: All medium and high complexity tasks
- **Command**: Use `@analyze-ai-solutions.md`
- **Timing**: Before implementation and after major changes

### Self-Review Checklist

- [ ] All sections completed with meaningful content
- [ ] Objectives are specific and measurable
- [ ] Implementation steps are actionable
- [ ] Success criteria are objective
- [ ] Dependencies are identified and linked
- [ ] Context documents are properly referenced
- [ ] Document is written in English
- [ ] Markdown formatting is consistent

## Progress Tracking

### Status Values

- **Not Started**: Task created but not begun
- **In Progress**: Active development
- **Under Review**: Awaiting review or approval
- **Blocked**: Cannot proceed due to dependencies
- **Completed**: All work finished and validated

### Progress Updates

- Update status after each major phase
- Document key decisions and changes
- Add file changes to tracking section
- Update context documents with insights

## File Organization

### Directory Structure

```
.pythia/workflows/tasks/
├── task-2025-01-implement-auth.md
├── task-2025-01-refactor-database.md
└── task-2025-02-optimize-performance.md
```

### Cross-References

- Use `mdc:` links for internal references
- Link to related context documents
- Reference other tasks when appropriate
- Update related documents when creating new tasks

## Integration with Other Commands

### Related Commands

- `@create-context.md` - For context document creation
- `@analyze-ai-solutions.md` - For quality control
- `@report-workflows.md` - For status reporting
- `@manage-task.md` - For task management

### Template Usage

- Use `templates/task-template.md` as base structure
- Customize sections based on task complexity
- Include all required metadata
- Follow established formatting conventions

## Common Issues and Solutions

### Vague Objectives

- **Problem**: Objectives too general or unmeasurable
- **Solution**: Make objectives specific with clear success criteria

### Missing Dependencies

- **Problem**: Dependencies not identified
- **Solution**: Review task in context of broader system

### Incomplete Implementation Plan

- **Problem**: Steps too high-level
- **Solution**: Break down into specific, actionable steps

### Poor Context Integration

- **Problem**: No context documents referenced
- **Solution**: Create or identify relevant context documents

---

_Last Updated: 2025-09-15_
