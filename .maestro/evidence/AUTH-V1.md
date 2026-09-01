# Auth v1 Android evidence

Outcome: `PASS_WITH_GAPS`.

This record covers the Android follow-up for Mobile PR #61 against the local Web/API implementation from Web PR #77.

## Code and runtime

The Mobile worktree started from PR #61 head `2b31e577a78aa1943585d2de335e22fbf455434d`.

The implementation and evidence-flow commit is `dd8d131d9dd04391c42addca6ea362fbd16d2acf`.

The exact Web/API contract source was Web PR #77 head `d3acea604a98f01574f757561fc05df12f5ff38b`.

The device was `emulator-5554`, Android 14, API 34, model `sdk_gphone64_x86_64`.

The installed development client was version 1.1.0 from EAS build `9277bdb9-774d-4e15-bde3-bed7e475b09c`.

The native runtime was usable for the JavaScript changes and included the auth-v1 native dependency from the PR head.

The exact Web/API server used a disposable local SQLite database on port 8001.

The exact Web frontend used port 5174 for browser handoff.

The local queue worker was running because the exact Web environment uses a database queue for mail delivery.

QA, staging, and production endpoints were not used.

## Reproduction setup

Run the documented local Web/API startup order, then start Metro from the Mobile checkout.

For the occupied host ports used in this run, the Mobile environment was `EXPO_PUBLIC_API_BASE_URL=http://localhost:8001`.

The `localhost` host matches the local API cookie domain and port 8001 matches the signed verification and reset link origin.

The required device-facing reverse mappings were:

```bash
adb devices -l
adb -s emulator-5554 reverse tcp:8081 tcp:8082
adb -s emulator-5554 reverse tcp:8000 tcp:8001
adb -s emulator-5554 reverse tcp:8082 tcp:8082
adb -s emulator-5554 reverse tcp:8001 tcp:8001
adb -s emulator-5554 reverse --list
```

The API health endpoint reported a successful local response with database and storage ready.

Run each flow from the Mobile repository root with private `-e` values for the account variables described in `.maestro/auth-v1/README.md`.

Never put account values or one-time links in a flow file or evidence record.

## Android flow results

- `01-login-session-and-report-boundary.yaml`: PASS.
  Password login, session bootstrap, the seven-day expiry display, authenticated home status, and entry into the authenticated scan/report boundary were verified.

- `02-logout.yaml`: PASS.
  Logout completed through Account & security, returned to the Welcome screen, and did not leave an authenticated home route available.

- `03-expiry-and-password-reauthentication.yaml`: PASS.
  A cached field-reporter session was created, its disposable server token was expired, and the app required password login again before returning to Account & security.

- `04-registration-verification-resend.yaml`: PASS.
  Field-reporter registration, the unverified-login boundary, and the generic resend response were verified.

- `05-email-verification-deep-link.yaml`: PASS.
  A valid local verification message was opened in the local Web frontend with `chrome-devtools-axi`, handed to Mobile, and accepted by the Mobile verification screen.

- `06-invalid-deep-links.yaml`: PASS.
  Invalid verification and reset values stayed on safe generic error states.

- `07-password-recovery-request.yaml`: PASS.
  The generic recovery response was verified for a local field-reporter account and a disposable reset message was produced.

- `08-password-reset-deep-link.yaml`: PASS for the field-reporter account.
  The valid reset handoff produced the success state, session-clearing message, and password reauthentication.

- `09-role-enforcement.yaml`: PASS.
  A local reviewer account was rejected by Mobile with `Only field-reporter accounts can use mobile synchronization.` and no home screen was exposed.

- `10-offline-session-and-local-report.yaml`: PASS.
  With airplane mode enabled, the cached field-reporter session restored locally, the home status showed `Offline`, the checked-in fixture produced a Rust result, and the scan was saved on the device without API access.

- `11-biometric-or-device-credential-fallback.yaml`: PASS_WITH_GAPS (capability-only).
  The capability branch was verified and the Account & security surface remained available.
  The emulator had no enrolled biometric, so no native biometric prompt or device-credential fallback was exercised.

- Authenticated relaunch probe: PASS.
  An authenticated app relaunch now selects Home instead of the unprotected recovery route.

The emulator reported no enrolled biometric, so a native biometric prompt and device-credential fallback could not be exercised on this device.

The role flow used a private passphrase established through the local generic recovery and reset path because the existing disposable database reviewer hash did not match the current local seed environment value.

That local reset did not change application code or any QA, staging, or production data.

## Browser handoff

The valid verification and reset pages were opened only in the exact local Web PR #77 frontend with `chrome-devtools-axi`.

The same query values were handed to the Mobile custom scheme for the two deep-link flows.

The one-time values were not printed, committed, or included in this report.

## Implementation fixes made during evidence collection

The Mobile API client now initializes the Web CSRF cookie and sends the decoded `X-XSRF-TOKEN` for the public Web registration, verification-resend, recovery, and reset requests.

This fixed a real 419 response from the exact Web PR #77 server while leaving bearer-token Mobile API requests unchanged.

The authenticated Stack group now precedes unprotected recovery routes so a restored session starts at Home.

The recovery screen returns an already authenticated user to Home instead of attempting the guarded login route.

Login and logout controls received stable test IDs for executable Maestro coverage.

The executable auth-v1 flow set covers login, logout, expiry, registration, verification, recovery, reset, role enforcement, offline preservation, and biometric capability.

## Remaining gaps

The existing P0 direct-report flow reached the authenticated report form, finalized a local report, displayed `Synced`, and displayed a server report UUID during its first run, but its command failed on a stale synchronization-status assertion.

That assertion was corrected to match the current UI copy.

A rerun then hit a Maestro 2.9 Android driver `inputText` timeout while editing the report form, so that optional P0 flow is not counted as a clean pass here.

The auth-v1 flow itself verifies the authenticated report boundary by entering the scan workflow and never exposes it without a field-reporter session.

The complete auth-v1 directory was not run as one batch because the expiry, browser handoff, and offline flows require ordered private preconditions and one-time links.

The final implementation checks below passed after the source changes.

```text
npm run e2e:doctor       PASS
npm run lint             PASS
npm run typecheck        PASS
npm test -- --runInBand  PASS - 101 suites, 761 tests
npm run db:check         PASS
auth flow syntax         PASS - all 11 YAML flows
git diff --check         PASS
```
