#!/usr/bin/env bash
set -euo pipefail

npm run prisma:generate >/dev/null
node scripts/test-api-flow.mjs
