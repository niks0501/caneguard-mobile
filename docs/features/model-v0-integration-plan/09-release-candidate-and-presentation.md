# Phase 9 — Release Candidate and Presentation

## Objective

Produce a stable standalone Android preview APK, prepare a controlled demonstration, and freeze the prototype before the July 28 presentation.

## Primary Owners

- **Product Owner:** freezes scope and approves the demonstration story.
- **DevOps Engineer:** builds, versions, distributes, and records the APK.
- **QA Engineer:** signs off the release candidate.
- **UI/UX Designer:** confirms presentation readability.
- **Software Developers:** address release blockers only.
- **Business Analyst:** prepares accurate system explanation and limitations.
- **System Analyst:** confirms the demonstrated workflow matches actual behavior.
- **Software Architect:** reviews release consistency and rollback point.

## Release Profiles

## Development APK

Use for:

- debugging;
- Metro-based code updates;
- runtime logs;
- model debug screen;
- failure investigation.

```bash
eas build --platform android --profile development
```

## Preview APK

Use for:

- standalone presentation;
- offline demonstration;
- installation on backup devices;
- final acceptance test.

```bash
eas build --platform android --profile preview
```

The presentation must use the preview APK, not the development client.

## Version and Release Record

Create:

```text
docs/model-v0/releases/july-28-release-candidate.md
```

Record:

```text
Application version
Commit SHA
Model version
Model checksum
EAS build profile
EAS build identifier
Build date
Primary device
Secondary device
QA sign-off
Known limitations
Rollback commit
```

Tagging may be done after approval according to the team’s repository policy.

## Feature Freeze

After the release candidate passes QA:

- do not add new disease classes;
- do not add GPU or NNAPI delegates;
- do not redesign the workflow;
- do not add backend submission;
- do not retrain and replace the model without rerunning parity and QA;
- fix only release-blocking defects.

## Presentation Demo Assets

Store locally on both presentation phones:

- two healthy images;
- two mosaic images;
- two rust images;
- one dark or low-quality image for a warning example;
- one backup screenshot set.

Use verified images whose expected behavior has already been recorded. Do not use a random live field image as the only demonstration input.

## Presentation Backup Package

Prepare:

```text
Preview APK installed on two phones
Development APK available
Local demo images
Complete workflow screen recording
Result screenshots
Charging cable and power bank
Written model class list
Written known limitations
Release commit SHA
```

The screen recording protects the presentation from camera, projector, or device failure.

## Demonstration Story

1. Enable airplane mode.
2. Open CaneGuard.
3. Explain that the model runs on the Android device.
4. Select a verified sugarcane image.
5. Show the real preview.
6. Tap Analyze.
7. Show processing feedback.
8. Complete the symptom checklist.
9. Show possible result, confidence, all class scores, and consistency status.
10. Point out the decision-support disclaimer.
11. Start a new scan.
12. Repeat with a second class when time allows.

## Presentation Wording

Use:

```text
This is CaneGuard Model v0, our first functional offline prototype.

The current model supports Healthy, Mosaic, and Rust.

The image is processed and classified directly on the Android device.

The symptom checklist does not change the AI score. It only shows whether the user's observation agrees with the model output.

The result is a decision-support output and still requires further data collection and expert validation.
```

Avoid:

```text
The app diagnoses all sugarcane diseases.
The result is guaranteed.
The checklist improves confidence to a specific percentage.
The app replaces agricultural experts.
The prototype is already ready for full deployment.
```

## Final Pre-Presentation Checklist

```text
[ ] Preview APK is installed on primary phone
[ ] Preview APK is installed on backup phone
[ ] Airplane-mode inference works
[ ] Model version is visible in release record
[ ] Demo images are local
[ ] Camera permission is already tested
[ ] Battery is sufficient
[ ] Screen timeout is adjusted
[ ] Notifications are silenced
[ ] Backup recording opens correctly
[ ] Release commit is identified
[ ] No untested code was added after sign-off
```

## Release Acceptance

The Product Owner accepts the release only when:

- QA exit criteria from Phase 8 pass;
- preview APK is standalone;
- the demonstrated classes match Model v0;
- no hardcoded result remains;
- limitations are documented;
- a rollback commit is known.

## Suggested Commit

```text
chore(release): prepare preview APK and presentation release candidate
```

## Rollback Safety

Identify the last QA-approved commit and do not overwrite it. New release-blocking fixes should be small and isolated. If a late fix destabilizes the build, return to the signed-off release commit rather than debugging during presentation day.

## Exit Criteria

- Standalone preview APK is installed on two phones.
- Airplane-mode workflow passes.
- Release record is complete.
- Presentation assets and backup recording are ready.
- Feature freeze is active.
- Product Owner and QA Engineer approve the build.
