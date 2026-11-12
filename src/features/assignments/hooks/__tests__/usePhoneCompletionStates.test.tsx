import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { listFieldValidationCompletionSummaries } from '@/features/assignments/data/fieldValidationCompletionRepository';
import { usePhoneCompletionSnapshot, usePhoneCompletionStates } from '@/features/assignments/hooks/usePhoneCompletionStates';
import { AuthContext } from '@/features/auth/providers/AuthProvider';
import { emitSyncRecordsChanged } from '@/features/sync/services/syncEvents';

const mockDatabase = { name: 'owner-database' };
const OWNER_ID = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';
const OTHER_OWNER_ID = 'b4e2f8c6-70da-4a13-9f27-6c9c6ee7c6d4';

let currentSession: { user: { uuid: string } } | null = { user: { uuid: OWNER_ID } };

const mockFocusCleanup: { current: (() => void) | null } = { current: null };

jest.mock('expo-router', () => {
  const mockReact = jest.requireActual('react') as typeof import('react');
  return {
    useFocusEffect: (callback: () => void | (() => void)) => {
      mockReact.useEffect(() => {
        const cleanup = callback();
        const handler = typeof cleanup === 'function' ? cleanup : () => {};
        mockFocusCleanup.current = handler;
        return () => {
          handler();
          if (mockFocusCleanup.current === handler) mockFocusCleanup.current = null;
        };
      }, [callback]);
    },
  };
});

jest.mock('@/database/DatabaseProvider', () => ({
  EMPTY_DATABASE: { name: 'empty-database' },
  useCaneGuardDatabase: () => mockDatabase,
}));
jest.mock('@/features/assignments/data/fieldValidationCompletionRepository', () => ({
  listFieldValidationCompletionSummaries: jest.fn(),
}));

const mockSummaries = jest.mocked(listFieldValidationCompletionSummaries);

type Summaries = Awaited<ReturnType<typeof listFieldValidationCompletionSummaries>>;

function deferredSummaries() {
  let resolve!: (rows: Summaries) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<Summaries>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
}

function wrapper({ children }: PropsWithChildren) {
  return (
    <AuthContext.Provider value={{ session: currentSession } as never}>
      {children}
    </AuthContext.Provider>
  );
}

describe('usePhoneCompletionStates', () => {
  beforeEach(() => {
    mockSummaries.mockReset();
    currentSession = { user: { uuid: OWNER_ID } };
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

  it('keeps the newest read when an older read resolves after it', async () => {
    const olderRead = deferredSummaries();
    const newerRead = deferredSummaries();
    mockSummaries
      .mockReturnValueOnce(olderRead.promise)
      .mockReturnValueOnce(newerRead.promise);

    const { result } = await renderHook(() => usePhoneCompletionStates(), {
      wrapper,
    });

    await act(async () => {
      emitSyncRecordsChanged();
    });
    await act(async () => {
      newerRead.resolve([
        {
          assignmentId: 'assignment-visit',
          syncStatus: 'synced',
          visitedAt: '2026-09-02T04:06:06.123Z',
        },
      ]);
    });
    await waitFor(() =>
      expect(result.current.get('assignment-visit')).toBe('sent'),
    );

    await act(async () => {
      olderRead.resolve([
        {
          assignmentId: 'assignment-visit',
          syncStatus: 'pending',
          visitedAt: '2026-09-02T04:06:06.123Z',
        },
      ]);
    });

    expect(result.current.get('assignment-visit')).toBe('sent');
  });

  it('keeps the known visits when a later read fails', async () => {
    mockSummaries.mockResolvedValueOnce([
      {
        assignmentId: 'assignment-waiting',
        syncStatus: 'pending',
        visitedAt: '2026-09-02T04:06:06.123Z',
      },
    ]);
    mockSummaries.mockRejectedValueOnce(new Error('read failed'));

    const { result } = await renderHook(() => usePhoneCompletionStates(), {
      wrapper,
    });

    await waitFor(() =>
      expect(result.current.get('assignment-waiting')).toBe('waiting'),
    );

    await act(async () => {
      emitSyncRecordsChanged();
    });
    await waitFor(() => expect(mockSummaries).toHaveBeenCalledTimes(2));

    expect(result.current.get('assignment-waiting')).toBe('waiting');
  });

  it('never shows a previous account visit after another account signs in', async () => {
    mockSummaries.mockResolvedValueOnce([
      {
        assignmentId: 'assignment-previous-owner',
        syncStatus: 'pending',
        visitedAt: '2026-09-02T04:06:06.123Z',
      },
    ]);
    mockSummaries.mockRejectedValueOnce(new Error('read failed'));

    const { result, rerender } = await renderHook(
      () => usePhoneCompletionStates(),
      { wrapper },
    );

    await waitFor(() =>
      expect(result.current.get('assignment-previous-owner')).toBe('waiting'),
    );

    currentSession = { user: { uuid: OTHER_OWNER_ID } };
    await rerender(undefined);
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.size).toBe(0);
  });

  it('shows only the signed-in account visits after an account switch', async () => {
    mockSummaries.mockResolvedValueOnce([
      {
        assignmentId: 'assignment-previous-owner',
        syncStatus: 'pending',
        visitedAt: '2026-09-02T04:06:06.123Z',
      },
    ]);
    mockSummaries.mockResolvedValueOnce([
      {
        assignmentId: 'assignment-new-owner',
        syncStatus: 'synced',
        visitedAt: '2026-09-03T04:06:06.123Z',
      },
    ]);

    const { result, rerender } = await renderHook(
      () => usePhoneCompletionStates(),
      { wrapper },
    );

    await waitFor(() =>
      expect(result.current.get('assignment-previous-owner')).toBe('waiting'),
    );

    currentSession = { user: { uuid: OTHER_OWNER_ID } };
    await rerender(undefined);

    await waitFor(() =>
      expect(result.current.get('assignment-new-owner')).toBe('sent'),
    );
    expect(result.current.has('assignment-previous-owner')).toBe(false);
    expect(mockSummaries).toHaveBeenLastCalledWith(mockDatabase, OTHER_OWNER_ID);
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

  it('drops its current answer as soon as the screen loses focus', async () => {
    mockSummaries.mockResolvedValue([
      {
        assignmentId: 'assignment-waiting',
        syncStatus: 'pending',
        visitedAt: '2026-09-02T04:06:06.123Z',
      },
    ]);

    const { result } = await renderHook(() => usePhoneCompletionSnapshot(), {
      wrapper,
    });

    await waitFor(() => expect(result.current.ready).toBe(true));

    await act(async () => {
      mockFocusCleanup.current?.();
    });

    expect(result.current.ready).toBe(false);
    expect(result.current.states.get('assignment-waiting')).toBe('waiting');
  });

  it('reports the saved visits as current only after the read resolves', async () => {
    const read = deferredSummaries();
    mockSummaries.mockReturnValueOnce(read.promise);

    const { result } = await renderHook(() => usePhoneCompletionSnapshot(), {
      wrapper,
    });

    expect(result.current.ready).toBe(false);

    await act(async () => {
      read.resolve([
        {
          assignmentId: 'assignment-visit',
          syncStatus: 'synced',
          visitedAt: '2026-09-02T04:06:06.123Z',
        },
      ]);
    });

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.states.get('assignment-visit')).toBe('sent');
  });

  it('stops claiming a current answer when a later read fails', async () => {
    mockSummaries.mockResolvedValueOnce([
      {
        assignmentId: 'assignment-waiting',
        syncStatus: 'pending',
        visitedAt: '2026-09-02T04:06:06.123Z',
      },
    ]);
    mockSummaries.mockRejectedValueOnce(new Error('read failed'));

    const { result } = await renderHook(() => usePhoneCompletionSnapshot(), {
      wrapper,
    });

    await waitFor(() => expect(result.current.ready).toBe(true));

    await act(async () => {
      emitSyncRecordsChanged();
    });

    await waitFor(() => expect(mockSummaries).toHaveBeenCalledTimes(2));
    expect(result.current.ready).toBe(false);
    expect(result.current.failed).toBe(true);
    expect(result.current.states.get('assignment-waiting')).toBe('waiting');
  });

  it('is not failed while a read is running or after one succeeds', async () => {
    mockSummaries.mockResolvedValueOnce([]);

    const { result } = await renderHook(() => usePhoneCompletionSnapshot(), {
      wrapper,
    });

    expect(result.current.failed).toBe(false);
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.failed).toBe(false);
  });
});
