import type { PropsWithChildren } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { MobileAuthError, verifyMobileSession } from '@/features/auth/api/mobileAuthApi';
import type { CapabilityGrant } from '@/features/auth/domain/sessionState';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AuthProvider } from '@/features/auth/providers/AuthProvider';
import {
  isBiometricUnlockEnabled,
  readProtectedMobileSession,
  saveProtectedMobileSession,
} from '@/features/auth/services/tokenStore';
import { authenticateWithBiometrics } from '@/features/auth/services/biometricAuth';
import type { MobileSession } from '@/features/auth/types';

jest.mock('expo-device', () => ({ deviceName: 'Test phone', modelName: 'Test model' }));
jest.mock('@/features/auth/api/mobileAuthApi', () => {
  const actual = jest.requireActual('@/features/auth/api/mobileAuthApi');
  return {
    ...actual,
    loginMobile: jest.fn(),
    logoutMobile: jest.fn(async () => undefined),
    verifyMobileSession: jest.fn(),
  };
});
jest.mock('@/features/auth/services/tokenStore', () => ({
  BiometricSessionError: class BiometricSessionError extends Error {
    code = 'ACCESS_FAILED';
  },
  StoredSessionExpiredError: class StoredSessionExpiredError extends Error {},
  clearLegacyMobileSession: jest.fn(async () => false),
  clearMobileSession: jest.fn(async () => undefined),
  disableBiometricUnlock: jest.fn(async () => undefined),
  hasCompletedMobileLogin: jest.fn(async () => true),
  isBiometricUnlockEnabled: jest.fn(async () => true),
  markMobileLoginCompleted: jest.fn(async () => undefined),
  readProtectedMobileSession: jest.fn(async () => null),
  saveProtectedMobileSession: jest.fn(async () => undefined),
}));
jest.mock('@/features/auth/services/deviceIdentity', () => ({
  DeviceIdentityError: class DeviceIdentityError extends Error {},
  getOrCreateMobileDeviceId: jest.fn(async () => 'installation-uuid'),
}));
jest.mock('@/features/auth/services/biometricAuth', () => ({
  authenticateWithBiometrics: jest.fn(async () => ({ success: true })),
  getBiometricCapability: jest.fn(async () => ({
    deviceCredentialAvailable: true,
    status: 'available',
    strongBiometricsAvailable: true,
  })),
}));
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => () => undefined),
    fetch: jest.fn(async () => ({ isConnected: true, isInternetReachable: true })),
  },
}));

const HOUR = 60 * 60 * 1000;
const CAPS = ['report:submit', 'assignment:read', 'assignment:complete'];
const USER = {
  uuid: 'user-uuid',
  name: 'Field Reporter',
  email: 'field@caneguard.test',
  role: 'field_reporter' as const,
};
const UNREACHABLE = new MobileAuthError('SERVER_UNAVAILABLE', 'CaneGuard could not reach the server.');

function grantAt(verifiedHoursAgo: number, overrides: Partial<CapabilityGrant> = {}): CapabilityGrant {
  const verified = Date.now() - verifiedHoursAgo * HOUR;
  return {
    v: 1,
    userUuid: USER.uuid,
    deviceId: 'installation-uuid',
    capabilities: CAPS,
    verifiedAt: new Date(verified).toISOString(),
    validUntil: new Date(verified + 72 * HOUR).toISOString(),
    serverOffsetMs: 0,
    ...overrides,
  };
}

function storedWith(grant: CapabilityGrant | undefined): MobileSession {
  return {
    deviceId: 'installation-uuid',
    token: 'stored-token',
    expiresAt: new Date(Date.now() + 20 * 24 * HOUR).toISOString(),
    user: { ...USER, capabilities: CAPS },
    ...(grant ? { capabilityGrant: grant } : {}),
  };
}

function wrapper({ children }: PropsWithChildren) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthProvider carry-over (NET-3)', () => {
  const mockVerify = jest.mocked(verifyMobileSession);
  const mockRead = jest.mocked(readProtectedMobileSession);
  const mockSave = jest.mocked(saveProtectedMobileSession);

  beforeEach(() => {
    mockVerify.mockReset();
    mockRead.mockReset();
    mockSave.mockReset();
    mockSave.mockResolvedValue(undefined);
    jest.mocked(isBiometricUnlockEnabled).mockResolvedValue(true);
    jest.mocked(authenticateWithBiometrics).mockResolvedValue({ success: true });
  });

  // Intent: "Carry-over(lastVerified, until)": an offline restart with a valid dated grant resumes with the carried capabilities.
  it('resumes in Carry-over with the grant capabilities when /me cannot be reached', async () => {
    const grant = grantAt(2);
    mockRead.mockResolvedValueOnce(storedWith(grant));
    mockVerify.mockRejectedValue(UNREACHABLE);

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.sessionVerification).toBe('unavailable'));

    expect(result.current.sessionState).toEqual({
      kind: 'carry-over',
      lastVerified: grant.verifiedAt,
      until: grant.validUntil,
    });
    expect(result.current.user?.capabilities).toEqual(CAPS);
    expect(result.current.getAuthoringProvenance()).toEqual({ basis: 'carryover', verifiedAt: grant.verifiedAt });
  });

  // Intent: "the 72-hour authoring window": once it has passed, nothing is carried and nothing new can be finished.
  it('is Expired with no capabilities and no authoring once the window has passed', async () => {
    mockRead.mockResolvedValueOnce(storedWith(grantAt(73)));
    mockVerify.mockRejectedValue(UNREACHABLE);

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.sessionVerification).toBe('unavailable'));

    expect(result.current.sessionState.kind).toBe('expired');
    expect(result.current.user?.capabilities).toEqual([]);
    expect(result.current.getAuthoringProvenance()).toBeNull();
  });

  // Intent: carry-over is bound to its owner; the undated login list never stands in for a grant.
  it('ignores a grant that belongs to another account and never uses the undated list', async () => {
    mockRead.mockResolvedValueOnce(storedWith(grantAt(1, { userUuid: 'someone-else' })));
    mockVerify.mockRejectedValue(UNREACHABLE);

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.sessionVerification).toBe('unavailable'));

    expect(result.current.sessionState.kind).toBe('expired');
    expect(result.current.user?.capabilities).toEqual([]);
  });

  // Intent: Q3 "pending stays fail-closed": nothing is carried while /me is still being asked.
  it('carries nothing while /me is still pending', async () => {
    mockRead.mockResolvedValueOnce(storedWith(grantAt(1)));
    mockVerify.mockReturnValue(new Promise(() => undefined));

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.sessionVerification).toBe('pending'));

    expect(result.current.sessionState.kind).toBe('checking');
    expect(result.current.user?.capabilities).toEqual([]);
    expect(result.current.getAuthoringProvenance()).toBeNull();
  });

  // Intent: a /me success replaces everything with a fresh dated grant and the Verified(at) state.
  it('is Verified with a fresh grant after /me succeeds', async () => {
    mockRead.mockResolvedValueOnce(storedWith(undefined));
    mockVerify.mockResolvedValue({ ...USER, capabilities: ['report:submit'] });

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.sessionVerification).toBe('verified'));

    expect(result.current.sessionState.kind).toBe('verified');
    expect(result.current.session?.capabilityGrant?.capabilities).toEqual(['report:submit']);
    expect(result.current.getAuthoringProvenance()?.basis).toBe('verified');
  });

  // Intent: "map CAPABILITY_REVOKED to its own code" reaches the session: carried capabilities drop at once, the session stays, /me decides what comes back.
  it('drops capabilities and the grant on a revocation report, then recovers on the next /me', async () => {
    mockRead.mockResolvedValueOnce(storedWith(grantAt(1)));
    mockVerify.mockResolvedValueOnce({ ...USER, capabilities: CAPS });

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.sessionState.kind).toBe('verified'));

    mockVerify.mockRejectedValueOnce(UNREACHABLE);
    await act(async () => {
      await result.current.reportCapabilityRevoked();
    });

    expect(result.current.status).toBe('authenticated');
    expect(result.current.sessionState).toEqual({ kind: 'revoked', reason: 'capability-revoked' });
    expect(result.current.user?.capabilities).toEqual([]);
    expect(result.current.session?.capabilityGrant).toBeUndefined();
    expect(result.current.getAuthoringProvenance()).toBeNull();
    // The protected entry is rewritten without the grant so a restart cannot revive it.
    expect(mockSave).toHaveBeenCalledWith(expect.not.objectContaining({ capabilityGrant: expect.anything() }));

    mockVerify.mockResolvedValueOnce({ ...USER, capabilities: ['report:submit'] });
    await act(async () => {
      await result.current.retrySessionVerification({ reason: 'revoked' });
    });
    expect(result.current.sessionState.kind).toBe('verified');
    expect(result.current.user?.capabilities).toEqual(['report:submit']);
  });

  // Intent: an authoritative /me rejection is Revoked (named), not a silent sign-out.
  it('names a rejected session as Revoked', async () => {
    mockRead.mockResolvedValueOnce(storedWith(grantAt(1)));
    mockVerify.mockRejectedValue(new MobileAuthError('SESSION_EXPIRED', 'Expired'));

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    expect(result.current.sessionState).toEqual({ kind: 'revoked', reason: 'session-rejected' });
  });

  // Intent: the 72-hour bound is enforced while the app stays open: the window closing drops the carried capabilities and ends authoring.
  it('drops carried capabilities when the window closes while the app is open', async () => {
    jest.useFakeTimers({ advanceTimers: true });
    try {
      mockRead.mockResolvedValueOnce(storedWith(grantAt(71)));
      mockVerify.mockRejectedValue(UNREACHABLE);

      const { result } = await renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.sessionState.kind).toBe('carry-over'));
      expect(result.current.user?.capabilities).toEqual(CAPS);

      await act(async () => {
        jest.advanceTimersByTime(61 * 60 * 1000);
      });

      await waitFor(() => expect(result.current.sessionState.kind).toBe('expired'));
      expect(result.current.user?.capabilities).toEqual([]);
      expect(result.current.getAuthoringProvenance()).toBeNull();
      expect(result.current.status).toBe('authenticated');
    } finally {
      jest.useRealTimers();
    }
  });
});
