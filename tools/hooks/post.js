#!/usr/bin/env node
/**
 * PostToolUse hook — thin router (nudge-only).
 *
 * 1. Nudge-only: checker failures are emitted via warn() on stderr; this hook never
 *    calls process.exit(1). Editing workflow docs is never blocked here.
 * 2. Not a validator gate: authoritative format validation is the Validator skill
 *    (`/validate`); PostToolUse warnings are advisory only.
 * 3. To add a new workflow artifact type: append one line under
 *    `assets/base/config/paths.md` → `## Workflow docs` (checker routing is data-driven).
 *    Runtime hooks fall back to `.pythia/runtime/package-paths.md` when workspace copy is absent.
 *
 * Claude matchers: Edit|Write|MultiEdit
 * Codex matchers:  apply_patch|Edit|Write
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { editedPaths, readEvent, repoRoot, warn, isHookEntrypoint, resolveEditedPath } from '../lib/event.js';
import { loadZones, zone } from '../lib/paths.js';
import { isPythiaSyncMarkdownRelPath } from '../lib/references/refs.js';
import { nudge } from './workflow-nudge.js';

const CHECKS = resolve(dirname(fileURLToPath(import.meta.url)), '../checks');

/** @param {string} name @param {string} pattern */
export function matchGlob(name, pattern) {
  const mid = pattern.indexOf('*');
  if (mid > 0 && mid < pattern.length - 1) {
    return name.startsWith(pattern.slice(0, mid)) && name.endsWith(pattern.slice(mid + 1));
  }
  if (pattern.startsWith('*')) return name.endsWith(pattern.slice(1));
  if (pattern.endsWith('*')) return name.startsWith(pattern.slice(0, -1));
  return name === pattern;
}

function runChecker(name, root, ...args) {
  if (!existsSync(resolve(CHECKS, name))) return;
  const opts = { encoding: 'utf8' };
  if (root) opts.cwd = root;
  const r = spawnSync(process.execPath, [resolve(CHECKS, name), ...args], opts);
  if (r.status === 1 && r.stderr) warn(r.stderr.trim());
  // exit 2 (usage error) is silently ignored in hook context
}

function main() {
  const event = readEvent();
  const paths = editedPaths(event);
  if (!paths.length) return 0;

  const root = repoRoot(event);
  const zones = root ? loadZones(root) : new Map();
  const wfDocs = zone(zones, 'Workflow docs');
  const postCmds = zone(zones, 'Post-commands');

  for (const raw of paths) {
    const p = resolveEditedPath(root, raw);
    if (!existsSync(p)) continue;
    const base = basename(p);
    const relFromRoot = root ? relative(root, p).replace(/\\/g, '/') : '';

    if (root) {
      for (const entry of postCmds) {
        if (
          isPythiaSyncMarkdownRelPath(relFromRoot)
          && matchGlob(base, entry.path)
          && entry.command
        ) {
          const parts = entry.command.trim().split(/\s+/);
          const scriptRel = parts[0];
          const fixedArgs = parts.slice(1);
          const script = resolve(root, scriptRel);
          if (existsSync(script)) {
            const r = spawnSync(process.execPath, [script, ...fixedArgs, p], {
              encoding: 'utf8',
              stdio: ['ignore', 'pipe', 'pipe'],
              cwd: root,
            });
            if (r.stderr) warn(r.stderr.trim());
            break;
          }
        }
      }
    }

    for (const entry of wfDocs) {
      if (matchGlob(base, entry.path) && entry.checker) {
        for (const c of entry.checker.split(',').map((s) => basename(s.trim()))) {
          if (c === 'artifact-metadata.js') {
            runChecker(c, root, '--strict', p);
          } else {
            runChecker(c, root, p);
          }
        }
      }
    }

    // SKILL.md: special-case (not a workflow doc type in paths.md)
    if (base === 'SKILL.md') {
      runChecker('skill-paths.js', root, p);
      runChecker('skill-footers.js', root, p);
    }

    nudge(p);
  }

  return 0;
}

if (isHookEntrypoint(import.meta.url)) {
  process.exitCode = main();
}
