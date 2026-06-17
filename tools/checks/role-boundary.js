#!/usr/bin/env node
/**
 * Role boundary check: warn when a file path matches a role-owned artifact pattern.
 * This is a WARN-only check — hook callers must NOT DENY on exit 1.
 *
 * Role ownership:
 *   *.review.md      → Reviewer (via /review)
 *   *.implementation.md → Developer (via /implement)
 *   *.audit.md       → Architect (via /audit)
 *
 * Usage: node .pythia/runtime/checks/role-boundary.js <file-path>
 * Exit: 0 = not a role-owned artifact, 1 = is role-owned (WARN — not DENY), 2 = usage error
 */

const [file] = process.argv.slice(2);
if (!file) { console.error('Usage: node .pythia/runtime/checks/role-boundary.js <file-path>'); process.exit(2); }

const roles = [
  { pattern: /\.review\.md$/, role: 'Reviewer', skill: '/review' },
  { pattern: /\.implementation\.md$/, role: 'Developer', skill: '/implement' },
  { pattern: /\.audit\.md$/, role: 'Architect', skill: '/audit' },
];

for (const { pattern, role, skill } of roles) {
  if (pattern.test(file)) {
    console.error(`role-boundary: ${file} is a role-owned artifact (${role} via ${skill}) — verify you are running the correct skill`);
    process.exit(1);
  }
}

process.exit(0);
