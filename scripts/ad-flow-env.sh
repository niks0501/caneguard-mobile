#!/usr/bin/env bash
# Pre-flow environment helper for Agent Device flows.
#
# Replaces the two Maestro flow commands that the agent-device Maestro
# compatibility runtime does not support:
#
#   addMedia      -> stage-media  (adb push + media-scanner broadcast)
#   setPermissions -> grant-permissions / revoke-permissions (pm grant / appops)
#
# The clipboard commands (setClipboard/pasteText) have no helper on purpose:
# converted .ad scripts use the agent-device `fill` command on the target
# field instead, which the bundled test IME makes reliable.
#
# Usage:
#   scripts/ad-flow-env.sh preflight
#   scripts/ad-flow-env.sh stage-media [file]
#   scripts/ad-flow-env.sh grant-permissions
#   scripts/ad-flow-env.sh revoke-permissions
#
# Run from the repository root before running flows that stage media or need
# a known location-permission state. Media and permissions persist on the
# emulator across flows, so one preflight before a suite run is enough.
set -euo pipefail

APP_PACKAGE="${AD_APP_PACKAGE:-com.niks0501.caneguard}"
FIXTURE="${AD_FIXTURE:-assets/model-fixtures/parity-reference.jpg}"
DEVICE_DIR="${AD_DEVICE_MEDIA_DIR:-/sdcard/Download}"

need_adb() {
  command -v adb >/dev/null 2>&1 || {
    echo "ad-flow-env: adb is not on PATH" >&2
    exit 1
  }
}

stage-media() {
  need_adb
  local src="${1:-$FIXTURE}"
  local name
  if [ ! -f "$src" ]; then
    echo "ad-flow-env: fixture not found: $src" >&2
    exit 1
  fi
  name="$(basename "$src")"
  adb push "$src" "$DEVICE_DIR/$name" >/dev/null
  # Index the file so the app's photo picker can see it. This is the same
  # adb push + media scan pattern the t10 flows used instead of Maestro's
  # addMedia gRPC insert.
  adb shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE \
    -d "file://$DEVICE_DIR/$name" >/dev/null
  if ! adb shell content query --uri content://media/external/images/media \
    --projection _display_name --where "\"_display_name='$name'\"" | grep -q "$name"; then
    echo "ad-flow-env: media scan did not index $name" >&2
    exit 1
  fi
  echo "ad-flow-env: staged $src -> $DEVICE_DIR/$name"
}

grant-permissions() {
  need_adb
  adb shell pm grant "$APP_PACKAGE" android.permission.ACCESS_FINE_LOCATION
  adb shell pm grant "$APP_PACKAGE" android.permission.ACCESS_COARSE_LOCATION
  echo "ad-flow-env: location permissions granted for $APP_PACKAGE"
}

revoke-permissions() {
  need_adb
  # Revoke any live grant first, then force-deny so an in-app location
  # request fails immediately without raising the system permission dialog
  # (the state Maestro's setPermissions deny produced).
  adb shell pm revoke "$APP_PACKAGE" android.permission.ACCESS_FINE_LOCATION 2>/dev/null || true
  adb shell pm revoke "$APP_PACKAGE" android.permission.ACCESS_COARSE_LOCATION 2>/dev/null || true
  adb shell appops set "$APP_PACKAGE" ACCESS_FINE_LOCATION deny
  adb shell appops set "$APP_PACKAGE" ACCESS_COARSE_LOCATION deny
  echo "ad-flow-env: location permissions force-denied for $APP_PACKAGE"
}

preflight() {
  need_adb
  adb devices -l
  adb reverse tcp:8081 tcp:8081
  adb reverse tcp:8000 tcp:8000
  adb reverse --list
  grant-permissions
  stage-media "$FIXTURE"
}

case "${1:-}" in
  preflight)
    preflight
    ;;
  stage-media)
    shift
    stage-media "${1:-}"
    ;;
  grant-permissions)
    grant-permissions
    ;;
  revoke-permissions)
    revoke-permissions
    ;;
  *)
    echo "usage: $0 {preflight|stage-media [file]|grant-permissions|revoke-permissions}" >&2
    exit 64
    ;;
esac
