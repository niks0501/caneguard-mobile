# Phase 8 — QA, Device, Offline, and Performance Testing

## Objective

Verify that the complete prototype behaves correctly, produces equivalent model results, works offline, and remains stable on presentation hardware.

## Primary Owners

- **QA Engineer:** owns test design, execution, defect reporting, and sign-off.
- **Software Developers:** fix blocking defects and provide diagnostic builds.
- **DevOps Engineer:** produces reproducible development and preview APKs.
- **Software Architect:** reviews contract violations and regressions.
- **UI/UX Designer:** validates usability and recovery states.
- **Product Owner:** decides release-blocking severity.

## Test Environments

At minimum:

1. primary presentation Android phone;
2. secondary Android phone with a different manufacturer or Android version;
3. training notebook or Python reference environment;
4. EAS development APK;
5. EAS preview APK.

Record:

```text
Device model
Android version
Available memory
APK profile
Commit SHA
Model version
Test date
Tester
```

## Test Categories

## 1. Model Contract Tests

| Test | Pass Condition |
|---|---|
| Label order | Exact match across notebook, file, and app |
| Input dimensions | Exact |
| Input type | Exact |
| Input element count | Exact |
| Input byte length | Exact |
| Normalization | Matches contract |
| Output count | Equals three labels |
| Output interpretation | Matches probability/logit contract |
| Model checksum | Matches release record |

## 2. Preprocessing Parity Tests

Run the parity fixture in Python and Android.

Compare:

- processed image dimensions;
- crop region;
- tensor type;
- min, max, and mean;
- first tensor values;
- input byte length.

Document numerical tolerance. A mismatch blocks release because later accuracy testing would be invalid.

## 3. Output Parity Tests

For the same fixture:

- same top class;
- same output index order;
- class scores within tolerance;
- same softmax treatment;
- stable repeated output.

## 4. Functional Workflow Tests

```text
Gallery selection
Camera capture
Cancel gallery
Cancel camera
Deny camera permission
Replace image
Analyze image
Complete checklist
View result
Start new scan
Back navigation
Open result without completed scan
Recover from preprocessing error
Recover from inference error
```

## 5. Image Edge Cases

Test:

- portrait;
- landscape;
- square;
- 12-megapixel camera image;
- low resolution;
- dark;
- overexposed;
- low contrast;
- PNG;
- screenshot;
- non-sugarcane plant;
- unrelated object.

A closed-set classifier will always prefer one known class. Verify that the UI does not claim that a score proves the image is sugarcane.

## 6. Repeated-Run Stability

On each test phone:

1. launch app;
2. run ten consecutive scans;
3. alternate gallery and camera when practical;
4. observe memory, delays, and crashes;
5. verify each New Scan clears prior state.

Pass condition:

- no crash;
- no stale result;
- no permanently stuck loading state;
- no uncontrolled increase in processing time.

## 7. Offline Test

Use the preview APK.

```text
Install while online
Close application
Enable airplane mode
Reopen application
Select local image
Run inference
Capture camera image
Run inference
Open result
Start another scan
```

Pass condition: the full scan pipeline works without network or Metro.

## 8. Performance Measurement

Measure separately:

```text
Cold model load
Image preprocessing
Model inference
Total Analyze-to-result time
```

Initial prototype targets:

| Metric | Target |
|---|---|
| Cold model load | 4 seconds or less |
| Warm preprocessing plus inference | 2 seconds or less |
| Consecutive runs | 10 without crash |
| Loading feedback | Appears immediately |
| Offline operation | Complete |

These are internal acceptance targets. Present only measured results.

## 9. UI and Accessibility Review

Check:

- text readability;
- loading-state visibility;
- disabled-button state;
- warning contrast;
- touch target size;
- scrolling on small displays;
- image scaling;
- dark mode where supported;
- screen-reader labels on major actions;
- no clipped percentages or disease names.

## 10. Static and Build Verification

Run:

```bash
npm ci
npx expo-doctor
npm run lint
npx tsc --noEmit
eas build --platform android --profile development
eas build --platform android --profile preview
```

Do not state that checks passed unless command output confirms success.

## Defect Priority

### Release Blocker

- app crash;
- model cannot load;
- preprocessing parity failure;
- wrong label order;
- fake or stale result;
- preview APK requires Metro;
- offline pipeline fails.

### High

- camera or gallery unusable;
- result screen misrepresents scores;
- checklist changes AI confidence;
- repeated scans become stuck;
- permission denial has no recovery.

### Medium

- quality warning threshold needs adjustment;
- minor layout problem;
- timing display issue;
- debug-screen inconvenience.

### Low

- cosmetic spacing;
- nonessential animation;
- optional wording refinement.

## Test Record

Create:

```text
docs/model-v0/qa/test-report.md
docs/model-v0/qa/device-matrix.md
docs/model-v0/qa/known-limitations.md
```

## Suggested Commit

```text
test(model): validate parity, offline use, devices, and performance
```

This commit should mainly contain tests, fixtures, reports, and small verified fixes. Large feature changes should return to the appropriate earlier phase.

## Rollback Safety

Testing files and fixtures are additive. Avoid mixing broad refactors into this phase. A failing feature should be corrected in its originating phase commit whenever possible.

## Exit Criteria

- Preprocessing parity passes.
- Output parity passes.
- Two Android devices complete the workflow.
- Preview APK works in airplane mode.
- Ten repeated scans do not crash.
- All release blockers are closed.
- Known limitations are documented.
- QA Engineer and Product Owner sign off the release candidate.
