# Office review cache survives offline restart

## Intent
Keep an owned report's last known office status and feedback available after a
cold restart without connectivity, without presenting stale content as a fresh
server response. This is the credential-gated portion of P1's original review
status/offline-cache journey.

## Prerequisites
- Matching emulator build and cached Metro bundle; disposable reporter/staff
  accounts; a report submitted by the reporter and synchronized to local Web.
- On Web, assign the report for field validation and add distinctive plain-text
  review notes. On Mobile refresh that report's authority status while online.
- Developer-prepared supported enrolled biometric and enabled local unlock.
  **Current unenrolled target: mark cold restart Not executable.** Do not
  configure credentials, clear app data, or bypass authentication for this test.

## Steps and expected results
1. On Web open the exact case reference. **Expect:** Needs field validation,
   the intended reporter assignment, and the distinctive review notes.
2. On Mobile open its Field Report and refresh authority review status.
   **Expect:** Field validation needed, the same case reference, Latest feedback
   matching the notes, authority attribution, and a server-update timestamp.
3. Enable airplane mode and turn Wi-Fi off. Refresh status while the report is
   open. **Expect:** the cached status/feedback remain available; an unavailable
   refresh must not erase them or invent a newer server timestamp.
4. Force stop CaneGuard in Android Apps settings and reopen while still offline.
   Complete the supported native local unlock. **Expect:** authenticated offline
   access without a password request to the unreachable API.
5. Reopen the same report through Activity. **Expect:** the same cached status,
   feedback, attribution and timestamp. Keep screenshots of steps 2 and 5 for
   comparison; do not confuse a different report with persisted state.
6. Restore airplane mode off and Wi-Fi on, then refresh. **Expect:** normal
   server refresh resumes, with the actual current status displayed.

## Why this portion is manual
The captain's biometric/device-credential skip prevents automating offline
cold-start unlock on the shared emulator. `review-cache.mjs` automates the
real Web-produced status, exact feedback, and warm-session network-loss cache
check; it deliberately does not replace or claim steps 4–5.
