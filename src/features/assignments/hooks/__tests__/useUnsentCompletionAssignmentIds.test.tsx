import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { listFieldValidationCompletionSummaries } from '@/features/assignments/data/fieldValidationCompletionRepository';
import { useUnsentCompletionAssignmentIds } from '@/features/assignments/hooks/useUnsentCompletionAssignmentIds';
import { AuthContext } from '@/features/auth/providers/AuthProvider';
import { emitSyncRecordsChanged } from '@/features/sync/services/syncEvents';

const mockDatabase = { name: 'owner-database' };
const OWNER_ID = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';

jest.mock('@/database/DatabaseProvider', () => ({
  EMPTY_DATABASE: { name: 'empty-database' },
  useCaneGuardDatabase: () => mockDatabase,
}));
jest.mock('@/features/assignments/data/fieldValidationCompletionRepository', () => ({
  listFieldValidationCompletionSummaries: jest.fn(),
}));

const mockSummaries = jest.mocked(listFieldValidationCompletionSummaries);

function wrapper({ children }: PropsWithChildren) {
  return (
    <AuthContext.Provider
      value={{ session: { user: { uuid: OWNER_ID } } } as never}>
      {children}
    </AuthContext.Provider>
  );
}

describe('useUnsentCompletionAssignmentIds', () => {
  beforeEach(() => {
    mockSummaries.mockReset();
  });

  it('offers only visits that are still waiting to send after a delivery succeeds', async () => {
    mockSummaries.mockResolvedValue([
      {
        assignmentId: 'assignment-sent',
        syncStatus: 'synced',
        visitedAt: '2026-09-02T04:05:06.123Z',
      },
      {
        assignmentId: 'assignment-waiting',
        syncStatus: 'pending',
        visitedAt: '2026-09-02T04:06:06.123Z',
      },
      {
        assignmentId: 'assignment-retrying',
        syncStatus: 'failed',
        visitedAt: '2026-09-02T04:07:06.123Z',
      },
      {
        assignmentId: 'assignment-sending',
        syncStatus: 'syncing',
        visitedAt: '2026-09-02T04:08:06.123Z',
      },
    ]);

    const { result } = await renderHook(() => useUnsentCompletionAssignmentIds(), {
      wrapper,
    });

    await waitFor(() =>
      expect(result.current.has('assignment-waiting')).toBe(true),
    );
    expect([...result.current].sort()).toEqual([
      'assignment-retrying',
      'assignment-sending',
      'assignment-waiting',
    ]);
    expect(mockSummaries).toHaveBeenCalledWith(mockDatabase, OWNER_ID);
  });

  it('drops the waiting claim when the visit is delivered while the list stays open', async () => {
    const waitingVisit = {
      assignmentId: 'assignment-waiting',
      syncStatus: 'pending' as const,
      visitedAt: '2026-09-02T04:06:06.123Z',
    };
    mockSummaries.mockResolvedValue([waitingVisit]);

    const { result } = await renderHook(() => useUnsentCompletionAssignmentIds(), {
      wrapper,
    });

    await waitFor(() =>
      expect(result.current.has('assignment-waiting')).toBe(true),
    );

    mockSummaries.mockResolvedValue([{ ...waitingVisit, syncStatus: 'synced' }]);
    await act(async () => {
      emitSyncRecordsChanged();
    });

    await waitFor(() => expect(result.current.size).toBe(0));
  });

  it('claims nothing when the saved visits cannot be read', async () => {
    mockSummaries.mockRejectedValue(new Error('database unavailable'));

    const { result } = await renderHook(() => useUnsentCompletionAssignmentIds(), {
      wrapper,
    });

    await waitFor(() =>
      expect(mockSummaries).toHaveBeenCalledWith(mockDatabase, OWNER_ID),
    );
    expect(result.current.size).toBe(0);
  });
});
