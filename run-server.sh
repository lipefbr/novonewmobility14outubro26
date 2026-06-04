#!/bin/bash
cd /home/z/my-project
export DATABASE_URL="postgresql://neondb_owner:npg_2Ul5CdKOpRiu@ep-twility-night-aqn8fqln-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
export NEON_DATABASE_URL="postgresql://neondb_owner:npg_2Ul5CdKOpRiu@ep-twility-night-aqn8fqln-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
export HOSTNAME="0.0.0.0"
export PORT=3000
export NODE_OPTIONS='--max-old-space-size=512'

# Remove any stale PID files
rm -f /tmp/nm-server.pid

# Start the server
exec node .next/standalone/server.js
