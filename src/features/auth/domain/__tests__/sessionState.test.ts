import {
  assessGrant,
  authoringProvenance,
  buildCapabilityGrant,
  CARRYOVER_WINDOW_MS,
  deriveReadiness,
  deriveSessionState,
  estimateServerNow,
  parseCapabilityGrant,
  READINESS_MIN_REMAINING_MS,
  type CapabilityGrant,
  type SessionState,
  type SessionStateInput,
} from '@/features/auth/domain/sessionState';

const HOUR = 60 * 60 * 1000;
const T0 = Date.parse('2026-11-13T08:00:00.000Z');
const OWNER = { deviceId: 'device-1', userUuid: 'user-1' };

function grant(overrides: Partial<CapabilityGrant> = {}): CapabilityGrant {
  return {
    v: 1,
    userUuid: OWNER.userUuid,
    deviceId: OWNER.deviceId,
    capabilities: ['report:submit', 'assignment:read', 'assignment:complete'],
    verifiedAt: new Date(T0).toISOString(),
    validUntil: new Date(T0 + CARRYOVER_WINDOW_MS).toISOString(),
    serverOffsetMs: 0,
    ...overrides,
  };
}

function state(overrides: Partial<SessionStateInput> = {}, now = T0 + HOUR, g: CapabilityGrant | null = grant()) {
  return deriveSessionState({
    assessment: assessGrant(g, OWNER, now),
    liveVerifiedAt: null,
    revocation: null,
    status: 'authenticated',
    verification: 'unavailable',
    ...overrides,
  });
}

describe('session union (NET-3)', () => {
  // Intent: "One session union with states Restoring | Checking | Verified(at) | Carry-over | Expired | Revoked | Signed out".
  it('derives each of the seven states from the account facts', () => {
    expect(state({ status: 'restoring' })).toEqual({ kind: 'restoring' });
    expect(state({ verification: 'pending' })).toEqual({ kind: 'checking' });
    expect(state({ status: 'unauthenticated', verification: 'idle' })).toEqual({ kind: 'signed-out' });
    expect(state({ liveVerifiedAt: grant().verifiedAt, verification: 'verified' })).toEqual({
      kind: 'verified',
      at: grant().verifiedAt,
    });
    expect(state({ verification: 'unavailable' })).toEqual({
      kind: 'carry-over',
      lastVerified: grant().verifiedAt,
      until: grant().validUntil,
    });
    expect(state({ verification: 'unavailable' }, T0 + CARRYOVER_WINDOW_MS + 1)).toMatchObject({ kind: 'expired' });
    expect(state({ revocation: 'session-rejected', status: 'unauthenticated', verification: 'idle' })).toEqual({
      kind: 'revoked',
      reason: 'session-rejected',
    });
  });

  // Intent: "Carry-over state ... bounded" - /me failing with no dated grant never grants anything.
  it('is Expired, never Carry-over, when /me is unreachable and there is no grant', () => {
    expect(state({ verification: 'unavailable' }, T0, null)).toEqual({
      kind: 'expired',
      lastVerified: null,
      until: null,
    });
  });

  // Intent: "Revoked" is its own state and survives a live session (CAPABILITY_REVOKED keeps the token).
  it('is Revoked while authenticated after an upload reports CAPABILITY_REVOKED', () => {
    expect(state({ liveVerifiedAt: grant().verifiedAt, revocation: 'capability-revoked', verification: 'verified' })).toEqual({
      kind: 'revoked',
      reason: 'capability-revoked',
    });
  });

  // Intent: the 72 h bound also applies to a warm verified session (ratified Q6).
  it('turns a warm Verified session into Expired once the window has closed', () => {
    const next = state({ liveVerifiedAt: grant().verifiedAt, verification: 'verified' }, T0 + CARRYOVER_WINDOW_MS + 1);
    expect(next).toMatchObject({ kind: 'expired', lastVerified: grant().verifiedAt });
  });
});

describe('capability grant (NET-3)', () => {
  // Intent: "authoring bound ... 72-hour window", capped by the session's own expiry, only carryable capabilities.
  it('builds a 72 h grant capped by the session expiry and the allowlist', () => {
    const built = buildCapabilityGrant({
      capabilities: ['report:submit', 'admin:everything'],
      deviceId: 'device-1',
      deviceNow: T0,
      serverNow: null,
      sessionExpiresAt: new Date(T0 + 10 * HOUR).toISOString(),
      userUuid: 'user-1',
    });
    expect(built?.capabilities).toEqual(['report:submit']);
    expect(built?.validUntil).toBe(new Date(T0 + 10 * HOUR).toISOString());
    expect(
      buildCapabilityGrant({
        capabilities: ['report:submit'],
        deviceId: null,
        deviceNow: T0,
        serverNow: null,
        sessionExpiresAt: null,
        userUuid: 'user-1',
      })?.validUntil,
    ).toBe(new Date(T0 + CARRYOVER_WINDOW_MS).toISOString());
    expect(
      buildCapabilityGrant({
        capabilities: ['something:else'],
        deviceId: null,
        deviceNow: T0,
        serverNow: null,
        sessionExpiresAt: null,
        userUuid: 'user-1',
      }),
    ).toBeNull();
  });

  // Intent: "server time is the authority": the window is measured on server time via the /me offset.
  it('measures the window on server time using the offset taken at /me', () => {
    const built = buildCapabilityGrant({
      capabilities: ['report:submit'],
      deviceId: null,
      deviceNow: T0,
      serverNow: T0 + 3 * HOUR,
      sessionExpiresAt: null,
      userUuid: 'user-1',
    });
    expect(built?.serverOffsetMs).toBe(3 * HOUR);
    expect(built?.verifiedAt).toBe(new Date(T0 + 3 * HOUR).toISOString());
    // The device clock reads T0 + 72 h: server time is 75 h after T0, i.e. exactly at the end of the window.
    expect(estimateServerNow(T0 + CARRYOVER_WINDOW_MS, built)).toBe(T0 + 3 * HOUR + CARRYOVER_WINDOW_MS);
    expect(assessGrant(built, { deviceId: null, userUuid: 'user-1' }, T0 + CARRYOVER_WINDOW_MS)).toMatchObject({
      ok: false,
      reason: 'ended',
    });
  });

  // Intent: carry-over is bound to its owner and installation, and a set-back clock voids it.
  it('ignores a foreign grant and a grant whose clock was rolled back', () => {
    expect(assessGrant(grant({ userUuid: 'someone-else' }), OWNER, T0)).toMatchObject({ ok: false, reason: 'foreign' });
    expect(assessGrant(grant({ deviceId: 'other-device' }), OWNER, T0)).toMatchObject({ ok: false, reason: 'foreign' });
    expect(assessGrant(grant(), OWNER, T0 - 6 * 60 * 1000)).toMatchObject({ ok: false, reason: 'rolled-back' });
    expect(assessGrant(grant(), OWNER, T0 - 4 * 60 * 1000)).toMatchObject({ ok: true });
  });

  // Intent: an unknown version or malformed grant fails closed.
  it('drops a malformed or unknown-version grant and any non-carryable capability', () => {
    expect(parseCapabilityGrant({ ...grant(), v: 2 })).toBeNull();
    expect(parseCapabilityGrant({ ...grant(), validUntil: 'not a date' })).toBeNull();
    expect(parseCapabilityGrant('nope')).toBeNull();
    expect(parseCapabilityGrant({ ...grant(), capabilities: ['report:submit', 'admin:all'] })?.capabilities).toEqual([
      'report:submit',
    ]);
  });
});

describe('authoring bound and provenance (NET-3)', () => {
  // Intent: "freeze provenance at finish" + "the authoring bound": only Verified or Carry-over may finish a record.
  it('allows finishing only under Verified or Carry-over, and names the basis', () => {
    expect(authoringProvenance({ kind: 'verified', at: 'A' })).toEqual({ basis: 'verified', verifiedAt: 'A' });
    expect(authoringProvenance({ kind: 'carry-over', lastVerified: 'B', until: 'C' })).toEqual({
      basis: 'carryover',
      verifiedAt: 'B',
    });
    const blocked: SessionState[] = [
      { kind: 'restoring' },
      { kind: 'checking' },
      { kind: 'expired', lastVerified: 'B', until: 'C' },
      { kind: 'revoked', reason: 'capability-revoked' },
      { kind: 'signed-out' },
    ];
    for (const next of blocked) expect(authoringProvenance(next)).toBeNull();
  });
});

describe('readiness (NET-3)', () => {
  const base = { biometricProtected: true, cachedVisits: 3, now: T0 };
  const verified: SessionState = { kind: 'verified', at: new Date(T0).toISOString() };

  // Intent: "readiness derived naming the missing step".
  it('names the one missing step for each state', () => {
    expect(deriveReadiness({ ...base, state: verified })).toEqual({ missing: null, ready: true });
    expect(deriveReadiness({ ...base, state: { kind: 'signed-out' } }).missing).toBe('sign-in');
    expect(deriveReadiness({ ...base, state: { kind: 'checking' } }).missing).toBe('wait-for-check');
    expect(deriveReadiness({ ...base, state: { kind: 'expired', lastVerified: null, until: null } }).missing).toBe(
      'confirm-access',
    );
    expect(deriveReadiness({ ...base, state: { kind: 'revoked', reason: 'capability-revoked' } }).missing).toBe('ask-office');
    expect(deriveReadiness({ ...base, state: { kind: 'revoked', reason: 'session-rejected' } }).missing).toBe('sign-in');
    expect(deriveReadiness({ ...base, biometricProtected: false, state: verified }).missing).toBe('turn-on-biometric');
    expect(deriveReadiness({ ...base, cachedVisits: 0, state: verified }).missing).toBe('download-visits');
    expect(deriveReadiness({ ...base, cachedVisits: null, state: verified }).missing).toBe('download-visits');
  });

  // Intent: a carry-over window with under 12 h left is not "ready" (ratified readiness remainder rule).
  it('is not ready on a carry-over window with under 12 h left', () => {
    const until = (ms: number): SessionState => ({
      kind: 'carry-over',
      lastVerified: new Date(T0 - 60 * HOUR).toISOString(),
      until: new Date(T0 + ms).toISOString(),
    });
    expect(deriveReadiness({ ...base, state: until(READINESS_MIN_REMAINING_MS - 1) }).missing).toBe('confirm-access');
    expect(deriveReadiness({ ...base, state: until(READINESS_MIN_REMAINING_MS) }).ready).toBe(true);
  });
});
