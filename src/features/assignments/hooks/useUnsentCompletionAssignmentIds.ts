import { useFocusEffect } from 'expo-router';
import { useCallback, useContext, useState } from 'react';

import { EMPTY_DATABASE, useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { listFieldValidationCompletionSummaries } from '@/features/assignments/data/fieldValidationCompletionRepository';
import { AuthContext } from '@/features/auth/providers/AuthProvider';
import { subscribeSyncRecords } from '@/features/sync/services/syncEvents';

const NONE: ReadonlySet<string> = new Set();

/** Ids of assignments whose visit was finished on this phone and is still waiting to send. */
export function useUnsentCompletionAssignmentIds(): ReadonlySet<string> {
  const database = useCaneGuardDatabase();
  const session = useContext(AuthContext)?.session;
  const [ids, setIds] = useState<ReadonlySet<string>>(NONE);

  useFocusEffect(
    useCallback(() => {
      if (!session || !database || database === EMPTY_DATABASE) return;
      let active = true;
      const load = () => {
        listFieldValidationCompletionSummaries(database, session.user.uuid)
          .then((rows) => {
            if (active) {
              setIds(
                new Set(
                  rows
                    .filter((row) => row.syncStatus !== 'synced')
                    .map((row) => row.assignmentId),
                ),
              );
            }
          })
          .catch(() => {
            if (active) setIds(NONE);
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

  return ids;
}
