#!/usr/bin/env node
/**
 * Stop hook — footer-guard + changed-files reminder.
 * Runs footer-presence check on the assistant turn content.
 * All findings are warnings (never block).
 */

import { spawnSync } from 'node:child_process';
import { existsSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readEvent, repoRoot, warn } from '../lib/event.js';

const CHECKS = resolve(dirname(fileURLToPath(import.meta.url)), '../checks');

function assistantText(event) {
  const candidates = [
    event.assistant_response, event.assistantResponse,
    event.response, event.message, event.text, event.content,
  ];
  const transcript = event.transcript ?? event.messages;
  if (transcript != null) candidates.push(transcript);
  return candidates.filter((v) => v != null).map((v) => typeof v === 'string' ? v : JSON.stringify(v)).join('\n');
}

function main() {
  const event = readEvent();
  const text = assistantText(event);

  // Footer-guard
  if (text.trim()) {
    const tmp = join(tmpdir(), `pythia-stop-${Date.now()}.txt`);
    try {
      writeFileSync(tmp, text, 'utf8');
      const footerChecker = resolve(CHECKS, 'footer-presence.js');
      if (existsSync(footerChecker)) {
        const r = spawnSync(process.execPath, [footerChecker, tmp], { encoding: 'utf8' });
        if (r.status === 1 && r.stderr) warn(r.stderr.trim());
      }
    } finally {
      try { unlinkSync(tmp); } catch { /* ignore */ }
    }
  }

  warn('pythia-hook stop: report changed files and verification status when completing a workflow task');

  return 0;
}

process.exitCode = main();
