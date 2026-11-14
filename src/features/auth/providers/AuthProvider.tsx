import * as Device from 'expo-device';
import { AppState } from 'react-native';
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
  LOCAL_SESSION_MAX_AGE_MS,
  MobileAuthError,
  consumeServerTimeSample,
  verifyMobileSession,
} from '@/features/auth/api/mobileAuthApi';
import {
  confirmBeforeProtectedWrite,
  ensureBiometricReady,
  getBiometricCapability,
} from '@/features/auth/services/biometricAuth';
import { checkAccountStep, net } from '@/features/net/reconnectCoordinator';
import { cancelOfficeMediaPrefetch } from '@/features/assignments/services/officeMediaCache';
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
import {
  assessGrant,
  authoringProvenance,
  buildCapabilityGrant,
  deriveSessionState,
  deviceClockNow,
  estimateServerNow,
  REVERIFY_AFTER_MS,
  type AuthoringProvenance,
  type CapabilityGrant,
  type RevocationReason,
  type SessionState,
} from '@/features/auth/domain/sessionState';
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

const MAX_SESSION_TIMER_DELAY_MS = 2_147_000_000;

interface AuthContextValue {
  biometricCapability: BiometricCapability | null;
  biometricEnabled: boolean;
  biometricLoading: boolean;
  changeEmail: (input: EmailChangeInput) => Promise<boolean>;
  changePassword: (input: PasswordChangeInput) => Promise<boolean>;
  clearSessionAfterRemoteRevocation: () => Promise<boolean>;
  /**
   * The authoring bound, checked at the moment a record is finished: the
   * provenance to freeze onto it, or null when the session may not author now.
   */
  getAuthoringProvenance: () => AuthoringProvenance | null;
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
  isSessionCurrent: (token: string, ownerIdentity: string) => boolean;
  markSessionExpired: (expectedToken?: string) => Promise<void>;
  /**
   * An upload came back CAPABILITY_REVOKED: carried capabilities drop at once,
   * the session and the unsent records stay, and /me is asked again.
   */
  reportCapabilityRevoked: () => Promise<void>;
  /** Re-attempts a pending /me verification; resolves with the verification status afterwards. */
  retrySessionVerification: (
    options?: { reason?: 'stale' | 'revoked' },
  ) => Promise<SessionVerificationStatus>;
  session: MobileSession | null;
  /** NET-3: the one session union; read this, not status plus sessionVerification. */
  sessionState: SessionState;
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
  const [revocation, setRevocation] = useState<RevocationReason | null>(null);
  const [liveVerifiedAt, setLiveVerifiedAt] = useState<string | null>(null);
  // Bumped when the window may have closed, so the derived state is recomputed.
  const [clockTick, setClockTick] = useState(0);
  const verificationGeneration = useRef(0);
  const sessionRef = useRef<MobileSession | null>(null);
  const statusRef = useRef<AuthStatus>('restoring');
  const revocationRef = useRef<RevocationReason | null>(null);
  const liveVerifiedAtRef = useRef<string | null>(null);
  const sessionVerificationRef = useRef<SessionVerificationStatus>('idle');
  const verificationRetryRef = useRef<Promise<SessionVerificationStatus> | null>(null);
  const lastVerificationRetryAt = useRef(0);

  useEffect(() => {
    sessionVerificationRef.current = sessionVerification;
  }, [sessionVerification]);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(() => {
    revocationRef.current = revocation;
  }, [revocation]);
  useEffect(() => {
    liveVerifiedAtRef.current = liveVerifiedAt;
  }, [liveVerifiedAt]);
  const biometricPromptRef = useRef<Promise<BiometricAuthResult> | null>(null);
  const biometricEnableRef = useRef<Promise<boolean> | null>(null);
  const biometricUnlockRef = useRef<Promise<boolean> | null>(null);

  const setCurrentSession = useCallback((nextSession: MobileSession | null) => {
    const normalizedSession =
      nextSession && nextSession.expiresAt === null
        ? {
            ...nextSession,
            expiresAt: new Date(Date.now() + LOCAL_SESSION_MAX_AGE_MS).toISOString(),
          }
        : nextSession;
    sessionRef.current = normalizedSession;
    setSession(normalizedSession);
    if (normalizedSession === null) {
      liveVerifiedAtRef.current = null;
      setLiveVerifiedAt(null);
    }
  }, []);

  /**
   * A /me success: the server's list replaces everything, a new dated grant is
   * built from it, and any revocation notice is cleared. The grant lives on the
   * session object, so it is only persisted where the session already is.
   */
  const recordVerified = useCallback(
    (base: MobileSession, user: MobileUser, serverNowMs: number | null): MobileSession => {
      const deviceNow = Date.now();
      const grant = buildCapabilityGrant({
        capabilities: user.capabilities ?? [],
        deviceId: base.deviceId ?? null,
        deviceNow,
        serverNow: serverNowMs,
        sessionExpiresAt: base.expiresAt,
        userUuid: user.uuid,
      });
      const verifiedAt =
        grant?.verifiedAt ??
        new Date(deviceNow + (serverNowMs === null ? 0 : serverNowMs - deviceNow)).toISOString();
      liveVerifiedAtRef.current = verifiedAt;
      setLiveVerifiedAt(verifiedAt);
      revocationRef.current = null;
      setRevocation(null);
      const { capabilityGrant: _previous, ...rest } = base;
      void _previous;
      return grant ? { ...rest, capabilityGrant: grant, user } : { ...rest, user };
    },
    [],
  );

  const readyBiometricOnce = useCallback((): Promise<BiometricAuthResult> => {
    const inFlight = biometricPromptRef.current;
    if (inFlight) {
      return inFlight;
    }

    const pending = ensureBiometricReady();
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

  /** Ends the session for pending work now, before any await, so nothing lands after sign-out starts. */
  const endPendingSessionWork = useCallback((active: MobileSession | null) => {
    if (!active) return;
    sessionRef.current = null;
    try {
      cancelOfficeMediaPrefetch(active.user.uuid);
    } catch {
      // An unusable owner identity has no prefetch to cancel.
    }
  }, []);

  const clearLocalSession = useCallback(
    async (message: string | null): Promise<boolean> => {
      verificationGeneration.current += 1;
      endPendingSessionWork(sessionRef.current);
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
    [endPendingSessionWork, setCurrentSession],
  );

  const isSessionCurrent = useCallback((token: string, ownerIdentity: string) => {
    const activeSession = sessionRef.current;
    return activeSession?.token === token && activeSession.user.uuid === ownerIdentity;
  }, []);

  const markSessionExpired = useCallback(async (expectedToken?: string) => {
    const token = sessionRef.current?.token;
    if (expectedToken !== undefined && token !== expectedToken) return;
    await clearLocalSession('Your session expired. Sign in to resume pending uploads.');
    if (token) {
      void logoutMobile(token).catch(() => undefined);
    }
  }, [clearLocalSession]);

  /**
   * Only /me grants capabilities. A token response cannot, so an unverified
   * acceptance keeps the session with an empty capability list (fail-closed)
   * and leaves it pending re-verification.
   */
  const acceptTokenSession = useCallback(
    async (
      tokenSession: MobileSession,
    ): Promise<{ session: MobileSession; verified: boolean }> => {
      try {
        const user = await verifyMobileSession(tokenSession.token);
        return {
          session: recordVerified(tokenSession, user, readServerTimeSample()),
          verified: true,
        };
      } catch (error: unknown) {
        if (isAuthoritativeSessionRejection(error)) {
          throw error;
        }
        return { session: unverifiedSession(tokenSession), verified: false };
      }
    },
    [recordVerified],
  );

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
      setCurrentSession(unverifiedSession(stored));
      setStatus('authenticated');
      setSessionVerification('pending');
      setErrorMessage(null);

      try {
        const user = await verifyMobileSession(stored.token);
        const serverNowMs = readServerTimeSample();
        if (!isCurrent()) {
          return false;
        }

        const verified = recordVerified(stored, user, serverNowMs);
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
            revocationRef.current = 'session-rejected';
            setRevocation('session-rejected');
          }
          return false;
        }

        if (isCurrent()) {
          // /me could not be reached: only a dated, owner-matching, unexpired
          // grant may stand in for it (Q3: `pending` above stayed fail-closed).
          setCurrentSession(carriedOverSession(stored, Date.now()));
          setStatus('authenticated');
          setSessionVerification('unavailable');
          setErrorMessage(
            'Working offline. CaneGuard will verify your session when the server is available.',
          );
        }
        return true;
      }
    },
    [recordVerified, setCurrentSession],
  );

  /**
   * Retries a pending session verification after a transient failure (M10).
   * It runs only while the current session is still the one that failed, never
   * prompts for biometrics, and coalesces overlapping foreground/network
   * events so reconnecting cannot start a request loop.
   */
  const retrySessionVerification = useCallback(async (
    options: { reason?: 'stale' | 'revoked' } = {},
  ): Promise<SessionVerificationStatus> => {
    const activeSession = sessionRef.current;
    // A warm verified session is re-verified only when it has gone stale or an
    // upload said access was revoked; otherwise only `unavailable` retries.
    const allowVerified = options.reason !== undefined;
    if (
      !activeSession ||
      (sessionVerificationRef.current !== 'unavailable' &&
        !(allowVerified && sessionVerificationRef.current === 'verified'))
    ) {
      return sessionVerificationRef.current;
    }
    if (verificationRetryRef.current) {
      return verificationRetryRef.current;
    }
    const now = Date.now();
    if (options.reason !== 'revoked' && now - lastVerificationRetryAt.current < 10_000) {
      return sessionVerificationRef.current;
    }
    lastVerificationRetryAt.current = now;

    const generation = verificationGeneration.current;
    const isCurrent = () =>
      generation === verificationGeneration.current &&
      sessionRef.current?.token === activeSession.token &&
      sessionRef.current?.user.uuid === activeSession.user.uuid;

    // `holder` lets the operation's own `finally` compare identities without
    // reading the `operation` binding during its own initializer.
    const holder: { current: Promise<SessionVerificationStatus> | null } = { current: null };
    const operation = (async (): Promise<SessionVerificationStatus> => {
      try {
        const user = await verifyMobileSession(activeSession.token);
        const serverNowMs = readServerTimeSample();
        if (!isCurrent()) {
          return sessionVerificationRef.current;
        }
        setCurrentSession(recordVerified(activeSession, user, serverNowMs));
        sessionVerificationRef.current = 'verified';
        setSessionVerification('verified');
        setErrorMessage(null);
        return 'verified';
      } catch (error: unknown) {
        if (!isCurrent()) {
          return sessionVerificationRef.current;
        }
        if (isAuthoritativeSessionRejection(error)) {
          await clearMobileSession().catch(() => undefined);
          if (isCurrent()) {
            setCurrentSession(null);
            sessionVerificationRef.current = 'idle';
            setStatus('unauthenticated');
            setSessionVerification('idle');
            setBiometricEnabled(false);
            setErrorMessage('Your session expired. Sign in to resume pending uploads.');
            revocationRef.current = 'session-rejected';
            setRevocation('session-rejected');
          }
          return 'idle';
        }
        // Still offline or the office is still unavailable: keep the honest
        // "working offline" state without prompting for biometrics. A revoked
        // session keeps its empty list: its grant was dropped when it was reported.
        setCurrentSession(carriedOverSession(sessionRef.current ?? activeSession, Date.now()));
        sessionVerificationRef.current = 'unavailable';
        setSessionVerification('unavailable');
        return 'unavailable';
      } finally {
        if (verificationRetryRef.current === holder.current) {
          verificationRetryRef.current = null;
        }
      }
    })();

    holder.current = operation;
    verificationRetryRef.current = operation;
    return operation;
  }, [recordVerified, setCurrentSession]);

  useEffect(() => {
    if (status !== 'authenticated') {
      return undefined;
    }
    // Check account is one step of the coordinator's reconnect order; the
    // coordinator owns the network and foreground listeners.
    const release = net.acquire();
    const unregister = net.registerCheckAccount(() =>
      checkAccountStep(sessionVerificationRef.current, retrySessionVerification),
    );
    return () => {
      unregister();
      release();
    };
  }, [retrySessionVerification, status]);

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

      const unlock = await readyBiometricOnce();
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
  }, [readyBiometricOnce, setCurrentSession, verifyAndHydrateSession]);

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
    if (expiresAt === undefined || expiresAt === null) {
      return;
    }
    let timer: ReturnType<typeof setTimeout> | null = null;
    const scheduleExpiryCheck = () => {
      const remaining = Date.parse(expiresAt) - Date.now();
      if (!Number.isFinite(remaining) || remaining <= 0) {
        void markSessionExpired();
        return;
      }
      timer = setTimeout(() => {
        if (Date.parse(expiresAt) > Date.now()) {
          scheduleExpiryCheck();
        } else {
          void markSessionExpired();
        }
      }, Math.min(remaining, MAX_SESSION_TIMER_DELAY_MS));
    };
    scheduleExpiryCheck();
    return () => {
      if (timer !== null) {
        clearTimeout(timer);
      }
    };
  }, [markSessionExpired, session?.expiresAt]);

  const login = useCallback(
    async (email: string, password: string) => {
      verificationGeneration.current += 1;
      revocationRef.current = null;
      setRevocation(null);
      setErrorMessage(null);
      setSessionVerification('pending');
      let issuedSession: MobileSession | null = null;
      try {
        const deviceId = await getOrCreateMobileDeviceId();
        issuedSession = await loginMobile({
          deviceId,
          email,
          password,
          deviceName:
            Device.deviceName?.trim() ||
            Device.modelName?.trim() ||
            'CaneGuard mobile device',
        });
        const acceptance = await acceptTokenSession(issuedSession);
        const nextSession = acceptance.session;
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
        setSessionVerification(acceptance.verified ? 'verified' : 'unavailable');
        return true;
      } catch (error: unknown) {
        if (issuedSession && isAuthoritativeSessionRejection(error)) {
          void logoutMobile(issuedSession.token).catch(() => undefined);
        }
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
    [acceptTokenSession, biometricEnabled, setCurrentSession],
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
        const unlock = await readyBiometricOnce();
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
  }, [readyBiometricOnce, setCurrentSession, verifyAndHydrateSession]);

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
        const unlock = await confirmBeforeProtectedWrite();
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
  }, []);

  const clearSessionAfterRemoteRevocation = useCallback(
    () => clearLocalSession(null),
    [clearLocalSession],
  );

  const changePassword = useCallback(
    async (input: PasswordChangeInput) => {
      // Each account action starts clean so a stale message from another
      // action cannot be shown as this action's result.
      setErrorMessage(null);
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
      // Each account action starts clean so a stale message from another
      // action cannot be shown as this action's result.
      setErrorMessage(null);
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
      // Each account action starts clean so a stale message from another
      // action cannot be shown as this action's result.
      setErrorMessage(null);
      const activeSession = sessionRef.current;
      if (!activeSession) {
        setErrorMessage('Sign in again before disabling biometric unlock.');
        return false;
      }
      try {
        await disableBiometricApi(activeSession.token, currentPassword);
        let remoteRevocationFailed = false;
        try {
          // Disabling biometrics removes the retained credential, so revoke the
          // server token that would otherwise remain usable until its expiry.
          await logoutMobile(activeSession.token);
        } catch {
          remoteRevocationFailed = true;
        }
        const cleared = await clearSessionAfterRemoteRevocation();
        if (remoteRevocationFailed && cleared) {
          setErrorMessage(
            'Biometric unlock was disabled on this device, but the server token could not be revoked.',
          );
        }
        return cleared;
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
      // Each account action starts clean so a stale message from another
      // action cannot be shown as this action's result.
      setErrorMessage(null);
      const activeSession = sessionRef.current;
      if (!activeSession) {
        setErrorMessage('Sign in again before enrolling this installation.');
        return false;
      }
      try {
        const deviceId = await getOrCreateMobileDeviceId();
        const enrolledSession = await enrollMobileDeviceApi(activeSession.token, {
          currentPassword,
          deviceId,
          deviceName,
        });
        const acceptance = await acceptTokenSession(enrolledSession);
        const nextSession = acceptance.session;
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
        setSessionVerification(acceptance.verified ? 'verified' : 'unavailable');
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
      acceptTokenSession,
      biometricEnabled,
      clearLocalSession,
      markSessionExpired,
      setCurrentSession,
    ],
  );

  const logout = useCallback(async () => {
    verificationGeneration.current += 1;
    revocationRef.current = null;
    setRevocation(null);
    // Logout is always terminal for this installation: revoke the current
    // bearer token where possible and remove both password and biometric
    // credentials. A separate lock/unlock flow can be added later without
    // changing the meaning of logout.
    const token = sessionRef.current?.token;
    endPendingSessionWork(sessionRef.current);
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
  }, [endPendingSessionWork, setCurrentSession]);

  const sessionState = useMemo<SessionState>(
    () => {
      // `clockTick` has no value of its own; it only forces this recompute
      // when the window may have closed since the last render.
      void clockTick;
      return computeSessionState(
        status,
        sessionVerification,
        session,
        revocation,
        liveVerifiedAt,
        deviceClockNow(),
      );
    },
    [clockTick, liveVerifiedAt, revocation, session, sessionVerification, status],
  );

  const getAuthoringProvenance = useCallback((): AuthoringProvenance | null => {
    const current = sessionRef.current;
    if (!current) return null;
    return authoringProvenance(
      computeSessionState(
        statusRef.current,
        sessionVerificationRef.current,
        current,
        revocationRef.current,
        liveVerifiedAtRef.current,
        Date.now(),
      ),
    );
  }, []);

  /** Drops capabilities that the window no longer covers, then re-derives the state. */
  const enforceCapabilityWindow = useCallback(() => {
    const current = sessionRef.current;
    if (current) {
      const state = computeSessionState(
        statusRef.current,
        sessionVerificationRef.current,
        current,
        revocationRef.current,
        liveVerifiedAtRef.current,
        Date.now(),
      );
      if (state.kind === 'expired' && (current.user.capabilities?.length ?? 0) > 0) {
        setCurrentSession(unverifiedSession(current));
      }
    }
    setClockTick((tick) => tick + 1);
  }, [setCurrentSession]);

  useEffect(() => {
    if (status !== 'authenticated') {
      return undefined;
    }
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer !== null) clearTimeout(timer);
      timer = null;
      const grant = sessionRef.current?.capabilityGrant;
      if (!grant) return;
      const remaining =
        Date.parse(grant.validUntil) - estimateServerNow(Date.now(), grant);
      // A window that has already closed needs no timer: restore and the next
      // foreground apply it, and re-arming at zero delay would spin.
      if (!Number.isFinite(remaining) || remaining <= 0) return;
      timer = setTimeout(
        () => {
          enforceCapabilityWindow();
          schedule();
        },
        Math.min(remaining, MAX_SESSION_TIMER_DELAY_MS),
      );
    };
    schedule();
    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      enforceCapabilityWindow();
      schedule();
      // A warm session is never trusted longer than the foreground re-verify
      // interval: ask /me again, silently, once it has gone stale.
      const verifiedAt = liveVerifiedAtRef.current;
      if (
        sessionVerificationRef.current === 'verified' &&
        verifiedAt !== null &&
        estimateServerNow(Date.now(), sessionRef.current?.capabilityGrant ?? null) -
          Date.parse(verifiedAt) >
          REVERIFY_AFTER_MS
      ) {
        void retrySessionVerification({ reason: 'stale' });
      }
    });
    return () => {
      if (timer !== null) clearTimeout(timer);
      subscription.remove();
    };
  }, [enforceCapabilityWindow, retrySessionVerification, session?.capabilityGrant, status]);

  const reportCapabilityRevoked = useCallback(async (): Promise<void> => {
    const current = sessionRef.current;
    if (!current || statusRef.current !== 'authenticated') return;
    // Carried capabilities and the grant that would revive them are dropped now;
    // the session, the unsent records and their evidence stay where they are.
    const { capabilityGrant: _dropped, ...rest } = current;
    void _dropped;
    const next: MobileSession = { ...rest, user: { ...rest.user, capabilities: [] } };
    revocationRef.current = 'capability-revoked';
    setRevocation('capability-revoked');
    setCurrentSession(next);
    // Best effort: without this a restart that cannot reach /me would revive
    // the old grant from the protected entry.
    try {
      await saveProtectedMobileSession(next);
    } catch {
      // The in-memory drop already holds; the next successful /me replaces the grant.
    }
    await retrySessionVerification({ reason: 'revoked' });
  }, [retrySessionVerification, setCurrentSession]);

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
      getAuthoringProvenance,
      hasCompletedLogin,
      isSessionCurrent,
      login,
      logout,
      markSessionExpired,
      reportCapabilityRevoked,
      retrySessionVerification,
      session,
      sessionState,
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
      getAuthoringProvenance,
      hasCompletedLogin,
      isSessionCurrent,
      login,
      logout,
      markSessionExpired,
      reportCapabilityRevoked,
      retrySessionVerification,
      session,
      sessionState,
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

/** Tolerates test doubles of the auth API that do not model the server clock. */
function readServerTimeSample(): number | null {
  return typeof consumeServerTimeSample === 'function' ? consumeServerTimeSample() : null;
}

function computeSessionState(
  status: AuthStatus,
  verification: SessionVerificationStatus,
  session: MobileSession | null,
  revocation: RevocationReason | null,
  liveVerifiedAt: string | null,
  deviceNow: number,
): SessionState {
  const grant: CapabilityGrant | null = session?.capabilityGrant ?? null;
  return deriveSessionState({
    assessment: assessGrant(
      grant,
      { deviceId: session?.deviceId ?? null, userUuid: session?.user.uuid ?? '' },
      deviceNow,
    ),
    liveVerifiedAt,
    revocation,
    status,
    verification,
  });
}

/**
 * The session as it stands while /me cannot be reached: the grant's
 * capabilities when it is well-formed, owner-matching and inside its window,
 * otherwise none. The undated `user.capabilities` is never used here.
 */
function carriedOverSession(session: MobileSession, deviceNow: number): MobileSession {
  const assessment = assessGrant(
    session.capabilityGrant ?? null,
    { deviceId: session.deviceId ?? null, userUuid: session.user.uuid },
    deviceNow,
  );
  return {
    ...session,
    user: { ...session.user, capabilities: assessment.ok ? [...assessment.capabilities] : [] },
  };
}

function unverifiedSession(session: MobileSession): MobileSession {
  return {
    ...session,
    user: { ...session.user, capabilities: [] },
  };
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
