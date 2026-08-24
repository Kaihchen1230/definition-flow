#!/usr/bin/env bash
set -euo pipefail

REQUEST_TYPE="${1:-startup-investment}"
BASE_URL="${BASE_URL:-http://localhost:8080}"

curl -sS -X POST "${BASE_URL}/api/dev/definitions/reload/${REQUEST_TYPE}" \
  -H "Content-Type: application/json"
echo

