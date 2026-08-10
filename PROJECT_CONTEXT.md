# Project Context

Facts specific to CaneGuard Mobile. Keep this file concise and update it when the application contract changes.

## Purpose

CaneGuard Mobile is an Android-first React Native field application for collecting sugarcane observations and providing on-device AI-assisted disease classification.

The app lets authenticated field reporters:

- capture or select a sugarcane image;
- assess basic image quality;
- run the bundled TFLite model on-device;
- review the predicted class, confidence, symptom checklist, and severity;
- save completed scan records locally for offline use;
- review local records and report summaries; and
- synchronize eligible reports and their images to the CaneGuard web/backend API.

AI results are decision-support outputs only. User-facing copy must not present them as confirmed diagnoses or expert validation.

## Stack

- Application/framework: Expo SDK 57 with Expo Router
- Language/runtime: TypeScript 6, React 19, React Native 0.86
- Frontend: React Native + Expo Router; project design tokens in `src/constants/theme.ts`
- Backend: External CaneGuard HTTP API; the mobile repository does not contain the backend server
- Database: Expo SQLite with Drizzle ORM; managed scan images are stored in app-controlled filesystem storage
- External services: CaneGuard API via `EXPO_PUBLIC_API_BASE_URL`; Expo EAS Build/Update
- Deployment target: Android-first mobile app; EAS development/preview APKs and production EAS builds. iOS and static web configuration also exist but are not the primary verified target.

## Architecture

### Application shell

`src/app/_layout.tsx` is the root composition point. Provider order is:

1. `ThemePreferenceProvider`
2. `AuthProvider`
3. `CaneGuardDatabaseProvider`
4. `ScanSessionProvider`
5. `CaneGuardModelProvider`
6. `SyncProvider`

Expo Router protected routes separate unauthenticated screens from authenticated application screens. Development-only routes expose model and storage diagnostics.

### Detection flow

Primary flow:

```text
camera/gallery
  -> image selection
  -> image-quality assessment
  -> preprocessing
  -> bundled TFLite inference
  -> model postprocessing
  -> symptom checklist / consistency check
  -> analysis result
```

Detection code lives under `src/features/detection/`.

The current bundled model contract is defined in `src/features/detection/constants/modelContract.ts` and is the source of truth for model version, filename, SHA-256, labels, input tensor, and output tensor.

### Local persistence

Completed scans are saved offline-first.

```text
completed scan
  -> validate domain state
  -> copy image into CaneGuard-managed storage
  -> transactionally persist record + related rows in SQLite
  -> expose through records/reports
```

Database code lives under `src/database/`. Record persistence and querying live under `src/features/records/`.

Persistent records include prediction data, class scores, symptoms, quality warnings, severity, barangay, model metadata, timings, managed-image metadata, and synchronization state.

### Field Report authoring

A completed Scan Record may own zero or one separate Field Report. Field Reports
can persist as incomplete local-only Drafts, resolve final coordinates through
foreground GPS or an online-only manual-map fallback when GPS is not resolved,
and finalize only after the strict submission gate validates the referenced scan
evidence and required report fields. Manual-map coordinates retain
`manual_map` provenance and never receive fabricated GPS accuracy; earlier
GPS-attempt evidence remains separate.

Until all requirements pass, an incomplete submission remains an editable Draft
and returns actionable missing requirements. Successful local finalization makes
the report non-editable, preserves the observation timestamp, creates the
submission timestamp, and transitions the same Field Report identity to
`finalized` / `pending`.

Field Report is the authoritative synchronization owner; the referenced Scan
Record remains the read-only source of AI and image evidence used to build the
upload. Draft authoring, finalization, retry, and synchronization remain scoped
to the authenticated submitter that created the Field Report.

Scans queued by earlier app versions are not uploaded until a signed-in reporter
completes the new required Field Report fields. That upgrade reuses the Scan
Record UUID as the Field Report client UUID for server idempotency. Legacy scans
already marked synchronized retain their remote identity and cannot be submitted
again.

### Authentication

Authentication lives under `src/features/auth/`.

The mobile client authenticates against the CaneGuard API. Only users returned with the `field_reporter` role are accepted for mobile synchronization.

The bearer session is stored with Expo SecureStore and restored when the application starts.

### Synchronization

Synchronization lives under `src/features/sync/`.

Eligible finalized Field Reports are uploaded to the backend as multipart
reports. Drafts and Scan Records without a finalized Field Report are excluded.
Sync may be triggered:

- after save;
- at startup;
- when the app resumes;
- when network connectivity is restored; or
- manually.

Only one pending-report synchronization batch should run at a time. Field
Reports retain explicit sync states:

`local_only` -> `pending` -> `syncing` -> `synced` or `failed`.

Synchronization must preserve the local record even when remote upload fails.
The Field Report ID is the stable `client_uuid` across automatic retries and
manual Retry. The API request joins the referenced Scan Record evidence without
copying or deleting it, derives submitter authority from the bearer session,
and stores the returned remote UUID and successful sync time on Field Report.

## Important conventions

- TypeScript strict mode is enabled.
- Use the existing `@/* -> src/*` and `@/assets/* -> assets/*` import aliases.
- Keep Expo Router route structure and protected authentication boundaries intact.
- Use feature boundaries under `src/features/` instead of placing domain logic directly in screens.
- Use `src/constants/theme.ts` tokens before introducing new colors, spacing, radius, typography, or shadows.
- Persistent scan images must be copied into CaneGuard-managed storage; do not persist temporary camera/gallery URIs as durable records.
- Database writes involving a scan and its related rows must preserve transactional behavior and existing constraints.
- Preserve the explicit synchronization state machine and error handling instead of treating sync as a fire-and-forget request.
- Preserve model-contract validation. A model artifact change requires corresponding contract/test updates.
- UI wording must describe results as AI-assisted/possible disease results, not confirmed diagnoses.
- Prefer existing repository/service/provider abstractions before adding new global state or direct database/API access from screens.
- Keep user-visible network, storage, model, and permission failures recoverable and actionable.

## Security and data sensitivity

- Authentication uses bearer tokens from the CaneGuard backend.
- Mobile sessions are persisted with Expo SecureStore using device-only keychain accessibility after first unlock.
- Only backend users with role `field_reporter` are accepted by the mobile client.
- `EXPO_PUBLIC_API_BASE_URL` is configuration, not a secret. Never place API credentials or tokens in public Expo environment variables.
- Production API configuration must use HTTPS; plain HTTP is accepted only in development.
- API base URLs must not embed usernames or passwords.
- Report images, user identity/email, barangay, scan observations, model outputs, and synchronization metadata should be treated as application data that must not be logged or exposed unnecessarily.
- The device filesystem/SQLite database is a trust boundary because reports may exist locally before synchronization.
- Deletion of managed images must remain restricted to the application-managed scan-image location.
- Never hardcode bearer tokens or commit `.env` secrets.

## External contracts

### CaneGuard API

Base URL:

`EXPO_PUBLIC_API_BASE_URL`

Current mobile endpoints:

- `POST /api/v1/mobile/auth/login`
- `GET /api/v1/mobile/auth/me`
- `DELETE /api/v1/mobile/auth/logout`
- `POST /api/v1/mobile/reports`

Authentication expects bearer tokens.

The mobile report endpoint accepts multipart form data including the stable
Field Report client UUID, referenced Scan Record UUID/evidence, required P0
report context, final coordinates and provenance, observation/submission times,
model evidence, and managed image. Manual-map uploads omit GPS accuracy. The
authenticated submitter is derived from the bearer session rather than trusted
from client-claimed identity/role fields.

A successful report upload must return a remote identity UUID.

### Model contract

Current bundled model:

- Version: `v0.1-baseline`
- File: `assets/models/caneguard_leaf_v0_1_baseline.tflite`
- Labels: `healthy`, `mosaic`, `rust`
- Input: float32 `[1, 224, 224, 3]`, RGB/NHWC
- Output: float32 probabilities for the three supported labels

Treat `modelContract.ts`, the bundled artifact, labels, parity fixtures, preprocessing, and model tests as one compatibility surface.

### Local database

Drizzle migrations and `src/database/schema.ts` are persistent-data contracts. Existing records must remain readable across application updates.

The synchronization status values are:

- `local_only`
- `pending`
- `syncing`
- `synced`
- `failed`

## Verification

Run project-defined checks first:

```bash
npm run lint
npm run typecheck
npm test
npm run db:check
```

For broader automated verification:

```bash
npm run test:coverage
```

For changes to detection/model behavior, run the relevant Jest suites under:

- `src/features/detection/**/__tests__/`
- `src/app/__tests__/model-smoke-test.test.tsx`
- scan/image-preview/analysis-result tests

For database/records/sync changes, run the relevant suites under:

- `src/database/__tests__/`
- `src/features/records/**/__tests__/`
- `src/features/sync/**/__tests__/`
- `src/features/auth/**/__tests__/`

Physical-device verification is required for native-runtime behavior such as TFLite execution, development-build compatibility, camera/gallery flows, filesystem persistence, SQLite migration/persistence, and end-to-end synchronization.

If Maestro is used, verify that the installed development build matches the current native dependency/configuration state before interpreting a Maestro failure.

Do not run EAS build or submit automatically.

## Constraints

- The project is Android-first and should remain cross-platform where practical.
- `react-native-fast-tflite` and Nitro modules require a compatible native development build; Expo Go is not sufficient for the full model runtime.
- After changes to native dependencies, Expo plugins, native configuration, or other development-build inputs, rebuild the development client before device/Maestro verification.
- JS/TS-only changes may use the existing development build when its native runtime is still compatible.
- Core scan, records, and report viewing behavior must remain useful offline.
- Synchronization must tolerate unavailable networks and preserve retryable local state.
- Backend synchronization requires a valid `field_reporter` session and a complete local report, including barangay, final coordinates, location source, and managed image.
- The bundled AI model is decision support, not a diagnostic authority.
- Current model labels are limited to `healthy`, `mosaic`, and `rust`; do not imply that the model detects additional diseases unless the model contract is intentionally upgraded.
- The P0 manual-map fallback is online-only. It loads only visible OpenStreetMap tiles with attribution and normal HTTP caching; it does not prefetch or expose offline map downloads.
- Preserve compatibility with existing SQLite data and generated Drizzle migrations.
- Avoid unnecessary native dependencies when Expo-supported APIs already satisfy the requirement.

## Current priorities

1. Harden end-to-end mobile authentication and authenticated report synchronization with the CaneGuard backend.
2. Preserve reliable offline-first report storage and retryable synchronization across startup, resume, network restoration, and manual sync.
3. Verify multipart report compatibility and remote identity handling against the web/backend API.
4. Continue physical Android-device validation of the TFLite runtime, SQLite persistence/migrations, managed image storage, and synchronization behavior.
5. Keep model-result and reporting UX clear that outputs are AI-assisted decision support.

## Known debt or limitations

- The current model supports only three output classes: `healthy`, `mosaic`, and `rust`.
- Native TFLite behavior cannot be fully validated by unit tests or Expo Go; a compatible development build and physical-device testing remain necessary.
- iOS and static-web configurations exist, but the repository evidence is primarily Android-focused.
- Mobile/backend synchronization is tightly coupled to the current multipart field names and response identity shape; backend contract changes require coordinated mobile updates.
- Local report summaries represent AI-supported observations, not confirmed disease incidence.
