# Auth v1 Android manual-equivalent testing

This guide reruns and manually mirrors the Mobile auth-v1 behavior in [PR #61](https://github.com/niks0501/caneguard-mobile/pull/61).

It is intentionally limited to behavior implemented or exercised by the auth-v1 flows in this branch.

It does not replace the separate P0 full report, Web review, or production-release procedures.

## Scope and source of truth

The Mobile PR head inspected for this rerun is `fm/cg-auth-mobile-implementation-20260830` at commit `f3955f2eedd3159ffc1993000ce0afb53a787067`.

The current documentation worktree branch is `fm/cg-auth-mobile-bio-manual-20260901`.

The existing PR URL is https://github.com/niks0501/caneguard-mobile/pull/61.

The inspected setup references were the Mobile [root README](../../README.md), the [Maestro workspace README](../README.md), the [auth-v1 flow README](README.md), and the Web/API setup sections in the companion Web/API README.

The exact checked-in auth-v1 flow files are listed below.

| Flow file | Checked-in flow name | Coverage boundary |
| --- | --- | --- |
| `01-login-session-and-report-boundary.yaml` | `Auth v1 login, session bootstrap, and authenticated report boundary` | Password login, session bootstrap, expiry display, Home, and authenticated scan entry. |
| `02-logout.yaml` | `Auth v1 logout revokes the current session` | Logout confirmation, local sign-out, and login return. |
| `03-expiry-and-password-reauthentication.yaml` | `Auth v1 expired server session requires password reauthentication` | Cached session rejected after server expiry and password reauthentication. |
| `04-registration-verification-resend.yaml` | `Auth v1 registration, unverified login, and verification resend` | Field-reporter registration, unverified-login rejection, and generic resend response. |
| `05-email-verification-deep-link.yaml` | `Auth v1 email verification deep link opens Mobile` | Valid signed email-verification handoff. |
| `06-invalid-deep-links.yaml` | `Auth v1 invalid verification and reset deep links stay safe` | Invalid verification and reset values remain on safe error states. |
| `07-password-recovery-request.yaml` | `Auth v1 generic password recovery request` | Generic password-recovery response without revealing account existence or a reset value. |
| `08-password-reset-deep-link.yaml` | `Auth v1 password reset deep link revokes sessions` | Valid reset handoff, session clearing, and new-password login. |
| `09-role-enforcement.yaml` | `Auth v1 rejects non-field-reporter Mobile login` | Reviewer or administrator accounts cannot enter the Mobile session. |
| `10-offline-session-and-local-report.yaml` | `Auth v1 cached session and local report evidence while offline` | Cached session, Offline status, local model scan, and device-only scan save. |
| `11-biometric-or-device-credential-fallback.yaml` | `Auth v1 biometric capability and password fallback` | Capability state and Account & security surface. Native prompt behavior requires enrollment. |

The auth-v1 implementation keeps password recovery and email verification routes public so deep links can be handled even when a cached session exists.

Authenticated scan, report, settings, and account-security routes remain protected by the authenticated session boundary.

## Security and environment rules

Use only a disposable local Web/API database and local development services.

Do not run QA, staging, or production endpoints for this guide.

Keep seeded passwords in the uncommitted Web/API `api/.env` file.

Never paste a password, bearer token, one-time link, database password, or device PIN into this document, a flow file, or a checked-in evidence record.

Maestro debug metadata can expand private `-e` values into local command artifacts.

Do not attach or commit `commands.json`, terminal captures, or screenshots that contain credentials.

Use a shell with tracing disabled while loading local environment values.

## Required setup

The supported local layout is two private repositories side by side.

```text
<WORKSPACE>/
├── caneguard-web/
└── caneguard-mobile/
```

The commands below use placeholders for paths and local values.

### Web/API

Run the Web/API setup from the companion repository root.

```bash
cd "<WORKSPACE>/caneguard-web"
npm ci
npm run api:install
cp .env.example .env.local
cp api/.env.example api/.env
```

Set the local database value and the three seeded demo passwords only in `api/.env`.

The seeded account emails are `field@caneguard.test`, `mao@caneguard.test`, and `admin@caneguard.test`.

Use a local MySQL database as documented by the Web/API README, or use a disposable local SQLite database when the prepared local Web/API environment is configured for SQLite.

Never point these commands at a shared, QA, staging, or production database.

Apply the local schema and seed the demo accounts.

```bash
php api/artisan key:generate
php api/artisan migrate
php api/artisan db:seed
```

For the default ports, start the API and verify readiness.

```bash
npm run api:dev
curl http://127.0.0.1:8000/api/health
```

A healthy response has `data.status` equal to `ok` and ready database and storage checks.

For the occupied-port browser handoff used by the prior auth-v1 evidence, configure the local Web/API environment with `APP_URL=http://localhost:8001/` and `FRONTEND_URL=http://localhost:5174`, then use these commands from the Web/API root.

```bash
php -d upload_max_filesize=12M -d post_max_size=16M -S 127.0.0.1:8001 -t api/public api/server.php
npm run api:queue
npm run dev -- --port 5174
```

Keep the queue worker running while collecting local verification or reset messages.

```bash
php api/artisan queue:work --tries=1 --timeout=0
```

The occupied-port path is only for the disposable local Web/API checkout and local browser handoff.

### Mobile and development build

Run the Mobile setup from this worktree or another checkout of the same PR head.

```bash
cd "<WORKSPACE>/caneguard-mobile"
npm ci
cp .env.example .env
```

For the default local Android path, keep the Mobile environment at the following non-secret value.

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

Restart Metro after changing `.env`.

Expo Go is not sufficient because this app uses native TensorFlow Lite, Nitro modules, SQLite, SecureStore, and local authentication behavior.

Use a compatible Expo development build for package `com.niks0501.caneguard`.

Create and install one only when the installed native runtime is not compatible with the PR head.

```bash
cd "<WORKSPACE>/caneguard-mobile"
eas build --platform android --profile development
adb install <APK_PATH>
```

The development build used by the prior auth-v1 evidence was version `1.1.0` from EAS build `9277bdb9-774d-4e15-bde3-bed7e475b09c`.

Do not run an EAS build as part of every-day startup.

### Android reverse mappings and Metro

Start the Android Studio emulator from the Windows host when using the WSL2 workflow.

Discover the device instead of assuming a serial.

```bash
adb devices -l
```

For the default API and Metro ports, use the current device serial in these commands.

```bash
adb -s <device> reverse tcp:8081 tcp:8081
adb -s <device> reverse tcp:8000 tcp:8000
adb -s <device> reverse --list
```

Start Metro from the Mobile root.

```bash
npm run start -- --dev-client --port 8081
```

The device-facing `127.0.0.1:8000` API value and the `8000 -> 8000` reverse mapping must refer to the same local API.

For the occupied-port path, use the exact mappings documented by the auth-v1 README.

```bash
adb -s <device> reverse tcp:8081 tcp:8082
adb -s <device> reverse tcp:8000 tcp:8001
adb -s <device> reverse tcp:8082 tcp:8082
adb -s <device> reverse tcp:8001 tcp:8001
adb -s <device> reverse --list
```

Set the Mobile local value to `EXPO_PUBLIC_API_BASE_URL=http://localhost:8001` for that occupied-port path.

The extra `8001 -> 8001` mapping preserves the local signed-link origin.

Use only one API and one Metro session for the selected port pair.

## Private Maestro variables

The flow files require private shell values rather than checked-in credentials.

Use a local Web/API `api/.env` file and keep shell tracing disabled.

```bash
set +x
set -a
. "<WEB_API_CHECKOUT>/api/.env"
set +a
```

Pass only the needed local values to the flow.

```bash
maestro test --device <device> \
  -e AUTH_EMAIL=field@caneguard.test \
  -e AUTH_PASSWORD="$CANEGUARD_FIELD_PASSWORD" \
  .maestro/auth-v1/11-biometric-or-device-credential-fallback.yaml
```

Use `CANEGUARD_REVIEWER_PASSWORD` only for the role-enforcement flow.

Set `AUTH_NAME` and `AUTH_NEW_PASSWORD` interactively in the private shell for registration and reset flows.

Unset private variables when the run is complete.

```bash
unset CANEGUARD_FIELD_PASSWORD CANEGUARD_REVIEWER_PASSWORD CANEGUARD_ADMIN_PASSWORD AUTH_NAME AUTH_NEW_PASSWORD
```

## Automated rerun evidence

The rerun date was 2026-09-01.

The Mobile commit for the automated evidence in this section was `f3955f2eedd3159ffc1993000ce0afb53a787067`.

The automated results in this section predate the approved one-prompt follow-up implementation.
The physical-device closure below is manual evidence for that follow-up implementation.

The selected device was `emulator-5554`, model `sdk_gphone64_x86_64`, Android 14, API 34.

The installed application package was `com.niks0501.caneguard`, version `1.1.0`.

The native development build was compatible with the JavaScript auth-v1 changes.

The tooling was Java 17, Maestro 2.9.0, ADB from the active PATH, and the plain Maestro CLI.

The API health check returned `ok` from the disposable local API on host port 8000.

Metro reported `packager-status:running` on host port 8081.

The active device mappings included `tcp:8081 -> tcp:8081` and `tcp:8000 -> tcp:8000`.

The first focused invocation was deliberately preserved as a failure rather than retried blindly.

`maestro test --device emulator-5554 -e AUTH_EMAIL=... -e AUTH_PASSWORD=... .maestro/auth-v1/11-biometric-or-device-credential-fallback.yaml` first failed at `home.screen` after `auth.login-submit`.

The first-failure artifact directory is `/home/aki/.maestro/tests/2026-09-01_084919`.

The failure classification was `ENVIRONMENT` because the initial private shell extraction passed the local dotenv value's wrapping quote characters to the password field.

No product code was changed for this failure.

One corrected focused rerun used the local dotenv value without wrapping quote characters and passed through the capability assertion.

The corrected flow artifact directory is `/home/aki/.maestro/tests/2026-09-01_085400`.

The corrected run proves the Account & security capability branch only.

It does not prove a native biometric prompt or device-credential fallback because this emulator has no enrolled biometric.

The login and authenticated report-boundary flow passed.

```text
maestro test --device emulator-5554 ... .maestro/auth-v1/01-login-session-and-report-boundary.yaml  PASS
artifact: /home/aki/.maestro/tests/2026-09-01_085551
```

The logout flow passed.

```text
maestro test --device emulator-5554 ... .maestro/auth-v1/02-logout.yaml  PASS
artifact: /home/aki/.maestro/tests/2026-09-01_085733
```

The biometric capability flow passed its capability-only assertions after the corrected private environment loading.

```text
maestro test --device emulator-5554 ... .maestro/auth-v1/11-biometric-or-device-credential-fallback.yaml  PASS_WITH_GAPS
```

All eleven auth-v1 YAML files passed `maestro check-syntax`.

```text
for flow in .maestro/auth-v1/*.yaml; do maestro check-syntax "$flow"; done  PASS
```

The project doctor passed.

```text
npm run e2e:doctor  PASS
```

The focused repository checks passed.

```text
npm run lint      PASS
npm run typecheck PASS
npm run db:check  PASS
```

The full unfiltered Jest command was not a valid clean-repository gate because the preserved untracked `.inspection-pr61/` snapshot was recursively discovered by Jest.

```text
npm test -- --runInBand  FAIL
```

That run reported two failures inside the untracked inspection snapshot and passed all tests in the current source tree.

The same full Mobile suite with the inspection snapshot explicitly excluded passed.

```text
npm test -- --runInBand --testPathIgnorePatterns=.inspection-pr61  PASS
102 suites, 767 tests
```

The complete auth-v1 folder was not rerun as one batch because its expiry, one-time browser handoff, and airplane-mode flows require ordered state and private values.

The prior individual auth-v1 results remain recorded in [AUTH-V1.md](../evidence/AUTH-V1.md).

That prior record reports flows 01 through 10 as passing under their required local preconditions.

Its flow 11 result is capability-only and must not be read as a native biometric prompt pass.

## Android biometric capability result

The selected emulator exposes both `android.hardware.biometrics.face` and `android.hardware.fingerprint`.

The current secure setting `biometric_enrolled` is `null`.

The fingerprint service reports zero enrolled prints.

The Mobile Account & security screen therefore displayed `Enroll a strong biometric in device settings before enabling this option.`

The `Enable biometric unlock` control remained disabled until a strong biometric is enrolled.

No native biometric prompt was exercised in this rerun.

No biometric success, biometric rejection, cancel, or device-credential fallback is claimed as automated evidence for this emulator.

The emulator does expose a supported enrollment path, which was verified and then returned to its original no-screen-lock state.

The observed enrollment path for this exact emulator is:

1. Run `adb -s emulator-5554 shell am start -a android.settings.SECURITY_SETTINGS`.
2. In `Security & privacy`, tap `Set a screen lock`.
3. In `Choose a screen lock`, choose `PIN`, `Pattern`, or `Password` and complete the setup.
4. Return to `Security & privacy`, open `Device unlock`, and tap `Face & Fingerprint Unlock`.
5. Tap `Pixel Imprint`, which is shown as `Tap to set up fingerprint` before enrollment.
6. Accept the Pixel Imprint information screen with `I AGREE` and follow the fingerprint enrollment prompts.
7. If the Android emulator asks for a virtual sensor touch, use `adb -s emulator-5554 emu finger touch 1` for the emulator fingerprint sensor.
8. Confirm enrollment with `adb -s emulator-5554 shell settings get secure biometric_enrolled` and `adb -s emulator-5554 shell dumpsys fingerprint` before testing the app.
9. After the manual run, delete the Pixel Imprint entry and set `Screen lock` back to `None` if the emulator is meant to return to its original state.

After enrollment, rerun flow 11 or navigate manually to Account & security.

Only continue to native prompt testing when the app says `A strong platform biometric is available for this installation.`

If the Settings wizard or virtual sensor is unavailable on another emulator, use an emulator with an enrolled strong biometric or an enrolled physical Android device instead.

## Captain-reported physical-device closure

On 2026-09-01, the captain manually tested the approved follow-up implementation on physical Android phone `AYAUFIN76LEYR46X`.

The `Enable biometric unlock` action produced one native biometric prompt and the enable action completed successfully.

Relaunching the app without explicit logout produced one native biometric prompt and the cached-session unlock completed successfully.

This closes the physical enable and relaunch checks as manual `PASS` results.

These results are not a new automated Maestro rerun.

The closure report did not provide a new CLI command, screenshot, or artifact path, so no automated prompt result is claimed for the physical phone.

The emulator result above remains capability-only because its biometric enrollment state is `null` with zero enrolled fingerprints.

The manual report did not cover biometric rejection, cancellation, or device-credential fallback.

Those scenarios remain unexecuted here and must be recorded separately when run on an enrolled emulator or physical device.

Explicit logout remains the separate session-clearing path described below.

No biometric-after-logout behavior is part of this PR #61 closure.

## Manual equivalent: biometric success

This scenario requires a strong enrolled biometric and a device screen lock.

It was not executable on the current no-enrollment emulator.

1. Start the local API, Metro, development build, and reverse mappings from the setup section.
2. Open CaneGuard Mobile and sign in with the local verified field-reporter account.
3. On Home, tap the profile button labeled `Open settings`.
4. Tap `Account security`.
5. Confirm the capability text says `A strong platform biometric is available for this installation.`.
6. Tap `Enable biometric unlock`.
7. Complete the native `Unlock CaneGuard` prompt with the enrolled strong biometric.
8. Confirm the success text says `Biometric unlock is enabled on this installation. It unlocks this cached session but never extends its seven-day server expiry.`.
9. Record the displayed session expiry.
10. Force-stop and reopen the development build without clearing app state.
11. Complete the native prompt again.
12. Confirm the app returns to the authenticated Home screen and the expiry remains the same server deadline.

Expected result: the protected cached session unlocks, the server session is not extended, and local scans and reports remain available.

Do not record the biometric, device PIN, session token, or private account password as evidence.

## Manual equivalent: biometric rejection and cancel

This scenario requires the same enrolled setup as the success scenario.

It was not executable on the current no-enrollment emulator.

1. Enable biometric unlock and force-stop and reopen the app without clearing state.
2. Present one nonmatching biometric to exercise native rejection, without intentionally driving the device into lockout.
3. Confirm the app remains unauthenticated and shows `CaneGuard could not verify you biometrically. Sign in with your password.`.
4. Reopen the prompt and choose `Use password`, or press the native cancel or back control.
5. Confirm the app shows `Biometric unlock was cancelled. Sign in with your password.`.
6. Enter the local field-reporter password through the normal login form.
7. Confirm password sign-in returns to Home.

Expected result: rejection and cancellation do not bypass authentication, do not delete local scans or reports, and leave password sign-in available.

## Manual equivalent: device-credential fallback

This scenario requires an enrolled strong biometric and a device screen lock.

It was not executable on the current no-enrollment emulator.

1. Enable biometric unlock and force-stop and reopen the app without clearing state.
2. At the native `Unlock CaneGuard` prompt, choose `Use device passcode`.
3. Enter the device screen lock through the system prompt.
4. Confirm the app returns to authenticated Home.
5. Open Account & security and confirm the displayed server expiry is unchanged.

Expected result: the native device credential unlocks the protected session through the configured fallback, while password sign-in remains the separate application fallback.

The app requests a strong biometric and leaves native device fallback enabled with `fallbackLabel: Use device passcode`.

## Manual equivalent: session expiry and password reauthentication

Use only a disposable local API database for this scenario.

1. Run flow 01 or sign in manually and leave the cached field-reporter session on the device.
2. From the exact local Web/API checkout, expire only the disposable field-reporter tokens.

```bash
php api/artisan tinker --execute='DB::table("personal_access_tokens")->whereIn("tokenable_id", DB::table("users")->where("email", "field@caneguard.test")->pluck("id"))->update(["expires_at" => now()->subMinute()]);'
```

3. Relaunch CaneGuard Mobile without clearing app state.
4. Wait for the cached session verification to complete.
5. Confirm the app does not return to Home and requires the normal login screen.
6. Sign in again with the local field-reporter password.
7. Confirm Home and the protected scan boundary are available again.
8. Open Account & security and record the new seven-day expiry without recording the token.

Expected result: an authoritative server rejection clears the cached session and protected biometric entries, requires a fresh password login, and preserves local scan and report data.

A locally stored session that reaches its fixed expiry also shows `Your session expired. Sign in to resume pending uploads.` before password login.

Biometric unlock never refreshes or extends the seven-day server deadline.

## Manual equivalent: logout

1. Sign in as the local field reporter.
2. Optionally create a local scan or draft that must remain on the device.
3. Open Settings through `Open settings`.
4. Tap `Logout`.
5. Select `Cancel` and confirm that the authenticated Home screen remains available.
6. Open the logout dialog again and select `Log out`.
7. Confirm the app returns to the Welcome screen.
8. Tap `I already have an account` and confirm the login screen shows `Welcome back`.
9. Confirm the authenticated Home screen is not available.
10. Confirm any local scan or draft remains on the device.

Expected result: the current server token is revoked when reachable, all local session and protected biometric entries are cleared, local report data is preserved, and a later login requires the password.

If the API is offline during logout, the app still signs out locally and reports that the remote token could not be revoked.

## Manual equivalent: registration, verification, recovery, and deep links

Use a new disposable local email for registration.

### Registration and verification resend

1. From the Welcome screen, tap `Get Started`.
2. Enter a local display name, disposable email, and password of at least 15 characters.
3. Tap `Create Account`.
4. Confirm `Check your email` and `We created your field-reporter account. Verify ... before signing in.`.
5. Tap `Resend verification email`.
6. Confirm the generic response `If the address is eligible, a verification link will be sent.`.
7. Return to login and attempt to sign in before verification.
8. Confirm `Verify your email address before using Mobile.` and no Home screen.

Expected result: registration creates an unverified field-reporter account, resend does not disclose account eligibility, and unverified login is rejected.

### Valid email-verification deep link

1. Keep the local queue worker running if the local API uses a database queue.
2. Read the latest local verification message from the disposable API log without copying its one-time values into evidence.
3. Open the complete local Web verification URL in the browser with the browser tool.

```bash
VERIFICATION_URL='<private local verification URL from the disposable API log>'
npx -y chrome-devtools-axi open "$VERIFICATION_URL"
npx -y chrome-devtools-axi snapshot
```

4. Use the local Web page's Mobile handoff, or open the equivalent custom-scheme URL directly on the emulator without printing it.

```bash
MOBILE_VERIFICATION_URL='<private caneguardmobile verification URL with its signed values>'
adb -s <device> shell am start -a android.intent.action.VIEW -d "$MOBILE_VERIFICATION_URL" com.niks0501.caneguard
```

5. Confirm the Mobile verification screen says `Email verified`.
6. Confirm it says `You may now sign in to CaneGuard Mobile.`.
7. Tap `Continue to login` and sign in with the verified local account.
8. Confirm Home is available.

Expected result: the signed link is accepted once by the local API, the one-time values are not displayed or saved by Mobile, and the verified account can sign in.

### Invalid verification deep link

Use only synthetic invalid values.

```bash
adb -s <device> shell am start -a android.intent.action.VIEW -d 'caneguardmobile:///verify-email?id=1&hash=invalid&expires=4102444800&signature=invalid' com.niks0501.caneguard
```

Confirm the screen shows `This email-verification link is invalid or expired. Request a new link.` and remains on a safe error state.

### Password recovery and valid reset deep link

1. Open the normal login screen and tap `Forgot password?`.
2. Enter the local field-reporter email and tap `Send recovery link`.
3. Confirm `Check your email`.
4. Confirm the generic copy says `If an account matches, a password recovery link will be sent.`.
5. Confirm the screen says `The one-time value is never displayed or saved by CaneGuard.`.
6. Read the latest local reset message from the disposable API log without recording its one-time value.
7. Open its local Web URL with `npx -y chrome-devtools-axi open "$RESET_URL"` and inspect it with `npx -y chrome-devtools-axi snapshot`.
8. Use the local Web page's Mobile handoff or the equivalent private `caneguardmobile:///reset-password` URL.
9. Enter a new local password of at least 15 characters and tap `Update password`.
10. Confirm `Password updated` and `All existing sessions were signed out. Sign in again with your new password.`.
11. Tap `Return to login` and sign in with the new local password.
12. Confirm Home is available.

Expected result: the reset response is generic, the one-time value is not rendered or persisted by Mobile, all existing sessions are signed out after a successful reset, and the new password is required.

### Invalid reset deep link

Use only synthetic invalid values.

```bash
adb -s <device> shell am start -a android.intent.action.VIEW -d 'caneguardmobile:///reset-password?email=invalid%40example.test&token=invalid' com.niks0501.caneguard
```

Enter a disposable local password of at least 15 characters and submit it.

Confirm the screen shows `This recovery link is invalid, expired, or already used. Request a new link.`.

Expected result: invalid reset values remain on the safe error state and do not clear a valid session.

## Manual equivalent: role enforcement

1. Open the login screen.
2. Use the local reviewer account and its private local password.
3. Tap the normal login action.
4. Confirm the app shows `Only field-reporter accounts can use mobile synchronization.`.
5. Confirm Home is not available.

Expected result: only the `field_reporter` role can establish the Mobile session used by the report synchronization boundary.

## Manual equivalent: offline session and local scan boundary

This scenario requires a verified cached field-reporter session and the checked-in fixture `assets/model-fixtures/parity-reference.jpg`.

1. Sign in while the local API is reachable.
2. Confirm Home shows the authenticated field-reporter state.
3. Enable Airplane mode on the emulator.
4. Force-stop and reopen CaneGuard Mobile without clearing app state.
5. Confirm the cached session restores locally and Home shows `Offline`.
6. Tap `Start Scan`.
7. Tap `Upload Image` or the control with test ID `scan.choose-gallery`.
8. Select `assets/model-fixtures/parity-reference.jpg` through the Android photo picker.
9. Tap `Analyze Image`.
10. Select the Rust symptom when the checklist is shown.
11. Continue to the result and confirm `Possible result: Rust`.
12. Choose `Keep as scan only`.
13. Confirm `Scan saved on this device`.
14. Confirm no remote synchronization is reported while the API is unreachable.
15. Restore network connectivity after the evidence is captured.

Expected result: cached authentication and local model inference remain usable offline, the completed scan is persisted on the device, and no server access or authentication shortcut is used.

The prior auth-v1 evidence records this flow as passing under its airplane-mode precondition.

## Manual equivalent: authenticated report-flow boundary

This auth-v1 boundary proves entry protection, not the separate P0 full report submission gate.

1. Sign in with a verified field-reporter account.
2. Confirm Home shows `Start Scan` and `My Activity`.
3. Tap `Start Scan`.
4. Confirm the protected scan screen is visible and the `scan.choose-gallery` control is available.
5. Navigate back, log out, and return to the login screen.
6. Do not claim that the scan or a Field Report is accessible as an authenticated route after logout.
7. Use the offline scenario above to prove that a completed local scan remains on the device without a session shortcut.

Expected result: authenticated users can enter the scan/report boundary, unauthenticated users remain on the public auth surface, and local work is not deleted by logout or session expiry.

This guide does not claim full Field Report finalization, multipart upload, Web review, or Mobile review-status return.

## Evidence record

Complete one record for each manual scenario.

```text
Scenario:
Result: PASS | PASS_WITH_GAPS | SKIPPED | BLOCKED
Date/time UTC:
PR URL: https://github.com/niks0501/caneguard-mobile/pull/61
Mobile commit:
Flow file or manual path:
Device serial:
Device model and Android/API:
Native build package/version:
API local port and health result:
Metro host/device ports:
ADB reverse listing:
Biometric capability text:
Biometric enrollment state:
Observed:
Expected:
Evidence artifact paths:
Credentials and one-time values omitted: yes
Unresolved limitation:
```

For the current emulator, record biometric prompt scenarios as `SKIPPED` with the limitation `emulator exposes biometric hardware and enrollment UI but biometric_enrolled is null and fingerprint count is zero; no native prompt was exercised`.

## Closeout

Restore airplane mode, browser pages, and any temporary emulator security settings before ending the session.

Stop local development services only when they are not needed by another worker.

Do not delete the first-failure Maestro artifact before its evidence has been reviewed.

Do not commit generated artifacts, credentials, tokens, or local environment files.
