#!/usr/bin/env bash
# Dispatch workflow document validation by file type.
# See README-validate-workflow-doc.md for the CLI contract.
# Read-only w.r.t. the workspace: does not create auxiliary files (.txt/.log); output is stderr/stdout only.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VALIDATORS_DIR="$SCRIPT_DIR/validators"

usage() {
  sed -n '1,80p' "$SCRIPT_DIR/README-validate-workflow-doc.md" 2>/dev/null || cat <<'EOF'
Usage: validate-workflow-doc.sh [options] <file.md> [file.md ...]
  --type plan|review|implementation|audit
  --mdlint / --no-mdlint
  -h, --help
Exit: 0 ok, 1 contract fail, 2 usage/internal
EOF
}

RUN_MDLINT=0
TYPE_OVERRIDE=""
FILES=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    --type)
      TYPE_OVERRIDE="${2:-}"
      if [[ -z "$TYPE_OVERRIDE" ]]; then
        echo "validate-workflow-doc.sh: --type requires a value" >&2
        exit 2
      fi
      shift 2
      ;;
    --no-mdlint)
      RUN_MDLINT=0
      shift
      ;;
    --mdlint)
      RUN_MDLINT=1
      shift
      ;;
    -*)
      echo "validate-workflow-doc.sh: unknown option: $1" >&2
      exit 2
      ;;
    *)
      FILES+=("$1")
      shift
      ;;
  esac
done

if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "validate-workflow-doc.sh: at least one file path required" >&2
  usage >&2
  exit 2
fi

infer_type() {
  local base
  base=$(basename "$1")
  case "$base" in
    *.plan.md) echo plan ;;
    *.review.md) echo review ;;
    *.implementation.md) echo implementation ;;
    *.audit.md) echo audit ;;
    *) echo unknown ;;
  esac
}

run_mdlint() {
  local f=$1
  if [[ "$RUN_MDLINT" -ne 1 ]]; then
    return 0
  fi
  if ! command -v markdownlint >/dev/null 2>&1; then
    echo "$f:0: [mdlint.skipped] markdownlint not on PATH; install or omit --mdlint" >&2
    return 0
  fi
  markdownlint "$f" >&2 || return 1
  return 0
}

VALIDATION_FAILED=0

for f in "${FILES[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "$f:0: [io.missing_file] File not found" >&2
    exit 2
  fi

  doc_type="$TYPE_OVERRIDE"
  if [[ -z "$doc_type" ]]; then
    doc_type=$(infer_type "$f")
  fi

  case "$doc_type" in
    plan)
      VALIDATE_PLAN_QUIET=1 bash "$SCRIPT_DIR/validate-plan.sh" "$f" || VALIDATION_FAILED=1
      ;;
    review)
      bash "$VALIDATORS_DIR/validate-review.sh" "$f" || VALIDATION_FAILED=1
      ;;
    implementation)
      bash "$VALIDATORS_DIR/validate-implementation.sh" "$f" || VALIDATION_FAILED=1
      ;;
    audit)
      bash "$VALIDATORS_DIR/validate-audit.sh" "$f" || VALIDATION_FAILED=1
      ;;
    *)
      echo "$f:0: [io.unknown_type] Cannot infer type from name; use --type (got suffix: $(basename "$f"))" >&2
      exit 2
      ;;
  esac

  run_mdlint "$f" || VALIDATION_FAILED=1
done

if [[ "$VALIDATION_FAILED" -ne 0 ]]; then
  exit 1
fi
exit 0
