# CaneGuard Mobile — current capability and readiness index

**Status:** current guidance. Last reviewed: 10 November 2026.
**Applies to:** this repository (`caneguard-mobile`) at the revision recorded in
[`docs/RELEASE-EVIDENCE.md`](RELEASE-EVIDENCE.md).

This is the one place to check what the mobile app currently does, what depends
on deployment configuration, and which older plans are historical. When a
document disagrees with this index, this index and the source win.

## Model classes (four in scan output)

The live scan flow runs the Model V2 artifact, which also scores a fifth **RSSI**
class. Scan results, stored records, and sync carry **exactly four** classes, in
this order:

1. Healthy
2. Mosaic
3. Rust
4. Smut

A scan whose top class is RSSI ends in a scan error instead of a result, and a
lower-ranked RSSI entry is dropped without renormalizing the four scores shown.
Expect that error until a follow-up carries the fifth class end to end.

Source of truth: `MODEL_LABELS` and `ACTIVE_MODEL_ID` in
`src/features/detection/constants/modelContract.ts`; model-version-specific
caution artifacts are `threshold/v1-confidence-caution-threshold.json` and
`threshold/v2-confidence-caution-threshold.json`. The V2 artifact records its
selected-checkpoint, non-OOF provenance and remains provisional. Contract field
values, including the deployed V2 SHA-256 and the V2 cutoff's derivation and
provenance, are owned by
[`PROJECT_CONTEXT.md` — Model contract](../PROJECT_CONTEXT.md#model-contract).

The scan output is labelled **Possible Condition** and is decision support, not
a diagnosis. A farmer session uses the confidence caution cutoff for the stored
model version: V1 records keep the OOF-derived V1 cutoff, and V2 records use the
provisional V2 selected-checkpoint cutoff. For V2, the score is the maximum
softmax over the five outputs for scans whose top class is not RSSI; RSSI-top
scans already end as a scan error. Below the applicable cutoff, a `farmer`
session sees **Result uncertain** as the result title, with guided retake steps,
**Retake Photo**, **Review Signs**, and the closest match as a smaller line;
saving stays available and the model scores are unchanged. The low-confidence,
photo-quality, and checklist cautions stay visible to every signed-in account
and never alter the model scores. Fixed QA fixtures are deterministic oracles,
not evidence of field accuracy, and a browser or mocked test is never native
inference proof.

## Implemented mobile screens

These screens exist in this repository and are covered by component or unit
tests. "Implemented" does not mean "verified on a device":

- Sign-in, registration, forgot-password, reset-password, email verification.
- Biometric unlock, device enrollment, and password/email change (Account
  security).
- Scan capture from camera or gallery, image preview, on-device analysis,
  guided symptom checklist, and the result card (Possible Condition, or Result
  uncertain for a farmer below the cutoff).
- Saved scan records and record details, plus the farmer Check Again follow-up:
  a new photo beside the first photo with each check's own date and Possible
  Condition line, the farmer's own note, and the plant's checks in date order.
  No trend label, better/worse claim, score comparison, or reminder.
- A farmer-only **Scan Card** on the analysis result after a local save: scan
  photo, date, **Possible Condition**, and a `CG-P-` scan ID derived from the
  scan UUID. It renders from the local record with no server round-trip. A note
  appears when the saved record already carries one (a Check Again follow-up's
  personal note). The farmer may type an optional **place** in their own words
  (stored on-device in `scan_records.personal_place`; no GPS or location
  permission, never uploaded); the card omits it when empty, adds the AI-only
  decision-support line and a fixed footer (the farmer's own scan; the inspector
  decides if a report is needed), and never shows Check Again history.
- Field Report Draft (Field Inspector accounts holding the `report:submit`
  capability): five-step form, local autosave checkpoints, readiness checklist,
  finalization, foreground sync and manual retry. The Review step carries an
  optional **Plot boundary** card that lists the 20 most recently updated
  boundaries saved on this phone with district, hectares, and the boundary
  state label, attaches one to the report, removes the link, and opens that
  boundary in Measure. The card is locked once the report is finalized.
- Field validation visits: owner-scoped drafts, completion evidence, follow-up
  outcome, optional fresh photo, and an **Office case** card on a case born in
  the office showing the reporter's concern, the office status, the case
  version, and a guarded viewer for the case photo and the last visit's photo.
  After a refresh the phone keeps those photos on disk for the owner within a
  fixed budget, so a case whose photos are all downloaded shows a **Ready
  offline** badge and renders them with no session token; a photo that cannot
  load otherwise shows words instead of a broken image. A case born in the
  office with no AI scan still opens and shows its concern, status, and photo
  with no AI section. The downloaded
  visit list needs `assignment:read`; opening and completing a visit needs
  `assignment:complete`. Without it the screen shows an unavailable notice
  instead of the visit form.
- Offline field boundary surveys (authoring needs the `report:submit`
  capability): plot and affected-area polygons drawn on the
  coordinate map, affected areas accepted only when fully inside the plot
  (concave boundaries included), overlaps counted once, and unfinished affected
  points checkpointed with the draft so Submit stays blocked until they are
  finished or cleared. Each boundary point keeps the best reading from its own
  bounded GPS sample, every point is kept as measurement provenance, and a
  completed plot shows a **Boundary Quality** panel with plot area, boundary
  point count, affected area, and one of three GPS states: **Good** when every
  point is 5 m or better, **Acceptable** when some points are 5 to 10 m, and
  **Low accuracy** when any point is worse than 10 m or unknown. Low accuracy
  names the worst point and offers one **Recapture** button for exactly that
  point; poor accuracy never blocks saving. Opened from a report it restores
  that exact saved boundary rather than the open draft, shows a boundary that
  can no longer be edited read-only, and leaves the report card to say when the
  linked boundary is no longer saved on the phone.
- **My boundaries** (authoring needs the `report:submit` capability): every
  boundary saved on this phone, newest first, each row showing its district and
  its measured hectares when the saved points measure (otherwise what is
  missing) and one state with a one-line what-to-do hint — **Draft**, **Waiting
  to send**, **Sending**, **Sent**, **Will retry**, **Needs a fix**, **Start
  again** (the office refused the identity, or the saved boundary is damaged on
  this phone), and **Not sent**. Draft and needs-a-fix boundaries reopen for
  editing; only a draft can be deleted, because queued work is still owed to the
  office. A failed read shows an error instead of an empty list. The state
  mapping is owned by `src/features/surveys/domain/boundaryState.ts` and its
  labels by `BOUNDARY_STATE_COPY` in `src/constants/copy.ts`.
- Home: the Morning Note sentence and its one button, the greeting and date
  band with an Offline chip while offline, the "Today at a glance" strip, icon
  tool tiles, and the four-class "Know the signs" photo strip. A farmer session
  also sees one plain sentence when the phone holds saved inspector work that
  is waiting for an inspector to sign in; it never shows a count or detail.
- Today's field work, Activity, office updates, Field guide, Settings
  (including the farmer **Language / Wika** switch).

## Deployment-dependent behaviour

These paths exist in code but need configuration or a live service. They are
not proven by unit tests:

| Capability | Requirement |
| --- | --- |
| Sign-in, sync, office review status | Reachable CaneGuard API and a verified account |
| Registration, password recovery, email verification | API mail delivery plus a configured auth deep-link host; without the host, links cannot return to the app |
| Manual map location | Online access through the configured privacy-preserving tile proxy (`EXPO_PUBLIC_MAP_TILE_PROXY_URL`); no offline map packages |
| Biometric unlock | Device with enrolled biometrics; enabling it is an explicit user action |
| Android interrupted picker recovery | Android platform only; best-effort marker, not full draft recovery |

## Location behaviour

- Foreground GPS is the primary source. One bounded foreground capture samples
  readings for up to 15 seconds (8 seconds for a boundary survey point), keeps
  the most accurate one and stops early once a reading reaches the 5 m target.
- In a Field Report Draft, a reading that saved final coordinates always reads
  as **Location added** with its device-reported accuracy, including one worse
  than the 5 m target; that worse-than-target fix also offers a one-tap **Try for
  a closer reading** retry.
- A later capture never replaces a saved GPS fix with a less accurate one, and a
  capture that returns nothing keeps the saved fix.
- If GPS is slow, denied, unusable, or services are off, the inspector can retry,
  choose a point on the map while online, or record an **explicit unavailable
  reason**. An unavailable location has null coordinates and no invented
  accuracy.
- A manual map pin has no GPS accuracy. The earlier GPS attempt stays as
  evidence on the report.
- Correcting a saved draft location asks for an explicit replacement
  confirmation, while a closer-reading retry keeps GPS provenance and runs in one
  tap; finalized reports stay read-only.
- Location never blocks saving a Draft, and a pending reading cannot overwrite a
  newer manual or unavailable choice.

## Offline restart (readiness-first)

- A password-only sign-in is not stored: closing the app while offline returns
  to the sign-in screen.
- A biometric-protected session can restore the same unexpired owner offline.
  Until `/me` verifies, that session carries no capabilities, so inspector
  authoring stays unavailable; already-authored records stay readable. The
  capability contract is owned by
  [`PROJECT_CONTEXT.md` — Inspector capabilities](../PROJECT_CONTEXT.md#inspector-capabilities).
- Settings shows a **Ready for offline work** / **Not ready for offline work**
  readiness card that reads ready only when a protected session is configured,
  unexpired, and visits are downloaded. Sign-in explains the password-only
  limit.
- No offline password or weaker unlock method is implemented. A different
  offline-unlock design would need its own threat model and approval.

## Recovery and cleanup boundaries

- Scan, Field Report form, and validation visit drafts are checkpointed locally
  for their owner, with Saving / Saved on device / Not saved indicators.
- Drafts never enter an upload queue and are never presented as submissions.
- Routine cleanup removes only re-downloadable office data (visit assignments
  and office updates). Permanent owner-data removal previews every affected
  kind, re-checks counts, refuses while an upload is running, and requires an
  explicit acknowledgement of unsent work.
- Permanent upload failures offer a safe reason, the preserved local evidence,
  and a support reference containing no photo, token, GPS, or farmer text. The
  app never clones or re-keys a rejected report to make a retry appear to work.

## Historical documents

These remain for their original acceptance evidence. They are **not** current
guidance:

- [`docs/features/caneguard-uiux-enhancement-handoff/00-FINAL-DECISIONS.md`](features/caneguard-uiux-enhancement-handoff/00-FINAL-DECISIONS.md)
  — records a three-class model decision that Model V1 has since superseded
  (Smut is a current supported class).
- [`docs/features/caneguard-uiux-enhancement-handoff/03-SCREEN-SPECS.md`](features/caneguard-uiux-enhancement-handoff/03-SCREEN-SPECS.md)
  — specifies a three-class Home education section (Healthy, Mosaic, Rust) and
  at most two secondary shortcuts, both since superseded by the current Home and
  the four-class model contract above.
- [`docs/features/caneGuard-p0-implementation-phases/P0-07-Field-Report-Synchronization-and-API.md`](features/caneGuard-p0-implementation-phases/P0-07-Field-Report-Synchronization-and-API.md)
  — records the P0 requirement for final coordinates; the current contract also
  supports an explicit unavailable-location reason with null coordinates.
- `docs/model-v0/` and `docs/model-v1/` — model-era evidence, not screen
  capability guidance.

## Evidence limits

This index describes the source. It does not claim native or cross-system
acceptance. Device-bound outcomes, their current status, and the alternative
evidence that was actually collected are recorded in
[`docs/RELEASE-EVIDENCE.md`](RELEASE-EVIDENCE.md).
