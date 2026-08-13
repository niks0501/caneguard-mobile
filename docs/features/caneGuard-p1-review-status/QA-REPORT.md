# CaneGuard Mobile P1 QA Pass

## Scope and risk posture

Risk-based QA covered the high-risk boundaries introduced by P1: additive SQLite persistence, authenticated owner scoping, server/client/remote identity matching, stale ordering, unknown status compatibility, cursor/checkpoint pagination, same-origin continuation safety, cache atomicity, lifecycle coalescing, offline last-known presentation, accessibility-neutral copy, and regression of P0 delivery behavior. Maestro was intentionally not executed per task instruction.

## Verification results

| Result | Command/check | Evidence |
|---|---|---|
| PASS | `npm run lint` | ESLint completed with no errors or warnings. |
| PASS | `npm run typecheck` | TypeScript strict check passed. |
| PASS | `npm run db:check` | Drizzle schema/migration consistency passed. |
| PASS | `npm test -- --runInBand` | 62 suites, 367 tests passed. |
| PASS | `git diff --check` | No whitespace errors. |
| PASS | Focused P1 Jest suites | Migration, repository, parser, domain, lifecycle, UI suites passed; included in full run. |
| PASS | `EXPO_PUBLIC_API_BASE_URL=https://api.example.invalid npx expo export --platform web --output-dir .expo/p1-export-check` | Web static export completed: 19 routes and web bundles emitted. `metro.config.js` now treats `.wasm` as an asset, and the web-only model implementation avoids the native TFLite module during web export. The output was removed after verification. |
| PASS | `EXPO_PUBLIC_API_BASE_URL=https://api.example.invalid npx expo export --platform android --output-dir .expo/p1-export-check-android` | Android production/static JS export completed and emitted the Android Hermes bundle, assets, and metadata. Output was removed after verification. |
| PASS | `npm run test:coverage -- --runInBand` | 62 suites, 367 tests passed; 89.3% statements / 84.65% branches / 92.04% functions / 89% lines for configured coverage scope. |
| NOT APPLICABLE | `npx expo doctor` | This repository's local Expo CLI explicitly reports that `expo doctor` is unsupported; no project script or supported local command exists. The command was attempted and documented rather than treated as a pass. |
| NOT RUN | `./.akidev/bin/maestro test .maestro/p1/01-report-review-status-and-offline-cache.yaml` | Intentionally not executed. No physical/device PASS claimed. |
| NOT RUN | Controlled backend update and offline restart | Requires backend fixture/service and runtime-fresh Android development build; unavailable in this lane. |

## Coverage map

- Migration/data preservation: migration 0004 is additive and nullable; upgrade tests prove all pre-existing Field Report columns survive and new authority columns initialize null; full Jest passed.
- Account isolation/identity: owner-scoped repository tests cover another account, client UUID, remote UUID, server-only rows, and missing server identity; lifecycle tests keep account/token coalescing independent.
- Ordering/unknown statuses: stale update rejection, equal/new update application, raw unknown preservation, safe generic label, and known five-label mappings are tested.
- Pagination/partial failure: complete cursor traversal, fixed `sync_before`, duplicate identity rejection, malformed later page rejection, pagination loop/continuation validation, and atomic repository application are tested.
- Same-origin safety: cross-origin and same-origin wrong-endpoint continuations are rejected before follow-up request.
- HTTP/network/offline: 401, 403, 404, timeout, network failure, malformed response, and cached last-known UI error states are covered.
- Focus/resume/manual/coalescing: lifecycle hook tests cover focus, manual refresh, stale resume, 401 session expiry, and repository/service coalescing.
- Persistence/restart-level unit/integration: SQLite migration and Node SQLite repository integration tests prove durable cache writes, owner filtering, stale protection, and account boundaries. Physical restart remains a gap.
- UI/accessibility/backward compatibility: list delivery status remains dominant over authority status; finalized detail separates Submission and Authority review, renders feedback/neutral attribution/server time, uses safe unknown copy, preserves pending/failed controls, and does not fabricate status for unavailable cache. Existing P0 suites passed.

## Environment gaps and residual risks

- No controlled backend worker/runtime was available, so the exact deployed wire response, live auth policy, server checkpoint behavior, and update/feedback round trip remain unverified here.
- No fresh physical Android build/device was available for the required P1 flow; Maestro scaffold is retained but deliberately not run.
- Web is configured as a supported Expo static output (`app.json` has `web.output: static`, `react-dom` and `react-native-web` are dependencies), so web export was repaired rather than excluded. The web-only model fallback is explicit: native TFLite inference remains Android/iOS-only; web can render the app shell and reports but cannot run the native model.
- `npx expo doctor` is not a supported command in this local Expo CLI; the CLI itself reported that fact. No repository-owned doctor script exists. `npx expo-doctor` was not run because it is an unlisted tool invocation and dependency installation/update was not authorized.
- P0 physical testing and known cross-repository payload-retention evidence remain separate and were not modified or weakened.
- The mobile parser accepts the established serializer envelope (`meta.sync_before`, `links.next`) and fail-closes malformed/cross-origin pages. Backend hardening must preserve that contract or explicitly coordinate a mobile change.

## Supported platform determination

Web is an explicitly configured and buildable Expo target, not an excluded platform: `app.json` declares `web.output: static`; `package.json` includes `react-dom` and `react-native-web`; and the repository exposes `npm run web`. Therefore the web export was treated as an applicable static/bundle check. The export uses a web-only Model v0 fallback because `react-native-fast-tflite` is a native Nitro module; this keeps web export deterministic without claiming browser TFLite support. Android remains the primary verified deployment target, with the Android export also passing.

## Coverage sufficiency rationale

The implementation-critical behavior is covered at its narrowest meaningful layers: Node SQLite integration proves migration and transaction behavior; pure domain tests prove copy/unknown semantics; API parser tests prove untrusted boundary handling; service tests prove coalescing and no-write-on-failure; hook/UI tests prove lifecycle and user-facing separation; and the complete regression suite proves no existing P0 behavior was broken. Only live backend/device evidence remains, and those are explicitly documented as non-passes rather than inferred from unit tests.
