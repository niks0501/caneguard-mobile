import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { EMPTY_DATABASE, useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { listFieldValidationCompletionSummaries } from '@/features/assignments/data/fieldValidationCompletionRepository';
import { useFieldValidationAssignments } from '@/features/assignments/hooks/useFieldValidationAssignments';
import {
  getLocalDateKey,
  selectTodayVisits,
} from '@/features/assignments/domain/todayVisits';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function useTodayVisits() {
  const database = useCaneGuardDatabase();
  const { session } = useAuth();
  const assignments = useFieldValidationAssignments();
  const [completedAssignmentIds, setCompletedAssignmentIds] = useState<Set<string>>(new Set());
  const [completedTodayCount, setCompletedTodayCount] = useState(0);
  const today = getLocalDateKey();

  const refreshCompletions = useCallback(async () => {
    if (!session || !database || database === EMPTY_DATABASE) return;
    try {
      const completions = await listFieldValidationCompletionSummaries(
        database,
        session.user.uuid,
      );
      const todayKey = getLocalDateKey();
      setCompletedAssignmentIds(new Set(completions.map((completion) => completion.assignmentId)));
      setCompletedTodayCount(
        completions.filter((completion) => getLocalDateKey(new Date(completion.visitedAt)) === todayKey).length,
      );
    } catch {
      // A stale or unavailable completion cache must not hide assignment work.
      setCompletedAssignmentIds(new Set());
      setCompletedTodayCount(0);
    }
  }, [database, session]);

  useFocusEffect(
    useCallback(() => {
      void refreshCompletions();
    }, [refreshCompletions]),
  );

  const visits = useMemo(
    () => selectTodayVisits(assignments.assignments, completedAssignmentIds),
    [assignments.assignments, completedAssignmentIds],
  );

  return {
    ...assignments,
    completedTodayCount,
    today,
    visits,
  };
}
