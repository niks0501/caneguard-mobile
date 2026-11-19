# Install and bundle Guard V1

The model binary is intended to be tracked at `assets/models/caneguard_guard_v1_float32.tflite` alongside the existing V2 model for Android offline builds. The exact verified artifact must be used.

1. Switch to branch `feat/guard-v1-integration`.
2. If the binary is absent, extract `assets/models/caneguard_guard_v1_float32.tflite` from the Guard V1 drop-in package into that relative path.
3. Run `python3 scripts/verify_guard_v1_assets.py`.
4. Check `git status --short` and `git check-ignore assets/models/caneguard_guard_v1_float32.tflite`. The binary should be eligible for Git tracking and `git check-ignore` should produce no matching path.
5. Stage and commit the model with `git add assets/models/caneguard_guard_v1_float32.tflite` and `git commit -m "chore(guard-v1): add offline TFLite model"`.
6. Push to `feat/guard-v1-integration` and review draft PR #291.
7. Give the coding agent `docs/model-guard-v1/AGENT_IMPLEMENTATION_BRIEF.md`.

Expected model SHA-256: `36c514184aaa4f96ee762dcbc0ca32eb26df40acec919f6c4264e8ee44fe6d60`.

The user requested a public-repository artifact to support their academic capstone. This instruction does not certify image rights, waive original authors' permissions, or establish production/field suitability. Do not upload training images, private evidence, or personal consent forms to the public repository.

Guard V1 is a *sugarcane-presence gate*, not diagnostic Model V1. Preserve the separate five-class V2 disease classifier, its preprocessing, and labels.
