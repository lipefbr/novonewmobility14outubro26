#!/bin/bash
# Resilient server script that restarts when killed
cd /home/z/my-project
export DATABASE_URL="postgresql://neondb_owner:npg_2Ul5CdKOpRiu@ep-twilight-night-aqn8fqln-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
export NEON_DATABASE_URL="postgresql://neondb_owner:npg_2Ul5CdKOpRiu@ep-twilight-night-aqn8fqln-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
export HOSTNAME=0.0.0.0
export PORT=3000

while true; do
    echo "[$(date)] Starting server..." >> /home/z/my-project/resilient.log
    node .next/standalone/server.js >> /home/z/my-project/server.log 2>&1
    EXIT=$?
    echo "[$(date)] Server exited ($EXIT), restarting in 1s..." >> /home/z/my-project/resilient.log
    sleep 1
done
