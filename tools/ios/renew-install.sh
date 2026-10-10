#!/bin/bash
# Minest · one-click re-sign + install (run on the Mac about every 7 days)
#
# The free Apple team profiles that sign Minest last 7 days, and Xcode only fetches a new one once the old one
# has expired. This script renews them early and puts a fresh build on the iPhone / iPad:
#   1. moves the current Minest profiles aside (kept in ~/Library/Caches/minest-renew/old-profiles, never deleted)
#   2. builds the app with Xcode, which fetches new 7-day profiles for all targets (app, widget, share, Watch)
#   3. checks the new expiry date
#   4. installs the build on every connected iPhone / iPad (USB or the same Wi-Fi) and opens Minest
#
# Needs: Xcode signed in to the Apple account (Xcode → Settings → Apple Accounts), the devices paired once,
# and preferably unlocked. Usage:  tools/ios/renew-install.sh  [--no-install]
set -u
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PROJ="$ROOT/ios/Minest/Minest.xcodeproj"
SCHEME=Minest
BUNDLE=com.zouminmin.minest
PROFILES="$HOME/Library/Developer/Xcode/UserData/Provisioning Profiles"
DD="$HOME/Library/Caches/minest-renew/DerivedData"
LOG="$HOME/Library/Caches/minest-renew/build.log"
APP="$DD/Build/Products/Debug-iphoneos/Minest.app"
INSTALL=1; [ "${1:-}" = "--no-install" ] && INSTALL=0

say()  { printf '\033[1;36m▸ %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m✓ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m! %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m✗ %s\033[0m\n' "$*"; osascript -e "display notification \"$*\" with title \"Minest 续签失败\"" >/dev/null 2>&1; exit 1; }
expiry_of() { security cms -D -i "$1" 2>/dev/null > /tmp/minest-pp.plist && /usr/libexec/PlistBuddy -c 'Print :ExpirationDate' /tmp/minest-pp.plist 2>/dev/null; }
appid_of()  { security cms -D -i "$1" 2>/dev/null > /tmp/minest-pp.plist && /usr/libexec/PlistBuddy -c 'Print :Entitlements:application-identifier' /tmp/minest-pp.plist 2>/dev/null; }

command -v xcodebuild >/dev/null || die "Xcode is not installed"
[ -d "$PROJ" ] || die "Project not found: $PROJ"
mkdir -p "$(dirname "$LOG")" "$PROFILES"

# 1 ── put the current Minest profiles aside so Xcode has to fetch new ones
say "Moving the current Minest profiles aside"
STASH="$HOME/Library/Caches/minest-renew/old-profiles/$(date +%Y%m%d-%H%M%S)"; moved=0
for f in "$PROFILES"/*.mobileprovision; do
  [ -f "$f" ] || continue
  case "$(appid_of "$f")" in
    *".$BUNDLE"|*".$BUNDLE".*) mkdir -p "$STASH"; mv "$f" "$STASH/" && moved=$((moved + 1)) ;;
  esac
done
ok "$moved profile(s) moved to ${STASH/#$HOME/~}"

# 2 ── build; Xcode signs it with fresh profiles (the second try covers a stale profile path in the build cache)
say "Building Minest with Xcode (fetching new profiles)…"
built=0
for try in 1 2; do
  if xcodebuild -project "$PROJ" -scheme "$SCHEME" -configuration Debug -destination 'generic/platform=iOS' \
       -allowProvisioningUpdates -derivedDataPath "$DD" build > "$LOG" 2>&1 && grep -q '\*\* BUILD SUCCEEDED \*\*' "$LOG"; then
    built=1; break
  fi
  warn "Build try $try failed — retrying"
done
if [ $built = 0 ]; then
  grep -E "error:" "$LOG" | head -5
  if grep -qiE "No Accounts|not signed in|account.*(expired|invalid)|requires a development team" "$LOG"; then
    die "Xcode is not signed in: Xcode → Settings → Apple Accounts → sign in, then run this again"
  fi
  # the build failed: put the old profiles back so nothing is lost
  [ -d "$STASH" ] && mv "$STASH"/*.mobileprovision "$PROFILES/" 2>/dev/null
  die "Build failed — see ${LOG/#$HOME/~}"
fi
ok "Build succeeded"

# 3 ── the new expiry
EXP="$(expiry_of "$APP/embedded.mobileprovision")"
[ -n "$EXP" ] || die "The build has no profile inside"
ok "New profile valid until: $EXP"

[ $INSTALL = 0 ] && { osascript -e "display notification \"签名有效期至 $EXP\" with title \"Minest 续签完成\"" >/dev/null 2>&1; exit 0; }

# 4 ── install on every paired iPhone / iPad and open Minest
say "Looking for iPhones / iPads"
xcrun devicectl list devices --json-output /tmp/minest-devices.json >/dev/null 2>&1
DEVICES="$(python3 - <<'EOF'
import json
try: d = json.load(open('/tmp/minest-devices.json'))
except Exception: d = {}
for x in d.get('result', {}).get('devices', []):
    hw = x.get('hardwareProperties', {})
    if hw.get('reality') == 'physical' and hw.get('platform') == 'iOS':
        print(hw.get('udid', '') + '\t' + x.get('deviceProperties', {}).get('name', '?'))
EOF
)"
[ -n "$DEVICES" ] || warn "No paired iPhone / iPad found"
done_n=0; fail=""
while IFS=$'\t' read -r UDID NAME; do
  [ -n "$UDID" ] || continue
  say "Installing on $NAME"
  okd=0
  for try in 1 2 3 4 5 6; do
    if xcrun devicectl device install app --device "$UDID" "$APP" 2>&1 | grep -q "App installed"; then okd=1; break; fi
    sleep 10
  done
  if [ $okd = 1 ]; then
    xcrun devicectl device process launch --terminate-existing --device "$UDID" "$BUNDLE" >/dev/null 2>&1 \
      && ok "$NAME: installed and opened" || ok "$NAME: installed (unlock it to open Minest)"
    done_n=$((done_n + 1))
  else
    warn "$NAME: not reachable — connect it (USB or same Wi-Fi), unlock it, and run this again"
    fail="$fail $NAME"
  fi
done <<< "$DEVICES"

MSG="签名有效期至 $EXP · 已安装 $done_n 台设备"; [ -n "$fail" ] && MSG="$MSG · 未连上:$fail"
osascript -e "display notification \"$MSG\" with title \"Minest 续签完成\"" >/dev/null 2>&1
ok "$MSG"
