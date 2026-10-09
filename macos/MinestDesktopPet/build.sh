#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_NAME="MinestDesktopPet"
BUNDLE_DIR="$DIR/$APP_NAME.app"
CONTENTS_DIR="$BUNDLE_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"

echo "🔨 [build.sh] Building native macOS Desktop Pet..."

# 0. The pet is the web Mini Pet: (re)generate Resources/Web from the latest iPhone page
#    (set SKIP_SYNC=1 to keep the current Resources/Web)
if [ -z "$SKIP_SYNC" ] || [ ! -f "$DIR/Resources/Web/index.html" ]; then
  python3 "$DIR/sync-web.py"
fi

mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR"

# 1. Compile Swift sources
swiftc -O \
  -target arm64-apple-macosx13.0 \
  "$DIR/Sources/DesktopPetPanel.swift" \
  "$DIR/Sources/DesktopPetView.swift" \
  "$DIR/Sources/MenuBarManager.swift" \
  "$DIR/Sources/RewardEventListener.swift" \
  "$DIR/Sources/LinkServer.swift" \
  "$DIR/Sources/AppDelegate.swift" \
  "$DIR/Sources/main.swift" \
  -o "$MACOS_DIR/$APP_NAME"

# 2. Copy Info.plist
cp "$DIR/Resources/Info.plist" "$CONTENTS_DIR/Info.plist"

# 3. Copy Web Resources
rm -rf "$RESOURCES_DIR/Web"
cp -R "$DIR/Resources/Web" "$RESOURCES_DIR/"

# 4. Seal the whole bundle (binary + Info.plist + Web) with an ad-hoc signature
codesign --force --deep --sign - "$BUNDLE_DIR" >/dev/null
codesign --verify --strict "$BUNDLE_DIR"

echo "✅ [build.sh] Build completed successfully: $BUNDLE_DIR"

# 5. Install: ./build.sh install → /Applications (quits the running pet, starts the new one)
if [ "$1" = "install" ]; then
  pkill -f "$APP_NAME.app/Contents/MacOS/$APP_NAME" 2>/dev/null || true
  sleep 0.5
  rm -rf "/Applications/$APP_NAME.app"
  cp -R "$BUNDLE_DIR" "/Applications/$APP_NAME.app"
  open "/Applications/$APP_NAME.app"
  echo "📦 [build.sh] Installed to /Applications/$APP_NAME.app and started."
fi
