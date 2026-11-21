# Evidence: device PIN fallback + biometric cancel loop (441e19a)

Two routes were used.

## 1. Isolated web-validation run (live product surface)

`npm run web:validate` (stub API 127.0.0.1:8210, Expo web 127.0.0.1:8199,
pinned fixture date 2026-11-20) was started in its own network namespace with
`unshare -rn` because another no-mistakes pipeline held 8210/8199 on the host.
The bundle under test is this worktree's (`441e19a`), driven by headless Chrome
over CDP. Logs: `web-validate-full.log`, `web-validate-focus.log`.
Screens and page text: `screens/`.

- `screens/01-login.png`, `screens/10-login-clean.png`: clean `/login`, password
  form + the password-only restart note (biometric wording on a web device that
  reports no device credential).
- `screens/02-inspector-home.png`, `screens/13-home-after-password-fallback.png`:
  fake inspector `inspector@validation.invalid` signs in with its password and
  reaches Home after the refactored sign-in storage path.
- `screens/04-account-security.png`: Account & security renders the unlock row
  with the capability explanation; the enable button is disabled while the
  capability is not `available`, so no false "unlock is on" claim.
- `screens/11-login-fail-closed.png` (+ `screens/text-11-login-fail-closed.txt`):
  with a previously enabled protected session, the cold open fails closed with
  one message ("Device unlock is unavailable. Sign in with your password.") and
  the password form stays usable - no repeated prompt, no loop.

## 2. Device route

`npm run live:up -- --exit-after-ready` recorded **DEVICE_UNAVAILABLE**
(`device-run.json`): `adb devices` lists no ready target, there is no Android
emulator package, AVD, or `.apk-cache` dev-client APK on this host. Native PIN
cold start, OS prompt cancellation, and secure-storage behaviour therefore have
no device evidence in this run.
