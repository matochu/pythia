# Sync Procedures: Detailed Workflows

This document provides detailed procedures for synchronizing agents and skills from Cursor to Claude Code/Desktop.

## Storage Locations

### Cursor (Source)
- Agents: `.cursor/agents/{name}.md`
- Skills: `.cursor/skills/{skill-name}/SKILL.md`

### Claude Code (Target - Project-level)
- **Recommended**: `.github/agents/{name}.md`, `.github/skills/{skill-name}/SKILL.md`
- **Legacy**: `.claude/agents/{name}.md`, `.claude/skills/{skill-name}/SKILL.md`
- **Alternative**: `.agents/agents/{name}.md`, `.agents/skills/{skill-name}/SKILL.md`

### Claude Desktop (Target - Project-level)
- Agents: `.claude/agents/{name}.md`
- Skills: `.claude/skills/{skill-name}/SKILL.md`

**Note**: Personal-level sync (`~/.copilot/`, `~/.claude/`) is out of scope. Only project-level sync is supported.

## Target Platform Detection Logic

### Method 1: User Query (Explicit Platform Mention)
- **Claude Code** or **VS Code Copilot** → use `.github/` (project-level)
- **Claude Desktop** → use `.claude/` (project-level)

### Method 2: Project Structure Detection
- If `.github/` directory exists → prefer Claude Code (`.github/`)
- If `.claude/` directory exists → prefer Claude Desktop (`.claude/`)
- If both exist → ask user or default to Claude Code (`.github/`)

### Method 3: Default
- If unclear, ask user or default to Claude Code project-level (`.github/`)

## Agent Sync Workflow (Detailed)

### Phase 1: Source Detection

1. **Scan Source Directory**:
   - Read `.cursor/agents/` directory
   - List all `.md` files
   - Filter for agent files (check for YAML frontmatter with `name` field)

2. **Validate Agent Format**:
   - Check YAML frontmatter exists
   - Verify required fields: `name`, `description`, `model`
   - Validate YAML syntax
   - Skip invalid agents and report in sync results

3. **List Agents**:
   - Create list of valid agents with metadata
   - Include: name, description, model, file path

### Phase 2: Target Selection

1. **Determine Target Platform**:
   - Use target platform detection logic (see above)
   - Select target directory based on platform:
     - Claude Code → `.github/agents/`
     - Claude Desktop → `.claude/agents/`

2. **Create Target Directory**:
   - Check if target directory exists
   - Create if it doesn't exist
   - Verify directory is writable
   - Report errors if directory creation fails

### Phase 3: Compatibility Check

1. **Verify Format Compatibility**:
   - Check YAML frontmatter format matches Agent Skills spec
   - Verify required fields present
   - Check for Cursor-specific features (document if found)

2. **Check Compatibility Field**:
   - Read compatibility field from source
   - Verify if Claude Code/Desktop is listed
   - Note if compatibility update needed

### Phase 4: Conflict Detection

1. **Check Existing Files**:
   - For each agent, check if file exists in target directory
   - Compare file names (case-sensitive)
   - Detect name collisions

2. **Version Comparison** (if metadata available):
   - Compare source and target versions
   - Detect version mismatches
   - Note if target is newer/older

3. **Report Conflicts**:
   - List all conflicts found
   - Categorize by conflict type
   - Provide resolution recommendations

### Phase 5: Sync Execution

1. **Copy Agent File**:
   - Read source file from `.cursor/agents/{name}.md`
   - Write to target directory (`.github/agents/{name}.md` or `.claude/agents/{name}.md`)
   - Preserve file content and structure
   - **Important**: Source file remains unchanged

2. **Update Compatibility Metadata** (in target file only):
   - Read compatibility field from copied target file
   - Add "Claude Code" or "Claude Desktop" if not present
   - Preserve existing compatibility entries
   - Validate compatibility field length ≤500 chars
   - Handle errors if length exceeded (see compatibility guide)

3. **Preserve Format**:
   - Maintain YAML frontmatter structure
   - Preserve Markdown content
   - Keep file encoding

### Phase 6: Verification

1. **File Verification**:
   - Check if target file exists
   - Verify file permissions
   - Check file size matches source

2. **Format Validation**:
   - Validate YAML frontmatter syntax
   - Verify required fields present
   - Check compatibility field format

3. **Report Results**:
   - Document sync status (synced, skipped, conflict)
   - Report any errors or warnings
   - Include file paths and metadata

## Skill Sync Workflow (Detailed)

### Phase 1: Source Detection

1. **Scan Source Directory**:
   - Read `.cursor/skills/` directory
   - List all subdirectories
   - Check each directory for `SKILL.md` file

2. **Validate Skill Structure**:
   - Verify `SKILL.md` exists in each skill directory
   - Check YAML frontmatter format
   - Verify required fields: `name`, `description`
   - Check for optional directories: `references/`, `scripts/`, `examples/`

3. **List Skills**:
   - Create list of valid skills with metadata
   - Include: name, description, compatibility, directory structure

### Phase 2: Target Selection

1. **Determine Target Platform**:
   - Use target platform detection logic (same as agents)
   - Select target directory based on platform:
     - Claude Code → `.github/skills/`
     - Claude Desktop → `.claude/skills/`

2. **Create Target Directory**:
   - Check if target directory exists
   - Create if it doesn't exist
   - Verify directory is writable

### Phase 3: Compatibility Check

1. **Verify Format Compatibility**:
   - Check SKILL.md YAML frontmatter format
   - Verify follows Agent Skills spec
   - Check for Cursor-specific features

2. **Check Compatibility Field**:
   - Read compatibility field from source SKILL.md
   - Verify if Claude Code/Desktop is listed
   - Note if compatibility update needed

### Phase 4: Conflict Detection

1. **Check Existing Directories**:
   - For each skill, check if directory exists in target
   - Compare directory names (case-sensitive)
   - Detect name collisions

2. **Version Comparison** (if metadata available):
   - Compare source and target versions
   - Detect version mismatches

3. **Functionality Overlap Detection**:
   - Compare skill descriptions
   - Check for similar names or functionality
   - Report potential overlaps

4. **Report Conflicts**:
   - List all conflicts found
   - Categorize by conflict type
   - Provide resolution recommendations

### Phase 5: Sync Execution

1. **Copy Skill Directory**:
   - Copy entire skill directory from `.cursor/skills/{skill-name}/` to target
   - Preserve directory structure:
     - `SKILL.md` (required)
     - `references/` (if present)
     - `scripts/` (if present)
     - `examples/` (if present)
   - **Important**: Source directory remains unchanged

2. **Update Compatibility Metadata** (in target SKILL.md only):
   - Read compatibility field from copied target SKILL.md
   - Add "Claude Code" or "Claude Desktop" if not present
   - Preserve existing compatibility entries
   - Validate compatibility field length ≤500 chars
   - Handle errors if length exceeded

3. **Preserve Structure**:
   - Maintain directory structure
   - Preserve file contents
   - Keep file encodings

### Phase 6: Verification

1. **Directory Verification**:
   - Check if target directory exists
   - Verify SKILL.md exists in target
   - Check for optional directories (references/, scripts/)

2. **Format Validation**:
   - Validate SKILL.md YAML frontmatter syntax
   - Verify required fields present
   - Check compatibility field format

3. **File Count Verification**:
   - Count files copied
   - Compare with source directory
   - Report any missing files

4. **Report Results**:
   - Document sync status (synced, skipped, conflict)
   - Report file count
   - Include directory paths and metadata

## Sync Results Format

### Agent Sync Results

```markdown
## Agent Sync Results

### Agent: {name}
- **Source**: `.cursor/agents/{name}.md`
- **Target**: `.github/agents/{name}.md` (or `.claude/agents/`)
- **Status**: {synced | skipped | conflict}
- **Conflict**: {description or "None"}
- **Compatibility**: {compatible | needs-review}
- **Compatibility Updated**: {yes | no | skipped}
```

### Skill Sync Results

```markdown
## Skill Sync Results

### Skill: {skill-name}
- **Source**: `.cursor/skills/{skill-name}/`
- **Target**: `.github/skills/{skill-name}/` (or `.claude/skills/`)
- **Status**: {synced | skipped | conflict}
- **Conflict**: {description or "None"}
- **Compatibility**: {compatible | needs-review}
- **Files Copied**: {count} files
- **Compatibility Updated**: {yes | no | skipped}
```

## Error Handling

### Common Errors

1. **Directory Not Writable**:
   - Check directory permissions
   - Report error to user
   - Skip sync for this item

2. **YAML Parsing Error**:
   - Skip compatibility update
   - Report error in sync results
   - Continue with sync (file copied but compatibility not updated)

3. **Compatibility Field Length Exceeded**:
   - Apply error handling options (see compatibility guide)
   - Report warning in sync results
   - Continue with sync

4. **File Copy Failure**:
   - Report error to user
   - Skip sync for this item
   - Continue with other items

## Best Practices

1. **Always Preserve Source**: Never modify source files during sync
2. **Validate Before Sync**: Check compatibility and conflicts before copying
3. **Report Everything**: Document all sync operations, successes, and failures
4. **Handle Errors Gracefully**: Continue sync even if individual items fail
5. **User Decisions**: Wait for user decisions on conflicts before proceeding
