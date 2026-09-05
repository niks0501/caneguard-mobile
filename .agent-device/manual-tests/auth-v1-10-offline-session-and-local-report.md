# Offline unlock and local scan preservation

## Intent
A previously authenticated reporter can restart offline, unlock the cached
session locally, and save a scan without sending a report to the office.
This replaces `auth-v1/10-offline-session-and-local-report.ad`.

## Prerequisites
- Disposable verified field-reporter account; working local API and browser.
- Matching CaneGuard development build, Metro bundle already loaded, Rust
  fixture in the emulator gallery. Do not clear application storage.
- A developer-prepared emulator with a supported enrolled strong biometric
  and CaneGuard biometric unlock enabled. **The current shared emulator has
  no enrolled biometric: record Not executable, not Pass, on that target.**
- Do not enroll credentials, reset the emulator, or bypass unlock as part of
  this test. Credential preparation is separately owned.

## Steps and expected results
1. While online, sign in with the disposable field-reporter account. Open
   Account & security and check that the cached session is valid and biometric
   unlock is enabled. **Expect:** authenticated Home, not an expired session.
2. In Android quick settings enable airplane mode and explicitly turn Wi-Fi
   off. **Expect:** no cellular/Wi-Fi connection. Keep the app's local data.
3. In Android Settings → Apps → CaneGuard, Force stop, then reopen CaneGuard.
   **Expect:** local unlock is required; the app must not silently bypass it.
4. Complete the supported native biometric prompt. **Expect:** Home shows
   Offline without attempting online password authentication.
5. Start Scan, choose the Rust fixture, Analyze, select Rust in the checklist,
   and continue. **Expect:** Possible result: Rust using the local model.
6. Choose Keep as scan only, then open the saved record. **Expect:** Scan saved
   on this device, Rust evidence, Local only, and no office submission UUID.
7. Restore airplane mode off and Wi-Fi on. Sign into the local Web staff
   workspace and check the test account's submissions. **Expect:** the scan-only
   observation did not create a submitted Field Report.

## Why automation was not possible
Cold-start authentication now requires explicit unlock. The completion record
`../evidence/AD-FLOW-COMPLETION-2026-09-04.md` documents zero enrolled prints and
an unsupported emulator fingerprint command. The captain explicitly keeps
biometric/device-credential journeys manual. An online password login is not
an equivalent test of offline unlock. No new credential enrollment was tried.
