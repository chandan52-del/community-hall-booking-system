#!/bin/sh
set -e

echo "[Entrypoint] Verifying database connectivity..."
# Loop until Prisma / MySQL connection succeeds
MAX_RETRIES=30
RETRY_COUNT=0

until npx prisma migrate deploy --preview-feature > /dev/null 2>&1 || [ $RETRY_COUNT -ge $MAX_RETRIES ]; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "[Entrypoint] Waiting for MySQL database to accept connections ($RETRY_COUNT/$MAX_RETRIES)..."
  sleep 2
done

echo "[Entrypoint] Applying Prisma migrations..."
npx prisma migrate deploy

echo "[Entrypoint] Verifying whether initial database seeding is required..."
node -e '
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
prisma.hall.count().then(count => {
  if (count === 0) {
    console.log("[Entrypoint] Database is empty. Seeding the 5 demonstration venues...");
    try {
      require("child_process").execSync("node dist/database/seed.js", { stdio: "inherit" });
    } catch (e) {
      console.error("[Entrypoint] Seeding error:", e.message);
    }
  } else {
    console.log(`[Entrypoint] Database contains ${count} venues. Skipping seeding.`);
  }
  process.exit(0);
}).catch(err => {
  console.error("[Entrypoint] Error checking hall count:", err.message);
  process.exit(0);
});
'

echo "[Entrypoint] Starting Express REST API Server..."
exec "$@"
