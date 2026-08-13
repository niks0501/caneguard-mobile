# ADR-0002: Report authority-review current status and feedback

- **Status:** Accepted for P1 mobile implementation
- **Date:** 2026-08-14
- **Supersedes:** None
- **Related:** ADR-0001; P0-07 Field Report Synchronization and API; P0-08 End-to-End Acceptance and Evidence

## Decision

CaneGuard Mobile consumes the existing owner-scoped `GET /api/v1/mobile/reports/statuses` feed and stores one nullable, server-owned current authority-review snapshot on each local Field Report. The snapshot is a cache of server state; it is never a replacement for authoring or delivery state and it cannot mutate the report submission.

The captain authorized starting P1 while P0 physical testing continues. This ADR does not change, replace, or weaken any P0 evidence, gate, payload-retention work, or synchronization contract.

## Independent state axes

Field Reports retain three independent axes:

1. **Authoring (mobile-owned):** `draft`, `ready_for_submission` (existing unused schema value), or `finalized`.
2. **Delivery/transport (mobile-owned):** `local_only`, `pending`, `syncing`, `synced`, or `failed`.
3. **Authority review (server-owned current snapshot):** `submitted_unverified`, `for_field_validation`, `verified_by_staff`, `unable_to_verify`, `resolved`, or a future unknown raw string.

`syncStatus: synced` means that delivery succeeded. It does not mean reviewed, verified, or resolved. Authority status is only eligible for a finalized, synchronized Field Report with an existing server UUID. Drafts and unsent/failed reports have no fabricated review state.

## Wire contract

The mobile client uses the established v1 endpoint with the authenticated Field Reporter bearer token and the existing `report:status` capability:

```text
GET /api/v1/mobile/reports/statuses
  ?per_page=100
  [&updated_after=<ISO-8601 server update boundary>]
```

Each paginated response is validated before any local write. The consumed page envelope is:

```json
{
  "data": [
    {
      "uuid": "server-report-uuid",
      "client_uuid": "stable-mobile-field-report-uuid",
      "reference_code": "CG-...",
      "review_status": "verified_by_staff",
      "review_notes": "Latest plain-text note or null",
      "reviewed_at": "2026-08-13T12:00:00.000Z",
      "updated_at": "2026-08-13T12:00:00.000Z"
    }
  ],
  "links": { "next": "https://api.example.test/api/v1/mobile/reports/statuses?..." },
  "meta": { "sync_before": "2026-08-13T12:05:00.000Z" }
}
```

- `data` must be an array. `uuid`, `client_uuid`, `review_status`, and `updated_at` must be nonblank strings; `updated_at` must be a valid timestamp.
- `reference_code` and `reviewed_at` may be `null`; non-null values must have the expected string type and valid timestamp for `reviewed_at`.
- `review_notes` may be `null`; nonblank notes are treated as plain text and are limited to the established server contract maximum of 1000 characters. Blank notes are not feedback.
- `links.next` is either `null` or an absolute continuation URL. Every continuation must remain on the configured API origin and API path boundary. Cursor pages are followed until `next` is `null`; loops, malformed URLs, or a changed checkpoint fail the refresh.
- `meta.sync_before` is the server checkpoint. It must be a valid timestamp, must remain identical on every page, and bounds the complete refresh. A continuation must not move that boundary.
- Known raw values are preserved exactly. Unknown nonblank values are valid forward-compatible data, not a reason to discard the complete response.

The mobile parser does not trust server-only report rows to reconstruct local records. Valid rows with no matching eligible local Field Report are ignored. A row that claims a matching local client UUID but has a conflicting server UUID is ignored and cannot overwrite local data.

## Domain and persistence model

The additive SQLite/Drizzle migration adds nullable text/timestamp columns to `field_reports`:

- `authority_status_raw`
- `authority_reference_code`
- `authority_feedback`
- `authority_reviewed_at`
- `authority_updated_at`
- `authority_fetched_at`

No SQLite enum/check constraint is added for `authority_status_raw`; future server values must remain readable. Existing scan rows, Field Reports, AI evidence, image references, authoring values, delivery values, identities, timestamps, and P0 evidence remain unchanged. `authority_fetched_at` records the last successfully accepted feed boundary for an eligible owner-scoped local report; it is not a server review time.

The domain snapshot exposes the raw status, mapped presentation, optional reference, optional latest feedback, server review/update times, and local fetch time. Feedback attribution is always the neutral string **Authority staff**. Reviewer UUID, name, email, and any other personal attribution are not persisted or shown.

## Source of truth and timestamps

| Value | Source | Meaning |
| --- | --- | --- |
| `observedAt` | local Scan Record / Field Report | Immutable field observation time. |
| `submittedAt` | local Field Report | Local finalization/queue time. |
| `lastSyncedAt` | local delivery repository | Time the client recorded successful upload; not a review event. |
| `remoteId` | upload response | Server report UUID. |
| `reference_code` | status feed | Server human reference code. |
| `review_status` | status feed | Server-owned current review value, preserved raw. |
| `review_notes` | status feed | Latest current plain-text feedback only. |
| `reviewed_at` | status feed | Server review mutation time, when supplied. |
| `updated_at` | status feed | Server snapshot ordering/conflict timestamp. |
| `authority_fetched_at` | mobile cache write | Local successful feed receipt time; never presented as server review time. |

The display time for feedback is `reviewed_at` when present, otherwise `updated_at`. The cache applies a row only when the active account owns the local Field Report, `client_uuid` equals the local Field Report ID, an existing `remoteId` equals `uuid`, the report is finalized and synchronized, and the incoming `updated_at` is not older than the cached `authority_updated_at`. Equal timestamps are accepted to repair an incomplete same-version snapshot. Older updates never overwrite newer cached review data.

## Ownership and identity guards

- The bearer session and backend owner-scoped feed are authoritative for account ownership; mobile never sends a claimed owner or role for review status.
- Every local read and write is scoped to the active Field Reporter UUID.
- Only `authoringState = finalized` and `syncStatus = synced` local Field Reports participate.
- A response row must match local `client_uuid` and, when present locally, `uuid`/`remoteId`. Mismatches are ignored fail-closed.
- Server-only rows, scan-only legacy records, local-only reports, Drafts, another account's reports, and reports without a server identity are not materialized or assigned a review status.
- Account/session replacement invalidates in-flight UI application and never exposes the previous account's cached status under the replacement account.

## Refresh, checkpoint, and cache semantics

- Refresh is explicitly available from the finalized Field Report status surface.
- Refresh runs when the relevant status surface gains focus.
- While a status surface is mounted, app resume may refresh only when the owner cache is stale (five minutes is the implementation threshold). There are no timers, polling loops, background jobs, push notifications, notification permissions, unread state, or analytics.
- Concurrent refreshes for the same database, owner, and bearer session coalesce into one request. A refresh for a different session is not coalesced with it.
- The first request may omit `updated_after`. Later requests use the newest fully accepted cached server update with a small overlap, while preserving the response's `sync_before` checkpoint through every cursor page.
- All cursor pages are fetched and validated into memory first. Only after complete pagination, checkpoint, origin, boundary, item, and identity validation does one SQLite transaction apply the batch and advance `authority_fetched_at`. A partial page or failed transaction leaves the prior cache and local delivery state unchanged.
- The current snapshot is retained indefinitely in SQLite. Offline detail views show the last known server update and feedback. A failed refresh never clears or rewrites a known snapshot.

## Presentation and neutral behavior

Delivery and authority review are separate:

- List cards keep `Pending upload`, `Uploading`, and `Sync failed` as the dominant status. An authority label appears only after synchronized delivery and only when a cached review snapshot exists.
- Known wire labels are:
  - `submitted_unverified` → **Awaiting authority review**
  - `for_field_validation` → **Field validation needed**
  - `verified_by_staff` → **Verified by staff**
  - `unable_to_verify` → **Unable to verify**
  - `resolved` → **Resolved**
- Unknown raw values render **Status update unavailable** while the raw value remains cached for forward compatibility.
- Finalized Field Report detail has separate **Submission** and **Authority review** sections. It shows the full current label, reference when available, latest nonblank plain-text feedback, **Authority staff** attribution, and server update time. It uses no diagnosis, confirmation, escalation, reply, or chat language.
- A synchronized report without a snapshot says that authority review status is unavailable; it does not invent “under review.”
- Refresh errors use neutral copy such as **Couldn’t refresh—showing the last update** and leave the cached snapshot visible. 401 follows the existing session-expiry path. 403/404 reports capability unavailability without changing upload state. Timeouts, network errors, 5xx, malformed pages/items, pagination boundary errors, and identity errors preserve the cache.

## Compatibility and rollout

The migration is additive and nullable. Existing P0 databases and all existing rows remain readable without backfill. Older mobile versions ignore the new server endpoint and columns. New mobile against a backend without the status capability treats 403/404 as unavailable; upload and retry behavior remains unchanged. New server status values remain readable by older mobile as a generic fallback. Rolling back the mobile binary leaves nullable columns harmless; rolling back server capability leaves already cached last-known snapshots available.

This slice does not add Axios, Zod, React Query, Redux, a second database, polling/background infrastructure, notification infrastructure, or analytics dependencies.

## Non-goals

P1 is limited to the current authority-review snapshot and latest feedback. It does not include push/local notifications, unread/read receipts, expert referral, assignment or field visits, replies/chat/acknowledgement, review history/timelines, dashboard analytics, optional report fields, server-only report reconstruction, new disease classes, diagnostic-confirmation language, or mutation of authority state from mobile.

## Acceptance evidence

- **Migration:** upgrade tests run the additive migration after representative P0 schemas and prove all existing scan evidence, Field Report values, identities, delivery states, timestamps, and child rows are preserved.
- **Domain/repository:** tests prove owner scope, client/server UUID guards, stale/new updates, unknown raw values, account replacement, and atomic batch application.
- **API/service:** tests prove complete cursor pagination, fixed server checkpoint, same-origin/path safety, 401/403/404, timeout/network errors, malformed items, and partial-page cache preservation/coalescing.
- **UI:** tests prove delivery/review separation, known/unknown labels, feedback and neutral attribution, server time, offline last-known rendering, explicit refresh/error states, Draft/local-only/legacy/other-account boundaries, and accessible neutral copy.
- **Project checks:** run `npm run lint`, `npm run typecheck`, `npm test`, `npm run db:check`, and focused P1 tests. A P1 Maestro flow/evidence scaffold records synchronized report → controlled authority update/feedback → refresh → new status → offline restart/cache, with exact SHAs/build/backend provenance. It is not a physical PASS unless run on a fresh compatible device build against a controlled backend update.
