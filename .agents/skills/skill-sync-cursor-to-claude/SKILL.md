---
name: skill-sync-cursor-to-claude
description: Synchronize agents and skills from Cursor to Claude Code/Desktop at project-level. Use when you want to copy your Cursor configuration to Claude Code or Claude Desktop, handle compatibility differences, and detect conflicts. Supports project-level sync only (`.github/` for Claude Code, `.claude/` for Claude Desktop).
compatibility: "Cursor, VS Code Copilot, Claude Desktop, OpenCode"
---

# Sync Cursor to Claude

## ⚡ Quick Reference

**Use when**: You want to synchronize your Cursor agents and skills to Claude Code or Claude Desktop at project-level.

**What it does**: Provides procedures for copying agents and skills from `.cursor/` to `.github/` (Claude Code) or `.claude/` (Claude Desktop), handling compatibility differences, detecting conflicts, and updating compatibility metadata.

**Key capabilities**:
- Sync agents from `.cursor/agents/` to Claude Code/Desktop
- Sync skills from `.cursor/skills/` to Claude Code/Desktop
- Detect and report conflicts (name collisions, version mismatches)
- Update compatibility metadata in target files only
- Support project-level sync only (personal-level out of scope)

## Core Functionality

This skill guides LLM to help users synchronize their Cursor configuration to Claude Code/Desktop. It provides step-by-step procedures for:

1. **Agent Sync**: Copy agents from `.cursor/agents/` to target platform
2. **Skill Sync**: Copy skills from `.cursor/skills/` to target platform
3. **Compatibility Handling**: Update compatibility metadata, handle format differences
4. **Conflict Detection**: Detect and report conflicts before sync

**Note**: This skill provides **prompt-only instructions** for LLM to follow. LLM uses file operations (read/write) to copy and adapt files between directories. Source files remain unchanged.

## Sync Procedures Overview

### Target Platform Detection

**Project-level only** (personal-level sync is out of scope):

1. **Method 1**: User query explicitly mentions platform
   - "Claude Code" or "VS Code Copilot" → use `.github/agents/` or `.github/skills/`
   - "Claude Desktop" → use `.claude/agents/` or `.claude/skills/`

2. **Method 2**: Check project structure
   - If `.github/` exists → prefer Claude Code (`.github/`)
   - If `.claude/` exists → prefer Claude Desktop (`.claude/`)
   - If both exist → ask user or default to Claude Code (`.github/`)

3. **Default**: If unclear, ask user or default to Claude Code project-level (`.github/`)

**Note**: Only project-level sync is supported. Personal-level sync (`~/.copilot/`, `~/.claude/`) is out of scope.

## Agent Sync Workflow

### Step 1: Source Detection
- Scan `.cursor/agents/` directory for agent files (`*.md`)
- List all agents found
- Check agent format (YAML frontmatter validation)

### Step 2: Target Selection
- Use target platform detection logic (see above)
- Create target directory if it doesn't exist
- Verify target directory is writable

### Step 3: Compatibility Check
- Verify agent YAML frontmatter format (name, description, model)
- Check for Cursor-specific features (if any)
- Verify compatibility with Claude Code/Desktop format

### Step 4: Conflict Detection
- Check if agent already exists in target directory
- Compare source and target versions (if metadata available)
- Detect name collisions
- Report conflicts to user

### Step 5: Sync Execution
- Copy agent file from `.cursor/agents/{name}.md` to target directory
- **Important**: Source file remains unchanged
- Preserve YAML frontmatter format in copied file
- Update compatibility metadata in target file only (add Claude Code/Desktop to compatibility field)

### Step 6: Verification
- Verify file copied successfully
- Check file permissions
- Validate YAML frontmatter in target file

### Agent Sync Results Format

```markdown
## Agent Sync Results

### Agent: {name}
- **Source**: `.cursor/agents/{name}.md`
- **Target**: `.github/agents/{name}.md` (or `.claude/agents/`)
- **Status**: {synced | skipped | conflict}
- **Conflict**: {description or "None"}
- **Compatibility**: {compatible | needs-review}
```

## Skill Sync Workflow

### Step 1: Source Detection
- Scan `.cursor/skills/` directory for skill directories
- List all skills found
- Check each skill for SKILL.md file
- Verify skill structure (SKILL.md, optional references/, scripts/)

### Step 2: Target Selection
- Use target platform detection logic (same as agents)
- Create target directory if it doesn't exist
- Verify target directory is writable

### Step 3: Compatibility Check
- Verify SKILL.md YAML frontmatter format (name, description, compatibility)
- Check compatibility field for Claude Code/Desktop support
- Verify skill structure follows Agent Skills spec

### Step 4: Conflict Detection
- Check if skill already exists in target directory
- Compare source and target versions (if metadata available)
- Detect name collisions
- Check for functionality overlap
- Report conflicts to user

### Step 5: Sync Execution
- Copy skill directory from `.cursor/skills/{skill-name}/` to target directory
- **Important**: Source directory remains unchanged
- Preserve directory structure (SKILL.md, references/, scripts/)
- Update compatibility metadata in target SKILL.md only (add Claude Code/Desktop to compatibility field)

### Step 6: Verification
- Verify directory copied successfully
- Check SKILL.md exists in target
- Validate YAML frontmatter in target SKILL.md
- Verify references/ and scripts/ directories (if present)

### Skill Sync Results Format

```markdown
## Skill Sync Results

### Skill: {skill-name}
- **Source**: `.cursor/skills/{skill-name}/`
- **Target**: `.github/skills/{skill-name}/` (or `.claude/skills/`)
- **Status**: {synced | skipped | conflict}
- **Conflict**: {description or "None"}
- **Compatibility**: {compatible | needs-review}
- **Files Copied**: {count} files
```

## Compatibility Handling

### Compatibility Update Procedures

1. **Check Compatibility Field**:
   - Read compatibility field from source file
   - Verify if Claude Code/Desktop is listed
   - If not listed, add to compatibility field in target file only

2. **Update Compatibility Metadata** (in target file only, not source):
   - Read current compatibility field from target file (after copy)
   - Check if "Claude Code" or "Claude Desktop" is already listed
   - If not listed, add platform name to compatibility field
   - Preserve existing compatibility entries
   - Format: Single-line string ≤500 chars

3. **Validation Step**:
   - After update, verify compatibility field length ≤500 chars
   - If exceeds limit:
     - Option 1: Truncate existing entries to fit new platform name
     - Option 2: Skip compatibility update and warn user
     - Option 3: Report error and skip sync for this item

4. **YAML Parsing Error Handling**:
   - If YAML parsing fails, skip compatibility update
   - Report parsing error in sync results
   - Continue with sync (file copied but compatibility not updated)

**Detailed compatibility guide**: See `references/compatibility-guide.md`

## Conflict Detection and Resolution

### Conflict Types

1. **Name Collision**: Agent/skill with same name exists in target
2. **Version Mismatch**: Different versions of same agent/skill
3. **Functionality Overlap**: Similar functionality but different names
4. **Format Incompatibility**: Incompatible format differences

### Conflict Detection Procedures

1. **Before Sync**:
   - Check if target file/directory exists
   - Compare file names (case-sensitive)
   - Check metadata (if available) for version info
   - Detect functionality overlap (by description/name similarity)

2. **Conflict Reporting**:
   - List all conflicts found
   - Categorize by conflict type
   - Provide details (source path, target path, conflict reason)
   - Recommend resolution action

3. **User Interaction Flow**:
   - **Step 1**: Detect conflicts before sync starts
   - **Step 2**: Report all conflicts to user in structured format
   - **Step 3**: For each conflict, present resolution options:
     - Skip sync (keep existing target)
     - Overwrite (replace target with source)
     - Rename (create with different name)
   - **Step 4**: User provides decisions:
     - User responds with decisions for each conflict
     - LLM parses user decisions and applies them during sync
     - If user doesn't provide decisions, default: skip conflicting items and sync non-conflicting items
   - **Step 5**: Execute sync with user decisions applied
   - **Alternative Flow**: Report conflicts and pause sync, wait for user decisions, resume after decisions received

**Detailed conflict detection guide**: See `references/conflict-detection.md`

## Usage Examples

### Example 1: Sync All Agents to Claude Code

**User query**: "Sync all my Cursor agents to Claude Code"

**Skill response**:
1. Scan `.cursor/agents/` for agent files
2. Detect target platform: User query mentions "Claude Code" → use `.github/agents/` (project-level)
3. Check compatibility for each agent
4. Detect conflicts (check if agents exist in `.github/agents/`)
5. Report conflicts if any
6. Sync non-conflicting agents
7. Update compatibility metadata in target files only
8. Report sync results

**Expected outcome**: All compatible agents synced to `.github/agents/`, conflicts reported, compatibility metadata updated in target files

### Example 2: Sync Specific Skill to Claude Desktop

**User query**: "Sync the architecture-workflow skill to Claude Desktop"

**Skill response**:
1. Locate skill in `.cursor/skills/architecture-workflow/`
2. Detect target platform: User query mentions "Claude Desktop" → use `.claude/skills/` (project-level)
3. Check compatibility
4. Detect conflicts
5. Copy skill directory to `.claude/skills/architecture-workflow/`
6. Update compatibility metadata in target SKILL.md (add "Claude Desktop" to compatibility field)
7. Validate compatibility field length ≤500 chars
8. Verify sync completed

**Expected outcome**: Skill synced to Claude Desktop, compatibility verified, compatibility metadata updated in target SKILL.md only

### Example 3: Sync with Conflict Detection and User Resolution

**User query**: "Sync my skills to Claude Code and show conflicts"

**Skill response**:
1. Scan `.cursor/skills/` for all skills
2. Detect target platform: User query mentions "Claude Code" → use `.github/skills/` (project-level)
3. Detect conflicts (check if skills exist in `.github/skills/`)
4. Report conflicts in structured format:
   ```
   ## Conflicts Detected
   
   ### Skill: architecture-workflow
   - **Source**: `.cursor/skills/architecture-workflow/`
   - **Target**: `.github/skills/architecture-workflow/`
   - **Conflict**: Name collision (already exists in target)
   - **Resolution Options**: Skip, Overwrite, Rename
   ```
5. Wait for user decisions: "skip architecture-workflow, overwrite skill-search-and-fit"
6. Apply user decisions:
   - Skip `architecture-workflow` (don't sync)
   - Overwrite `skill-search-and-fit` (replace target with source)
7. Sync non-conflicting skills
8. Report sync results

**Expected outcome**: Conflicts reported, user provides resolution decisions, sync executed with decisions applied, compatible skills synced

## References

- **Sync Procedures**: `references/sync-procedures.md` — Detailed sync workflows
- **Compatibility Guide**: `references/compatibility-guide.md` — Compatibility differences and handling
- **Conflict Detection**: `references/conflict-detection.md` — Conflict detection and resolution guidance

## Related Resources

- **Agent Skills Specification**: https://agentskills.io/specification
- **Cursor Skills Docs**: https://cursor.com/docs/context/skills
- **Claude Code Skills**: https://code.visualstudio.com/docs/copilot/customization/agent-skills
