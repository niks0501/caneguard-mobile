import * as Device from 'expo-device';
import type { PropsWithChildren } from 'react';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  loginMobile,
  logoutMobile,
  MobileAuthError,
  verifyMobileSession,
} from '@/features/auth/api/mobileAuthApi';
import {
  clearMobileSession,
  readMobileSession,
  saveMobileSession,
} from '@/features/auth/services/tokenStore';
import type {
  AuthStatus,
  MobileSession,
  MobileUser,
} from '@/features/auth/types';

interface AuthContextValue {
  errorMessage: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<{
    localClearFailed: boolean;
    remoteRevocationFailed: boolean;
  }>;
  markSessionExpired: () => Promise<void>;
  session: MobileSession | null;
  status: AuthStatus;
  user: MobileUser | null;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<MobileSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>('restoring');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const markSessionExpired = useCallback(async () => {
    let localClearFailed = false;
    try {
      await clearMobileSession();
    } catch {
      localClearFailed = true;
    }
    setSession(null);
    setStatus('unauthenticated');
    setErrorMessage(
      localClearFailed
        ? 'Your session expired, but secure storage could not be cleared. Restart the app before signing in again.'
        : 'Your session expired. Sign in to resume pending uploads.',
    );
  }, []);

  useEffect(() => {
    let active = true;

    void (async () => {
      const stored = await readMobileSession();
      if (!active) {
        return;
      }
      if (!stored) {
        setStatus('unauthenticated');
        return;
      }

      try {
        const user = await verifyMobileSession(stored.token);
        const verified = { ...stored, user };
        await saveMobileSession(verified);
        if (active) {
          setSession(verified);
          setStatus('authenticated');
        }
      } catch (error: unknown) {
        if (
          error instanceof MobileAuthError &&
          (error.code === 'INVALID_CREDENTIALS' ||
            error.code === 'FORBIDDEN_ROLE' ||
            error.code === 'SESSION_EXPIRED')
        ) {
          await clearMobileSession();
          if (active) {
            setStatus('unauthenticated');
          }
          return;
        }

        // Keep a previously verified session usable offline. The API will
        // confirm or reject it before any report is accepted.
        if (active) {
          setSession(stored);
          setStatus('authenticated');
          setErrorMessage(
            'Working offline. CaneGuard will verify your session when the server is available.',
          );
        }
      }
    })().catch(() => {
      if (active) {
        setStatus('unauthenticated');
        setErrorMessage('Secure session storage could not be opened.');
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setErrorMessage(null);
    try {
      const nextSession = await loginMobile({
        email,
        password,
        deviceName:
          Device.deviceName ?? Device.modelName ?? 'CaneGuard Android device',
      });
      try {
        await saveMobileSession(nextSession);
      } catch {
        try {
          await logoutMobile(nextSession.token);
        } catch {
          // Best effort: do not expose or retain a token that could not be
          // stored securely.
        }
        throw new MobileAuthError(
          'INVALID_RESPONSE',
          'Secure session storage is unavailable. Sign in was cancelled.',
        );
      }
      setSession(nextSession);
      setStatus('authenticated');
      return true;
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof MobileAuthError
          ? error.message
          : 'CaneGuard could not complete sign in.',
      );
      setStatus('unauthenticated');
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    let remoteRevocationFailed = false;
    if (session?.token) {
      try {
        await logoutMobile(session.token);
      } catch {
        remoteRevocationFailed = true;
      }
    }
    try {
      await clearMobileSession();
    } catch {
      setErrorMessage(
        'CaneGuard could not clear secure session storage. Restart the app and try logout again.',
      );
      return { localClearFailed: true, remoteRevocationFailed };
    }
    setSession(null);
    setStatus('unauthenticated');
    setErrorMessage(
      remoteRevocationFailed
        ? 'Signed out on this device. The server token could not be revoked and may remain active.'
        : null,
    );
    return { localClearFailed: false, remoteRevocationFailed };
  }, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      errorMessage,
      login,
      logout,
      markSessionExpired,
      session,
      status,
      user: session?.user ?? null,
    }),
    [errorMessage, login, logout, markSessionExpired, session, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
