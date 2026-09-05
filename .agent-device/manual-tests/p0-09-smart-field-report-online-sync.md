# Smart report: six-field Mobile-to-Web preservation

## Intent
Submit a report with explicitly selected province and municipality plus variety,
crop age, cane class, and notes. Office staff must receive those six values
verbatim alongside the original scan, location, and affected-area evidence.

## Prerequisites
- Disposable local API and Web (`http://localhost:5173`) are reachable; use one
  browser origin consistently. Have a verified field-reporter login and an
  authorized reviewer/admin login. Never put credentials in this guide.
- Emulator has the matching CaneGuard development build and Metro connection.
- The checked-in Rust image is available in the emulator gallery.
- Deny CaneGuard location permission before creating the report. An online map
  needs internet access; the reference list must include Batangas/Nasugbu/Wawa.

## Steps and expected results
1. Sign in on Mobile, Start Scan, choose the Rust fixture, Analyze, mark Rust,
   and continue. **Expect:** Possible result: Rust, with checklist evidence.
2. Tap Report to Office. **Expect:** an incomplete Draft with inherited scan
   context; denied GPS offers Pin Location on Online Map.
3. Open the map, wait for tiles, place a pin and confirm it. **Expect:** return
   to Draft; location is explicitly Manual map, GPS accuracy not applicable.
   Do this before typing fields so map navigation cannot discard unsaved edits.
4. Enter a distinctive farmer reference. Select Province → Batangas, then the
   automatically opened Municipality → Nasugbu. Open Barangay, search Wawa,
   dismiss the keyboard if necessary, and choose the **Wawa option**.
   **Expect:** all three region values selected; no ambiguous text-only tap.
5. Enter affected area `2.25` and affected portion `45`. Expand More field
   details and enter `Manual Variety`, `Manual Age`, `Manual Class`, and
   `Manual Notes` in the corresponding four fields. **Expect:** each value is
   visible in its own field, including notes when the keyboard is open.
6. Dismiss the keyboard with its Done/hide control, not an unconditional Back.
   Save Draft; scroll below inherited scan evidence to find **Draft saved on
   this device**. **Expect:** no data loss; the save notice is a footer.
7. Return to Finalize Report and submit online. **Expect:** Finalized · Synced,
   a server report UUID, and Last synchronized. Record the UUID as test evidence.
8. Sign in to Web as staff and open that exact UUID in Submitted reports.
   **Expect:** province Batangas, municipality Nasugbu, variety Manual Variety,
   crop age Manual Age, cane class Manual Class, and notes Manual Notes, all
   verbatim; also correct farmer, 2.25 ha, 45%, Rust, and manual-map location.

## Why this is manual on the current harness
The form/picker/map interactions were verified individually through Agent
Device, but full native replay repeatedly lost its interaction viewport despite
valid report snapshots. After explicit supervisor authorization, both a settled
snapshot plus fractional scrolls (`mto3h3dz-40600c2f`, step 25) and
screenshot-grounded coordinate pans (`mto3km46-cbee3d03`, step 27) failed with
`Active application interaction viewport is unavailable`. This is a bounded
harness limitation, not a claimed app defect or a passing automated journey.
Reconsider automation when that replay viewport issue is fixed. Do not use a
partial interactive result as six-field cross-surface acceptance.
