import { describe, it, expect } from 'vitest';
import { editedPaths, normalizedToolName, toolName, commandText, resolveEditedPath, editedPathForZoneMatch } from '../event.js';

describe('editedPaths', () => {
  it('Edit event → input.file_path', () => {
    const event = { tool_name: 'Edit', tool_input: { file_path: 'src/foo.js' } };
    expect(editedPaths(event)).toEqual(['src/foo.js']);
  });

  it('Write event → input.file_path', () => {
    const event = { tool_name: 'Write', tool_input: { file_path: 'README.md' } };
    expect(editedPaths(event)).toEqual(['README.md']);
  });

  it('MultiEdit event (Claude Code-only) → edits[].file_path', () => {
    const event = {
      tool_name: 'MultiEdit',
      tool_input: {
        edits: [
          { file_path: 'a.js', old_string: 'x', new_string: 'y' },
          { file_path: 'b.js', old_string: 'x', new_string: 'y' },
        ],
      },
    };
    expect(editedPaths(event)).toEqual(['a.js', 'b.js']);
  });

  it('apply_patch event (Codex canonical) → parse patch string', () => {
    const patch = `--- a/src/cli/workspace.js\n+++ b/src/cli/workspace.js\n@@ -1,1 +1,1 @@\n-old\n+new\n`;
    const event = { tool_name: 'apply_patch', tool_input: { patch } };
    expect(editedPaths(event)).toContain('src/cli/workspace.js');
  });

  it('apply_patch with /dev/null does not include it', () => {
    const patch = `--- /dev/null\n+++ b/new-file.js\n@@ -0,0 +1 @@\n+content\n`;
    const event = { tool_name: 'apply_patch', tool_input: { patch } };
    const paths = editedPaths(event);
    expect(paths).toContain('new-file.js');
    expect(paths).not.toContain('/dev/null');
  });

  it('apply_patch deduplicates paths', () => {
    const patch = `--- a/foo.js\n+++ b/foo.js\n@@ -1 +1 @@\n-x\n+y\n--- a/foo.js\n+++ b/foo.js\n@@ -5 +5 @@\n-a\n+b\n`;
    const event = { tool_name: 'apply_patch', tool_input: { patch } };
    expect(editedPaths(event)).toEqual(['foo.js']);
  });

  it('returns [] for event with no paths', () => {
    expect(editedPaths({})).toEqual([]);
    expect(editedPaths({ tool_name: 'Bash', tool_input: { command: 'echo hi' } })).toEqual([]);
  });
});

describe('resolveEditedPath', () => {
  it('returns absolute paths unchanged', () => {
    expect(resolveEditedPath('/ws', '/ws/plans/a.plan.md')).toBe('/ws/plans/a.plan.md');
  });

  it('resolves relative paths against workspace root', () => {
    expect(resolveEditedPath('/ws', 'plans/a.plan.md')).toBe('/ws/plans/a.plan.md');
  });

  it('editedPathForZoneMatch returns workspace-relative path', () => {
    expect(editedPathForZoneMatch('/ws', 'plans/a.plan.md')).toBe('plans/a.plan.md');
  });
});

describe('normalizedToolName', () => {
  it('apply_patch → Edit', () => {
    expect(normalizedToolName({ tool_name: 'apply_patch' })).toBe('Edit');
  });
  it('Edit → Edit', () => {
    expect(normalizedToolName({ tool_name: 'Edit' })).toBe('Edit');
  });
  it('Bash → Bash', () => {
    expect(normalizedToolName({ tool_name: 'Bash' })).toBe('Bash');
  });
});

describe('commandText', () => {
  it('extracts command from Bash event', () => {
    const event = { tool_name: 'Bash', tool_input: { command: 'echo hi' } };
    expect(commandText(event)).toBe('echo hi');
  });
});
