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
  changeEmail as changeEmailApi,
  changePassword as changePasswordApi,
  disableBiometric as disableBiometricApi,
  enrollMobileDevice as enrollMobileDeviceApi,
  loginMobile,
  logoutMobile,
  MobileAuthError,
  verifyMobileSession,
} from '@/features/auth/api/mobileAuthApi';
import {
  authenticateWithBiometrics,
  getBiometricCapability,
} from '@/features/auth/services/biometricAuth';
import { getOrCreateMobileDeviceId, DeviceIdentityError } from '@/features/auth/services/deviceIdentity';
import {
  BiometricSessionError,
  clearLegacyMobileSession,
  clearMobileSession,
  disableBiometricUnlock,
  hasCompletedMobileLogin,
  isBiometricUnlockEnabled,
  markMobileLoginCompleted,
  readProtectedMobileSession,
  saveProtectedMobileSession,
  StoredSessionExpiredError,
} from '@/features/auth/services/tokenStore';
import type {
  AuthStatus,
  BiometricAuthResult,
  BiometricCapability,
  EmailChangeInput,
  MobileSession,
  MobileUser,
  PasswordChangeInput,
  SessionVerificationStatus,
} from '@/features/auth/types';

interface AuthContextValue {
  biometricCapability: BiometricCapability | null;
  biometricEnabled: boolean;
  biometricLoading: boolean;
  changeEmail: (input: EmailChangeInput) => Promise<boolean>;
  changePassword: (input: PasswordChangeInput) => Promise<boolean>;
  clearSessionAfterRemoteRevocation: () => Promise<boolean>;
  disableBiometric: (currentPassword: string) => Promise<boolean>;
  enableBiometricUnlock: () => Promise<boolean>;
  enrollMobileDevice: (currentPassword: string, deviceName: string) => Promise<boolean>;
  errorMessage: string | null;
  hasCompletedLogin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<{
    localClearFailed: boolean;
    remoteRevocationFailed: boolean;
  }>;
  markSessionExpired: () => Promise<void>;
  session: MobileSession | null;
  sessionVerification: SessionVerificationStatus;
  status: AuthStatus;
  unlockWithBiometrics: () => Promise<boolean>;
  user: MobileUser | null;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<MobileSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>('restoring');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionVerification, setSessionVerification] =
    useState<SessionVerificationStatus>('idle');
  const [biometricCapability, setBiometricCapability] =
    useState<BiometricCapability | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [hasCompletedLogin, setHasCompletedLogin] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const verificationGeneration = useRef(0);
  const sessionRef = useRef<MobileSession | null>(null);
  const biometricPromptRef = useRef<Promise<BiometricAuthResult> | null>(null);
  const biometricEnableRef = useRef<Promise<boolean> | null>(null);
  const biometricUnlockRef = useRef<Promise<boolean> | null>(null);

  const setCurrentSession = useCallback((nextSession: MobileSession | null) => {
    sessionRef.current = nextSession;
    setSession(nextSession);
  }, []);

  const authenticateBiometricOnce = useCallback((): Promise<BiometricAuthResult> => {
    const inFlight = biometricPromptRef.current;
    if (inFlight) {
      return inFlight;
    }

    const pending = authenticateWithBiometrics();
    biometricPromptRef.current = pending;
    void pending.then(
      () => {
        if (biometricPromptRef.current === pending) {
          biometricPromptRef.current = null;
        }
      },
      () => {
        if (biometricPromptRef.current === pending) {
          biometricPromptRef.current = null;
        }
      },
    );
    return pending;
  }, []);

  const clearLocalSession = useCallback(
    async (message: string | null): Promise<boolean> => {
      verificationGeneration.current += 1;
      let localClearFailed = false;
      try {
        await clearMobileSession();
      } catch {
        localClearFailed = true;
      }
      setCurrentSession(null);
      setStatus('unauthenticated');
      setSessionVerification('idle');
      setBiometricEnabled(false);
      setErrorMessage(
        localClearFailed
          ? 'CaneGuard could not clear secure session storage. Restart the app before signing in again.'
          : message,
      );
      return !localClearFailed;
    },
    [setCurrentSession],
  );

  const markSessionExpired = useCallback(async () => {
    const token = sessionRef.current?.token;
    await clearLocalSession('Your session expired. Sign in to resume pending uploads.');
    if (token) {
      void logoutMobile(token).catch(() => undefined);
    }
  }, [clearLocalSession]);

  const verifyAndHydrateSession = useCallback(
    async (
      stored: MobileSession,
      isCurrent: () => boolean,
    ): Promise<boolean> => {
      if (!isCurrent()) {
        return false;
      }

      // Hydrate before network verification so safe, unexpired local work can
      // remain available during an outage.
      setHasCompletedLogin(true);
      if (typeof markMobileLoginCompleted === 'function') {
        void markMobileLoginCompleted();
      }
      setCurrentSession(stored);
      setStatus('authenticated');
      setSessionVerification('pending');
      setErrorMessage(null);

      try {
        const user = await verifyMobileSession(stored.token);
        if (!isCurrent()) {
          return false;
        }

        const verified = { ...stored, user };
        setCurrentSession(verified);
        setStatus('authenticated');
        setSessionVerification('verified');
        setErrorMessage(null);
        return true;
      } catch (error: unknown) {
        if (!isCurrent()) {
          return false;
        }
        if (isAuthoritativeSessionRejection(error)) {
          await clearMobileSession().catch(() => undefined);
          if (isCurrent()) {
            setCurrentSession(null);
            setStatus('unauthenticated');
            setSessionVerification('idle');
            setBiometricEnabled(false);
            setErrorMessage(null);
          }
          return false;
        }

        if (isCurrent()) {
          setCurrentSession(stored);
          setStatus('authenticated');
          setSessionVerification('unavailable');
          setErrorMessage(
            'Working offline. CaneGuard will verify your session when the server is available.',
          );
        }
        return true;
      }
    },
    [setCurrentSession],
  );

  useEffect(() => {
    let active = true;
    const generation = verificationGeneration.current;
    const isCurrent = () =>
      active && generation === verificationGeneration.current;

    void (async () => {
      const [configured, loginHistory] = await Promise.all([
        typeof isBiometricUnlockEnabled === 'function'
          ? isBiometricUnlockEnabled()
          : false,
        typeof hasCompletedMobileLogin === 'function'
          ? hasCompletedMobileLogin()
          : false,
      ]);
      if (!isCurrent()) {
        return;
      }
      // Sessions saved by auth-v1 without biometric protection must not survive
      // a process restart. They are removed during cold-start cleanup, but are
      // never read or used to authenticate the app.
      const hadLegacySession =
        typeof clearLegacyMobileSession === 'function'
          ? await clearLegacyMobileSession().catch(() => false)
          : false;
      if (!isCurrent()) {
        return;
      }
      setBiometricEnabled(configured);
      setHasCompletedLogin(configured || loginHistory || hadLegacySession);

      if (!configured) {
        setStatus('unauthenticated');
        setSessionVerification('idle');
        return;
      }

      const unlock = await authenticateBiometricOnce();
      if (!isCurrent()) {
        return;
      }
      if (!unlock.success) {
        if (shouldDisableBiometricUnlock(unlock)) {
          if (typeof disableBiometricUnlock === 'function') {
            await disableBiometricUnlock().catch(() => undefined);
          }
          setBiometricEnabled(false);
        }
        setStatus('unauthenticated');
        setSessionVerification('idle');
        setErrorMessage(unlock.message);
        return;
      }

      const stored = await readProtectedMobileSession();
      if (!isCurrent()) {
        return;
      }
      if (!stored) {
        setStatus('unauthenticated');
        setSessionVerification('idle');
        return;
      }

      await verifyAndHydrateSession(stored, isCurrent);
    })().catch(async (error: unknown) => {
      if (!isCurrent()) {
        return;
      }
      if (isStoredSessionExpiredError(error)) {
        await clearMobileSession().catch(() => undefined);
        setBiometricEnabled(false);
        setCurrentSession(null);
        setStatus('unauthenticated');
        setSessionVerification('idle');
        setErrorMessage('Your session expired. Sign in to resume pending uploads.');
        if (error.token) {
          void logoutMobile(error.token).catch(() => undefined);
        }
        return;
      }
      if (isBiometricSessionError(error)) {
        if (error.code === 'ENROLLMENT_CHANGED') {
          setBiometricEnabled(false);
        }
        setCurrentSession(null);
        setStatus('unauthenticated');
        setSessionVerification('idle');
        setErrorMessage(error.message);
        return;
      }
      setCurrentSession(null);
      setStatus('unauthenticated');
      setSessionVerification('idle');
      setErrorMessage('Secure session storage could not be opened.');
    });

    return () => {
      active = false;
    };
  }, [authenticateBiometricOnce, setCurrentSession, verifyAndHydrateSession]);

  useEffect(() => {
    let active = true;
    void getBiometricCapability().then((capability) => {
      if (active) {
        setBiometricCapability(capability);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const expiresAt = session?.expiresAt;
    if (expiresAt === undefined) {
      return;
    }
    if (expiresAt === null) {
      return;
    }
    const remaining = Date.parse(expiresAt) - Date.now();
    const timer = setTimeout(() => {
      void markSessionExpired();
    }, Number.isFinite(remaining) && remaining > 0 ? remaining : 0);
    return () => clearTimeout(timer);
  }, [markSessionExpired, session?.expiresAt]);

  const login = useCallback(
    async (email: string, password: string) => {
      verificationGeneration.current += 1;
      setErrorMessage(null);
      setSessionVerification('pending');
      try {
        const deviceId = await getOrCreateMobileDeviceId();
        const nextSession = await loginMobile({
          deviceId,
          email,
          password,
          deviceName:
            Device.deviceName?.trim() ||
            Device.modelName?.trim() ||
            'CaneGuard mobile device',
        });
        try {
          if (biometricEnabled) {
            // A password fallback refreshes the protected credential without
            // disabling the user's biometric preference for the next cold open.
            await saveProtectedMobileSession(nextSession);
          } else {
            // Password sessions intentionally remain in memory only. A process
            // restart must return to the login form instead of auto-resuming.
            if (typeof clearLegacyMobileSession === 'function') {
              await clearLegacyMobileSession().catch(() => undefined);
            }
          }
        } catch {
          await clearMobileSession().catch(() => undefined);
          void logoutMobile(nextSession.token).catch(() => undefined);
          throw new MobileAuthError(
            'INVALID_RESPONSE',
            'Secure session storage is unavailable. Sign in was cancelled.',
          );
        }
        if (typeof markMobileLoginCompleted === 'function') {
          await markMobileLoginCompleted().catch(() => undefined);
        }
        setHasCompletedLogin(true);
        setCurrentSession(nextSession);
        setStatus('authenticated');
        setSessionVerification('verified');
        return true;
      } catch (error: unknown) {
        setErrorMessage(
          error instanceof MobileAuthError
            ? error.message
            : error instanceof DeviceIdentityError
              ? 'This installation could not be secured. Try again.'
              : 'CaneGuard could not complete sign in.',
        );
        setCurrentSession(null);
        setStatus('unauthenticated');
        setSessionVerification('idle');
        return false;
      }
    },
    [biometricEnabled, setCurrentSession],
  );

  const unlockWithBiometrics = useCallback((): Promise<boolean> => {
    const inFlight = biometricUnlockRef.current;
    if (inFlight) {
      return inFlight;
    }

    const operation = (async () => {
      verificationGeneration.current += 1;
      const generation = verificationGeneration.current;
      setBiometricLoading(true);
      setErrorMessage(null);
      try {
        if (
          typeof isBiometricUnlockEnabled !== 'function' ||
          !(await isBiometricUnlockEnabled())
        ) {
          setErrorMessage('Biometric unlock is not set up. Sign in with your password.');
          return false;
        }
        const unlock = await authenticateBiometricOnce();
        if (!unlock.success) {
          if (shouldDisableBiometricUnlock(unlock)) {
            if (typeof disableBiometricUnlock === 'function') {
              await disableBiometricUnlock().catch(() => undefined);
            }
            setBiometricEnabled(false);
          }
          setErrorMessage(unlock.message);
          return false;
        }
        const stored = await readProtectedMobileSession();
        if (!stored) {
          setBiometricEnabled(false);
          setErrorMessage('Biometric unlock is unavailable. Sign in with your password.');
          return false;
        }
        setBiometricEnabled(true);
        return await verifyAndHydrateSession(
          stored,
          () => generation === verificationGeneration.current,
        );
      } catch (error: unknown) {
        if (isStoredSessionExpiredError(error)) {
          await clearMobileSession().catch(() => undefined);
          setBiometricEnabled(false);
          setCurrentSession(null);
          setStatus('unauthenticated');
          setSessionVerification('idle');
          setErrorMessage('Your session expired. Sign in to resume pending uploads.');
          if (error.token) {
            void logoutMobile(error.token).catch(() => undefined);
          }
        } else if (isBiometricSessionError(error)) {
          if (error.code === 'ENROLLMENT_CHANGED') {
            setBiometricEnabled(false);
          }
          setErrorMessage(error.message);
        } else {
          setErrorMessage('Biometric unlock is unavailable. Sign in with your password.');
        }
        return false;
      } finally {
        setBiometricLoading(false);
      }
    })();

    biometricUnlockRef.current = operation;
    void operation.then(
      () => {
        if (biometricUnlockRef.current === operation) {
          biometricUnlockRef.current = null;
        }
      },
      () => {
        if (biometricUnlockRef.current === operation) {
          biometricUnlockRef.current = null;
        }
      },
    );
    return operation;
  }, [authenticateBiometricOnce, setCurrentSession, verifyAndHydrateSession]);

  const enableBiometricUnlock = useCallback((): Promise<boolean> => {
    const inFlight = biometricEnableRef.current;
    if (inFlight) {
      return inFlight;
    }

    const operation = (async () => {
      const activeSession = sessionRef.current;
      if (!activeSession) {
        setErrorMessage('Sign in with your password before enabling biometric unlock.');
        return false;
      }
      setBiometricLoading(true);
      setErrorMessage(null);
      try {
        const unlock = await authenticateBiometricOnce();
        if (!unlock.success) {
          setErrorMessage(unlock.message);
          return false;
        }
        await saveProtectedMobileSession(activeSession);
        setBiometricEnabled(true);
        setErrorMessage(null);
        return true;
      } catch {
        setErrorMessage(
          'Biometric unlock could not be enabled. Your password session is still active.',
        );
        return false;
      } finally {
        setBiometricLoading(false);
      }
    })();

    biometricEnableRef.current = operation;
    void operation.then(
      () => {
        if (biometricEnableRef.current === operation) {
          biometricEnableRef.current = null;
        }
      },
      () => {
        if (biometricEnableRef.current === operation) {
          biometricEnableRef.current = null;
        }
      },
    );
    return operation;
  }, [authenticateBiometricOnce]);

  const clearSessionAfterRemoteRevocation = useCallback(
    () => clearLocalSession(null),
    [clearLocalSession],
  );

  const changePassword = useCallback(
    async (input: PasswordChangeInput) => {
      const activeSession = sessionRef.current;
      if (!activeSession) {
        setErrorMessage('Sign in again before changing your password.');
        return false;
      }
      try {
        await changePasswordApi(activeSession.token, input);
        return await clearSessionAfterRemoteRevocation();
      } catch (error: unknown) {
        if (isAuthoritativeSessionRejection(error)) {
          await markSessionExpired();
        } else {
          setErrorMessage(getAuthErrorMessage(error));
        }
        return false;
      }
    },
    [clearSessionAfterRemoteRevocation, markSessionExpired],
  );

  const changeEmail = useCallback(
    async (input: EmailChangeInput) => {
      const activeSession = sessionRef.current;
      if (!activeSession) {
        setErrorMessage('Sign in again before changing your email.');
        return false;
      }
      try {
        await changeEmailApi(activeSession.token, input);
        return await clearSessionAfterRemoteRevocation();
      } catch (error: unknown) {
        if (isAuthoritativeSessionRejection(error)) {
          await markSessionExpired();
        } else {
          setErrorMessage(getAuthErrorMessage(error));
        }
        return false;
      }
    },
    [clearSessionAfterRemoteRevocation, markSessionExpired],
  );

  const disableBiometric = useCallback(
    async (currentPassword: string) => {
      const activeSession = sessionRef.current;
      if (!activeSession) {
        setErrorMessage('Sign in again before disabling biometric unlock.');
        return false;
      }
      try {
        await disableBiometricApi(activeSession.token, currentPassword);
        return await clearSessionAfterRemoteRevocation();
      } catch (error: unknown) {
        if (isAuthoritativeSessionRejection(error)) {
          await markSessionExpired();
        } else {
          setErrorMessage(getAuthErrorMessage(error));
        }
        return false;
      }
    },
    [clearSessionAfterRemoteRevocation, markSessionExpired],
  );

  const enrollMobileDevice = useCallback(
    async (currentPassword: string, deviceName: string) => {
      const activeSession = sessionRef.current;
      if (!activeSession) {
        setErrorMessage('Sign in again before enrolling this installation.');
        return false;
      }
      try {
        const deviceId = await getOrCreateMobileDeviceId();
        const nextSession = await enrollMobileDeviceApi(activeSession.token, {
          currentPassword,
          deviceId,
          deviceName,
        });
        try {
          if (biometricEnabled) {
            await saveProtectedMobileSession(nextSession);
          }
        } catch {
          await clearLocalSession(null);
          void logoutMobile(nextSession.token).catch(() => undefined);
          throw new MobileAuthError(
            'INVALID_RESPONSE',
            'Secure session storage is unavailable. Device enrollment was cancelled.',
          );
        }
        setCurrentSession(nextSession);
        setStatus('authenticated');
        setSessionVerification('verified');
        setErrorMessage(null);
        return true;
      } catch (error: unknown) {
        if (isAuthoritativeSessionRejection(error)) {
          await markSessionExpired();
        } else {
          setErrorMessage(getAuthErrorMessage(error));
        }
        return false;
      }
    },
    [
      biometricEnabled,
      clearLocalSession,
      markSessionExpired,
      setCurrentSession,
    ],
  );

  const logout = useCallback(async () => {
    verificationGeneration.current += 1;
    const token = sessionRef.current?.token;
    let remoteRevocationFailed = false;
    if (token) {
      try {
        await logoutMobile(token);
      } catch {
        remoteRevocationFailed = true;
      }
    }

    let localClearFailed = false;
    try {
      await clearMobileSession();
    } catch {
      localClearFailed = true;
    }
    if (localClearFailed) {
      setCurrentSession(null);
      setStatus('unauthenticated');
      setSessionVerification('idle');
      setBiometricEnabled(false);
      setErrorMessage(
        'CaneGuard could not clear secure session storage. Restart the app and try logout again.',
      );
      return { localClearFailed: true, remoteRevocationFailed };
    }

    setCurrentSession(null);
    setStatus('unauthenticated');
    setSessionVerification('idle');
    setBiometricEnabled(false);
    setErrorMessage(
      remoteRevocationFailed
        ? 'Signed out on this device. The server token could not be revoked and may remain active.'
        : null,
    );
    return { localClearFailed: false, remoteRevocationFailed };
  }, [setCurrentSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      biometricCapability,
      biometricEnabled,
      biometricLoading,
      changeEmail,
      changePassword,
      clearSessionAfterRemoteRevocation,
      disableBiometric,
      enableBiometricUnlock,
      enrollMobileDevice,
      errorMessage,
      hasCompletedLogin,
      login,
      logout,
      markSessionExpired,
      session,
      sessionVerification,
      status,
      unlockWithBiometrics,
      user: session?.user ?? null,
    }),
    [
      biometricCapability,
      biometricEnabled,
      biometricLoading,
      changeEmail,
      changePassword,
      clearSessionAfterRemoteRevocation,
      disableBiometric,
      enableBiometricUnlock,
      enrollMobileDevice,
      errorMessage,
      hasCompletedLogin,
      login,
      logout,
      markSessionExpired,
      session,
      sessionVerification,
      status,
      unlockWithBiometrics,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function shouldDisableBiometricUnlock(unlock: BiometricAuthResult): boolean {
  return (
    !unlock.success &&
    (unlock.code === 'NOT_AVAILABLE' || unlock.code === 'NOT_ENROLLED')
  );
}

function isAuthoritativeSessionRejection(error: unknown): boolean {
  return (
    error instanceof MobileAuthError &&
    (error.code === 'EMAIL_NOT_VERIFIED' ||
      error.code === 'FORBIDDEN_ROLE' ||
      error.code === 'INVALID_CREDENTIALS' ||
      error.code === 'SESSION_EXPIRED')
  );
}

function getAuthErrorMessage(error: unknown): string {
  return error instanceof MobileAuthError
    ? error.message
    : 'CaneGuard could not complete the security change.';
}

function isStoredSessionExpiredError(
  error: unknown,
): error is StoredSessionExpiredError {
  return (
    (typeof StoredSessionExpiredError === 'function' &&
      error instanceof StoredSessionExpiredError) ||
    (isNamedError(error, 'StoredSessionExpiredError') &&
      error.message === 'The cached CaneGuard session expired.')
  );
}

function isBiometricSessionError(error: unknown): error is BiometricSessionError {
  return (
    (typeof BiometricSessionError === 'function' &&
      error instanceof BiometricSessionError) ||
    isNamedError(error, 'BiometricSessionError')
  );
}

function isNamedError(error: unknown, name: string): error is Error {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'name' in error &&
      error.name === name &&
      'message' in error &&
      typeof error.message === 'string',
  );
}
