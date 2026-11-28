import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { EMPTY_DATABASE, useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { listFieldValidationCompletionSummaries } from '@/features/assignments/data/fieldValidationCompletionRepository';
import { useFieldValidationAssignments } from '@/features/assignments/hooks/useFieldValidationAssignments';
import { useLocalVisitDate } from '@/features/assignments/hooks/useLocalVisitDate';
import {
  getLocalDateKey,
  selectTodayVisits,
} from '@/features/assignments/domain/todayVisits';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function useTodayVisits() {
  const database = useCaneGuardDatabase();
  const { session } = useAuth();
  const assignments = useFieldValidationAssignments();
  const owner = session?.user.uuid;
  const [snapshot, setSnapshot] = useState<{
    owner: string;
    completions: Awaited<ReturnType<typeof listFieldValidationCompletionSummaries>>;
  } | null>(null);
  const today = useLocalVisitDate();

  useFocusEffect(
    useCallback(() => {
      if (!owner || !database || database === EMPTY_DATABASE) return;
      let current = true;
      void listFieldValidationCompletionSummaries(database, owner).then(
        (completions) => { if (current) setSnapshot({ owner, completions }); },
        () => { if (current) setSnapshot(null); },
      );
      return () => { current = false; };
    }, [database, owner]),
  );

  const completions = snapshot?.owner === owner ? snapshot?.completions : undefined;
  const visits = useMemo(() => selectTodayVisits(
    assignments.assignments,
    new Set(completions?.map((completion) => completion.assignmentId)),
  ), [assignments.assignments, completions]);
  const completedTodayCount = completions?.filter(
    (completion) => getLocalDateKey(new Date(completion.visitedAt)) === today,
  ).length ?? 0;

  return {
    ...assignments,
    completedTodayCount,
    today,
    visits,
  };
}
