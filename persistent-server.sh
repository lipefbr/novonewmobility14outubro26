#!/bin/bash
export DATABASE_URL="postgresql://neondb_owner:npg_2Ul5CdKOpRiu@ep-twilight-night-aqn8fqln-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
export NEON_DATABASE_URL="postgresql://neondb_owner:npg_2Ul5CdKOpRiu@ep-twilight-night-aqn8fqln-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
export HOSTNAME=0.0.0.0
export PORT=3000
export NODE_OPTIONS="--max-old-space-size=128"

while true; do
    echo "[$(date)] Starting server..." >> /tmp/server-restart.log
    node /home/z/my-project/.next/standalone/server.js 2>&1
    EXIT=$?
    echo "[$(date)] Server exited ($EXIT), restarting in 1s..." >> /tmp/server-restart.log
    sleep 1
done
