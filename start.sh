#!/bin/bash
# Focusboard 7.0 Quick Launcher for macOS
PORT=3005

# Check if port is already running this server or in use
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
  echo "ℹ️ Port $PORT is already active. Opening browser..."
  open "http://localhost:$PORT/index.html"
  exit 0
fi

echo "🚀 Starting Focusboard Server on http://localhost:$PORT ..."
(sleep 1 && open "http://localhost:$PORT/index.html") &
python3 -m http.server "$PORT"
