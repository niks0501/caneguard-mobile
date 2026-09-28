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
#   scripts/ad-flow-env.sh preflight-v1
#   scripts/ad-flow-env.sh stage-media [file] [device-name]
#   scripts/ad-flow-env.sh stage-v1-fixture smut
#   scripts/ad-flow-env.sh stage-v1-fixtures
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
FIXTURE="${AD_FIXTURE:-dev-assets/model-fixtures/parity-reference.jpg}"
DEVICE_DIR="${AD_DEVICE_MEDIA_DIR:-/sdcard/Download}"
V1_FIXTURE_DIR="${AD_V1_FIXTURE_DIR:-dev-assets/model-fixtures}"
V1_HANDOFF_QA_DIR="${AD_V1_HANDOFF_QA_DIR:-$HOME/projects/CaneGuard-V1-Integration-Handoff/qa}"
V1_FIXTURE_PREFIX="caneguard-v1"

need_adb() {
  command -v adb >/dev/null 2>&1 || {
    echo "ad-flow-env: adb is not on PATH" >&2
    exit 1
  }
}

stage-media() {
  need_adb
  local src="${1:-$FIXTURE}"
  local name="${2:-$(basename "${1:-$FIXTURE}")}"
  if [ ! -f "$src" ]; then
    echo "ad-flow-env: fixture not found: $src" >&2
    exit 1
  fi
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

v1_fixture_source() {
  local fixture="$1"
  local handoff="$V1_HANDOFF_QA_DIR/${fixture}.jpg"
  local tracked="$V1_FIXTURE_DIR/v1-${fixture}.jpg"
  local source

  case "$fixture" in
    healthy|mosaic|rust|smut)
      source="$handoff"
      [ -f "$source" ] || source="$tracked"
      ;;
    *)
      echo "ad-flow-env: unknown V1 fixture '$fixture' (expected healthy, mosaic, rust, or smut)" >&2
      exit 64
      ;;
  esac

  if [ ! -f "$source" ]; then
    echo "ad-flow-env: V1 fixture not found: $handoff or $tracked" >&2
    exit 1
  fi

  local expected actual
  case "$fixture" in
    healthy) expected="ad39d1151324edb95ef31bd4d05f11e3a55c8cffa2f658d420878afb29f92d43" ;;
    mosaic) expected="78246cb2aa94c2528ae23aa125289956668aef533405e446d9942f072c52f499" ;;
    rust) expected="851bdc7a30691c06a5e353ce1c6e03d08dad05dda717d974fa3fad1ac697faaa" ;;
    smut) expected="0d278ac9b50f779992f0f6d98cb41511a274e58a5a4699cdfe8a802ab02e9024" ;;
  esac
  actual="$(sha256sum "$source" | awk '{print $1}')"
  if [ "$actual" != "$expected" ]; then
    echo "ad-flow-env: V1 fixture hash mismatch for $fixture" >&2
    echo "ad-flow-env: expected $expected, got $actual" >&2
    exit 1
  fi
  printf '%s\n' "$source"
}

clear-v1-fixtures() {
  need_adb
  # Only remove the helper's own names. Never clear Pictures, app data, or
  # unrelated user media as part of a flow precondition.
  adb shell "rm -f $DEVICE_DIR/${V1_FIXTURE_PREFIX}-*.jpg /sdcard/Pictures/${V1_FIXTURE_PREFIX}-*.jpg"
  adb shell content delete --uri content://media/external/images/media \
    --where "_display_name LIKE '${V1_FIXTURE_PREFIX}-%'" >/dev/null 2>&1 || true
}

stage-v1-fixture() {
  local fixture="${1:-}"
  if [ -z "$fixture" ]; then
    echo "usage: $0 stage-v1-fixture {healthy|mosaic|rust|smut}" >&2
    exit 64
  fi
  local source
  source="$(v1_fixture_source "$fixture")"
  clear-v1-fixtures
  stage-media "$source" "${V1_FIXTURE_PREFIX}-${fixture}.jpg"
}

stage-v1-fixtures() {
  clear-v1-fixtures
  local fixture source
  for fixture in healthy mosaic rust smut; do
    source="$(v1_fixture_source "$fixture")"
    stage-media "$source" "${V1_FIXTURE_PREFIX}-${fixture}.jpg"
  done
}

grant-permissions() {
  need_adb
  adb shell pm clear-permission-flags "$APP_PACKAGE" android.permission.ACCESS_FINE_LOCATION user-set user-fixed
  adb shell pm clear-permission-flags "$APP_PACKAGE" android.permission.ACCESS_COARSE_LOCATION user-set user-fixed
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
  adb shell pm set-permission-flags "$APP_PACKAGE" android.permission.ACCESS_FINE_LOCATION user-set user-fixed
  adb shell pm set-permission-flags "$APP_PACKAGE" android.permission.ACCESS_COARSE_LOCATION user-set user-fixed
  echo "ad-flow-env: location permissions force-denied (no system dialog)"
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

preflight-v1() {
  need_adb
  adb devices -l
  adb reverse tcp:8081 tcp:8081
  adb reverse tcp:8000 tcp:8000
  adb reverse --list
  grant-permissions
  stage-v1-fixtures
}

case "${1:-}" in
  preflight)
    preflight
    ;;
  preflight-v1)
    preflight-v1
    ;;
  stage-media)
    shift
    stage-media "${1:-}" "${2:-}"
    ;;
  stage-v1-fixture)
    shift
    stage-v1-fixture "${1:-}"
    ;;
  stage-v1-fixtures)
    stage-v1-fixtures
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
    echo "usage: $0 {preflight|preflight-v1|stage-media [file] [device-name]|stage-v1-fixture {healthy|mosaic|rust|smut}|stage-v1-fixtures|grant-permissions|revoke-permissions|connect-metro|reset-app}" >&2
    exit 64
    ;;
esac
