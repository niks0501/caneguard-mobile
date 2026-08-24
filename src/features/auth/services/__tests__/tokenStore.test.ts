import * as SecureStore from 'expo-secure-store';

import {
  clearMobileSession,
  readMobileSession,
  saveMobileSession,
} from '@/features/auth/services/tokenStore';
import type { MobileSession } from '@/features/auth/types';

jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'device-only',
  deleteItemAsync: jest.fn(async () => undefined),
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
}));

const SESSION: MobileSession = {
  token: 'plain-text-token-returned-once',
  expiresAt: null,
  user: {
    uuid: 'server-user-uuid',
    name: 'Field Reporter',
    email: 'field@caneguard.test',
    role: 'field_reporter',
  },
};

describe('mobile secure session store', () => {
  const mockGet = jest.mocked(SecureStore.getItemAsync);
  const mockSet = jest.mocked(SecureStore.setItemAsync);
  const mockDelete = jest.mocked(SecureStore.deleteItemAsync);

  it('stores and restores the session only through SecureStore', async () => {
    await saveMobileSession(SESSION);
    expect(mockSet).toHaveBeenCalledWith(
      'caneguard.mobile.session.v1',
      JSON.stringify(SESSION),
      { keychainAccessible: 'device-only' },
    );

    mockGet.mockResolvedValueOnce(JSON.stringify(SESSION));
    await expect(readMobileSession()).resolves.toEqual(SESSION);
  });

  it('deletes malformed secure data instead of returning it', async () => {
    mockGet.mockResolvedValueOnce('{"token":42}');

    await expect(readMobileSession()).resolves.toBeNull();
    expect(mockDelete).toHaveBeenCalled();
  });

  it('does not restore expired sessions', async () => {
    mockGet.mockResolvedValueOnce(
      JSON.stringify({
        ...SESSION,
        expiresAt: '2020-01-01T00:00:00.000Z',
      }),
    );

    await expect(readMobileSession()).resolves.toBeNull();
    expect(mockDelete).toHaveBeenCalled();
  });

  it('does not restore sessions with an invalid mobile user structure', async () => {
    mockGet.mockResolvedValueOnce(
      JSON.stringify({
        ...SESSION,
        user: { ...SESSION.user, role: 'admin' },
      }),
    );

    await expect(readMobileSession()).resolves.toBeNull();
    expect(mockDelete).toHaveBeenCalled();
  });

  it('clears the secure session without touching scan storage', async () => {
    await clearMobileSession();
    expect(mockDelete).toHaveBeenCalledWith(
      'caneguard.mobile.session.v1',
      { keychainAccessible: 'device-only' },
    );
  });
});
