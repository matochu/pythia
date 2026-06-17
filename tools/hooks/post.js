#!/usr/bin/env node
/**
 * PostToolUse hook — thin router.
 * Runs per-path checkers on edited files and workflow-state nudges.
 * All check failures are warnings (never block).
 *
 * Claude matchers: Edit|Write|MultiEdit
 * Codex matchers:  apply_patch|Edit|Write
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { editedPaths, readEvent, repoRoot, warn } from '../lib/event.js';
import { nudge } from './workflow-nudge.js';

const CHECKS = resolve(dirname(fileURLToPath(import.meta.url)), '../checks');

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

  for (const p of paths) {
    if (!existsSync(p)) continue;

    const base = basename(p);

    // Workflow docs — run structural and content checks
    if (base.endsWith('.plan.md')) {
      runChecker('links.js', p);
      runChecker('plan-version-log.js', p);
      runChecker('plan-numbering.js', p);
      runChecker('cross-refs.js', p);
      runChecker('plans-index.js', p);
      runChecker('inputs-fresh.js', p);
      runChecker('doc-structure.js', p);
    } else if (base.endsWith('.review.md') || base.endsWith('.implementation.md') || base.endsWith('.audit.md')) {
      runChecker('links.js', p);
      runChecker('inputs-fresh.js', p);
      runChecker('doc-structure.js', p);
    }

    // SKILL.md
    if (base === 'SKILL.md') {
      runChecker('skill-paths.js', p);
      runChecker('skill-footers.js', p);
    }

    // Workflow-state nudge (auto-review / review-loop pattern)
    nudge(p);
  }

  return 0;
}

process.exitCode = main();
