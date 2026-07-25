# CaneGuard Model V0.1 — Mobile Model Contract

- Input shape: `[1, 224, 224, 3]`
- Input dtype: `float32`
- Tensor layout: `NHWC`
- Color order: `RGB`
- Resize policy: direct stretch to `224 × 224`
- Interpolation: bilinear
- Center crop: no
- Letterbox/padding: no
- Mobile input values: raw `0..255`
- Mobile normalization: none
- Embedded preprocessing: `x / 127.5 - 1`
- Output shape: `[1, 3]`
- Output interpretation: softmax probabilities
- Label order: `healthy`, `mosaic`, `rust`
