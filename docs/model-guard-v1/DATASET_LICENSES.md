# CaneGuard Guard V1 — Dataset Sources and License Record

**Last reviewed:** 2026-11-19  
**Scope:** Frozen experimental Guard V1 binary sugarcane-presence model.  
**Model:** `assets/models/caneguard_guard_v1_float32.tflite` (tracked public offline app asset).
**Frozen manifest SHA-256:** `989fc0303c1ba9269f85e98ec16d664f5d4b8413b1987e0ad49673c14b031490`.

This record identifies the datasets and collected photos used in Guard V1 and distinguishes available license declarations from permissions that still require review. It does **not** claim that all source rights are cleared. Public visibility, including public Facebook posts or openly downloadable datasets, is not itself a copyright license.

The research team assembled a **mixed sugarcane-positive collection** from team-collected field photographs, publicly accessible online datasets, and publicly accessible social-media/online images. The non-sugarcane-negative collection came from eight Roboflow Universe exports. Image counts below are based on the frozen experimental training inventory and source review.

## 1. Dataset composition

| Class | Images | Provenance |
| --- | ---: | --- |
| Sugarcane / positive | 1,174 | Field photographs, public online datasets, and publicly accessible social-media/online photographs |
| Not sugarcane / negative | 1,085 | Eight Roboflow Universe dataset exports |
| **Total** | **2,259** | **Frozen Guard V1 experimental training/evaluation collection** |

The frozen split comprises 1,655 training images, 360 validation images, and 244 internal-test images. The separate V2 130-image reserved holdout was not used for Guard V1.

## 2. Non-sugarcane datasets: published license declarations

The source folders contain a `README.dataset.txt` declaring **Creative Commons Attribution 4.0 International (CC BY 4.0)** and linking to the corresponding Roboflow Universe project. These are **recorded license declarations**, not a completed independent chain-of-title audit for each photograph.

| Dataset export (as received) | Publisher / account | Images used | Original source | Evidence in Drive | Recorded license |
| --- | --- | ---: | --- | --- | --- |
| Banana leaf classification v4, updated draft | pikachu-fhc5p | 150 | [Roboflow Universe](https://universe.roboflow.com/pikachu-fhc5p/banana-leaf-classification-ud6gx) | [README.dataset.txt](https://drive.google.com/file/d/1KQg8bhrLSrjszF4pTbYMTh6rT8h0TSZ7/view) | CC BY 4.0 declared |
| Banana leaf diseases v2 | kewalee | 100 | [Roboflow Universe](https://universe.roboflow.com/kewalee/banana-leaf-diseases) | [README.dataset.txt](https://drive.google.com/file/d/1bC-pOh7-V6BjnYr06ee95o3VORgWufBp/view) | CC BY 4.0 declared |
| Grass weeds v1, release | Roboflow / object-detection | 240 | [Roboflow Universe](https://universe.roboflow.com/object-detection/grass-weeds) | [README.dataset.txt](https://drive.google.com/file/d/1jLiG26E-kytlyFBO1L7GRDhu5tL2wzHb/view) | CC BY 4.0 declared |
| Trees v1 | aeonx-dev | 165 | [Roboflow Universe](https://universe.roboflow.com/aeonx-dev/trees-1ifnq) | [README.dataset.txt](https://drive.google.com/file/d/1BPyHQQjOSt8JC0dB5MybpTV4dmP-rpap/view) | CC BY 4.0 declared |
| Cars v3 | trabajo-y9216 | 159 | [Roboflow Universe](https://universe.roboflow.com/trabajo-y9216/cars-blxk2) | [README.dataset.txt](https://drive.google.com/file/d/1bfGtPsMtvwNpLCxdaGjmgP2DotsuHx4D/view) | CC BY 4.0 declared |
| Building v4 | airpioneer | 145 | [Roboflow Universe](https://universe.roboflow.com/airpioneer/building-tsffm) | [README.dataset.txt](https://drive.google.com/file/d/13cGDl7oaB6SPkLwl4No64DSIPfjbL3N6/view) | CC BY 4.0 declared |
| Table v2 | samuel-messias-jlp0e | 51 | [Roboflow Universe](https://universe.roboflow.com/samuel-messias-jlp0e/table-aqjlz) | [README.dataset.txt](https://drive.google.com/file/d/1UQvcsbNmddD4LFjR6ZlFEXhfLR5VDymX/view) | CC BY 4.0 declared |
| Shoes v6 | changshininc | 75 | [Roboflow Universe](https://universe.roboflow.com/changshininc/shoes-ntjz4) | [README.dataset.txt](https://drive.google.com/file/d/16ORoBYM0_cBESnZDVPvkghzJuCnr_yaM/view) | CC BY 4.0 declared |
| **Total** | | **1,085** | | | |

Original archived exports: [Negative Images for Caneguard (Google Drive)](https://drive.google.com/drive/folders/1tHJ0rkft-jX2P8AhuouJOKByH00FKqFi). Source file versions above are based on archive names and README records, not independently confirmed Roboflow version IDs.

**Attribution statement:** CaneGuard's negative training data were selected from the Roboflow Universe datasets linked above. The research team filtered, selected, resized and processed images for model training. Some export images may already have been resized or augmented by the original platform. See the individual project pages and README files for publisher details. License text: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

## 3. Sugarcane-positive sources: mixed provenance

The following 12 source groups and counts are transcribed from the [Guard V1 positive-source review](https://drive.google.com/file/d/1L8hurhnasshTyse5GxgCUN8ohXf1tMzs/view). Folder/source names do not on their own prove the precise image origin or licensing status.

| Frozen source group | Images | Known source or collection folder | License / permission status |
| --- | ---: | --- | --- |
| Cogunan, Nasugbu, Batangas | 32 | [Field collection sessions](https://drive.google.com/drive/folders/1hEH59YYI0D9OOUoOUrdqEvUrdIkMcI66) | Team-collected field imagery; photographer/land access and reuse authorization to document |
| Field: SESSION_005_20260720_WALTER_NIKKO_RONEL | 12 | [Session 005 folder](https://drive.google.com/drive/folders/1XzFlCPMf2glQt7CcikVF9gHm1oqty6P2) | Team-collected field imagery; photographer/land access and reuse authorization to document |
| SESSION_007_20260722_LANCE | 70 | [Session 007 folder](https://drive.google.com/drive/folders/12HQc6luB5pCFucmEyvBTm5o4ZdmI5tdO) | Team-collected field imagery; photographer/land access and reuse authorization to document |
| S2RMCMD | 13 | [Potential published dataset](https://data.mendeley.com/datasets/rt8sv9t445/2) | Publisher page declares CC BY 4.0; exact-file/version matching pending |
| SOURCE_003_S2RMCMD | 5 | [Drive source folder](https://drive.google.com/drive/folders/1yS8cbYigaoUfipJg25rYC_S_quEvNfzr) and [potential published dataset](https://data.mendeley.com/datasets/rt8sv9t445/2) | Publisher page declares CC BY 4.0; exact-file/version matching pending |
| SOURCE_004_Sugarcane_Plant_Disease_Dataset_of_Assam | 10 | [Drive source folder](https://drive.google.com/drive/folders/13OtpGB3aH0XUSRAdAJe7Frc3LSVIrRTh) and [publisher dataset](https://data.mendeley.com/datasets/x98kpjvxxg/1) | Publisher page declares CC BY 4.0; exact-file/version matching pending |
| SOURCE_005_Sugarcane_Disease_Dataset_Mendeley_Data | 249 | [Drive source folder](https://drive.google.com/drive/folders/1bo9n6SsM0QoZULMx727PeucKFa4Nxr-t) and [publisher dataset](https://data.mendeley.com/datasets/7fbnxcbnhp/2) | Publisher page declares CC BY 4.0; exact-file/version matching pending |
| SOURCE_006_Sugarcane_Pest | 40 | [Original online-source folder](https://drive.google.com/drive/folders/1F1-MoHNG1r9ARsWB2FitJpGEfuDDUcEO) | Publicly collected online imagery; original author, source URL and reuse license not yet recorded |
| SOURCE_007_Sugarcane_Pest_Diseases_FB_Google | 23 | [Original online-source folder](https://drive.google.com/drive/folders/1BQ037TEh5LK4BLkL9biwoZA2d90wiC-C) | Publicly accessible Facebook/Google images; individual permission/license not established |
| SOURCE_007_Sugarcane_Pest_FB | 36 | [Online-source collection](https://drive.google.com/drive/folders/1afYHIWOBiPIVvuQMDEmF4SPoIZMBe7iL) | Publicly accessible Facebook images; individual permission/license not established |
| Sugarcane Leaf Disease Dataset | 503 | [Original online-source folder](https://drive.google.com/drive/folders/1pLjYLuagoX2x0-4IIZD-HWBobsb3me8u) | Dataset license and exact rights holder not established in stored evidence |
| Sugarcane Smut Dataset | 181 | [Original online-source folder](https://drive.google.com/drive/folders/1llzqvTPo1BneBgHWPPp78u0C9WaJqjYk) | Dataset license and exact rights holder not established in stored evidence |
| **Total** | **1,174** | | |

**Collection description:** The sugarcane class combines original field photographs collected by project members with photographs from online disease and pest datasets. Some online items were gathered from publicly accessible Facebook posts and web sources. Public availability is stated only as provenance; it is **not** described as permission to redistribute, relicense, or publish those photographs or model weights.

### Published dataset declarations identified for matching

- **Sugarcane Disease Dataset**, version 2, by Anisa Shikalgar, Sanket Jadhav, Atharv Surve, Sarvesh Bamane and Ashish Kamble — [Mendeley Data DOI 10.17632/7fbnxcbnhp.2](https://data.mendeley.com/datasets/7fbnxcbnhp/2), publisher declares CC BY 4.0.
- **Sugarcane Plant Disease Dataset of Assam**, version 1, by Ankita Goyal Agarwala, Mirzanur Rahman and Gaffar Sarwar Zaman — [Mendeley Data DOI 10.17632/x98kpjvxxg.1](https://data.mendeley.com/datasets/x98kpjvxxg/1), publisher declares CC BY 4.0.
- **S2RMCMD**, version 2, by anand kumar jain anand, Neeta Nain and SAGAR MAL NITHARWAL NITHARWAL — [Mendeley Data DOI 10.17632/rt8sv9t445.2](https://data.mendeley.com/datasets/rt8sv9t445/2), publisher declares CC BY 4.0.

These publisher pages provide useful attribution and license declarations. The inventory's source-group labels must still be reconciled against the actual downloaded images before marking those images cleared.

## 4. Use of the data and changes made

- Images were inventoried, filtered for relevance/quality, and split for experimental model development.
- A frozen 2,259-image manifest was used to train a binary MobileNetV2 sugarcane-presence classifier.
- Training preprocessing used EXIF-aware RGB conversion and direct bilinear resize to 224 × 224. Training also used model/data augmentations.
- The training process generated a separate TFLite model. The project owner intends to publish this model as an offline Android asset. Raw source images are **not** committed with this documentation.
- Dataset citations acknowledge sources; citations alone do not replace any required licenses, terms or permissions.

## 5. Current review status and release controls

| Review item | Current finding | Action before declaring rights cleared |
| --- | --- | --- |
| Eight Roboflow negative sets | All eight original export READMEs declare CC BY 4.0 | Confirm original publisher licenses/rightsholder authority where necessary; retain attribution and relevant evidence |
| Three named Mendeley dataset groups | Publisher pages declare CC BY 4.0 | Match exact used images and versions; preserve attribution |
| Additional named online sugarcane datasets | Sources identifiable in Drive; specific licenses not documented | Locate original publishers and their actual license/permission terms |
| Publicly accessible Facebook/Google images | Public provenance known; redistribution permission unknown | Find image-level author/terms or obtain authorization; otherwise replace and retrain |
| Field-collected photographs | Collection session folders exist | Confirm photographer ownership and any participant, site, or data-use permissions that apply |
| Public model distribution | Rights review incomplete; owner requests public model asset for capstone | Do not mistake repository availability for proof of third-party rights or unrestricted redistribution permission. Preserve source provenance and confirm outstanding authorizations |

**No explicit source permission is invented by this file.** This is a transparent attribution and review record, not a blanket open-data license or a grant of permissions to third parties. It does not change the repository's software license or the trained model's distribution status.

For further documentation see [MODEL_CARD.md](MODEL_CARD.md), [REPO_INSTALL.md](REPO_INSTALL.md), the [frozen manifest and audit folder](https://drive.google.com/drive/folders/1ULWPFizZ9xvUw0rgXaEss4btMoSMD_Yb), and the [source permissions folder](https://drive.google.com/drive/folders/19oV00EGquoulQeP5IpNc-lI72CJNrZNk).
