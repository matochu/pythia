# Compatibility Guide: Cursor to Claude Code/Desktop

This document provides detailed information about compatibility differences between Cursor and Claude Code/Desktop, and how to handle them during synchronization.

## Storage Location Differences

### Cursor (Source)
- **Agents**: `.cursor/agents/{name}.md`
- **Skills**: `.cursor/skills/{skill-name}/SKILL.md`
- **Commands**: `.cursor/commands/{name}.md`
- **Rules**: `.cursor/rules/{name}.mdc`
- **Hooks**: `.cursor/hooks.json`

### Claude Code (Target - Project-level)
- **Recommended**: `.github/agents/{name}.md`, `.github/skills/{skill-name}/SKILL.md`
- **Legacy**: `.claude/agents/{name}.md`, `.claude/skills/{skill-name}/SKILL.md`
- **Alternative**: `.agents/agents/{name}.md`, `.agents/skills/{skill-name}/SKILL.md`

### Claude Desktop (Target - Project-level)
- **Agents**: `.claude/agents/{name}.md`
- **Skills**: `.claude/skills/{skill-name}/SKILL.md`

**Note**: Personal-level sync (`~/.copilot/`, `~/.claude/`) is out of scope. Only project-level sync is supported.

## Format Compatibility

### Agent Format

Both Cursor and Claude Code/Desktop use the same Agent Skills standard:

**Required Fields**:
- `name`: Agent name (1-64 chars, kebab-case)
- `description`: Agent description (1-1024 chars)
- `model`: Model identifier (optional)

**Optional Fields**:
- `color`: Agent color (optional)
- `compatibility`: Platform compatibility (≤500 chars)

**Format**: YAML frontmatter + Markdown content

**Compatibility**: ✅ Fully compatible — no format conversion needed

### Skill Format

Both Cursor and Claude Code/Desktop follow Agent Skills specification:

**Required Fields**:
- `name`: Skill name (1-64 chars, kebab-case)
- `description`: Skill description (1-1024 chars)

**Optional Fields**:
- `compatibility`: Platform compatibility (≤500 chars)
- `license`: License information
- `metadata`: Additional metadata

**Format**: YAML frontmatter + Markdown content

**Directory Structure**:
- `SKILL.md` (required)
- `references/` (optional)
- `scripts/` (optional)
- `examples/` (optional)

**Compatibility**: ✅ Fully compatible — no format conversion needed

## Compatibility Field Updates

### Update Procedures

1. **Read Compatibility Field**:
   - Parse YAML frontmatter from source file
   - Extract compatibility field value
   - Check if Claude Code/Desktop is already listed

2. **Add Platform Name** (if not present):
   - Read compatibility field from target file (after copy)
   - Check current value format:
     - Comma-separated: `"Cursor, Claude Code"`
     - Space-separated: `"Cursor Claude Code"`
     - Single value: `"Cursor"`
   - Add platform name preserving existing format
   - Format: Single-line string ≤500 chars

3. **Validation**:
   - After update, verify compatibility field length ≤500 chars
   - Check YAML syntax is valid
   - Verify field format matches Agent Skills spec

### Error Handling

**Scenario 1: Compatibility Field Length Exceeded**

If adding platform name would exceed 500 chars:

- **Option 1**: Truncate existing entries to fit new platform name
  - Keep most important platforms
  - Truncate less critical entries
  - Ensure new platform name fits

- **Option 2**: Skip compatibility update and warn user
  - Don't modify compatibility field
  - Report warning in sync results
  - Continue with sync (file copied but compatibility not updated)

- **Option 3**: Report error and skip sync for this item
  - Don't copy file
  - Report error in sync results
  - Continue with other items

**Scenario 2: YAML Parsing Error**

If YAML frontmatter parsing fails:

- Skip compatibility update
- Report parsing error in sync results
- Continue with sync (file copied but compatibility not updated)
- Document error for user review

**Scenario 3: Invalid Compatibility Field Format**

If compatibility field format is invalid:

- Skip compatibility update
- Report format error in sync results
- Continue with sync (file copied but compatibility not updated)

## Platform-Specific Features

### Cursor-Specific Features

**Potential Incompatibilities**:
- Cursor-specific API calls (if any)
- Cursor-specific hooks or commands
- Cursor-specific file paths

**Handling**:
- Document Cursor-specific features in sync results
- Warn user about potential incompatibilities
- Provide guidance on adaptation if needed

### Claude Code-Specific Features

**Supported Features**:
- Standard Agent Skills format
- `.github/` directory structure
- VS Code Copilot compatibility

**Handling**:
- Skills synced to `.github/` work with Claude Code and VS Code Copilot
- No special handling needed for standard features

### Claude Desktop-Specific Features

**Supported Features**:
- Standard Agent Skills format
- `.claude/` directory structure

**Handling**:
- Skills synced to `.claude/` work with Claude Desktop
- No special handling needed for standard features

## Cross-Platform Compatibility

### Compatible Features

✅ **Fully Compatible**:
- YAML frontmatter format
- Markdown content
- Agent Skills specification compliance
- Directory structure (with path mapping)

### Incompatible Features

❌ **Not Supported**:
- Cursor-specific hooks (`.cursor/hooks.json`)
- Cursor-specific commands (`.cursor/commands/`)
- Cursor-specific rules (`.cursor/rules/`)
- Personal-level paths (`~/.copilot/`, `~/.claude/`)

**Note**: Only agents and skills are synced. Hooks, commands, and rules are out of scope.

## Compatibility Checklist

Before syncing, verify:

- [ ] Source file has valid YAML frontmatter
- [ ] Required fields present (name, description)
- [ ] Format matches Agent Skills spec
- [ ] No Cursor-specific features that would break in Claude
- [ ] Compatibility field can be updated (if needed)
- [ ] Target directory is writable

## Best Practices

1. **Always Update Compatibility Field**: Add Claude Code/Desktop to compatibility field in target files
2. **Preserve Source**: Never modify source files during sync
3. **Validate After Update**: Check compatibility field length and format after update
4. **Handle Errors Gracefully**: Continue sync even if compatibility update fails
5. **Document Incompatibilities**: Report any Cursor-specific features that may not work in Claude

## Examples

### Example 1: Adding Compatibility to Empty Field

**Source**:
```yaml
---
name: my-agent
description: My agent
---
```

**Target** (after sync):
```yaml
---
name: my-agent
description: My agent
compatibility: "Claude Code"
---
```

### Example 2: Adding Compatibility to Existing Field

**Source**:
```yaml
---
name: my-skill
description: My skill
compatibility: "Cursor"
---
```

**Target** (after sync):
```yaml
---
name: my-skill
description: My skill
compatibility: "Cursor, Claude Code"
---
```

### Example 3: Handling Length Exceeded

**Source**:
```yaml
---
name: my-skill
description: My skill
compatibility: "Very long compatibility string that is already at 495 characters..."
---
```

**Action**: Skip compatibility update, warn user in sync results
