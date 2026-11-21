# CaneGuard production release gate — live CLI matrix

- repo: {run-worktree}
- entry point: node scripts/release-env.js (same as npm run release:preflight / eas-build-pre-install)
- cases: 63, passed: 63, failed: 0

| group | case | expected | actual | exit | result |
| --- | --- | --- | --- | --- | --- |
| accept | complete production environment | accept | accept | 0 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://api.caneguard.ph/v1" | accept | accept | 0 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://API.CaneGuard.ph" | accept | accept | 0 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://api.caneguard.ph." | accept | accept | 0 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://[2606:4700:4700::1111]" | accept | accept | 0 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://2606:4700:4700::1111" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="http://api.caneguard.ph" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="not a url" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://localhost" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://api.localhost" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://127.0.0.1" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://127.1.2.3" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://0.0.0.0" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://10.1.2.3" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://192.168.0.10" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://172.16.5.4" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://169.254.169.254" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://100.64.0.1" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://192.0.2.1" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://198.18.0.1" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://203.0.113.9" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://198.51.100.7" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://224.0.0.1" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://255.255.255.255" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://[::1]" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://[fe80::1]" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://[fd00::1]" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://[2001:db8::1]" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://[::ffff:127.0.0.1]" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://api..caneguard.ph" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://api-.caneguard.ph" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://-api.caneguard.ph" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://intranet" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://box.local" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://api.internal" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://api.example.test" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://api.example.com" | accept | accept | 0 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://user:pw@api.caneguard.ph" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://api.caneguard.ph/?a=1" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://api.caneguard.ph/#frag" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://api.caneguard.ph@evil.internal" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://2130706433" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://0x7f.0.0.1" | reject | reject | 1 | PASS |
| api-url | EXPO_PUBLIC_API_BASE_URL="https://0x7f000001" | reject | reject | 1 | PASS |
| sentry-dsn | EXPO_PUBLIC_SENTRY_DSN="" | reject | reject | 1 | PASS |
| sentry-dsn | EXPO_PUBLIC_SENTRY_DSN="not-a-dsn" | reject | reject | 1 | PASS |
| sentry-dsn | EXPO_PUBLIC_SENTRY_DSN="https://0123456789abcdef0123456789abcdef@o123.ingest.sentry.io/not-a-project" | reject | reject | 1 | PASS |
| sentry-dsn | EXPO_PUBLIC_SENTRY_DSN="https://0123456789abcdef0123456789abcdef@o123.ingest.sentry.io/123abc" | reject | reject | 1 | PASS |
| sentry-dsn | EXPO_PUBLIC_SENTRY_DSN="https://0123456789abcdef0123456789abcdef@o123.ingest.sentry.io" | reject | reject | 1 | PASS |
| sentry-dsn | EXPO_PUBLIC_SENTRY_DSN="https://o123.ingest.sentry.io/7654321" | reject | reject | 1 | PASS |
| sentry-dsn | EXPO_PUBLIC_SENTRY_DSN="http://0123456789abcdef0123456789abcdef@o123.ingest.sentry.io/7654321" | reject | reject | 1 | PASS |
| sentry-dsn | EXPO_PUBLIC_SENTRY_DSN="https://0123456789abcdef0123456789abcdef@o123.ingest.sentry.io/7654321?x=1" | reject | reject | 1 | PASS |
| sentry-dsn | EXPO_PUBLIC_SENTRY_DSN="https://0123456789abcdef0123456789abcdef@o123.ingest.sentry.io/7654321#f" | reject | reject | 1 | PASS |
| sentry-dsn | EXPO_PUBLIC_SENTRY_DSN="https://0123456789abcdef0123456789abcdef@sentry.caneguard.ph/sentry/7654321" | accept | accept | 0 | PASS |
| upload | missing SENTRY_ORG/SENTRY_PROJECT/SENTRY_AUTH_TOKEN | reject | reject | 1 | PASS |
| upload | blank upload keys but --skip-upload (OTA lane) | accept | accept | 0 | PASS |
| upload | complete build env but --skip-upload | accept | accept | 0 | PASS |
| profile | development profile, unsafe env (no gate) | accept | accept | 0 | PASS |
| profile | preview profile, unsafe env (no gate) | accept | accept | 0 | PASS |
| profile | no EAS_BUILD_PROFILE, unsafe env (local dev) | accept | accept | 0 | PASS |
| profile | --require-production with no build profile | reject | reject | 1 | PASS |
| profile | production profile with unsafe env | reject | reject | 1 | PASS |

## Gate messages

### complete production environment
expected `accept`, got `accept` (exit 0) — API https public host + valid DSN + upload keys
```
(no output)
```

### EXPO_PUBLIC_API_BASE_URL="https://api.caneguard.ph/v1"
expected `accept`, got `accept` (exit 0) — path allowed
```
(no output)
```

### EXPO_PUBLIC_API_BASE_URL="https://API.CaneGuard.ph"
expected `accept`, got `accept` (exit 0) — host is case-insensitive
```
(no output)
```

### EXPO_PUBLIC_API_BASE_URL="https://api.caneguard.ph."
expected `accept`, got `accept` (exit 0) — absolute FQDN root dot
```
(no output)
```

### EXPO_PUBLIC_API_BASE_URL="https://[2606:4700:4700::1111]"
expected `accept`, got `accept` (exit 0) — globally routable IPv6 (R4: no blanket IPv6 rejection)
```
(no output)
```

### EXPO_PUBLIC_API_BASE_URL="https://2606:4700:4700::1111"
expected `reject`, got `reject` (exit 1) — unbracketed IPv6 is not a valid URL authority
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must be a valid absolute URL.
```

### EXPO_PUBLIC_API_BASE_URL="http://api.caneguard.ph"
expected `reject`, got `reject` (exit 1) — scheme must be https
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use https in production.
```

### EXPO_PUBLIC_API_BASE_URL=""
expected `reject`, got `reject` (exit 1) — required
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL is required for a production build.
```

### EXPO_PUBLIC_API_BASE_URL="not a url"
expected `reject`, got `reject` (exit 1) — syntax
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must be a valid absolute URL.
```

### EXPO_PUBLIC_API_BASE_URL="https://localhost"
expected `reject`, got `reject` (exit 1) — localhost
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "localhost").
```

### EXPO_PUBLIC_API_BASE_URL="https://api.localhost"
expected `reject`, got `reject` (exit 1) — *.localhost
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "api.localhost").
```

### EXPO_PUBLIC_API_BASE_URL="https://127.0.0.1"
expected `reject`, got `reject` (exit 1) — loopback
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "127.0.0.1").
```

### EXPO_PUBLIC_API_BASE_URL="https://127.1.2.3"
expected `reject`, got `reject` (exit 1) — loopback range
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "127.1.2.3").
```

### EXPO_PUBLIC_API_BASE_URL="https://0.0.0.0"
expected `reject`, got `reject` (exit 1) — unspecified
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "0.0.0.0").
```

### EXPO_PUBLIC_API_BASE_URL="https://10.1.2.3"
expected `reject`, got `reject` (exit 1) — RFC1918 10/8
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "10.1.2.3").
```

### EXPO_PUBLIC_API_BASE_URL="https://192.168.0.10"
expected `reject`, got `reject` (exit 1) — RFC1918 192.168/16
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "192.168.0.10").
```

### EXPO_PUBLIC_API_BASE_URL="https://172.16.5.4"
expected `reject`, got `reject` (exit 1) — RFC1918 172.16/12
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "172.16.5.4").
```

### EXPO_PUBLIC_API_BASE_URL="https://169.254.169.254"
expected `reject`, got `reject` (exit 1) — link-local / cloud metadata
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "169.254.169.254").
```

### EXPO_PUBLIC_API_BASE_URL="https://100.64.0.1"
expected `reject`, got `reject` (exit 1) — CGNAT 100.64/10
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "100.64.0.1").
```

### EXPO_PUBLIC_API_BASE_URL="https://192.0.2.1"
expected `reject`, got `reject` (exit 1) — IANA TEST-NET-1 (R1)
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "192.0.2.1").
```

### EXPO_PUBLIC_API_BASE_URL="https://198.18.0.1"
expected `reject`, got `reject` (exit 1) — IANA benchmarking 198.18/15 (R1)
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "198.18.0.1").
```

### EXPO_PUBLIC_API_BASE_URL="https://203.0.113.9"
expected `reject`, got `reject` (exit 1) — IANA TEST-NET-3
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "203.0.113.9").
```

### EXPO_PUBLIC_API_BASE_URL="https://198.51.100.7"
expected `reject`, got `reject` (exit 1) — IANA TEST-NET-2
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "198.51.100.7").
```

### EXPO_PUBLIC_API_BASE_URL="https://224.0.0.1"
expected `reject`, got `reject` (exit 1) — multicast
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "224.0.0.1").
```

### EXPO_PUBLIC_API_BASE_URL="https://255.255.255.255"
expected `reject`, got `reject` (exit 1) — broadcast / reserved
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "255.255.255.255").
```

### EXPO_PUBLIC_API_BASE_URL="https://[::1]"
expected `reject`, got `reject` (exit 1) — IPv6 loopback
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "[::1]").
```

### EXPO_PUBLIC_API_BASE_URL="https://[fe80::1]"
expected `reject`, got `reject` (exit 1) — IPv6 link-local
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "[fe80::1]").
```

### EXPO_PUBLIC_API_BASE_URL="https://[fd00::1]"
expected `reject`, got `reject` (exit 1) — IPv6 ULA
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "[fd00::1]").
```

### EXPO_PUBLIC_API_BASE_URL="https://[2001:db8::1]"
expected `reject`, got `reject` (exit 1) — IPv6 documentation range
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "[2001:db8::1]").
```

### EXPO_PUBLIC_API_BASE_URL="https://[::ffff:127.0.0.1]"
expected `reject`, got `reject` (exit 1) — IPv4-mapped loopback
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "[::ffff:7f00:1]").
```

### EXPO_PUBLIC_API_BASE_URL="https://api..caneguard.ph"
expected `reject`, got `reject` (exit 1) — RFC1035 empty label (R1)
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "api..caneguard.ph").
```

### EXPO_PUBLIC_API_BASE_URL="https://api-.caneguard.ph"
expected `reject`, got `reject` (exit 1) — label must not end with hyphen
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "api-.caneguard.ph").
```

### EXPO_PUBLIC_API_BASE_URL="https://-api.caneguard.ph"
expected `reject`, got `reject` (exit 1) — label must not start with hyphen
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "-api.caneguard.ph").
```

### EXPO_PUBLIC_API_BASE_URL="https://intranet"
expected `reject`, got `reject` (exit 1) — single-label intranet host
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "intranet").
```

### EXPO_PUBLIC_API_BASE_URL="https://box.local"
expected `reject`, got `reject` (exit 1) — .local suffix
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "box.local").
```

### EXPO_PUBLIC_API_BASE_URL="https://api.internal"
expected `reject`, got `reject` (exit 1) — .internal suffix
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "api.internal").
```

### EXPO_PUBLIC_API_BASE_URL="https://api.example.test"
expected `reject`, got `reject` (exit 1) — reserved .test suffix
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "api.example.test").
```

### EXPO_PUBLIC_API_BASE_URL="https://api.example.com"
expected `accept`, got `accept` (exit 0) — example.com is public (not blocked)
```
(no output)
```

### EXPO_PUBLIC_API_BASE_URL="https://user:pw@api.caneguard.ph"
expected `reject`, got `reject` (exit 1) — embedded credentials
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must not contain credentials.
```

### EXPO_PUBLIC_API_BASE_URL="https://api.caneguard.ph/?a=1"
expected `reject`, got `reject` (exit 1) — query string
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must not contain a query string or fragment.
```

### EXPO_PUBLIC_API_BASE_URL="https://api.caneguard.ph/#frag"
expected `reject`, got `reject` (exit 1) — fragment
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must not contain a query string or fragment.
```

### EXPO_PUBLIC_API_BASE_URL="https://api.caneguard.ph@evil.internal"
expected `reject`, got `reject` (exit 1) — userinfo credential trick hides a non-public host
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must not contain credentials.
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "evil.internal").
```

### EXPO_PUBLIC_API_BASE_URL="https://2130706433"
expected `reject`, got `reject` (exit 1) — WHATWG-normalized decimal IPv4 loopback
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "127.0.0.1").
```

### EXPO_PUBLIC_API_BASE_URL="https://0x7f.0.0.1"
expected `reject`, got `reject` (exit 1) — WHATWG-normalized hex IPv4 loopback
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "127.0.0.1").
```

### EXPO_PUBLIC_API_BASE_URL="https://0x7f000001"
expected `reject`, got `reject` (exit 1) — WHATWG-normalized hex IPv4 loopback (compact)
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "127.0.0.1").
```

### EXPO_PUBLIC_SENTRY_DSN=""
expected `reject`, got `reject` (exit 1) — required
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_SENTRY_DSN is required for a production build.
```

### EXPO_PUBLIC_SENTRY_DSN="not-a-dsn"
expected `reject`, got `reject` (exit 1) — syntax
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_SENTRY_DSN must be a valid Sentry DSN URL.
```

### EXPO_PUBLIC_SENTRY_DSN="https://0123456789abcdef0123456789abcdef@o123.ingest.sentry.io/not-a-project"
expected `reject`, got `reject` (exit 1) — R2: final segment must be a numeric project id
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_SENTRY_DSN must look like https://<public-key>@<host>/<project-id>.
```

### EXPO_PUBLIC_SENTRY_DSN="https://0123456789abcdef0123456789abcdef@o123.ingest.sentry.io/123abc"
expected `reject`, got `reject` (exit 1) — R2: project id must be all digits
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_SENTRY_DSN must look like https://<public-key>@<host>/<project-id>.
```

### EXPO_PUBLIC_SENTRY_DSN="https://0123456789abcdef0123456789abcdef@o123.ingest.sentry.io"
expected `reject`, got `reject` (exit 1) — missing project id
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_SENTRY_DSN must look like https://<public-key>@<host>/<project-id>.
```

### EXPO_PUBLIC_SENTRY_DSN="https://o123.ingest.sentry.io/7654321"
expected `reject`, got `reject` (exit 1) — missing public key
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_SENTRY_DSN must look like https://<public-key>@<host>/<project-id>.
```

### EXPO_PUBLIC_SENTRY_DSN="http://0123456789abcdef0123456789abcdef@o123.ingest.sentry.io/7654321"
expected `reject`, got `reject` (exit 1) — DSN scheme must be https
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_SENTRY_DSN must look like https://<public-key>@<host>/<project-id>.
```

### EXPO_PUBLIC_SENTRY_DSN="https://0123456789abcdef0123456789abcdef@o123.ingest.sentry.io/7654321?x=1"
expected `reject`, got `reject` (exit 1) — query string is not part of a DSN
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_SENTRY_DSN must look like https://<public-key>@<host>/<project-id>.
```

### EXPO_PUBLIC_SENTRY_DSN="https://0123456789abcdef0123456789abcdef@o123.ingest.sentry.io/7654321#f"
expected `reject`, got `reject` (exit 1) — fragment is not part of a DSN
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_SENTRY_DSN must look like https://<public-key>@<host>/<project-id>.
```

### EXPO_PUBLIC_SENTRY_DSN="https://0123456789abcdef0123456789abcdef@sentry.caneguard.ph/sentry/7654321"
expected `accept`, got `accept` (exit 0) — self-hosted path prefix preserved
```
(no output)
```

### missing SENTRY_ORG/SENTRY_PROJECT/SENTRY_AUTH_TOKEN
expected `reject`, got `reject` (exit 1) — D9 requires source map + symbol upload for production builds
```
CaneGuard production release gate failed; no build was started:
- SENTRY_ORG is required for a production build so source maps and native symbols are uploaded.
- SENTRY_PROJECT is required for a production build so source maps and native symbols are uploaded.
- SENTRY_AUTH_TOKEN is required for a production build so source maps and native symbols are uploaded.
```

### blank upload keys but --skip-upload (OTA lane)
expected `accept`, got `accept` (exit 0) — OTA updates ship no native symbols
```
(no output)
```

### complete build env but --skip-upload
expected `accept`, got `accept` (exit 0) — flag only removes the upload requirement
```
(no output)
```

### development profile, unsafe env (no gate)
expected `accept`, got `accept` (exit 0) — gate applies to production only (D10)
```
(no output)
```

### preview profile, unsafe env (no gate)
expected `accept`, got `accept` (exit 0) — gate applies to production only (D10)
```
(no output)
```

### no EAS_BUILD_PROFILE, unsafe env (local dev)
expected `accept`, got `accept` (exit 0) — local dev pre-install must not gate
```
(no output)
```

### --require-production with no build profile
expected `reject`, got `reject` (exit 1) — manual preflight forces the production gate
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use https in production.
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "127.0.0.1").
- SENTRY_ORG is required for a production build so source maps and native symbols are uploaded.
- SENTRY_PROJECT is required for a production build so source maps and native symbols are uploaded.
- SENTRY_AUTH_TOKEN is required for a production build so source maps and native symbols are uploaded.
```

### production profile with unsafe env
expected `reject`, got `reject` (exit 1) — the EAS pre-install hook gates production
```
CaneGuard production release gate failed; no build was started:
- EXPO_PUBLIC_API_BASE_URL must use https in production.
- EXPO_PUBLIC_API_BASE_URL must use a public host, not a local, private, or placeholder address (received host "localhost").
```
