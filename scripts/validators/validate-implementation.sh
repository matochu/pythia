#!/usr/bin/env bash
# Structural validation for reports/*.implementation.md — see implementation-format.md
set -euo pipefail

FILE="${1:?Usage: validate-implementation.sh <path>}"
[[ -f "$FILE" ]] || { echo "$FILE:0: [io.missing_file] File not found" >&2; exit 2; }

ERRORS=0
line_for() { grep -n -m1 -E "$1" "$FILE" 2>/dev/null | cut -d: -f1 || echo 0; }

if ! grep -qE '^# Implementation Report:' "$FILE"; then
  echo "$FILE:1: [impl.header.h1] Missing H1 starting with # Implementation Report:" >&2
  ((ERRORS++)) || true
fi

if ! grep -qE '^Plan:.*\.plan\.md' "$FILE"; then
  echo "$FILE:$(line_for '^Plan:'): [impl.header.links] Missing Plan: link to .plan.md" >&2
  ((ERRORS++)) || true
fi

if ! grep -qE '^Review:.*\.review\.md' "$FILE"; then
  echo "$FILE:$(line_for '^Review:'): [impl.header.links] Missing Review: link to .review.md" >&2
  ((ERRORS++)) || true
fi

if ! grep -qE '^## Plan.{1,5}Implementation Compatibility$' "$FILE"; then
  echo "$FILE:0: [impl.section.compatibility] Missing ## Plan–Implementation Compatibility (en dash or hyphen between Plan and Implementation)" >&2
  ((ERRORS++)) || true
fi

if ! grep -qE 'Implementation Round' "$FILE" || ! grep -qE 'Plan Version' "$FILE" || ! grep -qE '\|.*Result' "$FILE"; then
  echo "$FILE:0: [impl.section.compatibility] Compatibility table missing expected columns (Implementation Round, Plan Version, Result)" >&2
  ((ERRORS++)) || true
fi

static_sections=(
  "## Summary"
  "## Steps Executed"
  "## Files Changed"
  "## Commands Executed"
  "## Validation"
  "## Results"
  "## Deviations"
  "## Open Issues"
)
for sec in "${static_sections[@]}"; do
  if ! grep -qE "^${sec}$" "$FILE"; then
    echo "$FILE:0: [impl.section.static] Missing ${sec}" >&2
    ((ERRORS++)) || true
  fi
done

first_round_line=$(grep -nE '^## Implementation Round I[0-9]+' "$FILE" | head -1 | cut -d: -f1 || true)
if [[ -z "$first_round_line" ]]; then
  echo "$FILE:0: [impl.round.heading] Missing ## Implementation Round I{n}" >&2
  ((ERRORS++)) || true
else
  retro_line=$(grep -nE '^## Developer Retrospective$' "$FILE" | head -1 | cut -d: -f1 || true)
  if [[ -z "$retro_line" ]] || [[ "$retro_line" -ge "$first_round_line" ]]; then
    echo "$FILE:0: [impl.section.retro_obs] ## Developer Retrospective must appear before first ## Implementation Round" >&2
    ((ERRORS++)) || true
  fi
  obs_line=$(grep -nE '^## Developer Observations$' "$FILE" | head -1 | cut -d: -f1 || true)
  if [[ -n "$obs_line" ]] && [[ "$obs_line" -ge "$first_round_line" ]]; then
    echo "$FILE:0: [impl.section.retro_obs] ## Developer Observations must appear before first ## Implementation Round when present" >&2
    ((ERRORS++)) || true
  fi
fi

if ! grep -qF '### Summary' "$FILE"; then
  echo "$FILE:0: [impl.round.summary] Missing ### Summary in implementation round" >&2
  ((ERRORS++)) || true
fi

if ! grep -qF 'Plan version:' "$FILE"; then
  echo "$FILE:0: [impl.round.summary] Missing Plan version: bullet under round summary" >&2
  ((ERRORS++)) || true
fi

if ! grep -qF '### Step Results' "$FILE"; then
  echo "$FILE:0: [impl.round.step_results_table] Missing ### Step Results" >&2
  ((ERRORS++)) || true
fi

if ! grep -qE '\| Step \| Status \| Notes \|' "$FILE" && ! grep -qE '\| Step[[:space:]]*\| Status[[:space:]]*\| Notes[[:space:]]*\|' "$FILE"; then
  echo "$FILE:0: [impl.round.step_results_table] Missing Step / Status / Notes table header" >&2
  ((ERRORS++)) || true
fi

if ! grep -qF '### Issues' "$FILE"; then
  echo "$FILE:0: [impl.round.issues] Missing ### Issues" >&2
  ((ERRORS++)) || true
fi

if ! grep -qF '### Out-of-Plan Work' "$FILE"; then
  echo "$FILE:0: [impl.round.out_of_plan] Missing ### Out-of-Plan Work" >&2
  ((ERRORS++)) || true
fi

if [[ $ERRORS -gt 0 ]]; then
  exit 1
fi
exit 0
