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
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { editedPaths, readEvent, repoRoot, warn, isHookEntrypoint } from '../lib/event.js';
import { loadZones, zone } from '../lib/paths.js';
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

function runChecker(name, ...args) {
  if (!existsSync(resolve(CHECKS, name))) return;
  const r = spawnSync(process.execPath, [resolve(CHECKS, name), ...args], { encoding: 'utf8' });
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

  for (const p of paths) {
    if (!existsSync(p)) continue;
    const base = basename(p);

    for (const entry of wfDocs) {
      if (matchGlob(base, entry.path) && entry.checker) {
        for (const c of entry.checker.split(',').map((s) => basename(s.trim()))) {
          runChecker(c, p);
        }
      }
    }

    // SKILL.md: special-case (not a workflow doc type in paths.md)
    if (base === 'SKILL.md') {
      runChecker('skill-paths.js', p);
      runChecker('skill-footers.js', p);
    }

    nudge(p);
  }

  return 0;
}

if (isHookEntrypoint(import.meta.url)) {
  process.exitCode = main();
}
