# Biometric capability and safe fallback

## Intent
Explain the available local unlock capability honestly and preserve safe
password fallback. Source intent: the pre-migration
`.maestro/auth-v1/11-biometric-or-device-credential-fallback.yaml` and its manual
unlock follow-up; no executable Agent Device flow existed for this item.

## Prerequisites
- Matching development build and a disposable verified reporter account.
- Online local API/browser for password authentication.
- For enrolled-prompt steps only, a developer-prepared emulator with a
  supported enrolled strong biometric. Do not provision credentials during
  this test. On the current unenrolled emulator, run capability checks and
  record the enrolled-prompt steps Not executable.

## Steps and expected results
1. Sign in online. Open Settings → Account & security. **Expect:** Biometric
   unlock plus a capability explanation matching the actual device: supported,
   enrollment needed, unsupported, or native build unavailable.
2. On an unenrolled/unsupported target, attempt to enable local biometric
   unlock if the control is available. **Expect:** no false claim that unlock
   is enabled; password sign-in remains usable.
3. On a separately prepared enrolled target, enable biometric unlock and
   authenticate. **Expect:** one native prompt for enabling, with the setting
   enabled only after successful authentication.
4. Force stop and reopen through Android Apps settings. Cancel the native
   prompt. **Expect:** no protected content is unlocked; a safe retry/password
   path remains available. Do not substitute an automation-only bypass.
5. Sign in online using the correct password. **Expect:** authenticated Home.
6. Restart again and complete the supported native biometric prompt.
   **Expect:** exactly one prompt and access only after successful unlock.
7. Sign out explicitly. **Expect:** cached authentication is cleared; reopening
   must not use the old biometric/session state to enter protected content.

## Why this is manual
Native credential/enrollment and biometric prompts are explicitly excluded
from this automation target by the captain. Browser automation cannot satisfy
an Android native authentication prompt. Capability-only evidence is not
biometric success, cancellation, or fallback evidence.
