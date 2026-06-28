#!/usr/bin/env bash
# Dev preview backend for this site: static files + HTTP Range (seekable video)
# + an inline-edit /save API + LIVE-RELOAD (the page auto-refreshes when you
# edit any .html/.css/.js/.svg/.json/.md under the repo).
#
#   ./run.sh            # serve on :8099 with live-reload
#   ./run.sh 8080       # ...on a different port
#
# Ctrl-C to stop.
set -euo pipefail
cd "$(dirname "$0")"
PORT="${1:-8099}"

# free the port from a previous run of this server, if any
pkill -f "_preview_server.py ${PORT}" 2>/dev/null || true
if command -v fuser >/dev/null 2>&1; then fuser -k "${PORT}/tcp" 2>/dev/null || true; fi
sleep 0.3

echo "▶  preview + live-reload  →  http://localhost:${PORT}/"
echo "   edit a file and the open page reloads itself.  Ctrl-C to stop."
exec python3 _preview_server.py "${PORT}" --reload
