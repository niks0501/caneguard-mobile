# Phase 0 Compatibility Record

**Date:** 2026-07-25  
**Branch:** `feat/drizzle-sqlite-scan-records`  
**Baseline commit:** `1004435c9652381f1508a41e3600c861df1f4672`  
**Status:** Local compatibility evidence complete; Android development-build and physical-device evidence pending.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Expo-managed packages | `expo-sqlite`, `expo-file-system`, and `expo-crypto` `~57.0.1` | Expo's SDK 57 documentation lists this compatible version line. Installed through `npx expo install`. |
| Drizzle ORM | `drizzle-orm` `0.45.2` | Latest stable npm release at implementation time; no `rc`, beta, or next tag used. |
| Drizzle Kit | `drizzle-kit` `0.31.10` | Latest stable npm release at implementation time; supports `dialect: 'sqlite'` and `driver: 'expo'`. |
| SQL migration bundling | `babel-plugin-inline-import` `3.0.0`, `.sql` in Metro source extensions | Drizzle's Expo migration integration requires SQL imports to be bundled as strings. |
| Database filename | `caneguard.db` | A single stable filename, defined once in the Phase 0 database module and retained for the Phase 1 in-place upgrade. |
| Refresh strategy | Route-focus refresh is the Phase 1 baseline; live queries remain an optional later optimization | Drizzle exposes Expo live queries, but no device validation has yet proven change-listener behavior for this app. |
| Android acceptance device | Pending team selection | Required before Phase 6 performance and physical-device acceptance. |

## Scope and generated artifacts

- `compatibility_probe` is the Phase 0-only table. It proves Drizzle schema generation, SQL migration bundling, and runtime migration application.
- `drizzle/0000_complex_johnny_blaze.sql`, `drizzle/migrations.js`, and `drizzle/meta/*` are generated artifacts and must be replaced or formally upgraded by Phase 1's approved schema migration.
- The developer-only `/storage-compatibility` route applies the migration, writes a single probe row, and reads it back. It surfaces migration failure instead of resetting local data.
- No final scan schema, image storage, Records, Reports, authentication, backend, or synchronization behavior was added.

## Local verification evidence

| Command/check | Result | Evidence |
|---|---|---|
| `npm run lint` baseline | Pass | Completed before dependency changes. |
| `npx --no-install tsc --noEmit` baseline | Pass | Completed before dependency changes. |
| `npm test -- --runInBand` baseline | Pass | 23 suites, 131 tests. |
| `npx --no-install drizzle-kit generate` | Pass | Generated one SQLite migration for `compatibility_probe`. |
| `npm run lint` post-change | Pass | Completed after configuration and spike-route changes. |
| `npx --no-install tsc --noEmit` post-change | Pass | Completed after configuration and spike-route changes. |
| `npm test -- --runInBand` post-change | Pass | 23 suites, 131 tests. |
| `npx --no-install expo-doctor` | Pass | 20/20 checks passed. |
| `npx --no-install expo export --platform android --output-dir /tmp/caneguard-phase0-export` | Pass | Android Hermes bundle built; it includes `CREATE TABLE compatibility_probe`, and the export listed `assets/models/caneguard_leaf_v0_1_baseline.tflite`. |
| `npm audit --omit=dev --json` | Review required | 37 advisories (11 moderate, 26 high), none naming a newly added direct dependency. The report includes existing Expo, React Native, and Jest dependency paths; no unsafe downgrade or broad upgrade was applied in this phase. |

## Remaining required evidence and stop condition

Phase 0 cannot exit yet. Before Phase 1 begins, run an EAS development or preview Android build, install it on the approved device, and record:

1. build profile and artifact/build identifier;
2. Android device and version;
3. the `/storage-compatibility` migration result on first and second launch;
4. persistence after restart;
5. `/model-smoke-test` success and one real inference path;
6. confirmation that no New Architecture regression occurred.

Do not start Phase 1 until that evidence is recorded. Do not use an automatic destructive reset if migration application fails.

## Rollback

Revert this Phase 0 change set as one unit: the Drizzle and Expo package additions, `app.json` SQLite plugin entry, Babel and Metro SQL-bundling configuration, `drizzle/` generated artifacts, and the developer-only compatibility route/module. This removes the compatibility-only database path; it does not require deleting any user database automatically.
