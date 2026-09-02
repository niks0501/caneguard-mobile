# P0 verification evidence convention

Create one Markdown record per phase using `PHASE-ID.md` (for example,
`P0-01.md`). A result is reviewable only when the record associates all of the
following:

1. **Phase and behavior** — phase ID, flow names, and acceptance behavior.
2. **Code state** — full commit SHA, branch, and exact `git status --short` when
   the run was made from a dirty worktree.
3. **Runtime** — device/emulator model, OS/API level, app version/build profile,
   development-build identity, and whether native-runtime freshness is
   `USABLE`, `STALE`, or `UNKNOWN`.
4. **Checks** — command, timestamp/timezone, `PASS`/`FAIL`/`NOT RUN`, and the
   artifact or concise result. A skipped or unavailable check is never a pass.
5. **Persistence proof** — the before/after observation demonstrating that the
   record remains retrievable, plus any applicable database/migration evidence.
6. **Artifacts** — repository-relative or CI artifact paths for screenshots and
   logs. Generated files under `.agent-device/test-artifacts/` are local and
   ignored; move durable evidence to the team's review/CI artifact store.
7. **Limitations** — missing credentials/services, stale builds, system-picker
   differences, skipped platforms, or other constraints that affect confidence.

Use these overall outcomes consistently:

- `PASS`: all relevant required checks ran and passed.
- `PASS_WITH_GAPS`: implementation checks passed, with explicit non-blocking
  device or integration gaps.
- `FAIL`: a relevant check ran and failed.
- `INCOMPLETE`: required implementation or evidence could not be obtained.

Copy `TEMPLATE.md` for each later phase. Never paste tokens, credentials,
personal data, `.env` values, or sensitive report images into evidence records.
