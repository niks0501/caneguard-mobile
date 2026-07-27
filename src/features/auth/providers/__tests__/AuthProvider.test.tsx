import type { PropsWithChildren } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import {
  loginMobile,
  logoutMobile,
  MobileAuthError,
  verifyMobileSession,
} from '@/features/auth/api/mobileAuthApi';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AuthProvider } from '@/features/auth/providers/AuthProvider';
import {
  clearMobileSession,
  readMobileSession,
  saveMobileSession,
} from '@/features/auth/services/tokenStore';
import type { MobileSession } from '@/features/auth/types';

jest.mock('expo-device', () => ({
  deviceName: 'Test Android phone',
  modelName: 'Test model',
}));
jest.mock('@/features/auth/api/mobileAuthApi', () => {
  const actual = jest.requireActual('@/features/auth/api/mobileAuthApi');
  return {
    ...actual,
    loginMobile: jest.fn(),
    logoutMobile: jest.fn(),
    verifyMobileSession: jest.fn(),
  };
});
jest.mock('@/features/auth/services/tokenStore', () => ({
  clearMobileSession: jest.fn(async () => undefined),
  readMobileSession: jest.fn(async () => null),
  saveMobileSession: jest.fn(async () => undefined),
}));

const SESSION: MobileSession = {
  token: 'secure-token',
  expiresAt: null,
  user: {
    uuid: 'user-uuid',
    name: 'Field Reporter',
    email: 'field@caneguard.test',
    role: 'field_reporter',
  },
};

function wrapper({ children }: PropsWithChildren) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthProvider', () => {
  const mockLogin = jest.mocked(loginMobile);
  const mockLogout = jest.mocked(logoutMobile);
  const mockVerify = jest.mocked(verifyMobileSession);
  const mockRead = jest.mocked(readMobileSession);
  const mockSave = jest.mocked(saveMobileSession);
  const mockClear = jest.mocked(clearMobileSession);

  it('signs in and stores the verified session securely', async () => {
    mockLogin.mockResolvedValueOnce(SESSION);
    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    await act(async () => {
      await expect(
        result.current.login('field@caneguard.test', 'password'),
      ).resolves.toBe(true);
    });

    expect(mockLogin).toHaveBeenCalledWith({
      email: 'field@caneguard.test',
      password: 'password',
      deviceName: 'Test Android phone',
    });
    expect(mockSave).toHaveBeenCalledWith(SESSION);
    expect(result.current.status).toBe('authenticated');
  });

  it('clears a server-rejected restored session', async () => {
    mockRead.mockResolvedValueOnce(SESSION);
    mockVerify.mockRejectedValueOnce(
      new MobileAuthError('INVALID_CREDENTIALS', 'Expired'),
    );

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    expect(mockClear).toHaveBeenCalled();
    expect(result.current.session).toBeNull();
  });

  it('clears locally and reports when remote logout cannot revoke', async () => {
    mockRead.mockResolvedValueOnce(SESSION);
    mockVerify.mockResolvedValueOnce(SESSION.user);
    mockLogout.mockRejectedValueOnce(new Error('offline'));

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('authenticated'));

    await act(async () => {
      await expect(result.current.logout()).resolves.toEqual({
        localClearFailed: false,
        remoteRevocationFailed: true,
      });
    });

    expect(mockClear).toHaveBeenCalled();
    expect(result.current.status).toBe('unauthenticated');
    expect(result.current.session).toBeNull();
  });
});
