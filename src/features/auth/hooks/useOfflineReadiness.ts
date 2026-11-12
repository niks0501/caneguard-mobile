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
import { net } from '@/features/net/reconnectCoordinator';

export interface OfflineReadinessState {
  assignmentCount: number | null;
  checkingAssignments: boolean;
  /** A biometric-protected credential is configured on this device. */
  protectedSessionEnabled: boolean;
  /** The protected session has an expiry in the past. */
  sessionExpired: boolean;
  sessionExpiresAt: string | null;
  /** The one step still missing before offline work, or null when ready. */
  missingStep?: MissingStep | null;
  /** Derived from the session union and the saved visits; never from loose flags. */
  ready: boolean;
  sessionState?: SessionState;
  refresh: () => void;
}

/**
 * D01 (readiness-first): reports whether this device can actually resume field
 * work offline. It reflects the existing security boundary; it never suggests
 * storing a password or weakening authoritative revocation.
 */
export function useOfflineReadiness(): OfflineReadinessState {
  const database = useCaneGuardDatabase();
  const { biometricEnabled, session, sessionState, user } = useAuth();
  const [assignmentCount, setAssignmentCount] = useState<number | null>(null);
  const [checkingAssignments, setCheckingAssignments] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const ownerIdentity = user?.uuid ?? null;
  const sessionExpiresAt = session?.expiresAt ?? null;

  const refresh = useCallback(() => {
    const expiresAt = sessionExpiresAt;
    setSessionExpired(
      expiresAt !== null &&
        Number.isFinite(Date.parse(expiresAt)) &&
        Date.parse(expiresAt) <= Date.now(),
    );

    if (
      !ownerIdentity ||
      database === EMPTY_DATABASE ||
      typeof database.select !== 'function'
    ) {
      setAssignmentCount(null);
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
  }, [database, ownerIdentity, sessionExpiresAt]);

  useEffect(() => {
    let active = true;
    // Deferred so the first readiness answer arrives from the cache read
    // rather than as a synchronous state write during the effect.
    void Promise.resolve().then(() => {
      if (active) {
        refresh();
      }
    });
    return () => {
      active = false;
    };
  }, [refresh]);

  // A returning inspector sees a fresh readiness answer without a mount: the
  // coordinator settles every reconnect run, offline or up to date, and
  // readiness refreshes then, after Download has filled the cache.
  useEffect(() => net.onSettled(refresh), [refresh]);

  const protectedSessionEnabled = biometricEnabled && session !== null;
  // Auth doubles that predate the union fall back to "verified while signed in".
  const state: SessionState =
    sessionState ??
    (session
      ? { kind: 'verified', at: new Date(0).toISOString() }
      : { kind: 'signed-out' });
  const readiness = deriveReadiness({
    biometricProtected: protectedSessionEnabled,
    cachedVisits: assignmentCount,
    now: estimateServerNow(deviceClockNow(), session?.capabilityGrant ?? null),
    state,
  });

  return {
    assignmentCount,
    checkingAssignments,
    missingStep: readiness.missing,
    protectedSessionEnabled,
    ready: readiness.ready && !sessionExpired,
    refresh,
    sessionState: state,
    sessionExpired,
    sessionExpiresAt,
  };
}
