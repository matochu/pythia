#!/usr/bin/env node
/**
 * Check that a workflow SKILL.md declares the shared footer contract
 * (references ## Next Steps and **Active context** in its template).
 * Usage: node .pythia/runtime/checks/skill-footers.js <SKILL.md>
 * Exit: 0 = ok, 1 = missing footer contract, 2 = usage/io error
 */

import { existsSync, readFileSync } from 'node:fs';

const [file] = process.argv.slice(2);
if (!file) { console.error('Usage: node .pythia/runtime/checks/skill-footers.js <SKILL.md>'); process.exit(2); }
if (!existsSync(file)) { console.error(`${file}:0: [io.missing_file] File not found`); process.exit(2); }

const content = readFileSync(file, 'utf8');

// Skip non-workflow skills (those without response format templates)
if (!content.includes('## Next Steps') && !content.includes('Active context')) {
  process.exit(0);
}

let failed = false;
if (!content.includes('## Next Steps')) {
  console.error(`${file}:0: [skill-footers.missing_next_steps] Workflow SKILL.md must declare ## Next Steps in its response template`);
  failed = true;
}
if (!content.includes('**Active context**')) {
  console.error(`${file}:0: [skill-footers.missing_active_context] Workflow SKILL.md must declare **Active context** footer in its response template`);
  failed = true;
}

process.exit(failed ? 1 : 0);
