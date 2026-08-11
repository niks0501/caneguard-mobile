# Phase 0 — Compatibility Spike

**Repository:** `niks0501/caneguard-mobile`  
**Branch:** `feat/drizzle-sqlite-scan-records`  
**Stack:** Drizzle ORM + Expo SQLite + Expo FileSystem + Expo Crypto  
**Primary platform:** Android  
**Execution mode:** One phase at a time; do not continue past an unmet exit criterion


## Objective

Prove the selected stack can coexist with the current Expo SDK, React Native New Architecture, EAS configuration, Metro asset pipeline, Jest/TypeScript setup, and the existing native TensorFlow Lite integration before any production persistence feature is built.

This phase is deliberately narrow. It must establish compatibility and package versions, not build the final schema or user interface.

## Preconditions

- Start from an up-to-date, clean `main`.
- Create or switch to `feat/drizzle-sqlite-scan-records`.
- Confirm the current model integration and smoke-test route work before changing dependencies.
- Read `01-SHARED-CONTRACT.md`.
- Record the baseline commit SHA.

## Decisions that must be resolved

1. Which exact `drizzle-orm` and `drizzle-kit` versions work with Expo SDK 57?
2. Which Expo-compatible versions of `expo-sqlite`, `expo-file-system`, and `expo-crypto` will be installed?
3. What stable production database filename will be used?
4. Will Drizzle live queries be viable in this repository, or should route-focus refresh remain the fallback?
5. Which Android device will later be used for physical-device and performance acceptance?

Do not use `@next`, a release candidate, or an arbitrary latest version without documenting why and proving it in an Android build.

## In scope

- Dependency installation and version pinning
- Drizzle configuration
- Metro/Babel migration bundling configuration
- One minimal schema and generated migration used only to prove the pipeline
- Minimal database open and migration application
- Android JavaScript/asset export inspection
- EAS development or preview build
- Existing model smoke test after configuration changes
- Database persistence across restart
- Expo Doctor, lint, TypeScript, and test checks
- A written compatibility record

## Out of scope

- Final production schema
- Save Record interface
- Image storage service
- Records or Reports integration
- Authentication, backend, or sync
- Schema placeholders for future features
- Refactoring unrelated UI

## Expected deliverables

- Pinned dependency versions
- `drizzle.config.ts`
- Required Metro and Babel changes
- Migration import/bundle configuration
- One minimal generated SQL migration
- Minimal database-open proof
- Build and test record
- Compatibility decision log
- Rollback notes

## Execution steps

### 0.1 Capture the baseline

Run and record:

```bash
git status
git rev-parse HEAD
npm run lint
npx tsc --noEmit
npm test -- --runInBand
npx expo-doctor
```

Also run the existing Android/model smoke-test process already approved for the repository. Record any pre-existing warning separately so it is not blamed on Drizzle.

### 0.2 Install packages safely

Install Expo-managed packages through:

```bash
npx expo install expo-sqlite expo-file-system expo-crypto
```

Install pinned, tested Drizzle packages. Do not add unrelated state-management or validation packages during this spike.

### 0.3 Configure Drizzle

Create the minimum configuration required to:

- define an Expo SQLite schema;
- generate SQL migrations;
- import bundled migrations at runtime;
- include `.sql` files in Metro's source extensions, where required;
- preserve the existing `.tflite` asset extension handling;
- preserve existing Babel plugins and ordering.

Review configuration diffs carefully. Configuration must extend existing settings rather than replacing them wholesale.

### 0.4 Prove migration generation

Create a tiny compatibility-only table, generate one migration, inspect the generated SQL, and commit the migration and snapshot. Do not design the final scan schema in this step.

### 0.5 Prove runtime migration application

Open the database through Expo SQLite and apply the bundled migration. Confirm:

- first launch applies it;
- second launch does not repeat it;
- the database remains after app restart;
- errors are surfaced rather than swallowed.

### 0.6 Prove asset coexistence

Confirm the Android bundle contains:

- generated migration SQL;
- migration metadata required at runtime;
- the existing CaneGuard `.tflite` model asset.

Then run the existing model smoke test and one real inference path. Drizzle compatibility is not accepted if the model asset or native runtime regresses.

### 0.7 Prove the Android build

Create the approved EAS development or preview build. Install and launch it. Record:

- build profile;
- build ID or artifact reference;
- Android device and version;
- database-open result;
- migration result;
- app-restart persistence result;
- model-load and inference result.

### 0.8 Document and commit

Document tested versions, commands, results, warnings, and rollback instructions. Keep the spike code minimal and clearly mark whether the compatibility table will be removed or replaced in Phase 1.

## Required verification

| Check | Expected result |
|---|---|
| Clean dependency install | Pass |
| Expo Doctor | Pass, or external limitation documented |
| Lint | Pass |
| TypeScript | Pass |
| Jest suite | Pass |
| Drizzle migration generation | Pass |
| SQL migration bundled by Metro | Pass |
| Existing `.tflite` asset bundled | Pass |
| Android development/preview build | Pass |
| Database survives restart | Pass |
| Existing model loads and runs | Pass |
| No unexplained New Architecture regression | Pass |

## Stop conditions

Stop and report before proceeding when:

- the migration SQL cannot be bundled reliably;
- Drizzle requires an unapproved pre-release package;
- Metro/Babel changes break the model asset;
- Expo SQLite cannot open in the development build;
- repeated startup reruns or duplicates the migration;
- Expo Doctor introduces an unexplained failure;
- the EAS build cannot launch;
- the work requires authentication, backend, or unrelated architecture changes.

## Exit criteria

- Dependency versions are selected, pinned, and documented.
- A minimal database opens and one generated migration applies.
- Repeated startup is safe.
- Android bundle contains both SQL migrations and `.tflite`.
- Development build launches.
- Database survives restart.
- Existing TFLite model still loads and runs.
- Lint and TypeScript pass.
- No migration bundling, Metro, TFLite, or unexplained Expo Doctor regression remains.
- A compatibility record and rollback plan exist.

## Suggested commits

```text
chore(storage): add Drizzle and Expo persistence dependencies
build(storage): configure Drizzle migration bundling
test(storage): prove Expo SQLite and TFLite compatibility
```

## Source requirements preserved in this phase

### 3.3 Package compatibility rule

Expo-managed packages shall be installed through `npx expo install` so that the versions match the repository's Expo SDK.

Drizzle packages and migration tooling shall be pinned to versions validated against the repository's current Expo SDK, React Native version, Metro configuration, and EAS build. The team shall not adopt `@next`, release-candidate, or arbitrary latest versions without a compatibility spike and a successful Android development build.

Generated migration files and migration snapshots shall be committed to Git.

---

## Phase 0 — Compatibility spike

**Objective:** Prove that Drizzle, Expo SQLite, bundled migrations, Metro configuration, and the existing TFLite asset can coexist.

Deliverables:

- dependency versions selected and pinned
- minimal database open
- one generated migration applied
- lint and TypeScript checks passing
- Android bundle includes SQL migrations and `.tflite` model
- development build launches
- database survives restart

Exit criteria:

- no migration bundling error
- no Metro regression
- no TFLite asset regression
- no unexplained Expo Doctor failure

## 14.6 Compatibility

The feature shall be validated with:

- the repository's current Expo SDK
- the current Android package configuration
- an EAS development or preview build
- the existing native TFLite integration
- the current New Architecture configuration

Adding Drizzle or Metro migration support shall not break `.tflite` asset bundling.

---
