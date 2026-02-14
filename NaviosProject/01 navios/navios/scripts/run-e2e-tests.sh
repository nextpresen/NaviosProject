#!/usr/bin/env bash
set -euo pipefail

PORT="${TEST_PORT:-3100}"
HOST="127.0.0.1"
BASE_URL="http://${HOST}:${PORT}"
LOG_FILE="${TMPDIR:-/tmp}/navios-test-dev.log"

npm run dev -- --hostname "$HOST" --port "$PORT" >"$LOG_FILE" 2>&1 &
DEV_PID=$!

cleanup() {
  if kill -0 "$DEV_PID" >/dev/null 2>&1; then
    kill "$DEV_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

for _ in $(seq 1 60); do
  if curl -fsS "$BASE_URL/api/events" >/dev/null 2>&1; then
    TEST_BASE_URL="$BASE_URL" node scripts/test-e2e.mjs
    exit 0
  fi
  sleep 1
done

echo "Dev server did not become ready in time. Log: $LOG_FILE" >&2
exit 1
