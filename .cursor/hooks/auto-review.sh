#!/bin/bash
# Hook: Auto-review after plan creation/update
# Receives JSON via stdin: {"file_path": "...", "edits": [...]}
# Note: Requires jq. Alternative: TypeScript with Bun (recommended by Cursor docs)
# Performance: Early-exit pattern matching minimizes overhead when file doesn't match

# Check jq availability
command -v jq &>/dev/null || exit 0

read -r json_input
file_path=$(echo "$json_input" | jq -r '.file_path // empty')

# Early exit if file doesn't match pattern plans/*.plan.md
if [[ ! "$file_path" =~ plans/(.+).plan.md$ ]]; then
  exit 0
fi

plan_slug="${BASH_REMATCH[1]}"
plan_file="$file_path"

# Extract feature directory from plan file path (remove /plans/{plan-slug}.plan.md)
# Handle both relative and absolute paths
feature_dir=$(dirname "$(dirname "$file_path")")
review_file="${feature_dir}/reports/${plan_slug}.review.md"

# Normalize paths for timestamp comparison (handle relative vs absolute)
# If file_path is relative, use workspace_roots from JSON if available
# For now, assume paths are consistent (both relative or both absolute)
if [ ! -f "$review_file" ] || [ "$plan_file" -nt "$review_file" ]; then
  echo "Plan updated: ${plan_slug}. Call /review-plan-feature to delegate Reviewer subagent. Review plan strictly without recommendations. Write to reports/${plan_slug}.review.md"
fi
