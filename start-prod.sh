#!/bin/bash
cd /home/z/my-project
echo $$ > /home/z/my-project/dev-server.pid
export DATABASE_URL="file:/home/z/my-project/db/custom.db"
export PORT=3000
export HOSTNAME=0.0.0.0

while true; do
  echo "Starting production server at $(date)..." >> /home/z/my-project/dev.log
  node --max-old-space-size=256 .next/standalone/server.js >> /home/z/my-project/dev.log 2>&1
  echo "Server exited at $(date), restarting in 3s..." >> /home/z/my-project/dev.log
  sleep 3
done
