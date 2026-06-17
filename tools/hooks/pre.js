#!/usr/bin/env node
/**
 * PreToolUse hook — thin router.
 * One explicit DENY class: shell-redirect into Protected or Generated-cache zone.
 * Everything else is warn-only (including role-owned artifact edits).
 *
 * Claude matchers: Bash|Edit|Write|MultiEdit
 * Codex matchers:  functions.exec_command|apply_patch|Edit|Write
 */

import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { editedPaths, normalizedToolName, toolName, commandText, printClaudeDeny, readEvent, repoRoot, warn } from '../lib/event.js';
import { loadZones, generatedCachePaths, protectedPaths, zone } from '../lib/paths.js';

const CHECKS = resolve(dirname(fileURLToPath(import.meta.url)), '../checks');

function runChecker(name, ...args) {
  const r = spawnSync(process.execPath, [resolve(CHECKS, name), ...args], { encoding: 'utf8' });
  if (r.status === 1 && r.stderr) console.error(r.stderr.trim());
  return r.status ?? 0;
}

function isShellRedirectToPath(command, paths) {
  for (const p of paths) {
    // Strip glob suffixes (/**) and match as a prefix
    const prefix = p.replace(/\/\*\*$/, '').replace(/\*\*$/, '');
    // Escape remaining special regex chars
    const escaped = prefix.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`>>?\\s*(?:"|')?${escaped}`).test(command)) return true;
  }
  return false;
}

function main() {
  const event = readEvent();
  const root = repoRoot(event);
  const zones = loadZones(root);
  const generated = generatedCachePaths(zones);
  const protected_ = protectedPaths(zones);
  const allProtectedAndCache = [...generated, ...protected_];

  const name = toolName(event);
  const normalized = normalizedToolName(event);

  // Shell-redirect DENY: Bash or functions.exec_command with > into protected/cache
  if (name === 'Bash' || name === 'functions.exec_command') {
    const cmd = commandText(event);
    if (cmd && isShellRedirectToPath(cmd, allProtectedAndCache)) {
      const reason = 'pythia-hook: use a structured edit tool (Edit/Write), not shell redirection into protected or cache paths';
      printClaudeDeny(reason);
      console.error(reason);
      return 1;
    }
    return 0;
  }

  // File edit events (Edit/Write/MultiEdit/apply_patch) — warn only, never deny
  if (normalized === 'Edit') {
    const paths = editedPaths(event);
    for (const p of paths) {
      // Generated-cache warn
      const genEntry = zone(zones, 'Generated cache').find((e) => p === e.path || p.endsWith(`/${e.path}`));
      if (genEntry) {
        warn(`pythia-hook: ${p} is a generated cache file — edit source ${genEntry.source ?? 'skills/'} instead`);
      }

      // Role-boundary warn
      runChecker('role-boundary.js', p);
    }
  }

  return 0;
}

process.exitCode = main();
