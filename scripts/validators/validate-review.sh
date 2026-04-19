#!/usr/bin/env bash
# Structural validation for reports/*.review.md — see review-format.md
set -euo pipefail

FILE="${1:?Usage: validate-review.sh <path-to-review.md>}"
[[ -f "$FILE" ]] || { echo "$FILE:0: [io.missing_file] File not found" >&2; exit 2; }

ERRORS=0
line_for() { grep -n -m1 -E "$1" "$FILE" 2>/dev/null | cut -d: -f1 || echo 0; }

if ! grep -qE '^## Navigation$' "$FILE"; then
  echo "$FILE:0: [review.section.navigation] Missing ## Navigation" >&2
  ((ERRORS++)) || true
fi

if ! grep -qE '^## .+ R[0-9]+ — [0-9]{4}-[0-9]{2}-[0-9]{2}$' "$FILE"; then
  echo "$FILE:0: [review.round.heading] Missing round heading matching ## {slug} R{n} — YYYY-MM-DD" >&2
  ((ERRORS++)) || true
fi

if ! grep -qF 'Review for:' "$FILE"; then
  echo "$FILE:0: [review.round.review_for] Missing Review for: line" >&2
  ((ERRORS++)) || true
fi

if ! grep -qF '.plan.md' "$FILE"; then
  echo "$FILE:0: [review.round.review_for] Missing link to .plan.md" >&2
  ((ERRORS++)) || true
fi

if ! grep -qE '^Verdict: (READY|NEEDS_REVISION)$' "$FILE"; then
  echo "$FILE:$(line_for 'Verdict:'): [review.round.verdict] Missing or invalid Verdict: READY | NEEDS_REVISION" >&2
  ((ERRORS++)) || true
fi

if ! grep -qE '^## Executive Summary$' "$FILE"; then
  echo "$FILE:0: [review.round.executive_summary] Missing ## Executive Summary" >&2
  ((ERRORS++)) || true
fi

if ! grep -qE '^## Step-by-Step Analysis$' "$FILE"; then
  echo "$FILE:0: [review.round.step_analysis] Missing ## Step-by-Step Analysis" >&2
  ((ERRORS++)) || true
fi

if ! grep -qE '^### S[0-9]+:' "$FILE"; then
  echo "$FILE:0: [review.round.step_analysis] Missing at least one ### Sn: step block" >&2
  ((ERRORS++)) || true
fi

if ! grep -qE '^## Summary of Concerns$' "$FILE"; then
  echo "$FILE:0: [review.round.summary_concerns] Missing ## Summary of Concerns" >&2
  ((ERRORS++)) || true
fi

if ! grep -qE '^## Addressed by Architect$' "$FILE"; then
  echo "$FILE:0: [review.round.addressed] Missing ## Addressed by Architect" >&2
  ((ERRORS++)) || true
fi

# Each ### Sn: block under Step-by-Step must contain **Status**: with allowed value
in_steps=false
block=""
flush_block() {
  [[ -z "$block" ]] && return 0
  if ! grep -qF "**Status**:" <<<"$block"; then
    local head
    head=$(head -n1 <<<"$block")
    echo "$FILE:0: [review.step.status_enum] Step block missing **Status**: ${head}" >&2
    ((ERRORS++)) || true
  else
    if ! grep -qE '\*\*Status\*\*:[[:space:]]*(OK|CONCERN-LOW|CONCERN-MEDIUM|CONCERN-HIGH|BLOCKED)' <<<"$block"; then
      local head
      head=$(head -n1 <<<"$block")
      echo "$FILE:0: [review.step.status_enum] **Status** must be OK | CONCERN-LOW | CONCERN-MEDIUM | CONCERN-HIGH | BLOCKED in ${head}" >&2
      ((ERRORS++)) || true
    fi
  fi
}

while IFS= read -r line || [[ -n "$line" ]]; do
  if [[ "$line" == "## Step-by-Step Analysis" ]]; then
    in_steps=true
    continue
  fi
  if [[ "$in_steps" == true ]] && [[ "$line" == "## Summary of Concerns" ]]; then
    flush_block
    block=""
    in_steps=false
    break
  fi
  [[ "$in_steps" != true ]] && continue

  if [[ "$line" =~ ^###\ S[0-9]+: ]]; then
    flush_block
    block="$line"
  elif [[ -n "$block" ]]; then
    block+=$'\n'"$line"
  fi
done < "$FILE"

if [[ "$in_steps" == true ]]; then
  flush_block
fi

if [[ $ERRORS -gt 0 ]]; then
  exit 1
fi
exit 0
