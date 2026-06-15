---
name: skill-search-and-fit
description: Search and evaluate Agent Skills from major catalogs (Skills.sh, AgentSkills.io, GitHub repos), evaluate quality, and adapt skills to project needs. Use when you need to find relevant skills, check skill quality before installing, or adapt existing skills.
compatibility: 'Cursor, VS Code Copilot, Claude Desktop, OpenCode'
---

# Skill Search and Fit

## ⚡ Quick Reference

**Use when**: You need to discover Agent Skills from catalogs, evaluate skill quality before installation, or adapt existing skills to specific project requirements.

**What it does**: Provides procedures for searching skills across major catalogs (Cursor community repos, Skills.sh, AgentSkills.io, GitHub), evaluating quality using established criteria, and adapting skills to project needs.

**Key capabilities**:

- Search skills across multiple catalogs with prioritized sources
- Evaluate skill quality using structured checklist
- Detect conflicts with existing skills
- Adapt skills for specific project needs (modify, combine, fork)

## Core Functionality

This skill guides LLM to help users discover, evaluate, and adapt Agent Skills. It provides step-by-step procedures for:

1. **Search**: Finding relevant skills across catalogs (Cursor-first approach)
2. **Evaluate**: Assessing skill quality using criteria from knowledge base
3. **Adapt**: Modifying skills for specific project needs

**Note**: This skill provides **prompt-only instructions** for LLM to follow. LLM uses web search capabilities to query catalogs. No API clients or parsers are implemented.

## Search Procedures

Follow these steps in order when searching for skills:

### Step 0: Check Existing Skills (Conflict Detection)

**Before searching external catalogs**, scan `.cursor/skills/` directory:

- List all existing skills
- Check for skills with similar names or functionality
- Identify potential conflicts (name collisions, overlapping functionality)
- If similar skill exists: propose updating existing skill instead of duplicate installation
- Document existing skills found in search results

### Step 1: Search Cursor Community Repos (PRIMARY)

**Priority**: Highest — Cursor-specific skills are most compatible.

**Repositories to search**:

- `chrisboden/cursor-skills` — Starter template with role-based rules
- `daniel-scrivner/cursor-skills` — AI-powered workflows
- `araguaci/cursor-skills` — Best practices and guidelines
- `grapelike-class151/cursor-skills` — Community hub

**Search method**: Use web search to query each repository for relevant skills.

**Prioritize**: Cursor-specific skills over cross-platform skills.

### Step 2: Search Skills.sh Leaderboard (SECONDARY)

**Priority**: High — Popular skills with installation metrics.

**Search locations**:

- All-time leaderboard (by installations)
- Hot/Trending tabs (time-based dynamics)

**Search method**: Use web search to query Skills.sh with keywords, filter by Cursor compatibility first.

**Filter**: Cursor-compatible skills first, then cross-platform skills.

### Step 3: Search AgentSkills.io Catalog (TERTIARY)

**Priority**: Medium — Format specification and integration guide.

**Search method**: Use web search to query AgentSkills.io catalog.

**Filter**: Check Cursor-compatible skills first.

### Step 4: Search GitHub Repos (QUATERNARY)

**Priority**: Lower — Use if no matches in primary sources.

**Repositories to consider**:

- `vercel-labs/skills` — Meta-skills, find-skills
- `vercel-labs/agent-skills` — React, Web Design, RN best practices
- `anthropics/skills` — Official Claude skills (68K+ stars)
- `microsoft/skills` — Enterprise packs
- `remotion-dev/skills` — Best practices
- `obra/superpowers` — Debug, TDD, planning

**Search method**: Use web search to query GitHub repos.

### Step 5: Filter by Compatibility

Check each result for:

- Cursor version requirements (2.4+)
- Project type compatibility
- Required dependencies
- Platform-specific features

### Step 6: Check for Conflicts

For each potential skill, verify:

- No name collision with existing skills
- No functionality overlap with installed skills
- Compatible with project requirements

### Step 7: Rank Results

Rank skills by priority:

1. **Compatibility match** (Cursor-specific > cross-platform)
2. **Conflict status** (no conflicts > minor conflicts)
3. **Popularity** (install count, stars)
4. **Recency** (last updated date)
5. **Quality score** (from evaluation)

### Search Results Format

Present results in this format:

```markdown
## Search Results

### Skill: {name}

- **Repo**: {owner/repo}
- **Description**: {description}
- **Compatibility**: {compatibility} (explicit check)
- **Install**: `npx skills add {owner/repo}` or manual
- **Quality Score**: {score}/10
- **Last Updated**: {date} (if available from repo)
- **Dependencies**: {list of required skills or "None"}
- **Conflicts**: {potential conflicts with existing skills or "None"}
- **Issues**: {list of quality issues or "None"}
```

## Quality Evaluation

Use the quality checklist to evaluate each skill before recommending installation.

### Quick Evaluation Checklist

For each skill, check:

1. **Clear description** (2 points): When to use, what problem solved
2. **Compatibility metadata** (2 points): Present and accurate
3. **Progressive disclosure** (2 points): Short core + optional resources
4. **No overly broad rules** (2 points): Focused, specific guidance
5. **Clear scripts** (2 points): Minimal side effects, clear I/O

### Scoring

- Each criterion: 0-2 points
- Total: 0-10 points
- **≥8**: High quality — recommend installation
- **6-7**: Medium quality — review before installing
- **<6**: Low quality — needs improvement or skip

### Evaluation Output

For each skill, provide:

- Quality score (0-10)
- Specific issues found (if any)
- Recommendation (install / review / skip)

**Detailed evaluation criteria**: See `references/quality-checklist.md`

## Adaptation Guidance

When adapting skills for project needs, follow these scenarios:

### Scenario 1: Modifying Skill for Specific Project Needs

**When**: Skill is mostly suitable but needs project-specific customization.

**Steps**:

1. Check if original skill should be preserved (git submodule or `npx skills add`)
2. Analyze skill structure (SKILL.md, references/, scripts/)
3. Identify customizable parts (metadata, examples, rules, procedures)
4. Modify compatibility metadata to match project requirements
5. Add project-specific rules or examples
6. Customize examples for project stack
7. Preserve original skill structure and attribution
8. Document changes in `references/adaptation-log.md` with original source link

**Installation**: Install adapted skill to `.cursor/skills/{skill-name}/` or `{skill-name}-custom/`

### Scenario 2: Combining Multiple Skills

**When**: Multiple skills have overlapping or complementary functionality.

**Steps**:

1. Identify overlapping functionality between skills
2. Detect conflicts (conflicting rules, duplicate commands)
3. Merge compatible parts (rules, procedures)
4. Create wrapper skill that references multiple skills
5. Document skill dependencies and relationships
6. Preserve attribution for all source skills

**Installation**: Create new skill directory with combined functionality.

### Scenario 3: Creating Project-Specific Variant

**When**: Need to fork skill with significant modifications.

**Steps**:

1. Fork skill with preserved attribution (link to original)
2. Adapt skill to specific project stack (tech, conventions)
3. Document differences from original skill
4. Consider creating `.cursor/skills/{skill-name}-custom/` directory
5. Keep original skill reference for updates

**Installation**: Install to `.cursor/skills/{skill-name}-custom/`

**Detailed adaptation patterns**: See `references/adaptation-patterns.md`

## Installation Guidance

### Installation Methods

1. **Via Skills.sh CLI**: `npx skills add <owner/repo>`
2. **Manual**: Copy skill directory to `.cursor/skills/{skill-name}/`
3. **Git submodule**: For version tracking — `git submodule add <repo> .cursor/skills/{skill-name}`

### Installation Steps

1. Verify skill quality (use evaluation checklist)
2. Check compatibility (Cursor version, dependencies)
3. Check for conflicts (name collisions, functionality overlap)
4. Choose installation method
5. Install to `.cursor/skills/{skill-name}/`
6. Verify installation (check SKILL.md exists, validate YAML frontmatter)

### Post-Installation Validation

After installation, verify:

- SKILL.md file exists in `.cursor/skills/{skill-name}/`
- YAML frontmatter format is valid
- Skill loads in Cursor (verify skill appears in available skills)
- No conflicts with existing skills

## Usage Examples

### Example 1: Search for Planning Skills

**User query**: "Find skills for project planning and task management"

**Skill response**:

1. Scan `.cursor/skills/` for existing planning skills
2. Search Cursor community repos (chrisboden, daniel-scrivner, etc.) for "planning" skills
3. Search Skills.sh leaderboard for planning-related skills
4. Filter by Cursor compatibility
5. Evaluate quality using checklist
6. Present ranked results with quality scores

**Expected outcome**: List of planning skills with compatibility, quality scores, and installation instructions.

### Example 2: Evaluate Skill Quality Before Installing

**User query**: "Should I install the 'test-generator' skill from vercel-labs/skills?"

**Skill response**:

1. Search for skill in vercel-labs/skills repository
2. Retrieve skill metadata and structure
3. Apply quality evaluation checklist:
   - Check description clarity
   - Verify compatibility metadata
   - Check progressive disclosure structure
   - Review for overly broad rules
   - Evaluate scripts (if any)
4. Calculate quality score (0-10)
5. Identify specific issues (if any)
6. Provide recommendation

**Expected outcome**: Quality score, issues found, and install/review/skip recommendation.

### Example 3: Adapt Skill for Specific Project

**User query**: "I found a React skill but need to adapt it for Next.js"

**Skill response**:

1. Analyze original React skill structure
2. Identify parts to modify (examples, rules, compatibility)
3. Guide adaptation:
   - Update compatibility metadata for Next.js
   - Modify examples to use Next.js patterns
   - Add Next.js-specific rules
   - Preserve original attribution
4. Create adaptation log
5. Guide installation of adapted skill

**Expected outcome**: Adapted skill installed with Next.js-specific modifications, original skill preserved.

## References

- **Catalog Guide**: `references/catalog-guide.md` — Detailed catalog locations and search strategies
- **Quality Checklist**: `references/quality-checklist.md` — Detailed evaluation criteria
- **Adaptation Patterns**: `references/adaptation-patterns.md` — Common adaptation patterns and examples

## Related Resources

- **Agent Skills Specification**: https://agentskills.io/specification
- **Skills.sh**: https://skills.sh/
- **AgentSkills.io**: https://agentskills.io/
- **Cursor Skills Docs**: https://cursor.com/docs/context/skills
