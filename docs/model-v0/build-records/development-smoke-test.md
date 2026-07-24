# Model v0 Development Smoke-Test Build Record

## Status

**Pending external build and physical-device validation.**

This record was prepared on July 25, 2026. No EAS build, installation, or device test has been claimed yet.

## Build Configuration

| Field | Value |
|---|---|
| Git commit before local implementation | `479943dd439ef5a0aee5f43e84a156df7d44f68b` |
| EAS profile | `development` |
| Platform | Android |
| Artifact type | APK |
| Development client | Enabled |
| Distribution | Internal |
| Android package | `com.niks0501.caneguard` |
| Runtime delegate | CPU |
| Model asset | `assets/models/caneguard_leaf_v0_1_baseline.tflite` |

## Result

| Check | Result | Evidence / notes |
|---|---|---|
| Local clean dependency install | Passed | `npm ci` installed 844 packages |
| Expo Doctor | Unavailable | `npx expo-doctor` could not resolve `registry.npmjs.org` (`EAI_AGAIN`); network escalation was not approved |
| Lint | Passed | `npm run lint` via `just verify-targeted` |
| Typecheck | Passed | `npx --no-install tsc --noEmit` via `just verify-targeted` |
| Resolved Expo config | Passed | Installed Expo CLI resolved SDK 57, package ID, EAS project ID, runtime version, and updates URL |
| Android JS/asset export | Passed | Android bundle exported locally; output included the 2.5 MB `.tflite` asset |
| EAS development build | Not run | Requires EAS authentication and remote build approval |
| APK installation | Not run | Requires physical Android device |
| Application launch | Not run | Requires installed development build |
| Bundled asset resolution | Not run | Verify on `model-smoke-test` route |
| Native TFLite initialization | Not run | Verify on `model-smoke-test` route |
| Model loaded state | Not run | Screen must show `Model loaded` |
| Failure state | Not run | Break the model path locally in a disposable test build |
| Route reopen / reuse | Not run | Reopen route; provider should retain the root-scoped model |

## Device

| Field | Value |
|---|---|
| Device model | Pending |
| Android version | Pending |
| Installation result | Pending |
| Model-load result | Pending |

## Commands for the Approved Build Run

```bash
eas build --platform android --profile development
npx expo start --dev-client
```

Open the developer route with the app scheme:

```text
caneguardmobile://model-smoke-test
```

## Unresolved Warnings and Gaps

- The training pipeline has not yet confirmed color order or resize behavior.
- The held-out parity fixture is not available.
- Expo Go cannot validate `react-native-fast-tflite`; use the development APK.
- `npm ci` warned that `uuid@7.0.3` is deprecated.
- `npm ci` reported an unreviewed install script for `unrs-resolver@1.12.2`.
- Expo Doctor is unavailable until registry access is allowed or the CLI is installed locally.
- Remote build, APK installation, offline behavior, and physical-device model loading remain unverified.

## Rollback

Remove the isolated `model-smoke-test` route and the root `CaneGuardModelProvider` integration. The existing mock scan flow does not depend on either.
