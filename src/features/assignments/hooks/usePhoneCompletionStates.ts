import { useFocusEffect } from 'expo-router';
import { useCallback, useContext, useState } from 'react';

import { EMPTY_DATABASE, useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { listFieldValidationCompletionSummaries } from '@/features/assignments/data/fieldValidationCompletionRepository';
import type { PhoneCompletionState } from '@/features/assignments/domain/fieldValidationCompletionTypes';
import { AuthContext } from '@/features/auth/providers/AuthProvider';
import { subscribeSyncRecords } from '@/features/sync/services/syncEvents';

const NO_STATES: ReadonlyMap<string, PhoneCompletionState> = new Map();

export interface PhoneCompletionSnapshot {
  /**
   * True only while the saved visits read for the signed-in owner is current:
   * false while a read is running or after it failed, so a caller that decides
   * what work is still owed never reads a stale answer.
   */
  ready: boolean;
  states: ReadonlyMap<string, PhoneCompletionState>;
}

interface OwnedPhoneCompletionSnapshot extends PhoneCompletionSnapshot {
  ownerIdentity: string | null;
}

const NO_SNAPSHOT: OwnedPhoneCompletionSnapshot = {
  ownerIdentity: null,
  ready: false,
  states: NO_STATES,
};

/**
 * The visit saved on this phone for each assignment, keyed by assignment id,
 * with the freshness of that answer. Reloads on focus and whenever local
 * records change; a failed read keeps the known visits for display but is no
 * longer current.
 */
export function usePhoneCompletionSnapshot(): PhoneCompletionSnapshot {
  const database = useCaneGuardDatabase();
  const ownerIdentity = useContext(AuthContext)?.session?.user.uuid ?? null;
  const [snapshot, setSnapshot] =
    useState<OwnedPhoneCompletionSnapshot>(NO_SNAPSHOT);

  useFocusEffect(
    useCallback(() => {
      if (!ownerIdentity || !database || database === EMPTY_DATABASE) return;
      let active = true;
      let latestRead = 0;
      const load = () => {
        const read = ++latestRead;
        setSnapshot((previous) => ({
          ownerIdentity,
          ready: false,
          states: previous.ownerIdentity === ownerIdentity ? previous.states : NO_STATES,
        }));
        listFieldValidationCompletionSummaries(database, ownerIdentity)
          .then((rows) => {
            if (!active || read !== latestRead) return;
            setSnapshot({
              ownerIdentity,
              ready: true,
              states: new Map<string, PhoneCompletionState>(
                rows.map((row) => [
                  row.assignmentId,
                  row.syncStatus === 'synced' ? 'sent' : 'waiting',
                ]),
              ),
            });
          })
          .catch(() => {
            if (!active || read !== latestRead) return;
            setSnapshot((previous) => ({
              ownerIdentity,
              ready: false,
              states: previous.ownerIdentity === ownerIdentity ? previous.states : NO_STATES,
            }));
          });
      };
      load();
      const unsubscribe = subscribeSyncRecords(load);
      return () => {
        active = false;
        unsubscribe();
      };
    }, [database, ownerIdentity]),
  );

  return snapshot.ownerIdentity === ownerIdentity ? snapshot : NO_SNAPSHOT;
}

/** The visit saved on this phone for each assignment, keyed by assignment id. */
export function usePhoneCompletionStates(): ReadonlyMap<string, PhoneCompletionState> {
  return usePhoneCompletionSnapshot().states;
}
