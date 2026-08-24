import * as Device from 'expo-device';
import type { PropsWithChildren } from 'react';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
  SessionVerificationStatus,
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
  sessionVerification: SessionVerificationStatus;
  status: AuthStatus;
  user: MobileUser | null;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<MobileSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>('restoring');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionVerification, setSessionVerification] =
    useState<SessionVerificationStatus>('idle');
  const verificationGeneration = useRef(0);

  const markSessionExpired = useCallback(async () => {
    verificationGeneration.current += 1;
    let localClearFailed = false;
    try {
      await clearMobileSession();
    } catch {
      localClearFailed = true;
    }
    setSession(null);
    setStatus('unauthenticated');
    setSessionVerification('idle');
    setErrorMessage(
      localClearFailed
        ? 'Your session expired, but secure storage could not be cleared. Restart the app before signing in again.'
        : 'Your session expired. Sign in to resume pending uploads.',
    );
  }, []);

  useEffect(() => {
    let active = true;
    const generation = verificationGeneration.current;
    const isCurrent = () =>
      active && generation === verificationGeneration.current;

    void (async () => {
      const stored = await readMobileSession();
      if (!isCurrent()) {
        return;
      }
      if (!stored) {
        setStatus('unauthenticated');
        setSessionVerification('idle');
        return;
      }

      // A structurally valid session has already been verified by the server
      // when it was stored. Hydrate it before any network work so the
      // authenticated navigator remains usable during an outage.
      setSession(stored);
      setStatus('authenticated');
      setSessionVerification('pending');
      setErrorMessage(null);

      try {
        const user = await verifyMobileSession(stored.token);
        if (!isCurrent()) {
          return;
        }

        const verified = { ...stored, user };
        try {
          await saveMobileSession(verified);
        } catch {
          // Keep the already loaded session usable in memory. A later login
          // or session refresh can retry the secure-store reconciliation.
        }
        if (isCurrent()) {
          setSession(verified);
          setStatus('authenticated');
          setSessionVerification('verified');
          setErrorMessage(null);
        }
      } catch (error: unknown) {
        if (!isCurrent()) {
          return;
        }
        if (isAuthoritativeSessionRejection(error)) {
          await clearMobileSession();
          if (isCurrent()) {
            setSession(null);
            setStatus('unauthenticated');
            setSessionVerification('idle');
            setErrorMessage(null);
          }
          return;
        }

        // Network timeouts, DNS failures, connection refusals, and temporary
        // server failures do not prove that the cached session is invalid.
        if (isCurrent()) {
          setSession(stored);
          setStatus('authenticated');
          setSessionVerification('unavailable');
          setErrorMessage(
            'Working offline. CaneGuard will verify your session when the server is available.',
          );
        }
      }
    })().catch(() => {
      if (isCurrent()) {
        setSession(null);
        setStatus('unauthenticated');
        setSessionVerification('idle');
        setErrorMessage('Secure session storage could not be opened.');
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    verificationGeneration.current += 1;
    setErrorMessage(null);
    setSessionVerification('pending');
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
      setSessionVerification('verified');
      return true;
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof MobileAuthError
          ? error.message
          : 'CaneGuard could not complete sign in.',
      );
      setStatus('unauthenticated');
      setSessionVerification('idle');
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    verificationGeneration.current += 1;
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
    setSessionVerification('idle');
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
      sessionVerification,
      status,
      user: session?.user ?? null,
    }),
    [
      errorMessage,
      login,
      logout,
      markSessionExpired,
      session,
      sessionVerification,
      status,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function isAuthoritativeSessionRejection(error: unknown): boolean {
  return (
    error instanceof MobileAuthError &&
    (error.code === 'INVALID_CREDENTIALS' ||
      error.code === 'FORBIDDEN_ROLE' ||
      error.code === 'SESSION_EXPIRED')
  );
}
