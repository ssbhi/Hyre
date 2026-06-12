#!/bin/sh
# Boots the container: ensures the SQLite schema exists (creating + seeding demo
# data on the very first run), then starts the Next.js production server.
set -e

mkdir -p /app/data /app/public/uploads

DB_PATH="${DATABASE_URL#file:}"
FIRST_RUN=0
if [ ! -f "$DB_PATH" ]; then
  FIRST_RUN=1
fi

echo "[entrypoint] syncing database schema ($DATABASE_URL)"
npx prisma db push --skip-generate

if [ "$FIRST_RUN" = "1" ]; then
  echo "[entrypoint] fresh database — seeding demo data"
  npx tsx prisma/seed.ts
fi

echo "[entrypoint] starting Next.js on port ${PORT:-3000}"
exec npm run start
