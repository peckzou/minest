#!/bin/sh
set -e
echo "📦 [copy_badges.sh] Copying badge resources into App Bundle..."
DEST="${TARGET_BUILD_DIR}/${UNLOCALIZED_RESOURCES_FOLDER_PATH}"
mkdir -p "$DEST"
if [ -d "${PROJECT_DIR}/BadgeResources" ]; then
    cp -R "${PROJECT_DIR}/BadgeResources/"* "$DEST/"
    echo "✅ [copy_badges.sh] Badge resources copied successfully to $DEST"
else
    echo "⚠️ [copy_badges.sh] BadgeResources directory not found at ${PROJECT_DIR}/BadgeResources"
fi
