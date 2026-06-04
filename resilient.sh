#!/bin/bash
cd /home/z/my-project
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
export PORT=3000
export HOSTNAME=0.0.0.0

while true; do
  echo "[$(date)] Starting server..."
  node --max-old-space-size=256 .next/standalone/server.js
  EXIT=$?
  echo "[$(date)] Server exited code=$EXIT, restarting in 3s..."
  sleep 3
done
