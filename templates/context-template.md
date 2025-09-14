# Context Template

> **Purpose**: This template provides a standardized structure for context documents that support decision-making and task creation workflows.

## When to Use This Template

Use this template for creating general context documents that provide background information, domain knowledge, and decision-making support. For other document types, use:

- **Analysis Template**: For research findings and data-driven insights
- **Guide Template**: For step-by-step instructions
- **Reference Template**: For specifications and standards

## Template Structure

```markdown
---
title: [Context Title]
type: context
category: [domain|technical|analysis|process|reference]
subcategory: [specific folder name]
created: YYYY-MM-DD
lastUpdated: YYYY-MM-DD
status: [draft|review|approved|deprecated]
tags: [tag1, tag2, tag3]
relatedContexts: []
---

# Context: [Short Title]

## Summary

Brief 2-3 sentence overview of what this context covers and why it's important.

## Current State

Description of the current situation, existing implementations, or baseline state.

## Key Information

### Core Concepts

- [Key concept 1]
- [Key concept 2]
- [Key concept 3]

### Constraints and Limitations

- [Constraint 1]
- [Constraint 2]

### Patterns and Practices

- [Pattern 1 with example]
- [Pattern 2 with example]

## Technical Details

### Implementation Specifics

[Technical details, code examples, configurations]

### Dependencies

- [Dependency 1]
- [Dependency 2]

## Questions and Answers

### Common Questions

- **Q**: [Question]
  **A**: [Answer]

### Edge Cases

- **Case**: [Edge case description]
  **Solution**: [How it's handled]

## Impact and Considerations

### Performance Impact

[Performance considerations specific to project environment]

### Accessibility Impact

[Accessibility considerations if applicable]

### Maintenance Considerations

[Long-term maintenance aspects]

## Resources and Artifacts

### Code References

- [File/component references]
- [Configuration files]

### External Resources

- [Documentation links]
- [Specifications]
- [Research papers]

## Related Documents

- **Related Contexts**: [mdc:.pythia/contexts/...]
- **Related Tasks**: [mdc:.pythia/workflows/tasks/...]
- **Related Proposals**: [mdc:.pythia/workflows/proposals/...]
- **Related Decisions**: [mdc:.pythia/workflows/decisions/...]

## Change History

| Date       | Change           | Author | Version |
| ---------- | ---------------- | ------ | ------- |
| YYYY-MM-DD | Initial creation | [Name] | 1.0.0   |
```

## Section Guidelines

### Metadata (YAML Frontmatter)

- **title**: Clear, descriptive title
- **type**: Always "context" for this template
- **category**: Main category (domain/technical/analysis/process/reference)
- **subcategory**: Specific folder/area within category
- **status**: draft → review → approved → deprecated
- **tags**: Relevant tags for discovery (see tagging guidelines)
- **relatedContexts**: Array of related context file paths

### Summary

- Keep to 2-3 sentences maximum
- Explain what the context covers and why it matters
- Should be understandable without reading the full document

### Current State

- Describe the baseline or existing situation
- Provide context for why this document is needed
- Include relevant background information

### Key Information

Structure the core content into logical subsections:

**Core Concepts**: Fundamental ideas, definitions, principles
**Constraints and Limitations**: What restricts or limits options
**Patterns and Practices**: Established ways of doing things

### Technical Details

Include implementation-specific information:

- Code examples and configurations
- System dependencies
- Integration points
- Architecture considerations

### Questions and Answers

Address common questions and edge cases:

- Frequently asked questions
- Non-obvious scenarios
- Decision criteria
- Troubleshooting information

### Impact and Considerations

Analyze the broader implications:

- Performance impact on the system
- Accessibility considerations
- Long-term maintenance aspects
- Risk factors

### Resources and Artifacts

Link to supporting materials:

- Code repositories and specific files
- Configuration files and templates
- External documentation and specifications
- Research papers and references

### Related Documents

Maintain bidirectional links:

- Other context documents on related topics
- Tasks that depend on this context
- Proposals that reference this context
- Decisions that relate to this context

### Change History

Track document evolution:

- Date of changes
- Description of what changed
- Author of changes
- Version number

## Tagging Guidelines

### Domain Tags (Functional Areas)

- `content`, `navigation`, `authentication`, `user-experience`
- `architecture`, `performance`, `data-management`, `integration`

### Technical Tags (Technologies)

- `react`, `redux`, `typescript`, `webgl`, `scss`
- `lrud`, `state-management`, `caching`

### Project-Specific Tags

- `tv-specific`, `offline-support`, `accessibility`
- `remote-control`, `focus-management`

### Status Tags

- `experimental`, `deprecated`, `recommended`
- `current`, `historical`, `prospective`

## Quality Checklist

Before finalizing a context document, verify:

- [ ] **Clarity**: Purpose and content are clear and understandable
- [ ] **Completeness**: All required sections are present and filled
- [ ] **Connectedness**: Proper links to related documents using `mdc:` format
- [ ] **Task Integration**: Context supports task creation workflow
- [ ] **Metadata**: All YAML frontmatter fields are properly filled
- [ ] **Structure**: Document follows the template structure
- [ ] **Tags**: Appropriate tags are assigned for easy discovery
- [ ] **Self-Contained**: Content is understandable without external context
- [ ] **Practical**: Includes relevant examples and code snippets
- [ ] **Current**: Information is up-to-date and accurate

## Best Practices

### Content Guidelines

- Focus on "why" and "what" rather than "how" (save "how" for guides)
- Include practical examples and code snippets where relevant
- Keep content concise but comprehensive
- Use consistent language and terminology
- Ensure content is self-contained but well-linked

### Cross-Reference Management

- Always create bidirectional links
- Update related documents when adding new contexts
- Use `mdc:` format for internal links
- Regularly validate link integrity

### Maintenance

- Review and update contexts regularly
- Mark outdated contexts as deprecated
- Archive obsolete contexts rather than deleting
- Update related documents when contexts change

## Integration with Pythia System

This template integrates with other Pythia components:

- **Task Creation**: Contexts inform task creation workflow
- **Decision Support**: Contexts provide information for decision-making
- **Memory Bank**: Contexts complement dynamic session insights
- **Documentation Map**: Contexts are indexed in the documentation map
- **Validation**: Contexts follow validation standards

## References

- [Context Documentation Methodology](mdc:commands/create-context.md)
- [Create Context Command](mdc:commands/create-context.md)
- [Documentation Guidelines](mdc:methodology/documentation-guidelines.md)
- [Validate Documentation](mdc:commands/validate-documentation.md)

---

**Last Updated**: 2025-09-13
