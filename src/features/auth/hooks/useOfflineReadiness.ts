import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { EMPTY_DATABASE, useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { listCachedFieldValidationAssignments } from '@/features/assignments/data/assignmentCacheRepository';
import { useAuth } from '@/features/auth/hooks/useAuth';

export interface OfflineReadinessState {
  assignmentCount: number | null;
  checkingAssignments: boolean;
  /** A biometric-protected credential is configured on this device. */
  protectedSessionEnabled: boolean;
  /** The protected session has an expiry in the past. */
  sessionExpired: boolean;
  sessionExpiresAt: string | null;
  /** Protected session ready and at least one visit cached for offline work. */
  ready: boolean;
  refresh: () => void;
}

/**
 * D01 (readiness-first): reports whether this device can actually resume field
 * work offline. It reflects the existing security boundary; it never suggests
 * storing a password or weakening authoritative revocation.
 */
export function useOfflineReadiness(): OfflineReadinessState {
  const database = useCaneGuardDatabase();
  const { biometricEnabled, session, user } = useAuth();
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

  // A returning inspector sees a fresh readiness answer without a mount.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refresh();
      }
    });
    return () => subscription.remove();
  }, [refresh]);

  const protectedSessionEnabled = biometricEnabled && session !== null;

  return {
    assignmentCount,
    checkingAssignments,
    protectedSessionEnabled,
    ready:
      protectedSessionEnabled &&
      !sessionExpired &&
      assignmentCount !== null &&
      assignmentCount > 0,
    refresh,
    sessionExpired,
    sessionExpiresAt,
  };
}
