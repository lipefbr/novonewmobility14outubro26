#!/bin/bash
export DATABASE_URL="postgresql://neondb_owner:npg_2Ul5CdKOpRiu@ep-twilight-night-aqn8fqln-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
export NEON_DATABASE_URL="postgresql://neondb_owner:npg_2Ul5CdKOpRiu@ep-twilight-night-aqn8fqln-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
export HOSTNAME=0.0.0.0
export PORT=3000
export NODE_OPTIONS="--max-old-space-size=256"

# Start server in background and keep restarting
while true; do
    node /home/z/my-project/.next/standalone/server.js &
    SERVER_PID=$!
    # Wait for server to die
    wait $SERVER_PID 2>/dev/null
    sleep 0.3
done
