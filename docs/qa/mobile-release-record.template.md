# CaneGuard QA Mobile Release Record

Copy this template once per coordinated QA cycle.

Do not put passwords, bearer tokens, database credentials, or other secrets in the record.

## Candidate

- QA cycle: `qa/YYYY-MM-DD-NN`
- Mobile commit:
- Web/API commit:
- Staging database baseline:
- Staging public HTTPS origin:
- Prepared by:
- Prepared at:

## Delivery decision

- Change class: `native` / `runtime` / `build-level` / `compatible bundle` / `documentation or test-only`
- Delivery: `fresh Preview APK` / `EAS Update` / `no mobile artifact`
- Captain override: `yes` / `no`
- Override reason, if applicable:
- Installed runtime version:
- QA channel: `qa`

## Exact EAS identity

Paste the complete machine-readable output from the command that produced the candidate, or attach it to the release record.

### Build output

Command:

```text
eas build --platform android --profile qa --json
```

- Build ID:
- Build details URL:
- APK artifact URL:
- Build JSON:

### Update output

Command:

```text
EXPO_PUBLIC_QA_MODE=true eas update --channel qa --environment preview --message "qa/YYYY-MM-DD-NN: short change description" --json
```

- Update group ID:
- Update details URL:
- Platform update ID, if emitted:
- Update JSON:

## Readiness and smoke evidence

- Public `/api/health` check:
- Seeded field-reporter authentication:
- App data cleared with `adb shell pm clear com.niks0501.caneguard`:
- Authenticated home loaded on the real device:
- Critical authenticated API workflow:
- Evidence links or attachment names:

## Human QA decision

- Result: `pending` / `passed` / `failed` / `abandoned`
- Human approver:
- Approval date:
- Notes:
