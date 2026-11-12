import { useFocusEffect } from 'expo-router';
import { useCallback, useContext, useState } from 'react';

import { EMPTY_DATABASE, useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { listFieldValidationCompletionSummaries } from '@/features/assignments/data/fieldValidationCompletionRepository';
import {
  toPhoneCompletionState,
  type PhoneCompletionState,
} from '@/features/assignments/domain/fieldValidationCompletionTypes';
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
  /** True after the latest saved-visits read failed, so Home never reports a false all clear. */
  failed: boolean;
  states: ReadonlyMap<string, PhoneCompletionState>;
}

interface OwnedPhoneCompletionSnapshot extends PhoneCompletionSnapshot {
  ownerIdentity: string | null;
}

const NO_SNAPSHOT: OwnedPhoneCompletionSnapshot = {
  failed: false,
  ownerIdentity: null,
  ready: false,
  states: NO_STATES,
};

/**
 * The visit saved on this phone for each assignment, keyed by assignment id,
 * with the freshness of that answer. Reloads on focus and whenever local
 * records change. The answer stops being current while a read is running, after
 * a failed read, and as soon as the screen loses focus, so a caller that
 * decides what work is still owed never reads a stale answer.
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
      const invalidate = (failed = false) => {
        setSnapshot((previous) => ({
          failed,
          ownerIdentity,
          ready: false,
          states: previous.ownerIdentity === ownerIdentity ? previous.states : NO_STATES,
        }));
      };
      const load = () => {
        const read = ++latestRead;
        invalidate();
        listFieldValidationCompletionSummaries(database, ownerIdentity)
          .then((rows) => {
            if (!active || read !== latestRead) return;
            setSnapshot({
              failed: false,
              ownerIdentity,
              ready: true,
              states: new Map<string, PhoneCompletionState>(
                rows.map((row) => [
                  row.assignmentId,
                  toPhoneCompletionState(row),
                ]),
              ),
            });
          })
          .catch(() => {
            if (!active || read !== latestRead) return;
            invalidate(true);
          });
      };
      load();
      const unsubscribe = subscribeSyncRecords(load);
      return () => {
        active = false;
        unsubscribe();
        invalidate();
      };
    }, [database, ownerIdentity]),
  );

  return snapshot.ownerIdentity === ownerIdentity ? snapshot : NO_SNAPSHOT;
}

/** The visit saved on this phone for each assignment, keyed by assignment id. */
export function usePhoneCompletionStates(): ReadonlyMap<string, PhoneCompletionState> {
  return usePhoneCompletionSnapshot().states;
}
