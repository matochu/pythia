#!/usr/bin/env bash
# Validate a pythia plan file against plan-format (required sections and step fields).
# Usage: validate-plan.sh <path-to-plan.md>
# Exit: 0 if valid, 1 if invalid (errors to stderr).

set -e
PLAN_FILE="${1:?Usage: validate-plan.sh <path-to-plan.md>}"
if [[ ! -f "$PLAN_FILE" ]]; then
  echo "Error: File not found: $PLAN_FILE" >&2
  exit 1
fi

ERRORS=0

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
  if ! grep -q "^${section}$" "$PLAN_FILE"; then
    echo "Missing required section: $section" >&2
    ((ERRORS++)) || true
  fi
done

# At least one of Risks / Acceptance
if ! grep -q "^## Risks" "$PLAN_FILE" && ! grep -q "^## Acceptance" "$PLAN_FILE"; then
  echo "Missing required section: ## Risks / Unknowns or ## Acceptance Criteria" >&2
  ((ERRORS++)) || true
fi

# Metadata must contain Plan-Id, Plan-Version, Branch, Last review round
metadata_section=$(sed -n '/^## Metadata$/,/^## /p' "$PLAN_FILE" | sed '$d')
for key in "Plan-Id" "Plan-Version" "Branch" "Last review round"; do
  if ! echo "$metadata_section" | grep -q "\*\*${key}\*\*"; then
    echo "Metadata missing: $key" >&2
    ((ERRORS++)) || true
  fi
done

# Plan revision log must have table header (Version | Round | Date | ...)
if ! grep -q "| Version | Round | Date " "$PLAN_FILE"; then
  echo "Plan revision log missing table header (Version | Round | Date | Changed Steps | Summary)" >&2
  ((ERRORS++)) || true
fi

# Navigation must reference steps (Plan: [Step)
if ! grep -q "Plan: \[Step " "$PLAN_FILE"; then
  echo "Navigation missing Plan step links (Plan: [Step 1: ...] ...)" >&2
  ((ERRORS++)) || true
fi

# Each ### Step N: block must have Change, Where, Validation, Acceptance
in_plan=false
step_title=""
step_content=""
while IFS= read -r line; do
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
          echo "Step '$step_title' missing field: $field" >&2
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
      echo "Step '$step_title' missing field: $field" >&2
      ((ERRORS++)) || true
    fi
  done
fi

if [[ $ERRORS -gt 0 ]]; then
  echo "Validation failed with $ERRORS error(s)." >&2
  exit 1
fi
echo "OK: Plan structure valid."
exit 0
