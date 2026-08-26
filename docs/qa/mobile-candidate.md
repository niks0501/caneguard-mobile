# Mobile QA Candidate

This guide produces an installable Android EAS Preview candidate for a coordinated CaneGuard QA cycle.

The QA profile targets the public staging API over HTTPS and does not use localhost or ADB reverse.

Normal `.env` development and the `development` Development Build profile remain unchanged.

## One-time EAS staging configuration

The Web/API repository's `docs/staging.md` owns the Tailscale Funnel origin in its private `.qa-staging/staging.env` file.

`QA_PUBLIC_URL` is the single public origin used by the Web browser and the QA APK.

The origin is configuration, not a credential, but it must not be committed because the Funnel host can change between QA cycles.

From a host that has both repositories and an authenticated EAS CLI, copy that exact origin into the EAS `preview` environment as a plain-text variable.

The extraction command reads only `QA_PUBLIC_URL` and does not source the staging file, which also contains private passwords.

```bash
cd "<WORKSPACE>/caneguard-web"
QA_PUBLIC_URL="$(awk -F= '$1 == "QA_PUBLIC_URL" { print substr($0, index($0, "=") + 1); exit }' .qa-staging/staging.env)"
case "$QA_PUBLIC_URL" in
  https://*) ;;
  *) echo "QA_PUBLIC_URL must be an HTTPS Funnel origin" >&2; exit 1 ;;
esac
export QA_PUBLIC_URL

cd "<WORKSPACE>/caneguard-mobile"
eas env:set \
  --name EXPO_PUBLIC_API_BASE_URL \
  --value "$QA_PUBLIC_URL" \
  --environment preview \
  --visibility plaintext
eas env:list --environment preview
QA_PUBLIC_URL="$QA_PUBLIC_URL" eas env:exec preview \
  'test "$EXPO_PUBLIC_API_BASE_URL" = "$QA_PUBLIC_URL"'
```

The final `eas env:exec` check proves that the EAS value is exactly the current Web/API Funnel origin without putting that origin in tracked mobile configuration.

If `eas env:list --environment preview` reports that no variables are configured, stop before building and have the captain or an authenticated EAS operator run the setup above once.

Do not put a QA password, bearer token, database credential, or other secret in an `EXPO_PUBLIC_*` variable.

For a local bundle check, copy `.env.qa.example` to `.env.qa.local` and replace its placeholder with the same `QA_PUBLIC_URL`.

The `.env.qa.local` file is ignored by Git and is not uploaded to a remote EAS Build.

Expo does not treat `.env.qa.local` as the remote EAS environment source, so the local QA command loads that file explicitly.

The repository preflight runs before Expo export and before every EAS Build install step.

The Expo config also rejects a direct QA export when `EXPO_PUBLIC_QA_MODE=true`, before Metro can create an artifact.

It fails without creating an artifact when `EXPO_PUBLIC_API_BASE_URL` is missing, invalid, non-HTTPS, or local-only.

```bash
cd "<WORKSPACE>/caneguard-mobile"
cp .env.qa.example .env.qa.local
# Replace the placeholder in .env.qa.local with the current QA_PUBLIC_URL.
npm run qa:preflight
npm run qa:export -- --platform android --output-dir .expo/qa-export-check
rm -rf .expo/qa-export-check
```

The EAS `preview` environment must contain `EXPO_PUBLIC_API_BASE_URL` before a QA build or update is published.

`npm run qa:export` never falls back to `.env`, localhost, a stale Funnel hostname, or a blank URL.

An explicit `EXPO_PUBLIC_API_BASE_URL=https://qa.example.test npm run qa:export` may be used for a disposable local check, but `.env.qa.local` is the repeatable local QA source.

## Expo Doctor and repository verification

Expo Doctor checks project compatibility and configuration rather than exercising the app on a device.

With `--verbose`, the current Expo Doctor command reports these 21 checks: local environment-file tracking, package and Expo configuration, overridden dependencies, Hermes V1 regressions, store submission requirements, lockfile presence, direct dependency guidance, CNG synchronization, Metro configuration, native tooling, common setup, peer dependencies, npm/yarn version, Expo schema, SDK package versions, duplicate dependencies, React Native Directory metadata, icon package conflicts, native support-package compatibility, and legacy global CLI installation.

The fixed repository must be verified from a clean dependency install with the real command below.

```bash
npm ci
npx expo-doctor --verbose
```

Run the QA profile validation independently when changing EAS configuration:

```bash
npm run qa:config
```

`npx expo config --json --full` was rerun during this fix and succeeds in the current checkout, but it resolves local Expo configuration and is not profile-aware.

It does not prove that the remote EAS `preview` environment contains the public API URL.

Use `eas config --platform android --profile qa --json` together with `npm run qa:config` and the EAS environment check above for QA configuration validation.

The dependency check previously failed because 16 Expo SDK 57 packages were behind the versions required by the installed Expo package.

Those package ranges are now aligned in `package.json` and `package-lock.json` through explicit `npx expo install` arguments, rather than an ignore list or blanket suppression.

A passing run reports `21/21 checks passed. No issues detected!`.

The Doctor result is separate from the QA environment check.

Use `eas config --platform android --profile qa --json` to verify that the QA profile selects the `preview` EAS environment and retains only `EXPO_PUBLIC_QA_MODE=true` in profile-local `env`.

The `eas-build-pre-install` hook runs the same environment preflight automatically for a remote `eas build --profile qa`, so a missing EAS variable fails before the JavaScript bundle or APK is produced.

## EAS profiles and delivery channels

`eas.json` defines `qa` as an internal APK profile that extends `preview`, uses the `qa` channel, and enables strict public-staging URL validation.

The existing `development` and `preview` profiles are retained for their existing workflows.

The `qa` profile's local `env` intentionally contains only `EXPO_PUBLIC_QA_MODE=true`.

That stable flag selects the strict public-HTTPS validation path in `src/config/env.ts`.

`EXPO_PUBLIC_API_BASE_URL` belongs in the EAS `preview` environment because the Funnel origin is deployment configuration that can change for each staging host.

It is not inherently an `eas.json` field.

Expo's Metro bundling inlines `EXPO_PUBLIC_API_BASE_URL` into the JavaScript bundle at build time, so the value is public app configuration rather than a secret and must be present in the selected build environment before the build starts.

The `environment: preview` field selects that EAS environment for the `qa` build.

A QA APK is built with:

```bash
eas config --platform android --profile qa --json
npm run qa:config
eas build --platform android --profile qa --json | tee qa-mobile-build.json
```

The first two commands verify the local profile shape, including `environment: preview`, the QA-only profile flag, and the absence of a hard-coded API URL.

The EAS Build preflight then requires the server-side `preview` environment value before the build proceeds.

The build uses that EAS value and the profile-local QA flag.

The `qa` profile is an EAS Preview build, not a Development Build.

The exact JSON output contains the build identity and artifact URL needed by the coordinated release record.

The `qa-mobile-*.json` output files are ignored locally so they can be attached or copied into the coordinated release record without entering the source candidate.

A fresh host downloads and verifies the APK after the build completes with:

```bash
eas build:download --build-id <build-id-from-qa-mobile-build.json>
adb install <downloaded-qa-apk>
adb shell pm clear com.niks0501.caneguard
curl --fail-with-body "$QA_PUBLIC_URL/api/health"
```

Open the installed `qa` APK after the clean-data command and sign in with the seeded field-reporter account.

The clean-device smoke check must reach the authenticated home screen and complete one authenticated API workflow.

The EAS equality check from the setup section, the public health check above, and the authenticated app workflow together verify that the APK uses the current Web/API Funnel origin rather than a loopback or stale tracked URL.

Do not hand-copy only the download URL when recording a build.

Retain the complete JSON output and record the build `id`, build details URL, artifact URL, channel, and runtime version.

A compatible JavaScript, TypeScript, or assets-only change may be published without reinstalling the APK:

```bash
EXPO_PUBLIC_QA_MODE=true \
eas update \
  --channel qa \
  --environment preview \
  --message "qa/YYYY-MM-DD-NN: short change description" \
  --json | tee qa-mobile-update.json
```

The update command explicitly enables QA URL validation because `eas.json` build-profile `env` values are not used by `eas update`.

The `preview` EAS environment supplies the public staging URL to the update bundle.

Run `eas env:exec preview 'EXPO_PUBLIC_QA_MODE=true npm run qa:preflight'` before publishing an update so the same required-variable check runs against the selected EAS environment.

Retain the complete update JSON output and record the update group identity, update details URL, channel, and runtime version.

Use the `qa` channel for the installed QA APK and for its updates.

Do not publish a QA update to `development`, `preview`, or `production`.

## Delivery decision

Classify the complete candidate diff before choosing an artifact.

| Change class | Examples | Delivery |
| --- | --- | --- |
| Native | Native dependencies, native source, Expo plugins, permissions, or native Android/iOS configuration | Fresh `qa` Preview APK |
| Runtime | Expo or React Native runtime changes, native runtime compatibility changes, or a changed `runtimeVersion` | Fresh `qa` Preview APK |
| Build-level | `app.json`, `app.config.*`, `eas.json`, Android packaging, Metro/Babel behavior, or build-profile configuration | Fresh `qa` Preview APK |
| Compatible bundle | JavaScript/TypeScript under `src/`, JavaScript-only configuration such as `src/config/env.ts`, or assets consumed by the existing runtime, with no native/runtime/build-level change | EAS Update when the installed runtime is compatible |
| Documentation and test-only | Documentation, Jest tests, or operator-only files with no shipped bundle change | No mobile artifact by itself |

Treat a mixed or uncertain diff as native/runtime/build-level and build a fresh APK.

Changing the QA staging URL through the EAS environment changes the compiled JavaScript configuration.

Changing the Funnel hostname requires a fresh QA APK when delivering an APK, or a new local export when performing a local bundle check.

A compatible EAS Update can replace the JavaScript without reinstalling the APK only when that delivery is explicitly chosen and the installed `qa` runtime remains compatible.

The update command must supply the same QA mode and `preview` EAS environment.

Changing the EAS profile, Expo app configuration, native dependencies, or runtime version requires a fresh APK.

The FirstMate captain may require a fresh APK for any candidate, including a compatible bundle-only change.

When the captain exercises that override, use the build command instead of the update command and record `delivery decision: captain override - fresh Preview APK`.

The override is deliberately explicit in the release record so that a later operator does not infer that an update was sufficient.

## Clean-device QA cycle

At the beginning of every new QA cycle, clear CaneGuard application data even when the installed Preview APK will be reused.

Clearing application data is independent from reinstalling an APK.

It removes the previous SecureStore session, SQLite data, managed images, cache, and queued work so that the cycle starts from a clean baseline.

With the Android device connected, run:

```bash
adb shell pm clear com.niks0501.caneguard
```

A fresh APK is required for native, runtime, or build-level changes, but clearing app data is required at the start of every cycle regardless of whether an APK is installed.

Do not use ADB reverse for QA authentication or API reachability.

Verify the same `QA_PUBLIC_URL` that was copied into the EAS `preview` environment before opening the app:

```bash
curl --fail-with-body "$QA_PUBLIC_URL/api/health"
```

The response must report an `ok` health status and ready dependencies according to the Web/API staging procedure.

After clearing data, launch the installed `qa` APK and sign in using the seeded field-reporter account `field@caneguard.test`.

The corresponding password is the value of `CANEGUARD_FIELD_PASSWORD` in the Web/API staging host's uncommitted `api/.env`.

Never copy that password into this repository, an EAS variable, a screenshot, or a release record.

The authenticated session must load the mobile home screen and use the public staging API rather than a loopback address.

The captain's real-device smoke gate remains a manual check of public health, clean app state, seeded field-reporter authentication, authenticated home, and one critical authenticated API workflow.

This guide does not replace that smoke gate with a full automated device suite.

## Release record

Create a copy of [`mobile-release-record.template.md`](./mobile-release-record.template.md) for each coordinated QA cycle.

Record the QA cycle identifier, Mobile commit, Web/API commit, staging baseline, delivery decision, and the complete EAS build or update JSON output.

The exact EAS identity is the source of truth for what the tester used.

A release record is not complete until it identifies whether testers installed a fresh APK or received an EAS Update.

Human QA approval is recorded separately from automated readiness and smoke evidence.
