# Install and bundle Guard V1

The verified model binary is tracked at `assets/models/caneguard_guard_v1_float32.tflite` alongside the existing V2 model for Android offline builds. Use only the pinned artifact; do not substitute a locally trained or otherwise unverified binary.

1. Run `python3 scripts/verify_guard_v1_assets.py`.
2. Check `git status --short` and `git check-ignore assets/models/caneguard_guard_v1_float32.tflite`. The tracked binary must not be ignored.

Expected model SHA-256: `36c514184aaa4f96ee762dcbc0ca32eb26df40acec919f6c4264e8ee44fe6d60`.

Production activation of this artifact was approved by the captain on 2026-11-19 (see `DATASET_LICENSES.md`); that does not establish field validation. Do not upload training images, private evidence, or personal consent forms to the public repository.

Guard V1 is a *sugarcane-presence gate*, not diagnostic Model V1. Preserve the separate five-class V2 disease classifier, its preprocessing, and labels.
