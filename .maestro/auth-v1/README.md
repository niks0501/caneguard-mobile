# Auth v1 Android evidence flows

These flows exercise the Mobile half of auth-v1 against the local API implementation from Web PR #77.
They use the seeded field-reporter and reviewer accounts without storing their passwords in the repository.

## Runtime prerequisites

Start MySQL, the isolated Web/API PR #77 checkout, the Web app, ADB reverse mappings, Metro, and the development build in the order documented by the Mobile and Web root READMEs.
Use a disposable local API database and keep QA, staging, and production disconnected from this evidence run.

The default ports are API `8000` and Metro `8081`.
If those host ports are occupied by another checkout, run the disposable exact Web PR #77 API on `8001` and Metro on `8082`, then map the device-facing ports explicitly:

```bash
adb devices -l
adb -s <device> reverse tcp:8081 tcp:8082
adb -s <device> reverse tcp:8000 tcp:8001
adb -s <device> reverse tcp:8082 tcp:8082
adb -s <device> reverse tcp:8001 tcp:8001
adb -s <device> reverse --list
```

The exact Web PR #77 API uses `APP_URL=http://localhost:8001/` for this isolated run.
Set the Mobile `.env` value to `EXPO_PUBLIC_API_BASE_URL=http://localhost:8001` and retain the `8000 -> 8001` mapping for the documented device-facing API port.
The additional `8001 -> 8001` mapping preserves the signed verification and reset link host and port used by the local API.
Use `http://127.0.0.1:8000` only when the local API `APP_URL` and the device-facing URL use that same origin.
The exact Web/API checkout must report `GET /api/health` with database and storage ready.

A fresh development APK is required when the native dependency or Expo plugin changes.
JavaScript-only flow or selector changes can reuse that compatible APK.

## Flow environment

Set these values only in the shell that runs Maestro:

- `AUTH_EMAIL` and `AUTH_PASSWORD` identify a verified field-reporter account for login flows.
- `AUTH_NAME` is the display name used by the registration flow.
- `AUTH_NEW_PASSWORD` is a new local passphrase used by the reset flow.
- `AUTH_REVIEWER_EMAIL` and `AUTH_REVIEWER_PASSWORD` identify the seeded reviewer account for role enforcement.

Pass them as Maestro `-e KEY=value` options or through an equivalent private environment file.
Do not commit the values or include them in evidence artifacts.

## Ordered evidence

Run `01-login-session-and-report-boundary.yaml` first with a verified field-reporter account.
It proves password login, session bootstrap, the seven-day expiry display, and the authenticated scan/report boundary.

Run `02-logout.yaml` with the same account to prove local logout and current-token revocation behavior.

For `03-expiry-and-password-reauthentication.yaml`, first leave a cached session from flow 01, then expire the field-reporter tokens in the disposable SQLite database:

```bash
cd <isolated-web-pr-77-checkout>
php api/artisan tinker --execute='DB::table("personal_access_tokens")->whereIn("tokenable_id", DB::table("users")->where("email", "field@caneguard.test")->pluck("id"))->update(["expires_at" => now()->subMinute()]);'
```

Run flow 03 without clearing app state.
The app must return to login after server verification rejects the cached token, and password login must establish a fresh session.

Run `04-registration-verification-resend.yaml` with a new local email.
It proves field-reporter registration, the unverified-login boundary, and the generic resend response.
The Mobile client initializes the Web CSRF cookie before these public Web state-changing requests.

The local log mailer writes the verification link to `api/storage/logs/laravel.log`.
Run the exact Web frontend locally, open the latest valid link in Chrome, and hand the same link to the installed Mobile app only for this deep-link step.
Do not paste the link into a report.
The exact Web PR #77 API uses a database queue in its local environment, so keep a local `php artisan queue:work` process running while collecting mail links.

Run `05-email-verification-deep-link.yaml` after the handoff.
The flow verifies the Mobile screen and signs in with the newly verified account.

Run `07-password-recovery-request.yaml` with the verified field account.
It proves the generic recovery response and creates a local reset message.

Hand the latest reset link from the disposable API log to the Mobile app through Chrome, then run `08-password-reset-deep-link.yaml`.
The flow proves reset success, local session clearing, revocation messaging, and password reauthentication.
Open the local frontend link first so the browser handoff is observable, then pass its query values to the Mobile deep-link route without recording the one-time token.

Run `06-invalid-deep-links.yaml` with any valid local password value to prove invalid verification and reset values remain on safe error states.
Run `09-role-enforcement.yaml` with the seeded reviewer account to prove non-field-reporter Mobile login is rejected.

For `10-offline-session-and-local-report.yaml`, leave a verified cached field session from flow 01, enable airplane mode on the emulator, and run the flow without clearing app state.
The flow must show `Offline`, open the authenticated scan boundary, analyze the local fixture, and save the scan on the device without API access.
Restore the emulator network after the flow.

Run `11-biometric-or-device-credential-fallback.yaml` with a verified field account.
The capability assertion records whether the device exposes a strong biometric, requires enrollment, is unsupported, or is otherwise unavailable.
When a strong biometric is available, perform the native prompt manually and record the device-credential or password fallback result separately.

## Deterministic commands

Check every flow before running it:

```bash
for flow in .maestro/auth-v1/*.yaml; do maestro check-syntax "$flow"; done
```

Run a focused flow with the current device selected explicitly:

```bash
maestro test --device <device> -e AUTH_EMAIL=... -e AUTH_PASSWORD=... .maestro/auth-v1/01-login-session-and-report-boundary.yaml
```

Run the full auth folder only after each preconditioned segment has passed.
The expiry, deep-link, and offline flows intentionally require the ordered setup above and should not be treated as independent tests.
The executable evidence report is `.maestro/evidence/AUTH-V1.md`.
