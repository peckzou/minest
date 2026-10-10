#!/bin/bash
# Pet Raising inside the iOS app (46.7): a copy of octopus-pet-raising-v6/ in the app bundle, so it opens from
# the phone instead of downloading ~5 MB (scripts + the 3 MB octopus) from the website each time.
# Only what the page uses: the page, its scripts and styles, the octopus model, the voice-detection files kept in git.
# Run after changing anything in octopus-pet-raising-v6/, then build (tools/ios/renew-install.sh).
set -eu
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="$ROOT/octopus-pet-raising-v6"; DST="$ROOT/ios/Minest/BadgeResources/octopus-pet-raising-v6"
rm -rf "$DST"; mkdir -p "$DST/models" "$DST/libs"
cp "$SRC"/index.html "$SRC"/*.js "$DST"/
cp -R "$SRC/assets" "$DST/"
cp "$SRC/models/avatar_web_rigged_v23j.glb" "$DST/models/"
(cd "$SRC" && git ls-files libs) | while read -r f; do cp "$SRC/$f" "$DST/libs/"; done
du -sh "$DST"
