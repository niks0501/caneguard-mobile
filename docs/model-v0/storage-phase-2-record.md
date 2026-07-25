# Storage Phase 2 Managed Image Record

## Decisions

- Store the exact full source image only; do not create thumbnails yet.
- Use `documents/caneguard/scan-images/<record-uuid>.<extension>`.
- Prefer MIME metadata, then a supported filename/URI extension.
- Use `.img` and null MIME metadata when the source format cannot be established.
- Keep orphan detection as an explicit maintenance function without automatic
  deletion.

## Deliverables

- Idempotent managed directory creation.
- UUID-only destination path validation.
- Camera/gallery source copy without re-encoding or source deletion.
- Existence and metadata reads with recoverable missing-file behavior.
- Managed-only deletion and compensation cleanup.
- Orphan detection based on database-referenced managed URIs.
- Typed storage errors and service tests.

## Verification Evidence

- `just verify-targeted`: lint and TypeScript passed.
- `npm test -- --runInBand`: 28 suites and 160 tests passed.
- Managed image service: 19 tests passed for directory creation, format
  resolution, camera/gallery copy contracts, fallback metadata, validation,
  collision handling, missing files, managed-only deletion, compensation, and
  orphan detection.
- `git diff --check`: passed.

Real Android camera and gallery URI copying, restart persistence, and deletion
remain device-level checks and must not be inferred from Jest mocks.

## Rollback

Return to the Phase 1 application commit. Phase 2 creates no database migration.
Files already copied under the managed directory may remain harmlessly orphaned
and can be identified by the maintenance function.
