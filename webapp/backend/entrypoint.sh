#!/bin/sh
set -e

# Ensure backend data directory and db file exist with full permissions for appuser
mkdir -p /app/webapp/backend/data
if [ ! -f "/app/webapp/backend/data/pkl_reports.db" ]; then
    touch /app/webapp/backend/data/pkl_reports.db 2>/dev/null || true
fi
chmod -R 777 /app/webapp/backend/data 2>/dev/null || true
chown -R appuser:appgroup /app/webapp/backend/data 2>/dev/null || true

# Legacy fallback: fix if pkl_reports.db was mounted as directory at backend root
if [ -d "/app/webapp/backend/pkl_reports.db" ]; then
    rm -rf /app/webapp/backend/pkl_reports.db
fi

# Ensure full read/write permissions for appuser on database files and directories
chmod 777 /app/webapp/backend 2>/dev/null || true
chmod 666 /app/webapp/backend/pkl_reports.db* 2>/dev/null || true
chown -R appuser:appgroup /app/webapp/backend/pkl_reports.db* 2>/dev/null || true
chown -R appuser:appgroup /app/webapp/uploads 2>/dev/null || true
chown -R appuser:appgroup /app/webapp/output 2>/dev/null || true

# LibreOffice needs writable cache/config dirs under HOME (/app)
mkdir -p /app/.cache /app/.config 2>/dev/null || true
chown -R appuser:appgroup /app/.cache /app/.config 2>/dev/null || true

exec gosu appuser "$@"
