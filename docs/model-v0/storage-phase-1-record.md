# Storage Phase 1 Database Foundation Record

## Decisions

- Database filename: `caneguard.db`, retained from Phase 0.
- Refresh: route-focus refresh, with database access kept inside feature hooks.
- WAL: deferred until Android device verification.
- Initial page size: 25.
- Barangay: nullable until a verified user input source exists.
- Deletion: hard delete with foreign-key cascades.
- Phase 0 upgrade: preserve the legacy probe table and its seeded row; remove all
  runtime compatibility-probe code.

## Deliverables

- Four-table Drizzle schema with inferred row types, constraints, cascades, and
  query indexes.
- Generated `0001_loving_amazoness.sql` migration and snapshot.
- Root `CaneGuardDatabaseProvider` with migrating, ready, error, and retry
  behavior.
- Verified foreign-key initialization without destructive fallback.
- Stable storage error model.
- Domain types, mapper boundary, and repository contracts.
- Developer-only `/storage-debug` diagnostics route.
- Clean-install, Phase 0 upgrade, constraint, cascade, initialization, provider,
  and error tests.
- Architecture and migration workflow documentation.

## Migration Review

Drizzle Kit generated the four approved tables, constraints, foreign keys, and
indexes. The generated `DROP TABLE compatibility_probe` statement was removed
during review because Phase 1 requires seeded prior-version data preservation.
The legacy table is not part of the application schema or production data path.

## Verification Evidence

- `npm run db:generate`: generated migration and snapshot after explicit
  create-table conflict resolution.
- `npm run db:check`: passed.
- `npm test -- --runInBand src/database`: 4 suites, 10 tests passed.
- `just verify-targeted`: lint and TypeScript passed.
- `npm test -- --runInBand`: 27 suites, 141 tests passed, including the existing
  model smoke suite.
- `git diff --check`: passed.

Native Android database initialization, migration presentation, and
foreign-key behavior remain a required device-level check. They must not be
inferred from Node SQLite or Jest tests. Phase 0 contains the prior approved
Expo SQLite/migration bundle compatibility record.

## Rollback

Return to the prior application commit without deleting `caneguard.db`. Do not
reset production storage. If the schema must change again, create a forward-only
corrective migration.
