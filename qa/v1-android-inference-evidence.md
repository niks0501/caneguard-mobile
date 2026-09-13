# Model V1 Android inference evidence

Recorded: 2026-09-13

## Build and runtime

- Build command: `eas build --platform android --profile development --local`
- EAS local build result: success; development APK installed on the connected Android device.
- APK archive SHA-256: `01a0c086d5fb29219a21cfc64c670edf4366745cecb0df4b0ec9248319c7d4ce`
- Application package/version: `com.niks0501.caneguard`, `1.1.1` (runtime policy `appVersion`, runtime `1.1.1`)
- Device: Android 16, model `2311DRK48G`
- Updates signing metadata in the built manifest: key id `caneguard-v1-20260913`, algorithm `rsa-v1_5-sha256`; the replacement public certificate is bundled.
- Model artifact SHA-256 verified in source and against the accepted handoff artifact: `9ebad12450866b47abc94ffb6b820048c1759e3f3e728a71775af42a0541bae7`

## Native QA runs

The development-only Model V1 debug route ran each bundled fixture through the actual Android `preprocessImage` → `runInference` pipeline. This was not a load-only check. Android displayed score values and deltas rounded to six decimal places.

| Fixture | Expected top-1 | Actual top-1 | Actual output (`healthy, mosaic, rust, smut`) | Absolute score deltas in label order |
| --- | --- | --- | --- | --- |
| healthy | healthy | healthy | `0.999944, 0.000033, 0.000022, 0.000001` | `0.000054, 0.000031, 0.000022, 0.000001` |
| mosaic | mosaic | mosaic | `0.000455, 0.998901, 0.000639, 0.000005` | `0.000205, 0.000516, 0.000717, 0.000005` |
| rust | rust | rust | `0.007159, 0.000021, 0.992812, 0.000008` | `0.055905, 0.000021, 0.055895, 0.000011` |
| smut | smut | smut | `0.000078, 0.000000, 0.000095, 0.999828` | `0.000038, 0.000000, 0.000074, 0.000113` |

All four expected top-1 results passed. Every fixture produced the required `224 × 224 × 3` float32 tensor (`602112` bytes), with Android letterbox geometry `168 × 224`, centered padding left/top `28/0`, and pixel statistics within the raw `[0, 255]` range. The non-zero probability deltas above are recorded as the observed Android JPEG decode/resize versus the Pillow QA oracle; the fixed class order and top-1 behavior remained unchanged, including the larger rust score shift.
