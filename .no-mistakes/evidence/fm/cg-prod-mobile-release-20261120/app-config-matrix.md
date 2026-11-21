# app.config.js resolution — live `npx expo config` (app-config)

- repo: {run-worktree}
- cases: 9, passed: 9, failed: 0

| case | expectation | result |
| --- | --- | --- |
| local dev config (no build profile) | dev builds keep working unchanged and are tagged development | PASS — resolves: expected `true`, got `true`; extra.appEnvironment: expected `development`, got `development` |
| preview build profile without Sentry upload creds | only production requires symbol upload (D9) | PASS — resolves: expected `true`, got `true`; extra.appEnvironment: expected `preview`, got `preview` |
| qa build profile | qa builds tagged qa (pre-existing QA env gate satisfied) | PASS — resolves: expected `true`, got `true`; extra.appEnvironment: expected `qa`, got `qa` |
| production build profile with SENTRY_ORG/PROJECT/AUTH_TOKEN | D9: production resolves and uploads source maps/symbols | PASS — resolves: expected `true`, got `true`; extra.appEnvironment: expected `production`, got `production`; sentry expo plugin: expected `true`, got `true` |
| production build profile without SENTRY_AUTH_TOKEN | D9: production must refuse to resolve without symbol upload | PASS — resolves: expected `false`, got `false`; refusal message: expected `/SENTRY_ORG, SENTRY_PROJECT, and SENTRY_AUTH_TOKEN/`, got `Error: Error reading Expo config at {run-worktree}/app.config.js:` |
| production build profile with blank SENTRY_PROJECT | blank values do not satisfy the upload requirement | PASS — resolves: expected `false`, got `false`; refusal message: expected `/SENTRY_ORG, SENTRY_PROJECT, and SENTRY_AUTH_TOKEN/`, got `Error: Error reading Expo config at {run-worktree}/app.config.js:` |
| production OTA update (EXPO_PUBLIC_APP_ENVIRONMENT, no build profile) | D15: eas update has no build profile, so the lane names its environment | PASS — resolves: expected `true`, got `true`; extra.appEnvironment: expected `production`, got `production` |
| qa OTA update (EXPO_PUBLIC_APP_ENVIRONMENT=qa) | existing qa update lane tagged qa | PASS — resolves: expected `true`, got `true`; extra.appEnvironment: expected `qa`, got `qa` |
| build profile wins over a conflicting OTA environment | a build is tagged by its own profile | PASS — resolves: expected `true`, got `true`; extra.appEnvironment: expected `preview`, got `preview` |

## Raw resolver output (non-success cases)
### production build profile without SENTRY_AUTH_TOKEN
```
    at readConfigFile ({run-worktree}/node_modules/@expo/config/build/getConfig.js:52:43)
    at getDynamicConfig ({run-worktree}/node_modules/@expo/config/build/getConfig.js:61:20)
    at getConfig ({run-worktree}/node_modules/@expo/config/build/Config.js:259:125)
    at configAsync ({run-worktree}/node_modules/expo/node_modules/@expo/cli/build/src/config/configAsync.js:156:60)
    at {run-worktree}/node_modules/expo/node_modules/@expo/cli/build/src/config/index.js:55:16
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
```
### production build profile with blank SENTRY_PROJECT
```
    at readConfigFile ({run-worktree}/node_modules/@expo/config/build/getConfig.js:52:43)
    at getDynamicConfig ({run-worktree}/node_modules/@expo/config/build/getConfig.js:61:20)
    at getConfig ({run-worktree}/node_modules/@expo/config/build/Config.js:259:125)
    at configAsync ({run-worktree}/node_modules/expo/node_modules/@expo/cli/build/src/config/configAsync.js:156:60)
    at {run-worktree}/node_modules/expo/node_modules/@expo/cli/build/src/config/index.js:55:16
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
```
