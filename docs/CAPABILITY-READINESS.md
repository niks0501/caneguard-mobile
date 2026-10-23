# CaneGuard Mobile — current capability and readiness index

**Status:** current guidance. Last reviewed: 23 October 2026.
**Applies to:** this repository (`caneguard-mobile`) at the revision recorded in
[`docs/RELEASE-EVIDENCE.md`](RELEASE-EVIDENCE.md).

This is the one place to check what the mobile app currently does, what depends
on deployment configuration, and which older plans are historical. When a
document disagrees with this index, this index and the source win.

## Model classes (exactly four)

Model V1 supports **exactly four** classes, in this order:

1. Healthy
2. Mosaic
3. Rust
4. Smut

Source of truth: `MODEL_LABELS` in
`src/features/detection/constants/modelContract.ts`.

The scan output is labelled **Possible Condition** and is decision support, not
a diagnosis. Low-confidence results and photo-quality or checklist cautions are
shown to the inspector; none of them alter the model scores. Fixed QA fixtures
are deterministic oracles, not evidence of field accuracy, and a browser or
mocked test is never native inference proof.

## Implemented mobile screens

These screens exist in this repository and are covered by component or unit
tests. "Implemented" does not mean "verified on a device":

- Sign-in, registration, forgot-password, reset-password, email verification.
- Biometric unlock, device enrollment, and password/email change (Account
  security).
- Scan capture from camera or gallery, image preview, on-device analysis,
  guided symptom checklist, and the Possible Condition result.
- Saved scan records and record details.
- Field Report Draft: five-step form, local autosave checkpoints, readiness
  checklist, finalization, foreground sync and manual retry.
- Field validation visits: owner-scoped drafts, completion evidence, follow-up
  outcome, optional fresh photo.
- Offline field boundary surveys with local draft resume.
- Today's field work, Activity, office updates, Field guide, Settings.

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

- Foreground GPS is the primary source and is bounded to 15 seconds per attempt.
- If GPS is slow, denied, weak, or services are off, the inspector can retry,
  choose a point on the map while online, or record an **explicit unavailable
  reason**. An unavailable location has null coordinates and no invented
  accuracy.
- A manual map pin has no GPS accuracy. The earlier GPS attempt stays as
  evidence on the report.
- A draft location can be corrected with an explicit replacement confirmation;
  finalized reports stay read-only.
- Location never blocks saving a Draft, and a pending reading cannot overwrite a
  newer manual or unavailable choice.

## Offline restart (readiness-first)

- A password-only sign-in is not stored: closing the app while offline returns
  to the sign-in screen.
- A biometric-protected session can restore the same unexpired owner offline.
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
