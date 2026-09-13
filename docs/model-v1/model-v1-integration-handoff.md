# Model V1 integration handoff evidence

This directory freezes the deterministic evidence consumed by the later Model V1
integration tickets. It contains no model or Mobile behavior changes.

## Frozen identities

- Accepted deployment: `CaneGuard_V1_MobileNetV2_float32.tflite`
- Accepted SHA-256: `9ebad12450866b47abc94ffb6b820048c1759e3f3e728a71775af42a0541bae7`
- Class order: `healthy`, `mosaic`, `rust`, `smut`
- Preprocessing: float32 `[1, 224, 224, 3]`, RGB, input values `0..255`,
  aspect-ratio-preserving bilinear letterbox with value `127.5`, and no mobile
  normalization (the model internally applies `x / 127.5 - 1.0`).

The deployment contract and `labels.txt` in the read-only handoff must agree with
these identities. The generator fails closed on any mismatch and never falls
back to another artifact.

## Reproduction

`$HOME/projects/CaneGuard-V1-Integration-Handoff` is the read-only source of
truth. Run from the repository root:

```sh
HANDOFF="$HOME/projects/CaneGuard-V1-Integration-Handoff"
sha256sum "$HANDOFF/model/CaneGuard_V1_MobileNetV2_float32.tflite"
uv run --python 3.11 \
  --with tflite-runtime==2.14.0 \
  --with pillow==12.3.0 \
  --with 'numpy==1.26.4' \
  python scripts/freeze_model_v1.py \
  --handoff "$HANDOFF" \
  --output-dir .
```

The script verifies the model SHA before reading the five OOF prediction files,
validates the deployment contract and labels, and then runs the accepted
Float32 artifact on the four fixed QA fixtures. It reads exactly these OOF
files and exactly 567 rows:

- `training/fold1_validation_predictions.csv` (113 rows)
- `training/fold2_validation_predictions.csv` (113 rows)
- `training/fold3_validation_predictions.csv` (115 rows)
- `training/fold4_validation_predictions.csv` (113 rows)
- `training/fold5_validation_predictions.csv` (113 rows)

Holdout/evaluation outputs are not read or used for threshold selection. The
FP16 artifacts remain rejected references and are not used for QA output.

## Frozen threshold summary

The target event is an incorrect OOF prediction (`predicted_index != true_index`).
The score is the maximum of the four probability columns. Candidate thresholds
are `0.0`, every distinct observed max-Softmax score, and `1.0`; a sample is
warned when its score is strictly below the threshold. The selected candidate
maximizes error-detection F1, breaks ties by higher error recall, then uses the
higher threshold for a deterministic final tie-break.

The generated `threshold/v1-confidence-caution-threshold.json` records:

| threshold | F1 | precision | recall | warned | TP | FP | TN | FN |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 0.5516103 | 0.406250 | 0.393939 | 0.419355 | 33 / 567 (5.820106%) | 13 | 20 | 516 | 18 |

The five source-file SHA-256 identities are included in that JSON so a later
rerun cannot silently use changed evidence.

## Frozen QA expected outputs

`qa/expected-v1-outputs.json` contains the accepted model SHA, fixed class order,
the full preprocessing contract, fixture file SHA-256 identities, and all four
probabilities for every fixed fixture. Compact output table:

| fixture | expected top-1 | healthy | mosaic | rust | smut |
| --- | --- | ---: | ---: | ---: | ---: |
| healthy | healthy | 0.999998450 | 0.000001124 | 0.000000330 | 0.000000080 |
| mosaic | mosaic | 0.000249929 | 0.998384833 | 0.001355886 | 0.000009407 |
| rust | rust | 0.063064240 | 0.000000563 | 0.936916411 | 0.000018771 |
| smut | smut | 0.000039085 | 0.000000000 | 0.000020141 | 0.999940753 |

These are QA oracle values for the fixed fixtures, not new model-performance
claims. The model remains decision-support-only.
