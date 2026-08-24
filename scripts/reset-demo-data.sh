#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"

curl -sS -X POST "${BASE_URL}/api/dev/demo/reset" \
  -H "Content-Type: application/json"
echo

