#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SUPABASE_DATABASE_URL:-}" ]]; then
  echo "SUPABASE_DATABASE_URL is not set" >&2
  exit 1
fi

export DATABASE_URL="$SUPABASE_DATABASE_URL"

npx prisma generate --schema prisma/schema.supabase.prisma
npx prisma db push --schema prisma/schema.supabase.prisma --accept-data-loss
node scripts/supabase-crud-check.mjs
