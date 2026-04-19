#!/usr/bin/env bash
# Regression tests for validate-workflow-doc.sh using fixtures.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI="$SCRIPT_DIR/validate-workflow-doc.sh"
FIX="$SCRIPT_DIR/fixtures/workflow-docs"

failed=0

echo "== valid fixtures (expect exit 0) =="
for f in "$FIX/valid"/*.*.md; do
  [[ -f "$f" ]] || continue
  if ! bash "$CLI" "$f"; then
    echo "FAIL: expected pass: $f" >&2
    failed=1
  fi
done

echo "== invalid fixtures (expect exit 1) =="
for f in "$FIX/invalid"/*.*.md; do
  [[ -f "$f" ]] || continue
  if bash "$CLI" "$f"; then
    echo "FAIL: expected fail: $f" >&2
    failed=1
  fi
done

if [[ "$failed" -ne 0 ]]; then
  echo "test-validate-workflow-doc.sh: FAILED" >&2
  exit 1
fi
echo "test-validate-workflow-doc.sh: OK"
exit 0
