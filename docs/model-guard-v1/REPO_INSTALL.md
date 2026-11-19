# Install Guard V1 locally

This repository intentionally omits the Guard V1 binary because source and model redistribution rights are not fully confirmed.

1. Fetch branch `feat/guard-v1-integration`.
2. Extract the approved `CaneGuard_Guard_V1_Repo_DropIn_20261119.zip` **locally**, or copy only its `assets/models/caneguard_guard_v1_float32.tflite` into the same relative path in the repository.
3. Check `git status --short` and ensure the binary is ignored.
4. Run `python3 scripts/verify_guard_v1_assets.py`.
5. Give the implementation agent `docs/model-guard-v1/AGENT_IMPLEMENTATION_BRIEF.md`.
6. Do not commit the model, raw images, private manifests or evaluation fixtures without confirmed rights.

Model SHA-256: `36c514184aaa4f96ee762dcbc0ca32eb26df40acec919f6c4264e8ee44fe6d60`.

Guard V1 is a *presence gate*, not the existing diagnostic Model V1. The existing V2 disease classifier, its preprocessing, and its labels must remain unchanged.
