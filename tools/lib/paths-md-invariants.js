/**
 * Workflow docs invariants for .pythia/config/paths.md (shared by migrate:verify and health).
 * @returns {{ ok: boolean, reason?: string }}
 */
export function verifyPathsMdWorkflowDocs(content) {
  if (!content.includes('role-boundary.js')) {
    return { ok: false, reason: 'Workflow docs missing role-boundary.js checker' };
  }
  if (!content.includes('*.context.md')) {
    return { ok: false, reason: 'Workflow docs missing *.context.md entry' };
  }
  const wfIdx = content.indexOf('## Workflow docs');
  if (wfIdx === -1) {
    return { ok: false, reason: 'missing ## Workflow docs section' };
  }
  const wfBody = content.slice(wfIdx);
  if (/checker:\s*tools\/checks\//.test(wfBody)) {
    return { ok: false, reason: 'Workflow docs still use legacy tools/checks/ checker paths' };
  }
  return { ok: true };
}
