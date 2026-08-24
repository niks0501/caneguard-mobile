# CaneGuard Mobile

CaneGuard Mobile is an Android-first Expo and React Native field application for collecting sugarcane observations and producing on-device AI-assisted disease classification.

Field reporters can capture or choose an image, assess image quality, run the bundled TensorFlow Lite model, review the result and symptom checklist, save the completed scan offline, author a Field Report, and synchronize finalized reports when the API is reachable.

AI output is decision support only.
The app must not present a possible disease result as a confirmed diagnosis or as expert validation.

## What the app does

The primary user flow is:

```text
camera or gallery
  -> image selection and format validation
  -> image-quality assessment
  -> 224 x 224 RGB preprocessing
  -> bundled TensorFlow Lite inference
  -> result and confidence review
  -> symptom checklist and severity
  -> offline Scan Record
  -> Field Report Draft
  -> location and required field completion
  -> local finalization
  -> authenticated multipart synchronization
```

A Scan Record owns the captured image and the AI evidence.
A Field Report is a separate record that references one Scan Record and owns authoring, finalization, submitter, location, upload, and authority-review state.

The app supports the model classes `healthy`, `mosaic`, and `rust` only.
The bundled model contract is version `v0.1-baseline` and is defined in [`src/features/detection/constants/modelContract.ts`](src/features/detection/constants/modelContract.ts).

## Requirements

- Node.js and npm suitable for the versions pinned in `package-lock.json`.
- An Android development device or emulator for the primary native workflow.
- A compatible Expo development build for the full app because `react-native-fast-tflite` and `react-native-nitro-modules` are native dependencies.
- Access to a CaneGuard API environment for authentication and report synchronization.

Expo Go is not sufficient for the TFLite runtime.
A development build is also the authoritative runtime for camera, filesystem, SQLite, and synchronization checks on Android.

## Setup

Install the locked dependencies:

```bash
npm ci
```

Create the local API configuration:

```bash
cp .env.example .env
```

Set `EXPO_PUBLIC_API_BASE_URL` in `.env` to the CaneGuard API base URL.
Development builds may use `http://` for a local API.
Non-development builds require `https://`.
The URL must not contain credentials, and `EXPO_PUBLIC_*` values are not a place for tokens or other secrets.

Start Metro for a development client:

```bash
npm run start -- --dev-client
```

If the development client is not installed yet, create an internal Android development APK with the existing EAS profile and install it on the device:

```bash
eas build --platform android --profile development
adb install path/to/build.apk
```

The development profile is defined in [`eas.json`](eas.json).
Do not use an EAS build or submission as an automatic part of normal local validation.

Restart Metro after changing `.env` because Expo public environment variables are inlined into the JavaScript bundle.

## Architecture

The root composition and protected route boundaries are defined in [`src/app/_layout.tsx`](src/app/_layout.tsx).
The providers are composed in this order:

1. `ThemePreferenceProvider` manages the persisted light or dark preference.
2. `AuthProvider` restores the SecureStore-backed bearer session.
3. `CaneGuardDatabaseProvider` owns the Expo SQLite and Drizzle database.
4. `ScanSessionProvider` owns the active scan flow.
5. `CaneGuardModelProvider` loads the bundled TFLite model on native platforms.
6. `SyncProvider` observes connectivity and application lifecycle events and coordinates report synchronization.

Expo Router protects unauthenticated routes from authenticated application routes.
Development-only model and storage diagnostics are available only in development builds.

The main source boundaries are:

| Area | Responsibility |
| --- | --- |
| `src/app/` | Expo Router screens and screen-level orchestration. |
| `src/features/auth/` | Login, session restoration, SecureStore token persistence, and role checks. |
| `src/features/detection/` | Image acquisition, quality assessment, preprocessing, TFLite inference, and result validation. |
| `src/database/` | Expo SQLite initialization, Drizzle schema, migrations, and database providers. |
| `src/features/records/` | Scan Record persistence, managed image storage, record queries, and deletion. |
| `src/features/reports/` | Field Report Drafts, finalization validation, coordinates, reference data, authority-review cache, and report views. |
| `src/features/sync/` | Upload contract constants, multipart mapping, upload API calls, queue draining, retry classification, and sync state. |
| `src/features/shared/api/` | The shared authenticated HTTP client and API configuration boundary. |

The normal data flow is:

```text
ScanSessionProvider
  -> saveCompletedScan()
  -> managed scan image + SQLite Scan Record transaction
  -> Field Report Draft
  -> GPS or online manual-map location
  -> finalization gate
  -> Field Report pending upload
  -> SyncProvider
  -> mobile report multipart API
```

## Offline-first reporting

Completed scans are saved locally before any upload is attempted.
The source image is copied into the app-managed document directory, and the Scan Record plus related class scores, symptoms, quality warnings, timings, and model metadata are persisted transactionally in SQLite.

A Field Report Draft may remain incomplete and local-only while the device is offline.
The Draft stays editable until the strict finalization gate has all required scan evidence, source dimensions, AI result data, required report fields, and final coordinates.

GPS coordinates are captured in the foreground when available.
The manual map fallback is online-only and records `manual_map` provenance without inventing GPS accuracy.

Successful local finalization makes the same Field Report identity non-editable and changes it to `finalized` and `pending`.
An incomplete report remains a Draft with actionable missing requirements.

A Field Report references its Scan Record rather than copying or replacing the AI evidence.
The Scan Record remains the read-only source of the model result and image evidence used to build an upload.

## Synchronization

Synchronization is authenticated and only accepts a signed-in `field_reporter` session.
The current API endpoints are:

- `POST /api/v1/mobile/auth/login`
- `GET /api/v1/mobile/auth/me`
- `DELETE /api/v1/mobile/auth/logout`
- `POST /api/v1/mobile/reports`

Eligible finalized Field Reports can synchronize after save, at startup, when the app resumes, when connectivity is restored, or through the manual sync action.
Drafts, local-only Field Reports, and Scan Records without a finalized Field Report are not uploaded.

Each Field Report has an explicit retryable state machine:

```text
local_only -> pending -> syncing -> synced
                              \-> failed
```

The Field Report UUID is the stable `client_uuid` for retries and manual Retry.
A successful upload stores the remote UUID and synchronization time locally.
A failed upload preserves the local report and its image for recovery.

Only one foreground run is active for a submitter and database at a time.
Automatic runs stop on authentication failures and exhausted transient failures so `SyncProvider` can recover the session or schedule a later retry.
Manual runs may use the existing immediate retry behavior.

Automatic synchronization requests the default batch size of 10 and drains multiple batches up to the existing safety maximum of 50 reports per run.
The 50-report maximum is an abuse and lifecycle safety boundary, not a server contract limit, and must not be raised or removed as part of ordinary synchronization changes.

The executable regression evidence for this behavior is in [`syncPendingFieldReports.test.ts`](src/features/sync/services/__tests__/syncPendingFieldReports.test.ts).
It proves that an automatic run processes five batches of ten, synchronizes exactly 50 reports, and does not request a sixth batch.

## Upload contract and image lifecycle

`mobile-report-upload-v1` is the canonical mobile report wire contract owned by the CaneGuard web/API repository.
This repository keeps the mirrored artifact at [`references/mobile-report-upload-v1.json`](references/mobile-report-upload-v1.json) and validates the producer boundary in [`reportMultipartMapper.contract.test.ts`](src/features/sync/mappers/__tests__/reportMultipartMapper.contract.test.ts).
The API upload endpoint is `POST /api/v1/mobile/reports` with `multipart/form-data`.

The producer relationship is intentionally a subset relationship:

```text
mobile producer domain ⊆ mobile-report-upload-v1 ⊆ Laravel accepted domain
```

The mobile producer must not emit fields, values, image formats, or ranges outside the canonical v1 artifact.
The API consumer may accept a wider safe domain, but the producer must remain inside the accepted API domain.

### Three image roles

The **source scan image** is the original camera or gallery selection.
It is copied into CaneGuard-managed storage and retained as the Scan Record evidence.
Its source dimensions, source type, and original bytes are preserved for review and future preparation.

The **inference image** is the temporary 224 x 224 JPEG and decoded RGB tensor produced from the source for the bundled TFLite model.
It exists to satisfy the model input contract and quality checks.
It is not the persisted upload artifact and is not a second diagnosis source.

The **submission image** is the persisted, upload-ready artifact used for the multipart `image` field.
It may reuse the managed source when the source already satisfies the v1 image boundary, or it may be a separate deterministic JPEG derivative at `<record-id>.submission.jpg`.
Retries reuse a valid persisted derivative instead of recompressing it.

Derivative preparation never overwrites the preserved source scan image.
A failed repair keeps the source and any previously valid submission derivative recoverable.

### Image boundary

The API hard limit is 10 MiB, or 10,485,760 bytes.
Generated mobile JPEG submission derivatives target 9 MiB or less, or 9,437,184 bytes, to leave headroom below the API hard limit.

The v1 image domain accepts JPEG, PNG, and WebP.
The picker rejects new unsupported formats instead of creating new local records that the upload contract cannot represent.

Older local records may still contain a legacy unsupported source such as HEIC, HEIF, AVIF, or GIF.
When a recognized legacy record needs synchronization, mobile preserves the source and attempts a recoverable JPEG submission derivative.
An unknown or unrecognized legacy format fails with an actionable preparation error rather than being silently grandfathered.

A supported source that is within the 10 MiB hard limit can be reused as the submission image.
An oversized source or a legacy unsupported source is reduced through bounded JPEG derivative attempts until it is at or below the 9 MiB target.
If no bounded derivative can be produced, the report remains local and retryable with the preparation failure visible to the user.

The contract mapper validates the persisted submission URI, MIME type, byte size, file existence, source dimensions, model fields, disease class values, checklist values, location provenance, and report fields before an HTTP request is made.
The server derives upload MIME type and byte size from the received file.

## Compatibility checks and P0F

Run the local producer contract test when changing upload fields or image handling:

```bash
npm test -- --runInBand src/features/sync/mappers/__tests__/reportMultipartMapper.contract.test.ts
```

The web/API repository provides the fast cross-repository compatibility gate.
From a checkout of `niks0501/caneguard-web`, its focused producer check is:

```bash
npm run contract:producer
```

The complete gate is:

```bash
npm run contract:gate
```

The gate checks the web-owned artifact, repository pin configuration, the selected mobile producer revision, and the Laravel consumer boundary.
It proves the subset relationship without requiring a device or a full-system flow.
Use the reviewed exact mobile commit when the web repository updates its producer pin.

The fast gate supplements rather than replaces P0F.
P0F is the separate full-system release proof for Mobile -> API -> Web -> API -> Mobile behavior, including the real authenticated synchronization and review path.
A passing contract gate does not prove camera behavior, native model execution, offline persistence, map interaction, or end-to-end remote identity handling.

## Model and review semantics

The bundled model is a TFLite artifact with these fixed v0.1 inputs and outputs:

- Input tensor: float32 `[1, 224, 224, 3]` in RGB and NHWC layout.
- Preprocessing: resize to the model dimensions, decode to RGB, and preserve the model's configured value range.
- Output tensor: three probabilities for `healthy`, `mosaic`, and `rust`.
- Model artifact: `assets/models/caneguard_leaf_v0_1_baseline.tflite`.

Model preprocessing, inference, disease classes, confidence, class scores, symptom checklist, severity, and report-review semantics are compatibility-sensitive behavior.
This documentation change does not alter them.

Authority review is separate from delivery status.
The app can display cached authority statuses such as `Awaiting authority review`, `Field validation needed`, `Verified by staff`, `Unable to verify`, or `Resolved` without converting an AI result into a confirmed diagnosis.
Unknown server statuses remain a neutral `Status update unavailable` presentation.

## Tests and validation

Run the focused synchronization regression test:

```bash
npm test -- --runInBand src/features/sync/services/__tests__/syncPendingFieldReports.test.ts
```

Run the full repository checks:

```bash
npm run lint
npm run typecheck
npm test
npm run db:check
```

Run the optional coverage report:

```bash
npm run test:coverage
```

Run the mobile E2E prerequisite check before using Maestro:

```bash
npm run e2e:doctor
```

When a fresh compatible development build, Metro session, API environment, and Android device or emulator are available, run the project Maestro flows with:

```bash
npm run e2e
```

A focused Maestro flow can be run with:

```bash
npm run e2e:flow -- .maestro/p0/07-field-report-sync-and-restart.yaml
```

Native runtime checks are required for TFLite execution, camera and gallery acquisition, managed filesystem persistence, SQLite migrations, offline transitions, and real authenticated synchronization.
Unit tests remain the authoritative fast check for domain, mapper, queue, storage, and UI logic.
Do not interpret a Maestro result from a stale development build as application evidence.

## Repository references

- [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) records the current architecture and external contracts.
- [`PROJECT_STACK.md`](PROJECT_STACK.md) records the Expo and React Native stack conventions.
- [`src/features/sync/constants/mobileReportUploadContract.ts`](src/features/sync/constants/mobileReportUploadContract.ts) mirrors the v1 image boundaries.
- [`src/features/records/services/submissionImageStorage.ts`](src/features/records/services/submissionImageStorage.ts) owns derivative preparation and legacy repair.
- [`src/features/reports/domain/fieldReportValidation.ts`](src/features/reports/domain/fieldReportValidation.ts) owns local finalization requirements.
- [`src/features/sync/services/syncPendingFieldReports.ts`](src/features/sync/services/syncPendingFieldReports.ts) owns batching and the 50-report safety maximum.
- [`docs/features/caneGuard-p0-implementation-phases/P0-07-Field-Report-Synchronization-and-API.md`](docs/features/caneGuard-p0-implementation-phases/P0-07-Field-Report-Synchronization-and-API.md) records the synchronization design history.
