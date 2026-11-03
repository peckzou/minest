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

echo "🌍 [copy_badges.sh] Copying 3D Voxel Worlds into App Bundle & Minest source dir..."
ROOT_DIR="${PROJECT_DIR}/../.."
MINEST_SRC="${PROJECT_DIR}/Minest"

for w in bibury downton giethoorn hallstatt lauterbrunnen neuschwanstein santorini-world venice-world tools; do
    if [ -d "${ROOT_DIR}/${w}" ]; then
        cp -R "${ROOT_DIR}/${w}" "$DEST/"
        echo "  -> copied ${w} to $DEST"
    fi
done

for h in worlds.html santorini.html bibury.html downton.html giethoorn.html hallstatt.html lauterbrunnen.html neuschwanstein.html hobbiton.html venice.html; do
    if [ -f "${ROOT_DIR}/${h}" ]; then
        cp "${ROOT_DIR}/${h}" "$DEST/"
        cp "${ROOT_DIR}/${h}" "$MINEST_SRC/"
        echo "  -> copied ${h} to $DEST and $MINEST_SRC"
    fi
done

echo "📱 [copy_badges.sh] Overwriting main bundle HTMLs with latest 16-world console..."
for app_html in iphone.html ipad.html iphone18.0.html iPhoneDuo.html index.html; do
    if [ -f "${ROOT_DIR}/iPhoneDuo.html" ]; then
        cp "${ROOT_DIR}/iPhoneDuo.html" "$DEST/$app_html"
        cp "${ROOT_DIR}/iPhoneDuo.html" "$MINEST_SRC/$app_html"
        echo "  -> updated $DEST/$app_html and $MINEST_SRC/$app_html"
    fi
done

echo "✅ [copy_badges.sh] 3D Voxel Worlds bundled successfully."
