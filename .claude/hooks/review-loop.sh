#!/bin/bash
# Hook: Review loop revise → review
# Receives JSON via stdin: {"file_path": "...", "edits": [...]}
# Note: Requires jq. Alternative: TypeScript with Bun (recommended by Cursor docs)
# Performance: Early-exit pattern matching minimizes overhead when file doesn't match

# Check jq availability
command -v jq &>/dev/null || exit 0

read -r json_input
file_path=$(echo "$json_input" | jq -r '.file_path // empty')

# Early exit if file doesn't match pattern reports/*.review.md
if [[ ! "$file_path" =~ reports/(.+).review.md$ ]]; then
  exit 0
fi

plan_slug="${BASH_REMATCH[1]}"

# Parse review file for verdict and findings
verdict=$(grep -m1 "^Verdict:" "$file_path" | awk '{print $2}')
high_impact_count=$(grep -c "Impact: high\|CONCERN-HIGH\|BLOCKED" "$file_path" || echo "0")
round_count=$(grep -c "^## ${plan_slug} R[0-9]" "$file_path" || echo "0")

if [ "$verdict" = "NEEDS_REVISION" ] && [ "$high_impact_count" -gt 0 ] && [ "$round_count" -lt 2 ]; then
  echo "Review needs revision. Call /replan-feature to update plan (Plan revision log), then call /review-plan-feature (max 2 loops)"
fi
