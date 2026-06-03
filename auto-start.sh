#!/bin/bash
# Auto-start script for NewMobility
# This script ensures the dev server is always running

cd /home/z/my-project

# Kill any existing server processes
pkill -f "next dev" 2>/dev/null
pkill -f "next-server" 2>/dev/null
pkill -f "node.*server.js" 2>/dev/null
sleep 2

# Start the dev server
bun run dev >> /home/z/my-project/dev.log 2>&1 &
echo "[$(date)] Dev server started" >> /home/z/my-project/auto-start.log
