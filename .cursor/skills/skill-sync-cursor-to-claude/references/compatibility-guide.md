# Compatibility Guide: Multi-Platform Agent Skills Synchronization

This document provides detailed information about compatibility differences between Cursor, Claude Code, Claude Desktop, VS Code Copilot, and Codex, and how to handle synchronization across these platforms.

## Storage Location Differences

### Cursor
**Project-level**:
- **Agents (Subagents)**: `.cursor/agents/{name}.md` (primary)
- **Agents (Subagents)**: `.claude/agents/{name}.md` (Claude compatibility)
- **Agents (Subagents)**: `.codex/agents/{name}.md` (Codex compatibility)
- **Skills**: `.cursor/skills/{skill-name}/SKILL.md` (primary)
- **Skills**: `.claude/skills/{skill-name}/SKILL.md` (Claude compatibility)
- **Skills**: `.codex/skills/{skill-name}/SKILL.md` (Codex compatibility)
- **Commands**: `.cursor/commands/{name}.md` (Cursor-specific)
- **Rules**: `.cursor/rules/{name}.mdc` (Cursor-specific)
- **Hooks**: `.cursor/hooks.json` (Cursor-specific)

**Note**: When multiple locations contain subagents with the same name, `.cursor/` takes precedence over `.claude/` or `.codex/`.

**User-level**:
- **Agents (Subagents)**: `~/.cursor/agents/{name}.md` (primary)
- **Agents (Subagents)**: `~/.claude/agents/{name}.md` (Claude compatibility)
- **Agents (Subagents)**: `~/.codex/agents/{name}.md` (Codex compatibility)
- **Skills**: `~/.cursor/skills/{skill-name}/SKILL.md`
- **Skills**: `~/.claude/skills/{skill-name}/SKILL.md` (Claude compatibility)
- **Skills**: `~/.codex/skills/{skill-name}/SKILL.md` (Codex compatibility)

### VS Code Copilot / Claude Code
**Project-level** (recommended order):
1. **Recommended**: `.github/agents/{name}.md`, `.github/skills/{skill-name}/SKILL.md`
2. **Legacy**: `.claude/agents/{name}.md`, `.claude/skills/{skill-name}/SKILL.md` (backward compatibility)
3. **Alternative**: `.agents/agents/{name}.md`, `.agents/skills/{skill-name}/SKILL.md`

**User-level**:
- **Skills**: `~/.copilot/skills/{skill-name}/SKILL.md` (recommended)
- **Skills**: `~/.claude/skills/{skill-name}/SKILL.md` (legacy, backward compatibility)
- **Skills**: `~/.agents/skills/{skill-name}/SKILL.md` (alternative)

**Note**: Can configure additional locations via `chat.agentSkillsLocations` setting.

### Claude Desktop
**Project-level**:
- **Agents**: `.claude/agents/{name}.md`
- **Skills**: `.claude/skills/{skill-name}/SKILL.md`

**User-level**:
- **Skills**: `~/.claude/skills/{skill-name}/SKILL.md`

### Codex
**Project-level**:
- **Skills**: Project-level skills can be documented in project docs (not explicitly `.codex/skills/` directory)
- **AGENTS.md**: `AGENTS.md` files in project root or nested directories (custom instructions, not individual agent files)

**User-level** (default):
- **Skills**: `~/.codex/skills/{skill-name}/SKILL.md` (default `$CODEX_HOME/skills`, typically `~/.codex/skills/`)
- **System Skills**: `~/.codex/skills/.system/` (OpenAI-shipped global skills)
- **AGENTS.md**: `~/.codex/AGENTS.md` or `~/.codex/AGENTS.override.md` (global custom instructions)

**Important Notes**:
- **AGENTS.md is NOT the same as individual agent files**: Codex uses `AGENTS.md` files for custom instructions/rules, not for defining separate subagents like Cursor. This is similar to Cursor's rules or custom instructions, not subagents.
- **Skills discovery**: Codex discovers skills by looking for `SKILL.md` files in `~/.codex/skills/` directory tree. Project-level skills can be documented in project docs.
- **No individual agent files**: Codex does NOT use individual `.md` files in `.codex/agents/` directory like Cursor subagents. Codex uses `AGENTS.md` files for instructions instead.

**Note**: Personal-level sync (`~/.copilot/`, `~/.claude/`, `~/.codex/`) is out of scope for this sync tool. Only project-level sync is supported.

## Universal Compatibility Directory

### `.claude/` Directory - Universal Compatibility

The `.claude/` directory provides the **best cross-platform compatibility**:

| Platform | Skills Support | Agents Support | Notes |
|----------|---------------|----------------|-------|
| **Cursor** | ✅ `.claude/skills/` | ✅ `.claude/agents/` | Supported for Claude compatibility (project and user-level) |
| **VS Code Copilot** | ✅ `.claude/skills/` (legacy) | ✅ `.claude/agents/` (legacy) | Backward compatibility |
| **Claude Desktop** | ✅ `.claude/skills/` | ✅ `.claude/agents/` | Native support |
| **Codex** | ❓ Not documented | ❓ Not documented | Unknown support |

**Recommendation**: Use `.claude/skills/` and `.claude/agents/` for maximum compatibility across Cursor, VS Code Copilot, and Claude Desktop.

### `.codex/` Directory - Codex Compatibility

| Platform | Skills Support | Agents Support | Notes |
|----------|---------------|----------------|-------|
| **Cursor** | ✅ `.codex/skills/` | ✅ `.codex/agents/` | Supported for Codex compatibility (project and user-level) |
| **VS Code Copilot** | ❌ Not supported | ❌ Not supported | Not mentioned in docs |
| **Claude Desktop** | ❌ Not supported | ❌ Not supported | Not mentioned in docs |
| **Codex** | ✅ `~/.codex/skills/` (user-level) | ❌ No `.codex/agents/` | Codex uses `AGENTS.md` files for instructions, not individual agent files |

**Important**: Codex does NOT use individual agent files like Cursor subagents. Codex uses `AGENTS.md` files (similar to custom instructions/rules) for project guidance. The `.codex/agents/` directory structure is NOT used by Codex.

**Recommendation**: Use `.codex/skills/` only if targeting Codex specifically. For agents, Codex uses `AGENTS.md` files (different format, not synced by this tool).

## Format Compatibility

### Agent Format

All platforms (Cursor, VS Code Copilot, Claude Desktop, Codex) use the same Agent Skills standard:

**Required Fields**:
- `name`: Agent name (1-64 chars, kebab-case)
- `description`: Agent description (1-1024 chars)
- `model`: Model identifier (optional, Cursor-specific)

**Optional Fields**:
- `color`: Agent color (optional, Cursor-specific)
- `compatibility`: Platform compatibility (≤500 chars)
- `tools`: Comma-separated list of allowed tools (VS Code Copilot)
- `mcp-servers`: Additional MCP servers (VS Code Copilot)

**Format**: YAML frontmatter + Markdown content

**Compatibility**: ✅ Fully compatible — no format conversion needed

**Platform-Specific Notes**:
- **Cursor**: Supports `model` and `color` fields for subagents
- **VS Code Copilot**: Supports `tools` and `mcp-servers` fields for agents
- **Codex**: Does NOT use individual agent files. Uses `AGENTS.md` files for custom instructions (different concept - similar to rules/custom instructions, not subagents)

### Skill Format

All platforms follow the Agent Skills specification:

**Required Fields**:
- `name`: Skill name (1-64 chars, kebab-case)
- `description`: Skill description (1-1024 chars)

**Optional Fields**:
- `compatibility`: Platform compatibility (≤500 chars)
- `license`: License information
- `metadata`: Additional metadata (arbitrary key-value mapping)
- `disable-model-invocation`: When `true`, skill only loads when explicitly invoked (Cursor, VS Code Copilot)

**Format**: YAML frontmatter + Markdown content

**Directory Structure**:
- `SKILL.md` (required)
- `references/` (optional) - Additional documentation loaded on demand
- `scripts/` (optional) - Executable code that agents can run
- `examples/` (optional) - Example files and templates
- `assets/` (optional) - Static resources like templates, images, or data files

**Compatibility**: ✅ Fully compatible — no format conversion needed

**Platform-Specific Notes**:
- **Cursor**: Supports `disable-model-invocation` for explicit-only invocation
- **VS Code Copilot**: Supports `disable-model-invocation` for explicit-only invocation
- **All platforms**: Use progressive disclosure (load resources on demand)

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

**Supported Features**:
- Standard Agent Skills format
- `.cursor/` directory structure (primary)
- `.claude/` directory structure (compatibility) - for both skills and agents/subagents
- `.codex/` directory structure (compatibility) - for both skills and agents/subagents
- Commands (`.cursor/commands/`) - Cursor-only
- Rules (`.cursor/rules/`) - Cursor-only
- Hooks (`.cursor/hooks.json`) - Cursor-only
- `disable-model-invocation` field support
- Subagents priority: When multiple locations contain subagents with the same name, `.cursor/` takes precedence over `.claude/` or `.codex/`

**Potential Incompatibilities**:
- Cursor-specific API calls (if any)
- Cursor-specific hooks or commands
- Cursor-specific file paths
- `model` and `color` fields in agents (may not be recognized by other platforms)

**Handling**:
- Document Cursor-specific features in sync results
- Warn user about potential incompatibilities
- Provide guidance on adaptation if needed
- Skip syncing commands, rules, and hooks (out of scope)

### VS Code Copilot / Claude Code-Specific Features

**Supported Features**:
- Standard Agent Skills format
- `.github/` directory structure (recommended)
- `.claude/` directory structure (legacy, backward compatibility)
- `.agents/` directory structure (alternative)
- `chat.agentSkillsLocations` setting for custom locations
- `tools` and `mcp-servers` fields in agents
- `disable-model-invocation` field support

**Handling**:
- Skills synced to `.github/` work with Claude Code and VS Code Copilot
- Skills synced to `.claude/` also work (backward compatibility)
- No special handling needed for standard features

### Claude Desktop-Specific Features

**Supported Features**:
- Standard Agent Skills format
- `.claude/` directory structure (native)
- Agents in `.claude/agents/` directory

**Handling**:
- Skills synced to `.claude/` work with Claude Desktop
- Agents synced to `.claude/agents/` work with Claude Desktop
- No special handling needed for standard features

### Codex-Specific Features

**Supported Features**:
- Standard Agent Skills format
- `~/.codex/skills/` directory structure (user-level, default `$CODEX_HOME/skills`)
- `~/.codex/skills/.system/` directory (OpenAI-shipped global skills)
- `AGENTS.md` files for custom instructions (project-level and user-level)
- Skills discovery via `SKILL.md` files in `~/.codex/skills/` directory tree

**Important Differences**:
- **No individual agent files**: Codex does NOT use individual `.md` files in `.codex/agents/` directory like Cursor subagents
- **AGENTS.md is NOT agents**: `AGENTS.md` files are custom instructions/rules (similar to Cursor rules), NOT individual agent definitions
- **Skills location**: Codex primarily uses user-level `~/.codex/skills/` (not project-level `.codex/skills/` directory)
- **Project-level skills**: Can be documented in project docs, not necessarily in `.codex/skills/` directory

**Potential Incompatibilities**:
- Codex uses `AGENTS.md` file format for instructions (not individual agent `.md` files like Cursor)
- Codex skills installation via `$skill-installer` command or `npx codex-skills install`
- Codex requires restart after skill installation
- Codex discovers skills from `~/.codex/skills/` tree, not project-level directories

**Handling**:
- Skills synced to `~/.codex/skills/` (user-level) should work with Codex
- Project-level `.codex/skills/` may not be discovered automatically by Codex
- Agents/subagents cannot be synced to Codex (Codex doesn't use individual agent files)
- `AGENTS.md` files are out of scope (different format, used for instructions not agents)
- Document Codex-specific requirements in sync results

## Cross-Platform Compatibility Matrix

### Skills Compatibility

| Platform | `.cursor/skills/` | `.claude/skills/` | `.codex/skills/` | `.github/skills/` | `.agents/skills/` |
|----------|-------------------|-------------------|------------------|-------------------|-------------------|
| **Cursor** | ✅ Primary | ✅ Compatible | ✅ Compatible | ❌ Not supported | ❌ Not supported |
| **VS Code Copilot** | ❌ Not supported | ✅ Legacy | ❌ Not supported | ✅ Recommended | ✅ Alternative |
| **Claude Desktop** | ❌ Not supported | ✅ Native | ❌ Not supported | ❌ Not supported | ❌ Not supported |
| **Codex** | ❌ Not supported | ❌ Not supported | ⚠️ User-level only | ❌ Not supported | ❌ Not supported |

**Notes**:
- **Codex**: Primarily uses user-level `~/.codex/skills/` (default `$CODEX_HOME/skills`). Project-level `.codex/skills/` may not be automatically discovered - skills can be documented in project docs instead.
- **Best Universal Choice**: `.claude/skills/` works with Cursor, VS Code Copilot, and Claude Desktop.

### Agents Compatibility

| Platform | `.cursor/agents/` | `.claude/agents/` | `.codex/agents/` | `.github/agents/` | `.agents/agents/` |
|----------|-------------------|-------------------|------------------|-------------------|-------------------|
| **Cursor** | ✅ Primary | ✅ Compatible | ✅ Compatible | ❌ Not supported | ❌ Not supported |
| **VS Code Copilot** | ❌ Not supported | ✅ Legacy | ❌ Not supported | ✅ Recommended | ✅ Alternative |
| **Claude Desktop** | ❌ Not supported | ✅ Native | ❌ Not supported | ❌ Not supported | ❌ Not supported |
| **Codex** | ❌ Not supported | ❌ Not supported | ❌ Not used | ❌ Not supported | ❌ Uses AGENTS.md |

**Important**: Codex does NOT use individual agent files in `.codex/agents/` directory. Codex uses `AGENTS.md` files for custom instructions (different concept - similar to rules, not subagents).

**Best Universal Choice**: `.claude/agents/` works with Cursor, VS Code Copilot, and Claude Desktop. When multiple locations contain subagents with the same name, `.cursor/` takes precedence over `.claude/` or `.codex/` in Cursor.

### Compatible Features

✅ **Fully Compatible Across All Platforms**:
- YAML frontmatter format
- Markdown content
- Agent Skills specification compliance
- Directory structure (with path mapping)
- Progressive disclosure (load resources on demand)
- `SKILL.md` file format
- Optional directories (`references/`, `scripts/`, `examples/`, `assets/`)

### Incompatible Features

❌ **Not Supported Across Platforms**:
- Cursor-specific hooks (`.cursor/hooks.json`) - Cursor only
- Cursor-specific commands (`.cursor/commands/`) - Cursor only
- Cursor-specific rules (`.cursor/rules/`) - Cursor only
- Personal-level paths (`~/.copilot/`, `~/.claude/`, `~/.codex/`) - Out of scope
- Codex `AGENTS.md` format - Codex only, different concept (custom instructions, not individual agent files)

**Note**: Only agents and skills are synced. Hooks, commands, rules, and Codex AGENTS.md are out of scope.

## Codex AGENTS.md vs Individual Agent Files

**Important Distinction**: Codex `AGENTS.md` files are NOT the same as individual agent files used by Cursor, VS Code Copilot, or Claude Desktop.

### Codex AGENTS.md
- **Purpose**: Custom instructions/rules that Codex reads before doing work
- **Format**: Markdown file with project guidance (similar to Cursor rules or custom instructions)
- **Location**: 
  - Global: `~/.codex/AGENTS.md` or `~/.codex/AGENTS.override.md`
  - Project: `AGENTS.md` or `AGENTS.override.md` in project root or nested directories
- **Usage**: Codex concatenates these files (global → project root → nested dirs) to build instruction chain
- **Discovery**: Codex walks from project root to current directory, checking for `AGENTS.override.md` then `AGENTS.md`
- **Not synced**: AGENTS.md files are out of scope for this sync tool (different format and purpose)

### Individual Agent Files (Cursor, VS Code Copilot, Claude Desktop)
- **Purpose**: Define separate subagents/specialized assistants
- **Format**: Individual `.md` files with YAML frontmatter (name, description, model, etc.)
- **Location**: `.cursor/agents/`, `.claude/agents/`, `.github/agents/`, etc.
- **Usage**: Each file defines a separate agent that can be invoked independently
- **Synced**: These individual agent files ARE synced by this tool

**Conclusion**: Codex does NOT support individual agent files like other platforms. Codex uses `AGENTS.md` for instructions, which is a different concept entirely.

## Compatibility Checklist

Before syncing, verify:

- [ ] Source file has valid YAML frontmatter
- [ ] Required fields present (name, description)
- [ ] Format matches Agent Skills spec
- [ ] No platform-specific features that would break on target platform
- [ ] Compatibility field can be updated (if needed, check length ≤500 chars)
- [ ] Target directory is writable
- [ ] Target platform supports chosen directory structure (check compatibility matrix)
- [ ] Platform-specific fields (model, color, tools, mcp-servers) are optional and won't cause issues

## Best Practices

1. **Choose Universal Directory**: Use `.claude/skills/` for maximum cross-platform compatibility (Cursor, VS Code Copilot, Claude Desktop)
2. **Always Update Compatibility Field**: Add target platform(s) to compatibility field in synced files
3. **Preserve Source**: Never modify source files during sync
4. **Validate After Update**: Check compatibility field length (≤500 chars) and format after update
5. **Handle Errors Gracefully**: Continue sync even if compatibility update fails
6. **Document Incompatibilities**: Report any platform-specific features that may not work on target platform
7. **Test After Sync**: Verify synced skills/agents work correctly on target platform
8. **Use Progressive Disclosure**: Keep main SKILL.md focused, move details to `references/` directory

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
