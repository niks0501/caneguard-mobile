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
