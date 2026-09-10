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
- Settings exposes **Clear local data**. It removes the current owner's scans,
  report drafts, validation evidence, assignment/notification caches, and
  managed images without touching server-synchronized data.
- On authenticated startup, the mobile client purges only synchronized local
  data older than `LOCAL_DATA_RETENTION_DAYS` (90 days). Draft, local-only,
  pending, and failed evidence remains available for offline retry.
- Android backup/transfer is disabled by the security config plugin. This is a
  backup/retention control, not a claim that SQLite or managed image bytes are
  natively encrypted. Expo SQLite SDK 57 does not expose SQLCipher keying in
  this repository; native encryption and any key migration still require a
  native/runtime proof before being described as complete.

## Sessions and biometrics (#70)

- The protected SecureStore entry uses `requireAuthentication: true`, which
  binds it to the OS authentication-backed key where the platform supports it.
- Only an enrolled strong biometric is accepted for this protected session;
  device-passcode fallback is not accepted for this credential.
- Logout always attempts server revocation and deletes password, protected
  session, and biometric preference entries. It is not a soft lock.
- If the API returns `expires_at: null`, the client applies a finite 30-day
  local safety expiry. The server contract should still issue and enforce an
  explicit expiry/revocation policy.

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
- Expo Updates has code-signing metadata and a configured certificate path at
  `certs/certificate.pem`. The certificate is deliberately not fabricated or
  committed by this worker. Production EAS builds fail the deterministic
  security-config check until the public certificate is supplied at that path
  and the matching private signing key is configured in the EAS Update
  service.

## Map-tile privacy (#75)

- Direct `tile.openstreetmap.org` requests were removed from the mobile
  default. Without `EXPO_PUBLIC_MAP_TILE_PROXY_URL`, the manual map shows a
  privacy-preserving unavailable state and makes no tile request.
- When configured, the URL must be a CaneGuard-owned HTTPS proxy template with
  `{z}`, `{x}`, and `{y}` placeholders. The Web/API side must implement and
  authorize that proxy, preserve required upstream attribution/licensing, and
  avoid forwarding precise user identity. That API work and production host
  choice are outside this repository.
