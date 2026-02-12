# Conflict Detection and Resolution Guide

This document provides detailed procedures for detecting and resolving conflicts during synchronization from Cursor to Claude Code/Desktop.

## Conflict Types

### 1. Name Collision

**Definition**: Agent or skill with the same name already exists in target directory.

**Detection**:
- Compare file/directory names (case-sensitive)
- Check exact name match
- Report if target exists

**Example**:
- Source: `.cursor/agents/my-agent.md`
- Target: `.github/agents/my-agent.md` (already exists)
- Conflict: Name collision

### 2. Version Mismatch

**Definition**: Same agent/skill exists in target but with different version or content.

**Detection**:
- Compare file modification dates (if available)
- Compare file sizes
- Compare content hash (if available)
- Check metadata for version info

**Example**:
- Source: `.cursor/skills/my-skill/` (modified 2026-02-10)
- Target: `.github/skills/my-skill/` (modified 2026-02-08)
- Conflict: Version mismatch (source is newer)

### 3. Functionality Overlap

**Definition**: Different agents/skills with similar functionality or names.

**Detection**:
- Compare descriptions for similarity
- Check name similarity (fuzzy matching)
- Analyze functionality overlap

**Example**:
- Source: `.cursor/skills/test-generator/`
- Target: `.github/skills/test-creator/` (similar functionality)
- Conflict: Functionality overlap

### 4. Format Incompatibility

**Definition**: Source and target have incompatible formats.

**Detection**:
- Check YAML frontmatter format
- Verify Agent Skills spec compliance
- Detect format errors

**Example**:
- Source: Valid Agent Skills format
- Target: Invalid format or missing required fields
- Conflict: Format incompatibility

## Conflict Detection Procedures

### Phase 1: Pre-Sync Detection

**Before starting sync**:

1. **Scan Target Directory**:
   - List all existing agents in target directory
   - List all existing skills in target directory
   - Create inventory of target items

2. **Compare with Source**:
   - For each source agent/skill, check if target exists
   - Compare names (case-sensitive)
   - Detect exact matches

3. **Detect Overlaps**:
   - Compare descriptions for similarity
   - Check for name variations
   - Identify potential functionality overlaps

4. **Collect Metadata** (if available):
   - File modification dates
   - File sizes
   - Version information
   - Content hashes

### Phase 2: Conflict Categorization

**Categorize each conflict**:

1. **Name Collision**: Exact name match
2. **Version Mismatch**: Same name, different content/version
3. **Functionality Overlap**: Similar functionality, different names
4. **Format Incompatibility**: Incompatible formats

### Phase 3: Conflict Reporting

**Report conflicts in structured format**:

```markdown
## Conflicts Detected

### Agent: {name}
- **Source**: `.cursor/agents/{name}.md`
- **Target**: `.github/agents/{name}.md` (or `.claude/agents/`)
- **Conflict Type**: Name Collision
- **Conflict Details**: Target file already exists (modified {date})
- **Resolution Options**: Skip, Overwrite, Rename

### Skill: {skill-name}
- **Source**: `.cursor/skills/{skill-name}/`
- **Target**: `.github/skills/{skill-name}/` (or `.claude/skills/`)
- **Conflict Type**: Version Mismatch
- **Conflict Details**: Source is newer (modified {date})
- **Resolution Options**: Skip, Overwrite, Rename
```

## User Interaction Flow

### Standard Flow

**Step 1**: Detect conflicts before sync starts
- Scan source and target directories
- Identify all conflicts
- Categorize by conflict type

**Step 2**: Report all conflicts to user
- Present conflicts in structured format
- Show source and target paths
- Explain conflict type and details

**Step 3**: Present resolution options
- For each conflict, show options:
  - **Skip**: Don't sync this item (keep existing target)
  - **Overwrite**: Replace target with source
  - **Rename**: Create with different name

**Step 4**: User provides decisions
- User responds with decisions for each conflict
- Format: `"skip agent-x, overwrite skill-y, rename agent-z to agent-z-v2"`
- LLM parses user decisions and applies them during sync
- **Default behavior**: If user doesn't provide decisions, skip conflicting items and sync non-conflicting items

**Step 5**: Execute sync with user decisions applied
- Apply user decisions to each conflict
- Sync non-conflicting items
- Report sync results

### Alternative Flow (Review First)

**If user wants to review conflicts first**:

1. Report conflicts and pause sync
2. Wait for user to provide resolution decisions
3. Resume sync after user decisions received
4. Apply decisions and continue with sync

## Conflict Resolution Options

### Option 1: Skip

**Action**: Don't sync this item, keep existing target.

**When to use**:
- Target is newer or preferred
- User wants to keep existing version
- Conflict cannot be resolved automatically

**Implementation**:
- Skip copying this item
- Report in sync results: "Skipped (conflict: {reason})"
- Continue with other items

### Option 2: Overwrite

**Action**: Replace target with source.

**When to use**:
- Source is newer or preferred
- User wants to update target
- Conflict can be resolved by replacing

**Implementation**:
- Delete existing target file/directory
- Copy source to target
- Report in sync results: "Overwritten (conflict: {reason})"
- Continue with other items

### Option 3: Rename

**Action**: Create with different name.

**When to use**:
- User wants to keep both versions
- Different names indicate different purposes
- Conflict can be resolved by renaming

**Implementation**:
- Copy source to target with new name
- Report in sync results: "Renamed to {new-name} (conflict: {reason})"
- Continue with other items

## Conflict Resolution Examples

### Example 1: Name Collision - Skip

**Conflict**:
- Source: `.cursor/agents/my-agent.md`
- Target: `.github/agents/my-agent.md` (exists)

**User Decision**: `"skip my-agent"`

**Action**:
- Skip syncing `my-agent`
- Keep existing target file
- Report: "Agent 'my-agent' skipped (conflict: name collision)"

### Example 2: Version Mismatch - Overwrite

**Conflict**:
- Source: `.cursor/skills/my-skill/` (newer)
- Target: `.github/skills/my-skill/` (older)

**User Decision**: `"overwrite my-skill"`

**Action**:
- Delete existing target directory
- Copy source directory to target
- Report: "Skill 'my-skill' overwritten (conflict: version mismatch)"

### Example 3: Name Collision - Rename

**Conflict**:
- Source: `.cursor/agents/my-agent.md`
- Target: `.github/agents/my-agent.md` (exists)

**User Decision**: `"rename my-agent to my-agent-v2"`

**Action**:
- Copy source to `.github/agents/my-agent-v2.md`
- Keep existing target file
- Report: "Agent 'my-agent' renamed to 'my-agent-v2' (conflict: name collision)"

## Best Practices

1. **Detect Early**: Check for conflicts before starting sync
2. **Report Clearly**: Present conflicts in structured, easy-to-understand format
3. **Wait for Decisions**: Don't proceed with conflicting items until user provides decisions
4. **Default Behavior**: Skip conflicting items if user doesn't provide decisions
5. **Document Everything**: Report all conflict resolutions in sync results
6. **Preserve Source**: Never modify source files during conflict resolution

## Conflict Detection Checklist

Before syncing, check:

- [ ] Target directory exists and is readable
- [ ] Source items listed and validated
- [ ] Conflicts detected and categorized
- [ ] Conflicts reported to user
- [ ] User decisions received (or default applied)
- [ ] Decisions applied during sync
- [ ] Results documented in sync report

## Error Handling

### Common Errors

1. **Target Directory Not Accessible**:
   - Report error
   - Skip conflict detection for inaccessible targets
   - Continue with accessible targets

2. **Invalid User Decision Format**:
   - Parse user decision carefully
   - Report parsing errors
   - Ask user to clarify if unclear

3. **Rename Target Already Exists**:
   - Check if rename target exists
   - Report conflict
   - Ask user for alternative name

4. **Overwrite Permission Denied**:
   - Check file permissions
   - Report error
   - Skip overwrite, ask user for alternative
