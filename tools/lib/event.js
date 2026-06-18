import { readFileSync, existsSync, realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export function readEvent() {
  const raw = readFileSync(0, 'utf8').trim();
  if (!raw) return {};
  try {
    const value = JSON.parse(raw);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : { value };
  } catch {
    return { raw_stdin: raw };
  }
}

export function repoRoot(event = {}) {
  const cwd = event.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  let path = resolve(String(cwd));
  while (true) {
    if (existsSync(resolve(path, '.git'))) return path;
    const parent = dirname(path);
    if (parent === path) return resolve(String(cwd));
    path = parent;
  }
}

export function toolName(event) {
  return String(event.tool_name || event.toolName || '');
}

export function toolInput(event) {
  const value = event.tool_input || event.toolInput || {};
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export function commandText(event) {
  const data = toolInput(event);
  const candidates = [data.command, data.cmd, data.script, data.url, data.text, data.element, data.target, data.value, event.command];
  return candidates.filter(Boolean).map(String).join('\n');
}

/**
 * Extract edited file paths from all known event shapes:
 *   (a) Edit/Write  → input.file_path
 *   (b) MultiEdit   → input.edits[].file_path  (Claude Code only)
 *   (c) apply_patch → parse patch string for --- a/<path> / +++ b/<path> lines (Codex canonical)
 * Returns a deduplicated array of paths.
 */
export function editedPaths(event) {
  const name = toolName(event);
  const data = toolInput(event);
  const paths = [];

  // Cursor afterFileEdit: top-level file_path + workspace_roots
  if (event.hook_event_name === 'afterFileEdit' && event.file_path) {
    paths.push(String(event.file_path));
    return [...new Set(paths)];
  }

  if (name === 'apply_patch') {
    // Parse standard unified-diff headers from the patch string
    const patch = String(data.patch || data.content || '');
    for (const line of patch.split('\n')) {
      const m = line.match(/^(?:---|\+\+\+) [ab]\/(.+)$/);
      if (m && m[1] !== '/dev/null') paths.push(m[1]);
    }
  } else if (name === 'MultiEdit') {
    for (const edit of (data.edits ?? [])) {
      if (edit.file_path) paths.push(String(edit.file_path));
    }
  } else {
    // Edit, Write, or any other tool
    const keys = ['file_path', 'path', 'filename', 'target_file'];
    for (const key of keys) {
      if (data[key]) { paths.push(String(data[key])); break; }
    }
  }

  return [...new Set(paths)];
}

/**
 * Normalize tool name: apply_patch → "Edit" so routing logic stays uniform.
 */
export function normalizedToolName(event) {
  const name = toolName(event);
  return name === 'apply_patch' ? 'Edit' : name;
}

export function printClaudeDeny(reason, eventName = 'PreToolUse') {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: eventName,
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  }));
}

export function warn(message) {
  console.error(message);
}

/** True when moduleUrl is the Node CLI entry (argv[1]). Uses realpath for macOS /var symlinks. */
export function isHookEntrypoint(moduleUrl = import.meta.url) {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return realpathSync(fileURLToPath(moduleUrl)) === realpathSync(entry);
  } catch {
    return moduleUrl === pathToFileURL(entry).href;
  }
}
