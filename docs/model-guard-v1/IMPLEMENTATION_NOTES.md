# Guard V1 implementation notes

Status: **required in the scan workflow, model bundled, research-only.** The captain added the binary to this public branch for the capstone and ordered the PR handed over; production activation and source/model-license clearance remain pending (see `MODEL_CARD.md` and `DATASET_LICENSES.md`). Guard V1 is a presence gate, never a disease score. There is no experimental flag: every captured or uploaded photo goes through it.

## What runs

```
photo (camera or gallery) -> V2 letterbox + quality gate (unchanged)
   quality warnings -> stop (guard and V2 not run)
   Guard V1: direct-stretch tensor from the SAME source photo -> p_sugarcane
      >= 0.75 -> V2 runs once (five labels incl. RSSI); result carries guardModelId
      <  0.75 -> "not sugarcane" retake message, zero V2, no result
      fault   -> "check could not finish" + Try again, zero V2, no result
```

| Piece | File |
| --- | --- |
| Pinned contract | `src/features/detection/constants/guardContract.ts` |
| Decision rule, fail-closed output reader, errors | `model/guardInference.ts` |
| Loader: SHA-256 pin check, then tensor-metadata check (web always fails closed) | `model/guardArtifact.ts`, `useGuardModel.tsx`, `.web.tsx`, `validateGuardContract.ts` |
| Exclusive native invocation (no overlap, outputs copied) | `model/exclusiveRun.ts` |
| Direct-resize tensor: JPEG/PNG in-memory JS decode, EXIF orient, bilinear resize, opaque alpha only (602112 bytes); WebP uses the documented conversion path | `preprocessing/guardPreprocess.ts`, `decodePng.ts` |
| Gate, run tokens, stale photo/owner protection | `analysis/useScanAnalysis.ts` |
| Failure state; resumed drafts and records require the marker | `scanSessionReducer.ts`, `scanCheckState.ts`, `scanDraftCheckpoint.ts`, `recordValidation.ts` |
| Copy / UI | `GUARD_COPY` in `src/constants/copy.ts`, `src/app/symptom-checklist.tsx` |

V2 preprocessing, weights, labels, versions and the RSSI confidence-caution threshold are untouched.

## Binary

`assets/models/caneguard_guard_v1_float32.tflite` (5441252 bytes, SHA-256 `36c51418...fe6d60`) is tracked and bundled like the V2 model (`require` in `useGuardModel.tsx`; no environment or install step). The app refuses any bundled file whose SHA-256 differs before loading it, and `python3 scripts/verify_guard_v1_assets.py` verifies the same offline. Rights are not cleared by publishing it: the dataset attribution and review record is `DATASET_LICENSES.md` (CC BY 4.0 credits for the eight Roboflow negative sets and the Mendeley sugarcane sets; mixed positive-image provenance), summarised in `MODEL_CARD.md`.

## Lifecycle

The scan-session provider owns app lifecycle state. Work that is waiting to enter a native call waits for the app to become active, while an already-started native call settles once; its session identity remains attached across checklist unmounts and background transitions, so an accepted photo reaches V2 exactly once. Real-device background behavior is left to the device pass.

## Acceptance criterion

Every Guard rejection (p_sugarcane below 0.75, or any invalid output) blocks the photo: zero V2 runs, no result. Every accept at or above the frozen 0.75 passes to V2. The model's measured false-acceptance rate (6.75% on the internal test, e.g. grass/weeds, banana, trees) is accepted as a known limitation; the model, its threshold and training stay closed (no retraining, no threshold change).

## Upload formats

Guard preprocessing reads the same photos V2 accepts. JPEG and PNG (opaque only, with EXIF or PNG orientation applied) are decoded in memory. WebP has no in-memory decoder in the app, so it is converted to JPEG by the platform image manipulator (the same API the V2 path uses, no new dependency), and the scratch file that call writes is deleted immediately; transparent WebP and transparent PNG are refused with a retake message.

## Evidence

**Mocked-runtime Jest** (no device): accept 0.75/1, reject 0/0.749999; NaN, infinities, out-of-range, wrong shape/count, runtime error, wrong input size, wrong artifact and bad tensor metadata fail closed; zero V2 invocations and no result on reject or fault for captured and uploaded photos; one V2 with five labels on accept; quality gate first; retry; photo replacement, owner change, native-call exclusivity; lifecycle reattachment keeps one accepted run across checklist unmount and background transitions; resumed drafts and records without the marker are refused; web fails closed. `useScanAnalysis.guard.test.tsx` is the workflow test. The real JPEG preprocessor test compares upright and EXIF-rotated fixtures at five 224x224 RGB landmarks independently recorded with ffmpeg bilinear scaling, allowing at most 24 RGB units per channel.

**Real binary oracle** (`scripts/tests/test_guard_v1_model.py`, run by CI after `verify:fast` and locally with `python3 scripts/tests/test_guard_v1_model.py`; fixtures and goldens in `qa/guard-v1/`): SHA, real tensor ABI, and real CPU inference (`ai-edge-litert` only) on self-created synthetic fixtures. Numeric goldens (accept 0.981, EXIF-rotated 0.979 with transpose and 0.259 without, reject 0.113) were generated on 2026-11-19 through Pillow and are verified through a second, independent path (numpy-only EXIF orientation and half-pixel bilinear resize without antialiasing, the app's semantics; agreement within 0.005 against a tolerance of 0.05). Decisions at 0.75, orientation and double-normalization checks complete the oracle. It needs numpy, Pillow and ai-edge-litert (`pip install numpy pillow ai-edge-litert`). Caveats: the goldens pin the model and these Python references, not the Android decoder; synthetic fixtures are not field photos.

All worker-written tests are proposals until the captain or the named delegate promotes them. Frozen T3 suites were not edited. Existing non-frozen fixtures (`symptom-checklist.test.tsx`, record/draft tests) were updated only to carry the guard marker / guard mock.

## Manual captain checklist (not run by the worker)

1. `python3 scripts/verify_guard_v1_assets.py && python3 scripts/tests/test_guard_v1_model.py`.
2. Build the Android app (the device pass is run by the captain). Real sugarcane photo from camera and from gallery: accepted, V2 result with five labels.
3. Non-sugarcane photos (desk, face, grass, banana): "does not look like sugarcane", no result, no Continue, no saved scan; retake works.
4. Airplane mode: repeat 2 and 3.
5. Rotate-photo check: a portrait photo taken with the phone sideways still accepted (EXIF).
6. Record latency and memory on device (not measured here; host CPU is about 5 ms).

## Rollback

Revert this branch's commits. V2 files and weights were not modified.

## Open risks

- No independent field validation; 36-image visual sample; internal-test false acceptance 6.75% (grass/weeds, banana, trees).
- Rights for positive images and derived-model redistribution are unreviewed (`DATASET_LICENSES.md`); the public bundle is the captain's explicit order, and public APK artifacts will embed the model.
- Guard preprocessing decodes the source JPEG/PNG in JavaScript (no scratch file), orients by EXIF and resizes bilinearly; very large camera photos cost time and memory (cap 16 MP / 128 MB) and are untimed on device.
- Real-device Android inference, EXIF handling and bilinear parity are unverified by the worker.
- The guard and V2 share one native-call queue, so scans are strictly serial.
- Production activation is pending.
