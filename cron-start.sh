#!/bin/bash
# Kill any existing server on port 3000
kill $(lsof -t -i:3000) 2>/dev/null
sleep 1

# Start the dev server
cd /home/z/my-project
export DATABASE_URL="postgresql://neondb_owner:npg_2Ul5CdKOpRiu@ep-twilight-night-aqn8fqln-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
export NEON_DATABASE_URL="postgresql://neondb_owner:npg_2Ul5CdKOpRiu@ep-twilight-night-aqn8fqln-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
nohup bun run dev > /dev/null 2>&1 &
disown
echo "[$(date)] Dev server started" >> /tmp/cron-server.log
