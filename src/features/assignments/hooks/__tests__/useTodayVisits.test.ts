import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';
import { bucketForVisit } from '@/features/assignments/domain/todayVisits';
import { listFieldValidationCompletionSummaries } from '@/features/assignments/data/fieldValidationCompletionRepository';
import { useFieldValidationAssignments } from '@/features/assignments/hooks/useFieldValidationAssignments';
import { useTodayVisits } from '@/features/assignments/hooks/useTodayVisits';

jest.mock('@/features/assignments/hooks/useFieldValidationAssignments');
jest.mock('@/features/assignments/data/fieldValidationCompletionRepository');
jest.mock('@/database/DatabaseProvider', () => ({
  EMPTY_DATABASE: {},
  useCaneGuardDatabase: () => 'test database',
}));
jest.mock('@/features/auth/hooks/useAuth', () => ({ useAuth: () => ({ session: { user: { uuid: 'inspector' } } }) }));

describe('useTodayVisits', () => {
  it('recomputes due buckets and completed counts at midnight without an assignment refresh', async () => {
    jest.useFakeTimers();
    try {
      const evening = new Date(2026, 10, 28, 23, 59, 59);
      jest.setSystemTime(evening);
      const assignment = { id: 'open-visit', targetVisitDate: '2026-11-28', fieldValidationState: 'assigned' } as FieldValidationAssignment;
      jest.mocked(useFieldValidationAssignments).mockReturnValue({
        assignments: [assignment],
      } as ReturnType<typeof useFieldValidationAssignments>);
      jest.mocked(listFieldValidationCompletionSummaries).mockResolvedValue([
        { assignmentId: 'completed-visit', visitedAt: evening.toISOString() },
      ] as Awaited<ReturnType<typeof listFieldValidationCompletionSummaries>>);

      const { result } = await renderHook(() => useTodayVisits());
      await waitFor(() => expect(result.current.completedTodayCount).toBe(1));
      expect(bucketForVisit(result.current.visits[0], result.current.today)).toBe('today');

      await act(async () => { jest.advanceTimersByTime(2_000); });
      expect(bucketForVisit(result.current.visits[0], result.current.today)).toBe('overdue');
      expect(result.current.completedTodayCount).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });
});
