#!/usr/bin/env node
/**
 * Cursor afterFileEdit adapter — maps cursor-hooks JSON to the shared post.js router.
 * Cursor stdin shape: { hook_event_name, file_path, edits, workspace_roots, ... }
 */
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readEvent } from '../lib/event.js';

const here = dirname(fileURLToPath(import.meta.url));
const cursorEvent = readEvent();
const root = (cursorEvent.workspace_roots && cursorEvent.workspace_roots[0]) || process.cwd();
let filePath = cursorEvent.file_path;
if (filePath && !isAbsolute(String(filePath))) {
  filePath = resolve(root, String(filePath));
}
const normalized = {
  hook_event_name: 'afterFileEdit',
  file_path: filePath,
  cwd: root,
};

const r = spawnSync(process.execPath, [join(here, 'post.js')], {
  input: JSON.stringify(normalized),
  encoding: 'utf8',
  stdio: ['pipe', 'inherit', 'inherit'],
});
process.exit(r.status ?? 0);
