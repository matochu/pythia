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
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { editedPaths, normalizedToolName, toolName, toolInput, commandText, printClaudeDeny, readEvent, repoRoot, warn, resolveEditedPath, editedPathForZoneMatch } from '../lib/event.js';
import { loadZones, generatedCachePaths, protectedPaths, zone } from '../lib/paths.js';
import { isPythiaSyncMarkdownRelPath } from '../lib/references/refs.js';

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
    for (const raw of editedPaths(event)) {
      const abs = resolveEditedPath(root, raw);
      const p = editedPathForZoneMatch(root, raw);
      // Generated-cache warn
      const genEntry = zone(zones, 'Generated cache').find(
        (e) => p === e.path || p.startsWith(`${e.path}/`) || p.endsWith(`/${e.path}`) || p.includes(`/${e.path}/`),
      );
      if (genEntry) {
        warn(`pythia-hook: ${p} is a generated cache file — edit source ${genEntry.source ?? 'skills/'} instead`);
      }

      // Role-boundary warn
      runChecker('role-boundary.js', abs);

      // Trailing-refs mutation warn: LLM must not write ## References / ## Used by
      const rel = relative(root, abs).replace(/\\/g, '/');
      if (isPythiaSyncMarkdownRelPath(rel)) {
        const input = toolInput(event);
        const patchText = [
          input.new_string, input.content, input.new_content,
          ...(input.edits ?? []).map((e) => e.new_string ?? ''),
        ].filter(Boolean).join('\n');
        if (addsMachineOwnedRefs(patchText)) {
          warn(
            `pythia-hook: patch to ${rel} adds a "## References" or "## Used by" section — these are machine-owned (inputs.js sync). Remove the section and let sync build it from body links.`,
          );
        }
      }
    }
  }

  return 0;
}

process.exitCode = main();

function addsMachineOwnedRefs(text) {
  return (
    /(?:^|\n)## References\s*$|(?:^|\n)## Used by\s*$/m.test(text) ||
    /(?:^|\n)- \[(?:audit|code|context|doc|external|feat|impl|note|plan|research|retro|review|skill)\] \[[^\]]+\]\([^)]+\)/m.test(text)
  );
}
