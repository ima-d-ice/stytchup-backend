#!/bin/sh
set -e
# Sync schema to the database (idempotent; creates tables on first boot).
# Requires DATABASE_URL to be set (see .env.example / compose.yaml).
if [ -z "$DATABASE_URL" ]; then
  echo "WARNING: DATABASE_URL is not set, skipping prisma db push"
else
  npx prisma db push
fi
exec "$@"
