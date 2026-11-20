# CaneGuard Guard V1 — model card

**Status:** Capstone model bundled in the app. Production activation of this exact artifact was approved by the captain on 2026-11-19. Not independently field validated.

## Intended use

This separate binary sugarcane-presence gate precedes the unchanged five-class V2 disease/RSSI classifier. It cannot diagnose diseases, verify field authenticity, or replace expert judgment. Related investigation: [issue #290](https://github.com/niks0501/caneguard-mobile/issues/290).

## Fixed artifact and contract

- Android offline model asset: `assets/models/caneguard_guard_v1_float32.tflite`
- Model SHA-256: `36c514184aaa4f96ee762dcbc0ca32eb26df40acec919f6c4264e8ee44fe6d60`
- Training manifest SHA-256 (not committed to this repository): `989fc0303c1ba9269f85e98ec16d664f5d4b8413b1987e0ad49673c14b031490`
- Input: float32 RGB NHWC `[1,224,224,3]`. Apply EXIF orientation then bilinear **direct stretch** to 224 × 224. Supply 0–255; normalization (`x/127.5-1`) is embedded. **No V2 letterbox, padding, crop, or normalization outside model.**
- Output: one float32 sigmoid scalar `[1,1]` representing `p_sugarcane`.
- Accept: finite `p_sugarcane >= 0.75`; reject below 0.75; fail closed on invalid output or inference errors.
- Tensor names must be read from actual TFLite metadata, not inferred from V2.

## Study evidence

| Split | Sugarcane | Not sugarcane | Total |
| --- | ---: | ---: | ---: |
| Train | 895 | 760 | 1,655 |
| Validation | 198 | 162 | 360 |
| Internal test | 81 | 163 | 244 |

Validation: 97.50% accuracy (TN 154, FP 8, FN 1, TP 197). Internal test: 95.08% accuracy (TN 152, FP 11, FN 1, TP 80). False acceptance 6.75%; false rejection 1.23% at threshold 0.75. Major false acceptances: grass/weeds 5, banana 4, trees 2.

## Limitations and release conditions

Evaluation data share source collections with development data, so this is **not independent field validation**. Only 36 images received sample visual review. Image-level rights for the online-collected positive photographs are not individually established; the captain accepted this for the production release (see `DATASET_LICENSES.md`). No dataset photos or private manifests should enter the public repository. Preserve V2 and its separate 130-image holdout. The Guard gate is required for scans in this app. Public repository availability does not establish a license for underlying photographs or model weights.

## Data sources and attribution

Full record: [DATASET_LICENSES.md](DATASET_LICENSES.md). Summary:

- **Non-sugarcane (1,085 images):** selected from eight Roboflow Universe datasets, each declaring [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/): banana-leaf-classification (pikachu-fhc5p), banana-leaf-diseases (kewalee), grass-weeds (Roboflow object-detection), trees (aeonx-dev), cars (trabajo-y9216), building (airpioneer), table (samuel-messias-jlp0e), shoes (changshininc). Images were filtered, selected and resized for training; see the linked project pages for publishers.
- **Sugarcane (1,174 images):** team field photographs plus public datasets. Credited Mendeley Data sets (CC BY 4.0 declared by the publishers): [Sugarcane Disease Dataset v2](https://data.mendeley.com/datasets/7fbnxcbnhp/2) (Shikalgar, Jadhav, Surve, Bamane, Kamble), [Sugarcane Plant Disease Dataset of Assam v1](https://data.mendeley.com/datasets/x98kpjvxxg/1) (Agarwala, Rahman, Zaman), [S2RMCMD v2](https://data.mendeley.com/datasets/rt8sv9t445/2) (Jain, Nain, Nitharwal). The remaining positive images are team field photographs and other online-collected photographs; see the record.
- This attribution does not establish a license for the underlying photographs; see `DATASET_LICENSES.md` and `IMPLEMENTATION_NOTES.md`.
