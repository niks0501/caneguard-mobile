# Live validation transcript — fm/cg-guard-shared-predicate-20261121

Revision: 4ae12b40164f86b071df7e8d314ae1161eba8ff7 (clean worktree)
Base: 8550f0c49bd24f0c48360ec353bafdf3370abe30

## Tier / targeted checks (real behaviour, not source greps)

- `npx jest --runInBand src/app/__tests__/scan.test.tsx src/features/detection/context/__tests__/scanCheckState.test.ts` → 2 suites, 64 tests passed
- `npx jest --runInBand src/app/__tests__/symptom-checklist.guard.test.tsx src/features/detection/analysis/__tests__/useScanAnalysis.guard.test.tsx` → 2 suites, 45 tests passed
  (log: `jest-guard.log`)

## Device route (agent-device / live:up)

- `npm run live:up -- --exit-after-ready` →
  `live:up DEVICE_UNAVAILABLE: No ready native target (adb devices: none listed).`
  Evidence: `device-run.json` (driver: agent-device, result: DEVICE_UNAVAILABLE, verdict: inconclusive).
  `adb devices -l` never returns in this WSL2 session (times out at 25 s), no emulator process is present, and the
  project policy forbids starting/reconfiguring AVDs or ADB networking from the agent side.
  → Guard V1 driven outcomes (`guardFailure: 'rejected'`, `GUARD_INPUT_INVALID`) cannot be produced here.

## Web route (real product in a browser, stub API + fake farmer account)

Start: `npm run web:validate` (stub API 127.0.0.1:8210, Expo web 127.0.0.1:8199, log `web-validate.log`).

Driver: `chrome-devtools-axi` (Chrome DevTools protocol), commands verbatim:

1. `npx -y chrome-devtools-axi open http://127.0.0.1:8199/login`
2. `npx -y chrome-devtools-axi fillform @g7051:2_6=farmer@validation.invalid @g7051:2_9=validation-only`
3. `npx -y chrome-devtools-axi click @g7052:2_11`            → lands on `/home` (farmer)
4. `npx -y chrome-devtools-axi snapshot`                     → fresh refs
5. `npx -y chrome-devtools-axi click @g7054:4_15`            → Scan tab `/scan`, no photo
6. `npx -y chrome-devtools-axi screenshot 01-scan-tab-initial.png`
7. `npx -y chrome-devtools-axi upload @g7055:6_11 not-an-image.txt`
   → picker could not finish: red card "Hindi naidagdag ang larawan" / "Hindi mabuksan ang gallery. Subukan muli."
8. `npx -y chrome-devtools-axi screenshot 02-picker-error-red-card.png`
9. `npx -y chrome-devtools-axi upload @g7056:6_11 leaf-photo.png` (valid PNG)
   → photo accepted, app opens `/symptom-checklist`, "Photo not used" (quality warning path)
10. `npx -y chrome-devtools-axi click @g7058:8_0` (Go back)  → Scan tab, no neutral line, no red card
11. `npx -y chrome-devtools-axi upload @g7059:10_11 broken-leaf.png` (512 random bytes named .png)
    → checklist: "Photo could not be used / The selected image could not be resized" (preparation failure)
12. `npx -y chrome-devtools-axi click @g7061:11_0` (Go back)  → Scan tab shows the neutral line
13. `npx -y chrome-devtools-axi screenshot 03-preparation-failure-neutral-line.png`
14. `npx -y chrome-devtools-axi eval ...` →
    `{"neutral":true,"bodyHasRedCardTitle":false,"neutralText":"This photo can't be used. Take or choose a new one."}`
15. `npx -y chrome-devtools-axi upload @g7062:13_13 not-an-image.txt` (genuine picker/recovery error)
    → red card returns, neutral line gone
16. `npx -y chrome-devtools-axi screenshot 04-recovery-error-red-card-returns.png`
17. `npx -y chrome-devtools-axi eval ...` → `{"neutral":false,"redCard":true}`
18. `npx -y chrome-devtools-axi stop`

Fixtures used (disposable, this directory): `not-an-image.txt`, `broken-leaf.png`, `leaf-photo.png`.

Teardown: browser bridge stopped, `npm run web:validate` process group (pgid 3546283) terminated, ports
8199/8210/8081 have no listeners, `git status --porcelain` empty.

## Second web run (checklist error branch, screenshot evidence)

Driver: `chrome-devtools-axi`, `npm run web:validate` restarted (log `web-validate-2.log`).

19. `npx -y chrome-devtools-axi open http://127.0.0.1:8199/login`
20. `npx -y chrome-devtools-axi fillform @g7065:2_6=farmer@validation.invalid @g7065:2_9=validation-only`
21. `npx -y chrome-devtools-axi click @g7066:2_11`   → `/home`
22. `npx -y chrome-devtools-axi snapshot`
23. `npx -y chrome-devtools-axi click @g7068:4_15`   → Scan tab `/scan`
24. `npx -y chrome-devtools-axi upload @g7069:6_11 broken-leaf.png`
    → `/symptom-checklist`: "Photo could not be used" / "The selected image could not be resized. Please replace it and try again."
    (deriveScanCheckState error branch → `check-failed`, retake-only actions)
25. `npx -y chrome-devtools-axi screenshot 05-checklist-preparation-failure.png`
26. `npx -y chrome-devtools-axi stop`

## Provenance notes

- Both runs were served by this worktree's own Metro: each log records
  `Web Bundled ... node_modules/expo-router/entry.js` plus resolver paths under
  `.../worktrees/5518ff297ee9/01M7Z37598RARAVQ7E1JC5ENME/node_modules`, so the pages above rendered
  revision 4ae12b4 from this worktree.
- A second `web:validate` process from a *different* worktree (pid 3593202, pgid 3593184) appeared at
  21:15:37 UTC and is still listening on :8199 now. It is not this run's child and was left untouched.
  This run's own servers (pgid 3546283 and 3580264) were terminated; ports used by this run are free.
- `npm ci` was run once to materialize `node_modules` (git-ignored); the worktree is clean
  (`git status --porcelain` empty).
