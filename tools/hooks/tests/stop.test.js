/**
 * Integration: stop.js footer-presence and completion reminder.
 */
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const hookDir = resolve(fileURLToPath(import.meta.url), '..');
const stopJs = join(hookDir, '..', 'stop.js');

function runStop(event) {
  return spawnSync(process.execPath, [stopJs], {
    input: JSON.stringify(event),
    encoding: 'utf8',
  });
}

describe('stop.js', () => {
  it('always exits 0', () => {
    expect(runStop({}).status).toBe(0);
  });

  it('warns when workflow-like reply lacks footer', () => {
    const event = {
      assistant_response: 'Review complete.\nrole: Reviewer\nskill: /review\n',
    };
    const r = runStop(event);
    expect(r.status).toBe(0);
    expect(r.stderr).toMatch(/footer-presence|missing/i);
  });

  it('does not warn footer when Next Steps and Active context present', () => {
    const event = {
      assistant_response: [
        'role: Reviewer',
        'skill: /review',
        '## Next Steps',
        '- run /implement',
        '**Active context**: role: Reviewer · feat: f · plan: p · review: R1 · skill: /review',
      ].join('\n'),
    };
    const r = runStop(event);
    expect(r.status).toBe(0);
    expect(r.stderr).not.toMatch(/footer-presence.*missing/i);
  });

  it('prints completion reminder', () => {
    const r = runStop({ assistant_response: 'done' });
    expect(r.stderr).toMatch(/report changed files/i);
  });
});
