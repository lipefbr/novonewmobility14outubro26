#!/bin/bash
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
export HOSTNAME="0.0.0.0"
export PORT=3000
export NODE_OPTIONS="--max-old-space-size=128"
export NODE_ENV="production"

cd /home/z/my-project
while true; do
  echo "$(date): Starting server..." >> /home/z/my-project/server.log
  node .next/standalone/server.js >> /home/z/my-project/server.log 2>&1
  EXIT=$?
  echo "$(date): Server exited with code $EXIT" >> /home/z/my-project/server.log
  sleep 1
done
