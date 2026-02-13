# Universal Sync Setup — Cross-Platform Skills and Agents Synchronization

This document explains the universal synchronization setup for making skills and agents accessible across all platforms (Cursor, VS Code Copilot, Claude Desktop, OpenCode, Codex).

## Overview

The universal sync setup uses `.claude/` as the **source of truth** for skills and agents, providing the best cross-platform compatibility. Most platforms (Cursor, VS Code Copilot, Claude Desktop, OpenCode) read `.claude/` directly, so no sync is needed for them. Sync scripts are only needed for platforms that don't support `.claude/` directly (Codex, optional `.github/` for VS Code Copilot, optional `.opencode/` for OpenCode).

## Why `.claude/` Directory?

The `.claude/` directory provides the **best cross-platform compatibility**:

| Platform            | Skills Support                | Agents Support                | Notes                                                                  |
| ------------------- | ----------------------------- | ----------------------------- | ---------------------------------------------------------------------- |
| **Cursor**          | ✅ `.claude/skills/`          | ✅ `.claude/agents/`          | Supported for Claude compatibility (project and user-level)            |
| **VS Code Copilot** | ✅ `.claude/skills/` (legacy) | ✅ `.claude/agents/` (legacy) | Backward compatibility                                                 |
| **Claude Desktop**  | ✅ `.claude/skills/`          | ✅ `.claude/agents/`          | Native support                                                         |
| **OpenCode**        | ✅ `.claude/skills/`          | ✅ `.agents/skills/`          | Project-level support; also supports `.opencode/skills/` (optional)    |
| **Codex**           | ❓ Not documented             | ❓ Not documented             | Uses `.agents/skills/` for repository-level skills (synced separately) |

**Recommendation**: Use `.claude/skills/` and `.claude/agents/` for maximum compatibility across Cursor, VS Code Copilot, Claude Desktop, and OpenCode.

## Directory Structure

```
.claude/
├── skills/          # Universal source for skills (all platforms read this)
│   └── {skill-name}/
│       └── SKILL.md
└── agents/          # Universal source for agents (all platforms read this)
    └── {agent-name}.md

.agents/             # Synced for Codex (repository-level)
└── skills/         # Skills synced from .claude/skills/

.github/             # Optional: Synced for VS Code Copilot (recommended path)
├── skills/         # Optional: Only if using recommended .github/ path
└── agents/         # Optional: Only if using recommended .github/ path

.opencode/          # Optional: Synced for OpenCode (platform-specific directory)
├── skills/         # Optional: Only if platform-specific directory preferred
└── agents/         # Optional: Only if OpenCode supports agents in .opencode/agents/

AGENTS.md           # Generated for Codex (aggregated from .claude/agents/)
```

## Usage

### Initial Setup

1. **Migrate existing skills and agents** (if needed):

   ```bash
   # Skills and agents should already be in .claude/ directories
   # If not, copy from .cursor/ directories:
   cp -r .cursor/skills/* .claude/skills/
   cp -r .cursor/agents/* .claude/agents/
   ```

2. **Run sync script** to sync to platform-specific directories:

   ```bash
   # Sync to Codex (.agents/skills/) - always runs
   ./scripts/sync-universal.sh --copy

   # Optional: Sync to .github/ for VS Code Copilot (if using recommended path)
   ./scripts/sync-universal.sh --copy --github

   # Optional: Sync to .opencode/ for OpenCode (if platform-specific directory preferred)
   ./scripts/sync-universal.sh --copy --opencode
   ```

3. **Generate AGENTS.md for Codex**:
   ```bash
   ./scripts/generate-codex-agents.sh
   ```

### Sync Script Options

The `sync-universal.sh` script supports the following options:

- `--symlink`: Use symlinks instead of copies (Unix-friendly, default: copy)
- `--copy`: Use file copies instead of symlinks (Git-friendly, default)
- `--github`: Sync to `.github/` for VS Code Copilot (optional, only if using recommended path)
- `--opencode`: Sync to `.opencode/` for OpenCode (optional, only if platform-specific directory preferred)
- `--help`: Show usage information

**Note**: The script detects your platform and suggests appropriate mode (symlinks on Unix, copies on Windows). Default is `--copy` for Git-friendly approach.

### Platform-Specific Notes

#### Cursor

- Reads `.claude/skills/` and `.claude/agents/` directly
- **No sync needed** — Cursor supports `.claude/` natively

#### VS Code Copilot

- Reads `.claude/skills/` and `.claude/agents/` directly (legacy path)
- **Optional sync**: If using recommended `.github/` path, use `--github` flag
- Sync to `.github/` is only needed if:
  - Using VS Code Copilot's recommended `.github/` path instead of legacy `.claude/` path
  - Or if project-specific requirements prefer `.github/` structure

#### Claude Desktop

- Reads `.claude/skills/` and `.claude/agents/` directly
- **No sync needed** — Claude Desktop supports `.claude/` natively

#### OpenCode

- Reads `.claude/skills/` directly (primary method)
- Also reads `.agents/skills/` (synced for Codex, also works for OpenCode)
- **Optional sync**: If platform-specific `.opencode/` directory is preferred, use `--opencode` flag
- OpenCode sync to `.opencode/skills/` is optional and only needed if platform-specific directory is preferred

#### Codex

- Uses `.agents/skills/` for repository-level skills (synced from `.claude/skills/`)
- Uses `AGENTS.md` for custom instructions (generated from `.claude/agents/`)
- **Sync required**: Skills are synced to `.agents/skills/` automatically
- **AGENTS.md required**: Generated separately using `generate-codex-agents.sh`

## AGENTS.md Generation

The `generate-codex-agents.sh` script generates `AGENTS.md` file for Codex from individual agent files in `.claude/agents/`.

**Format**:

- Plain Markdown file (no YAML frontmatter)
- Aggregates all agents into single file
- Each agent becomes a section with name, description, and key guidelines

**Usage**:

```bash
./scripts/generate-codex-agents.sh
```

**Output**: `AGENTS.md` in project root (Codex discovers from project root down to CWD)

## Troubleshooting

### Skills/Agents Not Discoverable

1. **Check source directory**: Verify `.claude/skills/` and `.claude/agents/` exist
2. **Check sync**: Verify sync script ran successfully (check `.agents/skills/` for Codex)
3. **Check platform-specific directories**: Verify platform-specific directories exist if using optional sync

### Sync Script Issues

1. **Symlinks not working**: Use `--copy` mode instead (Git-friendly)
2. **Conflicts**: Script handles conflicts by removing existing symlinks/files (idempotent)
3. **Platform detection**: Script detects platform and suggests appropriate mode

### AGENTS.md Generation Issues

1. **Empty AGENTS.md**: Check that `.claude/agents/` contains `.md` files
2. **Missing metadata**: Script handles missing YAML frontmatter gracefully
3. **Malformed YAML**: Script skips malformed files and continues

## References

- **Compatibility Guide**: `.cursor/skills/skill-sync-cursor-to-claude/references/compatibility-guide.md` — Detailed platform compatibility information
- **Sync Script**: `scripts/sync-universal.sh` — Universal sync script
- **AGENTS.md Generator**: `scripts/generate-codex-agents.sh` — Codex AGENTS.md generator

## Migration Notes

### From `.cursor/` to `.claude/`

If you have existing skills/agents in `.cursor/` directories:

1. **Copy (do not move)** files to `.claude/`:

   ```bash
   cp -r .cursor/skills/* .claude/skills/
   cp -r .cursor/agents/* .claude/agents/
   ```

2. **Post-migration options**:
   - **Option A**: Keep `.cursor/` directories as backup (recommended for safety)
   - **Option B**: Remove `.cursor/` directories after successful migration and verification
   - **Option C**: Convert `.cursor/` directories to symlinks pointing to `.claude/` (Unix-only, requires symlink support)

3. **Verify migration**: Test that Cursor can discover skills/agents from `.claude/` directories

## Best Practices

1. **Use `.claude/` as source of truth**: All edits should be made in `.claude/` directories
2. **Run sync after changes**: After modifying skills/agents in `.claude/`, run sync script to update platform-specific directories
3. **Regenerate AGENTS.md**: After modifying agents in `.claude/agents/`, regenerate `AGENTS.md` for Codex
4. **Git-friendly approach**: Use `--copy` mode for better Git compatibility (symlinks can cause issues in Git)
5. **Document platform-specific features**: Use compatibility metadata in skill/agent files to document platform-specific features
