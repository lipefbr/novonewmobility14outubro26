#!/bin/bash
cd "$(dirname "$0")/.next/standalone"
export PORT=3993
export NODE_ENV=production
export DATABASE_URL='postgresql://u_cmsv5tbq_newmobility:NewMobility@2026LhSecure@127.0.0.1:5432/lh_cmsv5tbq_newmobility?schema=public'
exec node server.js
