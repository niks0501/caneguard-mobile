#!/usr/bin/env bash
# Pre-flow environment helper for Agent Device flows.
#
# Replaces the Maestro flow commands that the agent-device Maestro
# compatibility runtime does not support:
#
#   addMedia      -> stage-media  (adb push + media-scanner broadcast)
#   setPermissions -> grant-permissions / revoke-permissions (pm grant / appops)
#
# The clipboard commands (setClipboard/pasteText) have no helper on purpose:
# converted .ad scripts use the agent-device fill command on the target
# field instead, which the bundled test IME makes reliable.
#
# Usage:
#   scripts/ad-flow-env.sh preflight
#   scripts/ad-flow-env.sh stage-media [file]
#   scripts/ad-flow-env.sh grant-permissions
#   scripts/ad-flow-env.sh revoke-permissions
#   scripts/ad-flow-env.sh connect-metro
#   scripts/ad-flow-env.sh reset-app
#
# Run from the repository root before running flows that stage media or need
# a known location-permission state. Permissions persist on the emulator, but
# Android's picker copies selected images into Pictures, so restage media
# (stage-media) before each scan flow or isolated scan-flow segment. See
# .agent-device/README.md for the full preflow contract.
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
  # Android's system picker copies selected fixtures into Pictures. Remove
  # only prior copies of this controlled fixture so the flow's semantic
  # picker target remains unique across repeated checks.
  adb shell "rm -f /sdcard/Pictures/${name%.*}*.${name##*.}"
  adb shell content delete --uri content://media/external/images/media \
    --where "_display_name LIKE '${name%.*}%${name##*.}'" >/dev/null 2>&1 || true
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
  echo "ad-flow-env: location permissions revoked (ask state; deny flows handle the system dialog)"
}

connect-metro() {
  need_adb
  # A cleared Expo development client may show its server picker, while an
  # already-connected client opens the app directly. Handle both states here
  # so every flow starts against the same Metro-backed app surface.
  agent-device open "$APP_PACKAGE" --foreground --platform android >/dev/null
  if agent-device wait 'text="http://"' 10000 --platform android >/dev/null 2>&1; then
    agent-device find 'http://' fill 'http://127.0.0.1:8081' --platform android >/dev/null
    agent-device click 'label="Connect"' --platform android --settle >/dev/null
    agent-device wait 'label="Continue"' 30000 --platform android >/dev/null
    agent-device click 'label="Continue"' --platform android --settle >/dev/null
    agent-device click 'label="Close"' --platform android --settle >/dev/null
  fi
  agent-device wait 'label="Get started with CaneGuard"' 180000 --platform android >/dev/null
  agent-device close "$APP_PACKAGE" --platform android >/dev/null
  echo "ad-flow-env: dev client connected to Metro"
}

reset-app() {
  need_adb
  # Replaces the Maestro launchApp clearState command: release any device
  # claim, clear the app's data, and establish the Metro connection before
  # the next .ad script opens the app.
  agent-device close --platform android >/dev/null 2>&1 || true
  adb shell pm clear "$APP_PACKAGE" >/dev/null
  connect-metro
  echo "ad-flow-env: cleared $APP_PACKAGE app data and connected the dev client"
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
  connect-metro)
    connect-metro
    ;;
  reset-app)
    reset-app
    ;;
  *)
    echo "usage: $0 {preflight|stage-media [file]|grant-permissions|revoke-permissions|connect-metro|reset-app}" >&2
    exit 64
    ;;
esac
