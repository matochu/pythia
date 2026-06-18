import { describe, it, expect } from 'vitest';
import { verifyPathsMdWorkflowDocs } from '../paths-md-invariants.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const canonicalPaths = readFileSync(
  join(__dirname, '../../../assets/base/config/paths.md'),
  'utf8'
);

describe('verifyPathsMdWorkflowDocs', () => {
  it('passes shipped canonical paths.md', () => {
    expect(verifyPathsMdWorkflowDocs(canonicalPaths).ok).toBe(true);
  });

  it('fails legacy tools/checks/ checker paths', () => {
    const legacy = canonicalPaths.replace(
      'checker: role-boundary.js',
      'checker: tools/checks/role-boundary.js'
    );
    const r = verifyPathsMdWorkflowDocs(legacy);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/legacy tools\/checks/);
  });
});
