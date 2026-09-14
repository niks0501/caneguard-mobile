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
- **Local Metro:** the Expo development server uses the repository's normal port, with `8081` reverse-mapped through the Windows-hosted ADB server for the Android Studio emulator workflow.

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
- PHP satisfying the Web/API `api/composer.json`'s `^8.3` constraint, Composer, and PDO MySQL.
- Composer.
- MySQL 8.4 LTS.
- Android Studio with an Android emulator.
- Android Platform Tools with `adb` available on `PATH`.
- The EAS CLI when creating the Android development APK.
- A browser and `curl` for the local Web/API smoke checks.

The Mobile app requires a compatible native development build because `react-native-fast-tflite` and `react-native-nitro-modules` are native dependencies.
Expo Go is not sufficient for the complete Android workflow.

Device automation, UI verification, and E2E flow testing use the Agent Device CLI.
The `agent-device` command and Node.js 22.12+ must be available on the `PATH`; `adb` is listed above.
Run `npm run e2e:doctor` to check local device and toolchain readiness.

A MapTiler browser key is optional for the Web map.
The Web dashboard keeps its report-table fallback visible when `VITE_MAPTILER_KEY` is blank.

For the Mobile GPS path, grant CaneGuard foreground location permission and enable location services on the Android emulator or device.
If GPS is unavailable, permission is denied, or location services are off, the manual-map fallback requires an active internet connection and loaded online map tiles served through the configured CaneGuard HTTPS tile proxy (`EXPO_PUBLIC_MAP_TILE_PROXY_URL`); without that proxy the map shows an unavailable state and makes no third-party tile requests.
It is not available offline, and the Draft remains unchanged until a final location is selected.

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
npm ci
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

Current main's Mobile onboarding supports sign-in with the seeded `field@caneguard.test` account.
Registration, password recovery, biometric login, and authentication deep-link setup are not available in this onboarding path.

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
The CLI must satisfy the `eas.json` requirement of `>= 21.2.0`, and the Expo account must have access to the `caneguard/caneguard-mobile` project.

Before the first build, install and authenticate the EAS CLI from the Mobile repository root:

```bash
cd "<WORKSPACE>/caneguard-mobile"
npm install --global eas-cli
eas login
eas whoami
eas project:info
```

`eas whoami` confirms the authenticated account, and `eas project:info` confirms access to the existing Expo project.

Create the APK only once for initial setup or again after a native dependency, Expo plugin, or native app configuration change.
Start the Android Studio emulator and follow the Android connectivity steps below before running `adb install`.

```bash
cd "<WORKSPACE>/caneguard-mobile"
eas build --platform android --profile development --local
adb install <APK_PATH>
```

`<APK_PATH>` is the path to the APK reported by the completed local build.
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
The Android Studio emulator reaches that service through the Windows-hosted ADB server without committing a developer-specific LAN address or exposing the API to the network.

### Android Studio emulator

Start the Android Studio emulator from the Windows host.
From WSL2, use the official `adb` command on the active `PATH`, which connects to the Windows-hosted ADB server.
Begin with `adb devices -l` and confirm the current emulator is ready before setting up the reverse mappings:

```bash
adb devices -l
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8000 tcp:8000
adb reverse --list
```

The connected emulator should appear in the `adb devices -l` output with state `device`.
Do not assume a fixed emulator serial; if more than one target is listed, pass the intended serial with `adb -s <DEVICE_ID>` to each ADB command.
The reverse list should include the `8081` Metro mapping and the `8000` API mapping.
With these mappings, keep `EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000` in the Mobile `.env`.

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

4. Optional live Web updates: start the Web queue worker and Reverb process only when testing reviewer freshness signals.
   Use one additional terminal for each process:

   ```bash
   cd "<WORKSPACE>/caneguard-web"
   npm run api:queue
   ```

   ```bash
   cd "<WORKSPACE>/caneguard-web"
   npm run api:reverb
   ```

   The queue worker processes database-backed broadcast jobs, and Reverb serves the WebSocket on port `8080`.
   These processes are not required for Mobile uploads or normal REST-backed Web data; REST remains the source of truth if either is unavailable.

5. Start the Web dashboard in another terminal.

   ```bash
   cd "<WORKSPACE>/caneguard-web"
   npm run dev
   ```

   Open `http://localhost:5173`.

6. Start the Android Studio emulator and establish the `8081` and `8000` reverse mappings shown above.
7. Start Metro from the Mobile repository root.

   ```bash
   cd "<WORKSPACE>/caneguard-mobile"
   npm run start -- --dev-client
   ```

8. Open the already installed `caneguard-mobile` development build on the Android Studio emulator and connect it to the running Metro server.

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

### Device testing and P0F acceptance

Agent Device testing is not required for normal onboarding.
Before running flows, use a fresh compatible development build, a running Metro session, a reachable API, a connected Android Studio emulator, and an authenticated field-reporter session.
Stage the shared scan fixture and location permissions with the pre-flow environment helper when a flow needs them:

```bash
cd "<WORKSPACE>/caneguard-mobile"
npm run e2e:env
```

Run the read-only prerequisite check from the Mobile repository root:

```bash
cd "<WORKSPACE>/caneguard-mobile"
npm run e2e:doctor
```

Run the checked-in flows only after the doctor and runtime prerequisites pass.
For newly implemented or changed behavior, follow the [Agent Device workspace guide](.agent-device/README.md) and complete Mode A interactive verification before creating or updating a durable `.ad` flow. After the path succeeds, replay the smallest justified flow once for deterministic coverage.
For an existing regression or acceptance flow, use focused Mode B replay:

```bash
cd "<WORKSPACE>/caneguard-mobile"
agent-device replay .agent-device/flows/p0/00-baseline-scan.ad
```

The equivalent project action is `npm run e2e:flow -- .agent-device/flows/<flow>.ad`. Preserve the first failure and its evidence; the workspace guide owns the divergence-diagnosis and guarded-resume procedure.
Run broader or full E2E with `npm run e2e` only when the task or an acceptance gate requires it.
Do not add automatic retries, rebuilds, emulator wipes, ADB or Metro recovery, or blind reruns around Agent Device.
A failed replay command proves that the command failed; it does not by itself prove an application defect.

P0F is a separate full-system release acceptance flow for Mobile, API, Web review, and Mobile status return.
It is not part of daily startup or the fast onboarding path.
Use the [P0-08 acceptance record](docs/features/caneGuard-p0-implementation-phases/P0-08-End-to-End-Acceptance-and-Evidence.md), the [Agent Device workspace guide](.agent-device/README.md), and the Web/API repository's contract documentation for that work.

## Troubleshooting

### Android Studio emulator ADB

If `adb devices -l` does not show the Android Studio emulator as `device`, confirm that the emulator is running in Android Studio and that the official `adb` command reaches the Windows-hosted ADB server.
If `adb reverse --list` does not show `tcp:8000 tcp:8000`, rerun `adb reverse tcp:8000 tcp:8000` while the emulator is connected.
The checked-in [Agent Device workspace guide](.agent-device/README.md) documents the Android Studio emulator and Windows-hosted ADB workflow, including the repository's `8081` and `8000` reverse mappings.
Use the commands available on your active `PATH` for the project scripts.

### Metro or development-client compatibility

Run `npm run start -- --dev-client` from the Mobile root, reverse port `8081` for the Android Studio emulator workflow, and connect the installed development build to that Metro session.
Restart Metro after every Mobile `.env` change.
If native dependencies, Expo plugins, or native app configuration changed, rebuild and reinstall the development APK before interpreting device or Agent Device failures.
A JavaScript-only change can reuse an existing compatible native build.

### API reachability

If the host health check fails, fix MySQL or the Laravel API before debugging Android.
If the host health check passes but Mobile reports the server as unavailable, confirm `EXPO_PUBLIC_API_BASE_URL`, confirm `adb reverse tcp:8000 tcp:8000`, and restart Metro after changing the environment.
If the emulator is listed by ADB but API requests fail, leave the Windows-hosted ADB connection in place and diagnose the API mapping or Laravel process separately.

### Seed or database setup

If `php api/artisan db:seed` reports missing demo passwords, set all three `CANEGUARD_*_PASSWORD` values in the uncommitted `api/.env` and rerun the seed command.
If migrations fail, confirm the MySQL service, database names, `caneguard_app` grants, `DB_*` values, and `utf8mb4_unicode_ci` configuration before rerunning `php api/artisan migrate`.

## Authoritative references

- [Web/API full README](https://github.com/niks0501/caneguard-web/blob/main/README.md) for the companion installation, Laravel setup, database procedure, API startup, and Web/API validation.
- [Mobile Agent Device workspace guide](.agent-device/README.md) for the Android Studio emulator, Windows-hosted ADB server, flow behavior, and evidence handling.
- [Mobile project context](PROJECT_CONTEXT.md) for architecture and external contracts.
- [Mobile project stack](PROJECT_STACK.md) for native-runtime compatibility and verification rules.
- [Mobile upload contract mirror](references/mobile-report-upload-v1.json) for the concise machine-readable producer boundary.
- [P0-07 synchronization design](docs/features/caneGuard-p0-implementation-phases/P0-07-Field-Report-Synchronization-and-API.md) for advanced sync and API details.
