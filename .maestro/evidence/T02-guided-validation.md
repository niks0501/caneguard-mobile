# T02 guided validation evidence

- Overall result: `PASS_WITH_GAPS`
- Behavior/flow: `.maestro/p0/01-guided-validation.yaml` covers Scan -> short neutral differential -> Something else mismatch -> result outcomes.
- Timestamp and timezone: 2026-08-28 06:20 UTC (+0000)
- Branch: `fm/cg-t02`
- Commit SHA: `62680921ba394cd61a5ad35939187343af168877`
- Worktree state: committed implementation worktree

## Runtime

- Device/emulator: unavailable for this run.
- OS/API level: not available.
- App version/build profile: not exercised.
- Native-affecting changes in this phase: none; changes are TypeScript, JSON contract data, documentation, tests, and Maestro YAML.
- Native-runtime status: `UNKNOWN`
- Metro/backend prerequisites: not exercised.

## Verification

| Result | Command or check | Evidence/artifact |
|---|---|---|
| PASS | `npm run lint` | Expo ESLint exited 0. |
| PASS | `npm run typecheck` | TypeScript exited 0. |
| PASS | `npm run db:check` | Drizzle reported `Everything's fine`. |
| PASS | `npm test -- --runInBand` | 75 suites / 654 tests passed. |
| PASS | `maestro check-syntax` for the new and updated P0 flows | All six checked flows returned `OK`. |
| PASS | `npm run e2e:doctor` | Java 17+, adb, Maestro, and the project Maestro skill were found. |
| PASS | `git diff --check` | No whitespace errors. |
| NOT RUN | `npm run e2e:flow -- .maestro/p0/01-guided-validation.yaml` | `adb devices -l` timed out before a device identity could be discovered. |

## Limitations and follow-up

- No physical-device screenshot or end-to-end result is claimed because the shared adb preflight timed out at commit `62680921ba394cd61a5ad35939187343af168877`.
- The mobile upload contract now allows `yellow-midrib` and `something-else`; the API counterpart should accept these values before synchronized reports rely on them.
- The observation descriptions are decision-support guidance, not diagnostic proof, and require agricultural stakeholder validation for wider clinical use.
