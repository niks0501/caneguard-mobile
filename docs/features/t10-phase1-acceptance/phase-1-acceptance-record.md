# T10 Phase 1 Integrated Acceptance Record

## Result

**PASS** on 2026-08-29 against the local development stack.

All twelve required lifecycle stages were completed for case `CG-20260829-8524FEBB`.
The Android segments used a development APK, normal development Metro, the local backend, and the same owner-authenticated Mobile session.
The Web segments used the real reviewer UI at `http://localhost:5173` and a reviewer-authenticated browser session.
API evidence supports persistence and identity claims but does not replace the required Web UI stages.

## Source, build, and runtime identity

- Mobile base commit: `376cc5e2e3ed5d490895288c8a092bc2ec18d55e`.
- Mobile branch: `fm/cg-t10-phase1-formal-pass-20260829`.
- Web commit: `70dfcfc2deae0e57c5041b0d28afe3cddcf1cfba`.
- Mobile package-lock SHA-256: `9bc87c8d0eb63b10ea6c340125f78cacea5f66a606ba49d4181aa23de130e554`.
- Development APK SHA-256: `7fea71a5e70c0f1d846d30f614e73edb41675403602dc07693874dbea5089e5c`.
- Installed package: `com.niks0501.caneguard`, version `1.1.0`, version code `1`.
- Installed APK hash matched the development APK hash exactly.
- Metro runtime: Expo `57.0.18`, Expo Router `57.0.17`, React Native `0.86.3`, and Expo Dev Client `57.0.16`.
- The runtime contained the UUIDv7 compatibility fix with source hashes `9f854d0f2849a307194d698e1fc8488b6d7772cfb9a910988bb98fd2f55ae3e9`, `d234113a76e28c1e5f6df54fc0a25f68cdbb741247775e91b1b877c7089ffc9d`, and `90289a5c54e413956e837e4a5a425b4f51a2abaf18578433e3610804cca75fee` for the validator, multipart mapper, and photo storage files respectively.
- The delivered validator further constrains generic UUID syntax to RFC version and variant bits without changing UUIDv7 acceptance.
- Backend: local loopback development acceptance server at `http://127.0.0.1:8000`, reporting healthy database and storage checks.
- Backend process environment identity: `APP_ENV=testing` in the disposable local development fixture, with no QA or production profile loaded.
- Web UI: local development server at `http://localhost:5173`.
- Browser fallback: the existing agent-browser Chrome session at `127.0.0.1:9222`, serialized with the task browser lock.
- Device: Android emulator `emulator-5554`, model `sdk_gphone64_x86_64`, Android 14, API 34.
- Device fingerprint: `google/sdk_gphone64_x86_64/emu64xa:14/UE1A.230829.050/12077443:userdebug/dev-keys`.
- Maestro: `2.9.0` with OpenJDK `17.0.20`.
- Every Android and Maestro segment was serialized with `/home/aki/projects/firstmate/state/caneguard-maestro-device.lock`.

No native-affecting source change was made during this acceptance effort.
The installed development runtime was therefore usable for the TypeScript and Maestro changes.

## Acceptance identity

- Report UUID: `01a04e15-77df-72ba-a473-abbf8524febb`.
- Case reference: `CG-20260829-8524FEBB`.
- Assignment UUID: `01a04e16-c00c-729e-ac6a-525b728d6802`.
- Completion UUID: `01a04e34-7950-713e-bdd4-8b47f595d0ca`.
- Completion client UUID: `a0a8b3a7-1753-487f-916d-4e7f894c7990`.
- Mobile owner and assignee: the authenticated Field Reporter account.
- Final reviewer: the authenticated MAO Reviewer account with role `Reviewer` visible in the Web UI.

## End-user diagnosis

The original visible symptom was a Home screen that did not reach Scan after a development deep-link invocation.
The setup used the declared `caneguardmobile` scheme, an installed development APK, normal Metro, and an authenticated user at Home.
The initiating trigger was either the visible `Start Scan` button or a development URI.
Authentication and Metro readiness could independently mask routing behavior, so both were established before the counterfactual.

The smallest Android counterfactual proved that the visible `Start Scan` button and `caneguardmobile:///scan` both reached `scan.screen`.
The malformed `caneguardmobile://scan` invocation also left Home and exposed `scan.screen` in the preserved hierarchy during this fresh attempt.
The earlier malformed-link failure was therefore not reproduced, and malformed URL parsing is not claimed as the sole application defect.
The committed development URLs were still canonicalized to triple-slash path URIs, while the formal T10 path uses the real `Start Scan` button.
No application compatibility behavior was added for malformed URIs.

## Confirmed defects and fixes

### Server UUIDv7 identities were rejected during Mobile completion

The real offline completion path displayed all required evidence but returned `This field validation evidence is incomplete or invalid` before creating pending work.
The backend report and assignment identities were valid UUIDv7 values, while Mobile completion persistence, multipart validation, and managed photo storage accepted only UUIDv4.
The fix centralizes RFC UUID validation and accepts both Mobile-generated UUIDv4 and server-generated UUIDv7 identities.
The focused regression fixtures use real UUIDv7-shaped report and assignment identities.

### Long Maestro text editing stalled in the Android driver

The first failing command was `inputText` on `field-validation.observation-input`.
The Maestro Android driver timed out after 120 seconds while the Android window manager repeatedly reported a stuck `starting_reveal` and IME insets animation.
ADB, the app, and the backend remained responsive.
Disabling device animation scales and restarting only the Maestro driver and input method did not recover `eraseText`.
A focused counterfactual using the visible field, Maestro clipboard, and `pasteText` completed successfully.
The committed T10 text-entry steps now use clipboard paste, retain the same visible fields and values, and assert the resulting lifecycle states.
The device animation settings were restored after acceptance.

### Stateful flow assumptions

The owner-assignment flow initially assumed its refresh control was in the first viewport.
The committed flow now scrolls to that control before tapping it and retains the case-specific and same-owner assertions.
The offline and recovery flows now stop and relaunch the app without clearing state so their starting route is deterministic and restart persistence remains genuine.
The connectivity flow receives `T10_CASE_REFERENCE` through Maestro's `-e` option rather than assuming shell environment inheritance.

## Twelve-stage result

| Stage | Result | Fresh evidence |
| --- | --- | --- |
| 1. Mobile scan | PASS | The real `Start Scan` button opened `scan.screen` on Android. See [01-mobile-scan.png](evidence/01-mobile-scan.png). |
| 2. Guided validation | PASS | Gallery evidence produced `Possible result: Rust`, and an inconsistent checklist remained separate decision-support evidence. See [02-guided-validation.png](evidence/02-guided-validation.png). |
| 3. Report to Office | PASS | The Mobile report form accepted the required field data and reached the enabled finalization state. See [03-report-to-office.png](evidence/03-report-to-office.png). |
| 4. API case creation | PASS | Mobile reached `Finalized · Synced` and displayed the server report UUID. The Web queue subsequently showed the same case reference. See [04-api-case-synced.png](evidence/04-api-case-synced.png). |
| 5. Web review | PASS | The real reviewer Web UI opened `CG-20260829-8524FEBB`, showed submitted evidence, and kept the model result labeled as decision support. See [05-web-review.png](evidence/05-web-review.png). |
| 6. Field assignment | PASS | The reviewer UI assigned Field Reporter, saved explicit review, and left the case open for field validation. See [06-web-field-assignment.png](evidence/06-web-field-assignment.png). |
| 7. Owner-scoped Mobile assignment retrieval | PASS | The authenticated owner refreshed Activity, found the exact assignment, and saw `You submitted this case and are its validator.` See [07-mobile-owner-assignment.png](evidence/07-mobile-owner-assignment.png). |
| 8. Offline validation completion | PASS | With airplane mode on and Mobile visibly Offline, observation, finding, action, visit time, and GPS evidence were saved locally with a retry control. See [08-mobile-offline-completion.png](evidence/08-mobile-offline-completion.png). |
| 9. Pending work across restart | PASS | `stopApp` followed by `launchApp` with `clearState: false` preserved `Saved on this device`, visit time, and retry state. See [09-mobile-pending-after-restart.png](evidence/09-mobile-pending-after-restart.png). |
| 10. Connectivity recovery and synchronization | PASS | Airplane mode transitioned from `1` to `0`, the development reverse ports remained installed, Mobile became Online, and the completion reached `Validation synchronized` without auto-closing or auto-verifying the case. See [10-mobile-connectivity-recovery.png](evidence/10-mobile-connectivity-recovery.png). |
| 11. Reviewer attention | PASS | The real Web attention inbox showed `Field validation completed` for the exact case and identified it as ready for office review. See [11-web-reviewer-attention.png](evidence/11-web-reviewer-attention.png). |
| 12. Reviewer-only disposition and closure | PASS | The visible Reviewer session saved authority classification `Unable to classify`, verification `Unable to verify`, action `Technical assistance provided`, and case state `Closed`. The reviewer-authenticated API read confirmed the same final lifecycle and preserved completion payload. See [12-web-final-disposition-closure.png](evidence/12-web-final-disposition-closure.png). |

The final backend lifecycle was `field_validation_state=completed`, `verification_outcome=unable_to_verify`, and `case_state=closed`.
The final review remained attributed to MAO Reviewer.
The original AI result remained `rust` decision support and was never converted into authority verification.

## Exact acceptance commands

The Android flows were run individually because Web reviewer actions and the real connectivity transition occur between them.

```bash
npm run e2e:flow -- "$PWD/.maestro/t10/01-mobile-scan-guided-report.yaml"
npm run e2e:flow -- "$PWD/.maestro/t10/02-mobile-owner-assignment-retrieval.yaml" -e T10_CASE_REFERENCE=CG-20260829-8524FEBB
npm run e2e:flow -- "$PWD/.maestro/t10/03-mobile-offline-completion-and-restart.yaml" -e T10_CASE_REFERENCE=CG-20260829-8524FEBB
npm run e2e:flow -- "$PWD/.maestro/t10/04-mobile-connectivity-recovery-sync.yaml" -e T10_CASE_REFERENCE=CG-20260829-8524FEBB
```

Each command was executed inside the required exclusive device lock.
The Web operations were serialized through the existing agent-browser CDP session after the captain-approved chrome-devtools-axi bridge fallback.

## Verification

- `PASS` - all four files in `.maestro/t10/` passed `maestro check-syntax`.
- `PASS` - `npm run e2e:doctor` found Java, ADB, Maestro, and the project Maestro skill.
- `PASS` - the four targeted Android flow segments passed in lifecycle order with the required Web stages and network transition between them.
- `PASS` - `npm run lint`.
- `PASS` - `npm run typecheck`.
- `PASS` - `npm test -- --runInBand --testPathIgnorePatterns '/.scratch/'`, with 95 suites and 714 tests passing.

The first focused Jest invocation discovered the disposable aligned Metro copy under `.scratch` and tried to collect its duplicate tests.
The full committed suite was then run with only `.scratch` excluded and passed.
No committed test path was ignored.

A single global `npm run e2e` over every unrelated Maestro fixture was not used as the T10 gate.
That command cannot serialize the required Web reviewer operations and network transition between the four committed T10 segments.
The exact T10 segments above are the deterministic Mobile acceptance evidence.

## Evidence integrity and observations

The committed PNG hashes are recorded in [SHA256SUMS](evidence/SHA256SUMS).
The full command traces, first-failure hierarchies, Maestro logs, logcat, browser snapshots, and reviewer-authenticated API payload were retained in the task's disposable `.scratch/t10-phase1` evidence directory during execution.
No alternate environment file, QA profile, production service, authentication bypass, lifecycle bypass, or role bypass was used.

The Web case detail page did not visibly render the completion's observation, finding, and action text during this run.
The real Web attention notification did show that the exact field validation was complete and ready for review, and the reviewer-authenticated report payload contained all three texts, visit time, and GPS evidence.
The required Web UI stages for review, assignment, reviewer attention, final disposition, and closure were each completed through the real UI.
Detailed field-completion rendering is recorded as a Web UI follow-up rather than being relabeled as UI evidence in this Mobile acceptance record.
