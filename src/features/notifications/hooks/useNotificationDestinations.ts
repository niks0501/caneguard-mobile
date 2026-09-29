import { useEffect, useRef, useState } from 'react';

import { EMPTY_DATABASE, useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSyncRecordsRevision } from '@/features/sync/hooks/useSyncRecordsRevision';
import type { MobileNotification } from '@/features/notifications/domain/notificationTypes';
import {
  resolveNotificationDestination,
  type NotificationDestination,
} from '@/features/notifications/services/resolveNotificationDestination';

/**
 * Resolve where each cached notification can actually take the signed-in
 * inspector on this device. Resolution is owner-scoped: a notification whose
 * case is not stored here stays explicitly non-actionable instead of opening an
 * unrelated screen.
 *
 * `enabled` lets a surface that is not showing the list skip the work. The
 * office-updates panel stays mounted for the whole session but is closed most
 * of the time, and its rows are the only thing that reads the result, so it
 * resolves on first open instead of on cold start. The resolved map is kept
 * while the panel is closed, so closing and reopening does not resolve again.
 */
export function useNotificationDestinations(
  notifications: MobileNotification[],
  enabled = true,
): Map<string, NotificationDestination> {
  const database = useCaneGuardDatabase();
  const { user } = useAuth();
  const ownerIdentity = user?.uuid ?? null;
  // Assignment and Field Report cache writes emit this revision, including
  // deletion and post-sync changes. Re-resolve so a chevron never outlives the
  // local row that makes its route actionable.
  const localDataRevision = useSyncRecordsRevision();
  const [destinations, setDestinations] = useState<
    Map<string, NotificationDestination>
  >(() => new Map());
  const notificationsRef = useRef(notifications);
  // A sync writes many rows, and every write bumps the shared revision. Without
  // coalescing, each bump started its own full pass over the list, so a burst of
  // writes stacked that many concurrent passes (one to three queries per
  // notification each). One pass now runs at a time; a bump that lands during a
  // pass asks for exactly one follow-up pass.
  const passInFlight = useRef(false);
  const passRequested = useRef(false);
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const identityKey = notifications
    .map(
      (notification) =>
        `${notification.id}:${notification.caseUuid ?? ''}:${notification.referenceCode ?? ''}:${notification.assignmentUuid ?? ''}`,
    )
    .join('|');

  // The inputs a pass should use, and whether the component is still mounted.
  // A pass reads these refs instead of closing over the values, so a dependency
  // change while it is in flight only asks for a follow-up pass instead of
  // cancelling the running one.
  const latestInputs = useRef({ database, enabled, ownerIdentity });
  const mounted = useRef(true);
  useEffect(() => {
    latestInputs.current = { database, enabled, ownerIdentity };
  }, [database, enabled, ownerIdentity]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const runPass = async (): Promise<void> => {
      passInFlight.current = true;
      passRequested.current = false;
      try {
        const started = latestInputs.current;
        if (
          !started.enabled ||
          !started.ownerIdentity ||
          !started.database ||
          started.database === EMPTY_DATABASE
        ) {
          return;
        }

        const entries = await Promise.all(
          notificationsRef.current.map(async (notification) => {
            try {
              return [
                notification.id,
                await resolveNotificationDestination(
                  started.database!,
                  started.ownerIdentity!,
                  notification,
                ),
              ] as const;
            } catch {
              return [
                notification.id,
                { kind: 'unavailable' } as NotificationDestination,
              ] as const;
            }
          }),
        );

        // Never publish a result resolved for a replaced owner.
        if (
          mounted.current &&
          latestInputs.current.ownerIdentity === started.ownerIdentity
        ) {
          setDestinations(new Map(entries));
        }
      } finally {
        passInFlight.current = false;
      }

      const current = latestInputs.current;
      if (
        passRequested.current &&
        mounted.current &&
        current.enabled &&
        current.ownerIdentity &&
        current.database &&
        current.database !== EMPTY_DATABASE
      ) {
        passRequested.current = false;
        await runPass();
      }
    };

    if (!enabled) {
      passRequested.current = false;
      return;
    }

    if (!ownerIdentity || !database || (EMPTY_DATABASE && database === EMPTY_DATABASE)) {
      return;
    }

    if (passInFlight.current) {
      passRequested.current = true;
      return;
    }

    void runPass();
  }, [database, enabled, identityKey, localDataRevision, ownerIdentity]);

  return ownerIdentity ? destinations : EMPTY_DESTINATIONS;
}

const EMPTY_DESTINATIONS: Map<string, NotificationDestination> = new Map();
