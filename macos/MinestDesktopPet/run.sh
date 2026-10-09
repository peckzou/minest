#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_PATH="$DIR/MinestDesktopPet.app"

case "$1" in
  start)
    echo "🐙 Starting Minest Desktop Pet..."
    open "$APP_PATH"
    ;;
  show)
    if ! pgrep -f "MinestDesktopPet" >/dev/null 2>&1; then
      open "$APP_PATH"
      sleep 0.5
    fi
    osascript -e 'tell application "System Events" to set visible of process "MinestDesktopPet" to true' >/dev/null 2>&1 || true
    echo "👁️ Minest Desktop Pet shown."
    ;;
  hide)
    if pgrep -f "MinestDesktopPet" >/dev/null 2>&1; then
      osascript -e 'tell application "System Events" to set visible of process "MinestDesktopPet" to false' >/dev/null 2>&1 || true
      echo "🙈 Minest Desktop Pet hidden (the menu bar app remains running)."
    else
      echo "❌ Minest Desktop Pet is not running"
    fi
    ;;
  toggle)
    if pgrep -f "MinestDesktopPet" >/dev/null 2>&1; then
      osascript -e 'tell application "System Events" to set visible of process "MinestDesktopPet" to not visible of process "MinestDesktopPet"' >/dev/null 2>&1 || true
      echo "🔁 Minest Desktop Pet visibility toggled."
    else
      open "$APP_PATH"
      echo "👁️ Minest Desktop Pet started and shown."
    fi
    ;;
  stop)
    echo "🛑 Stopping Minest Desktop Pet..."
    pkill -f "MinestDesktopPet" || echo "Not running."
    ;;
  restart)
    pkill -f "MinestDesktopPet" || true
    sleep 0.5
    open "$APP_PATH"
    echo "🔄 Minest Desktop Pet restarted."
    ;;
  status)
    PID=$(pgrep -f "MinestDesktopPet" || true)
    if [ -n "$PID" ]; then
      echo "✅ Minest Desktop Pet is running (PID: $PID)"
    else
      echo "❌ Minest Desktop Pet is not running"
    fi
    ;;
  reward)
    KIND="${2:-task}"
    DIR_APP="$HOME/Library/Application Support/Minest"
    mkdir -p "$DIR_APP"
    echo "{\"kind\": \"$KIND\", \"timestamp\": $(date +%s)}" > "$DIR_APP/reward_event.json"
    echo "🎉 Sent reward event: $KIND"
    ;;
  *)
    echo "Usage: $0 {start|show|hide|toggle|stop|restart|status|reward [task|goal|badge|streak]}"
    ;;
esac
