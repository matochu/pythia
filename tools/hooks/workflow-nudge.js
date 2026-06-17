#!/usr/bin/env node
/**
 * Workflow-state nudges — stderr reminders after workflow doc edits.
 * Called from post.js. Logic lives in workflow-state.js (tested separately).
 *
 * Exit: 0 always (warnings only, never blocks).
 */

import { computeWorkflowNudges } from './workflow-state.js';

export function nudge(filePath) {
  for (const msg of computeWorkflowNudges(filePath)) {
    console.error(msg);
  }
}
