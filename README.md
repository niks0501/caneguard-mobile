# CaneGuard Mobile

CaneGuard Mobile is an Android-first Expo and React Native field app for collecting sugarcane observations and producing on-device AI-assisted disease classification.

AI output is decision support only.
The app must not present a possible disease result as a confirmed diagnosis or expert validation.

## How the repositories fit together

CaneGuard Mobile is the device-side producer.
It runs the TensorFlow Lite model locally, stores scans and report drafts in Expo SQLite plus managed device storage, and uploads finalized reports when the API is reachable.

[CaneGuard Web](https://github.com/niks0501/caneguard-web) is the companion private repository.
Its root contains the React and Vite reviewer dashboard, and `api/` contains the Laravel 13 and Sanctum API backed by MySQL.

The normal system flow is:

```text
Android development build
  -> local image analysis
  -> SQLite Scan Record and Field Report Draft
  -> local finalization
  -> authenticated multipart API upload
  -> Web reviewer queue
  -> API review status
  -> Mobile status refresh
```

## Architecture and local services

- **Mobile:** Expo SDK 57, Expo Router, React Native 0.86, bundled `react-native-fast-tflite`, Expo SQLite, Drizzle, SecureStore, and retryable synchronization.
- **Web:** React 19, TypeScript, and Vite at the root of `caneguard-web`.
- **API:** Laravel 13 and Sanctum under `caneguard-web/api`.
- **Database:** MySQL 8.4 LTS for the API and device-local SQLite for mobile records.
- **Local API:** `http://127.0.0.1:8000` for the Laravel development server and `GET /api/health` for readiness checks.
- **Local Web:** `http://localhost:5173` for the Vite dashboard.
- **Local Metro:** the Expo development server uses the repository's normal port, with `8081` reverse-mapped for the documented WSL2 Android workflow.

Completed scans are saved locally before upload is attempted.
A Field Report Draft can remain incomplete and local-only while offline.
Finalization makes a complete report non-editable and queues it as `pending`.
Synchronization runs after save, at startup, on app resume, after connectivity returns, or from the manual sync action.
Failed uploads preserve the local report and image for retry.
Only an authenticated `field_reporter` session can synchronize mobile reports.

The mobile upload endpoint is `POST /api/v1/mobile/reports`.
The Web/API review flow uses the same remote report identity and exposes the resulting review status back to Mobile.
The image roles and multipart compatibility contract remain owned by the Web/API repository, so this README keeps those details brief and links to the authoritative documents below.

## Prerequisites

Install or obtain these prerequisites before setup:

- Git with authenticated access to both private repositories.
- Node.js and npm compatible with the Mobile `package-lock.json` and the Web repository's Vite 8 toolchain.
- PHP 8.3 through 8.5 with PDO MySQL.
- Composer.
- MySQL 8.4 LTS.
- An Android emulator or physical Android device.
- Android Platform Tools with `adb` available on `PATH`.
- The EAS CLI when creating the Android development APK.
- A browser and `curl` for the local Web/API smoke checks.

The Mobile app requires a compatible native development build because `react-native-fast-tflite` and `react-native-nitro-modules` are native dependencies.
Expo Go is not sufficient for the complete Android workflow.

Maestro is optional.
The optional Maestro doctor also requires Java 17 or newer and the `maestro` command on `PATH`.

A MapTiler browser key is optional for the Web map.
The Web dashboard keeps its report-table fallback visible when `VITE_MAPTILER_KEY` is blank.

## One-time setup

### 1. Clone the private repositories side by side

The commands below use `<WORKSPACE>` as a placeholder for a parent directory that you choose.
Replace it before running the commands and do not put GitHub tokens or other credentials in clone URLs.

```bash
mkdir -p "<WORKSPACE>"
cd "<WORKSPACE>"
git clone https://github.com/niks0501/caneguard-web.git
git clone https://github.com/niks0501/caneguard-mobile.git
```

The resulting layout must be:

```text
<WORKSPACE>/
├── caneguard-web/
└── caneguard-mobile/
```

Use your existing authenticated Git transport for the private clone operations.
The two repositories are separate checkouts, but the Web/API repository's contract gate can inspect the selected Mobile checkout when both are available.

### 2. Install and configure Web/API

Run the following from `<WORKSPACE>/caneguard-web`.
The root install is for the Web dashboard, and `npm run api:install` installs the Laravel Composer dependencies under `api/`.

```bash
cd "<WORKSPACE>/caneguard-web"
npm install
npm run api:install
cp .env.example .env.local
cp api/.env.example api/.env
```

The copied Web defaults use `VITE_API_BASE_URL=http://localhost:8000`, API-backed data, a 10-minute report refresh, and an empty optional `VITE_MAPTILER_KEY`.
Keep those local defaults when the browser and API run on the same development machine.

The copied API defaults use the local Laravel URL, the Web URL, MySQL on port `3306`, database `caneguard`, user `caneguard_app`, and `utf8mb4_unicode_ci`.
Create both MySQL databases named `caneguard` and `caneguard_test` with `utf8mb4_unicode_ci`, then grant a dedicated local `caneguard_app` user access to both.

Edit only the local `api/.env` file for the database password and the three local demo account passwords:

- `DB_PASSWORD`
- `CANEGUARD_FIELD_PASSWORD`
- `CANEGUARD_REVIEWER_PASSWORD`
- `CANEGUARD_ADMIN_PASSWORD`

Do not commit `api/.env`, and do not put any of these values in this README or another checked-in environment file.
The seed emails are `field@caneguard.test`, `mao@caneguard.test`, and `admin@caneguard.test`.
Use the password values you set locally when logging in during the smoke check.

Generate the application key, apply migrations, and seed the local accounts and report fixtures from the Web repository root:

```bash
cd "<WORKSPACE>/caneguard-web"
php api/artisan key:generate
php api/artisan migrate
php api/artisan db:seed
```

The API must be migrated before it is served.
For an existing installation created before private evidence storage, follow the migration and image-storage procedure in the [Web/API README](https://github.com/niks0501/caneguard-web/blob/main/README.md) instead of repeating the first-install seed sequence.

### 3. Install and configure Mobile

Run the following from `<WORKSPACE>/caneguard-mobile`.

```bash
cd "<WORKSPACE>/caneguard-mobile"
npm ci
cp .env.example .env
```

The checked-in Mobile example sets:

```env
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

Use that local value with the ADB reverse mapping in the Android connectivity section.
The value must be an absolute `http` or `https` URL without credentials.
Development builds may use `http`; non-development builds require `https`.
Restart Metro after changing `.env` because Expo public environment values are inlined into the JavaScript bundle.

### 4. Create and install the Android development build

The development profile in [`eas.json`](eas.json) creates an internal Android APK with `developmentClient: true`.
The same file requires an EAS CLI version of `21.2.0` or newer.

Create the APK only once for initial setup or again after a native dependency, Expo plugin, or native app configuration change.
Connect an emulator or device using the Android connectivity steps below before running `adb install`.

```bash
cd "<WORKSPACE>/caneguard-mobile"
eas build --platform android --profile development
adb install <APK_PATH>
```

`<APK_PATH>` is the path to the APK downloaded from the completed EAS build.
Do not run an EAS build as part of every-day startup.

## Coordinated QA Mobile candidates

Use the [Mobile QA candidate guide](docs/qa/mobile-candidate.md) when preparing a `qa/YYYY-MM-DD-NN` candidate for human QA.

The `qa` EAS profile creates an internal Preview APK configured for the public staging HTTPS API.

Compatible JavaScript, TypeScript, and assets-only changes may use an EAS Update on the `qa` channel when the installed Preview runtime is compatible.

Native, runtime, and build-level changes require a fresh `qa` Preview APK.

The FirstMate captain may explicitly override that decision and require a fresh APK for any candidate.

At the beginning of every QA cycle, clear CaneGuard app data with `adb shell pm clear com.niks0501.caneguard`, independently of whether the APK is reinstalled.

Use the seeded `field@caneguard.test` account and the password held in the Web/API staging host's uncommitted environment file.

Do not commit the staging URL, QA password, or any other credential.

The guide records exact EAS build or update JSON output for the coordinated release record and keeps the real-device smoke gate manual.

## Android API connectivity

The team-default path keeps Laravel bound to its local loopback address and uses ADB reverse.
It works for an emulator or a physical device without committing a developer-specific LAN address or exposing the API to the network.

### Emulator

Boot the emulator using your normal Android tooling, then run these commands from the Mobile repository or another directory where `adb` is available:

```bash
adb devices -l
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8000 tcp:8000
adb reverse --list
```

The device list must show the emulator as `device`.
The reverse list should include the `8081` Metro mapping and the `8000` API mapping.
With this mapping, keep `EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000` in the Mobile `.env`.

### Physical Android device over wireless debugging

The placeholders below are values displayed by Android under **Developer options > Wireless debugging**.
`<PAIRING_IP>:<PAIRING_PORT>` is shown by **Pair device with pairing code**.
`<CONNECTION_PORT>` is the separate port shown on the main Wireless debugging screen.
Do not store the six-digit pairing code in the repository or evidence logs.
`adb pair` prompts for that code interactively.

```bash
adb pair <PAIRING_IP>:<PAIRING_PORT>
adb connect <DEVICE_IP>:<CONNECTION_PORT>
adb devices -l
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8000 tcp:8000
adb reverse --list
```

Keep the phone and development machine on a network that allows wireless debugging.
The device list must show `device`, and the reverse list must show the `8000` mapping before the app smoke check.
If wireless debugging restarts, use the current connection port and rerun `adb connect`.

ADB reverse is the primary path because the API command binds to loopback.
Only use a private LAN fallback when reverse is unreliable in your local environment.
That fallback requires an explicitly reviewed API binding and firewall rule, and the Mobile value must use a placeholder such as `http://<HOST_REACHABLE_FROM_ANDROID>:8000` rather than a checked-in LAN address.
Do not commit that address or expose the development server publicly.

## Every-day startup order

Complete the one-time setup above before using this sequence.
Use one terminal per long-running process.

1. Start MySQL and confirm that the `caneguard` database is available.
2. Start the API from the Web repository root.

   ```bash
   cd "<WORKSPACE>/caneguard-web"
   npm run api:dev
   ```

3. In another terminal, check API readiness from the Web repository root or any directory with `curl`.

   ```bash
   curl http://127.0.0.1:8000/api/health
   ```

   The response should report `data.status` as `ok` and both current dependency checks as `ready`.

4. Start the Web dashboard in another terminal.

   ```bash
   cd "<WORKSPACE>/caneguard-web"
   npm run dev
   ```

   Open `http://localhost:5173`.

5. Connect the Android emulator or device and establish the `8081` and `8000` reverse mappings shown above.
6. Start Metro from the Mobile repository root.

   ```bash
   cd "<WORKSPACE>/caneguard-mobile"
   npm run start -- --dev-client
   ```

7. Open the already installed `caneguard-mobile` development build on the Android device or emulator and connect it to the running Metro server.

Do not start a second Metro session with a different environment file.
If `.env` changes, stop and restart Metro before reopening the development build.

## Fast full-system smoke checklist

Use the local passwords you configured in `api/.env` and do not paste them into logs, screenshots, or this repository.

1. **API:** `curl http://127.0.0.1:8000/api/health` returns `data.status: ok` with ready dependency checks.
2. **Web:** open `http://localhost:5173`, sign in as `mao@caneguard.test` with the locally configured reviewer password, and confirm the dashboard loads API-backed data.
3. **Mobile authentication:** open the development build, sign in as `field@caneguard.test` with the locally configured field-reporter password, and confirm the authenticated home screen loads.
4. **Offline creation:** make the API unavailable or take the device offline, capture or choose an image, complete the on-device analysis, save the scan, and create or edit a Field Report Draft.
5. **Local persistence:** confirm the draft remains present and editable while offline and is not shown as remotely synchronized.
6. **Finalize and synchronize:** restore API reachability, complete the required report fields and location, finalize the report, and use the normal sync action or resume path until its state becomes synced.
7. **Web review:** refresh the Web queue, open the uploaded report, and confirm the report image and AI evidence are present without describing the AI output as a diagnosis.
8. **Mobile status return:** save a reviewer status update in Web, refresh the report status in Mobile, and confirm the authority-review status returns to the device.

A successful checklist proves the local path `Mobile -> API -> Web -> API -> Mobile` rather than only proving that the two development servers start.

## Validation and optional acceptance testing

### Fast repository checks

Run Mobile checks from `<WORKSPACE>/caneguard-mobile`:

```bash
cd "<WORKSPACE>/caneguard-mobile"
npm run lint
npm run typecheck
npm test
npm run db:check
```

Useful focused Mobile checks are:

```bash
cd "<WORKSPACE>/caneguard-mobile"
npm test -- --runInBand src/features/sync/services/__tests__/syncPendingFieldReports.test.ts
npm test -- --runInBand src/features/sync/mappers/__tests__/reportMultipartMapper.contract.test.ts
```

Run Web checks from `<WORKSPACE>/caneguard-web`:

```bash
cd "<WORKSPACE>/caneguard-web"
npm run check:web
npm run check:api
npm run check:all
```

The Web repository's MySQL schema and release-flow checks require the migrated `caneguard_test` database:

```bash
cd "<WORKSPACE>/caneguard-web"
npm run api:test:mysql
```

The cross-repository contract checks are optional compatibility gates, not a substitute for the full smoke checklist:

```bash
cd "<WORKSPACE>/caneguard-web"
npm run contract:producer
npm run contract:gate
```

Run them only when the Web/API gate configuration points at the intended Mobile producer revision.

### Optional Maestro and P0F testing

Maestro is not required for normal onboarding.
Before running it, use a fresh compatible development build, a running Metro session, a reachable API, a connected Android device or emulator, and an authenticated field-reporter session.

Run the read-only prerequisite check from the Mobile repository root:

```bash
cd "<WORKSPACE>/caneguard-mobile"
npm run e2e:doctor
```

Run the checked-in flows only after the doctor and runtime prerequisites pass:

```bash
cd "<WORKSPACE>/caneguard-mobile"
npm run e2e
npm run e2e:flow -- .maestro/p0/00-baseline-scan.yaml
```

If the Maestro helper apps need a deliberate version refresh, the checked-in reinstall escape hatch is:

```bash
npm run e2e:flow:reinstall -- .maestro/p0/00-baseline-scan.yaml
```

P0F is a separate full-system release acceptance flow for Mobile, API, Web review, and Mobile status return.
It is not part of daily startup or the fast onboarding path.
Use the [P0-08 acceptance record](docs/features/caneGuard-p0-implementation-phases/P0-08-End-to-End-Acceptance-and-Evidence.md), the [Maestro workspace guide](.maestro/README.md), and the Web/API repository's contract documentation for that work.

## Troubleshooting

### Wireless ADB

If `adb devices -l` does not show the target as `device`, repair Android Wireless debugging, pair again with the current pairing port, and reconnect with the current connection port.
If `adb reverse --list` does not show `tcp:8000 tcp:8000`, rerun `adb reverse tcp:8000 tcp:8000` while the target is connected.
Keep Wi-Fi on during wireless ADB or Maestro control.

The checked-in [Maestro README](.maestro/README.md) documents the WSL2-native Android and Maestro workflow, including the repository's `8081` and `8000` reverse mappings.
That guide also describes a WSL2-specific `./.akidev/bin/adb` wrapper, while the current project scripts expect `adb` and `maestro` on the active `PATH`.
Use the commands available on your active `PATH` for the project scripts.

### Metro or development-client compatibility

Run `npm run start -- --dev-client` from the Mobile root, reverse port `8081` for a host-local Android workflow, and connect the installed development build to that Metro session.
Restart Metro after every Mobile `.env` change.
If native dependencies, Expo plugins, or native app configuration changed, rebuild and reinstall the development APK before interpreting device or Maestro failures.
A JavaScript-only change can reuse an existing compatible native build.

### API reachability

If the host health check fails, fix MySQL or the Laravel API before debugging Android.
If the host health check passes but Mobile reports the server as unavailable, confirm `EXPO_PUBLIC_API_BASE_URL`, confirm `adb reverse tcp:8000 tcp:8000`, and restart Metro after changing the environment.
If the phone remains controllable through wireless ADB while API requests fail, leave Wi-Fi on and diagnose the API mapping or Laravel process separately.

### Seed or database setup

If `php api/artisan db:seed` reports missing demo passwords, set all three `CANEGUARD_*_PASSWORD` values in the uncommitted `api/.env` and rerun the seed command.
If migrations fail, confirm the MySQL service, database names, `caneguard_app` grants, `DB_*` values, and `utf8mb4_unicode_ci` configuration before rerunning `php api/artisan migrate`.

## Authoritative references

- [Web/API full README](https://github.com/niks0501/caneguard-web/blob/main/README.md) for the companion installation, Laravel setup, database procedure, API startup, and Web/API validation.
- [Web/API physical Android connectivity guide](https://github.com/niks0501/caneguard-web/blob/main/docs/development/physical-android-api.md) for the loopback API and ADB reverse path.
- [Mobile Maestro workspace guide](.maestro/README.md) for WSL2 wireless debugging, flow behavior, and evidence handling.
- [Mobile project context](PROJECT_CONTEXT.md) for architecture and external contracts.
- [Mobile project stack](PROJECT_STACK.md) for native-runtime compatibility and verification rules.
- [Mobile upload contract mirror](references/mobile-report-upload-v1.json) for the concise machine-readable producer boundary.
- [P0-07 synchronization design](docs/features/caneGuard-p0-implementation-phases/P0-07-Field-Report-Synchronization-and-API.md) for advanced sync and API details.
