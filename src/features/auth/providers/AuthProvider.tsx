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
  clearAppPin,
  hasAppPinConfigured,
  saveAppPin,
  verifyAppPin,
} from '@/features/auth/services/appPinAuth';
import {
  authenticateWithDeviceCredential,
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
  getLocalLockMode,
  hasCompletedMobileLogin,
  hasPersistedMobileSession,
  isBiometricUnlockEnabled,
  markMobileLoginCompleted,
  readPersistedMobileSession,
  readProtectedMobileSession,
  savePersistedMobileSession,
  saveProtectedMobileSession,
  StoredSessionExpiredError,
  type PersistedSessionResult,
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
  LocalLockMode,
  MobileSession,
  MobileUser,
  PasswordChangeInput,
  SessionVerificationStatus,
} from '@/features/auth/types';

const MAX_SESSION_TIMER_DELAY_MS = 2_147_000_000;

interface AuthContextValue {
  appPinConfigured: boolean;
  biometricCapability: BiometricCapability | null;
  biometricEnabled: boolean;
  biometricLoading: boolean;
  changeEmail: (input: EmailChangeInput) => Promise<boolean>;
  changePassword: (input: PasswordChangeInput) => Promise<boolean>;
  clearSessionAfterRemoteRevocation: () => Promise<boolean>;
  dismissInitialPinSetup: () => void;
  /**
   * The authoring bound, checked at the moment a record is finished: the
   * provenance to freeze onto it, or null when the session may not author now.
   */
  getAuthoringProvenance: () => AuthoringProvenance | null;
  disableBiometric: (currentPassword: string) => Promise<boolean>;
  /** Turns off local App Lock (device or Quick PIN) without logging out. */
  disableLocalLock: () => Promise<boolean>;
  enableBiometricUnlock: () => Promise<boolean>;
  enrollMobileDevice: (currentPassword: string, deviceName: string) => Promise<boolean>;
  errorMessage: string | null;
  /** True when a farmer resumed past 30-day token expiry in personal-scan grace mode. */
  farmerOfflineGrace: boolean;
  hasCompletedLogin: boolean;
  /** True when the active session is persisted in SecureStore for offline restarts. */
  hasPersistedSession: boolean;
  localLockMode: LocalLockMode;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<{
    localClearFailed: boolean;
    remoteRevocationFailed: boolean;
  }>;
  isSessionCurrent: (token: string, ownerIdentity: string) => boolean;
  markSessionExpired: (expectedToken?: string) => Promise<void>;
  /**
   * True right after an inspector signs in on a phone with no OS screen lock
   * and no CaneGuard Quick PIN set yet (Option C one-step Quick PIN prompt).
   */
  needsInitialPinSetup: boolean;
  /**
   * An upload came back CAPABILITY_REVOKED: carried capabilities drop at once,
   * the session and the unsent records stay, and /me is asked again.
   */
  reportCapabilityRevoked: () => Promise<void>;
  /** True on cold start when a persisted session is gated by CaneGuard Quick PIN. */
  requiresAppPinUnlock: boolean;
  /** Re-attempts a pending /me verification; resolves with the verification status afterwards. */
  retrySessionVerification: (
    options?: { reason?: 'stale' | 'revoked' },
  ) => Promise<SessionVerificationStatus>;
  session: MobileSession | null;
  /** NET-3: the one session union; read this, not status plus sessionVerification. */
  sessionState: SessionState;
  sessionVerification: SessionVerificationStatus;
  setupAppPin: (pin: string) => Promise<boolean>;
  status: AuthStatus;
  unlockWithAppPin: (pin: string) => Promise<boolean>;
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
  const [localLockMode, setLocalLockMode] = useState<LocalLockMode>('none');
  const [appPinConfigured, setAppPinConfigured] = useState(false);
  const [hasPersistedSession, setHasPersistedSession] = useState(false);
  const [requiresAppPinUnlock, setRequiresAppPinUnlock] = useState(false);
  const [needsInitialPinSetup, setNeedsInitialPinSetup] = useState(false);
  const [farmerOfflineGrace, setFarmerOfflineGrace] = useState(false);
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
  const localLockModeRef = useRef<LocalLockMode>('none');
  const hasPersistedSessionRef = useRef(false);
  const farmerOfflineGraceRef = useRef(false);
  const biometricCapabilityRef = useRef<BiometricCapability | null>(null);
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
  useEffect(() => {
    localLockModeRef.current = localLockMode;
  }, [localLockMode]);
  useEffect(() => {
    hasPersistedSessionRef.current = hasPersistedSession;
  }, [hasPersistedSession]);
  useEffect(() => {
    farmerOfflineGraceRef.current = farmerOfflineGrace;
  }, [farmerOfflineGrace]);
  useEffect(() => {
    biometricCapabilityRef.current = biometricCapability;
  }, [biometricCapability]);

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
   * Persist session through the decoupled store, falling back to legacy mock
   * exports when older unit tests mock only `saveProtectedMobileSession`.
   */
  const persistSession = useCallback(
    async (nextSession: MobileSession, mode: LocalLockMode): Promise<void> => {
      if (typeof savePersistedMobileSession === 'function') {
        await savePersistedMobileSession(nextSession, mode);
        return;
      }
      if (typeof saveProtectedMobileSession === 'function') {
        await saveProtectedMobileSession(nextSession);
      }
    },
    [],
  );

  /**
   * Silently refreshes the persisted session (e.g. with a newer 72h grant from
   * /me) only when writing will never trigger an unexpected OS biometric prompt.
   */
  const refreshPersistedSessionSilently = useCallback(
    async (verifiedSession: MobileSession): Promise<void> => {
      if (!hasPersistedSessionRef.current) return;
      const mode = localLockModeRef.current;
      const cap = biometricCapabilityRef.current;
      if (mode === 'device' && cap && !cap.deviceCredentialAvailable) {
        return;
      }
      try {
        await persistSession(verifiedSession, mode);
      } catch {
        // Best-effort refresh: the live verified session remains active in memory.
      }
    },
    [persistSession],
  );

  const readPersisted = useCallback(
    async (
      options: { skipDevicePrompt?: boolean } = {},
    ): Promise<PersistedSessionResult | null> => {
      if (typeof readPersistedMobileSession === 'function') {
        return readPersistedMobileSession(options);
      }
      if (typeof readProtectedMobileSession === 'function') {
        const legacy = await readProtectedMobileSession();
        return legacy ? { farmerOfflineGrace: false, session: legacy } : null;
      }
      return null;
    },
    [],
  );

  const readStartupPersistence = useCallback(async (): Promise<{
    persisted: boolean;
    lockMode: LocalLockMode;
  }> => {
    if (
      typeof hasPersistedMobileSession === 'function' &&
      typeof getLocalLockMode === 'function'
    ) {
      const [persisted, lockMode] = await Promise.all([
        hasPersistedMobileSession(),
        getLocalLockMode(),
      ]);
      return { persisted, lockMode };
    }
    if (typeof isBiometricUnlockEnabled === 'function') {
      const enabled = await isBiometricUnlockEnabled();
      return { persisted: enabled, lockMode: enabled ? 'device' : 'none' };
    }
    return { persisted: false, lockMode: 'none' };
  }, []);

  const readLockMode = useCallback(async (): Promise<LocalLockMode> => {
    if (typeof getLocalLockMode === 'function') {
      return getLocalLockMode();
    }
    if (typeof isBiometricUnlockEnabled === 'function') {
      return (await isBiometricUnlockEnabled()) ? 'device' : 'none';
    }
    return 'none';
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
      setLocalLockMode('none');
      setAppPinConfigured(false);
      setHasPersistedSession(false);
      setRequiresAppPinUnlock(false);
      setNeedsInitialPinSetup(false);
      setFarmerOfflineGrace(false);
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
    const active = sessionRef.current;
    const token = active?.token;
    if (expectedToken !== undefined && token !== expectedToken) return;
    // Farmers keep offline personal-scan grace access when their 30-day token
    // expires so local scans and on-device AI checks are never cut off offline.
    if (active?.user.role === 'farmer') {
      const { capabilityGrant: _dropped, ...rest } = active;
      void _dropped;
      setFarmerOfflineGrace(true);
      setCurrentSession({
        ...rest,
        token: '',
        user: { ...active.user, capabilities: [] },
      });
      setSessionVerification('unavailable');
      setErrorMessage(null);
      if (token) {
        void logoutMobile(token).catch(() => undefined);
      }
      return;
    }
    await clearLocalSession('Your session expired. Sign in to resume pending uploads.');
    if (token) {
      void logoutMobile(token).catch(() => undefined);
    }
  }, [clearLocalSession, setCurrentSession]);

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

  const hydrateFarmerGraceSession = useCallback(
    (stored: MobileSession) => {
      setHasCompletedLogin(true);
      setHasPersistedSession(true);
      setFarmerOfflineGrace(true);
      setRequiresAppPinUnlock(false);
      if (typeof markMobileLoginCompleted === 'function') {
        void markMobileLoginCompleted();
      }
      setCurrentSession(unverifiedSession({ ...stored, token: '' }));
      setStatus('authenticated');
      setSessionVerification('unavailable');
      setErrorMessage(null);
    },
    [setCurrentSession],
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
      setHasPersistedSession(true);
      setFarmerOfflineGrace(false);
      setRequiresAppPinUnlock(false);
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
        void refreshPersistedSessionSilently(verified);
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
            setLocalLockMode('none');
            setAppPinConfigured(false);
            setHasPersistedSession(false);
            setRequiresAppPinUnlock(false);
            setFarmerOfflineGrace(false);
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
    [recordVerified, refreshPersistedSessionSilently, setCurrentSession],
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
    // Farmers in offline personal-scan grace mode have no active server token.
    if (farmerOfflineGraceRef.current || !activeSession?.token) {
      return sessionVerificationRef.current;
    }
    // A warm verified session is re-verified only when it has gone stale or an
    // upload said access was revoked; otherwise only `unavailable` retries.
    const allowVerified = options.reason !== undefined;
    if (
      sessionVerificationRef.current !== 'unavailable' &&
      !(allowVerified && sessionVerificationRef.current === 'verified')
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

    const holder: { current: Promise<SessionVerificationStatus> | null } = { current: null };
    const operation = (async (): Promise<SessionVerificationStatus> => {
      try {
        const user = await verifyMobileSession(activeSession.token);
        const serverNowMs = readServerTimeSample();
        if (!isCurrent()) {
          return sessionVerificationRef.current;
        }
        const verified = recordVerified(activeSession, user, serverNowMs);
        setCurrentSession(verified);
        sessionVerificationRef.current = 'verified';
        setSessionVerification('verified');
        setErrorMessage(null);
        void refreshPersistedSessionSilently(verified);
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
            setLocalLockMode('none');
            setAppPinConfigured(false);
            setHasPersistedSession(false);
            setRequiresAppPinUnlock(false);
            setFarmerOfflineGrace(false);
            setErrorMessage('Your session expired. Sign in to resume pending uploads.');
            revocationRef.current = 'session-rejected';
            setRevocation('session-rejected');
          }
          return 'idle';
        }
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
  }, [recordVerified, refreshPersistedSessionSilently, setCurrentSession]);

  useEffect(() => {
    if (status !== 'authenticated') {
      return undefined;
    }
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
      const [{ persisted, lockMode }, loginHistory, pinConfigured] = await Promise.all([
        readStartupPersistence(),
        typeof hasCompletedMobileLogin === 'function'
          ? hasCompletedMobileLogin()
          : false,
        typeof hasAppPinConfigured === 'function'
          ? hasAppPinConfigured().catch(() => false)
          : false,
      ]);
      if (!isCurrent()) {
        return;
      }
      const hadLegacySession =
        typeof clearLegacyMobileSession === 'function'
          ? await clearLegacyMobileSession().catch(() => false)
          : false;
      if (!isCurrent()) {
        return;
      }

      const effectiveLockMode: LocalLockMode = persisted ? lockMode : 'none';
      setHasPersistedSession(persisted);
      setLocalLockMode(effectiveLockMode);
      setBiometricEnabled(effectiveLockMode === 'device');
      setAppPinConfigured(pinConfigured);
      setHasCompletedLogin(persisted || loginHistory || hadLegacySession);

      if (!persisted) {
        setStatus('unauthenticated');
        setSessionVerification('idle');
        return;
      }

      // Quick PIN gate: wait for user to enter their 4-digit PIN on LoginScreen.
      if (effectiveLockMode === 'app-pin') {
        if (!pinConfigured) {
          setLocalLockMode('none');
          setHasPersistedSession(false);
          setStatus('unauthenticated');
          setSessionVerification('idle');
          return;
        }
        setRequiresAppPinUnlock(true);
        setStatus('unauthenticated');
        setSessionVerification('idle');
        return;
      }

      // OS biometric or device PIN gate.
      if (effectiveLockMode === 'device') {
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
            setLocalLockMode('none');
            setHasPersistedSession(false);
          }
          setStatus('unauthenticated');
          setSessionVerification('idle');
          setErrorMessage(unlock.message);
          return;
        }

        const storedResult = await readPersisted();
        if (!isCurrent()) {
          return;
        }
        if (!storedResult) {
          setStatus('unauthenticated');
          setSessionVerification('idle');
          return;
        }
        if (storedResult.farmerOfflineGrace) {
          hydrateFarmerGraceSession(storedResult.session);
          return;
        }
        await verifyAndHydrateSession(storedResult.session, isCurrent);
        return;
      }

      // Seamless persistence (`lockMode === 'none'`): resume directly offline.
      const storedResult = await readPersisted({ skipDevicePrompt: true });
      if (!isCurrent()) {
        return;
      }
      if (!storedResult) {
        setHasPersistedSession(false);
        setStatus('unauthenticated');
        setSessionVerification('idle');
        return;
      }
      if (storedResult.farmerOfflineGrace) {
        hydrateFarmerGraceSession(storedResult.session);
        return;
      }
      await verifyAndHydrateSession(storedResult.session, isCurrent);
    })().catch(async (error: unknown) => {
      if (!isCurrent()) {
        return;
      }
      if (isStoredSessionExpiredError(error)) {
        await clearMobileSession().catch(() => undefined);
        setBiometricEnabled(false);
        setLocalLockMode('none');
        setAppPinConfigured(false);
        setHasPersistedSession(false);
        setRequiresAppPinUnlock(false);
        setFarmerOfflineGrace(false);
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
          setLocalLockMode('none');
          setHasPersistedSession(false);
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
  }, [
    hydrateFarmerGraceSession,
    readPersisted,
    readStartupPersistence,
    readyBiometricOnce,
    setCurrentSession,
    verifyAndHydrateSession,
  ]);

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
    if (expiresAt === undefined || expiresAt === null || farmerOfflineGrace) {
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
  }, [farmerOfflineGrace, markSessionExpired, session?.expiresAt]);

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

        // Option C (Role-Aware auto-persistence):
        // - Always persist in SecureStore on sign-in so offline restarts work
        //   with zero setup steps and no biometric requirement.
        // - Farmers default to seamless resume ('none') unless they already
        //   chose an App Lock.
        // - Inspectors auto-enable OS device lock ('device') when the phone
        //   has a screen lock/biometric; on no-lock phones without a Quick PIN,
        //   persist immediately and trigger the one-step 4-digit Quick PIN prompt.
        const capability =
          (await getBiometricCapability().catch(() => biometricCapabilityRef.current)) ??
          biometricCapabilityRef.current;
        if (capability) {
          setBiometricCapability(capability);
        }
        const pinReady =
          typeof hasAppPinConfigured === 'function'
            ? await hasAppPinConfigured().catch(() => false)
            : false;

        let nextLockMode: LocalLockMode;
        let promptForPin = false;
        if (nextSession.user.role === 'farmer') {
          if (localLockModeRef.current === 'app-pin' && pinReady) {
            nextLockMode = 'app-pin';
          } else if (
            localLockModeRef.current === 'device' &&
            capability?.status === 'available'
          ) {
            nextLockMode = 'device';
          } else {
            nextLockMode = 'none';
          }
        } else {
          // field_reporter
          if (localLockModeRef.current === 'app-pin' && pinReady) {
            nextLockMode = 'app-pin';
          } else if (capability?.status === 'available') {
            nextLockMode = 'device';
          } else if (pinReady) {
            nextLockMode = 'app-pin';
          } else {
            nextLockMode = 'none';
            promptForPin = true;
          }
        }

        let persistedOk = false;
        try {
          await persistSession(nextSession, nextLockMode);
          persistedOk = true;
        } catch {
          // Fail-closed on storage failure: live in-memory session stays active.
          nextLockMode = 'none';
          promptForPin = false;
        }

        if (typeof markMobileLoginCompleted === 'function') {
          await markMobileLoginCompleted().catch(() => undefined);
        }
        setHasCompletedLogin(true);
        setHasPersistedSession(persistedOk);
        setLocalLockMode(nextLockMode);
        setBiometricEnabled(nextLockMode === 'device');
        setAppPinConfigured(pinReady);
        setRequiresAppPinUnlock(false);
        setNeedsInitialPinSetup(promptForPin);
        setFarmerOfflineGrace(false);
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
    [acceptTokenSession, persistSession, setCurrentSession],
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
        const mode = await readLockMode();
        if (mode !== 'device') {
          setErrorMessage('Protected unlock is not set up. Sign in with your password.');
          return false;
        }
        const unlock = await readyBiometricOnce();
        if (!unlock.success) {
          if (shouldDisableBiometricUnlock(unlock)) {
            if (typeof disableBiometricUnlock === 'function') {
              await disableBiometricUnlock().catch(() => undefined);
            }
            setBiometricEnabled(false);
            setLocalLockMode('none');
            setHasPersistedSession(false);
          }
          setErrorMessage(unlock.message);
          return false;
        }
        const storedResult = await readPersisted();
        if (!storedResult) {
          setBiometricEnabled(false);
          setLocalLockMode('none');
          setHasPersistedSession(false);
          setErrorMessage('Device unlock is unavailable. Sign in with your password.');
          return false;
        }
        setBiometricEnabled(true);
        setLocalLockMode('device');
        setHasPersistedSession(true);
        if (storedResult.farmerOfflineGrace) {
          hydrateFarmerGraceSession(storedResult.session);
          return true;
        }
        return await verifyAndHydrateSession(
          storedResult.session,
          () => generation === verificationGeneration.current,
        );
      } catch (error: unknown) {
        if (isStoredSessionExpiredError(error)) {
          await clearMobileSession().catch(() => undefined);
          setBiometricEnabled(false);
          setLocalLockMode('none');
          setAppPinConfigured(false);
          setHasPersistedSession(false);
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
            setLocalLockMode('none');
            setHasPersistedSession(false);
          }
          setErrorMessage(error.message);
        } else {
          setErrorMessage('Device unlock is unavailable. Sign in with your password.');
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
  }, [
    hydrateFarmerGraceSession,
    readLockMode,
    readPersisted,
    readyBiometricOnce,
    setCurrentSession,
    verifyAndHydrateSession,
  ]);

  const unlockWithAppPin = useCallback(
    async (pin: string): Promise<boolean> => {
      verificationGeneration.current += 1;
      const generation = verificationGeneration.current;
      setBiometricLoading(true);
      setErrorMessage(null);
      try {
        const result = await verifyAppPin(pin);
        if (!result.success) {
          if (result.code === 'LOCKED_OUT') {
            await clearLocalSession(result.message);
          } else {
            setErrorMessage(result.message);
          }
          return false;
        }

        const storedResult = await readPersisted({ skipDevicePrompt: true });
        if (!storedResult) {
          await clearLocalSession('The stored session could not be restored. Sign in with your password.');
          return false;
        }
        setLocalLockMode('app-pin');
        setAppPinConfigured(true);
        setRequiresAppPinUnlock(false);
        setHasPersistedSession(true);
        if (storedResult.farmerOfflineGrace) {
          hydrateFarmerGraceSession(storedResult.session);
          return true;
        }
        return await verifyAndHydrateSession(
          storedResult.session,
          () => generation === verificationGeneration.current,
        );
      } catch (error: unknown) {
        if (isStoredSessionExpiredError(error)) {
          await clearLocalSession('Your session expired. Sign in to resume pending uploads.');
          if (error.token) {
            void logoutMobile(error.token).catch(() => undefined);
          }
        } else {
          setErrorMessage('Could not unlock with Quick PIN. Sign in with your password.');
        }
        return false;
      } finally {
        setBiometricLoading(false);
      }
    },
    [
      clearLocalSession,
      hydrateFarmerGraceSession,
      readPersisted,
      verifyAndHydrateSession,
    ],
  );

  const setupAppPin = useCallback(
    async (pin: string): Promise<boolean> => {
      const activeSession = sessionRef.current;
      if (!activeSession) {
        setErrorMessage('Sign in before setting up a Quick PIN.');
        return false;
      }
      setBiometricLoading(true);
      setErrorMessage(null);
      try {
        await saveAppPin(pin);
        if (!farmerOfflineGraceRef.current && activeSession.token) {
          await persistSession(activeSession, 'app-pin');
        }
        setLocalLockMode('app-pin');
        setBiometricEnabled(false);
        setAppPinConfigured(true);
        setHasPersistedSession(true);
        setNeedsInitialPinSetup(false);
        setErrorMessage(null);
        return true;
      } catch (error: unknown) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'CaneGuard could not save your Quick PIN. Try again.',
        );
        return false;
      } finally {
        setBiometricLoading(false);
      }
    },
    [persistSession],
  );

  const enableBiometricUnlock = useCallback((): Promise<boolean> => {
    const inFlight = biometricEnableRef.current;
    if (inFlight) {
      return inFlight;
    }

    const operation = (async () => {
      const activeSession = sessionRef.current;
      if (!activeSession) {
        setErrorMessage('Sign in with your password before enabling device unlock.');
        return false;
      }
      setBiometricLoading(true);
      setErrorMessage(null);
      try {
        const unlock = await authenticateWithDeviceCredential();
        if (!unlock.success) {
          setErrorMessage(unlock.message);
          return false;
        }
        await persistSession(activeSession, 'device');
        if (typeof clearAppPin === 'function') {
          await clearAppPin().catch(() => undefined);
        }
        setBiometricEnabled(true);
        setLocalLockMode('device');
        setAppPinConfigured(false);
        setHasPersistedSession(true);
        setNeedsInitialPinSetup(false);
        setErrorMessage(null);
        return true;
      } catch {
        setErrorMessage(
          'Device unlock could not be enabled. Your password session is still active.',
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
  }, [persistSession]);

  /**
   * OFF-05: Turn off local App Lock (device lock or 4-digit Quick PIN) locally
   * without revoking the server token or logging the user out.
   */
  const disableLocalLock = useCallback(async (): Promise<boolean> => {
    const activeSession = sessionRef.current;
    if (!activeSession) {
      setErrorMessage('Sign in again before changing app lock.');
      return false;
    }
    setBiometricLoading(true);
    setErrorMessage(null);
    try {
      if (
        localLockModeRef.current === 'device' &&
        biometricCapabilityRef.current?.status === 'available'
      ) {
        const verified = await authenticateWithDeviceCredential();
        if (!verified.success) {
          setErrorMessage(verified.message);
          return false;
        }
      }
      if (typeof clearAppPin === 'function') {
        await clearAppPin().catch(() => undefined);
      }
      if (!farmerOfflineGraceRef.current && activeSession.token) {
        await persistSession(activeSession, 'none');
      }
      setLocalLockMode('none');
      setBiometricEnabled(false);
      setAppPinConfigured(false);
      setNeedsInitialPinSetup(false);
      setErrorMessage(null);
      return true;
    } catch {
      setErrorMessage('CaneGuard could not update app lock right now. Try again.');
      return false;
    } finally {
      setBiometricLoading(false);
    }
  }, [persistSession]);

  const dismissInitialPinSetup = useCallback(() => {
    setNeedsInitialPinSetup(false);
  }, []);

  const clearSessionAfterRemoteRevocation = useCallback(
    () => clearLocalSession(null),
    [clearLocalSession],
  );

  const changePassword = useCallback(
    async (input: PasswordChangeInput) => {
      setErrorMessage(null);
      const activeSession = sessionRef.current;
      if (!activeSession || !activeSession.token) {
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
      setErrorMessage(null);
      const activeSession = sessionRef.current;
      if (!activeSession || !activeSession.token) {
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
      setErrorMessage(null);
      const activeSession = sessionRef.current;
      if (!activeSession || !activeSession.token) {
        setErrorMessage('Sign in again before disabling device unlock.');
        return false;
      }
      try {
        await disableBiometricApi(activeSession.token, currentPassword);
        let remoteRevocationFailed = false;
        try {
          await logoutMobile(activeSession.token);
        } catch {
          remoteRevocationFailed = true;
        }
        const cleared = await clearSessionAfterRemoteRevocation();
        if (remoteRevocationFailed && cleared) {
          setErrorMessage(
            'Device unlock was disabled on this device, but the server token could not be revoked.',
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
      setErrorMessage(null);
      const activeSession = sessionRef.current;
      if (!activeSession || !activeSession.token) {
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
          await persistSession(nextSession, localLockModeRef.current);
          setHasPersistedSession(true);
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
      clearLocalSession,
      markSessionExpired,
      persistSession,
      setCurrentSession,
    ],
  );

  const logout = useCallback(async () => {
    verificationGeneration.current += 1;
    revocationRef.current = null;
    setRevocation(null);
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
    setCurrentSession(null);
    setStatus('unauthenticated');
    setSessionVerification('idle');
    setBiometricEnabled(false);
    setLocalLockMode('none');
    setAppPinConfigured(false);
    setHasPersistedSession(false);
    setRequiresAppPinUnlock(false);
    setNeedsInitialPinSetup(false);
    setFarmerOfflineGrace(false);
    if (localClearFailed) {
      setErrorMessage(
        'CaneGuard could not clear secure session storage. Restart the app and try logout again.',
      );
      return { localClearFailed: true, remoteRevocationFailed };
    }

    setErrorMessage(
      remoteRevocationFailed
        ? 'Signed out on this device. The server token could not be revoked and may remain active.'
        : null,
    );
    return { localClearFailed: false, remoteRevocationFailed };
  }, [endPendingSessionWork, setCurrentSession]);

  const sessionState = useMemo<SessionState>(
    () => {
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
    const { capabilityGrant: _dropped, ...rest } = current;
    void _dropped;
    const next: MobileSession = { ...rest, user: { ...rest.user, capabilities: [] } };
    revocationRef.current = 'capability-revoked';
    setRevocation('capability-revoked');
    setCurrentSession(next);
    try {
      await persistSession(next, localLockModeRef.current);
    } catch {
      // The in-memory drop already holds; the next successful /me replaces the grant.
    }
    await retrySessionVerification({ reason: 'revoked' });
  }, [persistSession, retrySessionVerification, setCurrentSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      appPinConfigured,
      biometricCapability,
      biometricEnabled,
      biometricLoading,
      changeEmail,
      changePassword,
      clearSessionAfterRemoteRevocation,
      disableBiometric,
      disableLocalLock,
      dismissInitialPinSetup,
      enableBiometricUnlock,
      enrollMobileDevice,
      errorMessage,
      farmerOfflineGrace,
      getAuthoringProvenance,
      hasCompletedLogin,
      hasPersistedSession,
      isSessionCurrent,
      localLockMode,
      login,
      logout,
      markSessionExpired,
      needsInitialPinSetup,
      reportCapabilityRevoked,
      requiresAppPinUnlock,
      retrySessionVerification,
      session,
      sessionState,
      sessionVerification,
      setupAppPin,
      status,
      unlockWithAppPin,
      unlockWithBiometrics,
      user: session?.user ?? null,
    }),
    [
      appPinConfigured,
      biometricCapability,
      biometricEnabled,
      biometricLoading,
      changeEmail,
      changePassword,
      clearSessionAfterRemoteRevocation,
      disableBiometric,
      disableLocalLock,
      dismissInitialPinSetup,
      enableBiometricUnlock,
      enrollMobileDevice,
      errorMessage,
      farmerOfflineGrace,
      getAuthoringProvenance,
      hasCompletedLogin,
      hasPersistedSession,
      isSessionCurrent,
      localLockMode,
      login,
      logout,
      markSessionExpired,
      needsInitialPinSetup,
      reportCapabilityRevoked,
      requiresAppPinUnlock,
      retrySessionVerification,
      session,
      sessionState,
      sessionVerification,
      setupAppPin,
      status,
      unlockWithAppPin,
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
