#!/bin/bash
cd /home/z/my-project
export DATABASE_URL="postgresql://neondb_owner:npg_2Ul5CdKOpRiu@ep-twilight-night-aqn8fqln-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
export NEON_DATABASE_URL="postgresql://neondb_owner:npg_2Ul5CdKOpRiu@ep-twilight-night-aqn8fqln-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
export PORT=3000
export HOSTNAME=0.0.0.0
export NODE_OPTIONS="--max-old-space-size=512"

LOGFILE="/home/z/my-project/server-restart.log"

echo "[$(date)] Starting resilient server manager..." >> "$LOGFILE"

while true; do
  echo "[$(date)] Starting production server..." >> "$LOGFILE"
  node .next/standalone/server.js >> /home/z/my-project/dev.log 2>&1
  EXIT=$?
  echo "[$(date)] Server exited with code $EXIT, restarting in 2s..." >> "$LOGFILE"
  sleep 2
done
