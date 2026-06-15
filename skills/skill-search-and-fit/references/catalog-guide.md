# Catalog Guide: Agent Skills Discovery

This guide provides detailed information about major Agent Skills catalogs, repositories, and search strategies. **Primary focus: Cursor and Claude ecosystems**.

## Catalog Locations and Search Strategies

### 1. Cursor — Official Documentation + Community Skills (PRIMARY)

**What it is**: Cursor IDE's native support for Agent Skills stored in `.cursor/skills/` directory.

#### 1.1 Official Cursor Documentation
- **Cursor Docs: Agent Skills** — https://cursor.com/docs/context/skills
  - How Cursor stores/connects skills
  - Skill discovery and loading
  - Integration with Cursor's AI features
- **Cursor Docs: Rules** — How rules can be imported from skills
- **Cursor Blog: agent best practices** — Description of SKILL.md structure

#### 1.2 Cursor Community Skill Repositories
- **chrisboden/cursor-skills** — Starter template with role-based rules system
  - Transforms Cursor into general-purpose AI agent
  - Structure: `.cursor/rules/`, `mcp/`, `skills/`
- **daniel-scrivner/cursor-skills** — AI-powered workflows
  - "Ralph Wiggum technique" for autonomous coding
  - Structured workflow: PRD → task breakdown → code → PR management
- **araguaci/cursor-skills** — Best practices and guidelines
  - DevOps, API, configs, integrations, mobile development
  - Often used as starter template
- **grapelike-class151/cursor-skills** — Community hub
  - Best practices across multiple environments
  - Categories: API, DevOps, mobile, Node.js, PHP, Python, testing, web design

**Storage Location**: `.cursor/skills/{skill-name}/`

**Installation**:
- Manual: Copy skill directory to `.cursor/skills/`
- Git submodule: `git submodule add <repo> .cursor/skills/skill-name`

**Why prioritize**: Cursor is the primary target platform.

### 2. Claude — Official Skills + Community (PRIMARY)

**What it is**: Claude Code and Claude Desktop support for Agent Skills.

#### 2.1 Anthropic Official Skills
- **Repository**: https://github.com/anthropics/skills (68,467 stars)
- **Focus**: Official utility skills for Claude
- **Categories**: Document processing (pdf/docx/xlsx/pptx), coauthoring, webapp testing, mcp-builder
- **Storage**: `.claude/skills/` or `.github/skills/`

#### 2.2 Claude Skills Community
- **claudeskills.org** — Skill Creator documentation and skill cases
  - https://www.claudeskills.org/docs/skills-cases/skill-creator
- **skill.md** — Overview and best practices: https://skill.md/
- **Claude API Agent Skills SDK**: https://platform.claude.com/docs/en/agent-sdk/skills

#### 2.3 Claude-Compatible Skills
- Skills stored in `.github/skills/` work with Claude Code
- VS Code Copilot also uses `.github/skills/` pattern
- Many skills are cross-compatible between Cursor and Claude

**Storage Locations**:
- `.claude/skills/` (Claude Desktop)
- `.github/skills/` (Claude Code, VS Code Copilot)
- `~/.claude/skills/` (user-level)

**Installation**:
- Manual: Copy to `.claude/skills/` or `.github/skills/`
- Via Skills.sh: `npx skills add <owner/repo>` (if compatible)

### 3. Skills.sh — Global Catalog + Installation Leaderboard (SECONDARY)

**What it is**: Public "directory" of agent skills with ratings and quick installation.

**Key pages with lists**:
- **All-time leaderboard** (by installations): Main catalog page (skills.sh/)
  - Shows top skills + repo owner
- **Hot / Trending** (time-based dynamics): skills.sh/hot and skills.sh → Trending/Hot tabs
  - Useful to see what's currently "alive"

**How to install** (universally for packs):
- `npx skills add <owner/repo>` (install entire repo pack)

**What to consider "most popular packs"** (orient by All-time):
- `vercel-labs/skills` (usually top due to "find-skills" and install onboarding)
- `vercel-labs/agent-skills` (best practices / web design / RN skills)
- `anthropics/skills` (basic utility skills: pdf/docx/xlsx/pptx + others)
- `remotion-dev/skills` (best practices)
- `coreyhaines31/marketingskills` (marketing/seo/copy)
- `obra/superpowers` (pack of "superpowers": debug, TDD, planning, etc.)

**Note**: Skills.sh shows both top skills and which repo they belong to. Filter by Cursor compatibility when searching.

### 4. AgentSkills.io — Format Specification + Integration Guide (TERTIARY)

**What it is**: "Open standard" for skill folder structure (centered on SKILL.md), with metadata rules and integration guidelines.

**Most important pages**:
- **Overview**: What skills are and why they exist
- **What are skills?**: Clear definition "skill = folder + SKILL.md (+ resources/scripts)"
- **Specification**: Rules for SKILL.md (YAML frontmatter + markdown), fields description, license, compatibility, etc.
- **Integrate skills into your agent**: If you need to add skill support to your own agent/tool

**Why include**: This is the "source of truth" for format validation.

### 5. Vercel Labs — Best Practices Packs (Cursor/Claude Compatible)

**Repo packs**:
- **vercel-labs/skills** — Meta-skills, find-skills, onboarding — **Cursor/Claude compatible**
- **vercel-labs/agent-skills** — React, Web Design, RN best practices — **Cursor/Claude compatible**
- **vercel-labs/next-skills** — Next.js best-practices (upgrade/cache/components, etc.)

**Where list is**: In README.md of each repo + Skills.sh leaderboard by specific skill names

**Cursor/Claude Compatibility**: These packs are often compatible with both platforms

### 6. Additional Community Repositories

**CommandCodeAI/agent-skills**:
- **Repository**: https://github.com/CommandCodeAI/agent-skills
- **Focus**: Python-focused practical skills
- **Compatibility**: Cursor, Claude Code
- **Categories**: Software development, cloud infrastructure, content management, data analytics, workflow automation

**muratcankoylan/Agent-Skills-for-Context-Engineering**:
- **Focus**: Set of principles/skills for context engineering
- **Compatibility**: Cursor, Claude
- **Why include**: Best practices for context management in Cursor/Claude

### 7. Enterprise / Large Packs

**microsoft/skills**:
- Azure, Foundry, MCP builder, agent templates
- One of the largest "enterprise" packs
- Shows how to organize a pack for multiple agent clients via symlinks/catalogs

**openai/skills**:
- Curated, experimental, system skills
- Most "canonical" example of how a production system interprets skills
- Good as reference for behavior: progressive disclosure, metadata, discovery

### 8. Curated "Awesome" Lists (Aggregators)

**VoltAgent/awesome-agent-skills**:
- Curated collection of "official" + community skill packs
- Where list is: README.md

**skillmatic-ai/awesome-agent-skills**:
- Comprehensive guide (last updated 2026-02-08)
- Covers fundamentals, platforms, building/integration
- Homepage: agentskills.io

**PatrickJS/awesome-cursorrules**:
- Important base of context rules for Cursor
- Where list is: README.md
- Focus on Cursor-specific rules

## Search Strategy Priority

**For Cursor skills**:
1. Start with Cursor community repos (chrisboden, daniel-scrivner, araguaci, grapelike-class151) + Cursor official docs
2. Then Skills.sh leaderboard (filter for Cursor compatible)
3. Then AgentSkills.io catalog
4. Finally GitHub repos (vercel-labs, anthropics, microsoft, etc.)

**For Claude skills**:
1. Start with Anthropic official skills + claudeskills.org + Claude API docs
2. Then Skills.sh leaderboard (filter for Claude compatible)
3. Then AgentSkills.io catalog
4. Finally GitHub repos

**For cross-compatible skills**:
1. Skills.sh leaderboard (filter for Cursor/Claude compatible)
2. Vercel Labs packs
3. AgentSkills.io catalog

## Installation Methods

### Via Skills.sh CLI
```bash
npx skills add <owner/repo>
```

### Manual Installation

**For Cursor**:
1. Clone or download skill repository
2. Copy skill directory to `.cursor/skills/{skill-name}/`
3. Verify SKILL.md structure

**For Claude**:
1. Clone or download skill repository
2. Copy skill directory to `.claude/skills/{skill-name}/` (Claude Desktop) or `.github/skills/{skill-name}/` (Claude Code)
3. Verify SKILL.md structure

### Git Submodule (for version tracking)

**For Cursor**:
```bash
git submodule add https://github.com/owner/repo.git .cursor/skills/skill-name
```

**For Claude**:
```bash
# Claude Desktop
git submodule add https://github.com/owner/repo.git .claude/skills/skill-name

# Claude Code (shared with VS Code Copilot)
git submodule add https://github.com/owner/repo.git .github/skills/skill-name
```

## Links and Sources

### Official Catalogs and Standards
- **Skills.sh**: https://skills.sh/
- **Skills.sh Hot**: https://skills.sh/hot
- **AgentSkills.io**: https://agentskills.io/
- **AgentSkills.io Specification**: https://agentskills.io/specification
- **skill.md Overview**: https://skill.md/

### Major Repositories
- **Anthropic skills**: https://github.com/anthropics/skills
- **Vercel Labs skills**: https://github.com/vercel-labs/skills
- **Vercel Labs agent-skills**: https://github.com/vercel-labs/agent-skills
- **Microsoft skills**: https://github.com/microsoft/skills
- **OpenAI skills**: https://github.com/openai/skills

### Cursor Community Repositories
- **chrisboden/cursor-skills**: https://github.com/chrisboden/cursor-skills
- **daniel-scrivner/cursor-skills**: https://github.com/daniel-scrivner/cursor-skills
- **araguaci/cursor-skills**: https://github.com/araguaci/cursor-skills
- **grapelike-class151/cursor-skills**: https://github.com/grapelike-class151/cursor-skills

### Documentation
- **Cursor skills docs**: https://cursor.com/docs/context/skills
- **VS Code Copilot agent skills docs**: https://code.visualstudio.com/docs/copilot/customization/agent-skills
- **Claude Skills (Skill Creator)**: https://www.claudeskills.org/docs/skills-cases/skill-creator
- **Claude API Agent Skills SDK**: https://platform.claude.com/docs/en/agent-sdk/skills
