# Quality Checklist: Agent Skills Evaluation

This document provides detailed criteria for evaluating Agent Skills quality before installation or adaptation.

## Evaluation Criteria

Each criterion is scored 0-2 points, for a total of 0-10 points.

### 1. Clear Description (2 points)

**What to check**:
- Description clearly states **when to use** the skill
- Description explains **what problem** the skill solves
- Description includes relevant **keywords** for agent matching
- Description is specific, not vague or overly broad

**Scoring**:
- **2 points**: Clear, specific description with use cases and keywords
- **1 point**: Description exists but lacks specificity or keywords
- **0 points**: Missing description or too vague to be useful

**Example (Good)**:
```yaml
description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF documents that need processing, analysis, or manipulation.
```

**Example (Bad)**:
```yaml
description: PDF stuff
```

### 2. Compatibility Metadata (2 points)

**What to check**:
- Compatibility field is present (if skill has specific requirements)
- Compatibility accurately reflects platform requirements
- Dependencies are clearly stated (if any)
- Version requirements are specified (if needed)

**Scoring**:
- **2 points**: Compatibility metadata present and accurate, or skill is platform-agnostic
- **1 point**: Compatibility mentioned but incomplete or unclear
- **0 points**: Missing compatibility info for platform-specific skill, or incorrect compatibility claims

**Example (Good)**:
```yaml
compatibility: "Cursor (2.4+), requires git and docker"
```

**Example (Bad)**:
```yaml
compatibility: "Works everywhere" # But uses Cursor-specific APIs
```

### 3. Progressive Disclosure (2 points)

**What to check**:
- Main SKILL.md is concise (< 500 lines recommended)
- Detailed information is in `references/` subdirectory
- Core instructions are accessible without loading full details
- Structure follows progressive disclosure pattern

**Scoring**:
- **2 points**: Main doc concise, detailed info in references/, clear structure
- **1 point**: Some progressive disclosure but main doc could be shorter
- **0 points**: All information in main doc, no progressive disclosure, or main doc > 500 lines

**Structure check**:
- Main SKILL.md: Quick reference, core functionality, usage examples, links to references
- References/: Detailed documentation, deep dives, extended examples

### 4. No Overly Broad Rules (2 points)

**What to check**:
- Skill focuses on specific, well-defined problems
- Rules are targeted, not general-purpose
- Skill doesn't try to do everything
- Better to have several narrow skills than one broad skill

**Scoring**:
- **2 points**: Focused, specific guidance, clear boundaries
- **1 point**: Somewhat broad but still useful
- **0 points**: Overly broad, tries to solve everything, lacks focus

**Red flags**:
- Skill claims to handle "all development tasks"
- Rules are too general (e.g., "write good code")
- No clear boundaries on when skill applies

**Example (Good)**: Skill for "PDF text extraction" — focused, specific

**Example (Bad)**: Skill for "all coding tasks" — too broad

### 5. Clear Scripts (2 points)

**What to check**:
- Scripts have minimal side effects
- Clear inputs and outputs documented
- Error handling is defined
- Scripts are executable and well-documented

**Scoring**:
- **2 points**: Scripts have clear I/O, minimal side effects, good documentation
- **1 point**: Scripts exist but documentation or I/O unclear
- **0 points**: Scripts have unclear behavior, many side effects, or no documentation

**If no scripts**: Score 2 points (skill doesn't need scripts)

**Script evaluation**:
- Check `scripts/` directory (if exists)
- Verify scripts have clear purpose
- Check for input/output documentation
- Verify error handling

## Quality Score Interpretation

### High Quality (8-10 points)
- **Recommendation**: Install without hesitation
- **Action**: Proceed with installation

### Medium Quality (6-7 points)
- **Recommendation**: Review before installing
- **Action**: Check specific issues, consider adaptation

### Low Quality (< 6 points)
- **Recommendation**: Skip or needs improvement
- **Action**: Either skip installation or adapt skill before use

## Common Issues and Red Flags

### Critical Issues (Must Fix)
- Missing description
- Incorrect compatibility claims
- Scripts with dangerous side effects
- Name collision with existing skill

### Warning Signs (Review Carefully)
- Overly broad rules
- Main doc > 500 lines without progressive disclosure
- Missing compatibility metadata for platform-specific skill
- Unclear script inputs/outputs

### Minor Issues (Can Adapt)
- Description could be more specific
- Examples could be improved
- References could be better organized

## Evaluation Workflow

1. **Read SKILL.md**: Check main document structure
2. **Check YAML frontmatter**: Verify name, description, compatibility
3. **Review references/**: Check if progressive disclosure is used
4. **Examine scripts/**: If scripts exist, check I/O and side effects
5. **Check examples/**: Verify examples are clear and relevant
6. **Score each criterion**: 0-2 points per criterion
7. **Calculate total**: Sum all scores (0-10)
8. **Identify issues**: List specific problems found
9. **Provide recommendation**: Install / Review / Skip

## Example Evaluation

**Skill**: `pdf-text-extractor`

**Evaluation**:
1. **Clear description**: 2/2 — "Extract text from PDF files. Use when processing PDF documents."
2. **Compatibility metadata**: 2/2 — "Requires pdf-lib library"
3. **Progressive disclosure**: 2/2 — Main doc 200 lines, details in references/
4. **No overly broad rules**: 2/2 — Focused on PDF text extraction
5. **Clear scripts**: 2/2 — Scripts have clear I/O, documented

**Total**: 10/10 — High quality, recommend installation

## References

- **Agent Skills Specification**: https://agentskills.io/specification
- **Creating Skills Best Practices**: See catalog-guide.md
