# Mobile QA Candidate

This guide produces an installable Android EAS Preview candidate for a coordinated CaneGuard QA cycle.

The QA profile targets the public staging API over HTTPS and does not use localhost or ADB reverse.

Normal `.env` development and the `development` Development Build profile remain unchanged.

## One-time EAS staging configuration

The public staging URL is configuration, not a credential, but it must not be committed because the staging host can change between QA cycles.

Set the URL in the EAS `preview` environment as a plain-text variable.

```bash
eas env:set \
  --name EXPO_PUBLIC_API_BASE_URL \
  --value "https://<public-staging-host>" \
  --environment preview \
  --visibility plaintext
eas env:list --environment preview
```

Use the one public HTTPS origin supplied by the Web/API staging operator.

Do not put a QA password, bearer token, database credential, or other secret in an `EXPO_PUBLIC_*` variable.

For a local configuration check, copy `.env.qa.example` to `.env.qa.local` and replace the placeholder URL.

The `.env.qa.local` file is ignored by Git and must never be renamed to `.env` in the normal development checkout.

The EAS `preview` environment must contain `EXPO_PUBLIC_API_BASE_URL` before a QA build or update is published.

## EAS profiles and delivery channels

`eas.json` defines `qa` as an internal APK profile that extends `preview`, uses the `qa` channel, and enables strict public-staging URL validation.

The existing `development` and `preview` profiles are retained for their existing workflows.

A QA APK is built with:

```bash
eas build --platform android --profile qa --json | tee qa-mobile-build.json
```

The `qa` profile is an EAS Preview build, not a Development Build.

The exact JSON output contains the build identity and artifact URL needed by the coordinated release record.

The `qa-mobile-*.json` output files are ignored locally so they can be attached or copied into the coordinated release record without entering the source candidate.

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

It may use EAS Update only when the installed `qa` runtime remains compatible and the update command supplies the same QA mode and `preview` EAS environment.

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

Verify the public boundary before opening the app:

```bash
curl --fail-with-body "https://<public-staging-host>/api/health"
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
