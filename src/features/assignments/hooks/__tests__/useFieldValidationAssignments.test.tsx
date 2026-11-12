import { act, renderHook, waitFor } from '@testing-library/react-native';

import { listCachedFieldValidationAssignments } from '@/features/assignments/data/assignmentCacheRepository';
import { MobileFieldValidationAssignmentsApiError } from '@/features/assignments/api/mobileFieldValidationAssignmentsApi';
import { useFieldValidationAssignments } from '@/features/assignments/hooks/useFieldValidationAssignments';
import {
  clearOwnerMobileDataStore,
  getOwnerMobileDataStore,
  setOwnerAssignments,
  setOwnerAssignmentsReadState,
} from '@/features/mobile-data/data/mobileDataStore';
import { refreshFieldValidationAssignments } from '@/features/assignments/services/refreshFieldValidationAssignments';
import { useAuth } from '@/features/auth/hooks/useAuth';

const DATABASE = {};
const OWNER_ID = 'a66e3cc9-6c21-4c66-98e2-f63eb0b2ff17';
const ASSIGNMENT_ID = '01a04de2-280e-7140-bf56-3c98f98259d5';
const CACHED_AT = new Date().toISOString();

jest.mock('expo-router', () => {
  const mockReact = jest.requireActual('react') as typeof import('react');
  return {
    useFocusEffect: (callback: () => void) => {
      mockReact.useEffect(callback, [callback]);
    },
  };
});
jest.mock('@/database/DatabaseProvider', () => ({
  EMPTY_DATABASE: {},
  useCaneGuardDatabase: () => DATABASE,
}));
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));
jest.mock('@/features/assignments/data/assignmentCacheRepository', () => ({
  listCachedFieldValidationAssignments: jest.fn(),
  readCachedFieldValidationSkippedCount: jest.fn(async () => 0),
}));
jest.mock(
  '@/features/assignments/services/refreshFieldValidationAssignments',
  () => ({ refreshFieldValidationAssignments: jest.fn() }),
);

const mockUseAuth = jest.mocked(useAuth);
const mockListCached = jest.mocked(listCachedFieldValidationAssignments);
const mockRefreshAssignments = jest.mocked(refreshFieldValidationAssignments);
const markSessionExpired = jest.fn(async () => undefined);

const READ_SESSION = {
  token: 'token-1',
  user: {
    capabilities: ['assignment:read'],
    role: 'field_reporter',
    uuid: OWNER_ID,
  },
};

describe('useFieldValidationAssignments capabilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListCached.mockResolvedValue([
      { id: ASSIGNMENT_ID, cachedAt: CACHED_AT } as never,
    ]);
    mockRefreshAssignments.mockResolvedValue({
      assignments: [],
      fetchedAt: Date.now(),
    } as never);
  });

  it('keeps cached assignments visible on the read grant and withdraws them without it', async () => {
    let completeRefresh!: (value: never) => void;
    mockRefreshAssignments.mockReturnValue(
      new Promise((resolve) => { completeRefresh = resolve; }) as never,
    );
    mockUseAuth.mockReturnValue({
      isSessionCurrent: () => true,
      markSessionExpired,
      session: READ_SESSION,
      status: 'authenticated',
    } as never);

    const { result, rerender } = await renderHook(() =>
      useFieldValidationAssignments(),
    );
    await waitFor(() => expect(result.current.assignments).toHaveLength(1));
    expect(mockRefreshAssignments).toHaveBeenCalledTimes(1);

    mockUseAuth.mockReturnValue({
      isSessionCurrent: () => true,
      markSessionExpired,
      session: {
        ...READ_SESSION,
        user: { ...READ_SESSION.user, capabilities: [] },
      },
      status: 'authenticated',
    } as never);
    await rerender(undefined);

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.assignments).toEqual([]);
    expect(mockRefreshAssignments).toHaveBeenCalledTimes(1);
    await act(() => {
      completeRefresh({ assignments: [], fetchedAt: Date.now() } as never);
    });
  });

  it('never reads the assignment cache without assignment:read', async () => {
    mockUseAuth.mockReturnValue({
      isSessionCurrent: () => true,
      markSessionExpired,
      session: {
        ...READ_SESSION,
        user: {
          ...READ_SESSION.user,
          capabilities: ['report:submit', 'assignment:complete'],
        },
      },
      status: 'authenticated',
    } as never);

    const { result } = await renderHook(() =>
      useFieldValidationAssignments(),
    );
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.assignments).toEqual([]);
    expect(mockListCached).not.toHaveBeenCalled();
    expect(mockRefreshAssignments).not.toHaveBeenCalled();
  });

  it('surfaces a broken-record diagnostic naming the item instead of a generic refresh failure', async () => {
    const ownerId = 'b18f0d55-0d3e-4b7c-8f0f-2a4f0f0b3a11';
    mockUseAuth.mockReturnValue({
      isSessionCurrent: () => true,
      markSessionExpired,
      session: { ...READ_SESSION, user: { ...READ_SESSION.user, uuid: ownerId } },
      status: 'authenticated',
    } as never);
    mockRefreshAssignments.mockRejectedValue(
      new MobileFieldValidationAssignmentsApiError(
        'MALFORMED_RESPONSE',
        'The assignment feed field report_uuid is invalid. (record reference CG-2026-0142)',
      ),
    );
    mockListCached.mockResolvedValue([
      { id: ASSIGNMENT_ID, cachedAt: '2026-01-01T00:00:00.000Z' } as never,
    ]);

    const { result } = await renderHook(() => useFieldValidationAssignments());

    await waitFor(() => expect(result.current.errorMessage).toContain('CG-2026-0142'));
    expect(result.current.errorMessage).toContain('report_uuid');
    expect(result.current.failed).toBe(true);
    expect(result.current.ready).toBe(false);

    const secondConsumer = await renderHook(() => useFieldValidationAssignments());
    await waitFor(() => expect(secondConsumer.result.current.failed).toBe(true));
  });

  it('rechecks the server after downloaded assignment data is cleared', async () => {
    const ownerId = 'b42a13e8-a095-4e27-a018-82725ef55b21';
    mockUseAuth.mockReturnValue({
      isSessionCurrent: () => true,
      markSessionExpired,
      session: { ...READ_SESSION, user: { ...READ_SESSION.user, uuid: ownerId } },
      status: 'authenticated',
    } as never);
    const store = getOwnerMobileDataStore(DATABASE as never, ownerId);
    setOwnerAssignments(store, [{ id: ASSIGNMENT_ID } as never], Date.now());
    setOwnerAssignmentsReadState(store, {
      refreshing: false,
      failed: false,
      verified: true,
    });
    clearOwnerMobileDataStore(DATABASE as never, ownerId);
    mockListCached.mockResolvedValue([]);
    let completeRefresh!: (value: never) => void;
    mockRefreshAssignments.mockReturnValue(
      new Promise((resolve) => { completeRefresh = resolve; }) as never,
    );

    const { result } = await renderHook(() => useFieldValidationAssignments());
    await waitFor(() => expect(mockRefreshAssignments).toHaveBeenCalled());
    expect(result.current.ready).toBe(false);
    expect(result.current.failed).toBe(false);
    expect(result.current.assignments).toEqual([]);

    await act(() => {
      completeRefresh({ assignments: [], fetchedAt: Date.now() } as never);
    });
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.failed).toBe(false);
  });

  it('shares an in-flight refresh state while a stale cache remains available', async () => {
    const ownerId = '3b6e7a1f-8b43-4d22-a6d2-5a8de94b819e';
    let completeRefresh!: (value: never) => void;
    mockUseAuth.mockReturnValue({
      isSessionCurrent: () => true,
      markSessionExpired,
      session: { ...READ_SESSION, user: { ...READ_SESSION.user, uuid: ownerId } },
      status: 'authenticated',
    } as never);
    mockListCached.mockResolvedValue([
      { id: ASSIGNMENT_ID, cachedAt: '2026-01-01T00:00:00.000Z' } as never,
    ]);
    mockRefreshAssignments.mockReturnValue(
      new Promise((resolve) => { completeRefresh = resolve; }) as never,
    );

    const first = await renderHook(() => useFieldValidationAssignments());
    await waitFor(() => expect(first.result.current.refreshing).toBe(true));
    expect(first.result.current.ready).toBe(false);

    const second = await renderHook(() => useFieldValidationAssignments());
    expect(second.result.current.refreshing).toBe(true);
    expect(second.result.current.ready).toBe(false);
    await first.unmount();

    await act(() => {
      completeRefresh({ assignments: [], fetchedAt: Date.now() } as never);
    });
    await waitFor(() => expect(second.result.current.refreshing).toBe(false));
    expect(second.result.current.failed).toBe(false);
    expect(second.result.current.ready).toBe(true);
    expect(second.result.current.assignments).toEqual([]);
  });

  it('discards a refresh response when its owner is no longer the active session', async () => {
    const ownerId = 'd2d11aca-b612-4fd1-9f3c-70c7955f621e';
    let activeSession = true;
    let completeRefresh!: (value: never) => void;
    mockUseAuth.mockReturnValue({
      isSessionCurrent: () => activeSession,
      markSessionExpired,
      session: { ...READ_SESSION, user: { ...READ_SESSION.user, uuid: ownerId } },
      status: 'authenticated',
    } as never);
    mockListCached.mockResolvedValue([]);
    mockRefreshAssignments
      .mockResolvedValueOnce({ assignments: [], fetchedAt: Date.now() } as never)
      .mockReturnValueOnce(
        new Promise((resolve) => { completeRefresh = resolve; }) as never,
      );

    const { result } = await renderHook(() => useFieldValidationAssignments());
    await waitFor(() => expect(result.current.ready).toBe(true));
    await act(() => { void result.current.refresh({ force: true }); });
    await waitFor(() => expect(mockRefreshAssignments).toHaveBeenCalledTimes(2));
    activeSession = false;
    await act(() => {
      completeRefresh({ assignments: [{ id: ASSIGNMENT_ID }], fetchedAt: Date.now() } as never);
    });

    await waitFor(() => expect(result.current.refreshing).toBe(false));
    expect(result.current.ready).toBe(false);
    expect(result.current.assignments).toEqual([]);
  });

  it('revalidates a generation-zero snapshot after a stale session refresh', async () => {
    const ownerId = 'e2a37eb8-9d1c-4bcc-aab2-42837e8c0a31';
    const sessionA = {
      ...READ_SESSION,
      token: 'token-a',
      user: { ...READ_SESSION.user, uuid: ownerId },
    };
    const sessionB = {
      ...READ_SESSION,
      token: 'token-b',
      user: { ...READ_SESSION.user, uuid: ownerId },
    };
    let activeToken = sessionA.token;
    const isSessionCurrent = (token: string) => token === activeToken;
    let completeRefreshA!: (value: never) => void;
    const store = getOwnerMobileDataStore(DATABASE as never, ownerId);
    setOwnerAssignments(store, [{ id: ASSIGNMENT_ID } as never], Date.now());
    setOwnerAssignmentsReadState(store, {
      refreshing: false,
      failed: false,
      verified: true,
    });
    mockListCached.mockResolvedValue([
      { id: ASSIGNMENT_ID, cachedAt: CACHED_AT } as never,
    ]);
    mockUseAuth.mockImplementation(() => ({
      isSessionCurrent,
      markSessionExpired,
      session: activeToken === sessionA.token ? sessionA : sessionB,
      status: 'authenticated',
    }) as never);
    mockRefreshAssignments
      .mockReturnValueOnce(
        new Promise((resolve) => { completeRefreshA = resolve; }) as never,
      )
      .mockResolvedValueOnce({
        assignments: [{ id: 'server-assignment' }],
        fetchedAt: Date.now(),
      } as never);

    const first = await renderHook(() => useFieldValidationAssignments());
    expect(store.generation).toBe(0);
    await act(() => { void first.result.current.refresh({ force: true }); });
    await waitFor(() => expect(mockRefreshAssignments).toHaveBeenCalledTimes(1));
    await first.unmount();

    activeToken = sessionB.token;
    const second = await renderHook(() => useFieldValidationAssignments());
    expect(second.result.current.ready).toBe(true);
    expect(mockRefreshAssignments).toHaveBeenCalledTimes(1);

    await act(() => {
      completeRefreshA({ assignments: [], fetchedAt: Date.now() } as never);
    });
    await waitFor(() => expect(mockRefreshAssignments).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(second.result.current.assignments[0]?.id).toBe('server-assignment'),
    );
    expect(second.result.current.ready).toBe(true);
  });

  it('does not expire another active session after a stale auth failure', async () => {
    const ownerId = 'f76b1c6a-0a6b-4141-9d1e-0548c270b447';
    let activeSession = true;
    let rejectRefresh!: (error: unknown) => void;
    mockUseAuth.mockReturnValue({
      isSessionCurrent: () => activeSession,
      markSessionExpired,
      session: { ...READ_SESSION, user: { ...READ_SESSION.user, uuid: ownerId } },
      status: 'authenticated',
    } as never);
    mockListCached.mockResolvedValue([]);
    mockRefreshAssignments.mockReturnValue(
      new Promise((_, reject) => { rejectRefresh = reject; }) as never,
    );

    const { result } = await renderHook(() => useFieldValidationAssignments());
    await waitFor(() => expect(mockRefreshAssignments).toHaveBeenCalled());
    activeSession = false;
    await act(() => {
      rejectRefresh(new MobileFieldValidationAssignmentsApiError('AUTH_REQUIRED', 'Expired token'));
    });

    await waitFor(() => expect(result.current.refreshing).toBe(false));
    expect(markSessionExpired).not.toHaveBeenCalled();
  });

  it('shares the skipped-record count with later consumers through the owner snapshot', async () => {
    const ownerId = 'c4e8f2a4-3c47-4f6b-9a4e-0d5b8e7c1f22';
    mockUseAuth.mockReturnValue({
      isSessionCurrent: () => true,
      markSessionExpired,
      session: { ...READ_SESSION, user: { ...READ_SESSION.user, uuid: ownerId } },
      status: 'authenticated',
    } as never);
    mockRefreshAssignments.mockResolvedValue({
      assignments: [{ id: ASSIGNMENT_ID, cachedAt: CACHED_AT }],
      fetchedAt: new Date().toISOString(),
      skippedCount: 2,
    } as never);
    mockListCached.mockResolvedValue([
      { id: ASSIGNMENT_ID, cachedAt: '2026-01-01T00:00:00.000Z' } as never,
    ]);

    const first = await renderHook(() => useFieldValidationAssignments());
    await waitFor(() => expect(first.result.current.skippedCount).toBe(2));

    const second = await renderHook(() => useFieldValidationAssignments());
    await waitFor(() => expect(second.result.current.assignments).toHaveLength(1));
    expect(second.result.current.skippedCount).toBe(2);
    expect(mockRefreshAssignments).toHaveBeenCalledTimes(1);
  });
});
