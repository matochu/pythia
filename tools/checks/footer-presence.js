#!/usr/bin/env node
/**
 * Footer guard: given assistant turn text via stdin (or file arg),
 * warn if a workflow skill ran but the reply lacks ## Next Steps AND **Active context**.
 *
 * Usage: node .pythia/runtime/checks/footer-presence.js [<transcript-or-text-file>]
 *   If no file arg, reads from stdin.
 * Exit: 0 = ok, 1 = missing footer elements, 2 = usage/io error
 */

import { readFileSync, existsSync } from 'node:fs';

const [file] = process.argv.slice(2);

let text;
if (file) {
  if (!existsSync(file)) { console.error(`${file}:0: [io.missing_file] File not found`); process.exit(2); }
  text = readFileSync(file, 'utf8');
} else {
  text = readFileSync(0, 'utf8');
}

if (!text.trim()) process.exit(0);

// Detect if a workflow skill appears to have run (heuristic: presence of known skill patterns)
const skillSignals = [
  /skill: \/(plan|review|replan|implement|audit|retro|ctx|feat|research|workflow)\b/i,
  /role: (Architect|Reviewer|Developer|Product Manager|QA Automation|Researcher)\b/i,
  /Active context:/i,
  /## Next Steps/i,
];
const looksLikeWorkflowTurn = skillSignals.some((re) => re.test(text));

if (!looksLikeWorkflowTurn) {
  // Not obviously a workflow skill turn — skip
  process.exit(0);
}

const hasNextSteps = /^## Next Steps/m.test(text);
const hasActiveContext = /\*\*Active context\*\*:/m.test(text);

if (!hasNextSteps || !hasActiveContext) {
  const missing = [];
  if (!hasNextSteps) missing.push('## Next Steps');
  if (!hasActiveContext) missing.push('**Active context**');
  console.error(`[footer-presence] Workflow skill reply is missing: ${missing.join(', ')}`);
  process.exit(1);
}

process.exit(0);
