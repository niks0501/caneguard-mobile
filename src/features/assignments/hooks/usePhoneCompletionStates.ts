import { useFocusEffect } from 'expo-router';
import { useCallback, useContext, useState } from 'react';

import { EMPTY_DATABASE, useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { listFieldValidationCompletionSummaries } from '@/features/assignments/data/fieldValidationCompletionRepository';
import type { PhoneCompletionState } from '@/features/assignments/domain/fieldValidationCompletionTypes';
import { AuthContext } from '@/features/auth/providers/AuthProvider';
import { subscribeSyncRecords } from '@/features/sync/services/syncEvents';

const NONE: ReadonlyMap<string, PhoneCompletionState> = new Map();

/** The visit saved on this phone for each assignment, keyed by assignment id. */
export function usePhoneCompletionStates(): ReadonlyMap<string, PhoneCompletionState> {
  const database = useCaneGuardDatabase();
  const session = useContext(AuthContext)?.session;
  const [states, setStates] =
    useState<ReadonlyMap<string, PhoneCompletionState>>(NONE);

  useFocusEffect(
    useCallback(() => {
      if (!session || !database || database === EMPTY_DATABASE) return;
      let active = true;
      const load = () => {
        listFieldValidationCompletionSummaries(database, session.user.uuid)
          .then((rows) => {
            if (active) {
              setStates(
                new Map<string, PhoneCompletionState>(
                  rows.map((row) => [
                    row.assignmentId,
                    row.syncStatus === 'synced' ? 'sent' : 'waiting',
                  ]),
                ),
              );
            }
          })
          .catch(() => {
            if (active) setStates(NONE);
          });
      };
      load();
      const unsubscribe = subscribeSyncRecords(load);
      return () => {
        active = false;
        unsubscribe();
      };
    }, [database, session]),
  );

  return states;
}
