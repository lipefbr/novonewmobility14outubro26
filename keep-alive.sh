#!/bin/bash
cd /home/z/my-project
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
export PORT=3000
export HOSTNAME=0.0.0.0

while true; do
  echo "[$(date)] Starting server..."
  node --max-old-space-size=512 .next/standalone/server.js 2>&1
  echo "[$(date)] Server exited, restarting in 2s..."
  sleep 2
done
