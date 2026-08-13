# P2-01 Reference Data Contract — Region & Barangay Lists (D2/D3)

Status: **contract proposal — backend endpoint does not exist yet.**

The mobile client (this repo) is shipped with an offline-first fetch/cache
mechanism and a seeded fallback list. The backend endpoint below is the
expected contract the client already targets. Until it exists, the seeded
fallback (`src/features/reports/referenceData/nasugbuSeed.ts`) is the serving
behavior.

## Endpoint

```
GET {apiBaseUrl}/api/v1/reference/locations
```

Headers:

| Header | Value | Purpose |
|--------|-------|---------|
| `Accept` | `application/json` | Response negotiation |
| `If-None-Match` | `<etag from previous response>` (optional) | Bandwidth optimization; the `version` field is the authoritative change signal |

No bearer token is sent: this is reference data, not submitter data. If the
backend requires a session anyway, return `401` and the client will keep its
cached list and surface a non-blocking message.

## Success response (200)

```json
{
  "version": "2026-08-13T00:00:00.000Z",
  "etag": "\"v42\"",
  "regions": [
    {
      "province": "Batangas",
      "municipalities": ["Nasugbu", "Calatagan"]
    }
  ],
  "barangays": ["Wawa", "Lumbangan", "Aga"]
}
```

| Field | Type | Rules |
|-------|------|-------|
| `version` | string | **Required.** Opaque. MUST change whenever any list changes; the client uses it to detect updates. A UTC timestamp works well. |
| `etag` | string | Optional. If present, the client echoes it in `If-None-Match` on the next request and expects `304` when nothing changed. |
| `regions` | array | **Required.** At least one entry. `province` non-empty; `municipalities` non-empty list. Province names are unique (later entries for a duplicate province are ignored). |
| `barangays` | array | **Required.** Non-empty strings, unique; the client deduplicates and caps list sizes defensively (≤ 5 000 entries, ≤ 120 chars per name). |

## Change detection (304)

When the client sends `If-None-Match` and the list is unchanged, return
`304 Not Modified` with no body. The client keeps its cache. When the list
changed, return `200` with the new payload; the client replaces its cache
when `version` differs from the cached `version`.

## Errors

| Status | Client behavior |
|--------|-----------------|
| `304` | Keep cache (no-op). |
| `401` / `403` | Keep cache; surface non-blocking message. |
| Other non-2xx / network / timeout | Keep cache or seed; surface non-blocking message. |
| Malformed body | Treat as failure; keep cache or seed. |

## Client implementation

- Types + payload validation: `src/features/reports/referenceData/referenceDataTypes.ts`
- Fetch + ETag handling: `src/features/reports/referenceData/referenceDataApi.ts`
- Offline cache (AsyncStorage): `src/features/reports/referenceData/referenceDataCache.ts`
- Resolve/refresh orchestration: `src/features/reports/referenceData/referenceDataService.ts`
- React hook (cache-first, NetInfo resync): `src/features/reports/hooks/useLocationReferenceData.ts`
- Seeded fallback (Nasugbu, Batangas — 42 barangays): `src/features/reports/referenceData/nasugbuSeed.ts`

## Backend follow-up

When the endpoint ships, the backend repo should:

1. Serve this contract (or adjust this document in the same change).
2. Seed it with the authoritative PSGC region/barangay lists.
3. Coordinate the admin update path (the captain's D3 requirement: admin
   updates the list server-side; phones resync when they have internet).
