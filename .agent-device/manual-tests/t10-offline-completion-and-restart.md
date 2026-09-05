# Offline field visit survives a cold restart

## Intent
An assigned reporter can finish field validation offline and recover the same
pending visit after a real process restart, before any network synchronization.
This replaces `t10/03-mobile-offline-completion-and-restart.ad`. The warm-session
completion/recovery portions are automated separately by `t10-acceptance.mjs`.

## Prerequisites
- Matching emulator build and already loaded bundle; local Web/API reachable.
- Verified reporter account and authorized disposable office staff account.
- A fresh report submitted by that reporter. In Web, open the case, assign
  field validation to its submitting reporter, and save the explicit review.
- The reporter has refreshed/opened the assignment while online.
- Developer-prepared supported enrolled biometric and enabled CaneGuard local
  unlock. **Without this, mark the restart steps Not executable.** Do not
  enroll credentials or clear application data to work around the gate.

## Steps and expected results
1. On Mobile open the assigned case from Activity. Record its reference.
   **Expect:** the same Web reference and “You submitted this case and are its
   validator.” No different account's case may be substituted.
2. Enable airplane mode and turn Wi-Fi off in Android quick settings.
   **Expect:** no network connection; keep the already-unlocked session.
3. Enter distinct observation, finding, and action text; complete the visit.
   **Expect:** Saved on this device, visit time, GPS attempt evidence, and Retry
   synchronization. A poor GPS reading must not block valid visit evidence.
4. Force stop CaneGuard via Android Settings → Apps, then reopen it without
   restoring networking. Complete the supported native local unlock.
   **Expect:** an authenticated offline session, not online password login.
5. Open the same assignment. **Expect:** same case reference, Saved on this
   device, original visit time/GPS attempt, and retry availability. No second
   visit should be created and nothing should be falsely labeled synchronized.
6. Restore airplane mode off and Wi-Fi on; retry synchronization if still
   pending. **Expect:** Validation synchronized for that same visit.
7. In Web reopen the exact case. **Expect:** the submitted visit's observation,
   finding and action verbatim; the case is not automatically verified/closed.

## Why automation was not possible
Offline cold restart depends on native biometric/device-credential unlock,
which the captain excludes on this unenrolled emulator. Online restart or a
warm offline session cannot prove step 4. The automated `03a` and `04` segments
prove offline save and real recovery but intentionally do not claim this
credential-gated restart. See `../evidence/INTENT-REPLAY.md` for their evidence.
