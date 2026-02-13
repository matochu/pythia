# Adaptation Patterns: Common Skill Adaptation Scenarios

This document provides detailed patterns and examples for adapting Agent Skills to specific project needs.

## Overview

Skills often need adaptation to fit specific project requirements. This guide covers three main adaptation scenarios:

1. **Modifying** skill for specific project needs
2. **Combining** multiple skills
3. **Forking** skill to create project-specific variant

## Pattern 1: Modifying Skill for Specific Project Needs

### When to Use

- Skill is mostly suitable but needs project-specific customization
- Examples need to match project stack
- Compatibility metadata needs updating
- Project conventions differ from skill defaults

### Steps

1. **Preserve Original Skill**
   - Option A: Install original via `npx skills add <owner/repo>` (preserves source)
   - Option B: Use git submodule to track original
   - Option C: Document original source in adaptation log

2. **Analyze Skill Structure**
   - Identify components: SKILL.md, references/, scripts/, examples/
   - Map customizable parts: metadata, examples, rules, procedures

3. **Modify Components**
   - Update compatibility metadata for project requirements
   - Replace examples with project-specific examples
   - Add project-specific rules or procedures
   - Customize scripts for project stack (if needed)

4. **Preserve Attribution**
   - Keep original author credit
   - Link to original skill repository
   - Document changes in adaptation log

5. **Install Adapted Skill**
   - Install to `.cursor/skills/{skill-name}/` (if replacing)
   - Or `.cursor/skills/{skill-name}-custom/` (if keeping original)

### Example: Adapting React Skill for Next.js

**Original skill**: `react-best-practices` (from vercel-labs/agent-skills)

**Adaptation**:
1. Install original: `npx skills add vercel-labs/agent-skills`
2. Copy to custom: `.cursor/skills/react-best-practices-nextjs/`
3. Modify SKILL.md:
   - Update compatibility: `"Next.js 14+, React 18+"`
   - Replace React examples with Next.js patterns (App Router, Server Components)
   - Add Next.js-specific rules (file conventions, routing patterns)
4. Create `references/adaptation-log.md`:
   ```markdown
   # Adaptation Log
   
   **Original**: vercel-labs/agent-skills/react-best-practices
   **Adapted**: 2026-02-12
   **Changes**:
   - Updated compatibility for Next.js 14+
   - Replaced React examples with Next.js App Router patterns
   - Added Next.js-specific file conventions
   ```

### Template: Adaptation Log

```markdown
# Adaptation Log: {skill-name}

**Original Source**: {owner/repo}/{skill-name}
**Original URL**: {github-url}
**Adaptation Date**: {date}
**Adapted By**: {your-name}

## Changes Made

### Metadata
- [ ] Compatibility updated: {old} → {new}
- [ ] Description modified: {changes}

### Examples
- [ ] Examples replaced with project-specific examples
- [ ] Examples updated for project stack: {stack}

### Rules/Procedures
- [ ] Added project-specific rules: {rules}
- [ ] Modified procedures: {changes}

### Scripts
- [ ] Scripts customized: {scripts}
- [ ] Dependencies updated: {deps}

## Original Attribution

Original skill created by {author} at {repo}.
```

## Pattern 2: Combining Multiple Skills

### When to Use

- Multiple skills have overlapping functionality
- Skills complement each other
- Need unified interface for related skills
- Want to reduce skill count in `.cursor/skills/`

### Steps

1. **Identify Overlapping Functionality**
   - Map features of each skill
   - Identify overlaps and conflicts
   - Determine which parts to merge

2. **Detect Conflicts**
   - Conflicting rules (e.g., different coding styles)
   - Duplicate commands or procedures
   - Incompatible dependencies

3. **Merge Compatible Parts**
   - Combine rules (resolve conflicts)
   - Merge procedures (unify workflows)
   - Consolidate examples

4. **Create Wrapper Skill**
   - New SKILL.md that references combined functionality
   - Document dependencies on source skills
   - Preserve attribution for all sources

5. **Document Dependencies**
   - List all source skills
   - Document relationships
   - Note any conflicts resolved

### Example: Combining Testing Skills

**Skills to combine**:
- `test-generator` (unit tests)
- `e2e-testing` (end-to-end tests)
- `test-debugging` (test debugging)

**Combined skill**: `comprehensive-testing`

**Process**:
1. Analyze each skill's scope
2. Identify overlaps (test setup, test patterns)
3. Resolve conflicts (different test frameworks → support both)
4. Create unified SKILL.md:
   ```markdown
   # Comprehensive Testing
   
   Combines functionality from:
   - test-generator (unit test generation)
   - e2e-testing (end-to-end test patterns)
   - test-debugging (debugging test failures)
   
   ## Dependencies
   - Original skills preserved in references/
   ```

### Template: Combined Skill Structure

```
comprehensive-skill/
├── SKILL.md              # Main skill with combined functionality
├── references/
│   ├── source-skills.md  # List of source skills
│   ├── conflicts-resolved.md  # Conflicts and resolutions
│   └── adaptation-log.md     # Adaptation history
└── examples/
    └── combined-usage.md # Examples using combined functionality
```

## Pattern 3: Forking Skill for Project-Specific Variant

### When to Use

- Need significant modifications from original
- Project has unique requirements
- Want to maintain separate version
- Original skill doesn't fit project needs

### Steps

1. **Fork with Attribution**
   - Copy original skill directory
   - Preserve original attribution in SKILL.md
   - Link to original repository

2. **Adapt to Project Stack**
   - Modify for project tech stack
   - Update conventions to match project
   - Customize examples for project domain

3. **Document Differences**
   - Create differences document
   - Explain why changes were made
   - Note incompatibilities with original

4. **Install Forked Skill**
   - Install to `.cursor/skills/{skill-name}-custom/`
   - Or `.cursor/skills/{project-name}-{skill-name}/`
   - Keep original reference for updates

5. **Maintain Update Path**
   - Document how to sync with original (if needed)
   - Note breaking changes from original
   - Consider contributing changes back to original

### Example: Forking Planning Skill for Feature Planning

**Original skill**: `project-planning` (general project planning)

**Forked skill**: `feature-planning-workflow` (specific to feature development workflow)

**Process**:
1. Fork original: Copy to `.cursor/skills/feature-planning-workflow/`
2. Modify SKILL.md:
   - Update description: "Plan features using structured workflow. Use when starting new features."
   - Add feature-specific procedures (PRD → plan → review → implement)
   - Include project-specific templates
3. Create `references/differences.md`:
   ```markdown
   # Differences from Original
   
   **Original**: project-planning
   **Fork**: feature-planning-workflow
   
   ## Changes
   - Focused on feature planning (not general project planning)
   - Added feature-specific workflow (PRD → plan → review)
   - Integrated with project's plan stabilization loop
   - Added feature-specific templates
   
   ## Incompatibilities
   - Removed general project management procedures
   - Focused on feature lifecycle only
   ```

### Template: Forked Skill Attribution

```markdown
---
name: {forked-skill-name}
description: {forked description}
compatibility: {compatibility}
---

# {Forked Skill Name}

**Forked from**: {original-owner}/{original-repo}/{original-skill}
**Original URL**: {github-url}
**Fork Date**: {date}
**Fork Reason**: {why forked}

## Differences from Original

{List of key differences}

## Original Attribution

Original skill created by {author} at {repo}.
This fork maintains compatibility with {project-name} conventions.
```

## Best Practices

### Preservation
- Always preserve original skill attribution
- Link to original repository
- Document all changes made

### Documentation
- Create adaptation log for all changes
- Document conflicts resolved
- Explain adaptation rationale

### Installation
- Use `-custom` suffix for adapted skills
- Keep original skill reference
- Consider git submodule for version tracking

### Testing
- Test adapted skill before committing
- Verify compatibility with project
- Check for conflicts with other skills

## Common Adaptation Scenarios

### Scenario A: Stack-Specific Adaptation
- **Original**: General skill (e.g., "API development")
- **Adapted**: Stack-specific (e.g., "Next.js API routes")
- **Changes**: Examples, conventions, stack-specific patterns

### Scenario B: Workflow Integration
- **Original**: Standalone skill
- **Adapted**: Integrated with project workflow
- **Changes**: Procedures, templates, integration points

### Scenario C: Convention Alignment
- **Original**: Generic conventions
- **Adapted**: Project-specific conventions
- **Changes**: Rules, style guides, naming conventions

## References

- **Agent Skills Specification**: https://agentskills.io/specification
- **Catalog Guide**: See catalog-guide.md for installation methods
