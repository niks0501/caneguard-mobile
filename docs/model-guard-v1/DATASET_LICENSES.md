# CaneGuard Guard V1 — Dataset Attribution and Clearance Record

**Last reviewed:** 2026-11-19
**Scope:** Frozen Guard V1 binary sugarcane-presence model.
**Model:** `assets/models/caneguard_guard_v1_float32.tflite` (tracked offline app asset).
**Frozen manifest SHA-256:** `989fc0303c1ba9269f85e98ec16d664f5d4b8413b1987e0ad49673c14b031490`.

This record credits the datasets used to train Guard V1 and states the production decision. It is an attribution record, not a blanket license to third parties. Raw source images, field-session identifiers, collection locations, contributor names and internal evidence links are intentionally **not** published here.

## 1. Dataset composition

| Class | Images | Provenance |
| --- | ---: | --- |
| Sugarcane / positive | 1,174 | Team field photographs, published online datasets, and other publicly accessible online photographs |
| Not sugarcane / negative | 1,085 | Eight Roboflow Universe dataset exports |
| **Total** | **2,259** | Frozen Guard V1 training/evaluation collection |

The frozen split is 1,655 training, 360 validation and 244 internal-test images. The separate V2 130-image reserved holdout was not used for Guard V1.

## 2. Attribution: non-sugarcane datasets (CC BY 4.0)

The negative class was selected from the following Roboflow Universe projects, each declaring [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Images were filtered, selected and resized for training; some exports may already have been resized or augmented by the original platform.

| Dataset | Publisher / account | Source |
| --- | --- | --- |
| Banana leaf classification | pikachu-fhc5p | [Roboflow Universe](https://universe.roboflow.com/pikachu-fhc5p/banana-leaf-classification-ud6gx) |
| Banana leaf diseases | kewalee | [Roboflow Universe](https://universe.roboflow.com/kewalee/banana-leaf-diseases) |
| Grass weeds | Roboflow / object-detection | [Roboflow Universe](https://universe.roboflow.com/object-detection/grass-weeds) |
| Trees | aeonx-dev | [Roboflow Universe](https://universe.roboflow.com/aeonx-dev/trees-1ifnq) |
| Cars | trabajo-y9216 | [Roboflow Universe](https://universe.roboflow.com/trabajo-y9216/cars-blxk2) |
| Building | airpioneer | [Roboflow Universe](https://universe.roboflow.com/airpioneer/building-tsffm) |
| Table | samuel-messias-jlp0e | [Roboflow Universe](https://universe.roboflow.com/samuel-messias-jlp0e/table-aqjlz) |
| Shoes | changshininc | [Roboflow Universe](https://universe.roboflow.com/changshininc/shoes-ntjz4) |

## 3. Attribution: sugarcane datasets (CC BY 4.0)

The sugarcane class includes images from these published datasets, each declared CC BY 4.0 by its publisher:

- **Sugarcane Disease Dataset**, version 2, by Anisa Shikalgar, Sanket Jadhav, Atharv Surve, Sarvesh Bamane and Ashish Kamble — [DOI 10.17632/7fbnxcbnhp.2](https://data.mendeley.com/datasets/7fbnxcbnhp/2).
- **Sugarcane Plant Disease Dataset of Assam**, version 1, by Ankita Goyal Agarwala, Mirzanur Rahman and Gaffar Sarwar Zaman — [DOI 10.17632/x98kpjvxxg.1](https://data.mendeley.com/datasets/x98kpjvxxg/1).
- **S2RMCMD**, version 2, by anand kumar jain anand, Neeta Nain and SAGAR MAL NITHARWAL NITHARWAL — [DOI 10.17632/rt8sv9t445.2](https://data.mendeley.com/datasets/rt8sv9t445/2).

The remaining sugarcane images are team field photographs and other publicly accessible online photographs and datasets. Citations acknowledge sources and do not replace any required license or permission.

## 4. Use of the data and changes made

- Images were filtered for relevance and quality and split for model development.
- A binary MobileNetV2 sugarcane-presence classifier was trained with EXIF-aware RGB conversion, direct bilinear resize to 224 × 224, and augmentation, then exported to TFLite.
- Raw source images are not committed to this repository.

## 5. Production clearance record

| Item | Status |
| --- | --- |
| Production activation of this exact artifact (SHA-256 in the model card) | **Approved by the project captain on 2026-11-19** for the capstone production release |
| Creative Commons attribution for the credited datasets | Provided in sections 2 and 3 |
| Image-level rights for the remaining online-collected positive photographs | Not individually established; accepted by the captain as a known limitation of this release. Replacing those images and retraining is a follow-up, not a condition of this release |
| Field-collected photographs | Team-collected; collection evidence is held by the project team outside this repository |

Public repository availability is not a license for the underlying photographs. This record does not change the repository's software license.

See [MODEL_CARD.md](MODEL_CARD.md) and [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md).
