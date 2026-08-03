#!/bin/sh
set -e

# Fix Docker bind-mount gotcha: if pkl_reports.db was mounted as a directory on fresh clone, fix it
if [ -d "/app/webapp/backend/pkl_reports.db" ]; then
    rm -rf /app/webapp/backend/pkl_reports.db
fi
if [ ! -f "/app/webapp/backend/pkl_reports.db" ]; then
    touch /app/webapp/backend/pkl_reports.db
fi

# Ensure full read/write permissions for appuser on Windows bind-mounted database & directories
# SQLite WAL mode requires write access to db, db-wal, db-shm, and backend dir
chmod 777 /app/webapp/backend 2>/dev/null || true
chmod 666 /app/webapp/backend/pkl_reports.db* 2>/dev/null || true
chown appuser:appgroup /app/webapp/backend/pkl_reports.db* 2>/dev/null || true
chown appuser:appgroup /app/webapp/backend 2>/dev/null || true
chown -R appuser:appgroup /app/webapp/uploads 2>/dev/null || true
chown -R appuser:appgroup /app/webapp/output 2>/dev/null || true

exec gosu appuser "$@"
