#!/bin/sh
set -e

# Fix permissions on runtime bind-mounted volumes from Windows host
# (bind-mounted files inherit host UID which appuser can't write to)
chown appuser:appgroup /app/webapp/backend/pkl_reports.db 2>/dev/null || true
chown -R appuser:appgroup /app/webapp/uploads 2>/dev/null || true
chown -R appuser:appgroup /app/webapp/output 2>/dev/null || true

exec gosu appuser "$@"
