#!/usr/bin/env bash
# Validate a pythia plan file against plan-format (required sections and step fields).
# Usage: validate-plan.sh <path-to-plan.md>
# Exit: 0 if valid, 1 if invalid (errors to stderr).
# Optional: VALIDATE_PLAN_QUIET=1 suppresses success line on stdout.

set -euo pipefail

PLAN_FILE="${1:?Usage: validate-plan.sh <path-to-plan.md>}"
if [[ ! -f "$PLAN_FILE" ]]; then
  echo "$PLAN_FILE:0: [io.missing_file] File not found" >&2
  exit 2
fi

ERRORS=0

line_for() {
  grep -n -m1 -E "$1" "$PLAN_FILE" 2>/dev/null | cut -d: -f1 || echo 0
}

# Exactly one top-level H1
h1_count=$(grep -cE '^# [^#]' "$PLAN_FILE" || true)
if [[ "$h1_count" -ne 1 ]]; then
  echo "$PLAN_FILE:$(line_for '^# '): [plan.header.h1_count] Expected exactly one H1 title line (found ${h1_count})" >&2
  ((ERRORS++)) || true
fi

# Exactly one ## Metadata
meta_count=$(grep -cE '^## Metadata$' "$PLAN_FILE" || true)
if [[ "$meta_count" -ne 1 ]]; then
  echo "$PLAN_FILE:$(line_for '^## Metadata$'): [plan.section.metadata] Expected exactly one ## Metadata section (found ${meta_count})" >&2
  ((ERRORS++)) || true
fi

# Required top-level sections (## Section)
required_sections=(
  "## Metadata"
  "## Plan revision log"
  "## Navigation"
  "## Context"
  "## Goal"
  "## Plan"
)
for section in "${required_sections[@]}"; do
  esc=${section//#/\\#}
  if ! grep -q "^${section}$" "$PLAN_FILE"; then
    echo "$PLAN_FILE:0: [plan.section.required] Missing required section: ${section}" >&2
    ((ERRORS++)) || true
  fi
done

# At least one of Risks / Acceptance
if ! grep -qE '^## Risks' "$PLAN_FILE" && ! grep -qE '^## Acceptance' "$PLAN_FILE"; then
  echo "$PLAN_FILE:0: [plan.section.required] Missing required section: ## Risks / Unknowns or ## Acceptance Criteria" >&2
  ((ERRORS++)) || true
fi

# Metadata must contain Plan-Id, Plan-Version, Status, Branch, Last review round
metadata_section=$(sed -n '/^## Metadata$/,/^## /p' "$PLAN_FILE" | sed '$d')
for key in "Plan-Id" "Plan-Version" "Status" "Branch" "Last review round"; do
  if ! echo "$metadata_section" | grep -q "\*\*${key}\*\*"; then
    echo "$PLAN_FILE:$(line_for '^## Metadata$'): [plan.metadata.keys] Metadata missing: ${key}" >&2
    ((ERRORS++)) || true
  fi
done

# Document Status must be one of the canonical lifecycle values (see plan-format.md — Plan document status)
status_raw=$(echo "$metadata_section" | grep -E "^[[:space:]]*-[[:space:]]+\*\*Status\*\*:" | head -n1 | sed -E 's/^[[:space:]]*-[[:space:]]+\*\*Status\*\*:[[:space:]]*//')
if [[ -n "$status_raw" ]]; then
  case "$status_raw" in
    Draft|Ready\ for\ implementation|In\ progress|Implemented|Blocked|Archived|Cancelled) ;;
    *)
      echo "$PLAN_FILE:$(line_for '\*\*Status\*\*'): [plan.metadata.status_enum] **Status** must be one of: Draft | Ready for implementation | In progress | Implemented | Blocked | Archived | Cancelled (got: ${status_raw})" >&2
      ((ERRORS++)) || true
      ;;
  esac
fi

# Plan-Version v2+ => ## Architect Retrospective recommended as hard Tier0 rule
plan_ver_line=$(echo "$metadata_section" | grep -E "^\s*-\s+\*\*Plan-Version\*\*:" | head -n1 || true)
plan_ver_val=$(echo "$plan_ver_line" | sed -E 's/^[^:]*:[[:space:]]*//')
if [[ "$plan_ver_val" =~ ^v([0-9]+) ]]; then
  ver_num="${BASH_REMATCH[1]}"
  if [[ "$ver_num" -ge 2 ]] && ! grep -qE '^## Architect Retrospective$' "$PLAN_FILE"; then
    echo "$PLAN_FILE:0: [plan.retrospective.required] Plan-Version ${plan_ver_val} requires ## Architect Retrospective section" >&2
    ((ERRORS++)) || true
  fi
fi

# Plan revision log must have table header (Version | Round | Date | ...)
if ! grep -q "| Version | Round | Date " "$PLAN_FILE"; then
  echo "$PLAN_FILE:$(line_for 'Plan revision log'): [plan.revision_log.table] Plan revision log missing table header (Version | Round | Date | ...)" >&2
  ((ERRORS++)) || true
fi

# Revision log Round column tokens (data rows only)
if awk -v file="$PLAN_FILE" '
  BEGIN { inlog=0; intable=0; errs=0 }
  /^## Plan revision log$/ { inlog=1; next }
  inlog && /^## / && $0 !~ /^## Plan revision log$/ { inlog=0; intable=0 }
  inlog && /\| Version \| Round \| Date/ { intable=1; next }
  intable && /^\|[[:space:]]*---/ { next }
  intable && /^\|/ {
    n=split($0, a, "|")
    if (n < 4) next
    ver=a[2]; gsub(/^[[:space:]]+|[[:space:]]+$/, "", ver)
    rnd=a[3]; gsub(/^[[:space:]]+|[[:space:]]+$/, "", rnd)
    if (ver == "Version" && rnd == "Round") next
    if (ver == "" && rnd == "") next
    if (rnd == "") {
      printf "%s:0: [plan.revision_log.round_tokens] Empty Round cell for revision row\n", file | "cat >&2"
      errs++
      next
    }
    if (rnd == "—" || rnd == "-" || rnd == "Manual" || rnd ~ /^R[0-9]+$/ || rnd ~ /^I[0-9]+$/) next
    printf "%s:0: [plan.revision_log.round_tokens] Invalid Round value (use —, Manual, R{n}, I{n}): %s\n", file, rnd | "cat >&2"
    errs++
    next
  }
  END { exit (errs>0 ? 1 : 0) }
' "$PLAN_FILE"; then
  :
else
  ((ERRORS++)) || true
fi

# Navigation must reference steps (Plan: [Step)
if ! grep -q "Plan: \[Step " "$PLAN_FILE"; then
  echo "$PLAN_FILE:$(line_for '^## Navigation$'): [plan.navigation.steps] Navigation missing Plan step links (Plan: [Step 1: ...] ...)" >&2
  ((ERRORS++)) || true
fi

# Each ### Step N: block must have Change, Where, Validation, Acceptance
in_plan=false
step_title=""
step_content=""
while IFS= read -r line || [[ -n "$line" ]]; do
  if [[ "$line" == "## Plan" ]]; then
    in_plan=true
    continue
  fi
  if [[ "$in_plan" == true ]] && [[ "$line" == \#\#\ * ]]; then
    break
  fi
  if [[ "$in_plan" == true ]] && [[ "$line" == \#\#\#\ Step\ * ]]; then
    if [[ -n "$step_content" ]]; then
      for field in "**Change**" "**Where**" "**Validation**" "**Acceptance**"; do
        if ! echo "$step_content" | grep -qF "$field"; then
          echo "$PLAN_FILE:0: [plan.step.fields] Step '${step_title}' missing field: ${field}" >&2
          ((ERRORS++)) || true
        fi
      done
    fi
    step_title="${line### Step }"
    step_content=""
    continue
  fi
  if [[ "$in_plan" == true ]] && [[ -n "$line" ]]; then
    step_content+=$'\n'"$line"
  fi
done < "$PLAN_FILE"
if [[ -n "$step_content" ]]; then
  for field in "**Change**" "**Where**" "**Validation**" "**Acceptance**"; do
    if ! echo "$step_content" | grep -qF "$field"; then
      echo "$PLAN_FILE:0: [plan.step.fields] Step '${step_title}' missing field: ${field}" >&2
      ((ERRORS++)) || true
    fi
  done
fi

if [[ $ERRORS -gt 0 ]]; then
  echo "$PLAN_FILE:0: [plan.summary] Validation failed with ${ERRORS} error(s)." >&2
  exit 1
fi

if [[ -z "${VALIDATE_PLAN_QUIET:-}" ]]; then
  echo "OK: Plan structure valid."
fi
exit 0
