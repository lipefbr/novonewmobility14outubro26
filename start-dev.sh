#!/bin/bash
cd /home/z/my-project
echo $$ > /home/z/my-project/dev-server.pid
while true; do
  echo "Starting Next.js dev server at $(date)..." >> /home/z/my-project/dev.log
  node /home/z/my-project/node_modules/.bin/next dev -p 3000 -H 0.0.0.0 >> /home/z/my-project/dev.log 2>&1
  echo "Server exited at $(date), restarting in 5s..." >> /home/z/my-project/dev.log
  sleep 5
done
