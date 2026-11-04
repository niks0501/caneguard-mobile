import { useFocusEffect } from 'expo-router';
import { useCallback, useContext, useState } from 'react';

import { EMPTY_DATABASE, useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { listFieldValidationCompletionSummaries } from '@/features/assignments/data/fieldValidationCompletionRepository';
import { AuthContext } from '@/features/auth/providers/AuthProvider';

const NONE: ReadonlySet<string> = new Set();

/** Ids of assignments with a visit completion saved on this phone (read-only). */
export function useLocalCompletedAssignmentIds(): ReadonlySet<string> {
  const database = useCaneGuardDatabase();
  const session = useContext(AuthContext)?.session;
  const [ids, setIds] = useState<ReadonlySet<string>>(NONE);

  useFocusEffect(
    useCallback(() => {
      if (!session || !database || database === EMPTY_DATABASE) return;
      let active = true;
      listFieldValidationCompletionSummaries(database, session.user.uuid)
        .then((rows) => {
          if (active) setIds(new Set(rows.map((row) => row.assignmentId)));
        })
        .catch(() => {
          if (active) setIds(NONE);
        });
      return () => {
        active = false;
      };
    }, [database, session]),
  );

  return ids;
}
