import { useFocusEffect } from 'expo-router';
import { useCallback, useContext, useState } from 'react';

import { EMPTY_DATABASE, useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { listFieldValidationCompletionSummaries } from '@/features/assignments/data/fieldValidationCompletionRepository';
import type { PhoneCompletionState } from '@/features/assignments/domain/fieldValidationCompletionTypes';
import { AuthContext } from '@/features/auth/providers/AuthProvider';
import { subscribeSyncRecords } from '@/features/sync/services/syncEvents';

const NO_STATES: ReadonlyMap<string, PhoneCompletionState> = new Map();

interface PhoneCompletionSnapshot {
  ownerIdentity: string | null;
  states: ReadonlyMap<string, PhoneCompletionState>;
}

const NO_SNAPSHOT: PhoneCompletionSnapshot = {
  ownerIdentity: null,
  states: NO_STATES,
};

/** The visit saved on this phone for each assignment, keyed by assignment id. */
export function usePhoneCompletionStates(): ReadonlyMap<string, PhoneCompletionState> {
  const database = useCaneGuardDatabase();
  const ownerIdentity = useContext(AuthContext)?.session?.user.uuid ?? null;
  const [snapshot, setSnapshot] =
    useState<PhoneCompletionSnapshot>(NO_SNAPSHOT);

  useFocusEffect(
    useCallback(() => {
      if (!ownerIdentity || !database || database === EMPTY_DATABASE) return;
      let active = true;
      let latestRead = 0;
      const load = () => {
        const read = ++latestRead;
        listFieldValidationCompletionSummaries(database, ownerIdentity)
          .then((rows) => {
            if (!active || read !== latestRead) return;
            setSnapshot({
              ownerIdentity,
              states: new Map<string, PhoneCompletionState>(
                rows.map((row) => [
                  row.assignmentId,
                  row.syncStatus === 'synced' ? 'sent' : 'waiting',
                ]),
              ),
            });
          })
          .catch(() => undefined);
      };
      load();
      const unsubscribe = subscribeSyncRecords(load);
      return () => {
        active = false;
        unsubscribe();
      };
    }, [database, ownerIdentity]),
  );

  return snapshot.ownerIdentity === ownerIdentity
    ? snapshot.states
    : NO_STATES;
}
