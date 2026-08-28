# Maestro gap closeout

- Overall result: `PASS`
- Scope: on-device Maestro gaps for caneguard-mobile PR #47 and PR #48.
- PR #47: `https://github.com/niks0501/caneguard-mobile/pull/47` now points to `fc3ab8e69d53f05a391cec81506c445a5444b059` on `fm/cg-t04`.
- PR #48: `https://github.com/niks0501/caneguard-mobile/pull/48` now points to `6f2fc58b1c90088f618ff38279ab4c5625f7bd7b` on `fm/cg-t02`.

## Device evidence

- Device: Android emulator `emulator-5554`, model `sdk_gphone64_x86_64`, Android 14 / API 34.
- App: CaneGuard `1.1.0`, version code `1`, debuggable Expo development build, package `com.niks0501.caneguard`.
- Native-runtime status: `USABLE`; both PRs contain no native-affecting changes.
- Metro served each tested worktree on port 8081 with the local API URL, and the API health endpoint reported database and storage ready.

## Results

- PR #47 flow `.maestro/p0/04-activity-navigation.yaml` passed on 2026-08-28 at the PR head.
- The final PR #47 artifact is `/home/aki/.maestro/tests/2026-08-28_160514`.
- The PR #47 evidence record is `.maestro/evidence/T04-activity-navigation.md`.
- PR #48 flow `.maestro/p0/01-guided-validation.yaml` passed on 2026-08-28 after selecting Something else, preserving the mismatch, exposing all three result actions, and saving as scan-only.
- The final PR #48 artifact is `/home/aki/.maestro/tests/2026-08-28_161808`.
- The PR #48 evidence record is `.maestro/evidence/T02-guided-validation.md`.
- PR #48 required only a Maestro flow correction: targeted scrolls now bring Report to Office, Keep as Scan Only, and New Scan into the visible hierarchy before their assertions.
