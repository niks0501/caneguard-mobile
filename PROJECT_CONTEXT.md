# Project Context

Facts specific to CaneGuard Mobile. Keep this file concise and update it when the application contract changes.

## Purpose

CaneGuard Mobile is an Android-first React Native field application for collecting sugarcane observations and providing on-device AI-assisted disease classification.

The app accepts two account roles. A `field_reporter` (Field Inspector) can:

- capture or select a sugarcane image;
- assess basic image quality;
- run the bundled TFLite model on-device;
- review the predicted class, confidence, and short guided symptom observations; historical severity remains readable in saved records;
- save completed scan records locally for offline use;
- review local records and report summaries; and
- synchronize eligible reports and their images to the CaneGuard web/backend API.

Role alone does not authorize the inspector-only work above: the API must also
return the matching capabilities on `GET /api/v1/mobile/auth/me`. See
[Authentication](#authentication).

A `farmer` can sign in and run the same personal scanning path, keeping
completed scans on the device, but official Field Reports stay inspector-only: a
farmer session cannot open, author, or synchronize one. From a saved personal
scan a farmer can also start a Check Again and save the new check as a follow-up
of the first check; the record screen then lists the plant's checks.

AI results are decision-support outputs only. User-facing copy must not present them as confirmed diagnoses or expert validation.

## Stack

- Application/framework: Expo SDK 58 with Expo Router
- Language/runtime: TypeScript 6, React 19.3, React Native 0.88
- Frontend: React Native + Expo Router; project design tokens in `src/constants/theme.ts`
- Backend: External CaneGuard HTTP API; the mobile repository does not contain the backend server
- Database: Expo SQLite with Drizzle ORM; managed scan images are stored in app-controlled filesystem storage
- External services: CaneGuard API via `EXPO_PUBLIC_API_BASE_URL`; Expo EAS Build/Update
- Deployment target: Android-first mobile app; EAS development/preview APKs and production EAS builds. iOS and single-page web configuration also exist but are not the primary verified target.

## Architecture

### Application shell

`src/app/_layout.tsx` is the root composition point. Provider order is:

1. `ThemePreferenceProvider`
2. `AuthProvider`
3. `LanguagePreferenceProvider`
4. `ToastProvider`
5. `CaneGuardDatabaseProvider`
6. `ScanSessionProvider`
7. `CaneGuardModelProvider`
8. `SyncProvider`
9. `OfficeUpdatesProvider`

Expo Router protected routes separate unauthenticated screens from authenticated application screens.
Password recovery and email-verification routes remain public so deep links can be handled even when protected session material exists.
Development-only routes expose model and storage diagnostics.

### Farmer language layer

Farmer-facing copy is bilingual through `FARMER_COPY` in `src/constants/copy.ts`; its `FarmerCopyBlock` type is the single shape both languages must satisfy. `useFarmerCopy()` in `src/providers/LanguagePreferenceProvider.tsx` returns the active block, and the chosen language persists in AsyncStorage under `caneguard.language`.

A `farmer` session reads Tagalog until it chooses English in Settings → **Language / Wika**; any other account reads English whatever preference is saved. The Possible Condition heading on a farmer's saved record is the same `FARMER_COPY` heading the Check Again comparison and check history use, so it follows that language; an inspector's record keeps the English result label. Inspector screens, Field Guide entry text, and model decision-support lines stay English and are not part of `FARMER_COPY`.

### Detection flow

Primary flow:

```text
camera/gallery
  -> image selection
  -> image-quality assessment
  -> preprocessing
  -> bundled TFLite inference
  -> model postprocessing
  -> short guided differential observations / consistency check
  -> analysis result
```

Detection code lives under `src/features/detection/`.

The bundled model contracts are defined in `src/features/detection/constants/modelContract.ts` and are the source of truth for contract id, model version, filename, SHA-256, labels, input tensor, and output tensor.

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

Persistent records include prediction data, class scores, symptoms, quality warnings, severity, barangay, model metadata, timings, managed-image metadata, and synchronization state. A Check Again follow-up also stores `follows_up_scan_id`, the first check it follows, and the farmer's `personal_note`. A farmer's own scan may store an optional `personal_place` typed in their own words; it carries no GPS coordinates, needs no location permission, and is never uploaded.

A follow-up may link only to the first check of the same owner, never to another
follow-up. Deleting the first check clears the link (`ON DELETE SET NULL`) and
keeps the surviving follow-up and its note.

In-progress Scan, Field Report, and Field validation form values are checkpointed in the owner-scoped `local_drafts` table, keyed by owner, draft kind, and draft key. A checkpoint is local draft state, never an upload-queue entry or a submission.

### Field Report authoring

A completed Scan Record may own zero or one separate Field Report. Field Reports
can persist as incomplete local-only Drafts, and every entered field is
checkpointed for its owner while the inspector works. Finalization requires
either foreground-GPS or online-only manual-map coordinates, or a bounded
explicit unavailable-location reason with null coordinates, plus the strict
submission gate over the referenced scan evidence and required report fields;
barangay stays mandatory. Manual-map coordinates retain `manual_map` provenance
and never receive fabricated GPS accuracy; earlier GPS-attempt evidence remains
separate.

Until all requirements pass, an incomplete submission remains an editable Draft
and returns actionable missing requirements. Successful local finalization makes
the report non-editable, preserves the observation timestamp, creates the
submission timestamp, and transitions the same Field Report identity to
`finalized` / `pending`.

Field Report is the authoritative synchronization owner; the referenced Scan
Record remains the read-only source of AI and image evidence used to build the
upload. Draft authoring, finalization, retry, and synchronization remain scoped
to the authenticated submitter that created the Field Report.

Field Report authoring also requires the `field_reporter` role and the
server-granted `report:submit` capability, so a session demoted to `farmer`, or
one whose pilot-district capability was withdrawn, cannot create, edit, or
finalize a draft. Reports already authored stay readable without that
capability.

Scans queued by earlier app versions are not uploaded until a signed-in reporter
completes the new required Field Report fields. That upgrade reuses the Scan
Record UUID as the Field Report client UUID for server idempotency. Legacy scans
already marked synchronized retain their remote identity and cannot be submitted
again.

### Authentication

Authentication lives under `src/features/auth/`.

The mobile client authenticates against the CaneGuard API.
Sign-in accepts the `field_reporter` and `farmer` roles; any other role is
rejected as an unsupported account type. One shared `isMobileUser` guard in
`src/features/auth/types.ts` checks every server-issued user object, requiring a
supported role (`isMobileUserRole`) and a safe owner identity uuid
(`isSafeOwnerIdentity` in `src/database/ownerIdentity.ts`); a restored biometric
session passes the same guard, so a stored session without a safe owner identity
is discarded instead of installed. Only users returned with the `field_reporter`
role are accepted for mobile synchronization.

#### Inspector capabilities

`field_reporter` is the account role, not the authoring grant. The server decides
who may do inspector work by pilot-district membership and reports the result as
a `capabilities` string array on `GET /api/v1/mobile/auth/me`.
`src/features/auth/capabilities.ts` owns the capability constants and the checks
the app gates on:

- `report:submit` — Field Report draft authoring and finalization; boundary
  survey authoring uses the same shared inspector-authoring check.
- `assignment:read` — the downloaded assignment/visit feed.
- `assignment:complete` — opening a validation visit and recording its photo,
  checkpoint, and completion.

Reading work that was already authored is not capability-gated: an inspector who
loses `report:submit` keeps the Field Report projections, authority status, and
pending-report counts for reports they already created, and loses only the
authoring controls.

Only a successful `/me` grants capabilities. Password login, device enrollment,
and a restored biometric session all accept their session through the same `/me`
verification in `AuthProvider`, and a token response never grants any. When
`/me` is unavailable the session is still installed, but with an empty capability
list, and it is re-verified on retry, foreground, or network restore; offline
authoring therefore stays unavailable until that verification succeeds. A
missing, non-array, or partly malformed `capabilities` value grants nothing, and a
session restored from an older app version carries no capabilities until its
next verification.

Mobile bearer sessions receive a finite local safety expiry. When the API returns
`expires_at: null`, the client applies the 30-day `LOCAL_SESSION_MAX_AGE_MS`
policy in `mobileAuthApi.ts`; the server should still issue and enforce an
explicit expiry/revocation policy. The client does not refresh or extend
sessions, including when a protected session is unlocked biometrically.
Sessions remain valid until explicit logout, server-side revocation, or the
local safety expiry. A fresh password login is required after expiry or a
process restart without biometric unlock.

Password sessions remain in memory only, so removing the app from the recent-apps list cannot silently restore an authenticated session.
When biometric unlock is enabled, the client stores the session under a separate
SecureStore key with `requireAuthentication: true`; the platform therefore
binds the protected entry to an authentication-backed key where supported. Only
an enrolled strong biometric is accepted for this credential; a device passcode
is not a fallback. A password login updates the protected session without
disabling the biometric preference.
A non-sensitive login-history marker routes returning users to the password form and is never used as authentication material.
The client persists a random opaque installation UUID in SecureStore for API device identity; it does not use immutable hardware identifiers.
Explicit logout always attempts server revocation and clears the active session,
protected credential, and biometric preference. It does not delete local scan or
report data; Settings provides the owner-scoped **Clear downloaded office data**
and **Remove all local records** actions. See
`docs/security/mobile-security-fixes.md` for their retention contracts. When
biometrics are disabled, or when a session expires, is reset, or is rejected
authoritatively, the client also clears all protected entries.

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

A `farmer` session does not synchronize: it reports no pending count and no
last successful sync time, and its queued Field Reports, field surveys, and
field-validation completions stay on the device. Instead, it reports a yes/no
inspector-work-waiting flag for unsent inspector-authored work held on the
phone, with no count and no record detail.

Only one pending-report synchronization batch should run at a time. Field
Reports retain explicit sync states:

`local_only` -> `pending` -> `syncing` -> `synced` or `failed`.

Synchronization must preserve the local record even when remote upload fails.
The Field Report ID is the stable `client_uuid` across automatic retries and
manual Retry. The API request joins the referenced Scan Record evidence without
copying or deleting it, derives submitter authority from the bearer session,
and stores the returned remote UUID and successful sync time on Field Report.

Assignments, notifications, and authority review status are downloaded through
versioned feeds. Each page carries `sync.before` plus an optional `sync.version`,
`sync.total`, `sync.truncated`, and `sync.unchanged`; a reported total replaces
the fixed page ceiling when the phone decides how many pages to request, and an
answer that confirms the stored version delivers no rows. The last complete
download of each feed is recorded in the owner-scoped `sync_checkpoints` table
(version, total, truncated, page count, `sync.before`, fetch time) in the same
transaction that replaces that feed's cached rows, and both Settings clear
actions delete it with those caches. An authority review status download
interrupted after some pages keeps those pages and the continuation of the next
one in owner-scoped `caneguard.syncDownloadProgress.v1` app storage, so the next
attempt — even in a new process — resumes at the first page it never stored;
finishing the download, or discarding progress that no longer matches its first
page or the server checkpoint, removes that entry. The stored version is sent as
`since` on the next download, except that the assignment download asks for the
whole work set whenever its cache no longer holds every row that download
delivered.
A migration that adds a column the cached snapshot has to carry clears that
feed's stored version instead of leaving it confirming a snapshot written by the
older build, and leaves the cached rows in place until the next full download
replaces them.

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
- Password and protected mobile sessions use Expo SecureStore. `keychainAccessible` is an iOS Keychain control; Android protection for the protected session comes from SecureStore `requireAuthentication`/Keystore binding.
- The mobile client accepts only the account roles listed under
  [Authentication](#authentication); Field Report access stays inspector-only,
  and inspector authoring additionally requires the server-granted capabilities
  described there.
- `EXPO_PUBLIC_API_BASE_URL` is configuration, not a secret. Never place API credentials or tokens in public Expo environment variables.
- `EXPO_PUBLIC_QA_MODE=true` enables the QA-only validation that the API URL uses public HTTPS rather than a loopback host.
- Production and QA API configuration must use HTTPS; plain HTTP is accepted only in development.
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

- `POST /register`
- `POST /email/verification-notification`
- `GET /email/verify/{id}/{hash}`
- `POST /forgot-password`
- `POST /reset-password`
- `POST /api/v1/mobile/auth/login`
- `GET /api/v1/mobile/auth/me`
- `DELETE /api/v1/mobile/auth/logout`
- `POST /api/v1/mobile/auth/enroll`
- `POST /api/v1/auth/password`
- `PATCH /api/v1/auth/email`
- `POST /api/v1/auth/biometric/disable`
- `POST /api/v3/mobile/reports`
- `GET /api/v3/mobile/reports/statuses`
- `GET /api/v1/mobile/assignments`
- `POST /api/v1/mobile/assignments/{assignment}/completion`
- `GET /api/v1/mobile/assignments/{assignment}/report-photo`
- `GET /api/v1/mobile/assignments/{assignment}/previous-evidence-photo`
- `GET /api/v1/mobile/notifications`

Authentication expects bearer tokens.

The mobile report upload endpoint accepts multipart form data including the stable
Field Report client UUID, referenced Scan Record UUID/evidence, the optional
`field_survey_client_uuid` of the boundary survey measured on this phone,
required P0 report context, location evidence, observation time, capture time,
model evidence, and the persisted submission image. Location evidence is final
coordinates with `gps` or `manual_map` provenance, or a bounded
unavailable-location reason and no coordinates. The local submission timestamp
is retained for mobile finalization and synchronization state but is not a
multipart field. Manual-map uploads omit GPS accuracy. The
authenticated submitter is derived from the bearer session rather than trusted
from client-claimed identity/role fields.

The status feed reports each report's owner-scoped review row plus an optional
`advisory` object (`uuid`, `code`, `title`, `content`, `status` of `validated`
or `retired`, and `selected_at`) when the office has selected one. Mobile
validates the advisory when present and treats an absent one as no advisory;
the feed stays the owner of review status and never mutates the report
submission.

The assignment feed is owner-scoped to the authenticated field reporter and returns the current assignment work set through the `sync.before` and `links.next` pagination boundary. The phone sends `supports=no_ai_scan`, the v2 request capability: without it the office withholds every case that has no AI scan, including from `sync.total` and `sync.version`. One download asks for at most the 300-assignment work set; a larger set is reported as truncated instead of being silently cut, and a set that changes mid-download is retried from the full set before the refresh fails. Mobile requests it only when the session carries `assignment:read`.
Mobile caches assignment snapshots separately from locally authored Scan Records and Field Reports so a server assignment can materialize even when the assignee did not submit the case.
The cache keeps each assignment exactly as the server sent it: nothing on the phone rewrites its `field_validation_state`. A visit saved on the phone is layered over that snapshot for display only, so a queued visit reads `Waiting to send` and a delivered one keeps reading completed until the next feed refresh reports it.
Assignment vocabulary is forward-compatible. A record whose `field_validation_state` this build does not know is left out of the snapshot and counted so Activity can say how many assigned cases the app version cannot show yet; an unknown `case.predicted_label` is kept and shown as not recognized by this app version; an unknown `previous_visit.follow_up_outcome` is kept as unknown. Malformed shape or identity still fails the whole refresh and names the offending record by `reference_code`, or by its page index when the record carries none.
An office-born case carries an office projection on the same record: `case.version`, `case.status` (workflow, case, and review status with the office's own `updated_at`), `case.reporter_concern` (suspected condition and observation text), and an optional `case.photo` reference, which the phone caches with the assignment and shows as its own case card. A record without `case.origin`, or with an origin this build does not know, stays a field-born case with no projection read. An office-born case may have no AI scan, so `case.predicted_label` and `case.confidence` can arrive absent or null there: the phone keeps both null, caches that missing prediction rather than a placeholder label or a fake score, and shows no AI section for it — Activity renders no condition pill, the visit history no Possible Condition row — while the office case card still shows the reporter's concern, status, and photo. A field-born case still requires both fields and fails the whole refresh without them. A malformed projection fails the whole refresh by field name. The phone ignores any server-provided photo URL, builds the assignment's guarded route itself, and attaches the session token only when that URL stays on the API origin, showing words instead of an image when the case carries no photo, or when it has no downloaded copy and the load fails or the session holds no token. The same guarded treatment applies to a sent `previous_visit.photo`. After each assignments refresh the phone prefetches those photos (report and fresh previous-visit) into an owner-scoped file cache under the app documents directory at `caneguard/office-media/<owner>/` (`officeMediaCache.ts`): assigned or in-progress office cases due within 7 days or undated, nearest first, whole cases only, at most 10 MiB per file and 150 MiB per owner; files of cases that leave that set are deleted on the next refresh, and both clear actions remove them. A cached name carries the case version or the previous visit's date, so a replaced photo is downloaded again instead of reused. A download lands under a temporary name and is published only when it completed and fits the size limit, so an interrupted download is never read as ready. A case with every photo on disk shows `Ready offline` and renders from disk with no token; otherwise it keeps the online photo or the words fallback.

The notification feed is owner-scoped to the authenticated field reporter and returns a complete durable attention snapshot through the same checkpoint/pagination boundary.
Mobile replaces the local notification snapshot only after all pages validate, so network failures preserve the last-known read state and attention items.
Mobile refreshes this cache on launch, resume, Activity focus, and explicit Activity refresh without opening a Reverb/WebSocket connection.
An office update routes through the office-case projection: a notification opens its cached assignment case, matched by assignment UUID or else by case UUID or reference code on an office-projected assignment, and a field-born case still opens its local Field Report. A case that is not on this phone is never a silent no-op: its attention row, inbox row, and detail screen say `Not on this phone: open on the web`, and opening such an update never consumes it silently.

A successful report upload must return a remote identity UUID.

### Model contract

`modelContract.ts` defines the active Model V2 contract plus the bundled, inactive Model V1 contract. `ACTIVE_MODEL_ID` selects the model the live scan flow loads, so changing that constant is the V1/V2 switch and the rollback path. Model-layer functions also accept an explicit contract.

Active model:

- Version: `v2.0-mobilenetv2`
- File: `assets/models/caneguard_v2.tflite`
- Labels, in fixed output order: `healthy`, `mosaic`, `rust`, `smut`, `rssi`
- Input: float32 `[1, 224, 224, 3]`, RGB/NHWC, aspect-ratio-preserving bilinear letterbox with padding `0`
- Mobile input values remain raw `0..255`; the model internally applies `x / 127.5 - 1.0`
- Output: float32 `[1, 5]` softmax probabilities

The V2 artifact identity is bound to `MODEL_V2_SHA256`, the `tflite_sha256` in `assets/models/preprocessing.json`, and the `tflite_sha256` in `dev-assets/model-fixtures/v2-parity/manifest.json`; `src/features/detection/model/__tests__/v2Model.test.ts` asserts all three agree. The deployed V2 SHA-256 is `349fe1b903e1ab3bef7cb7ad5fa83c8375ac4d73bae0b8fa4e27e7c1ff57ad86`. `assets/models/labels.txt` carries the five output labels in the order above.

Scan output stays four-class: the scan flow, stored records, and sync carry `healthy`, `mosaic`, `rust`, and `smut`. `runInference` therefore fails the scan with `LABEL_MAPPING_FAILED` when `rssi` is the top class, and otherwise drops the `rssi` entry without renormalizing the remaining scores. Carrying the fifth output through display/storage/sync is still the follow-up that would relax this.

Confidence cautions are selected by each result or saved record's stored `modelVersion`. V1 records keep the OOF-derived V1 artifact cutoff; V2 records use the provisional `0.8770278` cutoff from `threshold/v2-confidence-caution-threshold.json`. The source is `threshold/v2-selected-validation-predictions.csv` at commit `770cef3`, with 279 rows. Selection adapts the V1 method to selected-checkpoint validation data: incorrect prediction is the target event; candidates are `0.0`, each distinct observed max score, and `1.0`; warn strictly below the threshold; maximize error-detection F1 with higher error recall then higher threshold as tie-breaks. The V2 artifact warns 70 of 254 included non-RSSI-top rows (70/254, 27.56%). This is selected-checkpoint validation data, explicitly not genuine out-of-fold data, is not holdout-tuned, and remains provisional rather than independently validated or final. For non-RSSI-top V2 scans, its score is the maximum softmax over the five model outputs; RSSI-top scans are already scan errors. A caution remains presentation-only and does not change the predicted label, stored scores, or save/report availability.

Bundled but not active: Model V1 (`assets/models/caneguard_v1_mobilenetv2_float32.tflite`) outputs four classes in `healthy`, `mosaic`, `rust`, `smut` order with padding `127.5`. The `MODEL_*` constants, `ModelLabel`, the V1 QA oracle, the V1 confidence-caution artifact, and stored-record/sync validation keep that V1 meaning, and the developer `model-debug` and `model-smoke-test` routes pin it explicitly rather than following `ACTIVE_MODEL_ID`.

Treat `modelContract.ts`, the bundled artifacts, labels, parity fixtures, preprocessing, and model tests as one compatibility surface.

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

Verify that the installed development build matches the current native dependency/configuration state before interpreting an Agent Device failure.

Do not run EAS build or submit automatically.

## Constraints

- The project is Android-first and should remain cross-platform where practical.
- `react-native-fast-tflite` and Nitro modules require a compatible native development build; Expo Go is not sufficient for the full model runtime.
- After changes to native dependencies, Expo plugins, native configuration, or other development-build inputs, rebuild the development client before device or Agent Device verification.
- JS/TS-only changes may use the existing development build when its native runtime is still compatible.
- Core scan, records, and report viewing behavior must remain useful offline.
- Synchronization must tolerate unavailable networks and preserve retryable local state.
- Backend synchronization requires a valid `field_reporter` session and a complete local report, including barangay, resolved location evidence (coordinates with their source, or a bounded unavailable reason with no coordinates), and the managed image.
- The bundled AI model is decision support, not a diagnostic authority.
- The scan output and the stable V2 report-upload contract support `healthy`, `mosaic`, `rust`, and `smut`; the active Model V2's fifth `rssi` output is refused when it is the top class and dropped otherwise. Legacy V0 records and the legacy V1 report-upload contract remain three-class.
- The P0 manual-map fallback is online-only. Direct third-party tile requests are disabled; production must configure a CaneGuard-owned HTTPS tile proxy with attribution and normal HTTP caching. It does not prefetch or expose offline map downloads.
- Preserve compatibility with existing SQLite data and generated Drizzle migrations.
- Avoid unnecessary native dependencies when Expo-supported APIs already satisfy the requirement.

See `docs/security/mobile-security-fixes.md` for the owner-scoping, session,
App Link, release-signing, local-retention, and map-proxy contracts and their
cross-repository prerequisites.

## Current priorities

1. Harden end-to-end mobile authentication and authenticated report synchronization with the CaneGuard backend.
2. Preserve reliable offline-first report storage and retryable synchronization across startup, resume, network restoration, and manual sync.
3. Verify multipart report compatibility and remote identity handling against the web/backend API.
4. Continue physical Android-device validation of the TFLite runtime, SQLite persistence/migrations, managed image storage, and synchronization behavior.
5. Keep model-result and reporting UX clear that outputs are AI-assisted decision support.

## Known debt or limitations

- Legacy V0 records retain three-class compatibility; see the Constraints section for the authoritative scan-output and V2 report-upload class boundary.
- Native TFLite behavior cannot be fully validated by unit tests or Expo Go; a compatible development build and physical-device testing remain necessary.
- iOS and single-page web configurations exist, but the repository evidence is primarily Android-focused.
- Mobile/backend synchronization is tightly coupled to the current multipart field names and response identity shape; backend contract changes require coordinated mobile updates.
- Field-validation assignment, completion, and notification payloads are defined by `references/mobile-field-validation-assignment-v2.json` (current; `references/mobile-field-validation-assignment-v1.json` stays frozen as the pre-widening baseline), `references/mobile-field-validation-completion-v1.json`, `references/mobile-notifications-v1.json`, and their matching web artifacts.
Mobile completion evidence is persisted in SQLite with a retryable queue and synchronized through the owner-scoped assignment completion endpoint.
Mobile notifications are persisted in the owner-scoped `notifications_cache` SQLite table.
Follow-up due notifications use only the server-provided target date and incomplete field-validation state.
- Local report summaries represent AI-supported observations, not confirmed disease incidence.
