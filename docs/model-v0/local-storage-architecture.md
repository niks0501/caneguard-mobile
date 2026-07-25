# CaneGuard Local Storage Architecture

## Scope

CaneGuard stores completed scan metadata in `caneguard.db` through Drizzle ORM
and Expo SQLite. Scan images are stored separately in the application documents
directory. Authentication, uploads, and backend synchronization are outside this
feature.

## Dependency Direction

```text
Routes and UI
  -> feature hooks and application services
  -> repository contracts and implementations
  -> Drizzle ORM
  -> Expo SQLite
```

Routes must not import `src/database/schema.ts`. File operations are owned by the
managed image service introduced in Phase 2.

## Database Lifecycle

- `CANEGUARD_DATABASE_FILENAME` in `src/database/database.ts` is the only
  database filename definition.
- `CaneGuardDatabaseProvider` opens the shared connection, enables and verifies
  foreign keys, applies bundled migrations, and gates its children until ready.
- Initialization states are `migrating`, `ready`, and `error`.
- An initialization failure shows a retry action with a stable, sanitized error
  message. Production code never resets or deletes the database automatically.
- Write-ahead logging remains disabled until verified on the approved Android
  device.

## Schema

The application schema contains:

- `scan_records`
- `scan_class_scores`
- `scan_symptoms`
- `scan_quality_warnings`

Child rows use composite primary keys and cascade when their parent record is
deleted. Confidence and score values are stored from `0` to `1`. Timings are
non-negative real values. Timestamps are UTC ISO 8601 text supplied by the
application. Images are referenced by URI and metadata; image bytes are not
stored in SQLite.

The Phase 0 `compatibility_probe` table is absent from the application schema but
is intentionally retained in databases upgraded from Phase 0. Migration
`0001_loving_amazoness.sql` does not drop it so upgrade evidence is preserved.
It is not read or written by production application code.

## Query Decisions

- Initial Records page size: 25.
- Refresh strategy: route-focus refresh. Live queries may be introduced inside
  feature hooks only when they provide a measured benefit.
- Barangay remains nullable until a verified user input source exists.
- Records use hard deletion. There is no recovery bin or soft-delete behavior.
- Reports must use SQL aggregate queries and optional date-range filters.

## Migration Workflow

1. Change `src/database/schema.ts`.
2. Run `npm run db:generate`.
3. Review generated SQL and snapshot metadata.
4. Run `npm run db:check`.
5. Run migration tests against an empty database and the immediately preceding
   schema.
6. Commit schema, SQL, snapshots, tests, and relevant documentation together.

Migrations are forward-only. A release rollback uses the prior application build
without deleting the database; a corrective forward migration is required for a
bad schema change.
