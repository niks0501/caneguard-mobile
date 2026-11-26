import { useCallback, useEffect, useState } from 'react';

import { EMPTY_DATABASE, useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { listCachedFieldValidationAssignments } from '@/features/assignments/data/assignmentCacheRepository';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  deriveReadiness,
  deviceClockNow,
  estimateServerNow,
  type MissingStep,
  type SessionState,
} from '@/features/auth/domain/sessionState';
import type { LocalLockMode } from '@/features/auth/types';
import { net } from '@/features/net/reconnectCoordinator';

export interface OfflineReadinessState {
  assignmentCount: number | null;
  checkingAssignments: boolean;
  /** The active local cold-start lock mode ('none' | 'device' | 'app-pin'). */
  localLockMode: LocalLockMode;
  /** Whether the signed-in user is a farmer. */
  isFarmer: boolean;
  /** True when a farmer resumed past 30-day token expiry in personal-scan grace mode. */
  farmerOfflineGrace: boolean;
  /** An offline session is persisted on this device. */
  protectedSessionEnabled: boolean;
  /** Whether the device has a strong biometric available. */
  strongBiometricsAvailable: boolean | null;
  /** Whether the device PIN, pattern, or password can unlock the device. */
  deviceCredentialAvailable: boolean;
  /** The persisted inspector session has an expiry in the past. */
  sessionExpired: boolean;
  sessionExpiresAt: string | null;
  /** The one step still missing before offline work, or null when ready. */
  missingStep?: MissingStep | null;
  /** Derived from the session union, role, and saved state; never from loose flags. */
  ready: boolean;
  sessionState?: SessionState;
  refresh: () => void;
}

/**
 * D01 (readiness-first): reports whether this device can resume field or
 * personal scan work offline. Persistence is automatic after sign-in and no
 * longer requires biometric hardware or pre-downloaded visits.
 */
export function useOfflineReadiness(): OfflineReadinessState {
  const database = useCaneGuardDatabase();
  const {
    biometricCapability,
    biometricEnabled,
    farmerOfflineGrace = false,
    hasPersistedSession,
    localLockMode = biometricEnabled ? 'device' : 'none',
    session,
    sessionState,
    user,
  } = useAuth();
  const [assignmentCount, setAssignmentCount] = useState<number | null>(null);
  const [checkingAssignments, setCheckingAssignments] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const ownerIdentity = user?.uuid ?? null;
  const isFarmer = user?.role === 'farmer';
  const sessionExpiresAt = session?.expiresAt ?? null;

  const refresh = useCallback(() => {
    const expiresAt = sessionExpiresAt;
    const rawExpired =
      expiresAt !== null &&
      Number.isFinite(Date.parse(expiresAt)) &&
      Date.parse(expiresAt) <= Date.now();
    // Farmers enter offline personal-scan grace mode instead of a hard expiry wall.
    setSessionExpired(!isFarmer && rawExpired);

    if (
      isFarmer ||
      !ownerIdentity ||
      database === EMPTY_DATABASE ||
      typeof database.select !== 'function'
    ) {
      setAssignmentCount(isFarmer ? 0 : null);
      setCheckingAssignments(false);
      return;
    }
    let active = true;
    setCheckingAssignments(true);
    void listCachedFieldValidationAssignments(database, ownerIdentity)
      .then((assignments) => {
        if (active) {
          setAssignmentCount(assignments.length);
          setCheckingAssignments(false);
        }
      })
      .catch(() => {
        if (active) {
          // An unreadable cache is reported as unknown, never as "ready".
          setAssignmentCount(null);
          setCheckingAssignments(false);
        }
      });
    return () => {
      active = false;
    };
  }, [database, isFarmer, ownerIdentity, sessionExpiresAt]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) {
        refresh();
      }
    });
    return () => {
      active = false;
    };
  }, [refresh]);

  useEffect(() => net.onSettled(refresh), [refresh]);

  const protectedSessionEnabled =
    (Boolean(hasPersistedSession) || Boolean(biometricEnabled)) && session !== null;
  const state: SessionState =
    sessionState ??
    (session
      ? { kind: 'verified', at: new Date(0).toISOString() }
      : { kind: 'signed-out' });
  const readiness = deriveReadiness({
    biometricProtected: protectedSessionEnabled,
    cachedVisits: assignmentCount,
    farmerOfflineGrace,
    now: estimateServerNow(deviceClockNow(), session?.capabilityGrant ?? null),
    role: user?.role ?? 'field_reporter',
    state,
  });

  return {
    assignmentCount,
    checkingAssignments,
    deviceCredentialAvailable: biometricCapability?.deviceCredentialAvailable ?? false,
    farmerOfflineGrace,
    isFarmer,
    localLockMode,
    missingStep: readiness.missing,
    protectedSessionEnabled,
    ready: readiness.ready && !sessionExpired,
    refresh,
    sessionExpired,
    sessionExpiresAt,
    sessionState: state,
    strongBiometricsAvailable: biometricCapability?.strongBiometricsAvailable ?? null,
  };
}
