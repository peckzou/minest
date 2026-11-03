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

echo "🌍 [copy_badges.sh] Copying 3D Voxel Worlds into App Bundle..."
ROOT_DIR="${PROJECT_DIR}/../.."
for w in bibury downton giethoorn hallstatt lauterbrunnen neuschwanstein santorini-world venice-world tools; do
    if [ -d "${ROOT_DIR}/${w}" ]; then
        cp -R "${ROOT_DIR}/${w}" "$DEST/"
        echo "  -> copied ${w} to $DEST"
    fi
done
for h in worlds.html santorini.html bibury.html downton.html giethoorn.html hallstatt.html lauterbrunnen.html neuschwanstein.html hobbiton.html; do
    if [ -f "${ROOT_DIR}/${h}" ]; then
        cp "${ROOT_DIR}/${h}" "$DEST/"
        echo "  -> copied ${h} to $DEST"
    fi
done
echo "✅ [copy_badges.sh] 3D Voxel Worlds bundled successfully."
