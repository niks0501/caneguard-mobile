import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { listFieldValidationCompletionSummaries } from '@/features/assignments/data/fieldValidationCompletionRepository';
import { usePhoneCompletionStates } from '@/features/assignments/hooks/usePhoneCompletionStates';
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

describe('usePhoneCompletionStates', () => {
  beforeEach(() => {
    mockSummaries.mockReset();
  });

  it('reports each saved visit as waiting until it is delivered, then as sent', async () => {
    mockSummaries.mockResolvedValue([
      {
        assignmentId: 'assignment-delivered',
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

    const { result } = await renderHook(() => usePhoneCompletionStates(), {
      wrapper,
    });

    await waitFor(() =>
      expect(result.current.get('assignment-waiting')).toBe('waiting'),
    );
    expect(result.current.get('assignment-delivered')).toBe('sent');
    expect(result.current.get('assignment-retrying')).toBe('waiting');
    expect(result.current.get('assignment-sending')).toBe('waiting');
    expect(mockSummaries).toHaveBeenCalledWith(mockDatabase, OWNER_ID);
  });

  it('keeps the visit visible when it is delivered while the list stays open', async () => {
    const savedVisit = {
      assignmentId: 'assignment-waiting',
      syncStatus: 'pending' as const,
      visitedAt: '2026-09-02T04:06:06.123Z',
    };
    mockSummaries.mockResolvedValue([savedVisit]);

    const { result } = await renderHook(() => usePhoneCompletionStates(), {
      wrapper,
    });

    await waitFor(() =>
      expect(result.current.get('assignment-waiting')).toBe('waiting'),
    );

    mockSummaries.mockResolvedValue([{ ...savedVisit, syncStatus: 'synced' }]);
    await act(async () => {
      emitSyncRecordsChanged();
    });

    await waitFor(() =>
      expect(result.current.get('assignment-waiting')).toBe('sent'),
    );
  });

  it('claims nothing when the saved visits cannot be read', async () => {
    mockSummaries.mockRejectedValue(new Error('database unavailable'));

    const { result } = await renderHook(() => usePhoneCompletionStates(), {
      wrapper,
    });

    await waitFor(() =>
      expect(mockSummaries).toHaveBeenCalledWith(mockDatabase, OWNER_ID),
    );
    expect(result.current.size).toBe(0);
  });
});
