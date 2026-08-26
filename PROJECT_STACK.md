# Project Stack Guide — React Native + Expo

Project-specific stack and implementation guidance for CaneGuard Mobile.

## Installed stack

- Expo SDK 57
- Expo Router
- React 19
- React Native 0.86
- TypeScript 6 with strict mode
- Expo SQLite
- Drizzle ORM / Drizzle Kit
- Expo SecureStore
- Expo FileSystem
- Expo Image Picker / Image Manipulator
- React Native NetInfo
- `react-native-fast-tflite`
- `react-native-nitro-modules`
- Jest + `jest-expo`
- React Native Testing Library
- EAS Build / Expo Updates

## Defaults

- Prefer APIs officially supported by the installed Expo SDK.
- Follow the existing Expo Router route and protected-route conventions.
- Avoid unnecessary native modules when Expo-supported APIs solve the problem.
- Account for iOS/Android platform differences when relevant, but optimize verification for the Android-first target.
- Handle permissions intentionally and explain why a permission is needed.
- Consider app lifecycle, network restoration, offline transitions, stale requests, and local persistence when relevant.
- Preserve accessibility labels/roles and touch-target usability.
- Keep expensive work off hot render paths.
- Avoid large synchronous work on the JS thread.
- Keep TypeScript strictness intact; do not solve errors with broad `any` types or disabled checks.

## Project architecture rules

### Routing and providers

`src/app/_layout.tsx` is the application composition root.

Preserve the provider responsibilities and authenticated/unauthenticated route boundaries. New cross-cutting providers should be introduced only when the concern genuinely needs application-wide lifecycle/state.

Screens should orchestrate UI and feature hooks. Put domain, persistence, synchronization, model, and API logic in their existing feature modules rather than embedding it directly in route components.

### Feature boundaries

Use the existing structure:

```text
src/
├── app/                 # Expo Router screens
├── components/          # reusable presentation components
├── config/              # environment/runtime configuration
├── constants/           # theme and shared constants
├── database/            # SQLite/Drizzle initialization and schema
├── features/
│   ├── auth/
│   ├── detection/
│   ├── records/
│   ├── reports/
│   ├── shared/
│   └── sync/
└── providers/
```

Prefer feature-local `api`, `data`, `domain`, `hooks`, `providers`, `services`, and `__tests__` folders over new generic utility buckets.

Use the configured import aliases:

```ts
@/*        -> ./src/*
@/assets/* -> ./assets/*
```

## Detection and model rules

The bundled TFLite model is a versioned application contract.

Source of truth:

`src/features/detection/constants/modelContract.ts`

Current contract:

- model version: `v0.1-baseline`;
- input: float32 `[1, 224, 224, 3]`;
- RGB / NHWC;
- labels: `healthy`, `mosaic`, `rust`;
- output: probability vector for those labels.

When changing the model artifact, preprocessing, tensor interpretation, labels, or postprocessing:

1. update the model contract intentionally;
2. preserve or update SHA/parity evidence;
3. update the relevant tests and fixtures;
4. validate the model in a compatible native development build.

Do not silently change preprocessing assumptions or label ordering.

Keep inference and image preprocessing outside normal render paths.

## Persistence rules

CaneGuard is offline-first.

Use Expo SQLite through the existing Drizzle/database abstractions. Do not bypass the repository/database layer from screens for convenience.

Persistent scan images must be copied to CaneGuard-managed filesystem storage before their URI is stored as a durable record.

Preserve:

- foreign-key behavior;
- database checks and indexes;
- transactional writes for a scan and its related rows;
- compensating managed-image cleanup when persistence fails;
- safe managed-image deletion boundaries;
- compatibility with existing Drizzle migrations.

A schema change must include the appropriate migration and verification.

## Authentication rules

Use the shared API client and existing auth service/provider.

- Bearer sessions belong in Expo SecureStore.
- Do not store auth tokens in AsyncStorage, source code, logs, or `EXPO_PUBLIC_*` values.
- Only `field_reporter` users are valid mobile synchronization users.
- Treat session restoration and expiration as normal lifecycle states.
- Keep auth/network errors mapped to recoverable user-facing states.

## API and synchronization rules

Use `src/features/shared/api/apiClient.ts` for CaneGuard backend requests.

The API base URL comes from:

`EXPO_PUBLIC_API_BASE_URL`

Outside development, it must be HTTPS.

Preserve the existing local synchronization state machine:

```text
local_only
  -> pending
  -> syncing
  -> synced
       or
     failed
```

Synchronization must remain retryable and must not destroy the local record after a failed upload.

The current synchronization triggers include:

- after save;
- startup;
- app resume;
- network restored;
- manual sync.

Avoid overlapping sync batches. Keep backend uploads idempotent around the local/client UUID contract.

The report multipart mapper is an external-contract boundary. Treat its field names and validation as compatibility-sensitive.

## UI and design system

Use `src/constants/theme.ts` as the token source before adding hard-coded design values.

Follow `.ai/design-system.md` for CaneGuard-specific UI direction.

Key rules:

- modern, minimalist, field-ready UI;
- Android-first mobile layouts;
- cards/lists instead of dense tables;
- accessible icon-only controls;
- clear touch targets;
- one primary action per screen when practical;
- pair status/disease colors with text;
- keep captured images visually important in scan/result flows.

Required product language:

- prefer `Possible disease` over `Diagnosis`;
- prefer `Confidence` over `Accuracy`;
- use `Pending sync` until a real upload attempt fails;
- do not describe AI outputs as expert-confirmed results.

AI result screens should retain the decision-support disclaimer.

## Native-runtime and development-build rule

CaneGuard includes native runtime dependencies such as `react-native-fast-tflite` and `react-native-nitro-modules`.

A development build is **stale** when a change modifies native runtime inputs, for example:

- adding/removing/upgrading a native package;
- changing Expo plugins;
- changing native app configuration;
- changing a dependency that requires a new native binary.

When the development build is stale:

```text
implementation
  -> unit/static checks
  -> rebuild development client
  -> install/run updated build
  -> Maestro or physical-device verification
```

Do not interpret Maestro/native-runtime failures from a stale build as application regressions.

For JS/TS-only changes that do not alter the native runtime, reuse the existing compatible development build.

Expo Go is not the authoritative runtime for TFLite/native-module verification.

## Verification

Use project-defined checks first:

```bash
npm run lint
npm run typecheck
npm test
npm run db:check
```

For broader coverage:

```bash
npm run test:coverage
```

Run the smallest relevant test suites during implementation, then broaden verification according to risk.

For critical flows, consider:

- unit/integration tests;
- Expo/React Native component tests;
- database migration and persistence tests;
- model contract/preprocessing/inference tests;
- auth and synchronization tests;
- Maestro E2E flows when a compatible development build is installed;
- agent-device or manual physical-device verification;
- Android-specific manual checks.

Native/device verification is especially important for:

- TFLite loading/inference;
- camera/gallery permissions;
- image preprocessing with real device files;
- SQLite migration and restart persistence;
- managed-image lifecycle;
- offline/online transitions;
- authentication/session restoration;
- report upload and retry behavior.

Do not run EAS build/submit automatically.

## EAS and deployment

Existing EAS profiles:

- `development`: internal development-client APK;
- `preview`: internal APK;
- `qa`: internal Preview APK on the `qa` channel for the public staging HTTPS API;
- `production`: production channel with auto-increment.

The hybrid QA delivery procedure and release-record template live in `docs/qa/mobile-candidate.md` and `docs/qa/mobile-release-record.template.md`.

Do not trigger EAS builds, submissions, or production updates without explicit user approval.

Treat changes to native dependencies or Expo native configuration as requiring development-build freshness before final device/E2E verification.

## Documentation

Official Expo documentation/skills are authoritative for SDK-specific behavior.

General React Native skills are complementary, not a replacement for Expo guidance.

For repository-specific behavior, prefer these local sources over generic advice:

- `PROJECT_CONTEXT.md`
- `src/features/**`
- `src/database/**`
- `src/features/detection/constants/modelContract.ts`
- `.ai/design-system.md`
- project tests and migrations
