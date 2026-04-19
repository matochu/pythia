#!/usr/bin/env bash
# Structural validation for reports/*.audit.md — see audit-format.md
set -euo pipefail

FILE="${1:?Usage: validate-audit.sh <path>}"
[[ -f "$FILE" ]] || { echo "$FILE:0: [io.missing_file] File not found" >&2; exit 2; }

ERRORS=0
line_for() { grep -n -m1 -E "$1" "$FILE" 2>/dev/null | cut -d: -f1 || echo 0; }

if ! grep -qE '^# Architect Audit:' "$FILE"; then
  echo "$FILE:1: [audit.header.h1] Missing H1 # Architect Audit:" >&2
  ((ERRORS++)) || true
fi

if ! grep -qE '^Plan:.*\.plan\.md' "$FILE"; then
  echo "$FILE:$(line_for '^Plan:'): [audit.header.links] Missing Plan: link to .plan.md" >&2
  ((ERRORS++)) || true
fi

if ! grep -qE '^Implementation:.*\.implementation\.md' "$FILE"; then
  echo "$FILE:$(line_for '^Implementation:'): [audit.header.links] Missing Implementation: link to .implementation.md" >&2
  ((ERRORS++)) || true
fi

if ! grep -qE '^## Conformance$' "$FILE"; then
  echo "$FILE:0: [audit.section.conformance] Missing ## Conformance" >&2
  ((ERRORS++)) || true
fi

if ! grep -qE '^- Status:[[:space:]]*(done|partial|no)' "$FILE"; then
  echo "$FILE:0: [audit.section.conformance] Missing Conformance Status: done | partial | no" >&2
  ((ERRORS++)) || true
fi

if ! grep -qE '^## Acceptance Criteria Check$' "$FILE"; then
  echo "$FILE:0: [audit.section.acceptance] Missing ## Acceptance Criteria Check" >&2
  ((ERRORS++)) || true
fi

if ! grep -qE '^- \[[ xX]\]' "$FILE"; then
  echo "$FILE:0: [audit.section.acceptance] Missing at least one checkbox line under acceptance criteria" >&2
  ((ERRORS++)) || true
fi

if ! grep -qE '^## Implementation quality check$' "$FILE"; then
  echo "$FILE:0: [audit.section.quality] Missing ## Implementation quality check" >&2
  ((ERRORS++)) || true
fi

if ! grep -qE '^- Status:[[:space:]]*(pass|concerns|fail)' "$FILE"; then
  echo "$FILE:0: [audit.section.quality] Missing quality Status: pass | concerns | fail" >&2
  ((ERRORS++)) || true
fi

if ! grep -qE '^## Risk Re-evaluation$' "$FILE"; then
  echo "$FILE:0: [audit.section.risk] Missing ## Risk Re-evaluation" >&2
  ((ERRORS++)) || true
fi

if ! grep -qE '^## Decision$' "$FILE"; then
  echo "$FILE:0: [audit.section.decision] Missing ## Decision" >&2
  ((ERRORS++)) || true
fi

if ! grep -qE '^[[:space:]]*-[[:space:]]+\*\*Verdict\*\*:[[:space:]]*(ready|needs-fixes|plan-fix|re-plan)' "$FILE"; then
  echo "$FILE:$(line_for 'Verdict'): [audit.section.decision] Missing - **Verdict**: ready | needs-fixes | plan-fix | re-plan" >&2
  ((ERRORS++)) || true
fi

verdict=$(grep -E '^[[:space:]]*-[[:space:]]+\*\*Verdict\*\*:' "$FILE" | head -1 | sed -E 's/^[[:space:]]*-[[:space:]]+\*\*Verdict\*\*:[[:space:]]*//;s/[[:space:]]+$//' || true)

has_suggested=$(grep -cE '^## Suggested git commit' "$FILE" || true)

if [[ -z "$verdict" ]]; then
  :
elif [[ "$verdict" == "ready" ]]; then
  if [[ "$has_suggested" -lt 1 ]]; then
    echo "$FILE:0: [audit.git_commit_when_ready] Verdict ready requires ## Suggested git commit section" >&2
    ((ERRORS++)) || true
  fi
  if ! grep -A20 'Suggested git commit' "$FILE" | grep -q '```'; then
    echo "$FILE:0: [audit.git_commit_when_ready] Suggested git commit should include a fenced code block" >&2
    ((ERRORS++)) || true
  fi
else
  if [[ "$has_suggested" -gt 0 ]]; then
    echo "$FILE:0: [audit.git_commit_when_not_ready] Suggested git commit must be omitted when Verdict is not ready" >&2
    ((ERRORS++)) || true
  fi
fi


if [[ $ERRORS -gt 0 ]]; then
  exit 1
fi
exit 0
