#!/bin/sh
# ponytail: production entrypoint — runs Prisma migrations if RUN_MIGRATIONS=true, then starts the app
set -e

if [ "${RUN_MIGRATIONS}" = "true" ]; then
  echo "[entrypoint] Running Prisma migrations..."
  npx prisma migrate deploy
  echo "[entrypoint] Migrations complete."
else
  echo "[entrypoint] Skipping migrations (RUN_MIGRATIONS != true)"
fi

echo "[entrypoint] Starting application..."
exec node dist/src/main
