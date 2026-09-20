#!/bin/bash
# Focusboard 8.0 Quick Launcher for macOS
PORT=3005

# Check if port is already running this server or in use
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
  echo "ℹ️ Port $PORT is already active. Opening browser..."
  open "http://localhost:$PORT/web8.0.html"
  exit 0
fi

echo "🚀 Starting Focusboard Server on http://localhost:$PORT ..."
(sleep 1 && open "http://localhost:$PORT/web8.0.html") &
python3 -m http.server "$PORT"
