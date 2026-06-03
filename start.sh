#!/bin/bash
# Kill any existing server
pkill -f "node.*server.js" 2>/dev/null
pkill -f "next-server" 2>/dev/null
sleep 1

# Start production server
cd /home/z/my-project
export DATABASE_URL="postgresql://neondb_owner:npg_2Ul5CdKOpRiu@ep-twilight-night-aqn8fqln-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
export NEON_DATABASE_URL="postgresql://neondb_owner:npg_2Ul5CdKOpRiu@ep-twilight-night-aqn8fqln-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
export PORT=3000
export HOSTNAME=0.0.0.0
export NODE_OPTIONS="--max-old-space-size=256"

# Start in a loop to keep it alive
while true; do
  node .next/standalone/server.js >> /home/z/my-project/dev.log 2>&1
  sleep 1
done
