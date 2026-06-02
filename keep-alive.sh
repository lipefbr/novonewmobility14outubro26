#!/bin/bash
export DATABASE_URL="postgresql://neondb_owner:npg_2Ul5CdKOpRiu@ep-twilight-night-aqn8fqln-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
export NEON_DATABASE_URL="postgresql://neondb_owner:npg_2Ul5CdKOpRiu@ep-twilight-night-aqn8fqln-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
export HOSTNAME=0.0.0.0
export PORT=3000
export NODE_OPTIONS="--max-old-space-size=256"

while true; do
    echo "[$(date)] Starting server..." >> /home/z/my-project/keep-alive.log
    node /home/z/my-project/.next/standalone/server.js >> /home/z/my-project/keep-alive.log 2>&1
    EXIT_CODE=$?
    echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 2s..." >> /home/z/my-project/keep-alive.log
    sleep 2
done
