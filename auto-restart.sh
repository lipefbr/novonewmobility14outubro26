#!/bin/bash
# Auto-restart script for NewMobility dev server
# This script keeps the dev server alive by restarting it when it dies

LOG=/home/z/my-project/auto-restart.log

while true; do
    echo "[$(date)] Starting dev server..." >> $LOG
    
    cd /home/z/my-project
    
    # Start dev server
    bun run dev >> /home/z/my-project/dev.log 2>&1
    EXIT_CODE=$?
    
    echo "[$(date)] Server exited with code $EXIT_CODE" >> $LOG
    
    # Wait a moment before restarting
    sleep 2
done
