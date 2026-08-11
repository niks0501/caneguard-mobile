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
