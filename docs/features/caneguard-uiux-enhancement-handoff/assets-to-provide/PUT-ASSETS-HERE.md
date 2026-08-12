# Put Final Assets Here

This folder is documentation only. The final photos themselves belong in the app asset tree.

The implementing agent should wait for these exact files:

- `assets/images/sugarcane-diseases/reference_healthy.jpg`
- `assets/images/sugarcane-diseases/reference_mosaic.jpg`
- `assets/images/sugarcane-diseases/reference_rust.jpg`

When each file is supplied:

1. Verify it opens and is a real photograph.
2. Verify source/license details are recorded in `ASSET-MANIFEST.csv`.
3. Optimize file size without destroying visible symptoms.
4. Keep a reasonable source crop; do not over-zoom so the class cue becomes misleading.
5. Bundle locally with `require(...)` or the repo's established local-asset pattern.
6. Never convert the three reference photos into remote runtime URLs.

The generated mockup in `../references/` is not a source for these assets.
