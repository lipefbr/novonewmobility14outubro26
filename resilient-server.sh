#!/bin/bash
cd /home/z/my-project
while true; do
  echo "[$(date)] Starting server..."
  NODE_OPTIONS='--max-old-space-size=4096' npx next dev -p 3000 --webpack >> /home/z/my-project/dev.log 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 3s..."
  sleep 3
done
