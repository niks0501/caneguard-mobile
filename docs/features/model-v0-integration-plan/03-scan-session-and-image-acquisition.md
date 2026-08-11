# Phase 3 — Scan Session and Image Acquisition

## Objective

Replace the mock scan navigation with a real user flow that captures or selects an image, stores it in one temporary scan session, and displays the actual image in the preview screen.

## Primary Owners

- **Business Analyst:** defines the user workflow and recovery scenarios.
- **System Analyst:** defines scan-session state and navigation behavior.
- **UI/UX Designer:** designs permission, cancellation, preview, replace, and loading states.
- **Software Developers:** implement context, picker integration, and screens.
- **Software Architect:** prevents route parameters from becoming the data layer.
- **QA Engineer:** tests Android picker and camera edge cases.

## User Workflow

```text
Scan screen
   ├── Upload Image
   │      └── Android gallery picker
   └── Capture Photo
          └── Android camera
                  ↓
          Store selected asset
                  ↓
             Image preview
```

The user must see the exact image that will be analyzed.

## State Architecture

Create:

```text
src/features/detection/context/ScanSessionProvider.tsx
src/features/detection/context/useScanSession.ts
src/features/detection/types.ts
```

Use React Context and `useReducer`. Do not add a state-management dependency for this temporary workflow.

Recommended state:

```ts
export interface ScanSessionState {
  sourceUri: string | null;
  processedUri: string | null;
  sourceWidth: number | null;
  sourceHeight: number | null;
  sourceType: 'camera' | 'gallery' | null;
  status:
    | 'idle'
    | 'image-selected'
    | 'preprocessing'
    | 'running'
    | 'completed'
    | 'error';
  result: DetectionResult | null;
  selectedSymptoms: string[];
  reportedSeverity: 'Mild' | 'Moderate' | 'Severe' | null;
  errorMessage: string | null;
}
```

Required actions:

```text
SELECT_IMAGE
RESET_SCAN
START_PREPROCESSING
START_INFERENCE
COMPLETE_INFERENCE
SET_SYMPTOMS
SET_REPORTED_SEVERITY
SET_ERROR
```

Wrap the application routes with the provider in `_layout.tsx`.

## Gallery Implementation

Use `expo-image-picker` and configure:

- image media type only;
- one image only;
- no Base64 during selection;
- no forced editing for the first implementation;
- highest practical quality.

Behavior:

- on success, validate the first asset;
- store URI, width, height, and `gallery` source;
- clear previous prediction and checklist;
- navigate to image preview;
- on cancellation, remain on the scan screen;
- on malformed result, show a recoverable error.

## Camera Implementation

Request camera permission only after the user taps **Capture Photo**.

Behavior:

- granted: open camera;
- denied: show explanation and retry path;
- canceled: remain on scan screen;
- success: store image metadata and navigate;
- failure: show recoverable error.

Check pending picker results on Android when appropriate so the app can recover if the activity was recreated while the picker was open.

## Scan Screen Changes

Replace the shared mock handler with:

```text
pickFromGallery()
captureWithCamera()
```

Disable repeated taps while a picker operation is active.

Keep the existing photo guidance and decision-support disclaimer.

## Preview Screen Changes

Display:

- actual selected image;
- source type;
- source width and height when available;
- Retake or Replace action;
- Analyze action;
- no placeholder after a valid image exists;
- clear no-image recovery state.

The Analyze action will call the preprocessing pipeline in the next phase. During this phase it may remain disabled or lead to a temporary “pipeline not implemented” notice. It must not navigate to a fake result.

## UI/UX States

The designer must account for:

- first-time camera permission;
- denied permission;
- picker cancellation;
- image-loading delay;
- invalid or missing URI;
- replacing an existing image;
- returning from preview to scan;
- beginning a completely new scan.

Messages should use plain language. Avoid native error jargon in user-facing text.

## QA Test Cases

| Test | Expected Result |
|---|---|
| Select gallery image | Actual image appears in preview |
| Capture camera image | Actual image appears in preview |
| Cancel gallery | Remain on scan screen |
| Cancel camera | Remain on scan screen |
| Deny camera permission | Explanation and retry option |
| Select another image | Old result and checklist are cleared |
| Navigate back and forward | Current image remains in session |
| Reset scan | All scan data clears |
| Invalid asset result | Error state; no crash |
| Android activity recreation | Pending picker result is recovered when supported |

## Non-Goals

This phase does not:

- resize or normalize pixels;
- run the model;
- produce disease scores;
- persist scan sessions after app termination;
- upload images to a server.

## Suggested Commit

```text
feat(scan): add scan session and real image acquisition
```

## Rollback Safety

The provider, picker handlers, and preview rendering should be added without changing model code. If image acquisition introduces issues, revert this commit and return to the prior mock navigation while retaining the native model smoke test.

## Exit Criteria

- Gallery and camera both produce real preview images.
- Permission denial and cancellation are handled.
- Session state replaces scan data in route parameters.
- A second image resets previous scan-specific state.
- No fake result can be reached from preview.
