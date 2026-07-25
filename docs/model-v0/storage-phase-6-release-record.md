# Storage Phase 6 Reliability and Release Record

## Scope And Identity

- Branch: `feat/drizzle-sqlite-scan-records`
- Application version: `1.0.0`
- Verified reliability commit: `c58f215`
- Primary platform: Android
- Native acceptance status: blocked, not run

## Automated Verification

- `npm ci`: passed; 1,106 packages installed from the lockfile.
- `npm run db:check`: passed.
- `npx expo-doctor`: 20/20 checks passed.
- `npx --no-install expo export --platform android --output-dir /tmp/caneguard-phase6-clean-export`:
  passed; 1,598 modules bundled in 7.6 seconds, 59 assets, 3.8 MB Hermes
  bundle, including the 2.5 MB Model v0 TFLite asset.
- `just verify-full`: passed.
- Full verification included lint, TypeScript, 36 Jest suites/217 tests, Expo
  dependency compatibility, Gitleaks, and Trivy.
- `git diff --check`: passed before the reliability commit.
- Focused storage run: 5 suites/31 tests passed.

## Migration Evidence

- Empty database to latest: passed.
- Phase 0 seeded database to latest: passed without deleting the probe row.
- Constraint and foreign-key cascade checks: passed.
- Migration journal, bundle imports, and SQL files: aligned by automated test.
- Migration-error user presentation: covered by provider tests.
- Automatic destructive reset: absent.
- Installed Android app update without clearing data: blocked pending two
  installable builds and a physical device.

## Performance Evidence

Command:

```bash
node scripts/measure_storage_performance.mjs
```

Environment: Node `v24.16.0`, SQLite `3.53.0`, in-memory host database.

Fixture:

- 5,000 parent records.
- 15,000 class-score children.
- Mixed symptoms, quality warnings, barangay values, labels, scores, and source
  types.

Recorded run:

| Measurement | Host result |
|---|---:|
| Apply both migrations | 0.592 ms |
| Seed fixture | 91.758 ms |
| First 50 lightweight rows | 0.152 ms |
| Conditional and grouped report aggregates | 1.196 ms |
| Database transaction only, excluding image copy | 0.169 ms |

The first-page query plan uses `scan_records_created_at_idx` without a temporary
sort. These host values demonstrate query shape and provide a regression
fixture; they do not satisfy Android timing acceptance.

## Error-State Review

All storage error codes have sanitized user-message tests:

- database not ready/open/migration;
- invalid record;
- image copy/missing/delete;
- save transaction/duplicate;
- record missing/query/delete.

User messages contain no SQL, stack trace, or file/content URI. Database,
migration, save, list, detail, delete, and missing-image UI states expose retry,
fallback, or deliberate navigation rather than destructive recovery.

## Security And Privacy Review

- Schema contains no password, access-token, auth-token, or secret columns.
- Persistence/report source audit found no fetch, Axios, Firebase, Supabase,
  authentication, GPS, or geolocation dependency.
- User query values are bound through Drizzle/SQLite parameters.
- Barangay remains null unless explicitly supplied; no demonstration location is
  saved.
- Logs use stable error codes and generic cleanup text, not record payloads,
  image bytes, credentials, or full paths.
- Gitleaks found no leaks.
- UI discloses device-only storage and app-data/uninstall loss.

Dependency audit disposition:

- `npm audit --omit=dev` reports 37 transitive findings: 26 high and 11
  moderate.
- Trivy reports 5 lockfile findings: 4 high and 1 medium.
- Findings are in brace-expansion/Jest paths, `js-yaml` tooling/config paths,
  and `uuid` through Xcode/Expo config tooling.
- Suggested forced npm fixes include breaking Expo or Jest downgrades. No forced
  dependency mutation was applied.
- Project owner must track upstream compatible fixes before production release.

## Data Honesty Review

Source audits found no production mock Records data, hardcoded Reports totals,
fake queue, sync/review claim, or unsupported Smut/Downy Mildew prediction
filter/count in the Records and Reports paths. Screens use possible-result,
AI-prediction, saved-observation, and local-only terminology.

## Accessibility Review

Automated/source evidence covers live loading/error regions, meaningful action
labels, disabled semantics during save/delete, non-color status text, missing
image alternatives, and UI state tests. Physical TalkBack, large-font, contrast,
and touch-target review remains blocked pending device acceptance.

## Cleanup Review

- Performance database is in-memory; no seed database or output is written.
- Android exports are under `/tmp`.
- `/storage-debug` remains developer-only and has no reset action.
- Orphan count now compares managed files with live DB references.
- Phase 0 runtime compatibility code is absent; only migration evidence remains.
- No backend, authentication, upload, or synchronization work was added.

## Release Disposition

**NOT RELEASE-READY.**

Automated implementation evidence is complete, but physical Android acceptance,
restart/update-install evidence, native performance, TalkBack review, and
dependency-advisory disposition remain required.

## Rollback

Use the prior application build without clearing `caneguard.db` or managed image
storage. No Phase 6 schema migration was added. If a future migration is faulty,
ship a forward corrective migration rather than resetting user data.
