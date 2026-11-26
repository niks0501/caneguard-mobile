# Mobile security fixes (#69–#75)

This document records the mobile-side boundaries and the external work that
cannot be completed in this repository.

## Local ownership and lifecycle (#69, #74)

- New `scan_records` rows carry the authenticated `owner_identity` and all
  record reads, detail reads, writes, report authoring/finalization, sync
  lookups, image metadata updates, and deletes require that owner.
- New managed scan and field-validation image paths include the owner
  partition. Legacy unpartitioned rows are migrated into the
  `__legacy_unassigned__` quarantine and are not exposed to a signed-in user.
  This is an intentional safe migration rule; a future product flow may
  explicitly export or delete those rows, but the client must not guess which
  account owns them.
- Settings exposes two owner-scoped actions. **Clear downloaded office data**
  removes only re-downloadable visit assignments, cached office updates, the
  downloaded case photos, and the saved pages of an interrupted feed download.
  **Remove all local records** permanently removes the current owner's scans,
  reports, boundaries, visits, assignment and notification caches, downloaded
  case photos, draft checkpoints, interrupted feed download progress, and
  managed images without touching server data or another account; it previews
  every affected kind, refuses while an upload is in flight, re-checks the
  confirmed counts inside the deletion transaction, and requires an explicit
  acknowledgement before unsent work is lost.
- Local draft checkpoints in `local_drafts` are keyed by owner identity, draft
  kind, and draft key, and are never readable by another account.
- On authenticated startup, the mobile client purges only synchronized local
  data older than `LOCAL_DATA_RETENTION_DAYS` (90 days). Draft, local-only,
  pending, and failed evidence remains available for offline retry.
- Android backup/transfer is disabled by the security config plugin. This is a
  backup/retention control, not a claim that SQLite or managed image bytes are
  natively encrypted. Expo SQLite exposes SQLCipher keying only as an opt-in
  native build property (`expo.sqlite.useSQLCipher`), which this repository does
  not enable; native encryption and any key migration still require a
  native/runtime proof before being described as complete.

## Sessions, offline persistence, and adaptive app lock (#70)

- Offline session persistence is decoupled from biometric hardware so field
  workers and farmers on non-biometric or no-screen-lock Android phones are
  never locked out offline after a process restart.
- On sign-in, the mobile session is automatically saved in `SecureStore` under
  `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` (`android:allowBackup="false"` remains
  enforced, and the app never stores a password).
- Local cold-start lock uses a role-aware policy (`localLockMode`: `'none' |
  'device' | 'app-pin'`):
  - **`farmer` accounts** default to `'none'` (seamless offline resume, since
    farmer scans stay strictly local and cannot access office workflows or sync
    pipelines), and may optionally enable OS lock or a 4-digit Quick PIN in
    Account & security.
  - **`field_reporter` (inspector) accounts** automatically use `'device'` when
    the phone has any OS biometric or screen lock (`SecurityLevel >= SECRET`,
    via `LocalAuthentication` prompt or OS auth-bound key when no device
    credential fallback exists). When an inspector signs in on a phone with no
    OS screen lock (`SecurityLevel.NONE`), the app persists the session and
    offers a one-step 4-digit CaneGuard Quick PIN setup (`'app-pin'`).
- The 4-digit CaneGuard Quick PIN is stored in `SecureStore` as a salted,
  iterated SHA-256 hash (never plaintext). Five failed PIN attempts wipe the
  persisted session and PIN and require online password sign-in while keeping
  owner-scoped local SQLite drafts intact.
- Toggling local App Lock off in Account & security updates `localLockMode` to
  `'none'` locally without revoking the active session or logging the user out.
- Logout always attempts server revocation and deletes the persisted session,
  lock mode, Quick PIN, device-credential gate, and legacy biometric entries.
  It is not a soft lock.
- Authoritative 401/403 rejection from `/me` or sync clears persisted session
  material and Quick PIN fail-closed.
- If the API returns `expires_at: null`, the client applies a finite 30-day
  local safety expiry. Inspector sessions enforce hard expiry and the 72-hour
  server-offset authoring carry-over bound. When a farmer's 30-day token
  expires offline, the client strips the bearer token and retains local
  personal-scan grace access (read/scan only) until the farmer signs in online
  again. The server contract should still issue and enforce an explicit
  expiry/revocation policy.

## Auth links (#71)

- Release builds do not register `caneguardmobile://`. The dynamic Expo config
  registers verified HTTPS App Links only when `EXPO_PUBLIC_AUTH_LINK_HOST` is
  supplied.
- The Web/API link contract must use the configured host and these paths:
  `/reset-password?email=...&token=...` and
  `/verify-email?id=...&hash=...&expires=...&signature=...`.
- Web/API must publish `GET /.well-known/assetlinks.json` for package
  `com.niks0501.caneguard` and the production signing certificate SHA-256
  fingerprint, and must keep the link host aligned with the EAS build config.
  The companion repository is intentionally not modified here.
- If the host or assetlinks deployment is absent, HTTPS links remain in the
  browser and the release app has no unverified token-capture fallback. The
  release config check fails when a host is not supplied.

## Release hardening (#72, #73)

- `SYSTEM_ALERT_WINDOW` is blocked and the Android security plugin forces
  `android:allowBackup="false"`.
- Expo Updates has code-signing metadata with key id
  `caneguard-v1-20260913` and a configured public certificate at
  `certs/certificate.pem`. The replacement public certificate is committed;
  its private counterpart must remain only at
  `~/.config/caneguard/updates/private-key.pem`, with a mode-0700 parent
  directory and mode-0600 key, and must never be committed or printed. This
  change only creates and installs a local development build; do not publish
  an EAS Update or create a preview/production distribution without explicit
  release authorization.

## Map-tile privacy (#75)

- Direct `tile.openstreetmap.org` requests were removed from the mobile
  default. Without `EXPO_PUBLIC_MAP_TILE_PROXY_URL`, the manual map shows a
  privacy-preserving unavailable state and makes no tile request.
- When configured, the URL must be a CaneGuard-owned HTTPS proxy template with
  `{z}`, `{x}`, and `{y}` placeholders. The Web/API side must implement and
  authorize that proxy, preserve required upstream attribution/licensing, and
  avoid forwarding precise user identity. That API work and production host
  choice are outside this repository.
- Tile caching limits and the proxy cache-header prerequisite are in
  `docs/security/map-tile-cache.md`.
