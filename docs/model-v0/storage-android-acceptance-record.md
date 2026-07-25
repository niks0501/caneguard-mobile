# Android Local Storage Acceptance Record

## Status

**BLOCKED: not executed. This is not release-pass evidence.**

No target physical Android device, Android version, or installed development or
preview build was available in the coding environment.

## Build Identity

- Application version: `1.0.0`
- Verified reliability commit: `c58f215`
- Branch: `feat/drizzle-sqlite-scan-records`
- Device model: not provided
- Android version: not provided
- Build profile: not provided
- Tester: not provided
- Test date: not run

## Required Procedure

| Step | Expected result | Status |
|---|---|---|
| Install development/preview build without clearing prior app data | Existing database remains available | NOT RUN |
| Complete a real camera scan in airplane mode | On-device model completes without network | NOT RUN |
| Save the completed result | Managed image and structured record persist as local-only | NOT RUN |
| Tap Save rapidly | Only one record is created | NOT RUN |
| Force-stop and reopen the app | Saved record remains present | NOT RUN |
| Open Records and Details | Newest record, full metadata, and image render | NOT RUN |
| Search, filter, and load more than 25 records | Indexed query behavior is correct | NOT RUN |
| Open Reports | Aggregates match local Records values | NOT RUN |
| Delete and cancel once | Cancellation preserves record and image | NOT RUN |
| Confirm deletion | Record, children, and managed image are removed | NOT RUN |
| Simulate a missing managed image | Metadata remains visible with fallback | NOT RUN |
| Install an app update containing the migration bundle | Prior records survive migration | NOT RUN |
| Exercise TalkBack and font scaling | Labels, state, and actions remain usable | NOT RUN |
| Seed/retain 5,000 records and measure targets | Device targets are recorded and dispositioned | NOT RUN |

## Acceptance Targets

- Cold-start migration check: under 2 seconds.
- Completed save including real image copy: under 2 seconds.
- First 50 Records rows: under 500 ms.
- Report aggregate queries: under 500 ms.
- Scrolling: responsive at normal device settings.

Host Node measurements must not be copied into this table as Android results.

## Release Disposition

Physical-device acceptance and update-install evidence are required before
declaring this feature release-ready. Until this record is completed on a named
device, Phase 6 release acceptance remains blocked even though automated checks
pass.
