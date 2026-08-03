#!/bin/sh
set -e

# Ensure backend data directory exists and has full permissions for appuser
mkdir -p /app/webapp/backend/data
chmod 777 /app/webapp/backend/data 2>/dev/null || true
chown -R appuser:appgroup /app/webapp/backend/data 2>/dev/null || true

# Legacy fallback: fix if pkl_reports.db was mounted as directory or file at backend root
if [ -d "/app/webapp/backend/pkl_reports.db" ]; then
    rm -rf /app/webapp/backend/pkl_reports.db
fi
if [ ! -f "/app/webapp/backend/pkl_reports.db" ]; then
    touch /app/webapp/backend/pkl_reports.db 2>/dev/null || true
fi

# Ensure full read/write permissions for appuser on database files and directories
chmod 777 /app/webapp/backend 2>/dev/null || true
chmod 666 /app/webapp/backend/pkl_reports.db* 2>/dev/null || true
chmod 666 /app/webapp/backend/data/pkl_reports.db* 2>/dev/null || true
chown -R appuser:appgroup /app/webapp/backend/pkl_reports.db* 2>/dev/null || true
chown -R appuser:appgroup /app/webapp/uploads 2>/dev/null || true
chown -R appuser:appgroup /app/webapp/output 2>/dev/null || true

exec gosu appuser "$@"
