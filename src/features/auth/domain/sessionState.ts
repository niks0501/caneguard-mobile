import { normalizeCapabilities } from '@/features/auth/capabilities';
import type { AuthStatus, SessionVerificationStatus } from '@/features/auth/types';

/**
 * NET-3: the one session union. Everything that asks "may this inspector work
 * now, and on what footing?" reads `deriveSessionState`, never the pair of
 * `AuthStatus` and `SessionVerificationStatus`.
 *
 *   Restoring -> Checking -> Verified(at)
 *                              |  /me fails for a transient reason
 *                              v
 *                        Carry-over(lastVerified, until) -> Expired
 *
 * with Revoked (the office took access away) and Signed out as the exits.
 * Time here is server time as estimated through the offset captured at the
 * last /me, never the bare device clock.
 */
export type SessionState =
  | { kind: 'restoring' }
  | { kind: 'checking' }
  | { kind: 'verified'; at: string }
  | { kind: 'carry-over'; lastVerified: string; until: string }
  | { kind: 'expired'; lastVerified: string | null; until: string | null }
  | { kind: 'revoked'; reason: RevocationReason }
  | { kind: 'signed-out' };

export type SessionStateKind = SessionState['kind'];

/** Why the office took access away; the phone names it, it never guesses. */
export type RevocationReason =
  /** An upload came back CAPABILITY_REVOKED; the session itself survives. */
  | 'capability-revoked'
  /** /me or an upload said the token or account is no longer valid. */
  | 'session-rejected';

/** The only capabilities a carry-over grant may hold (an allowlist, never a passthrough). */
export const CARRYABLE_CAPABILITIES = [
  'report:submit',
  'assignment:read',
  'assignment:complete',
] as const;

/** Ratified window: 72 h from the last /me, authoring only. */
export const CARRYOVER_WINDOW_MS = 72 * 60 * 60 * 1000;
/** A warm session older than this is re-verified on the next foreground. */
export const REVERIFY_AFTER_MS = 12 * 60 * 60 * 1000;
/** Offline readiness is only promised while at least this much window is left. */
export const READINESS_MIN_REMAINING_MS = 12 * 60 * 60 * 1000;
/** A clock set back further than this before the last /me voids the grant. */
export const CLOCK_ROLLBACK_TOLERANCE_MS = 5 * 60 * 1000;

/**
 * The dated capability grant kept inside the protected session entry. It is
 * the only thing that lets capabilities survive a restart that cannot reach /me.
 */
export interface CapabilityGrant {
  v: 1;
  userUuid: string;
  deviceId: string | null;
  capabilities: string[];
  /** Server-time estimate of the /me success that produced this grant. */
  verifiedAt: string;
  /** min(verifiedAt + 72 h, session expiry). */
  validUntil: string;
  /** serverNow - deviceNow at the /me success; applied to the device clock later. */
  serverOffsetMs: number;
}

/**
 * The device clock, read through one seam. Readiness and the session union are
 * time-dependent on purpose; they are re-derived when the window may have
 * closed (a timer and every foreground), not on every render.
 */
export function deviceClockNow(): number {
  return Date.now();
}

export function buildCapabilityGrant(input: {
  capabilities: readonly string[];
  deviceId: string | null;
  deviceNow: number;
  serverNow: number | null;
  sessionExpiresAt: string | null;
  userUuid: string;
}): CapabilityGrant | null {
  const offset =
    input.serverNow !== null && Number.isFinite(input.serverNow)
      ? input.serverNow - input.deviceNow
      : 0;
  const verifiedAtMs = input.deviceNow + offset;
  const capabilities = input.capabilities.filter((capability) =>
    (CARRYABLE_CAPABILITIES as readonly string[]).includes(capability),
  );
  if (capabilities.length === 0) {
    // Nothing carryable was confirmed, so there is nothing to carry.
    return null;
  }
  const sessionExpiry = input.sessionExpiresAt ? Date.parse(input.sessionExpiresAt) : NaN;
  const untilMs = Math.min(
    verifiedAtMs + CARRYOVER_WINDOW_MS,
    Number.isFinite(sessionExpiry) ? sessionExpiry : Number.POSITIVE_INFINITY,
  );
  return {
    v: 1,
    userUuid: input.userUuid,
    deviceId: input.deviceId,
    capabilities,
    verifiedAt: new Date(verifiedAtMs).toISOString(),
    validUntil: new Date(untilMs).toISOString(),
    serverOffsetMs: offset,
  };
}

/** Narrows stored JSON to a well-formed grant; anything else is ignored (fail-closed). */
export function parseCapabilityGrant(value: unknown): CapabilityGrant | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const grant = value as Partial<CapabilityGrant>;
  if (
    grant.v !== 1 ||
    typeof grant.userUuid !== 'string' ||
    !(grant.deviceId === null || typeof grant.deviceId === 'string') ||
    !Array.isArray(grant.capabilities) ||
    typeof grant.verifiedAt !== 'string' ||
    !Number.isFinite(Date.parse(grant.verifiedAt)) ||
    typeof grant.validUntil !== 'string' ||
    !Number.isFinite(Date.parse(grant.validUntil)) ||
    typeof grant.serverOffsetMs !== 'number' ||
    !Number.isFinite(grant.serverOffsetMs)
  ) {
    return null;
  }
  const capabilities = normalizeCapabilities(grant.capabilities).filter((capability) =>
    (CARRYABLE_CAPABILITIES as readonly string[]).includes(capability),
  );
  return {
    v: 1,
    userUuid: grant.userUuid,
    deviceId: grant.deviceId ?? null,
    capabilities,
    verifiedAt: grant.verifiedAt,
    validUntil: grant.validUntil,
    serverOffsetMs: grant.serverOffsetMs,
  };
}

export type GrantAssessment =
  | { ok: true; capabilities: string[]; verifiedAt: string; until: string }
  | { ok: false; reason: 'none' | 'foreign' | 'rolled-back' | 'ended'; verifiedAt: string | null; until: string | null };

/** Server-time estimate of now: the device clock plus the offset taken at the last /me. */
export function estimateServerNow(deviceNow: number, grant: CapabilityGrant | null): number {
  return deviceNow + (grant?.serverOffsetMs ?? 0);
}

export function assessGrant(
  grant: CapabilityGrant | null,
  owner: { deviceId: string | null; userUuid: string },
  deviceNow: number,
): GrantAssessment {
  if (!grant) return { ok: false, reason: 'none', verifiedAt: null, until: null };
  const base = { verifiedAt: grant.verifiedAt, until: grant.validUntil };
  if (grant.userUuid !== owner.userUuid || grant.deviceId !== owner.deviceId) {
    // Another account's or another installation's grant never counts.
    return { ok: false, reason: 'foreign', verifiedAt: null, until: null };
  }
  const now = estimateServerNow(deviceNow, grant);
  if (now < Date.parse(grant.verifiedAt) - CLOCK_ROLLBACK_TOLERANCE_MS) {
    return { ok: false, reason: 'rolled-back', ...base };
  }
  if (now >= Date.parse(grant.validUntil)) {
    return { ok: false, reason: 'ended', ...base };
  }
  return { ok: true, capabilities: grant.capabilities, ...base };
}

export interface SessionStateInput {
  assessment: GrantAssessment;
  /** Server-time estimate of the /me that last confirmed this live session, if any. */
  liveVerifiedAt: string | null;
  revocation: RevocationReason | null;
  status: AuthStatus;
  verification: SessionVerificationStatus;
}

export function deriveSessionState(input: SessionStateInput): SessionState {
  if (input.status === 'restoring') return { kind: 'restoring' };
  if (input.status === 'unauthenticated') {
    return input.revocation
      ? { kind: 'revoked', reason: input.revocation }
      : { kind: 'signed-out' };
  }
  // Authenticated from here on.
  if (input.revocation === 'capability-revoked') {
    return { kind: 'revoked', reason: 'capability-revoked' };
  }
  const assessment = input.assessment;
  if (input.verification === 'pending' || input.verification === 'idle') {
    return { kind: 'checking' };
  }
  if (input.verification === 'verified') {
    const at = input.liveVerifiedAt;
    if (at === null) return { kind: 'checking' };
    // A warm session cannot outlive the window: the same 72 h bound applies.
    // A grant that never existed or belongs to someone else says nothing here.
    if (assessment.ok || assessment.reason === 'none' || assessment.reason === 'foreign') {
      return { kind: 'verified', at };
    }
    return { kind: 'expired', lastVerified: assessment.verifiedAt ?? at, until: assessment.until };
  }
  // verification === 'unavailable': /me failed for a transient reason.
  if (assessment.ok) {
    return { kind: 'carry-over', lastVerified: assessment.verifiedAt, until: assessment.until };
  }
  return { kind: 'expired', lastVerified: assessment.verifiedAt, until: assessment.until };
}

export type CapabilityBasis = 'verified' | 'carryover' | 'none';

export function capabilityBasis(state: SessionState): CapabilityBasis {
  if (state.kind === 'verified') return 'verified';
  if (state.kind === 'carry-over') return 'carryover';
  return 'none';
}

/**
 * Frozen onto a record in the same local transaction that finishes it, and
 * uploaded as provenance. `verifiedAt` is when the office last confirmed access.
 */
export interface AuthoringProvenance {
  basis: 'verified' | 'carryover';
  verifiedAt: string;
}

/**
 * The authoring bound: a record may be finished only while Verified, or
 * Carry-over with time left. Returns null when it may not. Sending is never
 * bounded; only this check is.
 */
export function authoringProvenance(state: SessionState): AuthoringProvenance | null {
  if (state.kind === 'verified') return { basis: 'verified', verifiedAt: state.at };
  if (state.kind === 'carry-over') return { basis: 'carryover', verifiedAt: state.lastVerified };
  return null;
}

/**
 * The step an inspector must take before they can work offline. One name, so
 * Home, Settings and an agent all read the same missing step.
 */
export type MissingStep =
  | 'sign-in'
  | 'turn-on-biometric'
  | 'confirm-access'
  | 'wait-for-check'
  | 'ask-office'
  | 'download-visits';

export interface ReadinessInput {
  biometricProtected: boolean;
  /** null while the cache has not been read or could not be read. */
  cachedVisits: number | null;
  /** Server-time estimate of now (see `estimateServerNow`). */
  now: number;
  state: SessionState;
}

export interface Readiness {
  missing: MissingStep | null;
  ready: boolean;
}

export function deriveReadiness(input: ReadinessInput): Readiness {
  const { state } = input;
  const missing = ((): MissingStep | null => {
    switch (state.kind) {
      case 'restoring':
      case 'checking':
        return 'wait-for-check';
      case 'signed-out':
        return 'sign-in';
      case 'revoked':
        return state.reason === 'session-rejected' ? 'sign-in' : 'ask-office';
      case 'expired':
        return 'confirm-access';
      case 'verified':
      case 'carry-over':
        break;
    }
    if (!input.biometricProtected) return 'turn-on-biometric';
    if (state.kind === 'carry-over') {
      // A window with under 12 h left is not "ready": it could close mid-trip.
      const remaining = Date.parse(state.until) - input.now;
      if (remaining < READINESS_MIN_REMAINING_MS) return 'confirm-access';
    }
    if (input.cachedVisits === null || input.cachedVisits <= 0) return 'download-visits';
    return null;
  })();
  return { missing, ready: missing === null };
}
