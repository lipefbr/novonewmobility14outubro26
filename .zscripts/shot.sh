#!/bin/bash
agent-browser eval "$(cat /home/z/my-project/.zscripts/mask.js)" >/dev/null 2>&1
sleep 1
agent-browser screenshot "$1" 2>&1 | tail -1
