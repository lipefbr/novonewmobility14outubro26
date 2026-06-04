#!/bin/bash
while true; do
  echo "Starting server at $(date)"
  NODE_ENV=production node .next/standalone/server.js
  EXIT_CODE=$?
  echo "Server exited with code $EXIT_CODE at $(date)"
  sleep 2
done
