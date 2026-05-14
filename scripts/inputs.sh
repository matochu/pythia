#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/inputs.sh check <file.md>
  scripts/inputs.sh update <file.md>
  scripts/inputs.sh add <file.md> <dep> [<dep>...]
  scripts/inputs.sh stamp <file.md>
EOF
}

die_usage() {
  usage >&2
  exit 2
}

die_error() {
  local message="$1"
  local code="${2:-2}"
  echo "$message" >&2
  exit "$code"
}

command_name="${1:-}"
target_file="${2:-}"

case "$command_name" in
  check|update|stamp)
    [[ $# -eq 2 ]] || die_usage
    ;;
  add)
    [[ $# -ge 3 ]] || die_usage
    ;;
  *)
    die_usage
    ;;
esac

[[ -f "$target_file" ]] || die_error "target file not found: $target_file" 2

repo_root="$(git rev-parse --show-toplevel 2>/dev/null)" || die_error "not inside a Git worktree" 2
cd "$repo_root"

hash_file() {
  local path="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    LC_ALL=C sha256sum "$path" | awk '{print substr($1, 1, 8)}'
  elif command -v shasum >/dev/null 2>&1; then
    LC_ALL=C shasum -a 256 "$path" | awk '{print substr($1, 1, 8)}'
  else
    die_error "sha256 hashing command unavailable (need sha256sum or shasum)" 2
  fi
}

has_frontmatter() {
  [[ "$(head -n 1 "$1")" == "---" ]]
}

extract_frontmatter() {
  awk '
    NR == 1 && $0 == "---" { in_frontmatter = 1; next }
    in_frontmatter && $0 == "---" { exit }
    in_frontmatter { print }
  ' "$1"
}

frontmatter_has_inputs() {
  extract_frontmatter "$1" | grep -qE '^inputs:$'
}

extract_inputs_lines() {
  awk '
    NR == 1 && $0 == "---" { in_frontmatter = 1; next }
    in_frontmatter && $0 == "---" { exit }
    in_frontmatter && $0 == "inputs:" { in_inputs = 1; next }
    in_inputs && $0 ~ /^  - / { print; next }
    in_inputs { exit }
  ' "$1"
}

validate_entry() {
  [[ "$1" =~ ^[^[:space:]/][^[:space:]]*:[0-9a-f]{8}$ ]] && [[ "$1" != /* ]]
}

split_entry() {
  local entry="$1"
  local __path_var="$2"
  local __hash_var="$3"
  local parsed_path parsed_hash
  parsed_path="${entry%%:*}"
  parsed_hash="${entry##*:}"
  printf -v "$__path_var" '%s' "$parsed_path"
  printf -v "$__hash_var" '%s' "$parsed_hash"
}

collect_entries() {
  local file="$1"
  local lines
  lines="$(extract_inputs_lines "$file")"
  [[ -n "$lines" ]] || return 0
  while IFS= read -r line; do
    [[ -n "$line" ]] || continue
    printf '%s\n' "${line#  - }"
  done <<<"$lines"
}

rewrite_inputs_block() {
  local file="$1"
  shift
  local tmp
  local payload=""
  local entry
  for entry in "$@"; do
    if [[ -n "$payload" ]]; then
      payload+=$'\034'
    fi
    payload+="$entry"
  done
  tmp="$(mktemp)"
  awk -v entries_payload="$payload" '
    BEGIN {
      total = split(entries_payload, arr, "\034")
      for (i = 1; i <= total; i++) {
        if (arr[i] != "") {
          entries[++count] = arr[i]
        }
      }
    }
    function print_inputs_block() {
      print "inputs:"
      for (i = 1; i <= count; i++) {
        print "  - " entries[i]
      }
    }
    NR == 1 && $0 == "---" {
      in_frontmatter = 1
      print
      next
    }
    in_frontmatter && $0 == "inputs:" {
      saw_inputs = 1
      skipping_inputs = 1
      print_inputs_block()
      next
    }
    skipping_inputs && $0 ~ /^  - / { next }
    skipping_inputs { skipping_inputs = 0 }
    in_frontmatter && $0 == "---" {
      if (!saw_inputs) {
        print_inputs_block()
      }
      in_frontmatter = 0
      print
      next
    }
    { print }
  ' "$file" >"$tmp"
  mv "$tmp" "$file"
}

check_command() {
  local file="$1"
  if ! has_frontmatter "$file" || ! frontmatter_has_inputs "$file"; then
    echo "no inputs declared"
    return 0
  fi

  local failed=0
  local entry rel_path stored_hash current_hash
  while IFS= read -r entry; do
    [[ -n "$entry" ]] || continue
    if ! validate_entry "$entry"; then
      echo "! $entry — INVALID"
      failed=1
      continue
    fi
    split_entry "$entry" rel_path stored_hash
    if [[ ! -f "$rel_path" ]]; then
      echo "! $rel_path — MISSING"
      failed=1
      continue
    fi
    current_hash="$(hash_file "$rel_path")"
    if [[ "$current_hash" == "$stored_hash" ]]; then
      echo "✓ $rel_path ($stored_hash)"
    else
      echo "✗ $rel_path — STALE (stored: $stored_hash, current: $current_hash)"
      failed=1
    fi
  done < <(collect_entries "$file")

  return "$failed"
}

update_command() {
  local file="$1"
  if ! has_frontmatter "$file"; then
    die_error "frontmatter required for update: $file" 2
  fi
  if ! frontmatter_has_inputs "$file"; then
    echo "no inputs declared"
    return 0
  fi

  local entries=()
  local entry rel_path stored_hash current_hash
  while IFS= read -r entry; do
    [[ -n "$entry" ]] || continue
    if ! validate_entry "$entry"; then
      echo "! $entry — INVALID" >&2
      exit 1
    fi
    split_entry "$entry" rel_path stored_hash
    if [[ ! -f "$rel_path" ]]; then
      echo "! $rel_path — MISSING" >&2
      exit 1
    fi
    current_hash="$(hash_file "$rel_path")"
    entries+=("${rel_path}:${current_hash}")
  done < <(collect_entries "$file")

  rewrite_inputs_block "$file" "${entries[@]}"
}

add_command() {
  local file="$1"
  shift
  has_frontmatter "$file" || die_error "frontmatter required for add: $file" 2

  local entries=()
  local entry rel_path stored_hash dep new_hash replaced
  if frontmatter_has_inputs "$file"; then
    while IFS= read -r entry; do
      [[ -n "$entry" ]] || continue
      if ! validate_entry "$entry"; then
        echo "! $entry — INVALID" >&2
        exit 1
      fi
      split_entry "$entry" rel_path stored_hash
      if [[ "$rel_path" == "$dep" ]]; then
        entries+=("${dep}:${new_hash}")
        replaced=1
      else
        entries+=("${rel_path}:${stored_hash}")
      fi
    done < <(collect_entries "$file")
  fi

  for dep in "$@"; do
    [[ "$dep" != /* ]] || die_error "dependency path must be repo-relative: $dep" 2
    [[ -f "$dep" ]] || die_error "dependency file not found: $dep" 2

    new_hash="$(hash_file "$dep")"
    replaced=0

    for i in "${!entries[@]}"; do
      split_entry "${entries[$i]}" rel_path stored_hash
      if [[ "$rel_path" == "$dep" ]]; then
        entries[$i]="${dep}:${new_hash}"
        replaced=1
        break
      fi
    done

    if [[ "$replaced" -eq 0 ]]; then
      entries+=("${dep}:${new_hash}")
    fi
  done

  rewrite_inputs_block "$file" "${entries[@]}"
}

stamp_command() {
  local file="$1"
  has_frontmatter "$file" || die_error "frontmatter required for stamp: $file" 2
  if ! frontmatter_has_inputs "$file"; then
    echo "no inputs declared"
    return 0
  fi

  local entries=()
  local entry rel_path hash
  while IFS= read -r entry; do
    [[ -n "$entry" ]] || continue
    if validate_entry "$entry"; then
      entries+=("$entry")
    else
      rel_path="$entry"
      [[ "$rel_path" != /* ]] || die_error "dependency path must be repo-relative: $rel_path" 2
      [[ -f "$rel_path" ]] || die_error "dependency file not found: $rel_path" 2
      hash="$(hash_file "$rel_path")"
      entries+=("${rel_path}:${hash}")
    fi
  done < <(collect_entries "$file")

  rewrite_inputs_block "$file" "${entries[@]}"
}

case "$command_name" in
  check)
    check_command "$target_file"
    ;;
  update)
    update_command "$target_file"
    ;;
  add)
    add_command "$target_file" "${@:3}"
    ;;
  stamp)
    stamp_command "$target_file"
    ;;
esac
