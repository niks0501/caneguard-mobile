# CaneGuard Drizzle + SQLite Phase Execution Plan

**Application:** CaneGuard  
**Project title:** *An AI-Based Disease Detection Android Application for Sugarcane in Nasugbu, Batangas*  
**Source requirements version:** 1.0  
**Source document status:** Approved implementation baseline  

**Repository:** `niks0501/caneguard-mobile`  
**Branch:** `feat/drizzle-sqlite-scan-records`  
**Stack:** Drizzle ORM + Expo SQLite + Expo FileSystem + Expo Crypto  
**Primary platform:** Android  
**Execution mode:** One phase at a time; do not continue past an unmet exit criterion


## What this packet is

This packet converts the approved local-persistence requirements into seven smaller implementation phases that a coding agent or development team can execute sequentially.

The packet preserves the full intent of the approved requirements while reducing the amount of context required for each execution step. The original requirements remain the source contract. This packet reorganizes them; it does not reduce their scope.

## Required reading order

1. `01-SHARED-CONTRACT.md`
2. `02-PHASE-0-COMPATIBILITY-SPIKE.md`
3. `03-PHASE-1-DATABASE-FOUNDATION.md`
4. `04-PHASE-2-MANAGED-IMAGE-STORAGE.md`
5. `05-PHASE-3-SAVE-COMPLETED-SCAN.md`
6. `06-PHASE-4-RECORDS-INTEGRATION.md`
7. `07-PHASE-5-REPORTS-INTEGRATION.md`
8. `08-PHASE-6-RELIABILITY-RELEASE.md`
9. `09-TRACEABILITY-MATRIX.md`

The coding agent must read the shared contract before every phase. A phase may be started only after the previous phase's exit criteria have been met and documented.

## Phase map

| Phase | Outcome | Primary user-visible change |
|---|---|---|
| 0 — Compatibility spike | Drizzle, migrations, Expo SQLite, Metro, EAS, and TFLite are proven compatible | None; technical proof only |
| 1 — Database foundation | Typed schema, migrations, provider, errors, and diagnostics exist | Storage initialization states |
| 2 — Managed image storage | Scan images can be copied, checked, and cleaned up safely | No permanent UI change yet |
| 3 — Save completed scan | A real completed AI analysis can be saved offline | Save Record flow |
| 4 — Records integration | Saved records can be listed, searched, filtered, opened, and deleted | Real Records and Record Details |
| 5 — Reports integration | Report summaries are calculated from actual local records | Real Reports |
| 6 — Reliability and release | Migrations, performance, device behavior, documentation, and release evidence are complete | Release-ready local workflow |

## Execution rules

- Work only on the current phase.
- Do not silently resolve an open decision. Record the decision and its rationale.
- Do not continue when a stop condition is triggered.
- Keep the worktree clean at each handoff.
- Commit generated migrations and snapshots with the schema change that produced them.
- Run the required checks after every package, Metro, Babel, migration, or native configuration change.
- Never claim Android device validation unless it was performed on an actual device or approved emulator path.
- Preserve the existing model contract, preprocessing behavior, inference pipeline, and `.tflite` asset.
- Authentication, backend APIs, actual synchronization, GPS collection, and new disease classes remain outside this feature.

## Shared completion flow

```text
Real scan
→ Real model result
→ User saves record
→ Managed image and structured metadata persist
→ Record survives restart
→ Record appears in Records
→ Record contributes to Reports
→ User can inspect and delete it
```

## Handoff discipline

At the end of every phase, provide:

- completed deliverables;
- files created or modified;
- tests and commands run;
- results and unresolved warnings;
- device or build evidence, when required;
- decisions made;
- known limitations;
- the exact commit SHA;
- confirmation that the next phase may or may not begin.

Use `10-HANDOFF-TEMPLATE.md` for that report.


---

# Shared Contract for All Phases

**Repository:** `niks0501/caneguard-mobile`  
**Branch:** `feat/drizzle-sqlite-scan-records`  
**Stack:** Drizzle ORM + Expo SQLite + Expo FileSystem + Expo Crypto  
**Primary platform:** Android  
**Execution mode:** One phase at a time; do not continue past an unmet exit criterion


> This file is mandatory context for every phase. It contains the product boundaries, architecture, users, user stories, future direction, and coding-agent guardrails that must not be weakened by an individual phase.

## Cross-phase engineering rules

1. Drizzle is the typed database-access layer; Expo SQLite remains the local database engine.
2. Route components must use hooks and application services. They must not import Drizzle tables or execute persistence queries directly.
3. Images belong in Expo FileSystem-managed app storage. SQLite stores their URI and metadata, not image bytes or Base64.
4. The initial feature works fully offline and creates records as `local_only`.
5. No interface may claim MAO submission, synchronization, approval, expert verification, or confirmed diagnosis.
6. The current model's output remains independent from user symptoms and reported severity.
7. Stable UUIDs prepare records for future synchronization but do not initiate network activity.
8. Production migration failure must never trigger an automatic destructive database reset.
9. Every schema change requires a reviewed and committed migration.
10. Each phase must leave the existing model flow working.

---

## 1. Purpose

This document defines the product, functional, data, architectural, quality, testing, and delivery requirements for adding durable offline storage to the CaneGuard Android application.

The feature shall convert the current scan flow from an in-memory prototype into an offline-first application workflow. A completed AI analysis must be saved on the device, remain available after the application closes, appear in the Records screen, and contribute to actual report summaries. The feature must also prepare the local data model for a future authenticated synchronization service without implementing that service prematurely.

This document is intended to serve as the implementation contract for the development branch. It should be reviewed before coding begins and updated only when the team deliberately changes scope or architecture.

---

## 2. Product Context

CaneGuard already supports the following working flow:

```text
Select or capture image
→ Preview image
→ Preprocess image
→ Run on-device TensorFlow Lite inference
→ Complete symptom checklist
→ View the analysis result
```

The current AI result includes a predicted class, confidence score, class scores, model version, processing timings, image-quality observations, selected symptoms, reported severity, and checklist consistency. However, this result currently exists only in the active React scan session.

The Records and Reports screens still contain demonstration data. They do not reflect scans performed by the user. The login and registration interfaces also do not yet provide real authentication, and there is no backend or synchronization service.

The persistence feature must therefore complete the local workflow first:

```text
Complete scan
→ Save record and managed image locally
→ View saved record
→ Search and filter records
→ Calculate reports from actual records
→ Preserve sync-ready metadata for a future backend
```

The application must remain useful without internet connectivity. This aligns with field conditions in which mobile signal and internet affordability may limit continuous online access. Local persistence is therefore a core product capability rather than a temporary cache.

---

## 3. Architecture Decision

### 3.1 Selected stack

The feature shall use the following technologies:

| Concern | Selected technology | Responsibility |
|---|---|---|
| Local relational database | `expo-sqlite` | Persistent on-device SQLite database |
| Typed database access | `drizzle-orm` | Type-safe schema definitions and queries |
| Migration generation | `drizzle-kit` | Generate version-controlled SQL migrations |
| Migration bundling | Drizzle Expo migrator and required Metro/Babel support | Bundle and apply SQL migrations at runtime |
| Persistent image storage | `expo-file-system` | Copy scan images into an application-controlled directory |
| Local record identifiers | `expo-crypto` | Generate UUIDv4 identifiers |
| Small UI preferences | Existing AsyncStorage | Theme, onboarding, and temporary key-value state only |
| Application data access | Repository and feature hooks | Prevent direct database access from screens |

### 3.2 Architectural boundaries

Drizzle is the typed access layer, while Expo SQLite remains the database engine. React screens shall not import database tables or execute database queries directly.

The required dependency direction is:

```text
Screens and UI components
        ↓
Feature hooks and application services
        ↓
Repositories
        ↓
Drizzle ORM
        ↓
Expo SQLite
```

Image files are not database records. They shall be managed through a separate storage service:

```text
Scan result
   ├── Structured metadata → Drizzle → SQLite
   └── Image file → Expo FileSystem → managed app directory
```

### 3.3 Package compatibility rule

Expo-managed packages shall be installed through `npx expo install` so that the versions match the repository's Expo SDK.

Drizzle packages and migration tooling shall be pinned to versions validated against the repository's current Expo SDK, React Native version, Metro configuration, and EAS build. The team shall not adopt `@next`, release-candidate, or arbitrary latest versions without a compatibility spike and a successful Android development build.

Generated migration files and migration snapshots shall be committed to Git.

---

## 4. Goals

The feature has the following goals:

1. Persist completed scan results across application restarts.
2. Store the exact image used for analysis in application-controlled storage.
3. Replace mock Records data with actual saved scans.
4. Replace hardcoded Reports data with aggregate database queries.
5. Preserve the current on-device AI and symptom-validation workflow.
6. Provide a typed and migration-safe local data layer.
7. Prepare local records for future Laravel, Firebase, or another backend without selecting that backend in this branch.
8. Prevent duplicate records, partial database writes, and orphaned image files where reasonably possible.
9. Keep the feature usable without authentication or internet connectivity.
10. Establish testing, error handling, and operational standards appropriate for a production-oriented mobile feature.

---

## 5. Non-Goals

The following items are explicitly outside the scope of this feature branch:

- Real login or registration
- Firebase Authentication
- Laravel authentication
- Backend API development
- Uploading records or images
- Actual synchronization with the MAO dashboard
- MAO review or approval states
- Push notifications
- Multi-device synchronization
- Conflict resolution between devices
- Cloud backups
- SQLCipher database encryption
- User-password storage
- Full farm-management functionality
- Model retraining or replacement
- Expansion of Model v0 disease classes
- Automatic GPS collection
- Exact disease occurrence or affected-plant counting
- Destructive production database reset controls

Future-ready fields may be included where they have low implementation cost, but no interface may falsely imply that an excluded capability already works.

---

## 6. Users and Stakeholders

### 6.1 Primary mobile user

The primary user is a farmer, field inspector, researcher, or authorized field worker who captures a sugarcane image, reviews the AI-supported result, records visible symptoms, and saves the observation for later reference.

### 6.2 Future data consumer

The Municipal Agriculture Office, Sugar Regulatory Administration personnel, or cooperative staff may eventually receive synchronized summaries. This branch shall not claim that local records have been sent, received, verified, or reviewed by these parties.

### 6.3 Development stakeholders

The development team needs a storage layer that is understandable, testable, type-safe, and extendable when authentication, synchronization, and a web dashboard are introduced.

---

## 7. Core User Stories

### US-01 — Save a completed scan

As a field user, I want to save a completed CaneGuard analysis so that I can review it later even when I have no internet connection.

### US-02 — Review saved records

As a field user, I want to view a chronological list of saved analyses so that I can track my previous field observations.

### US-03 — Search and filter records

As a field user, I want to search and filter my records by disease result, barangay, and date so that I can locate a specific observation quickly.

### US-04 — View record details

As a field user, I want to reopen the full details of a saved record, including its image, AI result, symptoms, severity, warnings, and model information.

### US-05 — View real summaries

As a field user, I want the Reports screen to summarize my actual saved records rather than demonstration values.

### US-06 — Delete a record

As a field user, I want to delete an incorrect or unwanted local record, including its managed image, after confirming the action.

### US-07 — Recover from interruption

As a field user, I want CaneGuard to avoid corrupting or duplicating records when saving is interrupted, the app is closed, or an operation fails.

### US-08 — Prepare for later synchronization

As a development team, we want local records to have stable identifiers and synchronization metadata so that a future backend can be added without replacing the local storage design.

---

## 25. Future Enhancements Enabled by This Design

Once the local persistence feature is stable, the architecture can support:

- real authentication
- farmer or inspector profiles
- controlled barangay and farm records
- Laravel or Firebase synchronization
- offline outbox and retry worker
- conflict handling
- MAO web dashboard
- synchronized advisories
- multiple model versions
- model-specific label catalogs
- downloadable reports
- data export with informed consent
- record backup and restoration
- locally encrypted database
- retention policies
- audit history
- expert review states

These enhancements require separate requirements and branches. Their future possibility does not expand the acceptance scope of this document.

---

## 26. Implementation Guardrails for Coding Agents

A coding agent working from this document shall follow these constraints:

1. Do not implement authentication or network synchronization.
2. Do not replace Drizzle with another ORM without approval.
3. Do not call the database directly from route components.
4. Do not store images in SQLite.
5. Do not store percentages as formatted strings.
6. Do not rename AI predictions as confirmed diagnoses.
7. Do not invent barangay data or silently save hardcoded locations.
8. Do not present Smut or Downy Mildew as Model v0 outputs.
9. Do not delete the production database automatically after migration failure.
10. Do not edit generated migration SQL casually.
11. Do not introduce mock records into production paths.
12. Do not claim device validation unless it was performed.
13. Preserve the existing model contract, image preprocessing, and inference flow.
14. Run the full targeted verification suite after Metro, Babel, or package changes.
15. Stop and report any migration, model-asset, or native-build incompatibility before continuing into UI integration.

---

## 28. Final Technical Direction

The approved local persistence architecture is:

```text
Expo React Native application
        ↓
Feature hooks and services
        ↓
Records and report repositories
        ↓
Drizzle ORM
        ↓
Expo SQLite persistent database

Completed scan image
        ↓
Expo FileSystem managed documents directory

Record identity
        ↓
Expo Crypto UUIDv4
```

This architecture provides CaneGuard with a realistic offline-first foundation. It improves maintainability through typed schemas and migrations, preserves SQL-level control, and prepares the application for future synchronization without making the current feature dependent on an undecided backend.


---

# Phase 0 — Compatibility Spike

**Repository:** `niks0501/caneguard-mobile`  
**Branch:** `feat/drizzle-sqlite-scan-records`  
**Stack:** Drizzle ORM + Expo SQLite + Expo FileSystem + Expo Crypto  
**Primary platform:** Android  
**Execution mode:** One phase at a time; do not continue past an unmet exit criterion


## Objective

Prove the selected stack can coexist with the current Expo SDK, React Native New Architecture, EAS configuration, Metro asset pipeline, Jest/TypeScript setup, and the existing native TensorFlow Lite integration before any production persistence feature is built.

This phase is deliberately narrow. It must establish compatibility and package versions, not build the final schema or user interface.

## Preconditions

- Start from an up-to-date, clean `main`.
- Create or switch to `feat/drizzle-sqlite-scan-records`.
- Confirm the current model integration and smoke-test route work before changing dependencies.
- Read `01-SHARED-CONTRACT.md`.
- Record the baseline commit SHA.

## Decisions that must be resolved

1. Which exact `drizzle-orm` and `drizzle-kit` versions work with Expo SDK 57?
2. Which Expo-compatible versions of `expo-sqlite`, `expo-file-system`, and `expo-crypto` will be installed?
3. What stable production database filename will be used?
4. Will Drizzle live queries be viable in this repository, or should route-focus refresh remain the fallback?
5. Which Android device will later be used for physical-device and performance acceptance?

Do not use `@next`, a release candidate, or an arbitrary latest version without documenting why and proving it in an Android build.

## In scope

- Dependency installation and version pinning
- Drizzle configuration
- Metro/Babel migration bundling configuration
- One minimal schema and generated migration used only to prove the pipeline
- Minimal database open and migration application
- Android JavaScript/asset export inspection
- EAS development or preview build
- Existing model smoke test after configuration changes
- Database persistence across restart
- Expo Doctor, lint, TypeScript, and test checks
- A written compatibility record

## Out of scope

- Final production schema
- Save Record interface
- Image storage service
- Records or Reports integration
- Authentication, backend, or sync
- Schema placeholders for future features
- Refactoring unrelated UI

## Expected deliverables

- Pinned dependency versions
- `drizzle.config.ts`
- Required Metro and Babel changes
- Migration import/bundle configuration
- One minimal generated SQL migration
- Minimal database-open proof
- Build and test record
- Compatibility decision log
- Rollback notes

## Execution steps

### 0.1 Capture the baseline

Run and record:

```bash
git status
git rev-parse HEAD
npm run lint
npx tsc --noEmit
npm test -- --runInBand
npx expo-doctor
```

Also run the existing Android/model smoke-test process already approved for the repository. Record any pre-existing warning separately so it is not blamed on Drizzle.

### 0.2 Install packages safely

Install Expo-managed packages through:

```bash
npx expo install expo-sqlite expo-file-system expo-crypto
```

Install pinned, tested Drizzle packages. Do not add unrelated state-management or validation packages during this spike.

### 0.3 Configure Drizzle

Create the minimum configuration required to:

- define an Expo SQLite schema;
- generate SQL migrations;
- import bundled migrations at runtime;
- include `.sql` files in Metro's source extensions, where required;
- preserve the existing `.tflite` asset extension handling;
- preserve existing Babel plugins and ordering.

Review configuration diffs carefully. Configuration must extend existing settings rather than replacing them wholesale.

### 0.4 Prove migration generation

Create a tiny compatibility-only table, generate one migration, inspect the generated SQL, and commit the migration and snapshot. Do not design the final scan schema in this step.

### 0.5 Prove runtime migration application

Open the database through Expo SQLite and apply the bundled migration. Confirm:

- first launch applies it;
- second launch does not repeat it;
- the database remains after app restart;
- errors are surfaced rather than swallowed.

### 0.6 Prove asset coexistence

Confirm the Android bundle contains:

- generated migration SQL;
- migration metadata required at runtime;
- the existing CaneGuard `.tflite` model asset.

Then run the existing model smoke test and one real inference path. Drizzle compatibility is not accepted if the model asset or native runtime regresses.

### 0.7 Prove the Android build

Create the approved EAS development or preview build. Install and launch it. Record:

- build profile;
- build ID or artifact reference;
- Android device and version;
- database-open result;
- migration result;
- app-restart persistence result;
- model-load and inference result.

### 0.8 Document and commit

Document tested versions, commands, results, warnings, and rollback instructions. Keep the spike code minimal and clearly mark whether the compatibility table will be removed or replaced in Phase 1.

## Required verification

| Check | Expected result |
|---|---|
| Clean dependency install | Pass |
| Expo Doctor | Pass, or external limitation documented |
| Lint | Pass |
| TypeScript | Pass |
| Jest suite | Pass |
| Drizzle migration generation | Pass |
| SQL migration bundled by Metro | Pass |
| Existing `.tflite` asset bundled | Pass |
| Android development/preview build | Pass |
| Database survives restart | Pass |
| Existing model loads and runs | Pass |
| No unexplained New Architecture regression | Pass |

## Stop conditions

Stop and report before proceeding when:

- the migration SQL cannot be bundled reliably;
- Drizzle requires an unapproved pre-release package;
- Metro/Babel changes break the model asset;
- Expo SQLite cannot open in the development build;
- repeated startup reruns or duplicates the migration;
- Expo Doctor introduces an unexplained failure;
- the EAS build cannot launch;
- the work requires authentication, backend, or unrelated architecture changes.

## Exit criteria

- Dependency versions are selected, pinned, and documented.
- A minimal database opens and one generated migration applies.
- Repeated startup is safe.
- Android bundle contains both SQL migrations and `.tflite`.
- Development build launches.
- Database survives restart.
- Existing TFLite model still loads and runs.
- Lint and TypeScript pass.
- No migration bundling, Metro, TFLite, or unexplained Expo Doctor regression remains.
- A compatibility record and rollback plan exist.

## Suggested commits

```text
chore(storage): add Drizzle and Expo persistence dependencies
build(storage): configure Drizzle migration bundling
test(storage): prove Expo SQLite and TFLite compatibility
```

## Source requirements preserved in this phase

### 3.3 Package compatibility rule

Expo-managed packages shall be installed through `npx expo install` so that the versions match the repository's Expo SDK.

Drizzle packages and migration tooling shall be pinned to versions validated against the repository's current Expo SDK, React Native version, Metro configuration, and EAS build. The team shall not adopt `@next`, release-candidate, or arbitrary latest versions without a compatibility spike and a successful Android development build.

Generated migration files and migration snapshots shall be committed to Git.

---

## Phase 0 — Compatibility spike

**Objective:** Prove that Drizzle, Expo SQLite, bundled migrations, Metro configuration, and the existing TFLite asset can coexist.

Deliverables:

- dependency versions selected and pinned
- minimal database open
- one generated migration applied
- lint and TypeScript checks passing
- Android bundle includes SQL migrations and `.tflite` model
- development build launches
- database survives restart

Exit criteria:

- no migration bundling error
- no Metro regression
- no TFLite asset regression
- no unexplained Expo Doctor failure

## 14.6 Compatibility

The feature shall be validated with:

- the repository's current Expo SDK
- the current Android package configuration
- an EAS development or preview build
- the existing native TFLite integration
- the current New Architecture configuration

Adding Drizzle or Metro migration support shall not break `.tflite` asset bundling.

---


---

# Phase 1 — Database Foundation

**Repository:** `niks0501/caneguard-mobile`  
**Branch:** `feat/drizzle-sqlite-scan-records`  
**Stack:** Drizzle ORM + Expo SQLite + Expo FileSystem + Expo Crypto  
**Primary platform:** Android  
**Execution mode:** One phase at a time; do not continue past an unmet exit criterion


## Objective

Replace the Phase 0 proof with the real CaneGuard local database foundation: the approved Drizzle schema, generated initial migration, root provider, migration states, error model, repository boundaries, and development diagnostics.

No user scan is saved in this phase. The outcome is a reliable storage platform that later phases can use without redesign.

## Preconditions

- Phase 0 exit criteria passed.
- Tested dependency versions are pinned.
- Migration bundling and `.tflite` coexistence are proven.
- Database filename is approved.
- Read `01-SHARED-CONTRACT.md`.
- Remove or formally replace the compatibility-only schema from Phase 0.

## Decisions that must be resolved

- Use Drizzle `useLiveQuery`, route-focus refresh, or a documented combination.
- Confirm the stable database filename.
- Confirm whether write-ahead logging will be enabled after device verification.
- Confirm initial pagination default for future list queries: 25 or 50.
- Keep barangay nullable until a controlled, verified input source exists.
- Use hard deletion initially unless soft deletion receives a separate approved requirement.

## Deliverables

- Final initial Drizzle schema
- Generated and reviewed initial migration
- Root-level `CaneGuardDatabaseProvider`
- `migrating`, `ready`, and `error` states
- Foreign-key enforcement
- Optional verified WAL configuration
- Typed database and storage error classes
- Schema-inferred database types
- Domain types and mapper boundaries
- Repository interfaces
- Development-only `/storage-debug` route
- Migration tests for clean install and upgrade
- Database architecture documentation

## Proposed schema

Implement only the four approved tables:

1. `scan_records`
2. `scan_class_scores`
3. `scan_symptoms`
4. `scan_quality_warnings`

Do not create placeholder tables for users, farms, barangay reference data, advisories, sync jobs, server review, treatments, model registry, or audit history.

## Execution steps

### 1.1 Establish the database module

Create one stable database module that owns:

- database filename;
- SQLite connection configuration;
- Drizzle database instance;
- migration import;
- pragmas;
- provider initialization;
- database-ready state.

No route may duplicate the database filename or create an independent connection.

### 1.2 Define the schema

Define all approved columns, defaults, primary keys, composite keys, foreign keys, cascades, and indexes in Drizzle.

Use:

- UUID text primary keys;
- UTC ISO 8601 text timestamps;
- real values for confidence and timings;
- `local_only` as the initial sync default;
- nullable remote and future retry metadata;
- foreign-key cascades from `scan_records` to child tables.

Review the generated SQL. ORM use does not remove the requirement to understand indexes, constraints, and query behavior.

### 1.3 Generate and review the initial migration

Generate the migration with Drizzle Kit. Commit the SQL and metadata. Ensure the migration is forward-only and safe for both:

- a new empty database; and
- the immediately preceding Phase 0 test database, if that database is retained for upgrade testing.

Do not place `CREATE TABLE` or `ALTER TABLE` inside repositories.

### 1.4 Build the database provider

Mount the database provider outside scan and model providers so Home, Analysis Result, Records, Reports, Settings, and future services can share the same instance.

The provider must expose:

- `migrating`;
- `ready`;
- `error`.

Database-dependent routes must wait for `ready`. A migration failure must show a recoverable user interface and must not silently erase the database.

### 1.5 Apply database configuration

Enable foreign keys and verify them. Enable WAL only when supported and proven on the target Android path. Treat pragma failures as intentional, testable behavior rather than ignored setup noise.

### 1.6 Define the error model

Implement stable errors for:

- `DATABASE_NOT_READY`
- `DATABASE_OPEN_FAILED`
- `MIGRATION_FAILED`
- `INVALID_SCAN_RECORD`
- `IMAGE_COPY_FAILED`
- `IMAGE_NOT_FOUND`
- `SAVE_TRANSACTION_FAILED`
- `RECORD_NOT_FOUND`
- `QUERY_FAILED`
- `DELETE_FAILED`
- `IMAGE_DELETE_FAILED`
- `DUPLICATE_RECORD`

At this phase, database and migration errors must be fully wired. Later phases will consume the remaining codes.

User-facing messages must not expose SQL, stack traces, or private local paths.

### 1.7 Define domain and repository boundaries

Create interfaces and types without implementing the full persistence behavior yet.

Repositories:

- do not import React;
- do not navigate;
- do not show alerts or toasts;
- do not format percentages;
- return typed domain values or typed errors.

Reuse the existing detection types wherever possible. Do not redefine model labels or inference results unnecessarily.

### 1.8 Add development diagnostics

Add `/storage-debug`, protected by `__DEV__`. It may show:

- initialization state;
- migration status;
- table row counts;
- database filename;
- foreign-key status;
- sample insert/delete controls;
- orphan image count placeholder;
- last storage error code.

A developer-only reset may exist, but production must not expose or invoke automatic destructive reset.

### 1.9 Test initialization and migration behavior

Verify:

- empty database to latest;
- previous test version to latest;
- repeated startup;
- foreign-key enforcement;
- SQL bundle resolution;
- migration-error presentation;
- preservation of seeded prior-version records.

## Expected project structure

```text
drizzle/
├── migrations.js
├── 0000_initial_local_records.sql
└── meta/
    └── ...

src/
├── database/
│   ├── database.ts
│   ├── DatabaseProvider.tsx
│   ├── schema.ts
│   ├── migrations.ts
│   ├── errors.ts
│   └── index.ts
│
└── app/
    └── storage-debug.tsx
```

Feature folders may be added now only for type/interface boundaries. Avoid empty abstraction layers that have no use until a later phase.

## Required verification

- Clean install initializes successfully.
- Migration applies once.
- Repeated startup is idempotent.
- Prior test schema upgrades.
- Foreign keys are enforced.
- Required indexes exist.
- Database-dependent screens wait for readiness.
- Migration error UI is accessible.
- Production has no automatic destructive reset.
- Model smoke test still passes.
- Lint, TypeScript, and tests pass.

## Stop conditions

Stop when:

- the generated migration does not match the approved schema;
- a destructive change appears without an explicit data migration;
- foreign keys cannot be enabled;
- routes bypass the provider;
- a repository imports React or navigation;
- a screen imports schema tables directly;
- the solution requires placeholder future tables;
- migration failure is handled by deleting production data;
- the model pipeline regresses.

## Exit criteria

- Final Drizzle schema exists.
- Generated initial migration is reviewed and committed.
- Root provider exposes migrating, ready, and error states.
- Foreign-key enforcement is verified.
- Clean install initializes.
- Repeated startup is safe.
- Previous test version upgrades while preserving data.
- Error model and development diagnostics exist.
- Architecture and repository boundaries are documented.
- Existing model flow remains intact.

## Suggested commits

```text
feat(storage): initialize CaneGuard SQLite database
feat(storage): define local scan record schema and migrations
test(storage): cover database initialization and migrations
docs(storage): document local persistence architecture
```

## Detailed source requirements

### FR-DB-001 — Database creation

The application shall create and open a persistent SQLite database named for CaneGuard. The name shall be defined once in the database module and shall not be repeated as string literals across features.

### FR-DB-002 — Root-level database availability

The database provider shall be mounted near the application root so that Home, Analysis Result, Records, Reports, Settings, and future synchronization features can use the same database instance.

Recommended provider order:

```tsx
<ThemePreferenceProvider>
  <CaneGuardDatabaseProvider>
    <ScanSessionProvider>
      <CaneGuardModelProvider>
        <AppNavigator />
      </CaneGuardModelProvider>
    </ScanSessionProvider>
  </CaneGuardDatabaseProvider>
</ThemePreferenceProvider>
```

### FR-DB-003 — Migration gate

Routes that depend on stored data shall not render until database migrations have completed successfully.

The application shall provide three initialization states:

- `migrating`
- `ready`
- `error`

A migration error shall present a recoverable error interface. Production code shall not silently delete the database to recover from a failed migration.

### FR-DB-004 — Database configuration

The database initialization shall enable foreign-key enforcement.

Where supported and verified, the database may enable write-ahead logging to improve read/write behavior. Any pragma must be applied intentionally and covered by a device-level smoke test.

### FR-DB-005 — Single source of schema truth

Drizzle schema definitions shall be the source of truth for application table and column types. TypeScript record types shall be inferred from the schema where practical instead of manually duplicating database types.

---

### FR-MIG-001 — Generated migrations

Every schema change shall produce a generated SQL migration using Drizzle Kit. Migration SQL and related snapshots shall be reviewed and committed.

### FR-MIG-002 — Forward-only production migration policy

Production migrations shall be forward-only. Existing user records shall not be removed or rewritten destructively unless a reviewed data migration explicitly requires it.

### FR-MIG-003 — Idempotent startup

Opening the application repeatedly shall not recreate tables, duplicate seed data, or rerun completed migrations.

### FR-MIG-004 — Empty-database support

The migration set shall successfully initialize a completely new installation.

### FR-MIG-005 — Upgrade support

Each new migration shall be tested against the immediately preceding schema version. A developer shall not validate only the empty-database path.

### FR-MIG-006 — No runtime schema improvisation

Feature repositories shall not contain `CREATE TABLE`, `ALTER TABLE`, or ad hoc migration statements. Schema changes belong only in the Drizzle schema and generated migrations.

### FR-MIG-007 — Migration failure visibility

Migration errors shall be logged with a stable error code in development. User-facing messages shall not expose raw SQL, file paths, or internal stack traces.

---

### FR-RES-006 — Corruption behavior

If the database cannot be opened, the app shall show a storage initialization error. A production user shall not be offered an automatic destructive reset as the first response.

A developer-only reset utility may exist behind `__DEV__`.

### FR-RES-007 — Referential integrity

Foreign keys shall be enabled and tested. Child records must not exist without a parent scan record.

---

### SEC-003 — Parameterized queries

All user-provided values shall be bound through Drizzle or parameterized SQL. String concatenation shall not construct database conditions from user input.

### SEC-006 — Logging

Production logs shall not print:

- image binary data
- full local file paths when avoidable
- complete record payloads
- future authentication credentials
- personal contact information

## 9. Proposed Data Model

The schema should remain normalized enough to support future model classes and queryable reports without creating unnecessary tables.

## 10. Domain and Repository Contracts

## 13. Error Model

The storage feature shall define stable internal error codes.

Recommended categories:

| Code | Meaning |
|---|---|
| `DATABASE_NOT_READY` | Migration or initialization is incomplete |
| `DATABASE_OPEN_FAILED` | SQLite database could not be opened |
| `MIGRATION_FAILED` | A migration did not complete |
| `INVALID_SCAN_RECORD` | Required scan data is missing or invalid |
| `IMAGE_COPY_FAILED` | Source image could not be copied |
| `IMAGE_NOT_FOUND` | Stored image path no longer exists |
| `SAVE_TRANSACTION_FAILED` | Database transaction failed |
| `RECORD_NOT_FOUND` | Requested record does not exist |
| `QUERY_FAILED` | List, details, or aggregate query failed |
| `DELETE_FAILED` | Database deletion failed |
| `IMAGE_DELETE_FAILED` | Managed image cleanup failed |
| `DUPLICATE_RECORD` | A record with the same primary identifier exists |

User-facing messages shall explain the next action without exposing internal implementation details.

---

## 17. Developer and Debugging Requirements

A development-only storage diagnostic route is recommended.

Possible route:

```text
/storage-debug
```

It may show:

- database initialization state
- applied migration status
- table row counts
- database file name
- foreign-key status
- sample insert/delete controls
- orphan image count
- last storage error code

The route must be protected by `__DEV__` and excluded from normal user navigation.

Drizzle Studio or an Expo-compatible database inspector may be configured for development, but the application shall not depend on it at runtime.

---

## 18. Proposed Project Structure

```text
drizzle/
├── migrations.js
├── 0000_initial_local_records.sql
└── meta/
    └── ...

src/
├── database/
│   ├── database.ts
│   ├── DatabaseProvider.tsx
│   ├── schema.ts
│   ├── migrations.ts
│   ├── errors.ts
│   └── index.ts
│
├── features/
│   └── records/
│       ├── data/
│       │   ├── scanRecordRepository.ts
│       │   └── reportRepository.ts
│       ├── domain/
│       │   ├── recordTypes.ts
│       │   ├── recordValidation.ts
│       │   └── recordMappers.ts
│       ├── hooks/
│       │   ├── useScanRecords.ts
│       │   ├── useScanRecordDetails.ts
│       │   └── useLocalReportSummary.ts
│       ├── services/
│       │   ├── saveScanRecord.ts
│       │   └── scanImageStorage.ts
│       └── __tests__/
│           └── ...
│
└── app/
    ├── analysis-result.tsx
    ├── records.tsx
    ├── record-details.tsx
    ├── reports.tsx
    └── storage-debug.tsx
```

The exact folders may follow established repository conventions, but responsibilities shall remain separated.

---

## Phase 1 — Database foundation

Deliverables:

- Drizzle schema
- generated initial migration
- database provider
- migration loading/error states
- foreign-key enforcement
- storage error model
- development diagnostics

Exit criteria:

- clean install initializes successfully
- repeated startup is safe
- prior test schema upgrades successfully


---

# Phase 2 — Managed Image Storage

**Repository:** `niks0501/caneguard-mobile`  
**Branch:** `feat/drizzle-sqlite-scan-records`  
**Stack:** Drizzle ORM + Expo SQLite + Expo FileSystem + Expo Crypto  
**Primary platform:** Android  
**Execution mode:** One phase at a time; do not continue past an unmet exit criterion


## Objective

Create a small, reliable Expo FileSystem service that preserves the exact image used for inference in application-controlled storage and supports later save, details, deletion, and orphan-cleanup flows.

This phase must not put image binaries in SQLite and must not integrate the final Save Record UI yet.

## Preconditions

- Phase 1 database foundation passed.
- `scan_records.managed_image_uri` and approved image metadata columns exist.
- Expo FileSystem version was proven in Phase 0.
- Read `01-SHARED-CONTRACT.md`.
- UUID generation through Expo Crypto is available.

## Decisions that must be resolved

- Store the full source image only, or also create a list thumbnail.
- Preferred approach: store the full source image only for the initial implementation unless real list profiling proves thumbnails are necessary.
- Define the supported extension/MIME mapping and fallback behavior.
- Define whether orphan detection is manual/dev-only now or exposed as a maintenance function only.

## Deliverables

- Managed root and scan-image directory creation
- UUID-based destination path generation
- Source extension/MIME resolution
- File copy operation
- File existence operation
- File metadata reading
- File deletion operation
- Orphan detection operation
- Compensating cleanup helper
- Typed image-storage errors
- Unit/service tests
- Device proof for camera and gallery URIs

## Execution steps

### 2.1 Create one managed storage service

Create `scanImageStorage.ts` or the repository-equivalent location. It owns all scan-image paths and file operations.

No screen, hook, or repository should manually concatenate document-directory paths.

### 2.2 Establish the directory

Use an app-controlled documents path logically equivalent to:

```text
<app documents>/
└── caneguard/
    └── scan-images/
        └── <scan-record-uuid>.<extension>
```

Directory creation must be safe when called repeatedly.

### 2.3 Resolve destination metadata

Generate the destination filename from the stable record UUID. Do not derive it from:

- predicted disease;
- barangay;
- user-entered text;
- timestamp alone.

Resolve an extension from trustworthy source metadata or URI information. Use a documented fallback when metadata is missing.

### 2.4 Copy without altering the inference source

Copy the exact selected source file used by the analysis flow. Do not re-encode, crop, substitute, or overwrite it in this phase.

Return a typed `ManagedImage` result containing, where available:

- managed URI;
- MIME type or extension;
- size in bytes;
- source type;
- source dimensions.

### 2.5 Implement existence and missing-file behavior

Provide `managedImageExists(uri)`. A missing managed file must be representable as a recoverable state for later details UI. It must not cause repository details retrieval to fail.

### 2.6 Implement deletion safely

Provide `deleteManagedScanImage(uri)`.

Deletion rules:

- database deletion must happen before image deletion in the later application flow;
- missing files should be treated as already absent when appropriate;
- unexpected deletion failures produce `IMAGE_DELETE_FAILED`;
- production logs should avoid exposing full paths.

### 2.7 Implement compensation cleanup

Provide a helper used when:

```text
image copy succeeds
→ database transaction fails
→ copied image must be deleted
```

If cleanup fails, report the database save as failed and log that an orphan may remain. Never report a successful save.

### 2.8 Design orphan detection

Implement or define `findOrphanedManagedImages()` so managed files can be compared with database URIs. Automatic deletion may remain deferred, but detection must be possible.

Avoid building a background cleanup scheduler in this phase.

### 2.9 Test real URI sources

On Android, test:

- a camera result;
- a gallery result;
- restart persistence;
- missing source;
- unsupported or missing extension metadata;
- duplicate directory creation;
- destination collision;
- missing destination during deletion;
- forced cleanup failure.

## Required verification

- Camera and gallery files copy successfully.
- Copied files survive app restart.
- Managed filename uses record UUID.
- Image is not stored as Base64 or BLOB.
- Original selected image remains unchanged.
- Existence check works.
- Missing file does not crash service consumers.
- Deletion works.
- Compensation cleanup works.
- Orphan detection can identify unmatched files.
- No production log prints image bytes or full record payloads.
- Existing model flow still works.

## Stop conditions

Stop when:

- a source URI cannot be copied reliably on the approved Android path;
- implementation requires storing image bytes in SQLite;
- file naming uses disease/location/user input;
- the copy modifies the inference image;
- database insertion is introduced into the file service;
- screens begin performing raw file operations;
- automatic background cleanup expands scope;
- TFLite or image-picker behavior regresses.

## Exit criteria

- Managed directory service exists.
- UUID path generation exists.
- Copy, existence, metadata, delete, compensation, and orphan-detection operations exist.
- Camera and gallery files copy successfully.
- Files survive restart.
- Missing-file behavior is represented safely.
- Service tests and Android evidence pass.
- No permanent UI or database save flow has been prematurely introduced.

## Suggested commit

```text
feat(records): add managed scan image storage
test(records): cover managed scan image lifecycle
```

## Detailed source requirements

### FR-IMG-001 — Managed directory

Saved scan images shall be copied to an application-controlled documents directory, not left solely at the temporary URI returned by the camera or gallery.

Recommended logical path:

```text
<app documents>/
└── caneguard/
    └── scan-images/
        └── <scan-record-uuid>.<extension>
```

### FR-IMG-002 — Database reference

SQLite shall store the managed image URI and metadata. The image binary shall not be stored as Base64 text or a SQLite BLOB.

### FR-IMG-003 — Source preservation

The saved image shall represent the image used by the inference flow. The storage service shall not substitute an unrelated image or modify the image after the result is computed.

### FR-IMG-004 — Stable file naming

The managed file name shall use the scan record UUID. It shall not depend on user-entered text, predicted disease names, or timestamps alone.

### FR-IMG-005 — File metadata

When available, the record shall store:

- managed image URI
- file extension or MIME type
- file size in bytes
- original source type (`camera` or `gallery`)
- original width
- original height

### FR-IMG-006 — Compensating cleanup

If the image copy succeeds but the database transaction fails, the storage service shall attempt to delete the copied image.

If cleanup also fails, the failure shall be logged without falsely reporting that the database record was saved.

### FR-IMG-007 — Missing-file behavior

If a database record exists but its managed image is missing, the record details screen shall remain usable. It shall display an image-unavailable state rather than crash or hide the entire record.

### FR-IMG-008 — Record deletion cleanup

Deleting a scan record shall also attempt to delete its managed image. Database deletion and file cleanup behavior shall be documented and tested.

### FR-IMG-009 — Orphan cleanup

A maintenance function shall be designed to identify managed image files that do not correspond to a database record. Automatic deletion may be deferred, but the storage design shall not make orphan detection impossible.

---

### FR-DEL-003 — File deletion

The storage service shall attempt to delete the managed image after or as part of the application-level delete operation.

### FR-DEL-004 — Partial-failure handling

If database deletion succeeds but file deletion fails, the record shall remain deleted and the orphaned file shall be eligible for later cleanup.

If database deletion fails, the image shall not be deleted first.

### SEC-006 — Logging

Production logs shall not print:

- image binary data
- full local file paths when avoidable
- complete record payloads
- future authentication credentials
- personal contact information

## Phase 2 — Managed image storage

Deliverables:

- managed directory service
- UUID-based path generation
- copy, existence, and delete operations
- compensation cleanup
- service tests

Exit criteria:

- camera and gallery sources can be copied
- files survive restart
- missing-file state is handled

## 14.4 Storage efficiency

- Images shall not be stored as Base64 or duplicated unnecessarily.
- List queries shall select only the columns needed by record cards.
- Details queries may fetch child rows.
- Aggregate reports shall run in SQL.
- Records shall use pagination.
- Deleted records shall release their managed image storage where possible.


---

# Phase 3 — Save Completed Scan

**Repository:** `niks0501/caneguard-mobile`  
**Branch:** `feat/drizzle-sqlite-scan-records`  
**Stack:** Drizzle ORM + Expo SQLite + Expo FileSystem + Expo Crypto  
**Primary platform:** Android  
**Execution mode:** One phase at a time; do not continue past an unmet exit criterion


## Objective

Connect the completed AI analysis flow to durable local storage. The user must be able to explicitly save one real result offline, with a managed image and all approved metadata, without duplicates or partial records.

This phase creates the first end-to-end persisted CaneGuard record. It does not build the Records list or Reports screen yet.

## Preconditions

- Phase 1 schema and provider are ready.
- Phase 2 image-storage service is verified.
- Existing scan session contains the required result fields.
- Read `01-SHARED-CONTRACT.md`.
- Decide the primary post-save action.
- Decide whether leaving an unsaved result should show a warning. The warning must not force saving.

## Deliverables

- Scan-session-to-persistence mapper
- Input validation
- Transactional scan-record repository insert
- Child inserts for scores, symptoms, and quality warnings
- Application-level coordinated save service
- Compensation cleanup
- Stable UUID generation
- `local_only` sync metadata
- Save Record UI
- ready/saving/saved/failed states
- duplicate-tap prevention
- retry behavior
- navigation using saved record UUID
- unit, repository, and UI tests

## Execution steps

### 3.1 Reuse existing detection types

Map the current completed scan session into `SaveCompletedScanInput`.

Do not redefine model labels, class-score structure, symptom keys, severity, checklist consistency, warnings, or timings unless a persistence-specific type genuinely differs.

### 3.2 Validate before any file or database write

Reject incomplete or invalid input when required data is missing:

- completed inference;
- source URI;
- source type;
- predicted label;
- confidence;
- complete class scores;
- model version.

Validate:

- allowed enums;
- finite confidence and score values from 0 to 1;
- non-negative finite timings;
- positive dimensions when present;
- valid timestamp strings;
- UUID format or generated identity.

Use `INVALID_SCAN_RECORD` for typed validation failure.

### 3.3 Generate one stable UUID

Generate the UUID once per save operation through Expo Crypto. Reuse it for:

- parent primary key;
- managed image filename;
- later details navigation;
- future idempotent synchronization.

Do not regenerate the ID on retry after a recoverable UI failure unless the prior attempt is known not to have committed.

### 3.4 Coordinate file and database operations

Implement the approved workflow:

```text
1. Validate completed scan session
2. Generate or obtain stable record UUID
3. Copy source image to managed documents directory
4. Begin SQLite transaction
5. Insert scan_records parent row
6. Insert scan_class_scores rows
7. Insert scan_symptoms rows
8. Insert scan_quality_warnings rows
9. Commit SQLite transaction
10. Return saved record UUID
```

If image copy fails, do not begin the transaction.

If the transaction fails after copy:

- roll back;
- attempt copied-file deletion;
- report failure;
- do not report saved state.

Required class scores are atomic with the parent. Symptoms and warnings may be empty.

### 3.5 Preserve model-output integrity

Store:

- exact predicted label;
- exact top confidence;
- every returned class score;
- existing model version;
- preprocessing, inference, and total timings.

Do not:

- apply softmax again;
- let symptom consistency modify scores;
- relabel the prediction;
- store confidence as `"98%"`;
- call it a confirmed disease.

### 3.6 Preserve observation context

Store selected symptom keys, checklist consistency, user-reported severity, quality-warning keys, and nullable barangay context.

Barangay remains null unless the user explicitly provides or confirms it. Never persist the current hardcoded demonstration location as real data.

### 3.7 Initialize sync-ready metadata honestly

Create the record as:

```text
sync_status = local_only
remote_id = null
sync_attempt_count = 0
last_sync_error_code = null
last_sync_attempt_at = null
last_synced_at = null
```

No network request, queue worker, backend SDK, or fake synchronization status may be added.

### 3.8 Add the Save Record interface

On Analysis Result, add:

- Save Record button;
- saving indicator;
- saved confirmation;
- recoverable failure and retry;
- disabled duplicate tap;
- accurate local-storage disclosure;
- optional Open Saved Record action using returned UUID.

States:

- ready to save;
- saving;
- saved;
- failed.

Viewing a result does not autosave.

### 3.9 Guard duplicate operations

Use both:

- a UI in-flight guard;
- one stable UUID.

Also handle the possibility that a retry encounters an already-committed ID. Return or map `DUPLICATE_RECORD` without creating another record.

### 3.10 Preserve the active result after failure

A database or image-storage failure must not reset the scan session, destroy the result, or navigate away. The user must be able to retry or start a new scan deliberately.

### 3.11 Add tests

Cover:

- complete save;
- no optional symptoms;
- invalid required field;
- score outside range;
- duplicate rapid tap;
- child insert rollback;
- image copy failure;
- DB failure after image copy;
- cleanup failure;
- saved-state navigation;
- no fake sync;
- exact model score preservation;
- UTC timestamps.

## Required verification

- One real model result saves in airplane mode.
- Managed image and metadata persist.
- All class scores exist.
- Symptoms, severity, warnings, model version, and timings persist when available.
- Record starts as `local_only`.
- Rapid taps create one record.
- Required child failure rolls back parent.
- Failed save does not show success.
- Failed save preserves active result.
- No password, token, upload, or backend dependency appears.
- UI says local/AI-supported, not synced/confirmed.
- Existing inference output remains unchanged.

## Stop conditions

Stop when:

- save requires internet or authentication;
- symptoms alter model output;
- a hardcoded barangay is persisted;
- an image is stored in SQLite;
- the repository performs navigation or UI work;
- a partial parent record remains after child failure;
- a failed operation shows saved state;
- a sync worker or backend SDK is introduced;
- the app claims diagnosis confirmation;
- model flow regresses.

## Exit criteria

- One real model result can be saved offline.
- Managed image and all required structured data persist.
- All expected child rows are stored.
- Incomplete input is rejected.
- Transaction failure leaves no partial record.
- Compensation cleanup is attempted.
- Duplicate taps do not duplicate records.
- Save UI supports ready, saving, saved, failed, and retry states.
- Save service returns record UUID.
- Record is `local_only`.
- Existing model and symptom flow remain intact.

## Suggested commits

```text
feat(records): add transactional scan record repository
feat(records): save completed analysis results locally
test(records): cover scan save and rollback behavior
```

## Detailed source requirements

### FR-SAVE-001 — Eligibility

A record may be saved only when the scan session has:

- a completed inference result
- a source image URI
- a source type
- a predicted label
- a confidence value
- model class scores
- a model version

The save service shall reject incomplete sessions using a typed application error.

### FR-SAVE-002 — Explicit save action

The Analysis Result screen shall provide a clear **Save Record** action. Viewing a result shall not automatically create a permanent record unless the product team later approves autosave.

### FR-SAVE-003 — Save-state feedback

The save action shall expose these states:

- ready to save
- saving
- saved
- failed

While saving, the control shall be disabled and display progress feedback. After success, the interface shall make it clear that the record is stored on the current device.

### FR-SAVE-004 — Duplicate-tap protection

Repeated taps during one save operation shall not create duplicate records.

The save operation shall use both:

1. a UI in-flight guard; and
2. a stable UUID generated once for the operation.

### FR-SAVE-005 — Transactional metadata write

The parent scan record and all dependent rows shall be inserted in one database transaction. A failure in any required child insert shall roll back the database transaction.

### FR-SAVE-006 — Captured data

A saved record shall preserve the following available data from the current analysis flow:

- scan record UUID
- managed image URI
- image source type
- source width and height
- predicted model label
- top confidence score
- all model class scores
- selected symptom keys
- checklist consistency result
- reported severity
- image-quality warning keys
- model version
- preprocessing time
- inference time
- total processing time
- barangay or location context, when collected
- created timestamp
- updated timestamp
- local synchronization state

### FR-SAVE-007 — UTC timestamps

Persisted timestamps shall use ISO 8601 UTC strings. UI components may convert them to local display time.

### FR-SAVE-008 — Confidence storage

Confidence and class scores shall be stored as numeric values from `0` to `1`. The database shall not store formatted percentage strings such as `"98%"`.

### FR-SAVE-009 — Model-output integrity

The database shall store the actual model output returned by the completed scan. Symptom observations shall not overwrite, relabel, or numerically alter the AI class scores.

### FR-SAVE-010 — Decision-support wording

Persistence shall preserve the distinction between an AI-supported result and a confirmed diagnosis. Database and UI naming shall use terms such as `predictedLabel`, `possible result`, or `AI result`, not `confirmedDisease`.

### FR-SAVE-011 — Barangay handling

The local schema shall support a nullable barangay field during the initial implementation because authentication and local profiles do not yet exist.

Before barangay-level reports are presented as meaningful, the application must introduce a verified and controlled barangay selection mechanism. Hardcoded demonstration locations shall not be saved as real user data.

### FR-SAVE-012 — Post-save behavior

After a successful save, the user shall be able to:

- open the saved record;
- return to Home;
- start a new scan; or
- remain on the result screen with a visible saved state.

The team shall select one primary action, but the save service must return the record UUID so navigation can open the correct record.

---

### FR-SYNC-001 — Stable local identity

Each scan shall use a UUIDv4 generated on the device. The identifier shall remain stable throughout future synchronization retries.

### FR-SYNC-002 — Synchronization states

The data model shall support these values:

| State | Meaning |
|---|---|
| `local_only` | Record is stored locally and no backend synchronization is configured |
| `pending` | Record is eligible and waiting to be sent |
| `syncing` | A future sync worker is attempting upload |
| `synced` | A future backend confirmed successful storage |
| `failed` | A future sync attempt failed and may be retried |

The initial feature shall create records as `local_only`.

### FR-SYNC-003 — Future remote identifier

The record shall support a nullable `remoteId`. It shall remain null until a backend confirms a server-side identifier.

### FR-SYNC-004 — Future retry metadata

The model may include:

- sync attempt count
- last sync error code
- last sync attempt timestamp
- last successful sync timestamp

These fields shall not trigger network activity in this branch.

### FR-SYNC-005 — No fake queue

A Sync Queue interface shall not display fabricated pending items. Until a backend and sync contract exist, the queue may show locally stored records as local-only, or remain unavailable with an accurate explanation.

### FR-SYNC-006 — Backend independence

Local repositories shall not depend on Laravel, Firebase, Supabase, or another backend SDK. Future synchronization shall consume repository data through a separate application service.

### FR-SYNC-007 — Future idempotency

The eventual upload payload shall include the stable local UUID so that the server can reject duplicate uploads. This branch shall preserve the required local ID but shall not define an unapproved API payload as final.

---

### FR-RES-002 — Save interruption

The save service shall not report success until both the managed image and database transaction complete.

### FR-RES-003 — Atomic dependent data

A scan record shall never be committed without its required class-score rows. Optional symptoms and warnings may be absent when the user or analysis produced none.

### FR-RES-004 — Validation before write

Repository inputs shall be validated for required fields, allowed enum values, finite numeric values, and timestamp format before executing the transaction.

### FR-RES-005 — Database error isolation

A failed query shall not reset the active scan result or destroy previously saved records.

### SEC-001 — No passwords

The SQLite database shall not store passwords. Authentication remains a future feature.

### SEC-002 — No auth tokens

Future access and refresh tokens shall use secure device storage, not scan tables or AsyncStorage. This branch shall not introduce token storage.

### SEC-003 — Parameterized queries

All user-provided values shall be bound through Drizzle or parameterized SQL. String concatenation shall not construct database conditions from user input.

### SEC-004 — No silent upload

No scan record or image shall leave the device in this branch.

### SEC-005 — Location minimization

The feature shall not collect GPS coordinates automatically. Barangay text may be stored only when the user provides or confirms it.

### SEC-006 — Logging

Production logs shall not print:

- image binary data
- full local file paths when avoidable
- complete record payloads
- future authentication credentials
- personal contact information

### SEC-007 — Local disclosure

The UI shall disclose that records are stored on the device and may be removed if the application data is cleared or the application is uninstalled.

---

## 11. Save Transaction Workflow

Because file operations and SQLite transactions cannot participate in one shared transaction, the application shall use a coordinated workflow with compensating cleanup.

```text
1. Validate completed scan session
2. Generate or obtain stable record UUID
3. Copy source image to managed documents directory
4. Begin SQLite transaction
5. Insert scan_records parent row
6. Insert scan_class_scores rows
7. Insert scan_symptoms rows
8. Insert scan_quality_warnings rows
9. Commit SQLite transaction
10. Return saved record UUID
```

Failure behavior:

```text
Image copy fails
→ Do not begin database transaction
→ Report image-storage failure

Database transaction fails after image copy
→ Roll back transaction
→ Attempt to delete copied image
→ Report database-save failure

Cleanup deletion also fails
→ Keep database rolled back
→ Log orphan-file cleanup requirement
→ Do not report save success
```

---

## 12.1 Analysis Result screen

The Analysis Result screen shall gain:

- Save Record button
- saving indicator
- saved confirmation
- retry action after recoverable failure
- duplicate-save prevention
- accurate local-only wording
- optional navigation to saved details

The existing New Scan action shall warn the user when a completed result has not been saved only if the team deliberately chooses that behavior. It shall not trap the user or force saving.

## Phase 3 — Save completed scan

Deliverables:

- scan-session mapper
- record validation
- transactional repository insert
- Save Record UI
- duplicate guard
- saved state and navigation

Exit criteria:

- one real model result can be saved offline
- all expected child rows are stored
- failed transaction does not create a partial record


---

# Phase 4 — Records Integration

**Repository:** `niks0501/caneguard-mobile`  
**Branch:** `feat/drizzle-sqlite-scan-records`  
**Stack:** Drizzle ORM + Expo SQLite + Expo FileSystem + Expo Crypto  
**Primary platform:** Android  
**Execution mode:** One phase at a time; do not continue past an unmet exit criterion


## Objective

Replace the production Records mock data with real local records and provide a complete record-management experience: newest-first list, pagination, search, filters, database-backed details, missing-image fallback, and confirmed deletion with image cleanup.

The interface must remain polished and consistent with CaneGuard's current design system without introducing a large state-management framework or unnecessary abstraction.

## Preconditions

- Phase 3 can save a real record.
- Record UUID can be returned after save.
- Image existence and deletion services work.
- Read `01-SHARED-CONTRACT.md`.
- Decide initial page size: 25 or 50.
- Decide refresh strategy: live query, route focus, or both.
- Keep barangay filters inactive or conditional until reliable values exist.
- Use hard delete for this branch unless separately approved.

## Deliverables

- Database-backed record list
- Lightweight list projection
- Newest-first ordering
- Pagination
- Supported-label filters
- Date and sync-status query support
- Controlled barangay filtering support
- Debounced or deliberate search
- loading, empty, no-results, error, and missing-image states
- record details route by UUID
- full database-backed details
- delete confirmation
- child cascade deletion
- managed-image cleanup
- reactive or focus refresh
- tests for list, details, deletion, and UI states

## Execution steps

### 4.1 Replace production mock data

Remove `MOCK_RECORDS` and any production path that treats demonstration records as stored data.

Tests may use fixtures, but production screens must query the repository.

### 4.2 Implement list queries

Provide a paginated `listScanRecords(query)` that:

- orders by `created_at DESC`;
- returns only list-card fields;
- accepts page size and cursor/offset;
- supports predicted label;
- supports optional date range;
- supports sync status;
- supports barangay only when meaningful data exists;
- supports controlled search.

Do not load all records and filter them entirely in JavaScript.

### 4.3 Align filters with actual model data

Current Model v0 filters must be based on Healthy, Mosaic, and Rust or labels actually present in stored results.

Do not present Smut or Downy Mildew as current Model v0 prediction filters.

A future model-version-aware label system may be added later through a separate migration. Do not overbuild it now.

### 4.4 Implement search deliberately

Search appropriate text such as barangay and display label. Use case-insensitive matching.

Debounce the query or require a deliberate search submission. Avoid uncontrolled database queries for every keystroke.

### 4.5 Build complete list states

Support:

- initial loading;
- populated list;
- no records;
- no results for current filter;
- database error;
- thumbnail missing.

The empty database state should lead to Start Scan. The filtered empty state should offer clearing filters.

### 4.6 Build truthful record cards

Display:

- thumbnail or placeholder;
- possible result or healthy label;
- confidence percentage formatted in UI only;
- local date/time;
- barangay when available;
- truthful local/sync status.

Use phrases such as:

- `Saved on this device`
- `Local record`
- `Not yet connected to MAO`

Do not show synced, reviewed, approved, or submitted without backend evidence.

### 4.7 Add record details by UUID

Create `record-details` route. It must query by UUID and must not depend on the active scan session.

Display:

- stored image or fallback;
- predicted result;
- confidence;
- all class scores;
- symptoms;
- checklist consistency;
- reported severity;
- quality warnings;
- barangay when available;
- model version;
- processing time;
- saved date/time;
- local/sync status;
- decision-support disclaimer.

A missing image does not hide metadata.

### 4.8 Implement deletion

Require explicit confirmation that the local record and saved image will be removed.

Deletion order:

```text
1. Delete database parent
2. Let foreign-key cascades remove child rows
3. Attempt managed-image deletion
4. Refresh Records and Reports
```

If DB deletion fails, do not delete the image first.

If DB deletion succeeds but image deletion fails:

- keep the record deleted;
- report or log cleanup failure;
- make the orphan detectable.

### 4.9 Refresh without restart

Use the approved refresh strategy so save and delete changes appear without restarting the app. Keep Drizzle details inside hooks; screens still must not import schema tables.

### 4.10 Preserve accessibility

Add:

- meaningful labels;
- disabled semantics;
- accessible loading and error announcements;
- useful missing-image alternatives;
- no color-only status.

### 4.11 Test at realistic volume

Test list and query behavior with enough records to expose pagination and filtering problems. Full 5,000-record performance acceptance remains Phase 6, but this phase should already use indexed queries and lightweight projections.

## Required verification

- Production Records contains no mock source.
- New records appear without restart.
- Restart preserves records.
- Newest record is first.
- Pagination works.
- Search and filters work.
- Unsupported disease filters are absent.
- Details route works after active session reset.
- Missing image displays fallback.
- Confirmation is required before delete.
- Child rows cascade.
- DB failure does not delete image first.
- Image-delete failure leaves detectable orphan.
- List and reports refresh after delete.
- Accessibility checks pass.

## Stop conditions

Stop when:

- screen imports Drizzle tables;
- all rows are loaded into JavaScript;
- filters imply unsupported model classes;
- details depend on the scan session;
- local records claim MAO sync/review;
- deletion removes image before DB success;
- a missing file crashes details;
- soft deletion or recovery bin expands scope without approval;
- a new global state framework is added only for this screen.

## Exit criteria

- No production mock record source remains.
- Database-backed list, search, filters, and pagination work.
- Records survive restart.
- Details are queried by UUID.
- Missing-image fallback works.
- Deletion confirms intent, cascades child rows, and attempts image cleanup.
- Saved and deleted changes appear without restart.
- UI is honest, accessible, and aligned with current model labels.

## Suggested commits

```text
feat(records): replace mock records with local database data
feat(records): add local record details and deletion
test(records): cover records queries and UI states
```

## Detailed source requirements

### FR-REC-001 — Replace mock data

The Records screen shall remove `MOCK_RECORDS` and obtain all displayed data from the local database.

### FR-REC-002 — Default ordering

Records shall be ordered by `createdAt` descending, with the newest record first.

### FR-REC-003 — Pagination

The repository shall support limit-and-cursor or limit-and-offset pagination. The first implementation may load a fixed first page, but it shall not require loading the entire database into memory.

Recommended initial page size: 25 or 50 records.

### FR-REC-004 — Filtering

The records query shall support these filters:

- predicted label
- date range
- local synchronization state
- barangay, once reliable barangay data is collected

Filter labels must derive from supported model labels or stored data. The screen shall not imply that the current model detects classes it does not support.

### FR-REC-005 — Search

Search shall support case-insensitive matching against appropriate stored text, including barangay and display label. Search shall be debounced or triggered deliberately to avoid querying on every keystroke without control.

### FR-REC-006 — State handling

The Records screen shall include:

- initial loading state
- populated list
- empty database state
- no-filter-results state
- database error state
- missing-image state at item or detail level

### FR-REC-007 — Record cards

Each record card shall show at minimum:

- image thumbnail or placeholder
- possible result or healthy result label
- confidence percentage
- date and time
- barangay when available
- local storage or synchronization status

### FR-REC-008 — Honest status text

Before synchronization exists, the UI shall use status text such as:

- `Saved on this device`
- `Local record`
- `Not yet connected to MAO`

The UI shall not show:

- `Synced to MAO`
- `Reviewed by MAO`
- `Approved`
- `Submitted`

unless a future backend provides evidence for that state.

### FR-REC-009 — Record details route

Selecting a record shall open a record-details route using the record UUID. The details screen shall query the database rather than reuse the active scan session.

### FR-REC-010 — Record details content

The details screen shall display:

- stored image or fallback
- predicted result
- confidence
- all class scores
- selected symptoms
- checklist consistency
- reported severity
- quality warnings
- barangay when available
- model version
- processing time
- saved date and time
- local/sync status
- decision-support disclaimer

### FR-REC-011 — Reactive refresh

Records shall reflect new saves and deletions without requiring the user to restart the app.

Drizzle live queries may be used inside feature hooks. Screens shall still depend on hooks rather than import the database directly.

---

### FR-DEL-001 — Confirmation

Record deletion shall require explicit confirmation. The confirmation shall state that the local record and saved image will be removed from the device.

### FR-DEL-002 — Related-row deletion

Deleting a scan record shall remove dependent class scores, symptoms, and warnings through foreign-key cascades or an explicit transaction.

### FR-DEL-003 — File deletion

The storage service shall attempt to delete the managed image after or as part of the application-level delete operation.

### FR-DEL-004 — Partial-failure handling

If database deletion succeeds but file deletion fails, the record shall remain deleted and the orphaned file shall be eligible for later cleanup.

If database deletion fails, the image shall not be deleted first.

### FR-DEL-005 — UI refresh

After successful deletion, Records and Reports shall update automatically or on route focus.

---

### FR-IMG-007 — Missing-file behavior

If a database record exists but its managed image is missing, the record details screen shall remain usable. It shall display an image-unavailable state rather than crash or hide the entire record.

### FR-IMG-008 — Record deletion cleanup

Deleting a scan record shall also attempt to delete its managed image. Database deletion and file cleanup behavior shall be documented and tested.

### FR-IMG-009 — Orphan cleanup

A maintenance function shall be designed to identify managed image files that do not correspond to a database record. Automatic deletion may be deferred, but the storage design shall not make orphan detection impossible.

---

### FR-RES-001 — Application restart

Saved records shall remain available after the app is closed, force-stopped, updated without data removal, and reopened.

## 12.2 Records screen

The Records screen shall retain the current design system but replace demonstration data with database-backed content.

Filters must align with the current stored model labels. The initial Model v0 supports Healthy, Mosaic, and Rust. The Records screen shall not present Smut or Downy Mildew as Model v0 filter results unless future migrations contain records from a model that supports those labels.

## 12.4 Accessibility

New controls and states shall include:

- meaningful accessibility labels
- disabled-state semantics
- accessible progress announcements
- accessible error announcements
- adequate text alternatives for missing images
- no information conveyed only through color

---

## Phase 4 — Records integration

Deliverables:

- database-backed list
- filters and search
- pagination
- details route
- empty, error, and missing-image states
- deletion flow

Exit criteria:

- no mock record source remains in the production Records screen
- records survive restart
- deleting updates the list


---

# Phase 5 — Reports Integration

**Repository:** `niks0501/caneguard-mobile`  
**Branch:** `feat/drizzle-sqlite-scan-records`  
**Stack:** Drizzle ORM + Expo SQLite + Expo FileSystem + Expo Crypto  
**Primary platform:** Android  
**Execution mode:** One phase at a time; do not continue past an unmet exit criterion


## Objective

Replace hardcoded production report values with efficient SQL aggregates over actual saved records. The Reports screen must summarize local observations honestly and must not imply confirmed disease cases, MAO submission, or unsupported model classes.

## Preconditions

- Phase 4 has real records and deletion.
- List and details use truthful local status.
- Read `01-SHARED-CONTRACT.md`.
- Confirm the initial date scope shown by the UI: all-time or current month.
- Repository aggregate functions must still accept an optional date range.

## Deliverables

- Report repository
- SQL aggregate queries
- total saved scans
- total healthy predictions
- total possible disease predictions
- counts grouped by stored predicted label
- count of local-only records
- low-top-score count with prototype wording
- recent local records
- optional date-range query contract
- zero-record state
- removal of hardcoded totals and fake submission wording
- UI and repository tests

## Execution steps

### 5.1 Create a dedicated report repository

Implement `getReportSummary(query)` using SQL aggregation. Keep it separate from route components.

Use:

- `COUNT`;
- conditional aggregation;
- grouping by predicted label;
- indexed date filtering;
- limited recent-record query.

Do not load all records into JavaScript merely to count them.

### 5.2 Define summary semantics

Calculate:

- total saved scans;
- healthy top predictions;
- possible disease top predictions;
- count by predicted label;
- local-only records;
- low top-score records;
- recent records.

“Possible disease” means a non-healthy model top label. It remains decision support, not confirmation.

### 5.3 Preserve supported-label integrity

Display stored model labels, with current UI expectations limited to Healthy, Mosaic, and Rust for Model v0.

Do not fabricate Smut, Downy Mildew, or other counts. A manually reported observation must remain distinct from an AI prediction if such a feature is added later.

### 5.4 Add date-range support in the query layer

The first UI may show all-time or current-month summaries, but the repository accepts optional start/end dates. Store and compare UTC values consistently; format dates locally in UI.

### 5.5 Replace all hardcoded report values

Remove hardcoded:

- totals;
- disease counts;
- pending counts;
- recent submissions.

When no records exist, show zeros and a Start Scan action.

### 5.6 Use truthful terminology

Preferred terms:

- `saved observations`
- `possible disease results`
- `AI predictions`
- `records by predicted class`
- `recent records`
- `saved on this device`

Avoid `cases` when it suggests confirmed disease. Rename `Recent submissions` to `Recent records` until submission exists.

### 5.7 Handle sync status accurately

Count `local_only` records. Do not show a fake pending queue or Sync to MAO action as though it works.

A future queue may show local-only records accurately or remain unavailable. This phase must not add network behavior.

### 5.8 Add report states

Support:

- loading;
- populated;
- zero records;
- database error;
- partial image absence in recent records.

### 5.9 Test aggregate correctness

Use deterministic fixtures with mixed labels, dates, confidence values, and statuses. Verify every displayed number against expected SQL results.

## Required verification

- No hardcoded production total remains.
- Zero-record report shows zeros.
- Totals match saved and deleted records.
- Counts group by exact stored label.
- Unsupported classes are not fabricated.
- Date-range contract works.
- Low-score count uses the existing presentation threshold only and labels it as a prototype rule.
- Aggregates run in SQL.
- Recent section says records, not submissions.
- Local-only status is truthful.
- No network or fake queue is added.
- Report updates after save/delete without restart.

## Stop conditions

Stop when:

- the screen counts records in JavaScript after loading all rows;
- hardcoded values remain in a production path;
- report terminology implies confirmed cases;
- unsupported diseases appear;
- a pending/synced value is fabricated;
- backend or sync work begins;
- report data no longer matches repository fixtures;
- date handling mixes local stored strings with UTC inconsistently.

## Exit criteria

- SQL aggregate repository exists.
- Actual summary tiles and grouped counts work.
- Recent local records work.
- Empty state works.
- No hardcoded production report values remain.
- Values match seeded and manually created records.
- Terminology is truthful and decision-support appropriate.
- Reports refresh after save and delete.

## Suggested commit

```text
feat(reports): calculate summaries from saved records
test(reports): cover local aggregate reporting
```

## Detailed source requirements

### FR-REP-001 — Replace hardcoded statistics

The Reports screen shall calculate its values from the local database. Hardcoded totals, disease counts, pending counts, and recent submissions shall be removed.

### FR-REP-002 — Required summary metrics

The initial local report shall include:

- total saved scans
- total healthy predictions
- total possible disease predictions
- count grouped by predicted label
- count of local-only records
- count of records with low top scores, using the existing presentation threshold only if clearly labeled as a prototype rule
- most recent saved observations

### FR-REP-003 — Supported-label integrity

Disease summaries shall reflect labels that exist in saved model results. The UI shall not count Downy Mildew, Smut, or another disease unless a model version actually produced that label or the record explicitly distinguishes a manually reported observation from an AI prediction.

### FR-REP-004 — Date-range support

Aggregate repository functions shall accept an optional date range. The first UI may use all-time or current-month data, but the query layer must not permanently hardcode one period.

### FR-REP-005 — Empty-state behavior

When no records exist, the Reports screen shall show zero values and a clear call to perform a scan. It shall not display demonstration cases.

### FR-REP-006 — Aggregate efficiency

Reports shall use SQL aggregate queries such as `COUNT`, grouping, and indexed date filtering. The screen shall not load every record into JavaScript merely to count them.

### FR-REP-007 — Recent records

The recent-submissions section shall be renamed to `Recent records` or another truthful local term until real submission is implemented.

---

### FR-SYNC-005 — No fake queue

A Sync Queue interface shall not display fabricated pending items. Until a backend and sync contract exist, the queue may show locally stored records as local-only, or remain unavailable with an accurate explanation.

### FR-SYNC-006 — Backend independence

Local repositories shall not depend on Laravel, Firebase, Supabase, or another backend SDK. Future synchronization shall consume repository data through a separate application service.

## 12.3 Reports screen

The Reports screen shall distinguish:

- AI predictions
- healthy predictions
- locally saved records
- future synchronization states

It shall not use the term `cases` as though each model prediction is a medically or agriculturally confirmed disease case. Preferred wording includes:

- `saved observations`
- `possible disease results`
- `AI predictions`
- `records by predicted class`

## Phase 5 — Reports integration

Deliverables:

- SQL aggregate repository
- actual summary tiles
- counts by stored model label
- recent local records
- truthful local-only wording

Exit criteria:

- no hardcoded production report totals remain
- report values match seeded and manually created records


---

# Phase 6 — Reliability and Release Verification

**Repository:** `niks0501/caneguard-mobile`  
**Branch:** `feat/drizzle-sqlite-scan-records`  
**Stack:** Drizzle ORM + Expo SQLite + Expo FileSystem + Expo Crypto  
**Primary platform:** Android  
**Execution mode:** One phase at a time; do not continue past an unmet exit criterion


## Objective

Prove the complete local-persistence feature is safe to release: migrations upgrade without data loss, queries meet agreed performance targets, offline and restart behavior work on Android, error states are reviewed, documentation is current, and the branch contains no fake production data or temporary debug artifacts.

This phase is verification and hardening. It must not become an opportunity to add authentication, backend sync, or unrelated features.

## Preconditions

- Phases 0–5 passed.
- Real scan save, Records, Details, Delete, and Reports work.
- Target Android device is identified.
- Read `01-SHARED-CONTRACT.md`.
- All unresolved open decisions are documented.

## Deliverables

- Full migration upgrade test
- 5,000-record performance fixture
- Performance measurements
- Physical-device acceptance record
- Airplane-mode evidence
- Application restart evidence
- App-update migration evidence
- Error-state review
- Security/privacy review
- Accessibility review
- Final lint/type/test/Expo Doctor/build results
- Updated architecture documentation
- Final requirement traceability
- Worktree and branch cleanup
- Release/handoff record

## Execution steps

### 6.1 Run the complete automated verification suite

Run:

```bash
npm ci
npm run lint
npx tsc --noEmit
npm test -- --runInBand
npx expo-doctor
```

Run any approved native/database test harness separately. Do not treat mocks as proof of native SQLite behavior.

### 6.2 Verify migration paths

Test:

- empty database to latest;
- immediately preceding schema to latest;
- repeated startup;
- foreign-key enforcement;
- migration bundle resolution;
- migration-error presentation;
- seeded prior-version data preservation;
- app update installation without clearing data.

No production migration may delete records unexpectedly.

### 6.3 Run performance fixtures

Seed 5,000 realistic records with child scores and mixed optional data.

Measure on the agreed Android device:

- normal cold-start migration check: target within 2 seconds;
- typical scan save including image copy: target within 2 seconds;
- first page of 50 records: target within 500 ms;
- report aggregate queries: target within 500 ms;
- scrolling responsiveness.

These are engineering acceptance targets, not universal public claims. When a target fails, profile before changing it.

### 6.4 Run physical-device acceptance

Perform every step listed in the source acceptance procedure:

1. Complete a scan.
2. Save while offline.
3. Close and reopen.
4. Confirm record remains.
5. Open details.
6. Confirm image.
7. Confirm filters.
8. Confirm Reports values.
9. Delete.
10. Confirm removal from Records and Reports.
11. Confirm image deletion or orphan marking.
12. Verify rapid repeated taps do not duplicate.
13. Install an update with a new migration and preserve records.

Record device model, Android version, build profile, app version, commit SHA, and results.

### 6.5 Review all error states

Exercise:

- database not ready;
- database open failure where safely simulatable;
- migration failure;
- invalid scan;
- image copy failure;
- image missing;
- save transaction failure;
- record not found;
- query failure;
- delete failure;
- image delete failure;
- duplicate record.

Confirm user messages are actionable and do not expose SQL, stack traces, or sensitive paths.

### 6.6 Review security and privacy

Confirm:

- no passwords in SQLite;
- no tokens in SQLite or AsyncStorage;
- no silent upload;
- no automatic GPS;
- barangay is user-provided/confirmed or null;
- user values are parameterized;
- logs omit image bytes, full payloads, credentials, personal information, and avoid full paths;
- UI discloses local storage and uninstall/app-data loss behavior.

### 6.7 Review data and UI honesty

Confirm:

- AI predictions are not diagnoses;
- Reports do not call predictions confirmed cases;
- Smut and Downy Mildew are not presented as Model v0 outputs;
- local records do not claim sync, submission, approval, or MAO review;
- hardcoded demonstration locations are not saved;
- mock production records/totals are gone.

### 6.8 Review accessibility

Confirm:

- progress is announced;
- errors are announced;
- controls have meaningful labels;
- disabled state is exposed;
- missing images have useful alternatives;
- status is not color-only.

### 6.9 Clean and document the branch

Remove:

- temporary databases;
- generated seed output;
- unapproved debug routes or keep `/storage-debug` behind `__DEV__`;
- compatibility-only Phase 0 artifacts no longer required;
- console debugging;
- stale mock production data.

Update:

- storage architecture;
- migration workflow;
- developer commands;
- test record;
- known limitations;
- rollback notes;
- future phase boundaries.

### 6.10 Complete final traceability

Use `09-TRACEABILITY-MATRIX.md`. Mark each requirement as implemented, verified, deferred by approved scope, or blocked. A requirement cannot be marked verified without evidence.

## Required verification

- Full automated suite passes or an external limitation is explicitly documented.
- Android development/preview build passes.
- Model loads and runs.
- Offline save/list/details/report/delete works.
- Restart persistence works.
- Migration upgrade preserves data.
- 5,000-record targets pass or are profiled and formally dispositioned.
- All error states are reviewed.
- Security/privacy rules pass.
- Accessibility review passes.
- No production mock or false status remains.
- Worktree is clean.
- Physical-device record is complete.

## Stop conditions

Stop release when:

- migration upgrade loses data;
- model integration regresses;
- save produces duplicates or partial records;
- app requires network for local features;
- report values disagree with database;
- missing images crash the app;
- production code auto-deletes database on failure;
- fake sync/review status remains;
- unsupported model labels remain in prediction UI;
- performance failure is ignored rather than profiled;
- device validation is unperformed;
- temporary debug or seeded data remains.

## Exit criteria

- Definition of Done is satisfied.
- Manual Android acceptance test passes.
- Migration and performance evidence exists.
- Documentation and traceability are current.
- Branch has no temporary database or generated debug data.
- Worktree is clean.
- Final commit SHA and build evidence are recorded.
- Feature is ready for pull-request review.

## Suggested commits

```text
test(storage): cover migrations and persistence workflows
perf(storage): add local records performance fixture
docs(storage): complete local persistence release evidence
chore(storage): clean persistence feature branch
```

## Source non-functional requirements

## 14. Non-Functional Requirements

## Source testing requirements

## 16. Testing Requirements

## Source acceptance criteria

## 21. Acceptance Criteria

The feature is accepted only when all of the following are true:

- [ ] Drizzle ORM uses Expo SQLite successfully in an Android development build.
- [ ] Generated migrations are bundled and applied at startup.
- [ ] The existing TensorFlow Lite model still loads and runs.
- [ ] A completed real scan can be saved without internet.
- [ ] The image used for analysis is copied to managed app storage.
- [ ] Saved results survive an app restart.
- [ ] All model class scores are preserved.
- [ ] Selected symptoms, severity, quality warnings, model version, and timings are preserved when available.
- [ ] Rapid repeated taps do not create duplicate records.
- [ ] A failed child insert rolls back the full database transaction.
- [ ] Failed database writes do not falsely show success.
- [ ] Records no longer use mock production data.
- [ ] Reports no longer use hardcoded production totals.
- [ ] Records are ordered newest first.
- [ ] Search, supported-label filtering, and pagination work.
- [ ] Record details do not depend on the active scan context.
- [ ] Missing image files produce a fallback state rather than a crash.
- [ ] Deleting a record removes dependent rows and attempts image cleanup.
- [ ] Reports use SQL aggregates rather than loading every record.
- [ ] The UI does not claim that local records were synced or reviewed by the MAO.
- [ ] The UI does not present unsupported model classes as current AI outputs.
- [ ] No password, access token, or authentication secret is stored in SQLite.
- [ ] Migrations preserve records from the previous schema version.
- [ ] Lint, TypeScript, tests, Expo Doctor, and the approved Android build checks pass or have explicitly documented external limitations.
- [ ] A physical-device acceptance test record is completed.

---

## Source Definition of Done

## 22. Definition of Done

The feature is done when it delivers a complete local workflow, not merely when packages are installed.

```text
Real scan
→ Real model result
→ User saves record
→ Managed image and structured metadata persist
→ Record survives restart
→ Record appears in Records
→ Record contributes to Reports
→ User can inspect and delete it
```

The branch must contain documentation, migrations, tests, error states, and device evidence. Mock values must not remain in production paths that claim to represent stored records or reports.

---

## Source risks and mitigations

## 23. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Drizzle Expo packages are incompatible with the current SDK | Build or runtime failure | Complete Phase 0 compatibility spike and pin tested versions |
| Migration SQL is not bundled by Metro | Database initialization failure | Configure SQL source extension and migration import; verify Android bundle |
| New Metro/Babel changes break TFLite assets | Model integration regression | Run model smoke test after configuration changes |
| Camera/gallery URI is temporary | Historical image disappears | Copy image into documents storage before committing the record |
| Image copy succeeds but DB save fails | Orphan file | Compensating deletion and orphan scan |
| DB deletion succeeds but image deletion fails | Storage leak | Log and detect orphan for cleanup |
| Records grow and list becomes slow | Poor UX | Pagination, indexed queries, lightweight list projections |
| Reports load all rows into JavaScript | Memory and speed issue | SQL aggregate queries |
| UI continues showing unsupported diseases | Misleading result interpretation | Derive AI filters and summaries from model/stored labels |
| Future backend requires a new ID | Duplicate sync or migration complexity | Stable local UUID and nullable remote ID |
| Team treats ORM as a replacement for database knowledge | Incorrect schema or inefficient queries | Review generated SQL and document indexes/transactions |
| Developer resets database to fix migration errors | Data loss | No destructive production fallback; dev-only reset |
| Authentication is mixed into this branch | Scope and schedule failure | Keep auth and backend explicitly out of scope |

---

## Source open decisions

## 24. Open Decisions Before Implementation

The team shall resolve these during Phase 0 or Phase 1:

1. Which tested Drizzle ORM and Drizzle Kit versions are compatible with Expo SDK 57?
2. Will the repository use Drizzle `useLiveQuery`, route-focus refresh, or a combination?
3. What database file name will remain stable through production?
4. Will the first version store the full original image only, or also generate a list thumbnail?
5. Is barangay optional during the prototype, or will save require a user-confirmed barangay?
6. What verified source will provide the controlled Nasugbu barangay list?
7. What first-page record count gives acceptable performance and usability?
8. Will deletion be permanent immediately, or will a future soft-delete migration be introduced before synchronization?
9. Which target Android device will be used for the performance and physical-device acceptance record?
10. Should a user receive a warning when starting a new scan without saving the current result?

Unresolved decisions shall not be silently guessed by the coding agent.

---

## Source implementation phase

## Phase 6 — Reliability and release verification

Deliverables:

- migration upgrade test
- 5,000-record performance fixture
- physical-device acceptance record
- error-state review
- documentation update
- branch cleanup

Exit criteria:

- Definition of Done is satisfied
- manual Android acceptance test passes
- worktree contains no temporary database or generated debug data

---


---

# Requirement Traceability Matrix

**Repository:** `niks0501/caneguard-mobile`  
**Branch:** `feat/drizzle-sqlite-scan-records`  
**Stack:** Drizzle ORM + Expo SQLite + Expo FileSystem + Expo Crypto  
**Primary platform:** Android  
**Execution mode:** One phase at a time; do not continue past an unmet exit criterion


## How to use this file

Update the status and evidence columns at each phase handoff.

Allowed status values:

- `Not started`
- `In progress`
- `Implemented`
- `Verified`
- `Deferred by approved scope`
- `Blocked`

Do not mark a requirement `Verified` without a test, build, device record, screenshot, query result, or other concrete evidence.

## Functional and security requirement coverage

| ID | Requirement | Planned phase | Status | Evidence |
|---|---|---|---|---|
| `FR-DB-001` | Database creation | Phase 1 | ☐ | Evidence pending |
| `FR-DB-002` | Root-level database availability | Phase 1 | ☐ | Evidence pending |
| `FR-DB-003` | Migration gate | Phase 1 | ☐ | Evidence pending |
| `FR-DB-004` | Database configuration | Phase 1 | ☐ | Evidence pending |
| `FR-DB-005` | Single source of schema truth | Phase 1 | ☐ | Evidence pending |
| `FR-MIG-001` | Generated migrations | Phase 1 | ☐ | Evidence pending |
| `FR-MIG-002` | Forward-only production migration policy | Phase 1 | ☐ | Evidence pending |
| `FR-MIG-003` | Idempotent startup | Phase 1 | ☐ | Evidence pending |
| `FR-MIG-004` | Empty-database support | Phase 1 | ☐ | Evidence pending |
| `FR-MIG-005` | Upgrade support | Phase 1 | ☐ | Evidence pending |
| `FR-MIG-006` | No runtime schema improvisation | Phase 1 | ☐ | Evidence pending |
| `FR-MIG-007` | Migration failure visibility | Phase 1 | ☐ | Evidence pending |
| `FR-IMG-001` | Managed directory | Phase 2 | ☐ | Evidence pending |
| `FR-IMG-002` | Database reference | Phase 2 | ☐ | Evidence pending |
| `FR-IMG-003` | Source preservation | Phase 2 | ☐ | Evidence pending |
| `FR-IMG-004` | Stable file naming | Phase 2 | ☐ | Evidence pending |
| `FR-IMG-005` | File metadata | Phase 2 | ☐ | Evidence pending |
| `FR-IMG-006` | Compensating cleanup | Phase 2 | ☐ | Evidence pending |
| `FR-IMG-007` | Missing-file behavior | Phase 2 / Phase 4 / Phase 6 | ☐ | Evidence pending |
| `FR-IMG-008` | Record deletion cleanup | Phase 2 / Phase 4 / Phase 6 | ☐ | Evidence pending |
| `FR-IMG-009` | Orphan cleanup | Phase 2 / Phase 4 / Phase 6 | ☐ | Evidence pending |
| `FR-SAVE-001` | Eligibility | Phase 3 | ☐ | Evidence pending |
| `FR-SAVE-002` | Explicit save action | Phase 3 | ☐ | Evidence pending |
| `FR-SAVE-003` | Save-state feedback | Phase 3 | ☐ | Evidence pending |
| `FR-SAVE-004` | Duplicate-tap protection | Phase 3 | ☐ | Evidence pending |
| `FR-SAVE-005` | Transactional metadata write | Phase 3 | ☐ | Evidence pending |
| `FR-SAVE-006` | Captured data | Phase 3 | ☐ | Evidence pending |
| `FR-SAVE-007` | UTC timestamps | Phase 3 | ☐ | Evidence pending |
| `FR-SAVE-008` | Confidence storage | Phase 3 | ☐ | Evidence pending |
| `FR-SAVE-009` | Model-output integrity | Phase 3 | ☐ | Evidence pending |
| `FR-SAVE-010` | Decision-support wording | Phase 3 | ☐ | Evidence pending |
| `FR-SAVE-011` | Barangay handling | Phase 3 | ☐ | Evidence pending |
| `FR-SAVE-012` | Post-save behavior | Phase 3 | ☐ | Evidence pending |
| `FR-REC-001` | Replace mock data | Phase 4 | ☐ | Evidence pending |
| `FR-REC-002` | Default ordering | Phase 4 | ☐ | Evidence pending |
| `FR-REC-003` | Pagination | Phase 4 | ☐ | Evidence pending |
| `FR-REC-004` | Filtering | Phase 4 | ☐ | Evidence pending |
| `FR-REC-005` | Search | Phase 4 | ☐ | Evidence pending |
| `FR-REC-006` | State handling | Phase 4 | ☐ | Evidence pending |
| `FR-REC-007` | Record cards | Phase 4 | ☐ | Evidence pending |
| `FR-REC-008` | Honest status text | Phase 4 | ☐ | Evidence pending |
| `FR-REC-009` | Record details route | Phase 4 | ☐ | Evidence pending |
| `FR-REC-010` | Record details content | Phase 4 | ☐ | Evidence pending |
| `FR-REC-011` | Reactive refresh | Phase 4 | ☐ | Evidence pending |
| `FR-REP-001` | Replace hardcoded statistics | Phase 5 | ☐ | Evidence pending |
| `FR-REP-002` | Required summary metrics | Phase 5 | ☐ | Evidence pending |
| `FR-REP-003` | Supported-label integrity | Phase 5 | ☐ | Evidence pending |
| `FR-REP-004` | Date-range support | Phase 5 | ☐ | Evidence pending |
| `FR-REP-005` | Empty-state behavior | Phase 5 | ☐ | Evidence pending |
| `FR-REP-006` | Aggregate efficiency | Phase 5 | ☐ | Evidence pending |
| `FR-REP-007` | Recent records | Phase 5 | ☐ | Evidence pending |
| `FR-SYNC-001` | Stable local identity | Phase 3 | ☐ | Evidence pending |
| `FR-SYNC-002` | Synchronization states | Phase 3 | ☐ | Evidence pending |
| `FR-SYNC-003` | Future remote identifier | Phase 3 | ☐ | Evidence pending |
| `FR-SYNC-004` | Future retry metadata | Phase 3 | ☐ | Evidence pending |
| `FR-SYNC-005` | No fake queue | Phase 3 | ☐ | Evidence pending |
| `FR-SYNC-006` | Backend independence | Phase 3 | ☐ | Evidence pending |
| `FR-SYNC-007` | Future idempotency | Phase 3 | ☐ | Evidence pending |
| `FR-DEL-001` | Confirmation | Phase 4 | ☐ | Evidence pending |
| `FR-DEL-002` | Related-row deletion | Phase 4 | ☐ | Evidence pending |
| `FR-DEL-003` | File deletion | Phase 2 / Phase 4 / Phase 6 | ☐ | Evidence pending |
| `FR-DEL-004` | Partial-failure handling | Phase 2 / Phase 4 / Phase 6 | ☐ | Evidence pending |
| `FR-DEL-005` | UI refresh | Phase 4 | ☐ | Evidence pending |
| `FR-RES-001` | Application restart | Phase 4 / Phase 6 | ☐ | Evidence pending |
| `FR-RES-002` | Save interruption | Phase 3 / Phase 6 | ☐ | Evidence pending |
| `FR-RES-003` | Atomic dependent data | Phase 3 / Phase 6 | ☐ | Evidence pending |
| `FR-RES-004` | Validation before write | Phase 3 / Phase 6 | ☐ | Evidence pending |
| `FR-RES-005` | Database error isolation | Phase 3 / Phase 6 | ☐ | Evidence pending |
| `FR-RES-006` | Corruption behavior | Phase 1 / Phase 6 | ☐ | Evidence pending |
| `FR-RES-007` | Referential integrity | Phase 1 / Phase 6 | ☐ | Evidence pending |
| `SEC-001` | No passwords | Phase 3 / Phase 6 | ☐ | Evidence pending |
| `SEC-002` | No auth tokens | Phase 3 / Phase 6 | ☐ | Evidence pending |
| `SEC-003` | Parameterized queries | Phase 3 / Phase 6 | ☐ | Evidence pending |
| `SEC-004` | No silent upload | Phase 3 / Phase 6 | ☐ | Evidence pending |
| `SEC-005` | Location minimization | Phase 3 / Phase 6 | ☐ | Evidence pending |
| `SEC-006` | Logging | Phase 3 / Phase 6 | ☐ | Evidence pending |
| `SEC-007` | Local disclosure | Phase 3 / Phase 6 | ☐ | Evidence pending |

## Original-section coverage

| Original section | Destination in phase packet |
|---|---|
| 1. Purpose | 01-SHARED-CONTRACT.md |
| 2. Product Context | 01-SHARED-CONTRACT.md |
| 3. Architecture Decision | 01-SHARED-CONTRACT.md; Phase 0 and Phase 1 |
| 4. Goals | 01-SHARED-CONTRACT.md |
| 5. Non-Goals | 01-SHARED-CONTRACT.md |
| 6. Users and Stakeholders | 01-SHARED-CONTRACT.md |
| 7. Core User Stories | 01-SHARED-CONTRACT.md |
| 8.1 Database Initialization | Phase 1 |
| 8.2 Migration Management | Phase 1 |
| 8.3 Persistent Image Management | Phase 2, Phase 4, Phase 6 |
| 8.4 Saving Completed Scan Results | Phase 3 |
| 8.5 Records List | Phase 4 |
| 8.6 Reports and Aggregates | Phase 5 |
| 8.7 Local Synchronization Readiness | Phase 3 |
| 8.8 Record Deletion | Phase 4 |
| 8.9 Recovery and Data Integrity | Phases 1, 3, 4, and 6 |
| 9. Proposed Data Model | Phase 1 |
| 10. Domain and Repository Contracts | Phase 1; implemented across Phases 2–5 |
| 11. Save Transaction Workflow | Phase 3 |
| 12. UI and Experience Requirements | Phases 3–5 |
| 13. Error Model | Phase 1; exercised Phases 2–6 |
| 14. Non-Functional Requirements | Phase 6; applied throughout |
| 15. Security and Privacy Requirements | Phase 3 and Phase 6 |
| 16. Testing Requirements | Phase-specific tests; final Phase 6 |
| 17. Developer and Debugging Requirements | Phase 1 and Phase 6 |
| 18. Proposed Project Structure | Phase 1; evolved minimally in later phases |
| 19. Implementation Phases | Files 02–08 |
| 20. Suggested Commit Plan | Distributed per phase |
| 21. Acceptance Criteria | Phase 6 |
| 22. Definition of Done | Phase 6 |
| 23. Risks and Mitigations | Phase 0–6; final review Phase 6 |
| 24. Open Decisions | Resolved in relevant phases; final review Phase 6 |
| 25. Future Enhancements | 01-SHARED-CONTRACT.md |
| 26. Coding Agent Guardrails | 01-SHARED-CONTRACT.md and every phase |
| 27. Requirement Traceability Summary | This file |
| 28. Final Technical Direction | 01-SHARED-CONTRACT.md |

## Cross-phase release checklist

## 21. Acceptance Criteria

The feature is accepted only when all of the following are true:

- [ ] Drizzle ORM uses Expo SQLite successfully in an Android development build.
- [ ] Generated migrations are bundled and applied at startup.
- [ ] The existing TensorFlow Lite model still loads and runs.
- [ ] A completed real scan can be saved without internet.
- [ ] The image used for analysis is copied to managed app storage.
- [ ] Saved results survive an app restart.
- [ ] All model class scores are preserved.
- [ ] Selected symptoms, severity, quality warnings, model version, and timings are preserved when available.
- [ ] Rapid repeated taps do not create duplicate records.
- [ ] A failed child insert rolls back the full database transaction.
- [ ] Failed database writes do not falsely show success.
- [ ] Records no longer use mock production data.
- [ ] Reports no longer use hardcoded production totals.
- [ ] Records are ordered newest first.
- [ ] Search, supported-label filtering, and pagination work.
- [ ] Record details do not depend on the active scan context.
- [ ] Missing image files produce a fallback state rather than a crash.
- [ ] Deleting a record removes dependent rows and attempts image cleanup.
- [ ] Reports use SQL aggregates rather than loading every record.
- [ ] The UI does not claim that local records were synced or reviewed by the MAO.
- [ ] The UI does not present unsupported model classes as current AI outputs.
- [ ] No password, access token, or authentication secret is stored in SQLite.
- [ ] Migrations preserve records from the previous schema version.
- [ ] Lint, TypeScript, tests, Expo Doctor, and the approved Android build checks pass or have explicitly documented external limitations.
- [ ] A physical-device acceptance test record is completed.

---

## Final workflow

## 22. Definition of Done

The feature is done when it delivers a complete local workflow, not merely when packages are installed.

```text
Real scan
→ Real model result
→ User saves record
→ Managed image and structured metadata persist
→ Record survives restart
→ Record appears in Records
→ Record contributes to Reports
→ User can inspect and delete it
```

The branch must contain documentation, migrations, tests, error states, and device evidence. Mock values must not remain in production paths that claim to represent stored records or reports.

---


## Original suggested commit plan

## 20. Suggested Commit Plan

```text
chore(storage): add Drizzle and Expo persistence dependencies
build(storage): configure Drizzle migration bundling
feat(storage): initialize CaneGuard SQLite database
feat(storage): define local scan record schema and migrations
feat(records): add managed scan image storage
feat(records): add transactional scan record repository
feat(records): save completed analysis results locally
feat(records): replace mock records with local database data
feat(records): add local record details and deletion
feat(reports): calculate summaries from saved records
test(storage): cover migrations and persistence workflows
docs(storage): document local persistence architecture
```

Each commit should preserve or restore passing lint and type checks. Large generated migration artifacts may be committed with the schema change that produced them.

---

## Original requirement traceability summary

## 27. Requirement Traceability Summary

| Product need | Primary requirements |
|---|---|
| Offline scan history | FR-DB, FR-IMG, FR-SAVE, FR-REC |
| Durable AI result | FR-SAVE-006 to FR-SAVE-010 |
| Real Records screen | FR-REC-001 to FR-REC-011 |
| Real Reports screen | FR-REP-001 to FR-REP-007 |
| Future backend readiness | FR-SYNC-001 to FR-SYNC-007 |
| Data integrity | FR-MIG, FR-RES, transaction workflow |
| Maintainability | Drizzle schema, repositories, migrations |
| Field practicality | Offline NFR and managed local files |
| Honest decision support | FR-SAVE-010, FR-REC-008, FR-REP-003 |
| Safe deletion | FR-DEL and FR-IMG-008 |
| Release confidence | Testing requirements and acceptance criteria |

---


---

# Phase Handoff Template

**Repository:** `niks0501/caneguard-mobile`  
**Branch:** `feat/drizzle-sqlite-scan-records`  
**Stack:** Drizzle ORM + Expo SQLite + Expo FileSystem + Expo Crypto  
**Primary platform:** Android  
**Execution mode:** One phase at a time; do not continue past an unmet exit criterion


Copy this template into the phase's build record.

## Phase

`Phase X — Name`

## Baseline

- Starting commit:
- Ending commit:
- Branch:
- Date:
- Developer/agent:
- Android device/build environment:

## Scope completed

- 
- 
- 

## Files created

- 

## Files modified

- 

## Decisions resolved

| Decision | Choice | Rationale |
|---|---|---|
|  |  |  |

## Commands and checks

| Command/check | Result | Evidence/notes |
|---|---|---|
| `npm run lint` |  |  |
| `npx tsc --noEmit` |  |  |
| `npm test -- --runInBand` |  |  |
| `npx expo-doctor` |  |  |
| Android build/export |  |  |
| Model smoke test |  |  |
| Phase-specific tests |  |  |

## Requirement evidence

| Requirement ID | Status | Evidence |
|---|---|---|
|  |  |  |

## Device/manual verification

- Test device:
- Android version:
- Build profile/artifact:
- Steps performed:
- Results:

## Warnings and limitations

- 

## Stop conditions encountered

- None / describe:

## Rollback notes

- 

## Worktree status

```bash
git status
```

Result:

```text

```

## Handoff decision

- [ ] Phase exit criteria passed.
- [ ] Next phase may begin.
- [ ] Next phase is blocked.

Reason:

